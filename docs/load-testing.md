# JMeter (Load) Testing Guide

Load tests check how the API holds up when many people use it at the same time. They measure response times,
throughput (requests per second) and error rate, so slowdowns and failures under load show up before real users find
them. They don't check that features work correctly; unit, integration and E2E tests do that (see
[testing.md](testing.md)).

Load tests use [Apache JMeter](https://jmeter.apache.org/). The test plan, `tests/load/compass-testPlan.jmx`, load
tests the `/me` endpoint with real, temporary accounts. Each run has three stages:

1. **Create** a set of temporary accounts.
2. **Load test:** all the accounts call the API at the same time, for a set amount of time.
3. **Delete** the accounts again.

**In this guide:**

- [Placeholders](#placeholders) and [Prerequisites](#prerequisites), including
  [setups for Windows, WSL, Linux and macOS](#choose-your-setup)
- [JMeter basics](#jmeter-basics): the terms and rules the rest of the guide relies on
- [How the plan works](#how-the-plan-works): what happens, stage by stage
- [accounts.csv](#accountscsv): the accounts the plan creates
- [Running the test](#running-the-test): commands, stopping early, flags and properties
- [Why it is structured this way](#why-it-is-structured-this-way)
- [Element reference](#element-reference): what each element does, why it's used and how to change it
- [Adding a new test to this plan](#adding-a-new-test-to-this-plan)
- [Reading the results](#reading-the-results)
- [Automated runs](#automated-runs-github-actions): the smoke and weekly full tests in GitHub Actions
- [Troubleshooting](#troubleshooting)

---

## Placeholders

Values in angle brackets are placeholders. Replace them with the real values when you copy a command.

| Placeholder          | What it is                                   | Where to find the real value                                                                            |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `<API_HOST>`         | The API host the plan sends requests to      | `apiHost` in the plan's User Defined Variables                                                          |
| `<FIREBASE_API_KEY>` | The Firebase key used to sign up and sign in | `firebaseApiKey` in the plan's User Defined Variables (the dev key is also in `common/src/envs/dev.ts`) |
| `<TEST_DOMAIN>`      | The email domain of the test accounts        | `tests/load/accounts.csv`                                                                               |
| `<PASSWORD>`         | The password of the test accounts            | `tests/load/accounts.csv`                                                                               |

---

## Prerequisites

- **Java 8 or newer** (17+ recommended), installed on the system where JMeter runs. JMeter runs on Java.
- **[Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi)**, set up for your system as described in
  [Choose your setup](#choose-your-setup).

The plan's files live in `tests/load/`:

| File                   | What it is                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `compass-testPlan.jmx` | The test plan                                                                               |
| `accounts.csv`         | The accounts to create (see [accounts.csv](#accountscsv))                                   |
| `check_results.py`     | Checks a results file against limits, used by CI (see [check_results.py](#check_resultspy)) |

A run creates these files. The [commands](#commands) are run from `tests/load/`, so they all land there. They are
generated output and are git-ignored:

| File or folder         | What it is                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| `created_accounts.txt` | The accounts created in this run, passed between stages             |
| `errors.xml`           | Details of failed requests                                          |
| `jmeter.log`           | JMeter's own log, including the warnings the plan's scripts write   |
| `results/`             | The raw results of each run ([`.jtl` files](#the-results-file-jtl)) |
| `report/`              | The HTML report                                                     |

### Choose your setup

The [commands](#commands) use short paths such as `compass-testPlan.jmx` and `results/smoke.jtl`, which only work when
JMeter runs **inside `tests/load/`** on the same system as the project. Find the row that matches your machine, then
follow its section below.

| Your setup                                  | Run the commands in                                        | Open the GUI with                               |
| ------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Project and JMeter on the same system       | A terminal on that system (PowerShell on Windows)          | JMeter on that system                           |
| Project in WSL, JMeter installed on Windows | A WSL terminal, using the Windows install's Linux launcher | JMeter on Windows, with the plan's Windows path |
| Project in WSL, JMeter installed in WSL     | A WSL terminal                                             | JMeter in WSL, shown as a window on Windows     |

Common to every setup:

- **A WSL terminal** (needed for both WSL setups) is a terminal running Linux inside WSL. Open one with the **Ubuntu**
  app from the Start menu, an Ubuntu tab in Windows Terminal, or `wsl` in PowerShell. If the project is open in VS Code
  through WSL (the bottom-left corner shows **WSL: Ubuntu**), VS Code's own terminal (**Terminal → New Terminal**) is
  already one.
- **Java** must be installed on the system that runs the commands. For both WSL setups that means **in WSL**, even if
  Java is also installed on Windows. Check with `java -version`. To install it in WSL, use the full package (the
  `-headless` one can't show the GUI):

  ```bash
  sudo apt install openjdk-21-jre
  ```

- **Check your setup** by running `jmeter --version` in the terminal you'll run the commands from.
- **Commands** are then run exactly as written under [Commands](#commands), from `tests/load/`.
- **To open the plan in the GUI:** start JMeter, choose **File → Open**, paste the full path of
  `compass-testPlan.jmx` into the file name box and open it. When JMeter runs on the same system as the project, you
  can instead run `jmeter -t compass-testPlan.jmx` from `tests/load/`, which opens the plan straight away.

#### Project and JMeter on the same system

For example, everything on Linux, on macOS, or on Windows without WSL.

1. Install JMeter.
2. Add JMeter's `bin/` folder to your PATH, so the `jmeter` command works from any folder.

To start the GUI, run `jmeter`. On Windows, you can also double-click `jmeter.bat` in JMeter's `bin/` folder.

#### Project in WSL, JMeter installed on Windows

The JMeter download is the same for every system, so its `bin/` folder has a launcher for each: `jmeter.bat` for
Windows and `jmeter` (a shell script) for Linux and macOS. WSL sees your Windows drive under `/mnt/c`, so it can run the
Linux launcher from your Windows install, using WSL's Java.

Put JMeter's `bin/` folder on your WSL PATH in **one** of these two ways. Either way, JMeter's `shutdown.sh` also
becomes available, which you need to [stop a run early](#stopping-a-run-early).

**Option A: add it to your Windows PATH.** WSL adds the Windows PATH to its own, so this makes `jmeter` work in WSL
**and** in PowerShell.

1. In the Start menu, search for **Edit environment variables for your account** and open it.
2. Select **Path**, click **Edit**, then **New**, and paste the `bin/` folder's Windows path, e.g.
   `C:\tools\apache-jmeter-5.6.3\bin`. Click **OK** in both windows.
3. Close and reopen your terminals and VS Code, because WSL only sees the new PATH in a fresh session. If `jmeter` still
   isn't found in WSL, run `wsl --shutdown` in PowerShell and open WSL again.

This doesn't work if WSL is set not to include the Windows PATH (`appendWindowsPath = false` in `/etc/wsl.conf`). In
that case, use option B.

**Option B: add it to your WSL PATH only.** Run these in a WSL terminal, from any folder.

1. Find the WSL path of your JMeter folder, using the Windows path where you unpacked it:

   ```bash
   wslpath 'C:\tools\apache-jmeter-5.6.3'
   ```

   This prints e.g. `/mnt/c/tools/apache-jmeter-5.6.3`.

2. Add its `bin/` folder to your WSL PATH, using the path from step 1:

   ```bash
   echo 'export PATH="$PATH:/mnt/c/tools/apache-jmeter-5.6.3/bin"' >> ~/.bashrc && source ~/.bashrc
   ```

In this setup, `jmeter` starts about a second slower than with JMeter installed in WSL (the very first start of the day
can take a few seconds), because its files are read from the Windows drive. Only start-up is affected: a running test
is just as fast.

**GUI:** start JMeter on Windows (double-click `jmeter.bat` in its `bin/` folder, or type `jmeter` in PowerShell if you
used option A) and open the plan with its Windows path. It looks like `\\wsl.localhost\<distro>\home\<you>\…\tests\load\compass-testPlan.jmx`. To get it, run this from
`tests/load/` in WSL and copy the output:

```bash
wslpath -w compass-testPlan.jmx
```

You can also open the folder in File Explorer with `explorer.exe .` and copy the path from the address bar.

> **Don't run the commands with `jmeter.bat`.** Batch files run in `cmd.exe`, which can't use a WSL folder (a
> `\\wsl.localhost\…` path) as its working folder. It switches to `C:\Windows` instead, so the short paths in the
> commands point to the wrong place and the run fails.

#### Project in WSL, JMeter installed in WSL

Everything runs inside WSL. JMeter starts faster than in the setup above, and its GUI opens as a normal window on
Windows through WSLg, which is built into current versions of WSL.

Run these in a WSL terminal, from any folder (the first command moves to your home folder itself):

1. Download and unpack JMeter into your WSL home folder:

   ```bash
   cd ~ && curl -LO https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz && tar -xzf apache-jmeter-5.6.3.tgz
   ```

2. Add its `bin/` folder to the **front** of your PATH:

   ```bash
   echo 'export PATH="$HOME/apache-jmeter-5.6.3/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
   ```

   Putting it first means this JMeter is used even if another one is on your Windows PATH, because WSL places the
   Windows PATH in the middle of its own.

3. Check which JMeter runs with `command -v jmeter`. It should print a path in your home folder, e.g.
   `/home/<you>/apache-jmeter-5.6.3/bin/jmeter`.

**GUI:** run `jmeter`. For **File → Open**, use the plan's WSL path, e.g.
`/home/<you>/…/tests/load/compass-testPlan.jmx`. To print it, run `realpath compass-testPlan.jmx` in `tests/load/`.

---

## JMeter basics

A JMeter test plan is a **tree** of elements. Each element type has one job:

| Term                   | What it means                                                       | Example in this plan                                                                     |
| ---------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Test plan**          | The whole file and its top-level settings                           | [`compass-testPlan.jmx`](#test-plan)                                                     |
| **Thread group**       | A group of threads that all run the same steps                      | [`1 - Create accounts`](#thread-groups)                                                  |
| **Thread**             | One simulated user (see the note below)                             | One of the 100 threads in a thread group                                                 |
| **Sampler**            | Something a thread _does_, usually one request                      | [`SETUP \| Firebase Signup POST`](#http-request)                                         |
| **Config element**     | Settings or data used by samplers                                   | [CSV Data Set Config](#csv-data-set-config), [HTTP Header Manager](#http-header-manager) |
| **Pre/Post-processor** | Runs before/after a sampler, e.g. to pull a value out of a response | [JSON Extractor](#json-extractor)                                                        |
| **Assertion**          | Checks a response and marks the request as failed if it's wrong     | [Response Assertion](#response-assertion) (code must be `200`)                           |
| **Timer**              | Adds a pause before requests                                        | [Think time](#constant-timer)                                                            |
| **Logic controller**   | Controls _how often_ or _whether_ its children run                  | [Runtime Controller](#runtime-controller)                                                |
| **Listener**           | Collects or shows results                                           | [Simple Data Writer](#listeners)                                                         |

> **Words used in this guide:**
>
> - **Thread:** one simulated user that JMeter runs. JMeter's own screens sometimes call these "users", e.g.
>   "Number of Threads (users)".
> - **Account:** a login (email, password, token) that a thread uses.
> - **User:** only ever means a real person using the app.

### Variables and properties

- **Variables** belong to **one thread**. You read them with `${name}`, e.g. `${authToken}`. Each thread has its own
  copy, so 100 threads can each hold a different token. A variable that a thread sets while it runs (like
  `authToken`) **doesn't carry over** to other thread groups.
- The exception is variables defined in the Test Plan or in [User Defined Variables](#user-defined-variables). JMeter
  gives every thread its own copy of those when the thread starts, so threads in every group can read them. That's why
  `${apiHost}` works everywhere.
- **Properties** are **global** to the whole run. You read them with `${__P(name,default)}` and set them from the
  command line with `-Jname=value`. This plan uses properties for anything you might want to change per run (thread
  count, duration, host). See [Properties](#properties) and [Functions](#functions).

### Scope: where an element applies

An element applies to its **parent and everything under its parent** in the tree:

- A Header Manager placed **under one request** only affects that request.
- A timer placed under a controller applies before **every** request in that controller.
- A CSV Data Set placed under a thread group feeds **every thread** in that group.

### Order of execution for each request

For every sampler, JMeter runs the elements in scope in this order:

```text
config elements → pre-processors → timers → the sampler (request) → post-processors → assertions → listeners
```

This matters when one element depends on another. For example, post-processors run **before** assertions, so a script
in a post-processor can't see whether an assertion passed. The [Save account script](#jsr223-scripts-groovy) is an
example.

---

## How the plan works

The plan has one thread group per stage:

```text
compass-testPlan.jmx
├── User Defined Variables     hosts and endpoints shared by all requests
├── 0 - Reset shared file      (setUp)         empties created_accounts.txt
├── 1 - Create accounts        (setUp)         creates accounts, saves them to created_accounts.txt
├── 2 - /me load test          (Thread Group)  the load test, reads created_accounts.txt
├── 3 - Delete accounts        (tearDown)      reads created_accounts.txt, deletes each account
└── Listeners                  Summary Report, Simple Data Writer, View Results Tree
```

Account data moves through the plan like this:

```text
accounts.csv ──► 1 - Create accounts ──► created_accounts.txt ──► 2 - /me load test
                                                   └────────► 3 - Delete accounts
```

### Stage by stage

The stages run one after another (see [Test Plan](#test-plan)). The elements in brackets are explained in the
[Element reference](#element-reference).

**0 - Reset shared file** (setUp, 1 thread)

- `SETUP | Reset created_accounts.txt` ([JSR223 Sampler](#jsr223-scripts-groovy)) empties `created_accounts.txt`, so
  only this run's accounts end up in it. The stage is skipped when `resetFile=0` (used by
  [Cleanup only](#cleanup-only)).

**1 - Create accounts** (setUp, `setupThreads` threads, one account each)

Each thread takes the next row of `accounts.csv` ([CSV Data Set Config](#csv-data-set-config)), then:

1. `SETUP | Firebase Signup POST` creates the Firebase login. A [JSON Extractor](#json-extractor) saves the sign-in
   token from the response as `authToken`.
2. `SETUP | create-user-and-profile POST` creates the account's app user and profile, signed in with `authToken`.
3. **Save account for test and teardown** ([JSR223 PostProcessor](#jsr223-scripts-groovy)) adds the account to
   `created_accounts.txt` as one line: `email|password|token|name`.

A disabled [Debug Sampler](#debug-sampler) sits at the end of this stage, for checking the thread's variables while
debugging.

**2 - /me load test** (Thread Group, `meThreads` threads)

Each thread takes one line of `created_accounts.txt`, so it gets one account. A
[Runtime Controller](#runtime-controller) then repeats this request for `meDuration` seconds:

- `TEST | /me GET` calls `/me` with that account's token. It passes if the response code is `200`
  ([Response Assertion](#response-assertion)) **and** the returned `name` matches the account
  ([JSON Assertion](#json-assertion)).

**Think time** ([Constant Timer](#constant-timer)) can add a pause before each request. It's 0 by default.

**3 - Delete accounts** (tearDown, 1 thread)

The thread goes through `created_accounts.txt` line by line until the file runs out. For each account:

1. `TEARDOWN | Firebase Sign in POST` signs in again to get a fresh token (saved by a JSON Extractor). Tokens expire
   after 1 hour, so the one from setUp may be too old.
2. `TEARDOWN | Delete app user` calls `/me/delete`, which deletes the app user, their files and their Firebase login.
   It sends the reason `jmeter-load-test`, which the API stores in the `deleted_users` table, so load-test deletions
   can be told apart from real users' deletions.

---

## accounts.csv

### Why it's needed

The API only accepts most requests from **signed-in accounts**, so the test needs real accounts. Each thread needs its
**own** account:

- Each row holds one account, so each thread acts like a separate person using the app, as in real traffic.
- Sign-up rejects an email that's already in use, so every row needs its own email.

### How the plan uses it

- The file is read by the **CSV - Accounts** element in `1 - Create accounts`.
- Each thread in that group takes the **next unused row**. The sharing mode is _All threads_, so no two threads get
  the same row.
- The four columns become the variables `${userEmail}`, `${userPassword}`, `${username}` and `${name}`. These are used
  in the bodies of the sign-up and profile requests.
- If there are more threads than rows, the extra threads **stop** without doing anything ("Stop thread on EOF").

### Format

Four columns, separated by commas, with **no header row**:

```text
email,password,username,name
```

Example row:

```text
loadtest001@<TEST_DOMAIN>,<PASSWORD>,loadtest001,Load Test 001
```

Rules for each column:

| Column     | Rule                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `email`    | Unique, and not already used by an account in the environment you're testing                                             |
| `password` | At least 6 characters (Firebase's minimum)                                                                               |
| `username` | Unique, 3-25 letters, numbers or underscores. If it's already taken, the API quietly picks a similar one                 |
| `name`     | At most 30 characters. Stick to letters, numbers and single spaces, and avoid staff words such as "admin" or "moderator" |

**No commas or `|` inside any value.** A comma always starts a new column, and the accounts are saved to
`created_accounts.txt` with `|` between values.

**Why the name rules matter:** the API cleans names before saving them. It squeezes repeated spaces, removes emoji and
symbols, cuts names to 30 characters, and rejects names that look like staff. The `/me` test checks that the returned
name matches `accounts.csv` exactly, so if the API changes a name, every `/me` request for that account fails.

### How to change it

- **Support more threads:** you need **at least as many rows as `setupThreads`** (100 by default). To make a new file
  with more rows, run this from `tests/load/`, using the domain and password from the current file:

  ```bash
  domain='<TEST_DOMAIN>'; password='<PASSWORD>'; count=200
  for i in $(seq -f '%03g' 1 "$count"); do echo "loadtest$i@$domain,$password,loadtest$i,Load Test $i"; done > accounts.csv
  ```

  ```powershell
  $domain = '<TEST_DOMAIN>'; $password = '<PASSWORD>'; $count = 200
  1..$count | ForEach-Object { $n = '{0:D3}' -f $_; "loadtest$n@$domain,$password,loadtest$n,Load Test $n" } | Set-Content -Encoding ascii accounts.csv
  ```

- **Keep values unique:** no two rows can share an email or username.
- **Reusing rows is fine:** the accounts are deleted at the end of every run, so the same file works run after run. If
  a run fails to clean up, see [Troubleshooting](#sign-up-fails-with-email_exists).
- **Adding, removing or reordering columns:** the columns map to variables **by position**. If you change them, also
  update:
  1. **CSV - Accounts → Variable Names**, so the names are in the same order as the columns.
  2. Every request body that uses the variables (e.g. `SETUP | Firebase Signup POST`).
  3. The **Save account for test and teardown** script, if the new value should be passed on to later stages.

---

## Running the test

### Why non-GUI mode

Always run load tests from the command line (**non-GUI mode**, the `-n` flag). Use the GUI only to build and debug the
plan.

- **It uses far less CPU and memory.** The GUI draws results on screen and keeps them in memory while the test runs.
  That takes resources away from sending requests, so the machine running JMeter can become the bottleneck, and the
  results get less accurate.
- **It works in CI and scripts,** since no screen is needed.

JMeter's own docs give the same advice, and JMeter prints a warning about it whenever the GUI opens.

### Commands

Run these from `tests/load/`, in the terminal for your [setup](#choose-your-setup) (a WSL terminal if the project is in
WSL):

```bash
cd tests/load
```

The results (`results/…`) and report (`report`) paths are relative to that folder.

#### Smoke test

1 thread for 10 seconds. Run this 1hr(`Firebase creation limit resets every hour`) before every full run to check that each step works.

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/smoke.jtl  -e -o report -Jthreads=1 -JsetupRamp=1 -Jramp=1 -Jduration=10
```

#### Full run with HTML report

Uses the defaults (100 threads, 120 seconds).

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -e -o report
```

#### Report with only the load test requests

Hides the account setup and cleanup requests from the report. The filter is a regular expression that keeps only the
labels starting with `TEST |`.

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -e -o report '-Jjmeter.reportgenerator.sample_filter=^TEST \|.*'
```

```powershell
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -e -o report "-Jjmeter.reportgenerator.sample_filter=^TEST \|.*"
```

#### Run against a different environment

The plan tests the dev environment by default. An API only accepts sign-in tokens from its own Firebase project, so
when you change the API host, also pass the Firebase key of the same environment:

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl -JapiHost=<API_HOST> -JfirebaseApiKey=<FIREBASE_API_KEY>
```

```powershell
jmeter -n -f -t compass-testPlan.jmx -l results/results.jtl "-JapiHost=<API_HOST>" -JfirebaseApiKey=<FIREBASE_API_KEY>
```

> **PowerShell note:** wrap any `-J` argument whose value contains a dot in double quotes, as above. Without the
> quotes, PowerShell can split the argument at the dot, and JMeter gets a broken value.

#### Cleanup only

Deletes the accounts still listed in `created_accounts.txt`, without creating accounts or running the test. Use it
when a run stopped before cleanup finished.

```bash
jmeter -n -f -t compass-testPlan.jmx -l results/cleanup.jtl -JresetFile=0 -Jthreads=0
```

- `-JresetFile=0` gives `0 - Reset shared file` zero threads, so the file isn't emptied.
- `-Jthreads=0` gives account creation and the load test zero threads, so they're skipped.
- `3 - Delete accounts` always runs with 1 thread, so cleanup is all that runs.

#### Rebuild a report from an existing results file

Builds the HTML report again without running the test. The `report` folder must be empty or not exist yet.

```bash
jmeter -g results/results.jtl -o report
```

### Stopping a run early

To stop a run before it finishes **and still delete the accounts**, stop it gracefully. From another terminal of the
same kind as the one running the test (a WSL terminal if the project is in WSL), run JMeter's shutdown script. It's
in JMeter's `bin/` folder, so it's on your PATH:

```bash
shutdown.sh
```

```powershell
shutdown.cmd
```

Type the full name: plain `shutdown` is your operating system's command to turn the computer off.

JMeter lets the requests in progress finish, then runs `3 - Delete accounts` as usual. In the GUI, use
**Run → Shutdown** for the same effect.

Pressing **Ctrl+C**, running `stoptest.sh`/`stoptest.cmd`, or using **Run → Stop** in the GUI stops JMeter straight
away, and cleanup **doesn't** run. Afterwards, run [Cleanup only](#cleanup-only) to delete the accounts that were
created.

### Command flags

| Flag          | Meaning                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `-n`          | Non-GUI mode                                                                |
| `-t <file>`   | The test plan to run                                                        |
| `-l <file>`   | Where to save the [raw results](#the-results-file-jtl) (`.jtl`, a CSV file) |
| `-e -o <dir>` | After the run, build an HTML report into this folder                        |
| `-f`          | Delete the old results file and report folder first                         |
| `-g <file>`   | Build a report from an existing `.jtl` without running a test               |
| `-J<k>=<v>`   | Set a property the plan reads (see below)                                   |

Without `-f`, `-l` **adds** to an existing results file (mixing runs together), and `-e -o` **fails** if the report
folder isn't empty.

### Properties

The plan reads its settings from properties, so you can change a run without editing the `.jmx`.

| Property         | Default              | What it controls                                                                       |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `threads`        | `100`                | Threads for account creation and every load test, unless overridden                    |
| `ramp`           | `10`                 | Seconds to start all threads in each load test, unless overridden                      |
| `duration`       | `120`                | Seconds each load test runs, unless overridden                                         |
| `setupThreads`   | `threads`            | Number of accounts to create                                                           |
| `setupRamp`      | `10`                 | Seconds to start all account-creation threads                                          |
| `meThreads`      | `threads`            | Threads in the `/me` test                                                              |
| `meRamp`         | `ramp`               | Seconds to start all threads in the `/me` test                                         |
| `meDuration`     | `duration`           | Seconds the `/me` test runs                                                            |
| `thinkTimeMs`    | `0`                  | Pause before each load test request, per thread (0 = none)                             |
| `apiHost`        | `<API_HOST>`         | API host to test against                                                               |
| `firebaseApiKey` | `<FIREBASE_API_KEY>` | Firebase key for sign-up and sign-in. Must belong to the same environment as `apiHost` |
| `resetFile`      | `1`                  | `0` keeps `created_accounts.txt` instead of emptying it                                |

**Specific settings override general ones.** `-Jthreads=50` sets account creation and every load test to 50 threads.
Adding `-JmeThreads=200` changes only the `/me` test. The reset and delete stages always use 1 thread.

Each load test has its own property prefix (`me` for the `/me` test).
A new test gets its own `<prefix>Threads`, `<prefix>Ramp` and `<prefix>Duration`.

**Keep `setupThreads` at least as high as the largest load test.** The tests reuse the accounts created in setUp, and
a thread with no account stops.

> **Ramp-up** is how long JMeter takes to start all the threads. With 100 threads and a 10-second ramp-up, a new
> thread starts every 0.1 seconds. Starting them all at once is less realistic and can overload sign-in.

---

## Why it is structured this way

- **Stages allow tests to be the main focus.** Creating accounts is slow and only happens once per account. Doing it in a
  separate stage keeps it out of the load test results, so they only measure what's being tested.
- **setUp and tearDown thread groups run automatically.** JMeter runs setUp groups before the main test and tearDown
  groups after it. tearDown also runs after a [graceful shutdown](#stopping-a-run-early), so test accounts don't pile
  up when you stop a run early that way.
- **Stages run in order.** The test plan has **Run Thread Groups consecutively** turned on, so each group waits for the
  one before it to finish (see [Test Plan](#test-plan)).
- **One file, one command.** All stages live in one `.jmx`, so the order is guaranteed and CI only needs one command.
- **A shared file passes accounts between stages.** Variables belong to one thread in one thread group, so later stages
  can't see what setUp created. setUp writes each account to `created_accounts.txt`, and later stages read it.
- **Properties instead of fixed values.** The same plan works as a smoke test, a full run or a cleanup, just by
  changing the command. No edits to the file needed.
- **Paths are relative to the `.jmx`.** The plan looks for `accounts.csv`, `created_accounts.txt` and `errors.xml`
  next to the `.jmx`, so JMeter can be started from any folder, on any machine, and still find them.
- **Clear labels.** Every request name starts with `SETUP |`, `TEST |` or `TEARDOWN |`. This makes the stages easy to
  tell apart in the results, and lets the report [filter](#report-with-only-the-load-test-requests) to `TEST |` only.

---

## Element reference

Each element type used in the plan, with:

- **What it does:** how the element works.
- **Why it's used here:** what the plan needs it for.
- **How it's set up here:** its key settings in this plan, and why.
- **How to change it:** where to edit it, what else has to change with it, and how to add a new one.

**GUI basics:** to **add** an element, right-click the element it should go under, choose **Add**, then pick the
category and the element. To **change** an element, click it in the tree and edit the fields on the right. To turn an
element off without deleting it, right-click it → **Disable**. Save with **Ctrl+S**.

### Test Plan

**What it does:** The top of the tree. It holds settings that apply to the whole run.

**Why it's used here:** Its settings make the stages run in order, and make cleanup run after a graceful early stop.

**How it's set up here:**

- **Run Thread Groups consecutively (i.e. one at a time): on.** Each stage waits for the one before it to finish.
  Without it, groups of the same type start together: `0 - Reset shared file` could empty `created_accounts.txt` while
  `1 - Create accounts` is saving accounts to it.
- **Run tearDown Thread Groups after shutdown of main threads: on.** Accounts are still deleted after a
  [graceful shutdown](#stopping-a-run-early). It doesn't help after Ctrl+C or **Stop**.

**How to change it:** Click the top element of the tree and tick or untick the boxes.

### Thread groups

**What they do:** A thread group is a set of threads that all run the steps under it. There are three types:

- **setUp Thread Group:** runs **before** all normal thread groups.
- **Thread Group:** the normal kind, used for the load tests.
- **tearDown Thread Group:** runs **after** all normal thread groups.

**Why they're used here:** Each stage is its own thread group. That keeps the slow, one-off account creation out of the
measured load, and lets JMeter run setUp and cleanup at the right time without any extra logic.

**How they're set up here:**

| Thread group            | Type         | Threads                                 | Loops                                                  |
| ----------------------- | ------------ | --------------------------------------- | ------------------------------------------------------ |
| `0 - Reset shared file` | setUp        | `resetFile` (1, or 0 to skip the group) | 1                                                      |
| `1 - Create accounts`   | setUp        | `setupThreads`                          | 1 (one account per thread)                             |
| `2 - /me load test`     | Thread Group | `meThreads`                             | 1 (the Runtime Controller inside repeats the requests) |
| `3 - Delete accounts`   | tearDown     | 1                                       | Infinite, stops when `created_accounts.txt` runs out   |

- **Number of Threads (users):** how many threads to run. Here it's a property with a fallback, e.g.
  `${__P(setupThreads,${__P(threads,100)})}` (see [Functions](#functions)). A group with 0 threads is skipped, which
  is how `resetFile=0` and `threads=0` turn stages off.
- **Ramp-up period (seconds):** how long it takes to start all the threads (see the ramp-up note under
  [Properties](#properties)).
- **Loop Count:** how many times each thread runs the steps. "Infinite" means until something stops it (here, the end
  of `created_accounts.txt`).
- **Action to be taken after a Sampler error:** **Continue** in all groups, so one failed request doesn't stop a
  thread.

**How to change it:** Click the thread group and edit the fields. To change the numbers for one run, use
[properties](#properties) instead of editing the fields. To add a group, right-click the Test Plan → **Add → Threads
(Users)** → pick the type. Within each type, groups run in their order in the tree.

### User Defined Variables

**What it does:** Defines named values once, so every element can use them with `${name}`. Every thread gets its own
copy when it starts (see [Variables and properties](#variables-and-properties)).

**Why it's used here:** Hosts, endpoint paths and the Firebase key are used by many requests. Keeping them in one place
means you change them once instead of in every request.

**How it's set up here:**

| Name                                                           | Value                                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `baseAuthUrl`                                                  | Firebase Auth host                                                                                             |
| `apiHost`                                                      | `${__P(apiHost,<API_HOST>)}` (can be overridden with `-JapiHost`)                                              |
| `firebaseApiKey`                                               | `${__P(firebaseApiKey,<FIREBASE_API_KEY>)}` (can be overridden with `-JfirebaseApiKey`)                        |
| `signupUrl`, `signinUrl`, `deleteAccountUrl`, `getUserDataUrl` | Firebase Auth endpoint paths. `deleteAccountUrl` and `getUserDataUrl` aren't used by any request at the moment |

**How to change it:** Click **User Defined Variables** and edit the table, or add a row for a new value. To make a
value changeable from the command line, wrap it in `__P`, e.g. `${__P(myValue,default)}`, and run with
`-JmyValue=...`. To add another set: right-click the Test Plan → **Add → Config Element → User Defined Variables**.

### CSV Data Set Config

**What it does:** Reads a text file line by line. Each line is split into columns, and the columns become variables
for the thread that read it.

**Why it's used here:** Each thread needs its own account. The CSV configs hand every thread a different line, from
`accounts.csv` in setUp and from `created_accounts.txt` (which passes the accounts on) in the later stages.

**How it's set up here:**

| Element                  | Thread group          | File                   | Variables                               | Delimiter | Sharing mode         |
| ------------------------ | --------------------- | ---------------------- | --------------------------------------- | --------- | -------------------- |
| `CSV - Accounts`         | `1 - Create accounts` | `accounts.csv`         | `userEmail,userPassword,username,name`  | `,`       | All threads          |
| `CSV - Created accounts` | `2 - /me load test`   | `created_accounts.txt` | `userEmail,userPassword,authToken,name` | `\|`      | Current thread group |
| `CSV - created accounts` | `3 - Delete accounts` | `created_accounts.txt` | `userEmail,userPassword,authToken,name` | `\|`      | Current thread group |

- **Filename:** a plain file name is looked up **next to the `.jmx`**.
- **Variable Names:** one name per column, in column order, separated by commas.
- **Delimiter:** the character between columns. `created_accounts.txt` uses `|`, because that's how the
  [Save account script](#jsr223-scripts-groovy) writes it.
- **Recycle on EOF?:** **False**. When the file runs out, don't start again from the top, because each account is
  used once per group.
- **Stop thread on EOF?:** **True**. A thread with no line left stops, instead of running with empty values.
- **Sharing mode:** which threads share one position in the file.
  - **All threads:** one shared reader for the whole run, so every thread in every group gets a different line. Used
    for `accounts.csv`.
  - **Current thread group:** each thread group gets its own reader, starting from line 1. Used for
    `created_accounts.txt`, so every load test **and** the cleanup each go through all the accounts.

**When threads read a line:** each thread reads the next line at the **start of every loop** of its thread group. In
`2 - /me load test`, each thread loops once, so it keeps one account for the whole test. In `3 - Delete accounts`, the
single thread loops until the file runs out, taking the next account each time.

**How to change it:** Click the CSV config and edit the fields. If you change the columns of either file, update the
Variable Names to match (see [accounts.csv → How to change it](#how-to-change-it), and the
[Save account script](#jsr223-scripts-groovy) for `created_accounts.txt`). To add one: right-click the thread group →
**Add → Config Element → CSV Data Set Config**.

### HTTP Request

**What it does:** Sends one HTTP request and records how long the response took.

**Why it's used here:** Every step of the plan is an HTTP request: signing up, creating the profile, the load test
itself and the cleanup. The plan's requests, in run order, are listed in [Stage by stage](#stage-by-stage).

**How it's set up here** (Basic tab), using `SETUP | Firebase Signup POST` as the example:

- **Name** (at the top): the label shown in results. It starts with `SETUP |`, `TEST |` or `TEARDOWN |` (see
  [Clear labels](#why-it-is-structured-this-way)).
- **Protocol:** `https`.
- **Server Name or IP:** a variable, here `${baseAuthUrl}` (requests to the API use `${apiHost}`). Don't include
  `https://` here.
- **HTTP Request (method):** `POST`.
- **Path:** `${signupUrl}${firebaseApiKey}`. Variables can be combined.
- **Body Data tab:** the JSON body, with variables inside:
  `{ "email": "${userEmail}", "password": "${userPassword}", "returnSecureToken": true }`.

**How to change it:** Click the request and edit the Basic tab. To add one: right-click the thread group or controller
→ **Add → Sampler → HTTP Request**. Give it a name with the right prefix, plus a
[Header Manager](#http-header-manager) and a [Response Assertion](#response-assertion), like the existing requests.

### HTTP Header Manager

**What it does:** Adds HTTP headers to the requests in its scope.

**Why it's used here:** The API and Firebase expect JSON bodies, and signed-in requests must send a token to prove
which account they come from.

**How it's set up here:** Each request has its own Header Manager underneath it:

- `Content-Type: application/json` on every request.
- `Authorization: Bearer ${authToken}` on requests that need a signed-in account.

**How to change it:** Click the Header Manager and edit its table of header **Name** and **Value**. Values can use
variables. To add one: right-click the **request** → **Add → Config Element → HTTP Header Manager**. Placing it under
the request means it only applies to that request. Placing it under a thread group would apply it to **every** request
in the group (see [Scope](#scope-where-an-element-applies)).

### JSON Extractor

**What it does:** Reads a value out of a JSON response and saves it as a variable.

**Why it's used here:** The sign-in token only exists once Firebase sends it back. The extractor catches it, so later
requests can send it in the `Authorization` header.

**How it's set up here:** There's one under `SETUP | Firebase Signup POST` and one under
`TEARDOWN | Firebase Sign in POST`. Both take `idToken` from the response and save it as `authToken`.

| Field                      | Value       | Meaning                                                 |
| -------------------------- | ----------- | ------------------------------------------------------- |
| Names of created variables | `authToken` | The variable to save into                               |
| JSON Path expressions      | `$.idToken` | Where to find the value. `$` is the top of the response |
| Match No. (0 for Random)   | `1`         | Use the first match                                     |
| Default Values             | (empty)     | What to save if nothing is found                        |

**How to change it:** Click the extractor and edit the fields. To capture more values, list more variable names and
JSON paths, separated by `;`. To add one: right-click the **request** → **Add → Post Processors → JSON Extractor**.

### JSR223 scripts (Groovy)

**What they do:** Run a short script. A **JSR223 Sampler** is a step of its own and shows up in the results. A
**JSR223 PostProcessor** runs right after the request it sits under. This plan uses **Groovy**, the recommended (and
fastest) language for JMeter scripts.

Objects a script can use:

| Object  | What it is                                                               |
| ------- | ------------------------------------------------------------------------ |
| `vars`  | This thread's variables: `vars.get("name")`, `vars.put("name", "value")` |
| `props` | Global properties                                                        |
| `prev`  | The result of the previous request, e.g. `prev.isSuccessful()`           |
| `log`   | Writes to `jmeter.log`, e.g. `log.warn("...")`                           |

**Why they're used here:** Emptying `created_accounts.txt` and adding accounts to it are easiest with a few lines of
script.

**How they're set up here:**

- **Language:** `groovy`.
- **Cache compiled script if available:** **on**. The script is compiled once, which matters when it runs thousands
  of times.

`SETUP | Reset created_accounts.txt` (JSR223 Sampler in `0 - Reset shared file`):

```groovy
import org.apache.jmeter.services.FileServer
new File(FileServer.getFileServer().getBaseDir(), "created_accounts.txt").text = ""
```

- `FileServer.getFileServer().getBaseDir()` is the folder containing the `.jmx`. Using it means the file is always
  found next to the plan, wherever JMeter was started from.
- `.text = ""` empties the file.

**Save account for test and teardown** (JSR223 PostProcessor under `SETUP | create-user-and-profile POST`):

```groovy
import org.apache.jmeter.services.FileServer

def token = vars.get("authToken")
if (!token) {
    log.warn("No token for ${vars.get('userEmail')}, not saving")
    return
}
if (!prev.isSuccessful()) {
    log.warn("Profile creation failed for ${vars.get('userEmail')}, saving anyway so it gets cleaned up")
}

def file = new File(FileServer.getFileServer().getBaseDir(), "created_accounts.txt")
synchronized (FileServer.class) {
    file.append([vars.get("userEmail"), vars.get("userPassword"), token, vars.get("name")].join("|") + "\n", "UTF-8")
}
```

- **No token:** sign-up failed, so there's no account to save. It logs a warning and stops.
- **Profile failed:** `prev` is the profile request. `prev.isSuccessful()` is false when the response code is 4xx or
  5xx. The script runs before the Response Assertion, so the assertion's result isn't included (see
  [Order of execution](#order-of-execution-for-each-request)). The Firebase login exists either way, so the account
  is **saved anyway**, and cleanup deletes it.
- **`synchronized (FileServer.class)`:** many threads write to the same file at the same time. This lets only one
  thread write at a time, so lines never get mixed together.
- **`join("|")`:** joins the values into one line in the format `created_accounts.txt` expects.

**How to change them:** Click the element and edit the **Script** box. If you add a value to `created_accounts.txt`,
add it to the `join` list here **and** to the Variable Names of both CSV configs that read the file, in the same
position. To add one: right-click a thread group → **Add → Sampler → JSR223 Sampler**, or right-click a request →
**Add → Post Processors → JSR223 PostProcessor**. Check that the language is `groovy`.

### Response Assertion

**What it does:** Checks part of a response against a pattern. If it doesn't match, the request is marked as
**failed** in the results.

**Why it's used here:** On its own, JMeter only marks a request as failed when the response code is 4xx or 5xx. The
assertion makes the check strict: anything other than exactly `200` counts as a failure.

**How it's set up here:** Every request has one:

- **Field to Test:** `Response Code`
- **Pattern Matching Rules:** `Equals`
- **Patterns to Test:** `200`

**How to change it:** Click the assertion and edit **Patterns to Test**, e.g. if a new request should return `201`.
To add one: right-click the **request** → **Add → Assertions → Response Assertion**.

### JSON Assertion

**What it does:** Checks that a value exists in a JSON response, and optionally that it equals an expected value.

**Why it's used here:** A `200` only says the request worked. Checking the returned `name` proves the API sent back
**this** account's data, not someone else's.

**How it's set up here:** On `TEST | /me GET`:

- **Assert JSON Path exists:** `$.name`
- **Additionally assert value:** on
- **Expected Value:** `${name}`, the account's name from `created_accounts.txt`
- **Match as regular expression:** **off**. When it's on, characters like `.` or `(` in a name are treated as pattern
  symbols, and valid names can fail.

Because of this check, names in `accounts.csv` must follow the [name rules](#format).

**How to change it:** Click the assertion and change the JSON path and expected value to something that proves the
response is right. To add one: right-click the **request** → **Add → Assertions → JSON Assertion**.

### Runtime Controller

**What it does:** Repeats the elements under it, over and over, until a set number of seconds has passed.

**Why it's used here:** It makes the load test run for a fixed time, so a test takes the same time however fast or slow
the API responds.

**How it's set up here:** It wraps `TEST | /me GET`, so each thread keeps sending requests for `meDuration` seconds.

- **Runtime (seconds):** `${__P(meDuration,${__P(duration,120)})}`

**How to change it:** Change the time per run with `-JmeDuration` or `-Jduration` (see [Properties](#properties))
rather than editing the field. To test a sequence of requests, put more requests under the controller. To add one:
right-click the thread group → **Add → Logic Controller → Runtime Controller**, then drag the requests onto it.

### Constant Timer

**What it does:** Pauses each thread for a fixed time **before every request in its scope**.

**Why it's used here:** As **think time**: an optional pause between requests, so threads can act more like real
people. It defaults to `0` (no pause, maximum load).

**How it's set up here:** It's called **Think time** and sits under the Runtime Controller.

- **Thread Delay (in milliseconds):** `${__P(thinkTimeMs,0)}`

**How to change it:** Set the pause per run with `-JthinkTimeMs=<milliseconds>`. To add one: right-click the
controller or thread group → **Add → Timer → Constant Timer**.

### Listeners

**What they do:** Collect and show results. They apply to every request in their scope; here they sit at the top
level, so they see everything.

**Why they're used here:** To keep the details of failed requests without slowing the run, and to show results live
when debugging in the GUI.

**How they're set up here:**

| Listener               | Status   | What it does                                                                             |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------- |
| **Summary Report**     | Enabled  | A live results table, only useful in the GUI                                             |
| **Simple Data Writer** | Enabled  | Saves **failed requests only** to `errors.xml`, with the response body showing why       |
| **View Results Tree**  | Disabled | Shows every request and response in detail. Great for debugging, too heavy for load runs |

Simple Data Writer settings:

- **Filename:** `errors.xml` (relative to the `.jmx`).
- **Log/Display Only: Errors:** ticked, so only failed requests are saved.
- **Configure** button:
  - **Save Response Data (XML):** on, to see why a request failed.
  - **Save Sampler Data (XML):** **off**. Request bodies contain passwords and tokens.

The results file from `-l` is separate from these listeners. It always records every request.

**How to change them:** To debug a smoke test in the GUI, enable **View Results Tree** (right-click → **Enable**), and
disable it again before a load run. To add one: right-click the Test Plan → **Add → Listener**.

### Debug Sampler

**What it does:** A sampler that doesn't send a request. Instead, it records the thread's variables at that point in
the steps, so you can read them in **View Results Tree**.

**Why it's used here:** To check what a thread holds while building or fixing the plan, e.g. whether `authToken` was
extracted, or which row of `accounts.csv` the thread read. It's **disabled** normally, because it adds a row per thread
to the results and isn't needed during a load run.

**How it's set up here:** It's the last step of `1 - Create accounts`, after `SETUP | create-user-and-profile POST`, so
it shows each thread's variables once its account exists. It shows **JMeter variables** only; JMeter properties and
system properties are turned off.

**How to change it:** Right-click it → **Enable**, enable **View Results Tree** as well, and run a smoke test in the
GUI. Select the **Debug Sampler** row and open the **Response data** tab to see the variables, which include the
account's password and token. Disable both again before a load run. To check variables somewhere else, add one there:
right-click the thread group → **Add → Sampler → Debug Sampler**, and drag it to the step you want to check.

### Functions

**What they do:** Special `${__name(...)}` values that JMeter works out at run time.

**Why they're used here:** `__P` lets the command line change the plan's settings without editing the `.jmx`.

**How they're set up here:** The plan only uses `__P`, which reads a property:

- `${__P(duration,120)}` means the `duration` property, or `120` if it isn't set.
- `${__P(setupThreads,${__P(threads,100)})}` means `setupThreads`; if that isn't set, `threads`; if that isn't set
  either, `100`. This is how specific settings override general ones.

**How to change them:** Edit the function where it's used, e.g. to change a default value. **Tools → Function Helper
Dialog** in the GUI lists every function and builds the syntax for you.

---

## Adding a new test to this plan

New load tests **reuse the accounts** created by setUp and deleted by tearDown, so you only need to build the test
itself.

1. **Duplicate the existing test group.** Right-click `2 - /me load test` → **Duplicate**. Drag the copy so it sits
   **after the last load test and before `3 - Delete accounts`**.
2. **Rename it** `N - <new test name>`, where `N` is its position in the run order.
3. **Choose a property prefix** for the new test, e.g. `<newtest>`, and set these fields:
   - Number of Threads: `${__P(<newtest>Threads,${__P(threads,100)})}`
   - Ramp-up period: `${__P(<newtest>Ramp,${__P(ramp,10)})}`
   - Runtime Controller → Runtime: `${__P(<newtest>Duration,${__P(duration,120)})}`
4. **Keep the `CSV - Created accounts` element** as it is. Its sharing mode, _Current thread group_, gives this test
   its own pass through all the accounts.
5. **Change the HTTP Request:**
   - Name: `TEST | <new request>`
   - Method, Path and Body Data for the new request
   - Keep the Header Manager with `Authorization: Bearer ${authToken}` if the request needs a signed-in account
6. **Update the assertions:**
   - Keep the Response Assertion if `200` is the expected code, or change it.
   - Change or remove the JSON Assertion so it checks something in **this** response.
7. **Optional:** adjust or remove the think time timer, or add more requests inside the Runtime Controller to test a
   sequence of requests.
8. **Check account numbers:** `setupThreads` must cover the new test's thread count (see [Properties](#properties)).
9. **Save, then run a [smoke test](#smoke-test).** Check that the new `TEST |` rows show up and pass.

**Things to keep in mind:**

- **Tests run one after another and share the same accounts.** Total run time is the sum of all test durations.
- **Long runs need fresh tokens.** All tests use the tokens created in setUp, which expire after 1 hour. If the tests
  together run longer than that, later tests start failing with `401`. In that case, add a sign-in request (like
  `TEARDOWN | Firebase Sign in POST` and its JSON Extractor) at the start of the new test group, before the Runtime
  Controller.
- **Tests that change account data affect later tests.** For example, a test that edits the profile name makes a later
  test that checks the name fail. Put such tests last, or make later checks not depend on that data.

---

## Reading the results

A run gives you three outputs: the results file (`.jtl`), the HTML report built from it, and `errors.xml`.

### The results file (`.jtl`)

The file you name with `-l` (e.g. `results/results.jtl`) holds the **raw results** of a run. JMeter writes one row for
every request it sends, in every stage, with how long it took and whether it passed. The HTML report and its statistics
are all calculated from this file.

For example, a smoke test gives about 50 rows: one for each setup and cleanup request, plus one for every `/me` call
the thread made in its 10 seconds.

It's a plain CSV file with a header row, so it opens in any spreadsheet. The most useful columns:

| Column                                      | Meaning                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `timeStamp`                                 | When the request was sent (milliseconds since 1970)                            |
| `elapsed`                                   | Response time in ms, the main number in a load test                            |
| `label`                                     | Which request it was, e.g. `TEST \| /me GET`                                   |
| `responseCode`, `success`, `failureMessage` | Whether it passed, and why not if it failed                                    |
| `Latency`                                   | Time until the first byte of the response arrived                              |
| `Connect`                                   | Time spent opening the connection                                              |
| `allThreads`                                | How many threads were running at that moment, which shows the load at the time |
| `threadName`                                | Which thread sent it, e.g. `1 - Create accounts 2-1`                           |

What it's used for:

- **Building the HTML report.** `-e -o report` builds it at the end of a run, and
  [Rebuild a report](#rebuild-a-report-from-an-existing-results-file) builds it again later from the same file.
- **Looking at single requests.** Sort by `elapsed` to find the slowest ones, or filter on `success` = `false` to see
  what failed and when.
- **Comparing runs.** Keep the file from each run, e.g. before and after a change to the API. Because the commands use
  `-f`, a run overwrites the file with the same name, so copy or rename the ones you want to keep.

It doesn't contain passwords or tokens. The `URL` column does include the Firebase API key, but that key isn't secret
(the web app sends it to every browser), and `results/` is git-ignored anyway.

### The HTML report

- **Check the run matches what you asked for.** In the **Statistics** table, `#Samples` should fit the threads and
  duration you used, e.g. 100 sign-up samples for 100 threads.
- **Error %** shows the share of failed requests per label. Any failures in `SETUP |` rows mean fewer accounts, and so
  less load, than intended.
- **Response times:** _Average_ can hide slow outliers. The **90th/95th/99th pct** columns show the time that
  90/95/99% of requests finished within.

### errors.xml

Holds only the failed requests, each with the response body that shows why it failed. Unlike the `.jtl`, which `-f` replaces, it
**adds to itself on every run**, so delete it before a run if you only want that run's errors.

---

## Automated runs (GitHub Actions)

Two GitHub Actions workflows run the plan automatically. Both run the same steps, kept in
`.github/workflows/load-test.yml`, with different settings:

|                 | Smoke test                                                                                                                                           | Full test                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Workflow        | `load-smoke-test.yml`                                                                                                                                | `load-full-test.yml`                                                                  |
| Runs when       | A pull request into `main` changes API-related files: `backend/api/`, `backend/shared/`, `common/src/api/`, `tests/load/` or the load test workflows | Every Monday at 06:00 UTC                                                             |
| Size            | 3 threads for 30 seconds                                                                                                                             | 100 threads for 120 seconds                                                           |
| Passes when     | No request fails, and the p95 of `TEST \|` requests is at most 2000 ms                                                                               | At most 1% of each request fails, and the p95 of `TEST \|` requests is at most 800 ms |
| Report artifact | `load-smoke-report`                                                                                                                                  | `load-full-report`                                                                    |

You can also start either one by hand: open the **Actions** tab, pick the workflow and click **Run workflow**.

> **They test the API deployed to dev, not the pull request's code.** Nothing deploys to dev automatically: dev
> only changes when someone runs `./deploy-api.sh dev` in `backend/api/`. To load test a change, deploy it to dev
> first, then start the smoke or full test by hand.

### What a run does

1. Installs JMeter (cached between runs) and checks the download against Apache's SHA-512 checksum.
2. Makes a fresh `accounts.csv` with one account per thread, each with a random password. The run's ID and attempt
   number make every account unique, including when a failed run is re-run. The committed `accounts.csv` isn't used.
3. Runs the plan with the workflow's size, and builds the HTML report.
4. Checks the results with [check_results.py](#check_resultspy). This step fails the run when a limit is broken.
5. If JMeter didn't finish (it crashed, or the run was cancelled or timed out), runs [Cleanup only](#cleanup-only),
   so the accounts don't stay on dev.
6. Uploads the report, the results, `errors.xml` and the logs. To get them, open the run in the **Actions** tab and
   download the artifact under **Artifacts**.

Only one load test runs at a time, because two tests on the same dev API would skew each other's results. A run that
starts while another is going waits for it to finish; if several are waiting, only the newest one runs.

The full test's 100 threads match Firebase's limit of 100 new accounts per hour from one IP address. To use more,
raise the sign-up quota in the Firebase console first.

To change a workflow's size or limits, edit the values under `with:` in `load-smoke-test.yml` or
`load-full-test.yml`.

### check_results.py

JMeter exits as if all went well even when requests fail, so CI needs something else to decide pass or fail.
`tests/load/check_results.py` reads a results file and checks two limits for each request label:

- **Error rate**, for every request: `SETUP |`, `TEST |` and `TEARDOWN |`. A failed setup request means less load than
  asked for, and a failed cleanup request leaves accounts behind on dev.
- **p95 response time**, for `TEST |` requests only, because setup and cleanup times aren't what the test measures.
  It's only checked when a label has at least 20 samples, since fewer is too little to judge.

It also fails when there are no `TEST |` results at all, which means no accounts were created.

You can run it on a local run's results too, from `tests/load/` (on Windows, use `python` instead of `python3`):

```bash
python3 check_results.py results/results.jtl --max-error-rate 1 --max-p95 800
```

It prints each request's sample count, error rate and p95, then either `PASS` or one `FAIL:` line per broken limit.
It exits with `0` for a pass and `1` for a fail. Without the options, the limits are 1% errors and 800 ms.

---

## Troubleshooting

### Sign-up fails with `EMAIL_EXISTS`

A previous run didn't finish cleaning up, so accounts from `accounts.csv` still exist.

- If `created_accounts.txt` still lists them, run [Cleanup only](#cleanup-only).
- If it doesn't (every run empties it at the start), rebuild it from `accounts.csv`, then run
  [Cleanup only](#cleanup-only). Cleanup signs in again with each email and password, so the token column can be any
  text:

  ```bash
  awk -F, '{print $1 "|" $2 "|x|" $4}' accounts.csv > created_accounts.txt
  ```

  ```powershell
  Import-Csv accounts.csv -Header email,password,username,name | ForEach-Object { "$($_.email)|$($_.password)|x|$($_.name)" } | Set-Content -Encoding ascii created_accounts.txt
  ```

  Accounts that no longer exist just show up as failed `TEARDOWN |` requests.

Don't delete the accounts in the Firebase console instead. That only removes the Firebase login. The app user stays in
the database, and nothing warns you: the next run still works, because the API quietly gives the new accounts
different usernames, so the leftover users pile up.

### Fewer load test threads than expected

`created_accounts.txt` has fewer lines than the test has threads, so some threads stop right away. Check the `SETUP |`
rows in the results for failures. Also make sure `setupThreads` is high enough (see [Properties](#properties)), and
that `accounts.csv` has enough rows.

### `/me` requests fail the JSON Assertion

The `name` the API returned doesn't match the one in `accounts.csv`. The API cleans names when it saves them, so a
name with emoji, symbols, double spaces or more than 30 characters comes back changed. Fix the names (see the
[name rules](#format)) and run again.

### `${something}` appears literally in a request

The variable was never set. Common causes:

- The name is spelled differently (names are case-sensitive).
- The element that sets it is out of scope (e.g. it's in another thread group).
- The extractor found nothing.

Enable **View Results Tree** and run a smoke test in the GUI to see the actual requests sent. To see every variable a
thread holds, also enable the [Debug Sampler](#debug-sampler).

### Report folder error

JMeter won't write a report into a folder that isn't empty. Add `-f`, or delete the report folder first.
