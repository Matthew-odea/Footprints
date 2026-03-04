# Lessons Learned - Development Process Guide

This document captures key process lessons from the Footprints project development. It's designed to help future developers (including AI agents) avoid common pitfalls.

**Date**: 2026-03-04  
**Focus**: Process discipline, not technical specifics

---

## 1. Dependency Versioning: Never Assume Training Data is Current

### What happened
Selected versions (Expo 54, React 18.3.1, FastAPI 0.116.0) without verifying against official compatibility matrices. Assumed versions from training cutoff date were appropriate.

### The problem
- Used loose `>=` version bounds in backend (`fastapi>=0.116.0`), creating reproducibility risk
- Backend dependencies were 6-8 months outdated (boto3 from Jan 2024)
- Frontend test tools were one major version behind SDK (babel-preset-expo 55 for SDK 54)
- This meant: "Works on my machine" bugs, unpredictable CI/CD behavior, potential security gaps

### Process lesson
✅ **Always verify dependencies against official compatibility matrices**, not training data:
- Fetch official docs (npm registry, PyPI, GitHub releases)
- Check release dates—not cutoff dates
- Pin exact versions for production packages
- Create a versioning strategy document at project start
- Review dependencies monthly for security updates

### For future work
Before selecting any major dependency:
1. Visit official GitHub releases page
2. Check release date (is it recent?)
3. Review compatibility notes (what versions does it support?)
4. Pin exact versions (`==` in Python, exact semver in npm)
5. Document why that version was chosen

---

## 2. Tool CLI Syntax: Documentation First, Never Assume

### What happened
Used `eas build --distribution preview` when the correct flag was `--profile preview`. Assumed naming conventions matched across tools—they don't.

### The problem
- Wrong syntax broke the GitHub Actions workflow immediately
- Required extra debugging cycle to discover flag name
- Workflow failed silently with unhelpful error message

### Process lesson
✅ **Always check tool documentation before generating commands**:
- Don't assume CLI flags exist or work a certain way
- Different tools have different conventions (some use `--profile`, others use `--distribution`)
- Generated commands should be tested locally first
- Keep CLI references handy (bookmark official docs)

### For future work
Before writing automation (GitHub Actions, Makefiles, scripts):
1. Test the command locally first
2. Verify output matches expectations
3. Check `--help` output for correct flag names
4. Copy-paste from official examples, don't improvise
5. Comment the command with where to find docs if it changes

---

## 3. Configuration File Schemas: Always Validate Against Official Schema

### What happened
Created `eas.json` with `"builds"` when the schema requires `"build"` (singular). Didn't validate the structure against EAS documentation.

### The problem
- Workflow broke with cryptic error: `"builds" is not allowed`
- Required guessing and trial-and-error to fix
- If caught early, would have been 30-second fix

### Process lesson
✅ **Always reference official schema when creating config files**:
- Every tool publishes its configuration schema (usually in docs or a JSON schema file)
- Validate structure before committing
- Use IDE schema validation if available (VS Code can validate against published schemas)
- Don't invent field names—check docs

### For future work
Before creating any config file (eas.json, tsconfig.json, pyproject.toml, etc.):
1. Find official schema documentation
2. Copy structure from official example
3. Enable IDE schema validation if available
4. Validate locally before pushing changes
5. Keep a reference comment linking to docs

---

## 4. GitHub Actions Permissions: Understand Token Scope Limitations

### What happened
Tried to post commit comments in GitHub Actions but got "Resource not accessible by integration" error. The default GITHUB_TOKEN couldn't write to commit comments on `push` events (only on PRs).

### The problem
- GitHub Actions token has context-specific permissions
- `push` events can't write commit comments (permission denied)
- `pull_request` events can write to PR comments
- This difference isn't obvious without testing

