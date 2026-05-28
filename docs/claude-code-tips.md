Here's a comprehensive guide to using Claude Code effectively for a large web app with a backend:

---

## 🏗️ Project Setup

**Use `CLAUDE.md` files — they're foundational.** Run `/init` to generate a starter `CLAUDE.md` based on your current
project structure, then refine it over time. It's a special file Claude reads at the start of every conversation.

For a fullstack project, go further: use more than one `CLAUDE.md` file — keep a general one in your project root, and
add more specific ones in sub-folders like `/frontend` or `/backend` to give Claude focused context where it's needed.

Keep `CLAUDE.md` lean — include bash commands, code style rules, test runners, branching conventions, and architectural
decisions. Cut anything Claude can figure out from the code itself.

---

## 📋 Plan Before You Code

Letting Claude jump straight to coding can produce code that solves the wrong problem. Use **plan mode** to separate
exploration from execution. The four-phase workflow:

1. **Explore** — enter plan mode, have Claude read your `src/auth`, `src/api`, DB layer, etc.
2. **Plan** — ask Claude for a detailed implementation plan with file-level changes
3. **Implement** — switch out of plan mode and let it code, running tests along the way
4. **Commit** — ask Claude to write a descriptive commit and open a PR

For big features: have Claude interview you first using the `AskUserQuestion` tool. Ask about technical implementation,
UI/UX, edge cases, and tradeoffs. Once the spec is complete, start a fresh session to execute it — the new session has
clean context focused entirely on implementation.

---

## ✅ Give Claude Ways to Verify Its Work

This is the single highest-leverage thing you can do. Without clear success criteria, Claude might produce something
that looks right but doesn't actually work — and you become the only feedback loop.

Practical patterns for a web app:

- Provide test cases when asking for a function
- Paste a screenshot when changing UI, ask Claude to compare and fix differences
- For backend bugs: `"write a failing test that reproduces the issue, then fix it"`

---

## 🧠 Manage Context Aggressively

Claude's context window fills fast — a single debugging session can consume tens of thousands of tokens, and performance
degrades as it fills. This is the most important resource to manage.

Key habits:

- **`/clear`** between unrelated tasks (switching from backend API work to frontend styling = clear)
- After two failed corrections on the same issue, `/clear` and start fresh with a better prompt
- **Use subagents** for investigation: `"Use subagents to investigate how our auth system handles token refresh"` — they
  explore in a separate context and report back summaries, keeping your main window clean
- **`/compact`** when you need to summarize a long session: `/compact Focus on the API changes`

---

## 🔧 Leverage the Toolchain

CLI tools are the most context-efficient way to interact with external services. Install `gh` for GitHub — Claude knows
how to use it for creating issues, opening PRs, and reading comments. Claude is also effective at learning CLI tools it
doesn't know: try `"Use 'foo-cli-tool --help' to learn foo, then use it to solve X."`

**Connect MCP servers** for your stack: run `claude mcp add` to connect tools like your database, Notion, Figma, or
monitoring service — so Claude can query your DB, read designs, or analyze logs directly.

**Set up hooks** for non-negotiable rules: hooks run scripts automatically at specific points in Claude's workflow —
unlike `CLAUDE.md` instructions which are advisory, hooks are deterministic. Try:
`"Write a hook that runs eslint after every file edit."`

---

## ⚡ Scale with Parallel Sessions

For a large project, don't just work sequentially. Use a **Writer/Reviewer** pattern: Session A implements a feature,
Session B reviews the code for edge cases and race conditions with a fresh context (since Claude won't be biased toward
code it just wrote).

For large migrations: loop through files calling `claude -p` for each — test on 2–3 files first, refine the prompt, then
run at scale. Use `--allowedTools` to restrict what Claude can do during unattended runs.

---

## 🚫 Common Mistakes to Avoid

| Mistake                                          | Fix                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| "Kitchen sink" sessions — mixing unrelated tasks | `/clear` between tasks                                              |
| Correcting the same issue 3+ times               | `/clear` + rewrite the prompt                                       |
| Bloated `CLAUDE.md` that Claude ignores          | Prune ruthlessly — if Claude already does it right, delete the rule |
| Trusting output without verification             | Always run tests or visual checks before shipping                   |
| Asking Claude to "investigate" without scope     | Scope narrowly, or use subagents                                    |
