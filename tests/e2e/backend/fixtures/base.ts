import { test as base, APIRequestContext, request } from '@playwright/test';

export type TestOptions = {
    apiContextPage: APIRequestContext,
}

export const test = base.extend<TestOptions>({
    apiContextPage: async ({}, use) => {
        const apiContext = await request.newContext({
                baseURL: 'https://api.compassmeet.com'
            });
        await use(apiContext)
    },
})

export { expect } from "@playwright/test"