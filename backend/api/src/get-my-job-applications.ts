import {type APIHandler} from 'api/helpers/endpoint'
import {JobApplication} from 'common/careers'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The caller's own applications, so `/careers` can show what they sent and let them change it.
 *
 * Takes no member id on purpose: an application carries pay expectations and is nobody else's to read.
 */
export const getMyJobApplications: APIHandler<'get-my-job-applications'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.manyOrNone<Omit<JobApplication, 'updatedTime'> & {updated_time: Date}>(
    `select position, about, plan, rate, availability, updated_time
     from job_applications
     where user_id = $1`,
    [auth.uid],
  )

  return {
    applications: rows.map(({updated_time, ...answers}) => ({
      ...answers,
      updatedTime: new Date(updated_time).toISOString(),
    })),
  }
}