### Process lesson
✅ **Always test GitHub Actions steps with actual authentication**:
- Don't assume GitHub Actions tokens have broad permissions
- Different events (push vs PR) have different token scopes
- Test workflow logic locally before pushing
- Fallback gracefully when operations are denied
- Document which operations work with which events

### For future work
For any GitHub Actions that modify repo state:
1. Check GitHub Actions documentation for token scopes
2. Test with actual permissions (not just assume)
3. Add error handling for permission failures
4. Restrict modifications to events where permissions exist (e.g., only comment on PRs)
5. Log what failed so user can debug

---

## 5. Project Structure: Verify Before Running Commands

### What happened
Tried `npm install` from repo root without checking package.json location. Monorepo structure has package.json only in `apps/mobile/` and `services/api/`, not root.

### The problem
- Command failed silently with "Could not find package.json"
- Didn't check workspace structure before running package manager
- Required user to manually cd into correct directory

### Process lesson
✅ **Always map project structure before writing setup commands**:
- Run `ls -la` or equivalent to see actual files
- Find where package.json and pyproject.toml are located
- Monorepos are common—don't assume flat structure
- Document the structure in README or workspace map

### For future work
At project start:
1. List directory structure: `find . -maxdepth 2 -type f -name "package.json" -o -name "pyproject.toml"`
2. Document where each package manager file lives
3. Create workspace navigation shortcuts
4. Always specify full paths in automation (e.g., `cd apps/mobile && npm install`)
5. Test paths locally before adding to CI/CD

---

## 6. Package Manager Permissions: Consider Local vs Global Installation

### What happened
Tried `npm install -g eas-cli` (global) on a machine without `sudo` permissions. Failed with EACCES error. Should have installed locally as dev dependency.

### The problem
- Global npm packages require elevated permissions
- Local dev dependencies are safer and more portable
- Didn't consider that CI/CD and local machines might have permission differences

### Process lesson
✅ **Default to local/dev dependencies in projects**:
- Global tools make setup fragile and machine-dependent
- Dev dependencies are portable and reproducible
- CI/CD systems rarely have global package permissions
- Use local dependencies even for build tools

### For future work
When adding build/CLI tools:
1. Prefer local dev dependency: `npm install --save-dev eas-cli`
2. Run via npx: `npx eas init`
3. Only use global packages for user convenience (not CI/CD)
4. Document in README how to "run eas init"
5. Add eas-cli to .gitignore if node_modules is excluded

---

## 7. Tool Initialization: Always Follow Setup Checklists

### What happened
Tried building with EAS before running `eas init`. EAS requires project initialization (creates project ID, links to Expo account) before builds work.

### The problem
- Didn't check if EAS needed initialization
- Error message was helpful, but added an extra cycle
- Could have been prevented by reading EAS getting-started docs

### Process lesson
✅ **Every tool has required initialization—check first**:
- Most build systems require setup (eas init, terraform init, etc.)
- Read the "Getting Started" section before using a tool
- Build initialization into automation, not after failure
- Create a setup checklist and verify each step works

### For future work
For any new tool/service:
1. Read official "Getting Started" guide first
2. Check "Prerequisites" section
3. Follow "Installation" steps completely
4. Note any required initialization commands
5. Test locally before adding to CI/CD
6. Document the full setup sequence in README

---

## 8. Version Management: Reproducibility is a First-Class Concern

### What happened
Backend had loose dependency bounds (`>=`) which means different machines install different versions. This is a common cause of "works on my machine" bugs and CI/CD surprises.

### The problem
- `boto3>=1.39.0` could resolve to 1.39, 1.50, 1.68, etc. depending on when installed
- Different developers might have different semver interpretations
- Production could have versions never tested locally
- Security patches might inadvertently introduce breaking changes

### Process lesson
✅ **Make reproducibility a first-class concern from day one**:
- Pin exact versions for production packages
- Use lockfiles (package-lock.json, requirements.lock)
- Never use loose bounds like `>=` or `~` for core dependencies
- Automate versioning reviews (monthly checking for updates)
- Document version selection rationale

