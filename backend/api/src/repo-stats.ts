import {githubRepoSlug} from 'common/constants'
import {RepoStats} from 'common/stats'
import {HOUR_MS} from 'common/util/time'
import {log} from 'shared/monitoring/log'

import {APIHandler} from './helpers/endpoint'

// Cached far longer than `stats`: this is an outbound call to a third party, the numbers move slowly,
// and unauthenticated GitHub allows only 60 requests/hour per IP. One call per 6h leaves that budget
// almost untouched even with several API instances running.
const CACHE_DURATION_MS = 6 * HOUR_MS

// Counting contributors by list length rather than paginating the whole set. The repo is well under
// this, and the alternative (parsing the Link header for the last page) buys accuracy we do not need.
const CONTRIBUTOR_PAGE_SIZE = 100

let cachedData: RepoStats | null = null
let cacheTimestamp = 0

const EMPTY: RepoStats = {
  stars: null,
  forks: null,
  contributors: null,
  openIssues: null,
  lastCommitTime: null,
}

async function github(path: string) {
  const res = await fetch(`https://api.github.com/repos/${githubRepoSlug}${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      // GitHub rejects requests without one.
      'user-agent': 'compass-api',
    },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText} for ${path}`)
  return res.json()
}

export const repoStats: APIHandler<'repo-stats'> = async () => {
  const now = Date.now()
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) return cachedData

  const [repo, contributors, commits] = await Promise.allSettled([
    github(''),
    github(`/contributors?per_page=${CONTRIBUTOR_PAGE_SIZE}&anon=1`),
    github('/commits?per_page=1'),
  ])

  // Settled individually so one failing call does not blank the other two — each field independently
  // falls back to null, and the page just omits whatever is missing.
  const result: RepoStats = {
    stars: repo.status === 'fulfilled' ? (repo.value.stargazers_count ?? null) : null,
    forks: repo.status === 'fulfilled' ? (repo.value.forks_count ?? null) : null,
    openIssues: repo.status === 'fulfilled' ? (repo.value.open_issues_count ?? null) : null,
    contributors:
      contributors.status === 'fulfilled' && Array.isArray(contributors.value)
        ? contributors.value.length
        : null,
    lastCommitTime:
      commits.status === 'fulfilled' && commits.value?.[0]?.commit?.committer?.date
        ? new Date(commits.value[0].commit.committer.date)
        : null,
  }

  const failures = [repo, contributors, commits].filter((r) => r.status === 'rejected')
  if (failures.length) {
    log.error('repo-stats: some GitHub calls failed', {
      reasons: failures.map((f) => String((f as PromiseRejectedResult).reason)),
    })
  }

  // Never cache a wholly empty result — that would pin the page to "nothing" for six hours because
  // GitHub happened to be down for one request.
  const gotSomething = Object.values(result).some((v) => v !== null)
  if (!gotSomething) return EMPTY

  cachedData = result
  cacheTimestamp = now
  return result
}
