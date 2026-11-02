import {hrtime} from 'node:process'

import {RecomputeAllResult} from 'common/api/types'
import {
  getOverallCompatibility,
  ProfileForScoring,
  ScoredCompatibility,
} from 'common/profiles/compatibility-factors'
import {ProfileRow} from 'common/profiles/profile'
import {Row} from 'common/supabase/utils'
import {groupBy} from 'lodash'
import {
  getAnswersForUser,
  getCompatibilityAnswers,
  getGenderCompatibleProfiles,
  getOptionNamesByProfileId,
  getProfile,
  ProfileOptionNames,
} from 'shared/profiles/supabase'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

// Canonicalize pair ordering (user_id_1 < user_id_2 lexicographically)
function canonicalPair(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const)
}

const SCORE_COLUMNS = [
  'user_id_1',
  'user_id_2',
  'score',
  'score_low',
  'score_high',
  'shared_answers',
  'prompt_score',
  'prompt_score_low',
  'prompt_score_high',
] as const

/** One stored row, in `SCORE_COLUMNS` order, with the tie-breaking noise on the overall only. */
const toRow = (userA: string, userB: string, result: ScoredCompatibility) => {
  const [u1, u2] = canonicalPair(userA, userB)
  // Add some noise to avoid ties (for profile sorting / pagination). The range edges get none.
  const adaptedScore = result.score + (Math.random() - 0.5) * 0.001
  return [
    u1,
    u2,
    adaptedScore,
    result.low,
    result.high,
    result.sharedAnswers,
    result.prompt?.score ?? null,
    result.prompt?.low ?? null,
    result.prompt?.high ?? null,
  ] as const
}

const valuesPlaceholders = (rowCount: number) => {
  const n = SCORE_COLUMNS.length
  return Array.from(
    {length: rowCount},
    (_, i) => `(${Array.from({length: n}, (_, k) => `$${i * n + k + 1}`).join(', ')})`,
  ).join(', ')
}

const withOptionNames = (
  profile: ProfileRow,
  names: Record<number, ProfileOptionNames>,
): ProfileForScoring => ({
  ...profile,
  ...(names[profile.id] ?? {interests_names: [], causes_names: [], work_names: []}),
})

/**
 * Recompute the precomputed compatibility scores for this user against every candidate.
 *
 * A row exists for a pair iff they are gender-compatible, at least one side is visible to the other
 * (`getGenderCompatibleProfiles`), and no dealbreaker fires (`getDealbreakers`). Prompt answers are no
 * longer required: a pair who share none is scored on their profiles alone, with the wide range that
 * says so. Pairs that a dealbreaker now excludes lose their row, so "row exists" keeps meaning "we
 * have a valid score for this pair".
 */
export async function recomputeCompatibilityScoresForUser(
  userId: string,
  client?: SupabaseDirectClient,
) {
  const pg = client ?? createSupabaseDirectClient()
  const startTs = hrtime.bigint()

  const profile = await getProfile(userId)
  if (!profile) throw new Error(`Profile not found for user ${userId}`)

  // Load all answers for the target user
  const answersSelf = await getAnswersForUser(userId)

  const profiles = await getGenderCompatibleProfiles(profile)
  const otherUserIds = profiles.map((l) => l.user_id)
  const profileAnswers = await getCompatibilityAnswers([userId, ...otherUserIds])
  const answersByUser = groupBy(profileAnswers, 'creator_id')
  const optionNames = await getOptionNamesByProfileId(
    [profile.id, ...profiles.map((p) => p.id)],
    pg,
  )
  const self = withOptionNames(profile, optionNames)

  console.log(
    `Recomputing compatibility scores for user ${userId}, ${otherUserIds.length} other users.`,
  )

  const rows = []
  const dealbroken: string[] = []

  for (const other of profiles) {
    const result = getOverallCompatibility(self, withOptionNames(other, optionNames), {
      answersA: answersSelf,
      answersB: answersByUser[other.user_id] ?? [],
    })
    if (result.kind === 'dealbreaker') {
      dealbroken.push(other.user_id)
      continue
    }
    rows.push(toRow(userId, other.user_id, result))
  }

  if (dealbroken.length) {
    await pg.none(
      `delete from compatibility_scores
       where (user_id_1 = $1 and user_id_2 = any ($2))
          or (user_id_2 = $1 and user_id_1 = any ($2))`,
      [userId, dealbroken],
    )
  }

  if (rows.length === 0) return rows

  // Upsert scores for each pair
  await pg.none(
    `
        INSERT INTO compatibility_scores (${SCORE_COLUMNS.join(', ')})
        VALUES
        ${valuesPlaceholders(rows.length)}
        ON CONFLICT (user_id_1, user_id_2)
        DO UPDATE SET score = EXCLUDED.score,
                      score_low = EXCLUDED.score_low,
                      score_high = EXCLUDED.score_high,
                      shared_answers = EXCLUDED.shared_answers,
                      prompt_score = EXCLUDED.prompt_score,
                      prompt_score_low = EXCLUDED.prompt_score_low,
                      prompt_score_high = EXCLUDED.prompt_score_high
    `,
    rows.flat(),
  )

  //
  // for (const otherId of otherUserIds) {
  //   const answersOther = answersByUser[otherId] ?? []
  //   if (!hasAnsweredQuestions(answersOther)) continue
  //
  //   const {score} = getCompatibilityScore(answersSelf, answersOther)
  //   const [u1, u2] = canonicalPair(userId, otherId)
  //   await pg.none(
  //     `insert into compatibility_scores (user_id_1, user_id_2, score)
  //      values ($1, $2, $3)
  //      on conflict (user_id_1, user_id_2)
  //          do update set score = excluded.score`,
  //     [u1, u2, adaptedScore]
  //   )
  // }

  const dt = Number(hrtime.bigint() - startTs) / 1e9
  console.log(`Done recomputing compatibility scores for user ${userId} (${dt.toFixed(1)}s).`)

  return rows
}

