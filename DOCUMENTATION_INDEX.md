# Documentation Index & Navigation Guide

**Updated:** March 8, 2026  
**Status:** All legacy docs consolidated and archived. Root-level docs are the source of truth.

---

## 📚 Active Documents (Use These)

### Core Product & Planning
1. **MASTER_PLAN.md** ⭐ START HERE
   - Overall product status, roadmap, metrics
   - Sprint progress tracking
   - Success criteria + timelines
   - Team structure + responsibilities
   - **When to use:** Overview, release gates, roadmap decisions

2. **PRODUCT_VISION.md**
   - Design system (Collected Growth philosophy)
   - Navigation structure (5 tabs)
   - Visual design specs (colors, typography, spacing)
   - User experience flows
   - Data model schemas
   - **When to use:** Design decisions, component specs, visual consistency

3. **SPRINT_3_PLAN.md**
   - Detailed epic breakdowns (5 epics, 20+ stories)
   - Technical specifications + code examples
   - Database schemas + queries
   - API contracts (request/response)
   - Test coverage requirements
   - Timelines + dependencies
   - **When to use:** Sprint implementation, code review, technical design

### Development Reference
4. **LESSONS.md** (Comprehensive - NEW)
   - **Part 1:** Process discipline (9 lessons from setup/tooling)
     - Dependency versioning, CLI syntax, config schemas, GitHub Actions, project structure, package permissions, tool initialization, code generation, documentation-first
   - **Part 2:** Code architecture (storage refactoring, state tracking, test isolation)
   - 10 core principles (do's and don'ts)
   - Validation checklists
   - **When to use:** Before implementing features or setting up tools; during code review

5. **INFRASTRUCTURE.md** (NEW)
   - Repository structure (monorepo layout)
   - Tech stack summary
   - Deployment architecture (AWS Lambda, DynamoDB, S3)
   - Local development setup
   - CI/CD workflows
   - Data model reference
   - **When to use:** Understanding project layout, deploying changes, adding infrastructure

### Getting Started
6. **README.md**
   - Quick setup guide
   - Running development servers
   - Running tests locally
   - Makefile shortcuts
   - **When to use:** First-time setup

---

## 🗂️ What Happened to the Legacy Docs?

**All docs in `/docs/` have been deleted and consolidated into root-level documents:**

| Old Document | Consolidated Into | Notes |
|--------------|-------------------|-------|
| `docs/milestone-0-todos.md` | MASTER_PLAN.md (archive) | MVP setup complete |
| `docs/planning.md` | PRODUCT_VISION.md | Early Figma design → unified vision |
| `docs/sprint-1-plan.md` | MASTER_PLAN.md (archive) | Sprint 1 executed & shipped |
| `docs/human-todos.md` | MASTER_PLAN.md (team section) | Setup tasks complete |
| `docs/lessons-learned.md` | LESSONS.md (Part 1) | Process discipline merged |
| `docs/deployment-*.md` | INFRASTRUCTURE.md + codebase | Architecture documented + implemented |
| `docs/dynamodb-access-patterns.md` | INFRASTRUCTURE.md (reference) | Schema in codebase |
| `docs/eas-preview-setup.md` | README.md + codebase | One-time setup, complete |
| `docs/monolith-structure.md` | INFRASTRUCTURE.md + codebase | Layout reflected in codebase |
| `docs/versioning-strategy.md` | LESSONS.md (Part 1) + codebase | Pinned versions implemented |

**Why consolidate?**
- Reduce document sprawl (was 12 docs, now 6 active + empty `/docs/`)
- Single source of truth for each topic
- Easier to keep docs synchronized
- Clear priority (read these, in this order)
- Source of truth shifts to codebase for implementation details

---

## 🔍 Quick Reference: Which Doc For What?

| Question | Document |
|----------|----------|
| What epic should I work on? | MASTER_PLAN.md → "What's In-Progress" |
| What are the detailed specs? | SPRINT_3_PLAN.md → Pick your epic |
| What color should this button be? | PRODUCT_VISION.md → Design system section |
| How do I avoid cascading failures? | LESSONS.md → Part 2, Storage pattern |
| What's the API route? | SPRINT_3_PLAN.md → Backend Changes section |
| How do I run tests? | README.md + LESSONS.md |
| Is DynamoDB set up correctly? | INFRASTRUCTURE.md → Data model section |
| What version of React should I use? | LESSONS.md → Part 1, Dependency versioning |
| How do I deploy this? | INFRASTRUCTURE.md → CI/CD section |
| When does Sprint 3 ship? | MASTER_PLAN.md → Release checklist |

