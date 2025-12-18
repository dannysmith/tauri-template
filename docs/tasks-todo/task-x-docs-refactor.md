# Task: Docs Refactor

Goal: Rework the markdown documentation to improve, simplify and incorporate all the new stuff we've included in this project recently.

## Background

This is a template application which is intended for people to use as a base when building new Tauri applications. It's specifically designed to help AI coding agents like Claude Code get off to a good start when building apps. All of the files bar README.md and GETTING_STARTED.md are intended to be "evergreen" in the apps built on this system. This includes the markdown documentation. While the developer documentation describes the patterns already present in this template, and provide guidance to AI agents and humans on how to build performant effective and well architected Tauri apps, The developer documentation is also intended to be expandable as people build their own applications on top of this, the expectation is that they will update the developer documentation accordingly so that it remains accurate documentation for **their** system.

The documentation can generally be grouped into the following categories:

1. `docs/developer/` - detailed developer documentation describing patterns and best practices. should be readable by humans, but its main intent is to be loaded by AI agents through progressive disclosure, or by the user saying things like "check this work meets `docs/developer/performance-patterns.md` etc.
2. `docs/userguide/` - a template user guide for people to iterate on as they add new features to their applications they're building.
3. Documents like `CONTRIBUTING.md` and `SECURITY.md` - Template documents which are here to provide a good starting point boilerplate in open source projects. We can think of these as being very similar to many of the code files in this regard.
4. AI-only files like `CLAUDE.md` and the agents and commands in `.claude/` - These are intended to be read and used only by AI tools.

## Rules

### Rules for Developer Docs

- No stupid, unnecessary checklists. AI has a tendency to put these all over the place.
- Example code should be as minimal as possible to demonstrate the key point or pattern. And where possible, it should be reflective of the actual application code.
- Wherever possible we should avoid making developer docs brittle by including detailed impl implementation details which don't matter.
- Where other documentation exists that's very relevant in a certain section, we should cross link to those.
- Wherever possible, we should try to be token efficient with these docs. You'll see there are currently some patterns to help with this, such as using tables, using "❌" and "✅" To demonstrate incorrect and correct examples. However, token efficiency should never come at the cost of making documentation readable to humans.
- Assume that AI agents using these docks have knowledge of the languages and libraries in use. No need to teach them to suck eggs. But equally it's important to give them guidance on certain things they're likely to get wrong because their training data includes old or bad practives etc. Assume AI agents also have access to the entire codebase.

### Rules for other docs

- Keep these as minimal and simple as possible. They're going to be read by humans, so they should read like they have been written by humans.
- lean on standard structures and formats wherever possible.

## Tasks

### Step 1: Generate full summary of changes made on this branch [DONE]

**Output:** `/BRANCH_CHANGES_SUMMARY.md`

Look at the changes we have made to this template on this branch (ie since a144ce2b766e86a68d51d79bdcbc4a0acc474815). We are most interested in additions and changes to the structure and design patterns and new "good practice" stuff. We have done a lot more on this branch than I can remember myself, but some of the major things we have added are:

- [x] Basic cross platform support
- [x] Add Tauri-specta
- [x] Add static analysis tooling (react compiler, knip, jscpd, ast-grep etc)
- [x] Add Global Shortcut and quick pane
- [x] Add other useful Tauri plugins
- [x] Add internationalisation
- [x] Review and Rework CSS (minor changes)
- [x] Full review of codebase with many small refactors and improvements

This summary should be written to a file in the root of the project, And will be used in subsequent tasks to help us rewrite the documentation. You may find some of the comments in https://github.com/dannysmith/tauri-template/pull/9 Helpful. You might also find some of the task documents added in 5437bf70195ec7bab10f3fd78356113992246051 to be helpful, although not all of these tasks were actually completed and some of the contents of them ended up being changed significantly as we decided to change our approach as we developed stuff.

### Step 2 - Review currrent developer docs and create plan for improving them [DONE]

Review all docs currently in `docs/developer/` in the context of the changes we have made. and come up with a plan for how to improve or update these documents. Before we actually make changes to these, let's get the plan together and iterate to make any decisions necessary. Once we have a plan, we should write that plan out to an appropriate place in this task document.

### Step 3 - Rework the developer docs [DONE]

Rework and review the developer docs in accordance with the plan below

##### Final Structure (19 docs)