### For future work
At project start, establish versioning policy:
1. Create `docs/versioning-strategy.md` explaining the approach
2. Use exact pinning for core packages
3. Generate and commit lockfiles
4. Set calendar reminder for monthly dependency review
5. Document how to safely update dependencies

---

## 9. Testing Generated Code: Don't Trust Output Without Validation

### What happened
Generated configuration files and commands without testing them. Multiple iterations were needed because assumptions about syntax/schema were wrong.

### The problem
- Generated `eas.json` without validating structure
- Generated GitHub Actions without testing locally
- Each mistake forced a wait for next build cycle
- Wasted time on obvious mistakes

### Process lesson
✅ **Always test generated code before committing**:
- If generating config, validate against schema first
- If generating commands, test locally before CI/CD
- Assume you will be wrong—build in verification steps
- Fail fast locally, not in CI/CD

### For future work
When generating any code/config:
1. Validate syntax (JSON validator, YAML validator, etc.)
2. Validate against schema if available
3. Test commands locally before adding to CI/CD
4. Use `--dry-run` flags when available
5. Add comments showing where to find schema/docs

---

## 10. Documentation-First Development: Check Docs Before Implementing

### What happened
Multiple mistakes came from assumptions instead of checking official documentation. Time spent debugging could have been prevention time reading docs.

### The problem
- Assumed EAS CLI flag syntax based on "what makes sense"
- Assumed eas.json structure without checking examples
- Assumed GitHub Actions token permissions without testing
- Each required error debugging cycle

### Process lesson
✅ **Documentation-first approach saves iteration time**:
- Read official docs before implementing
- Copy examples, don't invent
- Reference docs in code comments
- Update docs if something differs from expected behavior

### For future work
Establish documentation discipline:
1. For every tool/service used, bookmark the official docs
2. Read the "Getting Started" section first
3. Copy working examples before modifying
4. Keep docs references in code comments
5. If docs are unclear, test assumption locally first
6. Report documentation bugs to maintain accuracy

---

## Summary: Process Principles

### ✅ DO
1. **Verify against official sources** (GitHub releases, official docs, schema validation)
2. **Test locally first** (commands, configs, code) before automation
3. **Pin versions exactly** for production reproducibility
4. **Document your decisions** (why this version? why this config?)
5. **Read docs before implementing** (Getting Started, Prerequisites, Examples)
6. **Validate against schemas** (JSON, YAML, tool-specific)
7. **Test permission models** (GitHub Actions tokens, npm/pip permissions)
8. **Establish checklists** (setup steps, deployment steps, version reviews)
9. **Fail fast locally** (catch mistakes before CI/CD)
10. **Comment with doc references** (help future maintainers find answers)

### ❌ DON'T
1. **Assume training data is current** (dependencies, APIs, tool syntax)
2. **Assume CLI flags/syntax** (check --help, check docs)
3. **Invent configuration field names** (copy from examples)
4. **Assume broad permissions** (test actual token scopes)
5. **Skip project structure analysis** (map it out first)
6. **Use global packages in CI/CD** (local/dev dependencies only)
7. **Skip tool initialization** (check Getting Started)
8. **Use loose version bounds** (pin exact versions)
9. **Skip local testing** (test before pushing)
10. **Assume anything** (verify everything)

---

## How to Use This Document

**For AI agents/future developers**:
- Read this before starting work
- Reference it when you're about to make implementation decisions
- If you encounter an error, check if it's in here first
- Add new lessons as you discover them

**For code review**:
- Use this as a checklist
- If you see patterns here, call them out
- Enforce documentation-first approach
- Require local testing before CI/CD changes

**For maintenance**:
- Review this quarterly
- Update based on new lessons learned
- Keep it visible in project README

---

**Last Updated**: 2026-03-04  
**Next Review**: 2026-04-04
