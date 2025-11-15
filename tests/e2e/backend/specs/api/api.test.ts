import { test, expect } from "../../fixtures/base";

test('Check API health', async ({backendPage}) => {
    const responseHealth = await backendPage.api.get('/health');
    expect(responseHealth.status()).toBe(200)

    // const responseBody = await responseHealth.json()
    // console.log(JSON.stringify(responseBody, null, 2));
    
});