```
docs/developer/
├── README.md                   # Index of all docs (NEW)
├── architecture-guide.md       # Quick reference for critical patterns
├── rust-architecture.md        # Rust backend organization (NEW)
├── state-management.md         # State onion + Zustand patterns
├── command-system.md           # Command system
├── keyboard-shortcuts.md       # Shortcuts
├── menus.md                    # Native menus
├── ui-patterns.md              # CSS + shadcn
├── i18n-patterns.md            # Internationalization
├── notifications.md            # Toast + native notifications
├── tauri-commands.md           # tauri-specta
├── tauri-plugins.md            # Plugin overview
├── quick-panes.md              # Multi-window
├── cross-platform.md           # Platform-specific
├── data-persistence.md         # File storage
├── releases.md                 # Release process + auto-updates
├── bundle-optimization.md      # Bundle size
├── static-analysis.md          # All linting tools usage (NEW)
├── writing-ast-grep-rules.md   # AI reference for rule creation (NEW)
├── testing.md                  # Testing patterns
└── logging.md                  # Logging
```

##### Structural Changes

| Action     | Document                    | Details                                                                   |
| ---------- | --------------------------- | ------------------------------------------------------------------------- |
| MERGE INTO | `architecture-guide.md`     | Absorbs `architectural-patterns.md` (pattern dependencies, anti-patterns) |
| MERGE INTO | `state-management.md`       | Absorbs `performance-patterns.md` (getState pattern)                      |
| MERGE INTO | `releases.md`               | Absorbs `auto-updates.md`                                                 |
| CREATE     | `README.md`                 | Index grouping docs by category                                           |
| CREATE     | `rust-architecture.md`      | Rust module organization, expandable for future                           |
| CREATE     | `static-analysis.md`        | All tools: ESLint, Prettier, ast-grep, knip, jscpd, React Compiler        |
| CREATE     | `writing-ast-grep-rules.md` | AI-focused rule writing guide                                             |
| DELETE     | `architectural-patterns.md` | Content merged into architecture-guide.md                                 |
| DELETE     | `performance-patterns.md`   | Content merged into state-management.md                                   |
| DELETE     | `auto-updates.md`           | Content merged into releases.md                                           |
| DELETE     | `ast-grep-linting.md`       | Split into static-analysis.md and writing-ast-grep-rules.md               |

##### Content Guidelines

**Remove from all docs:**

- "Future Enhancements" sections (speculative)
- "Related Documentation" footer sections (use inline links instead)
- Extensive "Troubleshooting" sections (keep only critical gotchas)
- Redundant library explanations (AI knows Zustand/React Query)
- Large code blocks duplicating the actual codebase

**Keep/Add:**

- ✅/❌ pattern examples (prescriptive, scannable)
- "Adding X" sections where pattern isn't obvious from code
- Inline links to related docs
- Tables for comparing options
- Brief "why" for non-obvious decisions

##### Streamlining Targets

| Document                 | Current | Target | Main Cuts                                           |
| ------------------------ | ------- | ------ | --------------------------------------------------- |
| `testing.md`             | 528     | ~250   | Remove boilerplate examples, focus on Tauri mocking |
| `data-persistence.md`    | 472     | ~200   | Trim Rust impl details, pattern-focus               |
| `bundle-optimization.md` | 435     | ~200   | Remove speculative "Advanced Techniques"            |
| `menus.md`               | 391     | ~200   | Remove "Future Enhancements", trim examples         |
| `releases.md` (merged)   | 586     | ~300   | Merge smartly, remove redundancy                    |
| `keyboard-shortcuts.md`  | 324     | ~180   | Reference state-management.md for getState          |
| `i18n-patterns.md`       | 313     | ~200   | Trim, more tables                                   |
| `quick-panes.md`         | 274     | ~200   | Trim implementation details                         |

##### Implementation Order

**Phase 1: Structural changes**

1. Create `docs/developer/README.md` (index)
2. Create `rust-architecture.md`
3. Create `static-analysis.md`
4. Create `writing-ast-grep-rules.md`
5. Merge `architectural-patterns.md` → `architecture-guide.md`
6. Merge `performance-patterns.md` → `state-management.md`
7. Merge `auto-updates.md` → `releases.md`
8. Delete source files after merges

**Phase 2: Streamline each doc**
Apply guidelines to each remaining doc:

