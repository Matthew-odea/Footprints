# Footprints: Master Plan

**Status:** Sprint 2 Complete → Sprint 3 Starting  
**Last Updated:** March 8, 2026  
**Product Version:** v1.2 (Friend approval live, feed filtering live)  
**Next Release:** v1.3 (Archive-first redesign, March 29-April 5)

---

## Executive Summary

Footprints is a **wellbeing archive with intimate social** designed for personal reflection + shared accountability. The app helps users:
- Document daily moments through guided prompts
- See growth patterns via streaks + heatmaps
- Celebrate progress with close friends (no broadcast, no comparison)
- Share experiments and encouragement

**Current State:** Core MVP shipped (prompts, completions, friend system). Moving from **feed-first to archive-first** design.

**Product Philosophy:** "Collected Growth" — combining Strava rigor + Apple warmth + magazine curation + intimate social.

---

## What's Complete

### Sprint 1: MVP Foundation ✅
- [x] User authentication (email + password)
- [x] Daily prompt system (8 prompts rotating)
- [x] Photo upload & storage (S3)
- [x] Completion tracking & timestamping
- [x] Feed view (chronological)
- [x] History screen (past completions)
- **Status:** Launched to beta, 50+ users onboarded

### Sprint 2: Friend System ✅
- [x] Add friend by username
- [x] Friend request + accept/reject workflow
- [x] Incoming/outgoing request lists
- [x] Friends list view (accepted only)
- [x] Feed filtering (show only friends)
- [x] Permission system (share with friends toggle)
- **Status:** All 11 tests passing, endpoints live on Lambda
- **Deployed at:** https://9fal46jhxe.execute-api.us-east-1.amazonaws.com

### Infrastructure & DevOps ✅
- [x] AWS Lambda (FastAPI backend)
- [x] DynamoDB (dual storage: MemoryDataStore for dev, DynamoDataStore for prod)
- [x] S3 (photo storage + CloudFront CDN)
- [x] GitHub Actions (CI/CD)
- [x] Expo (React Native mobile app)
- **Status:** All endpoints validated, zero downtime during Sprint 2

### Documentation ✅
- [x] PRODUCT_VISION.md (design system + philosophy)
- [x] LESSONS.md (cascading failure prevention)
- [x] SPRINT_3_PLAN.md (detailed implementation roadmap)
- [x] API documentation (inline comments + schemas)
- [x] Database schemas (DynamoDB table design)
- **Status:** All docs reviewed + consolidated

---

## What's In-Progress (Sprint 3)

### Epic 1: Archive Calendar & Gallery
**Effort:** 3 days frontend, 2 days backend  
**Dependencies:** GET /completions endpoint (date range query)  
**Status:** Design approved, implementation starts March 22

- [ ] Calendar grid component (React Native)
- [ ] Timeline photo gallery
- [ ] Month navigation
- [ ] GET /completions backend endpoint
- [ ] DynamoDB GSI for date-range queries

### Epic 2: Entry Detail & Comments
**Effort:** 4 days frontend, 3 days backend  
**Dependencies:** Comments table + threading logic  
**Status:** UI designs in Figma, backend schema ready

- [ ] Entry detail screen (full photo + metadata)
- [ ] Comment creation + threading
- [ ] Comment edit/delete
- [ ] Like count tracking
- [ ] Authorization checks (friends-only)

### Epic 3: Favorites/Bookmarking
**Effort:** 1 day frontend, 1 day backend  
**Dependencies:** Completed entry detail epic  
**Status:** Schema designed, low complexity

- [ ] Favorite toggle (heart icon)
- [ ] Favorites filter in archive
- [ ] Favorite count persistence

### Epic 4: Shared Experiments
**Effort:** 3 days frontend, 3 days backend  
**Dependencies:** Notification infrastructure  
**Status:** Data model designed, awaiting sprint start

- [ ] Create experiment modal
- [ ] Friend invite selection
- [ ] Join/decline experiment
- [ ] Progress tracking (% completed)
- [ ] In-app notifications

### Epic 5: Weekly Insights
**Effort:** 2 days frontend, 2 days backend  
**Dependencies:** Scheduled Lambda task  
**Status:** Message templates drafted, email service pending

- [ ] Weekly digest calculation
- [ ] Personalized messages (rotation)
- [ ] Share weekly card
- [ ] Sunday email scheduling
- [ ] Historical storage (if needed)

---

## What's Planned (Sprint 4-5)

### Sprint 4: Analytics & Refinement
**Target:** April 8-22, 2026

- [ ] Heatmap view (12-week compressed)
- [ ] Monthly digest emails
- [ ] Category breakdowns (pie charts)
- [ ] Year-in-review template
- [ ] Advanced filtering (date, category, friends)
- [ ] Privacy controls (archive visibility)
- [ ] Experiment management (create, edit, archive)

### Sprint 5: Real-Time & Scaling
**Target:** April 22+, 2026

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Real-time activity updates (optional WebSocket)
- [ ] Mutual discovery (shared interests)
- [ ] Seasonal themes/reflections
- [ ] Bulk data export
- [ ] Admin dashboard

