# Human TODOs (Owner Actions)

This list covers the tasks that need to be done outside code changes.

## Completed by Copilot Now

- [x] Confirmed `python3` is available (`3.13.2`).
- [x] Created local env files from templates:
  - [x] `.env`
  - [x] `apps/mobile/.env`
  - [x] `services/api/.env`

## Can Be Completed with Your Credentials (I can help execute)

- [ ] Choose AWS account(s) for `dev` and `prod`.
- [ ] Create IAM deploy role(s) for GitHub Actions OIDC.
- [ ] Grant least-privilege permissions for:
  - [ ] DynamoDB table management and data access
  - [ ] S3 bucket management and object access
  - [ ] API runtime deployment path (Lambda/ECS/API Gateway as selected)
- [ ] Configure local AWS credentials/profile for Terraform apply.

- [ ] Run Terraform in `infra/terraform/environments/dev` and apply.
- [ ] Run Terraform in `infra/terraform/environments/prod` and apply.
- [ ] Record resource names/ARNs and region in team docs.
- [ ] Create budget alerts for AWS spend.

- [ ] Configure GitHub Environments (`dev`, `prod`) if you want protection rules.
- [ ] Add repository/environment secrets:
  - [ ] `EXPO_TOKEN`
  - [ ] AWS role or credential values used by deploy jobs
- [ ] Add optional variables:
  - [ ] `DEV_API_HEALTHCHECK_URL`
  - [ ] `PROD_API_HEALTHCHECK_URL`
  - [ ] `EXPO_ENABLE_SUBMIT` (set `true` only when ready)
- [ ] Require PR checks before merge on `main`.

- [ ] Create/confirm Expo account and EAS project linkage.
- [ ] Configure app identifiers for iOS and Android in Expo config.
- [ ] Prepare signing credentials (or configure managed credentials in EAS).
- [ ] Decide OTA branch strategy (`dev`, `prod`).

## Human Decision / Ownership Items

- [ ] Choose Node.js runtime policy for the team (`20` or `22` LTS recommended).
- [ ] Confirm auth strategy for post-MVP (Cognito vs custom JWT identity provider).
- [ ] Confirm data retention policy for completion photos.
- [ ] Confirm privacy defaults and feed visibility rules.
- [ ] Confirm moderation/reporting requirements and ownership.

- [ ] Define on-call owner for deploy failures.
- [ ] Define rollback process for API and mobile updates.
- [ ] Add basic uptime/health monitoring and alert channel.
- [ ] Schedule a milestone demo on a real device against `dev` backend.

## Notes

- Node currently reports `v21.7.1`; it works locally, but LTS (`20` or `22`) will reduce engine warnings in CI and local installs.