- Remove specified content types
- Convert to inline links
- Add prescriptive ✅/❌ where missing
- Fix "this template" → "this app"

### Step 4 - Review new developer docs [DONE]

- [x] Pass 1: Review with critical eye. Anything that is clearly incorrect or wrong.
- [x] Pass 2: Review for consistency with actual codebase patterns.
- [x] Pass 3: Review for "evergreenness" - There should be no references to "this template" etc. It should be "This app". In some cases it may be helpful to include notes for humans and AI agents at the top of some of these to remind them to update these documents in certain circumstances. But we don't want to go overboard on this.
- [x] Pass 4: review for possible additions - things wwhich are NOT in the codebase, but we know to be important when building out features in the future.
- [x] Pass 5: Lightweight review for improved token efficiency, formatting, consistency, spelling errors etc.

### Step 5 - Getting started guide & init command [DONE]

Rename GETTING_STARTED.md to USING_THIS_TEMPLATE.md. This is the only document in this template which is specifically about the template. The expectation is that this file will be removed fairly early on in projects built on the template. It should probably include:

- [x] Background
- [x] Steps to create a new project on this template and customise / initialise
- [x] Example workflow for adding new features with an AI agent:
  - Ask AI to read the relevant docs, code and plan a feature. Iterate as needed and write the file to `docs/tasks-todo`
  - Implement the feature, running `npm check:all` periodically
  - When finished, run `/check` , ask AI to update any relevant developer documentation and the userguide, and then `pnm task complete` to move the task doc to `docs/tasks-done`
- [x] Setting up builds with GH Actions - should include the stuff in SECURITY_PRODUCTION.md

This step should also include a refactoring of the init claude command, which should be used to help with project setup.

### Step 6 - Simplify Claude commands and Agents [DONE]

We have a number of Claude agents and commands. We should carefully review these for usefulness and effectiveness. Um particularly with the agents, it probably makes more sense to have them be a little more task focused and less role focused. LEt's explore this iteratively.

#### Agents

the main advantage of agents is that they have their own context window. So they're very well suited to going off and doing research or exploration and then returning focussed information to the main agent. Here are some agents which I think might actually be useful:

- Implementation Plan checker - when given a task document with an implementation plan as input, it goes off and specifically reads the internal documentation in docs/developer/ and ensures that the given implementation plan is following the correct patterns described in the documentation. It can then return recommendations for changes to the plan to the main agent. Effectively, it's an expert in the documented patterns and architecture of this codebase.
- Developer Documentation Manager - When given a task document as input, it goes and reviews all of the developer documentation and returns details of any updates required as part of the implementation plan. The main agent can then just add these to the end of the task doc. If it's not given a task document as input, it should simply look at all of the developer documentation and make recommendations to the main agent for anything which is out of date or is not ideal. The idea is that this agent can be used to take away some of the work required to keep the developer docs up to date.
- Cleanup-reporter - Rather than having two clawed commands to run knip and review-duplicates, we could create an agent which runs these two commands looks at the code base in the context of the instructions which we currently have in those clawed commands and then returns to the main agent a recommendation for things that we should look at changing which is nicely structured and formatted so that the main agent can just output that to the user this agent could then be used in a more generic /cleanup command.

Regardless, I feel like all of these agents should include information on when they should be used, What their knowledge/personality/skillset is, what input they should expect if any and what output but they should provide to the main agent calling them.

#### Commands

- /check - Checks the current sessions work against important parts of the documentation and runs and fixes any errors. Since this is going to be run just before uh a commit is made, it would also be sensible to have this look at the work that's been done in the current session and recommend a short commit message about that to the user.
- /init - This is only going to be used once to set up the the new project based on this template.
- /cleanup - This could be a command that we just run periodically, which fires off a bunch of agents to check various things and explore the code base uh for potential improvements and then brings all of those things back together. It should probably turn the stuff it finds into a new task document with multiple stages for each thing.

---

#### Final Plan

##### File Changes

```
.claude/
├── commands/
│   ├── check.md              # ENHANCE (add commit message suggestion)
│   ├── init.md               # KEEP
│   ├── cleanup.md            # CREATE
│   ├── knip-cleanup.md       # DELETE
│   └── review-duplicates.md  # DELETE
└── agents/
    ├── cleanup-analyzer.md           # CREATE
    ├── plan-checker.md               # CREATE
    ├── docs-reviewer.md              # CREATE
    ├── userguide-reviewer.md         # CREATE
    ├── codebase-mental-model-documenter.md  # DELETE
    ├── tauri-rust-expert.md          # DELETE
    ├── ui-design-expert.md           # DELETE
    ├── react-architect.md            # DELETE
    └── user-guide-expert.md          # DELETE
```

