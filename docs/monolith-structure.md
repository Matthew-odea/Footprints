# Footprints Monolith Directory Plan

## Objective

Define a single-repository monolith structure that supports:

- React Native mobile app frontend
- Python backend API
- Shared product contracts and development tooling

This keeps delivery fast for MVP while preserving clear separation of concerns.

## Recommended Stack Shape

- Frontend: React Native with Expo, TypeScript
- Backend: Python FastAPI, Pydantic
- Database: AWS DynamoDB (NoSQL)
- Storage: AWS S3 for completion photos
- Cloud: AWS (API + auth + database + storage)

## Proposed Repository Tree

```text
footprints/
  apps/
    mobile/
      app/
      src/
        features/
          auth/
          prompts/
          completions/
          feed/
          history/
          settings/
        navigation/
        components/
          ui/
          domain/
        services/
          api/
          storage/
        state/
        hooks/
        lib/
        theme/
        types/
      assets/
      app.json
      package.json
      tsconfig.json

  services/
    api/
      app/
        main.py
        api/
          v1/
            routes/
              auth.py
              prompts.py
              completions.py
              feed.py
              history.py
              settings.py
        core/
          config.py
          security.py
          logging.py
        db/
          base.py
          session.py
          models/
        schemas/
        services/
        repositories/
        workers/
      tests/
        unit/
        integration/
      alembic/
      pyproject.toml
      uv.lock

  packages/
    contracts/
      openapi/
      jsonschema/
      events/
    tooling/
      eslint/
      typescript/

  infra/
    terraform/
      environments/
        dev/
        prod/
      modules/
        api/
        dynamodb/
        s3/
        iam/
        cloudwatch/
    docker/
      Dockerfile.api
      Dockerfile.mobile-dev
    compose/
      docker-compose.dev.yml
    scripts/
      bootstrap.sh
      dev-up.sh
      dev-down.sh

  docs/
    planning.md
    monolith-structure.md
    api-contract.md
    domain-model.md

  .github/
    workflows/
      ci-mobile.yml
      ci-api.yml

  .env.example
  README.md
```

## Why This Layout

## 1. Fast MVP Execution

- `apps/mobile` and `services/api` are independently runnable.
- Teams can ship mobile and API in parallel with minimal cross-coupling.

## 2. Domain-Aligned Features

- Mobile feature folders map directly to product workflows.
- API route files mirror the same domains for predictable ownership.

## 3. Shared Contracts

- `packages/contracts` stores OpenAPI and schema artifacts.
- Mobile types are generated from backend contracts to reduce drift.

## 4. Monolith Operations Simplicity

- One repo, one CI surface, one infra baseline.
- Clear future path to split services later if needed.

## FE Boundaries (React Native)

- `features/*`: screen-level domain flows
- `components/ui`: design-system primitives
- `components/domain`: reusable business UI blocks
- `services/api`: client functions for backend calls
- `state`: app-wide state and cache orchestration
- `navigation`: root stack and tab navigation

Keep business rules in feature modules and service layer, not in raw screen components.

## BE Boundaries (Python)

- `api/v1/routes`: transport layer only
- `services`: business logic orchestration
- `repositories`: DynamoDB data access logic
- `db/models`: persistence models
- `schemas`: API DTOs and validation

Route handlers should remain thin and delegate to services.

## MVP Endpoints to Implement First

- `POST /auth/login`
- `GET /prompts/active`
- `GET /prompts/{id}`
- `POST /completions`
- `GET /history`
- `GET /feed`
- `GET /me`
- `PATCH /me/settings`

## MVP Data Tables (Initial)

- DynamoDB table strategy (recommended):
  - `footprints_core` (single-table for users, prompts, completions, friendships, feed projections)
  - `footprints_analytics` (optional table for pre-aggregated stats/time-series)

Primary access patterns should be defined first, then keys/indexes designed around them.

Suggested index approach:

- PK/SK for entity grouping and timeline ordering
- GSI for user-centric queries (history, profile summaries)
- GSI for feed queries (friends + recent activity)
- GSI for prompt discovery (active prompts by category)

## Environment Strategy

Top-level env file for shared local defaults, with service overrides:

- `.env.example`
- `apps/mobile/.env`
- `services/api/.env`

Use namespaced variables to avoid collisions:

- `MOBILE_API_BASE_URL`
- `AWS_REGION`
- `API_DYNAMODB_TABLE_CORE`
- `API_DYNAMODB_TABLE_ANALYTICS`
- `API_JWT_SECRET`
- `API_S3_BUCKET`
- `API_S3_COMPLETIONS_PREFIX`

## AWS Service Mapping

- API runtime: ECS Fargate or AWS Lambda (FastAPI)
- API entry: API Gateway or ALB
- Auth: Cognito or custom JWT auth
- Data: DynamoDB
- File storage: S3
- Observability: CloudWatch logs + metrics
- Secrets: AWS Secrets Manager or SSM Parameter Store

## Build and Run Conventions

Root scripts should orchestrate both apps:

- `make bootstrap`
- `make mobile`
- `make api`
- `make dev`
- `make test`

This keeps developer onboarding to one command path.

## Testing Strategy by Layer

- Mobile unit tests: hooks, reducers, feature logic
- Mobile integration tests: screen flow for prompt completion
- API unit tests: services and repositories
- API integration tests: route + db interactions

## Delivery Plan

## Phase 1: Repo Skeleton

- Create `apps/mobile`, `services/api`, `packages/contracts`, `infra`
- Wire linting and CI baselines

## Phase 2: Vertical Slice

- Implement Login -> Home -> Prompt Detail -> Upload -> History path end to end
- Use real API + DynamoDB + S3 upload path, mocked social feed acceptable initially

## Phase 3: Social and Settings

- Add feed + friendship data model
- Complete settings profile and preferences endpoints

## Future Evolution

If scale demands it, this structure can split gradually:

- Keep mobile in `apps/mobile`
- Promote `services/api` domains to separate services
- Preserve `packages/contracts` as stable integration contract source
