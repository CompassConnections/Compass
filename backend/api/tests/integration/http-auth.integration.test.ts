import {app} from 'api/app'
import {API} from 'common/api/schema'
import {pathWithPrefix} from 'common/api/utils'
import {Server} from 'http'
import {AddressInfo} from 'net'

import {getTestDb, resetDb, seedUser} from './helpers/db'

// Reached through an import of app.ts these tests never use, and Jest cannot parse its ESM dependencies.
jest.mock('jsdom', () => ({JSDOM: jest.fn()}))
jest.mock('firebase-admin', () => ({
  ...jest.requireActual('firebase-admin'),
  auth: jest.fn(() => ({
    // The token stands in for the error code Firebase would answer with.
    verifyIdToken: jest.fn((token: string) =>
      Promise.reject(Object.assign(new Error('Rejected'), {code: token})),
    ),
  })),
}))

let server: Server
const url = (path: string) =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}${pathWithPrefix(('/' + path) as any)}`

const send = (name: string, headers: Record<string, string> = {}) => {
  const {method} = (API as any)[name]
  return fetch(url(name.replace(/:\w+/g, 'x')), {
    method,
    headers: {'content-type': 'application/json', ...headers},
    ...(method === 'POST' ? {body: '{}'} : {}),
  })
}

const authedEndpoints = Object.entries(API)
  .filter(([, schema]) => schema.authed === true)
  .map(([name]) => name)

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
})
afterAll(() => new Promise((resolve) => server.close(() => resolve(undefined))))

describe('over HTTP', () => {
  it('finds authed endpoints to check', () => {
    expect(authedEndpoints.length).toBeGreaterThan(100)
  })

  it('refuses every authed endpoint without credentials', async () => {
    const open: string[] = []
    for (const name of authedEndpoints) {
      const {status} = await send(name)
      if (status !== 401) open.push(`${name}: ${status}`)
    }
    expect(open).toEqual([])
  })

  it('answers an unknown API key with 401', async () => {
    const {status} = await send('me', {authorization: 'Key nonsense'})
    expect(status).toBe(401)
  })

  it.each(['auth/id-token-expired', 'auth/id-token-revoked', 'auth/argument-error'])(
    'answers a token Firebase rejects with %s with 401',
    async (code) => {
      const {status} = await send('me', {authorization: `Bearer ${code}`})
      expect(status).toBe(401)
    },
  )

  // Not the token's fault, so the client should not be told it is.
  it('answers a failure inside Firebase with 500', async () => {
    const {status} = await send('me', {authorization: 'Bearer auth/internal-error'})
    expect(status).toBe(500)
  })

  it('accepts a member API key', async () => {
    await resetDb()
    await seedUser('member')
    await getTestDb().none(
      `update private_users set data = data || '{"apiKey": "member-key"}' where id = 'member'`,
    )
    const {status} = await send('me', {authorization: 'Key member-key'})
    expect(status).toBe(200)
  })
})
