# Footprints Deployment Framework

## Recommended Path

Use an AWS-first backend deployment and Expo EAS for mobile delivery.

- Mobile app delivery: Expo EAS Build + EAS Submit + EAS Update
- Backend runtime: AWS Lambda + API Gateway (MVP default)
- Data and storage: DynamoDB + S3
- CI/CD: GitHub Actions

This is usually the best low-cost path while keeping a clean long-term platform direction.

## Environment Model

Start with two environments:

- `dev`
- `prod`

Branch mapping:

- `main` -> deploy `dev` automatically
- tagged release (`v*`) -> deploy `prod` with approval

## MVP Automated Pipeline (Easy + Cheap)

## 1) CI for Pull Requests

On PRs:

- Mobile: typecheck, lint, tests
- API: lint, tests
- Optional: generate OpenAPI and fail if contract drift is detected

## 2) CD for Backend (AWS)

On merge to `main`:

1. Build backend package
2. Deploy infrastructure and API to `dev`
3. Run smoke tests against `dev` endpoint

On release tag:

1. Require manual approval
2. Deploy to `prod`
3. Run smoke tests
4. Publish deployment summary in GitHub Actions output

## 3) CD for Mobile

On merge to `main`:

- Publish OTA update to `dev` channel via EAS Update

On release tag:

- Build production binaries via EAS Build
- Submit to app stores via EAS Submit (optional until ready)

## Tooling Choices

## Backend deploy tooling

Choose one for MVP:

- **SST**: fastest developer experience for Lambda-centric apps
- **Serverless Framework**: mature and widely documented
- **Terraform**: best for long-term standardization, slower for initial velocity

Given your current stage, start with **SST or Serverless Framework**, then consolidate to Terraform later.

## CI/CD host

- GitHub Actions is sufficient for MVP and low cost.

## Secrets Management

- GitHub Environments for deploy-time secrets
- AWS Secrets Manager or SSM Parameter Store for runtime secrets
- Never store credentials in repo or `.env` committed files

## Suggested Workflow Files

- `.github/workflows/ci-mobile.yml`
- `.github/workflows/ci-api.yml`
- `.github/workflows/deploy-api-dev.yml`
- `.github/workflows/deploy-api-prod.yml`
- `.github/workflows/mobile-ota-dev.yml`
- `.github/workflows/mobile-release.yml`

These workflow files are now scaffolded in the repository as starter pipelines.

## Bootstrap Checklist

To make the scaffolded workflows actually deploy:

1. Add deploy scripts:
	- `infra/scripts/deploy-api-dev.sh`
	- `infra/scripts/deploy-api-prod.sh`
2. Configure runtime credentials for GitHub Actions runners:
	- AWS credentials or OIDC role access for deploy jobs
	- `EXPO_TOKEN` for EAS OTA/build jobs
3. Set optional healthcheck URLs for smoke tests:
	- `DEV_API_HEALTHCHECK_URL`
	- `PROD_API_HEALTHCHECK_URL`
4. Set optional mobile release toggle:
	- `EXPO_ENABLE_SUBMIT=true` when ready for store submission

Until these are configured, deploy workflows will run in safe no-op mode with notices/warnings.

## Cost-Aware Notes

- Lambda + API Gateway + DynamoDB + S3 is usually very cheap at low/medium MVP traffic.
- Keep CloudWatch retention short in dev.
- Use on-demand DynamoDB initially.
- Add budget alerts from day one.

## Long-Term Pipeline Maturity (TBD Roadmap)

## Stage 1 (Now)

- Single-region deploys
- Basic smoke tests
- Manual prod approval

## Stage 2

- Blue/green or canary for API
- Contract tests between mobile and API
- Automated rollback hooks

## Stage 3

- Policy-as-code checks
- Load tests in CI for release candidates
- Multi-region disaster recovery strategy