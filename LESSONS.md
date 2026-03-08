# Development Lessons & Best Practices

**Date**: Last updated March 8, 2026  
**Purpose**: Capture lessons from MVP → Sprint 2 development to avoid repeating mistakes and establish patterns for future work

This document combines process discipline lessons (from project inception) with architecture lessons (from feature implementation).

---

# Part 1: Process Discipline & Tooling

These lessons prevent common setup/configuration mistakes that waste iteration cycles.

## 1. Dependency Versioning: Never Assume Training Data is Current

### What Happened
Selected versions (Expo 54, React 18.3.1, FastAPI 0.116.0) without verifying against official compatibility matrices. Assumed versions from training cutoff date were appropriate.

### The Problem
- Used loose `>=` version bounds in backend (`fastapi>=0.116.0`), creating reproducibility risk
- Backend dependencies were 6-8 months outdated (boto3 from Jan 2024)
- Frontend test tools were one major version behind SDK (babel-preset-expo 55 for SDK 54)
- Result: "Works on my machine" bugs, unpredictable CI/CD behavior, potential security gaps

### Process Lesson ✅
**Always verify dependencies against official compatibility matrices**, not training data:
- Fetch official docs (npm registry, PyPI, GitHub releases)
- Check release dates—not cutoff dates
- Pin exact versions for production packages
- Create a versioning strategy document at project start
- Review dependencies monthly for security updates

### For Future Work
Before selecting any major dependency:
1. Visit official GitHub releases page
2. Check release date (is it recent?)
3. Review compatibility notes (what versions does it support?)
4. Pin exact versions (`==` in Python, exact semver in npm)
5. Document why that version was chosen (see `docs/versioning-strategy.md`)

---

## 2. Tool CLI Syntax: Documentation First, Never Assume

### What Happened
Used `eas build --distribution preview` when the correct flag was `--profile preview`. Assumed naming conventions matched across tools—they don't.

### The Problem
- Wrong syntax broke the GitHub Actions workflow immediately
- Required extra debugging cycle to discover flag name
- Workflow failed silently with unhelpful error message

### Process Lesson ✅
**Always check tool documentation before generating commands**:
- Don't assume CLI flags exist or work a certain way
- Different tools have different conventions (`--profile` vs `--distribution`)
- Generated commands should be tested locally first
- Keep CLI references handy (bookmark official docs)

### For Future Work
Before writing automation (GitHub Actions, Makefiles, scripts):
1. Test the command locally first
2. Verify output matches expectations
3. Check `--help` output for correct flag names
4. Copy-paste from official examples, don't improvise
5. Comment the command with where to find docs if it changes

---

## 3. Configuration File Schemas: Always Validate Against Official Schema

### What Happened
Created `eas.json` with `"builds"` when the schema requires `"build"` (singular). Didn't validate the structure against EAS documentation.

### The Problem
- Workflow broke with cryptic error: `"builds" is not allowed`
- Required guessing and trial-and-error to fix
- If caught early, would have been 30-second fix

### Process Lesson ✅
**Always reference official schema when creating config files**:
- Every tool publishes its configuration schema (usually in docs or a JSON schema file)
- Validate structure before committing
- Use IDE schema validation if available (VS Code can validate against published schemas)
- Don't invent field names—check docs

### For Future Work
Before creating any config file (eas.json, tsconfig.json, pyproject.toml, etc.):
1. Find official schema documentation
2. Copy structure from official example
3. Enable IDE schema validation if available
4. Validate locally before pushing changes
5. Keep a reference comment linking to docs

---

## 4. GitHub Actions Permissions: Understand Token Scope Limitations

### What Happened
Tried to post commit comments in GitHub Actions but got "Resource not accessible by integration" error. The default GITHUB_TOKEN couldn't write commit comments on `push` events (only on PRs).

### The Problem
- GitHub Actions token has context-specific permissions
- `push` events can't write commit comments (permission denied)
- `pull_request` events can write to PR comments
- This difference isn't obvious without testing

