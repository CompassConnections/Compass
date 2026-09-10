import {hrtime} from 'node:process'

import {RecomputeAllResult} from 'common/api/types'
import {getCompatibilityScore, hasAnsweredQuestions} from 'common/profiles/compatibility-score'
import {areGenderCompatible} from 'common/profiles/compatibility-util'
import {ProfileRow} from 'common/profiles/profile'
import {Row} from 'common/supabase/utils'
import {groupBy} from 'lodash'
import {
  getAnswersForUser,
  getCompatibilityAnswers,
  getGenderCompatibleProfiles,
  getProfile,
} from 'shared/profiles/supabase'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

// Canonicalize pair ordering (user_id_1 < user_id_2 lexicographically)
function canonicalPair(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const)
}

// Recompute precomputed compatibility scores for this user
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

  // If the user has no answered questions, there's no valid score to keep for any pair
  // involving them — remove the rows rather than nulling them out, so a row's existence
  // always means "we have a valid score for this pair".
  if (!hasAnsweredQuestions(answersSelf)) {
    await pg.none(
      `delete from compatibility_scores
       where user_id_1 = $1
          or user_id_2 = $1`,
      [userId],
    )
    return
  }
  const profiles = await getGenderCompatibleProfiles(profile)
  const otherUserIds = profiles.map((l) => l.user_id)
  const profileAnswers = await getCompatibilityAnswers([userId, ...otherUserIds])
  const answersByUser = groupBy(profileAnswers, 'creator_id')

  console.log(
    `Recomputing compatibility scores for user ${userId}, ${otherUserIds.length} other users.`,
  )

  const rows = []

  for (const otherId of otherUserIds) {
    const answersOther = answersByUser[otherId] ?? []
    if (!hasAnsweredQuestions(answersOther)) continue

    const {score} = getCompatibilityScore(answersSelf, answersOther)
    const adaptedScore = score + (Math.random() - 0.5) * 0.001 // Add some noise to avoid ties (for profile sorting / pagination)

    const [u1, u2] = canonicalPair(userId, otherId)
    rows.push([u1, u2, adaptedScore])
  }

  if (rows.length === 0) return

  const values = rows.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')

  const flatParams = rows.flat()

  // Upsert scores for each pair
  await pg.none(
    `
        INSERT INTO compatibility_scores (user_id_1, user_id_2, score)
        VALUES
        ${values}
        ON CONFLICT (user_id_1, user_id_2)
        DO UPDATE SET score = EXCLUDED.score
    `,
    flatParams,
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
 * Answers only change through `set-compatibility-answer` and `delete-compatibility-answer`, which each
 * recompute the one user who acted — so the cache stays correct without this. Deleting a *prompt* is the
 * case it cannot cover: every answer to that prompt cascades away at once, which silently changes the
 * score of every pair who had answered it, and there is no single user to recompute. Hence a deliberate,
 * admin-triggered rebuild, run once after a batch of question changes rather than per deletion.
 *
 * Not a loop over `recomputeCompatibilityScoresForUser`: that reloads every candidate's answers for each
 * user in turn, so the whole corpus of answers would be read once per member. Here the profiles and the
 * answers are each read once and every pair is scored in memory.
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

  type GenderRow = Pick<ProfileRow, 'user_id' | 'gender' | 'pref_gender'> & {eligible: boolean}

  const profiles = await pg.manyOrNone<GenderRow>(
    `select p.user_id,
            p.gender,
            p.pref_gender,
            (p.looking_for_matches and not u.is_banned_from_posting and p.pinned_url is not null)
              as eligible
     from profiles p
              join users u on u.id = p.user_id`,
  )

  const answers = await pg.manyOrNone<Row<'compatibility_answers'>>(
    `select * from compatibility_answers`,
  )
  const answersByUser = groupBy(answers, 'creator_id')

  // Only profiles that would produce a score at all, so the O(n²) below runs over the smallest set
  // that can yield a row. `hasAnsweredQuestions` is the same gate the per-user path applies.
  const scorable = profiles.filter((p) => hasAnsweredQuestions(answersByUser[p.user_id] ?? []))

  const rows: {user_id_1: string; user_id_2: string; score: number}[] = []

  for (let i = 0; i < scorable.length; i++) {
    for (let j = i + 1; j < scorable.length; j++) {
      const a = scorable[i]
      const b = scorable[j]
      // At least one side must be visible to the other, matching the union over per-user runs.
      if (!a.eligible && !b.eligible) continue
      if (!areGenderCompatible(a, b)) continue

      const {score} = getCompatibilityScore(answersByUser[a.user_id], answersByUser[b.user_id])
      // Same tie-breaking noise the incremental path adds, so profile sorting and pagination stay
      // stable rather than reshuffling on every equal score.
      const adaptedScore = score + (Math.random() - 0.5) * 0.001

      const [u1, u2] = canonicalPair(a.user_id, b.user_id)
      rows.push({user_id_1: u1, user_id_2: u2, score: adaptedScore})
    }
  }

  const previousPairs = await pg.tx(async (tx) => {
    const before = await tx.one<{count: string}>('select count(*) from compatibility_scores')
    await tx.none('delete from compatibility_scores')
    // Chunked at 5000 pairs — 15000 parameters, comfortably inside the protocol's limit. Written as a
    // plain insert rather than `bulkInsert` because that returns every row it wrote, and echoing back
    // a few hundred thousand pairs costs more than the write itself.
    for (let i = 0; i < rows.length; i += 5000) {
      const chunk = rows.slice(i, i + 5000)
      const values = chunk.map((_, k) => `($${k * 3 + 1}, $${k * 3 + 2}, $${k * 3 + 3})`).join(', ')
      await tx.none(
        `insert into compatibility_scores (user_id_1, user_id_2, score) values ${values}`,
        chunk.flatMap((r) => [r.user_id_1, r.user_id_2, r.score]),
      )
    }
    return Number(before.count)
  })

  const seconds = Number(hrtime.bigint() - startTs) / 1e9
  console.log(
    `Rebuilt compatibility scores: ${rows.length} pairs over ${scorable.length} users (${seconds.toFixed(1)}s).`,
  )

  return {usersWithAnswers: scorable.length, pairs: rows.length, previousPairs, seconds}
}