// Update community importance counts for the question
export async function updateCompatibilityPromptsMetrics(questionId: number) {
  const pg = createSupabaseDirectClient()
  await pg.oneOrNone('SELECT update_compatibility_prompt_community_importance_score($1)', [
    questionId,
  ])
}

/**
 * Rebuild `compatibility_scores` for every pair, in one pass.
 *
 * Answers change through `set-compatibility-answer` and `delete-compatibility-answer`, and profiles
 * through `update-profile` and `update-options`; each recomputes the one user who acted, so the cache
 * stays correct without this. Deleting a *prompt* is the case it cannot cover: every answer to that
 * prompt cascades away at once, which silently changes the score of every pair who had answered it,
 * and there is no single user to recompute. Hence a deliberate, admin-triggered rebuild, run once
 * after a batch of question changes rather than per deletion — and once after a change to the factor
 * weights, which likewise moves every pair.
 *
 * Not a loop over `recomputeCompatibilityScoresForUser`: that reloads every candidate's answers for each
 * user in turn, so the whole corpus of answers would be read once per member. Here the profiles, the
 * answers and the option labels are each read once and every pair is scored in memory.
 *
 * The pair set deliberately reproduces what running the per-user function for everyone would produce —
 * each profile scored against the profiles that are `looking_for_matches`, unbanned and have a photo —
 * rather than restricting both sides to that set. Narrowing it here would delete rows the incremental
 * path keeps, which is a policy change, and this function's whole job is to be a no-op when nothing has
 * changed.
 *
 * Delete and insert share one transaction, so a failure leaves the old cache in place rather than an
 * empty table.
 */
export async function recomputeAllCompatibilityScores(): Promise<RecomputeAllResult> {
  const pg = createSupabaseDirectClient()
  const startTs = hrtime.bigint()

  type EligibleRow = ProfileRow & {eligible: boolean}

  // Every column, not just the gender ones: the factors read most of the profile.
  const profiles = await pg.manyOrNone<EligibleRow>(
    `select p.*,
            (p.looking_for_matches and not u.is_banned_from_posting and p.pinned_url is not null)
              as eligible
     from profiles p
              join users u on u.id = p.user_id`,
  )

  const answers = await pg.manyOrNone<Row<'compatibility_answers'>>(
    `select * from compatibility_answers`,
  )
  const answersByUser = groupBy(answers, 'creator_id')
  const optionNames = await getOptionNamesByProfileId(undefined, pg)
  const scorable = profiles.map((p) => ({
    ...withOptionNames(p, optionNames),
    eligible: p.eligible,
  }))

  const rows: ReturnType<typeof toRow>[] = []

  // O(n²) over every profile, not only those with answers: a pair with no shared prompt is scored on
  // its profiles alone now.
  for (let i = 0; i < scorable.length; i++) {
    for (let j = i + 1; j < scorable.length; j++) {
      const a = scorable[i]
      const b = scorable[j]
      // At least one side must be visible to the other, matching the union over per-user runs.
      if (!a.eligible && !b.eligible) continue

      // Gender incompatibility is the first dealbreaker, so this is also the old `areGenderCompatible`
      // gate.
      const result = getOverallCompatibility(a, b, {
        answersA: answersByUser[a.user_id] ?? [],
        answersB: answersByUser[b.user_id] ?? [],
      })
      if (result.kind === 'dealbreaker') continue

      rows.push(toRow(a.user_id, b.user_id, result))
    }
  }

  const previousPairs = await pg.tx(async (tx) => {
    const before = await tx.one<{count: string}>('select count(*) from compatibility_scores')
    await tx.none('delete from compatibility_scores')
    // Chunked at 5000 pairs — 45000 parameters, comfortably inside the protocol's limit. Written as a
    // plain insert rather than `bulkInsert` because that returns every row it wrote, and echoing back
    // a few hundred thousand pairs costs more than the write itself.
    for (let i = 0; i < rows.length; i += 5000) {
      const chunk = rows.slice(i, i + 5000)
      await tx.none(
        `insert into compatibility_scores (${SCORE_COLUMNS.join(', ')}) values ${valuesPlaceholders(chunk.length)}`,
        chunk.flat(),
      )
    }
    return Number(before.count)
  })

  const seconds = Number(hrtime.bigint() - startTs) / 1e9
  console.log(
    `Rebuilt compatibility scores: ${rows.length} pairs over ${scorable.length} profiles (${seconds.toFixed(1)}s).`,
  )

  return {usersWithAnswers: scorable.length, pairs: rows.length, previousPairs, seconds}
}
