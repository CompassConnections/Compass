import {Page} from '@playwright/test'

export type AuthObject = {
  idToken: string
  localId: string
}

export async function getAuthAccountInfo(page: Page): Promise<() => AuthObject> {
  let accountIdTokenAndLocalId: AuthObject | undefined

  await page.route('**/accounts:signInWithIdp**', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    accountIdTokenAndLocalId = {idToken: body.idToken, localId: body.localId}
    await route.fulfill({response})
  })

  return () => {
    if (!accountIdTokenAndLocalId) {
      console.log('Sign-in was never intercepted — test may have been skipped')
      return undefined as unknown as AuthObject
    }
    return accountIdTokenAndLocalId
  }
}
