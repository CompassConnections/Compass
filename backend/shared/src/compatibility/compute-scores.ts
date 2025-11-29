import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {getCompatibilityScore, hasAnsweredQuestions} from 'common/profiles/compatibility-score'
import {
  getAnswersForUser,
  getCompatibilityAnswers,
  getGenderCompatibleProfiles,
  getProfile
} from "shared/profiles/supabase"
import {groupBy} from "lodash"
import {hrtime} from "node:process"

// Canonicalize pair ordering (user_id_1 < user_id_2 lexicographically)
function canonicalPair(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const
}

export async function recomputeCompatibilityScoresForUser(
  userId: string,
  client?: SupabaseDirectClient,
) {
  const pg = client ?? createSupabaseDirectClient()
  const startTs = hrtime.bigint()

  const profile = await getProfile(userId)
  if (!profile) throw new Error(`Profile not found for user ${userId}`)

  // Load all answers for the target user
  const answersSelf = await getAnswersForUser(userId);

  // If the user has no answered questions, set the score to null
  if (!hasAnsweredQuestions(answersSelf)) {
    await pg.none(
      `update compatibility_scores
       set score = null
       where user_id_1 = $1
          or user_id_2 = $1`,
      [userId]
    )
    return
  }
  let profiles = await getGenderCompatibleProfiles(profile)
  const otherUserIds = profiles.map((l) => l.user_id)
  const profileAnswers = await getCompatibilityAnswers([userId, ...otherUserIds])
  const answersByUser = groupBy(profileAnswers, 'creator_id')

  console.log(`Recomputing compatibility scores for user ${userId}, ${otherUserIds.length} other users.`)

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

  const values = rows
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
    .join(", ");

  const flatParams = rows.flat();

  // Upsert scores for each pair
  await pg.none(
    `
        INSERT INTO compatibility_scores (user_id_1, user_id_2, score)
        VALUES
        ${values}
        ON CONFLICT (user_id_1, user_id_2)
        DO UPDATE SET score = EXCLUDED.score
    `,
    flatParams
  );

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
