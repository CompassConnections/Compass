import {APIHandler} from 'api/helpers/endpoint'
import {recomputeAllCompatibilityScores} from 'shared/compatibility/compute-scores'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'

/**
 * Rebuilds every cached pair score, from `/admin/compatibility-questions`.
 *
 * The counterpart to `delete-compatibility-prompt`, which leaves the cache stale on purpose. Run once
 * after a batch of question changes; running it when nothing has changed is a no-op that costs one pass
 * over the answers.
 *
 * Synchronous rather than fire-and-forget: this is a button an admin presses knowingly and then waits on,
 * and the counts it returns are the only confirmation that the rebuild covered what they expected. A
 * background job would hand back "started" and leave them guessing.
 */
export const recomputeAllCompatibilityScoresHandler: APIHandler<
  'recompute-all-compatibility-scores'
> = async (_props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  return await recomputeAllCompatibilityScores()
}
