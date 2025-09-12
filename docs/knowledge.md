# Project Knowledge

> [!WARNING]  
> TODO: This document is a work in progress. Please help us improve it by contributing!

## Development Workflow

- Current progress in [TODO.md](TODO.md)
- Global packages should be installed with `bun`, not npm or yarn.

## Project Structure

- next.js react tailwind frontend `/web`
  - broken down into pages, components, hooks, lib
- express node api server `/backend/api`
- one off scripts, like migrations `/backend/scripts`
- supabase postgres. schema in `/backend/supabase`
  - supabase-generated types in `/backend/supabase/schema.ts`
- files shared between backend directories `/backend/shared`
  - anything in `/backend` can import from `shared`, but not vice versa
- files shared between the frontend and backend in `/common`
  - `/common` has lots of type definitions for our data structures, like User. It also contains many useful utility functions. We try not to add package dependencies to common. `/web` and `/backend` are allowed to import from `/common`, but not vice versa.

## Deployment

- The project has both dev and prod environments.
- Backend is on GCP (Google Cloud Platform). Deployment handled by terraform.
- Project ID is `compass-130ba`.

## Code Guidelines

---

Here's an example component from web in our style:

```tsx
import clsx from 'clsx'
import Link from 'next/link'

import { isAdminId, isModId } from 'common/envs/constants'
import { type Headline } from 'common/news'
import { EditNewsButton } from 'web/components/news/edit-news-button'
import { Carousel } from 'web/components/widgets/carousel'
import { useUser } from 'web/hooks/use-user'
import { track } from 'web/lib/service/analytics'
import { DashboardEndpoints } from 'web/components/dashboard/dashboard-page'
import { removeEmojis } from 'common/util/string'

export function HeadlineTabs(props: {
  headlines: Headline[]
  currentSlug: string
  endpoint: DashboardEndpoints
  hideEmoji?: boolean
  notSticky?: boolean
  className?: string
}) {
  const { headlines, endpoint, currentSlug, hideEmoji, notSticky, className } =
    props
  const user = useUser()

  return (
    <div
      className={clsx(
        className,
        'bg-canvas-50 w-full',
        !notSticky && 'sticky top-0 z-50'
      )}
    >
      <Carousel labelsParentClassName="gap-px">
        {headlines.map(({ id, slug, title }) => (
          <Tab
            key={id}
            label={hideEmoji ? removeEmojis(title) : title}
            href={`/${endpoint}/${slug}`}
            active={slug === currentSlug}
          />
        ))}
        {user && <Tab label="More" href="/dashboard" />}
        {user && (isAdminId(user.id) || isModId(user.id)) && (
          <EditNewsButton endpoint={endpoint} defaultDashboards={headlines} />
        )}
      </Carousel>
    </div>
  )
}
```

---

We prefer to have many smaller components that each represent one logical unit, rather than one very large component that does everything. Then we compose and reuse the components.

It's best to export the main component at the top of the file. We also try to name the component the same as the file name (headline-tabs.tsx) so that it's easy to find.

Here's another example in `home.tsx` that calls our api. We have an endpoint called 'headlines', which is being cached by NextJS:

```ts
import { api } from 'web/lib/api/api'
// More imports...

export async function getStaticProps() {
  try {
    const headlines = await api('headlines', {})
    return {
      props: {
        headlines,
        revalidate: 30 * 60, // 30 minutes
      },
    }
  } catch (err) {
    return { props: { headlines: [] }, revalidate: 60 }
  }
}

export default function Home(props: { headlines: Headline[] }) { ... }
```

---

If we are calling the API on the client, prefer using the `useAPIGetter` hook:

```ts
export const YourTopicsSection = (props: {
  user: User
  className?: string
}) => {
  const { user, className } = props
  const { data, refresh } = useAPIGetter('get-followed-groups', {
    userId: user.id,
  })
  const followedGroups = data?.groups ?? []
  ...
```

This stores the result in memory, and allows you to call refresh() to get an updated version.

---

We frequently use `usePersistentInMemoryState` or `usePersistentLocalState` as an alternative to `useState`. These cache data. Most of the time you want in-memory caching so that navigating back to a page will preserve the same state and appear to load instantly.

