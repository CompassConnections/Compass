import {hrtime} from 'node:process'

import {RecomputeAllResult} from 'common/api/types'
import {getOverallCompatibility, ScoredCompatibility} from 'common/profiles/compatibility-factors'
import {AnswerForScoring} from 'common/profiles/compatibility-score'
import {SCORING_PROFILE_COLUMNS, ScoringProfile} from 'common/profiles/compatibility-util'
import {OPTION_TABLES} from 'common/profiles/constants'
import {ProfileRow} from 'common/profiles/profile'
import {WANTS_KIDS_TOLERANCE} from 'common/wants-kids'
import {createSupabaseDirectClient} from 'shared/supabase/init'

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

type ScoreRow = ReturnType<typeof toRow>

/**
 * The rows as one array per column, so that any number of them travel as nine parameters and are
 * written with a single `unnest` — no parameter-count ceiling, no chunking.
 */
const toColumns = (rows: ScoreRow[]) => SCORE_COLUMNS.map((_, k) => rows.map((row) => row[k]))

/** The `unnest(...)` of {@link toColumns}, typed column by column; `$1` is the first array. */
const unnestSql = (firstParam: number) =>
  'unnest(' +
  ['text', 'text', 'real', 'real', 'real', 'int', 'real', 'real', 'real']
    .map((type, k) => `$${firstParam + k}::${type}[]`)
    .join(', ') +
  ')'

const UPSERT_SQL = `on conflict (user_id_1, user_id_2)
  do update set score             = excluded.score,
                score_low         = excluded.score_low,
                score_high        = excluded.score_high,
                shared_answers    = excluded.shared_answers,
                prompt_score      = excluded.prompt_score,
                prompt_score_low  = excluded.prompt_score_low,
                prompt_score_high = excluded.prompt_score_high`

// ---------------------------------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------------------------------

/** What one query hands the scorer: the scored columns, the answers and the option labels. */
type ScoringRow = ScoringProfile &
  Pick<ProfileRow, 'id' | 'user_id'> & {
    eligible: boolean
    answers: AnswerForScoring[]
    interests_names: string[]
    causes_names: string[]
    work_names: string[]
  }

/** Shown to other members at all: looking for matches, not banned, and with a photo. */
const eligibleSql = (p: string, u: string) =>
  `(${p}.looking_for_matches and not ${u}.is_banned_from_posting and ${p}.pinned_url is not null)`

/**
 * Everything the scorer reads about profile `p`, in one select list: the columns of
 * `SCORING_PROFILE_COLUMNS` (never `p.*` — the row is ~9 KB, more than half of it bio text and
 * search vectors nobody scores), the answers with only the columns the prompt score reads
 * (`explanation` is the one wide column on that row), and the option labels, each as an array.
 */
const SCORING_SELECT_SQL = [
  'p.id',
  'p.user_id',
  ...SCORING_PROFILE_COLUMNS.map((c) => `p.${c}`),
  `${eligibleSql('p', 'u')} as eligible`,
  `coalesce((select json_agg(json_build_object(
       'question_id', a.question_id, 'importance', a.importance,
       'pref_choices', a.pref_choices, 'multiple_choice', a.multiple_choice))
     from compatibility_answers a
     where a.creator_id = p.user_id), '[]') as answers`,
  ...OPTION_TABLES.map(
    (table) =>
      `array(select o.name
             from profile_${table} po
                      join ${table} o on o.id = po.option_id
             where po.profile_id = p.id) as ${table}_names`,
  ),
].join(',\n       ')

const SCORING_FROM_SQL = `from profiles p
         join users u on u.id = p.user_id`

/**
 * `isPreferredGender` in SQL: a blank preference or a blank gender passes (blank is null *or* the
 * empty string — the form stores '' for "not set", and `!gender` in TypeScript reads both the same);
 * a single "male" or "female" preference means exactly that; anything else also admits non-binary.
 */