### Process Lesson ✅
**Always test GitHub Actions steps with actual authentication**:
- Don't assume GitHub Actions tokens have broad permissions
- Different events (push vs PR) have different token scopes
- Test workflow logic locally before pushing
- Fallback gracefully when operations are denied
- Document which operations work with which events

### For Future Work
For any GitHub Actions that modify repo state:
1. Check GitHub Actions documentation for token scopes
2. Test with actual permissions (not just assume)
3. Add error handling for permission failures
4. Restrict modifications to events where permissions exist (e.g., only comment on PRs)
5. Log what failed so user can debug

---

## 5. Project Structure: Verify Before Running Commands

### What Happened
Tried `npm install` from repo root without checking package.json location. Monorepo structure has package.json only in `apps/mobile/` and `services/api/`, not root.

### The Problem
- Command failed silently with "Could not find package.json"
- Didn't check workspace structure before running package manager
- Required user to manually cd into correct directory

### Process Lesson ✅
**Always map project structure before writing setup commands**:
- Run `ls -la` or equivalent to see actual files
- Find where package.json and pyproject.toml are located
- Monorepos are common—don't assume flat structure
- Document the structure in README or workspace map

### For Future Work
At project start:
1. List directory structure: `find . -maxdepth 2 -type f -name "package.json" -o -name "pyproject.toml"`
2. Document where each package manager file lives
3. Create workspace navigation shortcuts (see `Makefile`)
4. Always specify full paths in automation (e.g., `cd apps/mobile && npm install`)
5. Test paths locally before adding to CI/CD

---

## 6. Package Manager Permissions: Consider Local vs Global Installation

### What Happened
Tried `npm install -g eas-cli` (global) on a machine without `sudo` permissions. Failed with EACCES error. Should have installed locally as dev dependency.

### The Problem
- Global npm packages require elevated permissions
- Local dev dependencies are safer and more portable
- Didn't consider that CI/CD and local machines might have permission differences

### Process Lesson ✅
**Default to local/dev dependencies in projects**:
- Global tools make setup fragile and machine-dependent
- Dev dependencies are portable and reproducible
- CI/CD systems rarely have global package permissions
- Use local dependencies even for build tools

### For Future Work
When adding build/CLI tools:
1. Prefer local dev dependency: `npm install --save-dev eas-cli`
2. Run via npx: `npx eas init`
3. Only use global packages for user convenience (not CI/CD)
4. Document in README how to "run eas init"
5. Add tool to .gitignore if node_modules is excluded

---

## 7. Tool Initialization: Always Follow Setup Checklists

### What Happened
Tried building with EAS before running `eas init`. EAS requires project initialization (creates project ID, links to Expo account) before builds work.

### The Problem
- Didn't check if EAS needed initialization
- Error message was helpful, but added an extra cycle
- Could have been prevented by reading EAS getting-started docs

### Process Lesson ✅
**Every tool has required initialization—check first**:
- Most build systems require setup (eas init, terraform init, etc.)
- Read the "Getting Started" section before using a tool
- Build initialization into automation, not after failure
- Create a setup checklist and verify each step works

### For Future Work
For any new tool/service:
1. Read official "Getting Started" guide first
2. Check "Prerequisites" section
3. Follow "Installation" steps completely
4. Note any required initialization commands
5. Test locally before adding to CI/CD
6. Document the full setup sequence in README

---

## 8. Testing Generated Code: Don't Trust Output Without Validation

### What Happened
Generated configuration files and commands without testing them. Multiple iterations were needed because assumptions about syntax/schema were wrong.

### The Problem
- Generated `eas.json` without validating structure
- Generated GitHub Actions without testing locally
- Each mistake forced a wait for next build cycle
- Wasted time on obvious mistakes

### Process Lesson ✅
**Always test generated code before committing**:
- If generating config, validate against schema first
- If generating commands, test locally before CI/CD
- Assume you will be wrong—build in verification steps
- Fail fast locally, not in CI/CD

