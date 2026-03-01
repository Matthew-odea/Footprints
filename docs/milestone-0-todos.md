# Footprints Milestone 0 Todos (Minimal Build)

## Milestone Goal

Ship a very minimal, end-to-end working slice:

- User can open app, sign in (basic), see active prompts
- User can view prompt detail
- User can submit one completion (photo URL or placeholder + note + date + location)
- User can view their history

This milestone optimizes for **working flow**, not full feature depth.

## Non-Goals for Milestone 0

- Friend graph management
- Full community feed interactions
- Advanced auth and account recovery
- Push notifications, streak mechanics, moderation
- Desktop/admin experience

## Priority 0 — Project Skeleton

- [ ] Create frontend app shell at `apps/mobile` (Expo + TypeScript)
- [ ] Create backend service shell at `services/api` (FastAPI)
- [ ] Add root `Makefile` with `bootstrap`, `mobile`, `api`, `dev`, `test`
- [ ] Add `.env.example` with shared and service-specific variables
- [ ] Ensure existing GitHub workflows run without failing when code is present

**Acceptance criteria**

- `make bootstrap` installs dependencies for both services
- `make mobile` starts Expo dev server
- `make api` starts FastAPI locally

## Priority 1 — API Minimal Domain

- [ ] Implement `POST /auth/login` (temporary username-based auth with signed JWT)
- [ ] Implement `GET /prompts/active`
- [ ] Implement `GET /prompts/{id}`
- [ ] Implement `POST /completions`
- [ ] Implement `GET /history`
- [ ] Implement `GET /me`

**Acceptance criteria**

- Endpoints return valid JSON with Pydantic schemas
- Local API has a health route and passes smoke curl checks
- Basic auth guard works for protected endpoints

## Priority 2 — DynamoDB + S3 Baseline

- [ ] Create DynamoDB table `footprints_core`
- [ ] Define GSIs needed for active prompts and history
- [ ] Implement repository layer for prompts/completions/history
- [ ] Create S3 bucket and completion object prefix convention
- [ ] Add backend configuration for AWS region, table, and bucket

**Acceptance criteria**

- Prompt reads and completion writes persist in DynamoDB
- Completion payload can include `photoUrl` referencing S3 path

## Priority 3 — Mobile Minimal UX

- [ ] Implement login screen -> token storage
- [ ] Implement tab shell with `Home`, `History`, `Settings` (feed optional placeholder)
- [ ] Implement home prompt list from API
- [ ] Implement prompt detail screen from API
- [ ] Implement prompt upload/submit screen posting to API
- [ ] Implement history screen from API

**Acceptance criteria**

- User can complete the full flow on simulator/device without mocks
- Error and loading states exist on all networked screens

## Priority 4 — Seed Data + Dev Experience

- [ ] Add prompt seed script (3-5 prompts matching Figma concepts)
- [ ] Add simple script to reset local/dev data for repeatable testing
- [ ] Add API OpenAPI export command
- [ ] Add frontend typed client models for API responses

**Acceptance criteria**

- Fresh environment can be seeded and used in under 15 minutes

## Priority 5 — Quality Gates

- [ ] Add API unit tests for prompt/completion service layer
- [ ] Add API integration test for completion submit -> history fetch
- [ ] Add mobile basic test coverage for auth and prompt flow utilities
- [ ] Enforce lint/typecheck in CI workflows

**Acceptance criteria**

- CI passes on PR with lint, typecheck, and baseline tests

## Suggested Work Order (Execution Sequence)

1. Project skeleton + envs + local run commands
2. API endpoints with in-memory stubs
3. Swap stubs to DynamoDB repositories
4. Mobile screens wired to real API
5. S3 upload integration (or temporary `photoUrl` until upload endpoint is ready)
6. Seed data + tests + CI hardening

## Milestone 0 Exit Definition

Milestone 0 is complete when:

- A new user can log in, open a prompt, submit a completion, and see it in history
- Data is persisted in DynamoDB
- Completion media path is stored with S3-compatible URL/key
- CI runs for both mobile and API on pull requests

## Execution Status (Current Repo)

- Implemented: monolith skeleton, API endpoints, auth guard, memory + DynamoDB datastore support, S3 path handling, mobile flow screens, tests, Makefile, env templates, CI/CD workflow scaffolding.
- Implemented: Terraform baseline for DynamoDB + S3 in `infra/terraform/environments/dev` and `infra/terraform/environments/prod`.
- Remaining manual ops: apply Terraform in AWS account, configure GitHub deploy secrets, run full dependency install and end-to-end runtime verification on your machine.
