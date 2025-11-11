import { test, expect } from "../fixtures/base";

test('Check API health', async ({apiContextPage}) => {
    const responseHealth = await apiContextPage.get('/health');
    expect(responseHealth.status()).toBe(200)

    const responseBody = await responseHealth.json()
    console.log(JSON.stringify(responseBody, null, 2));
    
});

test.afterAll(async ({apiContextPage}) => {
    await apiContextPage?.dispose();
})