### For Future Work
When generating any code/config:
1. Validate syntax (JSON validator, YAML validator, etc.)
2. Validate against schema if available
3. Test commands locally before adding to CI/CD
4. Use `--dry-run` flags when available
5. Add comments showing where to find schema/docs

---

## 9. Documentation-First Development: Check Docs Before Implementing

### What Happened
Multiple mistakes came from assumptions instead of checking official documentation. Time spent debugging could have been prevention time reading docs.

### The Problem
- Assumed EAS CLI flag syntax based on "what makes sense"
- Assumed eas.json structure without checking examples
- Assumed GitHub Actions token permissions without testing
- Each required error debugging cycle

### Process Lesson ✅
**Documentation-first approach saves iteration time**:
- Read official docs before implementing
- Copy examples, don't invent
- Reference docs in code comments
- Update docs if something differs from expected behavior

### For Future Work
Establish documentation discipline:
1. For every tool/service used, bookmark the official docs
2. Read the "Getting Started" section first
3. Copy working examples before modifying
4. Keep docs references in code comments
5. If docs are unclear, test assumption locally first
6. Report documentation bugs to maintain accuracy

---

## Process Summary: 10 Core Principles

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

# Part 2: Code Architecture & Feature Patterns

These lessons prevent mistakes when implementing complex features like bidirectional state tracking.

## Storage Layer Editing Pattern

### The Problem

The original `storage.py` (924 lines) combined an abstract base class with two implementations (MemoryDataStore and DynamoDataStore). When making edits:

1. **Large patch problem**: Applying large multi-method patches at once caused cascading indentation errors
2. **Syntax validation gap**: Not validating syntax immediately after each edit allowed errors to compound
3. **Blast radius**: A single misplaced bracket in one method affected 5+ downstream methods in the same class
4. **Review friction**: 900+ line diffs made code review nearly impossible

### The Solution: Small Patches + Immediate Validation

**Pattern**: For files >300 lines with multiple classes:
1. Split into smaller files (base.py, implementation1.py, implementation2.py)
2. When editing, change 1-2 lines at a time
3. Validate syntax immediately after each change with:
   ```bash
   python3 -c "from app.module import ClassA; from app.module import ClassB; print('✓ OK')"
   ```
4. Commit frequently (every 2-3 validated changes)

### Applied Solution: Storage Refactoring

Original structure:
```
storage.py (924 lines)
├── DataStore (abstract, ~100 lines)
├── MemoryDataStore (implementation, ~350 lines)
└── DynamoDataStore (implementation, ~470 lines)
```

Refactored to:
```
storage_base.py (100 lines)
├── DataStore (abstract)
├── utc_now_iso() (helper)

memory_store.py (340 lines)
└── MemoryDataStore (implementation)

dynamo_store.py (470 lines)
└── DynamoDataStore (implementation)

storage.py (12 lines)
└── Re-exports only (backward compatible)
```

**Benefits**:
- Each file <400 lines (cognitive load reduced)
- Edits to MemoryDataStore don't risk DynamoDataStore syntax
- Test fixture changes to validate syntax take 5-10 seconds, not 2 minutes
- Code review diffs now show intent, not indentation cascades

### Why This Matters

When implementing friend approval with bidirectional state tracking, the codebase needed:
- `seed_friends()` changes → `add_friend()` changes → `accept_friend_request()` changes
- Each change could be 3-5 lines of dict manipulation

With 924-line monolith:
- Patch #1: 15 lines, introduces indentation error at line 236 in unrelated code
- Patch #2: 20 lines, tries to fix error, creates orphaned code block
- Patch #3: 25 lines, cascading failure across 3 methods
- Result: Multiple revert cycles, 2+ hours of debugging

With split files:
- Patch #1 to memory_store.py: 3 lines, validate (10 sec)
- Patch #2 to memory_store.py: 2 lines, validate (8 sec)
- Patch #3 to dynamo_store.py: 4 lines, validate (9 sec)
- All tests passing in <90 seconds

