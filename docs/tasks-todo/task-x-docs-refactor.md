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

### Step 1: Generate full summary of changes made on this branch

Look at the changes we have made to this template on this branch (ie since a144ce2b766e86a68d51d79bdcbc4a0acc474815). We are most interested in additions and changes to the structure and design patterns and new "good practice" stuff. We have done a lot more on this branch than I can remember myself, but some of the major things we have added are:

- [x] Basic cross platform support
- [x] Add Tauri-specta
- [x] Add static analysis tooling (react compiler, knip, jscpd etc)
- [x] Add Global Shortcut and quick pane
- [x] Add other useful Tauri plugins
- [x] Add internationalisation
- [x] Review and Rework CSS & add better shadcn theme
- [x] Full review of codebase with many small refactors and improvements

This summary should be written to a file in the root of the project, And will be used in subsequent tasks to help us rewrite the documentation.

### Step 2 - Review currrent developer docs and create plan for improving them

Review all docs currently in `docs/developer/` in the context of the changes we have made. and come up with a plan for how to improve or update these documents. Before we actually make changes to these, let's get the plan together and iterate to make any decisions necessary. Once we have a plan, we should write that plan out to an appropriate place in this task document.

### Step 3 - Rework the developer docs

rework and review the developer docs in accordance with the plan.

### Step 4 - Review new developer docs

- [ ] Pass 1: Review with critical eye. Anything that is clearly incorrect or wrong.
- [ ] Pass 2: Review for consistency with actual codebase patterns.
- [ ] Pass 3: Review for "evergreenness" - There should be no references to "this template" etc. It should be "This app". In some cases it may be helpful to include notes for humans and AI agents at the top of some of these to remind them to update these documents in certain circumstances. But we don't want to go overboard on this.
- [ ] Pass 4: review for possible additions - things wwhich are NOT in the codebase, but we know to be important when building out features in the future.
- [ ] Pass 5: Lightweight review for improved token efficiency, formatting, consistency, spelling errors etc.

### Step 5 - Getting started guide

Rename GETTING_STARTED.md to USING_THIS_TEMPLATE.md. This is the only document in this template which is specifically about the template. The expectation is that this file will be removed fairly early on in projects built on the template. It should probably include:

- [ ] Background
- [ ] Steps to create a new project on this template and customise / initialise
- [ ] Example workflow for adding new features with an AI agent:
  - Ask AI to read the relevant docs, code and plan a feature. Iterate as needed and write the file to `docs/tasks-todo`
  - Implement the feature, running `npm check:all` periodically
  - When finished, run `/check` , ask AI to update any relevant developer documentation and the userguide, and then `pnm task complete` to move the task doc to `docs/tasks-done`
- [ ] Setting up builds with GH Actions - should include the stuff in SECURITY_PRODUCTION.md

This step should also include a refactoring of the init claude command, which should be used to help with project setup.

### Step 6 - Simplify Claude commands and Agents

We have a number of clawed agents and commands. We should carefully review these for usefulness and effectiveness. Um particularly with the agents, it probably makes more sense to have them be a little more task focused and less role focused. We will do this iteratively.

### Step 7 - Review other docs

- [ ] Review other docs in `docs/` (SECURITY.md etc)
- [ ] Review userguide
- [ ] Move contents of CLAUDE.md to AGENTS.md and reference in CLAUDE.md. Remove cursor bridge and GEMINI.md (both read AGENTS.md automatically). Review and update AGENTS.md.
- [ ] Rewrite README.md to explain the features of this template and point to the getting-started guide. The readme file is almost like the poster for this project on GitHub. So it should be short. And the expectation is that people building new projects on this are going to completely replace the readme file with their own for their project.

### Step 8 - Final review

A final review of all of the documentation in the context of the project, looking for any errors, problems, things which haven't been updated or aren't coherent. So that this whole piece acts as a coherent system. This should also involve the removal of any task docs both completed and incomplete.
