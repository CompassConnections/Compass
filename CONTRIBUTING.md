# Contributing to This Repository

We welcome pull requests, but only if they meet the project's quality and design standards. Follow the process below precisely to avoid wasting time—yours or ours.

## Prerequisites

- Familiarity with Git and GitHub (basic commands, branching, forking, etc.)
- A functioning development environment
- Node.js, Python, or other relevant runtime/tools installed (check the `README.md`)
- Read the [Development Documentation](docs/development.md) for project-specific setup and guidelines (adding languages,
  profile fields, etc.)

## Fork & Clone

1. **Fork the repository** using the GitHub UI.
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/your-username/Compass.git
   cd your-fork

   ```

3. **Add the upstream remote**:

   ```bash
   git remote add upstream https://github.com/CompassConnections/Compass.git
   ```

## Create a New Branch

Never work on `main` or `master`.

```bash
git checkout -b fix/brief-but-specific-description
```

Use a clear, descriptive branch name. Avoid vague names like `patch-1`.

## Stay Updated

Before you start, make sure your fork is up to date:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

Then rebase your feature branch if needed:

```bash
git checkout fix/your-feature
git rebase main
```

## Make Atomic Commits

Each commit should represent a single logical change. Follow this format:

```text
type(scope): concise description

body explaining what and why, if necessary
```

Example:

```text
fix(api): handle 500 error on invalid payload
```

Types include: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Test Everything

If the project has tests, run them. If it doesn’t, write some. Do **not** submit code that hasn't been tested.

```bash
# Example for Node.js
npm test
```

No exceptions. If you don't validate your changes, your PR will be closed.

## Lint & Format

Ensure code matches the project style. If the repo uses a linter or formatter, run them:

```bash
npm run lint
npm run format
```

Or whatever command is defined in the repo.

## Write a Good Pull Request

When opening a pull request:

- **Title**: Describe what the PR does, clearly and specifically.
- **Description**: Explain the context. Link related issues (use `Fixes #123` if applicable).
- **Checklist**:
    - [ ] My code is clean and follows the style guide
    - [ ] I’ve added or updated tests
    - [ ] I’ve run all tests and they pass
    - [ ] I’ve documented my changes (if necessary)

## Code Review Process

- PRs are reviewed by maintainers or core contributors.
- If feedback is given, respond and push updates. Do **not** open new PRs for changes to an existing one.
- PRs that are incomplete, sloppy, or violate the above will be closed.

## Don't Do This

- Don’t commit directly to `main`
- Don’t submit multiple unrelated changes in a single PR
- Don’t ignore CI/test failures
- Don’t expect hand-holding—read the docs and the source first

## Security Issues

Do **not** open public issues for security vulnerabilities. Email the development team instead.

## License

By contributing, you agree that your code will be licensed under the same license as the rest of the project.