---

## 📊 Document Hierarchy for Decisions

```
MASTER_PLAN.md (What? When? Success criteria?)
    ↓
PRODUCT_VISION.md (How should it look/feel/work?)
    ↓
SPRINT_3_PLAN.md (Technical specs to implement)
    ↓
INFRASTRUCTURE.md + LESSONS.md (How to implement & avoid mistakes)
    ↓
README.md (How do I run this locally?)
```

---

## ✅ Completion Status

### Documentation Phase (Completed)
- [x] Consolidated 2 LESSONS files into 1 comprehensive reference
- [x] Merged deployment docs into INFRASTRUCTURE.md
- [x] Created INFRASTRUCTURE.md for setup/deployment reference
- [x] Updated DOCUMENTATION_INDEX.md
- [x] Deleted all 12 legacy docs in `/docs/`
- [x] Verified `/docs/` is empty

### What's Now the Source of Truth
- Product roadmap: **MASTER_PLAN.md**
- Design system: **PRODUCT_VISION.md**
- Technical specs: **SPRINT_3_PLAN.md**
- Development patterns: **LESSONS.md**
- Infrastructure: **INFRASTRUCTURE.md** + codebase
- Implementation: **Codebase** (actual source of truth)

---

## 📝 Document Maintenance Rules

**Add new docs only if:**
1. It's a new section in MASTER_PLAN.md, PRODUCT_VISION.md, or SPRINT_3_PLAN.md (update existing)
2. It's architectural patterns not yet in LESSONS.md (add to Part 2)
3. It's setup/deployment info not yet in INFRASTRUCTURE.md (add there)
4. It's process discipline lessons not yet in LESSONS.md (add to Part 1)

**DO NOT:**
- Create new `/docs/*.md` files (consolidate into root docs)
- Create sprint-specific docs (use MASTER_PLAN.md + SPRINT_X_PLAN.md)
- Create separate deployment/infrastructure docs (use INFRASTRUCTURE.md)

---

## 🔗 Quick Links

**Product Planning:**
- [MASTER_PLAN.md](MASTER_PLAN.md) — Status, roadmap, success criteria
- [PRODUCT_VISION.md](PRODUCT_VISION.md) — Design system, philosophy
- [SPRINT_3_PLAN.md](SPRINT_3_PLAN.md) — Epic specs, technical details

**Development:**
- [LESSONS.md](LESSONS.md) — Process + architecture patterns
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) — Tech stack, deployment, setup
- [README.md](README.md) — Getting started, quick commands
- [Makefile](Makefile) — Shortcuts (make bootstrap, make api, make test)

**Code:**
- Backend: `/services/api/` (FastAPI + DynamoDB)
- Mobile: `/apps/mobile/` (React Native + Expo)
- Infrastructure: `/infra/` (Terraform + GitHub Actions)

---

## ❓ FAQ

**Q: The `/docs/` folder is empty. Should I add docs there?**  
A: No. All new documentation should update existing root-level files (MASTER_PLAN.md, LESSONS.md, etc.). The `/docs/` folder is intentionally empty to keep docs at the root for visibility.

**Q: What if I need to store generated API docs?**  
A: You can use `/docs/` for generated content only (API specs, architectural diagrams, etc.). Don't add hand-written documentation there.

**Q: Can I delete any of these root-level docs?**  
A: Only if you consolidate their content elsewhere. All 6 docs serve a purpose:
- MASTER_PLAN = roadmap
- PRODUCT_VISION = design system
- SPRINT_3_PLAN = technical specs
- LESSONS = patterns + do's/don'ts
- INFRASTRUCTURE = setup + deployment
- README = getting started

**Q: What if I find outdated information in a doc?**  
A: Update it immediately (or create a PR). These docs should stay fresh. If info is outdated, it belongs in git history, not the current docs.

**Q: Should new team members read all 6 documents?**  
A: Reading order:
1. README.md (5 min) — Get running locally
2. MASTER_PLAN.md (10 min) — Understand status + roadmap
3. PRODUCT_VISION.md (15 min) — Learn design system
4. SPRINT_3_PLAN.md (30 min) — Deep dive on your epic
5. LESSONS.md (20 min) — Learn patterns + pitfalls
6. INFRASTRUCTURE.md (10 min) — Understand tech stack

Total: ~90 min to full context.

---

**Status:** ✅ Documentation consolidated, optimized, and cleaned up  
**Last Updated:** March 8, 2026  
**Next Review:** March 22, 2026 (Sprint 3 kickoff)
