---
name: check
description: Check work for adherence with architecture, run quality checks, and suggest a commit message. Use after completing work on a feature or bug fix.
user-invocable: true
allowed-tools: [Read, Bash, Glob, Edit]
---

## Execution

1. Check all work in this session for adherence with `docs/developer/architecture-guide.md`.
2. Remove any unnecessary comments or `console.log` statements introduced during development, and clean up any "leftovers" from approaches that didn't work.
3. Run `npm run check:all` and fix any errors.
4. Suggest a concise commit message summarizing the work done in this session.
