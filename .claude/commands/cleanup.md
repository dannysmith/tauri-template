---
allowed-tools: [Task, AskUserQuestion, Write, Read, Bash, Glob, TodoWrite, Edit]
description: 'Run static analysis and get cleanup recommendations'
---

# /cleanup - Cleanup Analysis

## Purpose

Run static analysis tools (knip, jscpd, check:all), get intelligent recommendations for cleanup, and optionally create a task document.

## Usage

```
/cleanup
```

## Execution

1. Spawn the `cleanup-analyzer` agent to run analysis and investigate findings.
2. Present the agent's structured report to the user.
3. Ask the user: "Would you like me to create a task document for these cleanup items?"
4. If yes, create a task document in `docs/tasks-todo/` with the findings organized as actionable steps.