const prefersSql = (prefs: string, gender: string) =>
  `case
     when coalesce(cardinality(${prefs}), 0) = 0 or coalesce(${gender}, '') = '' then true
     when cardinality(${prefs}) = 1 and ${prefs}[1] in ('male', 'female') then ${gender} = any (${prefs})
     else ${gender} = any (${prefs}) or ${gender} = 'non-binary'
   end`

// `coalesce`: `= any (null)` is null, and a null inside `not (... and ...)` would drop the row.
const seeksRelationshipSql = (x: string) =>
  `coalesce('relationship' = any (${x}.pref_relation_styles), false)`
const blankSql = (array: string) => `coalesce(cardinality(${array}), 0) = 0`

/**
 * `getDealbreakers` in SQL, for the pair (`a`, `b`): true when none fires. Each clause mirrors the
 * TypeScript rule, which still runs on every row this admits (it is the scorer's first step), so a
 * drift here can only ever cost a query some rows that the scorer then throws away — never a row
 * the scorer would have refused.
 */
const noDealbreakerSql = (a: string, b: string) => `
     -- gender: each is the other's preferred gender
     and ${prefersSql(`${a}.pref_gender`, `${b}.gender`)}
     and ${prefersSql(`${b}.pref_gender`, `${a}.gender`)}
     -- connection_type: a blank on either side passes, else the styles must overlap
     and (${blankSql(`${a}.pref_relation_styles`)} or ${blankSql(`${b}.pref_relation_styles`)}
          or ${a}.pref_relation_styles && ${b}.pref_relation_styles)
     -- monogamy: both seek a relationship, both stated a style, and the styles do not overlap
     and not (${seeksRelationshipSql(a)} and ${seeksRelationshipSql(b)}
              and not ${blankSql(`${a}.pref_romantic_styles`)}
              and not ${blankSql(`${b}.pref_romantic_styles`)}
              and not (${a}.pref_romantic_styles && ${b}.pref_romantic_styles))
     -- wants_kids: both seek a relationship, both answered, and the answers are too far apart
     and not (${seeksRelationshipSql(a)} and ${seeksRelationshipSql(b)}
              and coalesce(${a}.wants_kids_strength, -1) >= 0
              and coalesce(${b}.wants_kids_strength, -1) >= 0
              and abs(${a}.wants_kids_strength - ${b}.wants_kids_strength) > $(tolerance))`

// ---------------------------------------------------------------------------------------------------
// Per user
// ---------------------------------------------------------------------------------------------------

/**
 * Recompute the precomputed compatibility scores for this user against every other member.
 *
 * A row exists for a pair iff at least one side is eligible (`eligibleSql`) and no dealbreaker
 * fires (`getDealbreakers`). Prompt answers are not required: a pair who share none is scored on
 * their profiles alone, with the wide range that says so.
 *
 * One query reads everything: the member's own row and every other member who can share a row
 * with them — at least one side eligible, no dealbreaker — with the scored columns, the answers
 * and the option labels of each (`SCORING_SELECT_SQL`). The scoring then runs in memory, and one
 * statement writes the result: it deletes every row of this user's that was not just scored and
 * upserts the rest.
 *
 * The delete is what makes an edit that moves a pair *out* of the compatible set — switching
 * one's gender, or narrowing `pref_gender` — take effect: the other side is no longer returned by
 * the query, so an upsert alone would never have touched their old row, and it survived with a
 * score for a profile that no longer existed.
 */