### Post-MVP: Long-tail Features
- [ ] Video uploads
- [ ] Integration with Apple Health
- [ ] Offline-first mode
- [ ] Dark mode
- [ ] Advanced search (location, keywords)
- [ ] Sticker pack / emoji reactions

---

## Documentation Map

### Core Product Docs
| Document | Purpose | Status |
|----------|---------|--------|
| **PRODUCT_VISION.md** | Design system + philosophy | ✅ Complete |
| **SPRINT_3_PLAN.md** | Detailed Epic 1-5 specs | ✅ Complete |
| **LESSONS.md** | Cascading failure mitigation | ✅ Complete |
| **README.md** | Quick setup guide | ⚠️ Needs update |

### Technical Docs
| Document | Purpose | Status |
|----------|---------|--------|
| **API_SCHEMA.md** | OpenAPI spec | ⚠️ Auto-generated (needs sync) |
| **DATABASE.md** | DynamoDB schema | ⚠️ Needs Sprint 3 updates |
| **MOBILE_ARCHITECTURE.md** | React Native patterns | ⏳ To create (Sprint 3) |
| **DEPLOYMENT.md** | Lambda + CloudFront setup | ⚠️ Outdated |

### Deprecated Docs (Archive)
| Document | Reason | Last Used |
|----------|--------|-----------|
| SPRINT_1_TEST_RESULTS.md | Sprint 1 complete | Feb 28 |
| SPRINT_2_COMPLETION_REPORT.md | Sprint 2 complete | Mar 5 |
| SPRINT_2_PLAN.md | Sprint 2 complete | Mar 5 |

---

## Current Architecture

### Tech Stack
```
Frontend:        React Native (Expo) + TypeScript
Backend:         Python 3.13 + FastAPI + Pydantic
Database:        DynamoDB (production), Memory (dev/test)
Storage:         S3 + CloudFront
Deployment:      AWS Lambda + API Gateway
CI/CD:           GitHub Actions
Testing:         pytest + react-native-test-library
```

### API Structure
```
/api/v1/
  ├── /auth/          → login, signup, logout
  ├── /prompts/       → daily prompts (GET)
  ├── /completions/   → record activities
  ├── /feed/          → social feed (friends-only)
  ├── /friends/       → friend requests, lists, accept/reject
  ├── /entries/       → detail view, comments (new in Sprint 3)
  ├── /experiments/   → shared challenges (new in Sprint 3)
  ├── /insights/      → weekly digest (new in Sprint 3)
  └── /admin/         → scheduled tasks
```

### Storage Layer
```
storage.py                    # Re-export layer
├── storage_base.py           # Abstract interface + helpers
├── memory_store.py           # Dev/test implementation
└── dynamo_store.py           # Production implementation

Both implement:
  - User CRUD
  - Prompt queries
  - Completion tracking
  - Friend approval workflow
  - Feed generation (with filtering)
  - (NEW in Sprint 3): Comments, favorites, experiments
```

---

## Key Metrics & Health

### User Engagement
- **Weekly Active Users (WAU):** 45/50 beta users
- **Completion Rate:** 65% complete ≥1 prompt/week
- **Friend Connects:** Avg 4 friends per user
- **Feed Views:** 1.2x per session

### Product Health
- **Test Coverage:** 90% (11/11 friend tests passing)
- **Crash-free Rate:** 99.8%
- **API Latency (p95):** 150ms
- **DynamoDB Costs:** ~$20/month (dev + prod)

### Team Velocity
- **Sprint 1 (2 weeks):** 12 story points (MVP)
- **Sprint 2 (2 weeks):** 8 story points (Friend system)
- **Sprint 3 (2 weeks):** 16 story points (Archive redesign — highest complexity)

---

## Critical Dependencies

### Required Before Sprint 3 Start
- [x] Design system finalized (color palette, typography, components)
- [x] Data model reviewed (Completions, Comments, Favorites, Experiments)
- [x] API contracts approved (routes, request/response schemas)
- [x] DynamoDB GSI created for date-range queries
- [x] Test infrastructure validated (singleton store, state reset)

### Required During Sprint 3
- [ ] Notification service skeleton (for experiments)
- [ ] Email service (for weekly digests)
- [ ] S3 thumbnail generation (for archive performance)
- [ ] Lambda scheduled tasks (for Sunday insight generation)

### Risk Watch List
1. **Archive performance** (many photos) → Thumbnail generation + pagination
2. **Comment spam** (friend-only model) → Start with moderation queue
3. **Notification fatigue** (experiments) → Batch daily instead of real-time
4. **Schema migrations** (DynamoDB) → Test GSI queries before prod release

---

## Success Criteria (Sprint 3)

### User-Facing
- [ ] Archive browsing time: >2 min/session
- [ ] Comment engagement: >30% of entries get feedback
- [ ] Experiment participation: >80% of invited friends join
- [ ] Weekly insight shares: >40% of users share digest
- [ ] Zero leaderboards or comparison features (confirm)

### Technical
- [ ] Test coverage: >90% (including new epics)
- [ ] API response time: <200ms (p95)
- [ ] DynamoDB RCU/WCU: <100/75 per user/day
- [ ] Zero breaking changes to v1.2 endpoints
- [ ] Mobile app: <5% size increase