Here's the definition of usePersistentInMemoryState:

```ts
export const usePersistentInMemoryState = <T>(initialValue: T, key: string) => {
  const [state, setState] = useStateCheckEquality<T>(
    safeJsonParse(store[key]) ?? initialValue
  )

  useEffect(() => {
    const storedValue = safeJsonParse(store[key]) ?? initialValue
    setState(storedValue as T)
  }, [key])

  const saveState = useEvent((newState: T | ((prevState: T) => T)) => {
    setState((prevState) => {
      const updatedState = isFunction(newState) ? newState(prevState) : newState
      store[key] = JSON.stringify(updatedState)
      return updatedState
    })
  })

  return [state, saveState] as const
}
```

---

For live updates, we use websockets. In `use-api-subscription.ts`, we have this hook:

```ts
export function useApiSubscription(opts: SubscriptionOptions) {
  useEffect(() => {
    const ws = client
    if (ws != null) {
      if (opts.enabled ?? true) {
        ws.subscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        return () => {
          ws.unsubscribe(opts.topics, opts.onBroadcast).catch(opts.onError)
        }
      }
    }
  }, [opts.enabled, JSON.stringify(opts.topics)])
}
```

In `use-bets`, we have this hook to get live updates with useApiSubscription:

```ts
export const useContractBets = (
  contractId: string,
  opts?: APIParams<'bets'> & { enabled?: boolean }
) => {
  const { enabled = true, ...apiOptions } = {
    contractId,
    ...opts,
  }
  const optionsKey = JSON.stringify(apiOptions)

  const [newBets, setNewBets] = usePersistentInMemoryState<Bet[]>(
    [],
    `${optionsKey}-bets`
  )

  const addBets = (bets: Bet[]) => {
    setNewBets((currentBets) => {
      const uniqueBets = sortBy(
        uniqBy([...currentBets, ...bets], 'id'),
        'createdTime'
      )
      return uniqueBets.filter((b) => !betShouldBeFiltered(b, apiOptions))
    })
  }

  const isPageVisible = useIsPageVisible()

  useEffect(() => {
    if (isPageVisible && enabled) {
      api('bets', apiOptions).then(addBets)
    }
  }, [optionsKey, enabled, isPageVisible])

  useApiSubscription({
    topics: [`contract/${contractId}/new-bet`],
    onBroadcast: (msg) => {
      addBets(msg.data.bets as Bet[])
    },
    enabled,
  })

  return newBets
}
```

---

Here are all the topics we broadcast, from `backend/shared/src/websockets/helpers.ts`

```ts
export function broadcastUpdatedPrivateUser(userId: string) {
  // don't send private user info because it's private and anyone can listen
  broadcast(`private-user/${userId}`, {})
}

export function broadcastUpdatedUser(user: Partial<User> & { id: string }) {
  broadcast(`user/${user.id}`, { user })
}

export function broadcastUpdatedComment(comment: Comment) {
  broadcast(`user/${comment.onUserId}/comment`, { comment })
}
```

---

We have our scripts in the directory `/backend/scripts`.

To write a script, run it inside the helper function called `runScript` that automatically fetches any secret keys and loads them into process.env.

Example from `/backend/scripts/manicode.ts`

```ts
import { runScript } from 'run-script'

runScript(async ({ pg }) => {
  const userPrompt = process.argv[2]
  // E.g.:
  // I want to create a new page which shows off what's happening right now. Can you use our websocket api to get recent bets on markets and illustrate what's happening in a compelling and useful way?
  if (!userPrompt) {
    console.log('Please provide a prompt on what code to change.')
    return
  }

  await manicode(pg, userPrompt)
})
```

Generally scripts should be run by me, especially if they modify backend state or schema.
But if you need to run a script, you can use `bun`. For example:

```sh
bun run manicode.ts "Generate a page called cowp, which has cows that make noises!"
```

if that doesn't work, try

```sh
bun x ts-node manicode.ts "Generate a page called cowp, which has cows that make noises!"
```

---

Our backend is mostly a set of endpoints. We create new endpoints by adding to the schema in `/common/src/api/schema.ts`.

