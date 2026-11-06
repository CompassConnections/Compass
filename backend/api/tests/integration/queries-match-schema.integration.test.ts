import {uniq} from 'lodash'
import path from 'path'

import {getTestDb} from './helpers/db'
import {extractQueries, toPreparableSql} from './helpers/extract-queries'

const ROOT = path.resolve(__dirname, '../../../..')

// Postgres could not infer a placeholder's type, as in `$1 is null`. Safe to ignore: it reports a
// missing table or column first, so a query that gets this far has resolved against the schema.
const UNTYPED_PARAMETER_CODES = ['42P08', '42P18']

// A guard against the scan quietly finding nothing, say after a refactor of how queries are called.
const MIN_CHECKED_QUERIES = 200

// Queries known to be wrong, by file. See "Findings so far" in docs/test-coverage-plan.md.
const KNOWN_FAILURES = ['backend/shared/src/audit-events.ts']

/**
 * Catches a query naming a table, column or function that does not exist, or using one with the wrong
 * types, in every query whose text is in the source, whether or not any test runs it. It says nothing
 * about whether a query returns the right rows, and cannot see queries built at runtime.
 */
describe('queries in the source', () => {
  it('all resolve against the real schema', async () => {
    const {queries} = extractQueries(ROOT, [
      path.join(ROOT, 'backend/api/src'),
      path.join(ROOT, 'backend/shared/src'),
    ])

    const failures: {location: string; error: string}[] = []
    let checked = 0

    await getTestDb().task(async (t) => {
      for (const {location, sql} of queries) {
        const preparable = toPreparableSql(sql)
        if (preparable === null) continue
        checked++
        // `prepare` plans a statement without running it, so the inserts and deletes here do nothing.
        try {
          await t.none({text: `prepare checked_query as ${preparable}`})
          await t.none('deallocate checked_query')
        } catch (e: any) {
          if (!UNTYPED_PARAMETER_CODES.includes(e.code)) {
            failures.push({location, error: `${e.code} ${e.message}`})
          }
        }
      }
    })

    const fileOf = ({location}: {location: string}) => location.split(':')[0]
    const unexpected = failures.filter((failure) => !KNOWN_FAILURES.includes(fileOf(failure)))

    expect(checked).toBeGreaterThanOrEqual(MIN_CHECKED_QUERIES)
    expect(unexpected).toEqual([])
    // Once a known failure is fixed, this fails as the prompt to remove it from the list.
    expect(uniq(failures.map(fileOf))).toEqual(KNOWN_FAILURES)
  })
})
