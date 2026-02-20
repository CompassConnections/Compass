import {APIRequestContext, request, test as base} from '@playwright/test'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export type TestOptions = {
  backendPage: {
    api: APIRequestContext
    db: any
  }
}

export const test = base.extend<TestOptions>({
  backendPage: async (_, use) => {
    const apiContext = await request.newContext({
      baseURL: 'https://api.compassmeet.com',
    })

    const helpers = {
      api: apiContext,
      db: createSupabaseDirectClient(),
    }
    await use(helpers)
    await apiContext.dispose()
  },
})

export {expect} from '@playwright/test'