##### Commands

| Action  | Command              | Details                                                                       |
| ------- | -------------------- | ----------------------------------------------------------------------------- |
| ENHANCE | `/check`             | Add commit message suggestion at end                                          |
| KEEP    | `/init`              | No changes                                                                    |
| CREATE  | `/cleanup`           | Spawns `cleanup-analyzer` agent, presents findings, offers to create task doc |
| DELETE  | `/knip-cleanup`      | Replaced by `/cleanup`                                                        |
| DELETE  | `/review-duplicates` | Replaced by `/cleanup`                                                        |

##### Agents

All agents use consistent structure: Purpose, When to Use, Input, Process, Output Format, Guidelines.

**`cleanup-analyzer`**

- **Purpose:** Run static analysis tools, investigate flagged code, return structured recommendations
- **Process:**
  1. Run `npm run knip` → capture output
  2. Run `npm run jscpd` → capture output
  3. Run `npm run check:all` → capture output
  4. For each issue: read the relevant code to understand context
  5. Categorize findings with confidence levels
  6. Return structured report
- **Does NOT:** Explore codebase for additional problems, make changes, create task docs
- **Output:** Structured markdown with categories (Safe to Remove, Needs Review, Keep As-Is), locations, recommendations, confidence levels

**`plan-checker`**

- **Purpose:** Validate implementation plans against documented architecture patterns
- **Triggered when:**
  - User explicitly asks to check/validate a plan
  - Main agent is asked to "review", "check", or "look over" a task document or implementation plan
- **Process:**
  1. Read the task document/plan being validated
  2. Read ALL docs in `docs/developer/`
  3. Read `CLAUDE.md` for core patterns
  4. For each step, check against documented patterns
  5. Identify: violations, missing steps, anti-pattern risks
- **Output:** Violations found (with fixes), missing steps (with suggestions), recommendations

**`docs-reviewer`**

- **Purpose:** Review developer documentation for accuracy, consistency, and quality
- **References:** `docs/developer/writing-docs.md` for guidelines
- **Single-pass review criteria** (all applied together):
  1. Correctness - anything clearly incorrect or wrong
  2. Codebase consistency - do docs match actual patterns in code?
  3. Evergreenness - no "this template" language; proper tone for evolving app
  4. Completeness - missing guidance for important future features
  5. Quality - token efficiency, formatting, consistency, spelling
- **Process:**
  1. Read `docs/developer/writing-docs.md` for guidelines
  2. Read ALL docs in `docs/developer/`
  3. Sample relevant code to verify described patterns
  4. Apply all 5 criteria in unified analysis
  5. Return structured recommendations
- **Output:** Per-document findings with categorized issues and priority recommendations

**`userguide-reviewer`**

- **Purpose:** Review user guide against actual system features, recommend updates
- **Process:**
  1. Read current `docs/userguide/` content
  2. Explore UI codebase to understand actual features (components, commands, shortcuts)
  3. Cross-reference: what features exist vs what's documented
  4. Identify gaps, outdated content, accuracy issues
  5. Return specific recommendations
- **Tone guidance:** User-centric, clear/engaging writing, active voice, progressive disclosure, completeness with concision
- **Output:** Features not documented, outdated content, accuracy issues, tone/clarity issues, prioritized update recommendations

### Step 7 - Review other docs

- [x] Review other docs in `docs/` (SECURITY.md etc)
- [x] Review userguide
- [ ] Move contents of CLAUDE.md to AGENTS.md and reference in CLAUDE.md. Remove cursor bridge and GEMINI.md (both read AGENTS.md automatically). Review and update AGENTS.md.
- [ ] Rewrite README.md to explain the features of this template and point to the getting-started guide. The readme file is almost like the poster for this project on GitHub. So it should be short. And the expectation is that people building new projects on this are going to completely replace the readme file with their own for their project.

### Step 8 - Final review

A final review of all of the documentation in the context of the project, looking for any errors, problems, things which haven't been updated or aren't coherent. So that this whole piece acts as a coherent system. This should also involve the removal of any task docs both completed and incomplete.
