---
allowed-tools: [Read, Bash, Grep, AskUserQuestion, Edit, Write]
description: 'Find and intelligently review duplicated code using jscpd'
---

# /review-duplicates - Intelligent Duplicate Code Review

## Purpose

Use jscpd to find duplicated code, then categorize and present for manual review.

**Philosophy**: Duplicate code analysis is contextual. This provides categorization and recommendations, but ALL refactoring is manual and user-approved.

## Execution Steps

### 1. Run jscpd

```bash
npm run jscpd
```

### 2. Parse Results

```bash
cat jscpd-report/jscpd-report.json
```

### 3. Categorize Each Duplicate

**By Type:**

- **Business Logic** - Algorithms, data processing (high priority)
- **Component Patterns** - React patterns (might be intentional)
- **Utility Functions** - Helpers (medium priority)
- **Type Definitions** - Interfaces (often intentional)
- **Setup/Config** - Initialization (low priority)

**By Risk:**

- **High** (>15 lines business logic, complex conditionals)
- **Medium** (10-15 lines utilities, transformations)
- **Low** (<10 lines, patterns, boilerplate)

### 4. Present Findings

```markdown
# Duplicate Code Review

Found X duplicates across Y files

## High Priority - Business Logic

### Duplicate #1: [Name]

- **Type**: Business Logic
- **Risk**: High
- **Lines**: X lines (Y tokens)
- **Locations**:
  - `path/file1.ts:10-25`
  - `path/file2.ts:30-45`
- **Code Preview**: [snippet]
- **Recommendation**: Extract to shared function
- **Confidence**: X%

## Low Priority - Likely Intentional

### Duplicate #N: [Name]

- **Analysis**: Intentional pattern for [reason]
- **Recommendation**: Keep as-is
```

### 5. Interactive Review

For High/Medium risk, use AskUserQuestion:

```typescript
{
  questions: [
    {
      question: 'Should we refactor this duplicate?',
      header: 'Refactor?',
      options: [
        { label: 'Yes, extract now', description: 'Create shared function' },
        { label: 'Keep as-is', description: 'Intentional duplication' },
      ],
    },
  ]
}
```

### 6. Refactor If Approved

1. Read both locations for full context
2. Design extraction (name, params, location)
3. Present plan for approval
4. Execute refactoring
5. Run `npm run check:all`

### 7. Cleanup

```bash
rm -rf jscpd-report
```

## When to Keep Duplicates

- shadcn/ui patterns (consistency)
- Test setup (isolation)
- Type definitions (decoupling)
- <10 lines simple patterns
- Rust error handling idioms

## When to Extract

- Business logic >15 lines
- Appears 3+ locations
- Complex algorithms
- Data transformation pipelines
