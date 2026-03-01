# Human TODOs (Owner Actions)

This list covers the tasks that need to be done outside code changes.

## 1) Local Machine Setup

- [ ] Use Node.js 20 or 22 LTS (current Node 21 works but shows engine warnings).
- [ ] Confirm `python3` is available and points to Python 3.12+.
- [ ] Copy env templates:
  - [ ] `.env.example` -> `.env`
  - [ ] `apps/mobile/.env.example` -> `apps/mobile/.env`
  - [ ] `services/api/.env.example` -> `services/api/.env`

## 2) AWS Account and IAM

- [ ] Choose AWS account(s) for `dev` and `prod`.
- [ ] Create IAM deploy role(s) for GitHub Actions OIDC.
- [ ] Grant least-privilege permissions for:
  - [ ] DynamoDB table management and data access
  - [ ] S3 bucket management and object access
  - [ ] API runtime deployment path (Lambda/ECS/API Gateway as selected)
- [ ] Configure local AWS credentials/profile for Terraform apply.

## 3) Infrastructure Provisioning

- [ ] Run Terraform in `infra/terraform/environments/dev` and apply.
- [ ] Run Terraform in `infra/terraform/environments/prod` and apply.
- [ ] Record resource names/ARNs and region in team docs.
- [ ] Create budget alerts for AWS spend.

## 4) GitHub Repo Configuration

- [ ] Configure GitHub Environments (`dev`, `prod`) if you want protection rules.
- [ ] Add repository/environment secrets:
  - [ ] `EXPO_TOKEN`
  - [ ] AWS role or credential values used by deploy jobs
- [ ] Add optional variables:
  - [ ] `DEV_API_HEALTHCHECK_URL`
  - [ ] `PROD_API_HEALTHCHECK_URL`
  - [ ] `EXPO_ENABLE_SUBMIT` (set `true` only when ready)
- [ ] Require PR checks before merge on `main`.

## 5) Mobile Distribution Setup

- [ ] Create/confirm Expo account and EAS project linkage.
- [ ] Configure app identifiers for iOS and Android in Expo config.
- [ ] Prepare signing credentials (or configure managed credentials in EAS).
- [ ] Decide OTA branch strategy (`dev`, `prod`).

## 6) Product and Security Decisions

- [ ] Confirm auth strategy for post-MVP (Cognito vs custom JWT identity provider).
- [ ] Confirm data retention policy for completion photos.
- [ ] Confirm privacy defaults and feed visibility rules.
- [ ] Confirm moderation/reporting requirements and ownership.

## 7) Operational Readiness

- [ ] Define on-call owner for deploy failures.
- [ ] Define rollback process for API and mobile updates.
- [ ] Add basic uptime/health monitoring and alert channel.
- [ ] Schedule a milestone demo on a real device against `dev` backend.
