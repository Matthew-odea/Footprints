# Infrastructure & Repository Structure

**This is a brief reference.** For actual implementation details, see the codebase.

---

## Repository Structure

The project follows a **monorepo pattern** with clear separation of concerns:

```
footprints/
├── apps/mobile/              # React Native (Expo) app
│   ├── app/                  # App entry point
│   ├── src/
│   │   ├── features/         # Feature modules (auth, prompts, feed, etc.)
│   │   ├── services/         # API client, storage services
│   │   └── components/       # Reusable components
│   └── package.json
│
├── services/api/             # Python FastAPI backend
│   ├── app/
│   │   ├── api/v1/routes/    # API endpoints
│   │   ├── repositories/     # Data access (storage layer)
│   │   ├── schemas/          # Pydantic models
│   │   └── core/             # Config, security, logging
│   ├── tests/                # Unit + integration tests
│   └── pyproject.toml
│
├── infra/                    # AWS infrastructure
│   ├── terraform/            # IaC (DynamoDB, S3, Lambda, API Gateway)
│   ├── docker/               # Dockerfiles if needed
│   └── scripts/              # Deployment scripts
│
├── docs/                     # Legacy docs (mostly archived)
├── Makefile                  # Development shortcuts
├── MASTER_PLAN.md            # Product roadmap & status
├── PRODUCT_VISION.md         # Design system & philosophy
├── SPRINT_3_PLAN.md          # Detailed implementation specs
└── LESSONS.md                # Process + architecture lessons
```

---

## Tech Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | React Native + Expo + TypeScript | SDK 54, React 18.3.1 |
| **Backend** | Python FastAPI + Pydantic | 3.13, runs on AWS Lambda |
| **Database** | AWS DynamoDB | NoSQL, single table (`footprints_core`) |
| **Storage** | AWS S3 + CloudFront | Photo uploads + CDN |
| **Auth** | JWT (custom implementation) | Stored in AWS Secrets Manager (post-Sprint 2) |
| **Deployment** | AWS Lambda + API Gateway | HTTPS endpoint |
| **Mobile CD** | Expo EAS Build + Updates | OTA updates + production builds |
| **CI/CD** | GitHub Actions | Test on pull requests, deploy on merge |

---

## Deployment Architecture

### Backend
- **Runtime**: AWS Lambda (Python 3.13)
- **API**: API Gateway (HTTPS)
- **Database**: DynamoDB (on-demand billing)
- **Storage**: S3 + CloudFront
- **IaC**: Terraform (see `infra/terraform/`)

**Live Endpoint**: `https://9fal46jhxe.execute-api.us-east-1.amazonaws.com`

### Mobile
- **Build**: Expo EAS Build (Android + iOS)
- **Distribution**: 
  - **Dev**: Expo Go (preview channel)
  - **Production**: Google Play Store + Apple App Store (when ready)
- **OTA Updates**: Expo EAS Updates

### Environments
- **dev**: Automatic deploy on `main` branch push
- **prod**: Manual approval, tagged releases (`v*`)

---

## Local Development

### Setup
```bash
make bootstrap          # Install dependencies (mobile + backend)
make mobile            # Start Expo dev server
make api               # Start FastAPI dev server
make test              # Run all tests
```

See [README.md](README.md) for detailed setup.

### Configuration
- `.env` — Root-level config
- `apps/mobile/.env` — Mobile environment
- `services/api/.env` — API environment

---

## Data Model

### Core Tables (DynamoDB)

**footprints_core** (single table, multiple entity types via `entity_type` and type-specific keys):
- Users (email, auth, profile)
- Prompts (daily prompts, rotating)
- Completions (activity submissions, photos, notes)
- Friendships (bidirectional requests + accepted relationships)
- (Coming Sprint 3): Comments, Favorites, Experiments, Insights

See `docs/dynamodb-access-patterns.md` for detailed schema (legacy, reference only).

---

## CI/CD Workflows

### On Pull Request
- Mobile: Lint, typecheck, tests
- API: Lint, type-check, tests
- Status checks block merge if failing

### On Merge to `main`
- **Backend**: Deploy to `dev` environment, run smoke tests
- **Mobile**: Publish OTA update to `dev` channel

### On Release Tag (`v*`)
- **Manual approval required**
- **Backend**: Deploy to `prod` environment
- **Mobile**: Build production binaries, publish to app stores (when ready)

---

## Cost Management

- **DynamoDB**: On-demand billing (scales with usage)
- **Lambda**: Free tier covers MVP usage, ~$0.10-0.50/mo at scale
- **S3**: Minimal storage cost (<$1/mo for MVP)
- **CloudFront**: Small amount (included in free tier for MVP)
- **Total estimated**: <$10/month for MVP-scale users (50-100 active)

---

## Security

- **Secrets**: JWT secret stored in AWS Secrets Manager (not in code)
- **HTTPS**: API Gateway enforces HTTPS only
- **CORS**: Configured for mobile app origin only
- **Token-based auth**: JWT with expiration
- **User isolation**: Users can only access their own data (auth guard on all endpoints)

See `LESSONS.md` for setup discipline practices.

---

## Adding Features in Sprint 3+

When implementing new features:

1. **Backend**: Add routes in `services/api/app/api/v1/routes/`, schemas in `services/api/app/schemas/`
2. **Storage**: Add methods to `services/api/app/repositories/storage_base.py` and implement in both `memory_store.py` and `dynamo_store.py`
3. **Mobile**: Add feature folder in `apps/mobile/src/features/`, integrate API client
4. **Tests**: Add integration tests in `services/api/tests/integration/`, mobile tests in `apps/mobile/**/*.test.ts`
5. **DynamoDB**: Update table schema if needed (test locally first, then migrate prod)

---

## Useful Shortcuts

See [Makefile](Makefile) for common commands:
- `make bootstrap` — Install all dependencies
- `make mobile` — Start mobile dev server
- `make api` — Start backend dev server  
- `make test` — Run all tests
- `make test-mobile` — Run mobile tests only
- `make test-api` — Run backend tests only

---

**For detailed product and technical planning, see:**
- [MASTER_PLAN.md](MASTER_PLAN.md) — Roadmap + status
- [SPRINT_3_PLAN.md](SPRINT_3_PLAN.md) — Epic specifications
- [PRODUCT_VISION.md](PRODUCT_VISION.md) — Design system + philosophy