export async function recomputeCompatibilityScoresForUser(userId: string) {
  const pg = createSupabaseDirectClient()
  const startTs = hrtime.bigint()

  const loaded = await pg.manyOrNone<ScoringRow>(
    `with me as (select p.user_id, p.gender, p.pref_gender, p.pref_relation_styles,
                        p.pref_romantic_styles, p.wants_kids_strength,
                        ${eligibleSql('p', 'u')} as eligible
                 ${SCORING_FROM_SQL}
                 where p.user_id = $(user_id))
     select ${SCORING_SELECT_SQL}
     ${SCORING_FROM_SQL},
          me
     where p.user_id = me.user_id
        or (p.user_id <> me.user_id
            and (me.eligible or ${eligibleSql('p', 'u')})
            ${noDealbreakerSql('me', 'p')})`,
    {user_id: userId, tolerance: WANTS_KIDS_TOLERANCE},
  )
  const me = loaded.find((p) => p.user_id === userId)
  if (!me) throw new Error(`Profile not found for user ${userId}`)
  const candidates = loaded.filter((p) => p.user_id !== userId)

  console.log(
    `Recomputing compatibility scores for user ${userId}, ${candidates.length} candidates.`,
  )

  const rows: ScoreRow[] = []
  for (const other of candidates) {
    const result = getOverallCompatibility(me, other, {
      answersA: me.answers,
      answersB: other.answers,
    })
    if (result.kind === 'dealbreaker') continue
    rows.push(toRow(userId, other.user_id, result))
  }

  const keptIds = rows.map(([u1, u2]) => (u1 === userId ? u2 : u1))
  await pg.none(
    `with dropped as (
       delete from compatibility_scores
       where (user_id_1 = $1 and user_id_2 <> all ($2))
          or (user_id_2 = $1 and user_id_1 <> all ($2)))
     insert into compatibility_scores (${SCORE_COLUMNS.join(', ')})
     select * from ${unnestSql(3)}
     ${UPSERT_SQL}`,
    [userId, keptIds, ...toColumns(rows)],
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

// ---------------------------------------------------------------------------------------------------
// Everyone
// ---------------------------------------------------------------------------------------------------

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
 * Not a loop over `recomputeCompatibilityScoresForUser`: that reads each member's candidates in
 * turn, so the whole corpus would be read once per member. Here every profile is read once, with
 * its answers and option labels, and every pair is scored in memory.
 *
 * The pair set is exactly what running the per-user function for everyone would produce — each pair
 * scored when at least one side is `looking_for_matches`, unbanned and has a photo — so this
 * function is a no-op when nothing has changed.
 *
 * Delete and insert share one transaction, so a failure leaves the old cache in place rather than an
 * empty table.
 */
export async function recomputeAllCompatibilityScores(): Promise<RecomputeAllResult> {
  const pg = createSupabaseDirectClient()
  const startTs = hrtime.bigint()

  const profiles = await pg.manyOrNone<ScoringRow>(
    `select ${SCORING_SELECT_SQL}
     ${SCORING_FROM_SQL}`,
  )

  const rows: ScoreRow[] = []

  // O(n²) over every profile, not only those with answers: a pair with no shared prompt is scored on
  // its profiles alone now.
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i]
      const b = profiles[j]
      // At least one side must be visible to the other, matching the union over per-user runs.
      if (!a.eligible && !b.eligible) continue

      // Gender incompatibility is the first dealbreaker, so this is also the old `areGenderCompatible`
      // gate.
      const result = getOverallCompatibility(a, b, {answersA: a.answers, answersB: b.answers})
      if (result.kind === 'dealbreaker') continue

      rows.push(toRow(a.user_id, b.user_id, result))
    }
  }

  const previousPairs = await pg.tx(async (tx) => {
    const before = await tx.one<{count: string}>('select count(*) from compatibility_scores')
    await tx.none('delete from compatibility_scores')
    // One `unnest` insert whatever the pair count: nine array parameters, no chunking. Written as a
    // plain insert rather than `bulkInsert` because that returns every row it wrote, and echoing back
    // a few hundred thousand pairs costs more than the write itself.
    await tx.none(
      `insert into compatibility_scores (${SCORE_COLUMNS.join(', ')})
       select * from ${unnestSql(1)}`,
      toColumns(rows),
    )
    return Number(before.count)
  })

  const seconds = Number(hrtime.bigint() - startTs) / 1e9
  console.log(
    `Rebuilt compatibility scores: ${rows.length} pairs over ${profiles.length} profiles (${seconds.toFixed(1)}s).`,
  )

  return {usersWithAnswers: profiles.length, pairs: rows.length, previousPairs, seconds}
}
