Git stash has a handful of solid use cases, and a few map directly onto your multi-process workflow.

**General use cases**

- **Context switching mid-work**: you're mid-edit, need to check out another branch (fix a bug, review a PR), and don't
  want to commit half-finished work. Stash it, switch, come back, pop it.
- **Pulling without conflicts**: you have local changes but need `git pull` to get a clean fast-forward. Stash, pull,
  pop.
- **Testing on a clean tree**: stash everything to see if a bug still reproduces without your changes, or to run a
  build/test suite against the unmodified codebase.
- **Experimenting safely**: try something risky, and if it doesn't work, `git stash drop` instead of manually reverting.
- **Moving work to another branch**: `git stash branch new-branch-name` creates a new branch from a stash — useful when
  you realize mid-change that you're on the wrong branch.

**More surgical options** (these are probably the useful ones for you):

- `git stash push -- <file1> <file2>` — stash only specific files, leaving the rest of your working directory untouched.
- `git stash push -p` — interactively pick hunks to stash, like `git add -p` but in reverse.
- `git stash push -m "message"` — name your stashes so `git stash list` is legible when you have several.
- `git stash apply` vs `git stash pop` — apply keeps the stash around (good if multiple things might need it), pop
  removes it after applying.
- `-u` / `-a` flags to also stash untracked/ignored files.

**Where this fits your setup**: since you're running multiple Claude processes on different tasks in the same working
tree, the risk is that one task's edits touch a file another task also needs to touch, or that you want to
test/build/commit task A in isolation while task B's files are still half-done and would break the build if included.
`git stash push -- <files for task B>` lets you temporarily "hide" task B's in-progress files, leaving a working tree
with only task A's changes — build, test, commit, then `git stash pop` to bring task B's edits back. It's a nice
complement to your current approach of selectively `git add`-ing files, because `add` controls what goes into the
_commit_, while stash controls what's actually present in the _working directory_ — which matters if a build or test run
would otherwise pick up unfinished files.

One gotcha worth knowing: stash is a single shared stack (`git stash list`) by default, so if you're juggling several
tasks at once, use `-m` messages to keep track of which stash belongs to which task, or consider `git worktree`
instead — it gives each parallel task its own physical working directory tied to the same repo, so you don't need to
stash/pop between them at all. That might actually solve the multi-process problem more cleanly than stash does,
depending on how isolated you need each task to be.
