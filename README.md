# Footprints

Footprints is a mobile-first wellbeing and community-impact app.

This repository is structured as a monolith with:

- `apps/mobile`: React Native (Expo) frontend
- `services/api`: Python FastAPI backend
- `packages/contracts`: shared OpenAPI artifacts
- `infra`: deployment and local helper scripts

## Milestone 0 Status

Milestone 0 baseline is implemented with a minimal end-to-end flow:

- Login
- Active prompt list
- Prompt detail
- Completion submit
- History view

## Quick Start

1. Copy env templates:

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp services/api/.env.example services/api/.env
```

2. Install dependencies:

```bash
make bootstrap
```

3. Run backend:

```bash
make api
```

4. Run mobile app in a second terminal:

```bash
make mobile
```

## Useful Commands

```bash
make test
make seed
make reset
make export-openapi
```

## Planning Docs

- `docs/planning.md`
- `docs/monolith-structure.md`
- `docs/dynamodb-access-patterns.md`
- `docs/deployment-framework.md`
- `docs/milestone-0-todos.md`