E.g. Here is a hypothetical bet schema:

```ts
  bet: {
    method: 'POST',
    authed: true,
    returns: {} as CandidateBet & { betId: string },
    props: z
      .object({
        contractId: z.string(),
        amount: z.number().gte(1),
        replyToCommentId: z.string().optional(),
        limitProb: z.number().gte(0.01).lte(0.99).optional(),
        expiresAt: z.number().optional(),
        // Used for binary and new multiple choice contracts (cpmm-multi-1).
        outcome: z.enum(['YES', 'NO']).default('YES'),
        //Multi
        answerId: z.string().optional(),
        dryRun: z.boolean().optional(),
      })
      .strict(),
  }
```

Then, we define the bet endpoint in `backend/api/src/place-bet.ts`

```ts
export const placeBet: APIHandler<'bet'> = async (props, auth) => {
  const isApi = auth.creds.kind === 'key'
  return await betsQueue.enqueueFn(
    () => placeBetMain(props, auth.uid, isApi),
    [props.contractId, auth.uid]
  )
}
```

And finally, you need to register the handler in `backend/api/src/routes.ts`

```ts
import { placeBet } from './place-bet'
...

const handlers = {
  bet: placeBet,
  ...
}
```

---

We have two ways to access our postgres database.

```ts
import { db } from 'web/lib/supabase/db'

db.from('lovers').select('*').eq('user_id', userId)
```

and

```ts
import { createSupabaseDirectClient } from 'shared/supabase/init'

const pg = createSupabaseDirectClient()
pg.oneOrNone<Row<'lovers'>>('select * from lovers where user_id = $1', [userId])
```

The supabase client just uses the supabase client library, which is a wrapper around postgREST. It allows us to query and update the database directly from the frontend.

`createSupabaseDirectClient` is used on the backend. it lets us specify sql strings to run directly on our database, using the pg-promise library. The client (code in web) does not have permission to do this.

Another example using the direct client:

```ts
export const getUniqueBettorIds = async (
  contractId: string,
  pg: SupabaseDirectClient
) => {
  const res = await pg.manyOrNone(
    'select distinct user_id from contract_bets where contract_id = $1',
    [contractId]
  )
  return res.map((r) => r.user_id as string)
}
```

(you may notice we write sql in lowercase)

We have a few helper functions for updating and inserting data into the database.

```ts
import {
  buikInsert,
  bulkUpdate,
  bulkUpdateData,
  bulkUpsert,
  insert,
  update,
  updateData,
} from 'shared/supabase/utils'

...

const pg = createSupabaseDirectClient()

// you are encouraged to use tryCatch for these
const { data, error } = await tryCatch(
  insert(pg, 'lovers', { user_id: auth.uid, ...body })
)

if (error) throw APIError(500, 'Error creating lover: ' + error.message)

await update(pg, 'lovers', 'user_id', { user_id: auth.uid, age: 99 })

await updateData(pg, 'private_users', { id: userId, notifications: { ... } })
```

The sqlBuilder from `shared/supabase/sql-builder.ts` can be used to construct SQL queries with re-useable parts. All it does is sanitize and output sql query strings. It has several helper functions including:

- `select`: Specifies the columns to select
- `from`: Specifies the table to query
- `where`: Adds WHERE clauses
- `orderBy`: Specifies the order of results
- `limit`: Limits the number of results
- `renderSql`: Combines all parts into a final SQL string

Example usage:

```typescript
const query = renderSql(
  select('distinct user_id'),
  from('contract_bets'),
  where('contract_id = ${id}', { id }),
  orderBy('created_time desc'),
  limitValue != null && limit(limitValue)
)

const res = await pg.manyOrNone(query)
```

Use these functions instead of string concatenation.

### Misc coding tips

We have many useful hooks that should be reused rather than rewriting them again.

---

We prefer using lodash functions instead of reimplementing them with for loops:

```ts
import { keyBy, uniq } from 'lodash'

const betsByUserId = keyBy(bets, 'userId')
const betIds = uniq(bets, (b) => b.id)
```

---

Instead of Sets, consider using lodash's uniq function:

```ts
const betIds = uniq([])
for (const id of betIds) {
  ...
}
```
