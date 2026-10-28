# JMeter (Load) Testing Guide

Load tests check how the API holds up when many people use it at the same time. They measure response times,
throughput (requests per second) and error rate, so slowdowns and failures under load show up before real users find
them. They don't check that features work correctly; unit, integration and E2E tests do that (see
[testing.md](testing.md)).

Load tests use [Apache JMeter](https://jmeter.apache.org/). The test plan, `tests/load/compass-testPlan.jmx`, load
plays a typical browsing session against the API, with real, temporary accounts. Each run has three stages:

1. **Create** a set of temporary accounts.
2. **Load test:** all the accounts browse at the same time, for a set amount of time.
3. **Delete** the accounts again.

**In this guide:**

- [Prerequisites](#prerequisites), including [setups for Windows, WSL, Linux and macOS](#choose-your-setup)
- [JMeter basics](#jmeter-basics)
- [How the plan works](#how-the-plan-works) and [the test accounts](#the-test-accounts)
- [Running the test](#running-the-test): commands, stopping early, flags and properties
- [Element reference](#element-reference)
- [Adding a new test to this plan](#adding-a-new-test-to-this-plan)
- [Reading the results](#reading-the-results)
- [Automated runs](#automated-runs-github-actions): the smoke and weekly full tests in GitHub Actions
- [Troubleshooting](#troubleshooting)

Values in angle brackets are placeholders: `<API_HOST>` and `<FIREBASE_API_KEY>` are `apiHost` and `firebaseApiKey` in
the plan's User Defined Variables (the dev key is also in `common/src/envs/dev.ts`).

---

## Prerequisites

- **Java 8 or newer** (17+ recommended), installed on the system where JMeter runs.
- **[Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi)**, set up as described in
  [Choose your setup](#choose-your-setup).

The plan's files live in `tests/load/`: `compass-testPlan.jmx` (the test plan) and `check_results.py` (checks a
results file against limits, used by CI, see [check_results.py](#check_resultspy)).

A run creates these files next to the plan. They are git-ignored:

| File or folder         | What it is                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `created_accounts.txt` | The accounts that exist right now, passed between stages (see below)                    |
| `errors.xml`           | Details of failed requests                                                              |
| `jmeter.log`           | JMeter's own log, including the warnings the plan's scripts write                       |
| `results/`, `report/`  | The raw results of each run ([`.jtl` files](#reading-the-results)), and the HTML report |

### Choose your setup

The [commands](#commands) use short paths such as `results/smoke.jtl`, which only work when JMeter runs **inside
`tests/load/`** on the same system as the project. Check your setup with `jmeter --version` in the terminal you'll run
the commands from. Java must be installed on that same system; in WSL that means **in WSL** (use the full package, as
the `-headless` one can't show the GUI: `sudo apt install openjdk-21-jre`).

**Project and JMeter on the same system** (everything on Linux, on macOS, or on Windows without WSL): install JMeter
and add its `bin/` folder to your PATH. On Linux or macOS:

```bash
cd ~ && curl -LO https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz && tar -xzf apache-jmeter-5.6.3.tgz
echo 'export PATH="$HOME/apache-jmeter-5.6.3/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Project in WSL, JMeter installed in WSL** (recommended for WSL): run the same two commands in a WSL terminal. Putting
`bin/` at the **front** of the PATH means this JMeter wins over any on your Windows PATH; check with
`command -v jmeter`. The GUI opens as a normal Windows window through WSLg.

**Project in WSL, JMeter installed on Windows:** the JMeter download has a Linux launcher (`bin/jmeter`) as well as
`jmeter.bat`, so WSL can run it from `/mnt/c` with WSL's Java. Add the `bin/` folder to your WSL PATH, e.g.
`echo 'export PATH="$PATH:/mnt/c/tools/apache-jmeter-5.6.3/bin"' >> ~/.bashrc` (find the path with
`wslpath 'C:\tools\apache-jmeter-5.6.3'`). Start-up is about a second slower; a running test is just as fast. Open
the GUI on Windows with the plan's `\\wsl.localhost\…` path (`wslpath -w compass-testPlan.jmx` prints it).

> **Don't run the commands with `jmeter.bat` against a WSL folder.** `cmd.exe` can't use a `\\wsl.localhost\…` path as
> its working folder and switches to `C:\Windows`, so the short paths point to the wrong place.

**To open the plan in the GUI:** run `jmeter -t compass-testPlan.jmx` from `tests/load/`, or start JMeter and use
**File → Open** with the plan's full path.

---

## JMeter basics

A JMeter test plan is a **tree** of elements. Each element type has one job:

| Term                   | What it means                                                    | Example in this plan                     |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| **Thread group**       | A group of threads that all run the same steps                   | `1 - Create accounts`                    |
| **Thread**             | One simulated user. Each uses one test **account**               | One of the 100 threads in a thread group |
| **Sampler**            | Something a thread _does_, usually one request                   | `SETUP \| Firebase Signup POST`          |
| **Config element**     | Settings or data used by samplers                                | CSV Data Set Config, HTTP Header Manager |
| **Pre/Post-processor** | Runs before/after a sampler, e.g. to pull a value out of a reply | JSON Extractor                           |
| **Assertion**          | Checks a response and marks the request failed if it's wrong     | Response Assertion (code must be `200`)  |
| **Timer**              | Adds a pause before requests                                     | Think time                               |
| **Logic controller**   | Controls _how often_ or _whether_ its children run               | Runtime Controller, If Controller        |
| **Listener**           | Collects or shows results                                        | Simple Data Writer                       |

- **Variables** belong to **one thread** and are read with `${name}`. A variable a thread sets while it runs (like
  `authToken`) **doesn't carry over** to other thread groups. Variables in User Defined Variables are copied to every
  thread, which is why `${apiHost}` works everywhere.
- **Properties** are **global** to the run. Read them with `${__P(name,default)}`, set them with `-Jname=value`.
- **Scope:** an element applies to its parent and everything under it. A Header Manager under one request only affects
  that request.
- **Order for each request:** config elements → pre-processors → timers → the request → post-processors → assertions
  → listeners. So a post-processor can't see whether an assertion passed.

---

## How the plan works

```text
compass-testPlan.jmx
├── User Defined Variables          hosts, endpoints and the run ID
├── 0 - Check for leftover accounts (setUp)     stops the run from creating accounts if earlier ones remain
├── 1 - Create accounts             (setUp)     creates accounts, saves them to created_accounts.txt
├── 2 - Browsing session            (Thread Group)  the load test, reads created_accounts.txt
├── 3 - Delete accounts             (tearDown)  reads created_accounts.txt, deletes each account
├── 4 - Forget deleted accounts     (tearDown)  removes the deleted accounts from created_accounts.txt
└── Listeners                       Summary Report, Simple Data Writer, View Results Tree
```

The stages run one after another (**Run Thread Groups consecutively** is on). setUp groups run before the main test,
tearDown groups after it, and tearDown also runs after a [graceful shutdown](#stopping-a-run-early).

**0 - Check for leftover accounts** (setUp, 1 thread). After a run, `created_accounts.txt` only lists accounts that
couldn't be deleted. If it isn't empty, an earlier run was killed or failed to clean up. Emptying the file would lose
the only record of those accounts, so instead this stage fails with a message, and sets `setupThreads`, `threads` and
`sessionThreads` to 0: this run creates nothing and only deletes the leftovers. Run again afterwards. Skipped when
`checkLeftovers=0`.

**1 - Create accounts** (setUp, `setupThreads` threads, one account each):

1. **Make this thread's account** (JSR223 PreProcessor) sets the thread's email, random password, username and name
   (see [The test accounts](#the-test-accounts)).
2. `SETUP | Firebase Signup POST` creates the Firebase login. A JSON Extractor saves the token as `authToken`.
3. `SETUP | create-user-and-profile POST` creates the app user and profile.
4. **Save account for test and teardown** (JSR223 PostProcessor) appends `email|password|token|name|profileCreated`
   to `created_accounts.txt`. An account whose profile creation failed is still saved, since its Firebase login
   exists; `profileCreated=false` tells teardown how to delete it.

**2 - Browsing session** (`sessionThreads` threads). Each thread takes one line of `created_accounts.txt`, then a
Runtime Controller repeats a visit for `sessionDuration` seconds. A visit makes the calls the web app makes when someone
opens it and browses profiles:

1. `TEST | /me GET`: the signed-in user. Passes if the code is `200` **and** the returned `name` matches the account.
   Saves the account's `userId` and username for the requests below.
2. `TEST | get-profile GET (own)`, `TEST | set-last-online-time POST`, `TEST | get-notifications GET` (`limit=450`,
   as `use-notifications.ts` asks) and `TEST | compatible-profiles GET`: what loads in the background on every page.
3. `TEST | get-profiles GET (feed)`: the first page of the profile grid, as `profiles-home.tsx` asks for it (20 cards,
   ordered by compatibility with this account). Saves the usernames and the last profile's id.
4. `TEST | get-profile GET (feed profile)`, `profileViews` times (3 by default): opens a random profile from that page.
5. `TEST | get-profiles GET (next page)`, in half the visits (a Throughput Controller): scrolls to the next page with
   `after`.

Steps 2 to 5 are skipped when `/me` fails, and 4 and 5 when the feed is empty. **Think time** (a Uniform Random Timer)
pauses 2 to 5 seconds before each request, like a person reading. It also keeps each account under the API's rate
limit of 120 requests a minute per user (`API_RATE_LIMIT_PER_MIN_AUTHED`): with no pause, most rate-limited requests
would come back `429`.

**3 - Delete accounts** (tearDown, 1 thread, one loop per line of `created_accounts.txt`):

1. `TEARDOWN | Firebase Sign in POST` gets a fresh token (setUp's may have expired after 1 hour). If Firebase says the
   account doesn't exist, it is counted as already deleted and passes.
2. If the profile was created: `TEARDOWN | Delete app user` calls `/me/delete`, which deletes the app user, their
   files and their Firebase login. It sends the reason `jmeter-load-test`, stored in `deleted_users`.
3. If there is no profile, or `/me/delete` failed: `TEARDOWN | Firebase delete account` deletes the Firebase login
   directly, so it doesn't stay behind.

Each successful delete is remembered, and **4 - Forget deleted accounts** then rewrites `created_accounts.txt` with
only the accounts that couldn't be deleted. A warning in `jmeter.log` says how many remain.

## The test accounts

The API only accepts most requests from signed-in accounts, so each thread needs its own real account. The plan makes
them itself; there's no account file to maintain.

| Value    | Made as                           | Example                          |
| -------- | --------------------------------- | -------------------------------- |
| email    | `loadtest<runId>x<n>@example.com` | `loadtest28120940x1@example.com` |
| password | A random UUID                     |                                  |
| username | `loadUser<runId>x<n>`             | `loadUser28120940x1`             |
| name     | `Load Test <n>`                   | `Load Test 1`                    |

- `<n>` is the thread number. `<runId>` is the `runId` property, by default the day, hour, minute and second the run
  started (`ddHHmmss`). CI passes its own. A fresh ID every run means an overlapping run, or leftovers from an earlier
  one, can never cause `EMAIL_EXISTS` or a taken username.
- `example.com` is reserved for testing (RFC 2606) and can't receive mail. The API's `sendEmail` skips such addresses,
  so creating accounts sends no welcome emails (once the API with that check is deployed).
- Usernames are cut to 25 characters, and the API cleans names (no emoji or symbols, at most 30 characters, no staff
  words like "admin"). The `/me` request checks the name comes back unchanged, so keep both short and plain if you change
  the script.

---

## Running the test

Always run load tests from the command line (**non-GUI mode**, `-n`). The GUI uses far more CPU and memory, which can
make JMeter itself the bottleneck. Use the GUI only to build and debug the plan.

### Commands

Run these from `tests/load/`. The test runs against the **shared dev API and Firebase**, not your local stack.

**Smoke test** (1 thread, 10 seconds). Run it before every full run to check each step works. Firebase allows 100 new
accounts per hour from one IP address, so leave an hour between a smoke test and a full run if you're near that.

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/smoke.jtl -e -o report -Jthreads=1 -JsetupRamp=1 -Jramp=1 -Jduration=10
```

**Full run with HTML report** (the defaults: 100 threads, 120 seconds):

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -e -o report
```

**Report with only the load test requests** (hides setup and cleanup; in PowerShell use double quotes):

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -e -o report '-Jjmeter.reportgenerator.sample_filter=^TEST \|.*'
```

**Another environment.** An API only accepts tokens from its own Firebase project, so pass both:

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -JapiHost=<API_HOST> -JfirebaseApiKey=<FIREBASE_API_KEY>
```

> **PowerShell:** wrap any `-J` argument whose value contains a dot in double quotes, or PowerShell may split it.

**Cleanup only.** Deletes the accounts still listed in `created_accounts.txt`, without creating any. A normal run
already does this when it finds leftovers, so you only need it to clean up without starting a test:

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/cleanup.jtl -JcheckLeftovers=0 -Jthreads=0
```

**Rebuild a report** from an existing results file (the `report` folder must be empty or missing):

```bash
jmeter -g results/results.jtl -o report
```

### Stopping a run early

To stop a run **and still delete the accounts**, run `shutdown.sh` (`shutdown.cmd` on Windows) from another terminal of
the same kind. It's in JMeter's `bin/` folder. Type the full name: plain `shutdown` turns your computer off. In the GUI,
use **Run → Shutdown**.

**Ctrl+C**, `stoptest.sh` or **Run → Stop** stop straight away and cleanup **doesn't** run. The accounts stay listed in
`created_accounts.txt`, and the next run deletes them before doing anything else.

### Command flags

| Flag          | Meaning                                                                           |
| ------------- | --------------------------------------------------------------------------------- |
| `-n`          | Non-GUI mode                                                                      |
| `-t <file>`   | The test plan to run                                                              |
| `-l <file>`   | Where to save the raw results (`.jtl`). Without `-f`, it adds to an existing file |
| `-e -o <dir>` | After the run, build an HTML report into this folder (must be empty without `-f`) |
| `-f`          | Delete the old results file and report folder first                               |
| `-g <file>`   | Build a report from an existing `.jtl` without running a test                     |
| `-J<k>=<v>`   | Set a property the plan reads (see below)                                         |

### Properties

| Property          | Default              | What it controls                                                                |
| ----------------- | -------------------- | ------------------------------------------------------------------------------- |
| `threads`         | `100`                | Threads for account creation and every load test, unless overridden             |
| `ramp`            | `10`                 | Seconds to start all threads in each load test, unless overridden               |
| `duration`        | `120`                | Seconds each load test runs, unless overridden                                  |
| `setupThreads`    | `threads`            | Number of accounts to create                                                    |
| `setupRamp`       | `10`                 | Seconds to start all account-creation threads                                   |
| `sessionThreads`  | `threads`            | Threads in the browsing session                                                 |
| `sessionRamp`     | `ramp`               | Seconds to start all browsing session threads                                   |
| `sessionDuration` | `duration`           | Seconds the browsing session runs                                               |
| `profileViews`    | `3`                  | Feed profiles opened per visit                                                  |
| `thinkTimeMs`     | `2000`               | Shortest pause before each load test request, per thread                        |
| `thinkRandomMs`   | `3000`               | Random extra pause on top of `thinkTimeMs` (0 to this)                          |
| `apiHost`         | `<API_HOST>`         | API host to test against                                                        |
| `firebaseApiKey`  | `<FIREBASE_API_KEY>` | Firebase key for sign-up and sign-in. Must match `apiHost`'s environment        |
| `runId`           | start time           | Added to every email and username (see [The test accounts](#the-test-accounts)) |
| `checkLeftovers`  | `1`                  | `0` skips the leftover check                                                    |

**Specific settings override general ones:** `-Jthreads=50` sets everything to 50 threads; adding `-JsessionThreads=200`
changes only the browsing session. **Keep `setupThreads` at least as high as the largest load test**, since each load test
thread needs an account. **Ramp-up** is how long JMeter takes to start all threads; starting them all at once can
overload sign-in. **Lowering the think time** sends more load per account, but keep the average pause above
about 0.5 seconds, or the rate limit turns requests into `429`s.

---

## Element reference

To **add** an element in the GUI, right-click the element it should go under → **Add**. To turn one off, right-click →
**Disable**. Save with **Ctrl+S**.

| Element                         | How it's used here                                                                                                                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Plan**                   | **Run Thread Groups consecutively** on, so stages run in order. **Run tearDown Thread Groups after shutdown** on, so a graceful stop still cleans up.                                                                                                                                           |
| **Thread groups**               | Thread counts are properties with fallbacks, e.g. `${__P(setupThreads,${__P(threads,100)})}`, read when the group starts. A group with 0 threads is skipped. All groups **Continue** after a sampler error.                                                                                     |
| **User Defined Variables**      | `baseAuthUrl`, `apiHost`, `firebaseApiKey`, `runId`, and the Firebase endpoint paths (`signupUrl`, `signinUrl`, `deleteAccountUrl`; `getUserDataUrl` is unused). Wrap a value in `__P` to make it settable with `-J`.                                                                           |
| **CSV Data Set Config**         | Two, both reading `created_accounts.txt` with `\|` as the delimiter and the sharing mode _Current thread group_, so the load test and teardown each go through every account. **Stop thread on EOF** is on, **Recycle** off.                                                                    |
| **HTTP Request**                | One per step. Names start with `SETUP \|`, `TEST \|` or `TEARDOWN \|`, so stages are easy to tell apart and the report can filter. Server is `${baseAuthUrl}` or `${apiHost}`, without `https://`.                                                                                              |
| **HTTP Header Manager**         | Under each request: `Content-Type: application/json`, plus `Authorization: Bearer ${authToken}` where signed in.                                                                                                                                                                                |
| **JSON Extractor**              | Saves `$.idToken` from sign-up and teardown sign-in as `authToken`.                                                                                                                                                                                                                             |
| **JSR223 (Groovy)**             | The leftover check, account generation, saving accounts, the teardown sign-in check, remembering deletes and rewriting the file. Scripts use `vars`, `props`, `prev`, `log`, and find files next to the `.jmx` with `FileServer.getFileServer().getBaseDir()`. **Cache compiled script** is on. |
| **Response Assertion**          | On every request: response code must equal `200`.                                                                                                                                                                                                                                               |
| **JSON Assertion**              | On `TEST \| /me GET`: `$.name` must equal `${name}`, **not** as a regex (a `.` in a name would break it).                                                                                                                                                                                       |
| **If Controller**               | In the session, skip requests whose input is missing (`/me` failed, empty feed). In teardown, choose between `/me/delete` and the direct Firebase delete, using `signedIn` and `profileCreated`.                                                                                                |
| **Loop, Throughput Controller** | Open `profileViews` feed profiles per visit; load the next page in 50% of visits. A random feed profile is `${__V(feedUsername_${__Random(1,${feedUsername_matchNr})})}`.                                                                                                                       |
| **Runtime Controller**          | Repeats a visit for `${__P(sessionDuration,${__P(duration,120)})}` seconds.                                                                                                                                                                                                                     |
| **Uniform Random Timer**        | **Think time**: `${__P(thinkTimeMs,2000)}` ms plus a random 0 to `${__P(thinkRandomMs,3000)}` ms before each session request.                                                                                                                                                                   |
| **Listeners**                   | **Simple Data Writer** saves failed requests only to `errors.xml`, with response bodies but not request bodies (they hold passwords and tokens). **Summary Report** is GUI only. **View Results Tree** is disabled: great for debugging, too heavy for load runs.                               |
| **Debug Sampler**               | Disabled, at the end of `1 - Create accounts`. Enable it with View Results Tree to see a thread's variables in the GUI; disable both before a load run.                                                                                                                                         |

If you add a column to `created_accounts.txt`, add it to the `join` in **Save account for test and teardown** and to
the Variable Names of both CSV configs, in the same position.

---

## Adding a new test to this plan

New load tests reuse the accounts created by setUp and deleted by tearDown, so you only build the test itself.

1. Right-click `2 - Browsing session` → **Duplicate**, and drag the copy after the last load test. (To add a
   request to the session instead, put it inside the existing Runtime Controller with a `TEST |` name.)
2. Rename it `N - <new test name>` and pick a property prefix, e.g. `<newtest>`:
   - Number of Threads: `${__P(<newtest>Threads,${__P(threads,100)})}`
   - Ramp-up period: `${__P(<newtest>Ramp,${__P(ramp,10)})}`
   - Runtime Controller → Runtime: `${__P(<newtest>Duration,${__P(duration,120)})}`
3. Add `<newtest>Threads` to the list the leftover check sets to 0, in **SETUP | Check created_accounts.txt is empty**.
4. Keep `CSV - Created accounts` as it is.
5. Change the HTTP Request (name `TEST | <new request>`, method, path, body) and update the assertions so they check
   **this** response.
6. Make sure `setupThreads` covers the new test's thread count, then save and run a [smoke test](#commands).

Keep in mind: tests run one after another and share the same accounts, so total time is the sum of their durations.
Tokens expire after 1 hour; if tests together run longer, add a sign-in request (like the teardown one) at the start of
the new group. A test that changes account data (e.g. the name) affects later tests, so put it last.

---

## Reading the results

**The results file (`.jtl`)**, named with `-l`, has one CSV row per request, in every stage. The HTML report is built
from it. Useful columns: `elapsed` (response time in ms), `label`, `responseCode`, `success`, `failureMessage`,
`Latency`, `Connect` and `allThreads` (the load at that moment). Sort by `elapsed` for the slowest requests, or keep
files from several runs to compare them (`-f` overwrites a file with the same name). It holds no passwords or tokens.

**The HTML report:** in **Statistics**, check `#Samples` fits what you asked for (e.g. 100 sign-ups for 100 threads).
Failures in `SETUP |` rows mean less load than intended. _Average_ hides slow outliers, so look at the **90th/95th/99th
pct** columns.

**errors.xml** holds only failed requests, with the response body that shows why. It **adds to itself on every run**,
so delete it first if you only want one run's errors.

---

## Automated runs (GitHub Actions)

Two workflows run the plan, using the shared steps in `.github/workflows/load-test.yml`:

|             | Smoke test (`load-smoke-test.yml`)                                                                                 | Full test (`load-full-test.yml`)                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Runs when   | A PR into `main` changes `backend/api/`, `backend/shared/`, `common/src/api/`, `tests/load/` or the load workflows | Every Monday at 06:00 UTC                                             |
| Size        | 3 threads for 30 seconds                                                                                           | 100 threads for 120 seconds                                           |
| Passes when | No request fails, and the p95 of `TEST \|` requests is at most 2000 ms                                             | At most 1% of each request fails, and `TEST \|` p95 is at most 800 ms |
| Artifact    | `load-smoke-report`                                                                                                | `load-full-report`                                                    |

Either can also be started by hand from the **Actions** tab → **Run workflow**.

> **They test the API deployed to dev, not the pull request's code.** Dev only changes when someone runs
> `./deploy-api.sh dev` in `backend/api/`. To load test a change, deploy it to dev first.

A run installs JMeter (cached, checked against Apache's SHA-512), runs the plan with `runId` set from the workflow run
ID and attempt number, checks the results with [check_results.py](#check_resultspy), runs [Cleanup only](#commands) if
JMeter didn't finish, and uploads the report, results, `errors.xml` and logs.

**Concurrency:** each PR has its own smoke group, where a newer push cancels the older run (its cleanup step still
runs), and the full test has its own group. A shared group would let one PR's push silently cancel another PR's queued
run or the weekly full run, because GitHub keeps only one pending run per group.

To change a workflow's size or limits, edit the values under `with:`. Going above 100 accounts needs a higher sign-up
quota in the Firebase console.

### check_results.py

JMeter exits with `0` even when requests fail, so CI uses `tests/load/check_results.py` to pass or fail a run. It
checks, per request label:

- **Error rate**, for every request. A failed setup request means less load; a failed cleanup request leaves accounts
  behind.
- **p95 response time**, for `TEST |` requests with at least 20 samples.

It also fails when there are no `TEST |` results at all. Run it locally from `tests/load/` (use `python` on Windows):

```bash
python3 check_results.py results/results.jtl --max-error-rate 1 --max-p95 800
```

It prints each label's samples, error rate and p95, then `PASS` or one `FAIL:` line per broken limit, and exits with
`0` or `1`. The defaults are 1% and 800 ms.

---

## Troubleshooting

**The run says `created_accounts.txt lists N accounts from an earlier run`.** An earlier run didn't finish cleaning up.
This run deleted those accounts instead of testing; check the `TEARDOWN |` rows, then run again. Accounts that still
couldn't be deleted stay in the file, and `jmeter.log` says how many. Don't delete test accounts in the Firebase console
instead: that only removes the login, and the app user stays in the database.

**Requests fail with `429`.** The think time is too short for the rate limit; raise `thinkTimeMs`.

**Fewer load test threads than expected.** `created_accounts.txt` has fewer lines than the test has threads. Check the
`SETUP |` rows for failures, and that `setupThreads` is high enough.

**`TEST | /me GET` fails the JSON Assertion.** The API changed the name when saving it. Keep names plain (see
[The test accounts](#the-test-accounts)).

**`${something}` appears literally in a request.** The variable was never set: it's misspelled (names are
case-sensitive), set in another thread group, or the extractor found nothing. Enable **View Results Tree** (and the
Debug Sampler) and run a smoke test in the GUI.

**Report folder error.** JMeter won't write a report into a folder that isn't empty. Add `-f`, or delete the folder.