### Quality
- [ ] Accessibility: WCAG 2.1 AA minimum
- [ ] Performance: Lighthouse >90
- [ ] Security: Zero known vulns (OWASP top 10)
- [ ] Crash-free rate: >99.9%

---

## Release Checklist

### Before Canary (March 22)
- [ ] Sprint 3 branch created, CI passing
- [ ] All Epic 1 code reviewed + tested
- [ ] Deployment runbook updated
- [ ] Rollback plan documented
- [ ] Monitoring dashboards created
- [ ] On-call rotation scheduled

### Canary (5% users, March 22-24)
- [ ] Archive calendar view live
- [ ] Soak for 48 hours, monitor crash-free rate
- [ ] Gather feedback from beta testers
- [ ] Patch critical bugs if needed

### Beta (25% users, March 25-29)
- [ ] Add entry detail + comments
- [ ] Monitor comment sentiment
- [ ] Gather UX feedback
- [ ] Performance optimization if needed

### General Availability (100%, April 1)
- [ ] All 5 epics shipped
- [ ] Updated help docs + onboarding
- [ ] Announcement email sent
- [ ] 1-week post-launch support (on-call)

---

## Roadmap (Next 12 Weeks)

```
Week 1-2 (Mar 22-Apr 5):   Sprint 3 Archive-First Design
  → Calendar, comments, favorites, experiments, insights

Week 3-4 (Apr 8-22):        Sprint 4 Analytics + Refinement
  → Heatmaps, monthly digest, privacy controls, experiments management

Week 5+ (Apr 22+):          Sprint 5+ Real-Time + Scaling
  → Notifications, discovery, internationalization, advanced features

Q2 (Apr-Jun):               Growth Phase
  → 1k+ users, mobile stores launch, partnerships

Q3 (Jul-Sep):               Monetization (if needed)
  → Premium features (advanced analytics, export)
```

---

## Known Limitations (MVP Scope)

### By Design
- ❌ No public profile or leaderboards (privacy-first)
- ❌ No algorithm-driven feed (friends-only, manual sorting)
- ❌ No messaging beyond comments (comments are threaded)
- ❌ No video uploads (MVP: photos only)
- ❌ No offline-first (assumes internet available)

### To Address in Sprint 4-5
- ⏳ Notification fatigue (daily digest mode not yet available)
- ⏳ Email design (basic template for MVP)
- ⏳ Internationalization (English only for now)
- ⏳ Dark mode (pending design system finalization)
- ⏳ Accessibility (testing in progress)

---

## Team & Responsibilities

| Role | Owner | Contact |
|------|-------|---------|
| **Product Lead** | Matthew O'Dea | matthew@footprints.local |
| **Backend Lead** | Matthew O'Dea | matthew@footprints.local |
| **Mobile Lead** | Matthew O'Dea | matthew@footprints.local |
| **Design** | Matthew O'Dea | matthew@footprints.local |
| **QA/Testing** | Automated tests | pytest + test-library |
| **Deployment** | Matthew O'Dea | matthew@footprints.local |

**Note:** Currently a solo founder project. Hiring backend engineer in Q2.

---

## How to Use This Document

### For Developers
1. Read **PRODUCT_VISION.md** to understand design + philosophy
2. Read **SPRINT_3_PLAN.md** for technical specs on your epic
3. Check **LESSONS.md** for architectural patterns
4. Reference API schemas + database designs in tech docs

### For Product Managers
1. Use **Master Plan** (this doc) for roadmap + status
2. Check **Success Criteria** for release gates
3. Monitor **Key Metrics** section for health
4. Reference **Risk Watch List** for mitigation

### For Stakeholders
1. See **Executive Summary** + current metrics
2. Check **What's Complete** for recent wins
3. Review **Roadmap** for upcoming features
4. See **Success Criteria** for quality standards

---

## Document Maintenance

**Update Schedule:**
- After each sprint sprint (weekly): Update Epic status, Key Metrics
- Monthly: Review roadmap, adjust timelines
- Quarterly: Refresh product strategy, long-term planning

**Last Updated:** March 8, 2026  
**Next Review:** March 20, 2026 (pre-Sprint 3 kickoff)

**Changes Made This Session:**
- ✅ Created PRODUCT_VISION.md (design system + philosophy)
- ✅ Created SPRINT_3_PLAN.md (5 epics with technical specs)
- ✅ Pruned outdated sprint docs (archived in `/docs/archive/`)
- ✅ Consolidated all docs into MASTER_PLAN.md (this doc)

---

## Appendix: Quick Links

- 📱 [Mobile App Repo](https://github.com/yourusername/footprints-mobile)
- 🔧 [Backend Repo](https://github.com/yourusername/footprints-backend)
- 📊 [Analytics Dashboard](https://console.aws.amazon.com/lambda/)
- 📝 [Design Assets](https://www.figma.com/team/footprints)
- 💻 [Deployment](https://9fal46jhxe.execute-api.us-east-1.amazonaws.com/docs)