## Friendship State Tracking Pattern

### The Data Model

Friend relationships are **bidirectional and symmetric**:

```
When alice sends friend request to bob:
  - alice.friendships += {request_id, friend_id=bob, status=pending, requested_by=alice, ...}
  - bob.friendships += {request_id, friend_id=alice, status=pending, requested_by=alice, ...}
                                           ^same request                       ^same requester
```

**Why this matters**: The `requested_by` field must be identical in both users' records so Bob knows who initiated.

### The Mistake: Asymmetric State

If alice's record has `requested_by=alice` but bob's has `requested_by=bob`:
- `get_incoming_requests()` filters for `status=pending AND requested_by != user_id`
- Bob sees the request as "incoming" ✓
- Alice sees it as "outgoing" ✗ (should filter for `requested_by == user_id`)

**Prevention**: When creating bidirectional relationships, create both records in a single function and copy the same `request_id` and `requested_by` fields.

## Test Fixture Isolation Pattern

### The Problem

Tests share global state through class variables:

```python
class MemoryDataStore(DataStore):
    users_by_username: dict = {}    # Shared! Not reset between tests
    friendships: dict = {}           # Shared! Contaminates next test
```

A test that adds 5 friends affects the next test's friend count.

### The Solution: Singleton + State Reset

```python
# conftest.py
TEST_STORE = MemoryDataStore()  # Single instance, preserved across tests

@pytest.fixture()
def reset_memory_store():
    """Clear user/friendship state, keep prompts."""
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    MemoryDataStore.friendships.clear()
    # NOTE: Don't clear prompts_by_id (seeded once at app startup)

@pytest.fixture()
def client(reset_memory_store):
    app.dependency_overrides[get_store] = lambda: TEST_STORE
    # ... TestClient setup
    app.dependency_overrides.clear()
```

**Key insight**: Dependency overrides must be set in the fixture's `setup` phase (before test runs), not in teardown. The override must point to a persistent singleton so seeded data survives test boundaries.

## Validation Checklist

After any edit to `storage.py` or similar large files:

- [ ] Syntax check: `python3 -c "from app.repositories.storage import ..."`
- [ ] Test check: `pytest tests/integration/test_friend_requests.py -q`
- [ ] If test fails, revert change and re-assess scope
- [ ] If test passes, commit with message: `fix(storage): [method] - [what changed]`

## Architecture Patterns Summary

The refactoring from 924-line monolith to 3-file split reduced edit friction from 2+ hour cascading failures to <2 minute validate/test cycles. This enables confident iteration on complex features like bidirectional friendship tracking.

---

# How to Use This Document

## For Developers Starting on Footprints
1. Read "Part 1: Process Discipline" first (sections 1-9)
2. Establish the 10 core principles in your workflow
3. Review "Part 2: Code Architecture" when implementing features
4. Reference the relevant pattern when you're about to make a decision

## For Code Review
- Use "Part 1" as a checklist for setup/CI/CD changes
- Use "Part 2" as a checklist for feature implementation
- If you see anti-patterns from here, call them out

## For AI Agents / Future Developers
- Read this before starting work
- Reference it when making implementation decisions
- If you encounter an error, check if it's explained here first
- Add new lessons as you discover them

## For Project Maintenance
- Review this quarterly
- Update based on new lessons learned
- Keep it visible in project README
- Link to relevant sections in code comments

---

**Last Updated**: March 8, 2026  
**Created From**: 
- Root LESSONS.md (architecture patterns)
- docs/lessons-learned.md (process discipline)
- Combined into single, comprehensive reference

**Next Review**: Post-Sprint 3 kickoff (March 22, 2026)

**Golden rule**: If a file has multiple implementations (MemoryStore, DynamoDB, etc.), split them before adding features. The short-term cost of refactoring saves 10x debugging time later.
