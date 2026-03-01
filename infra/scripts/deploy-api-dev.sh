#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="${ROOT_DIR}/services/api"

echo "[deploy-api-dev] starting dev deploy"

if [[ ! -d "${API_DIR}" ]]; then
    echo "[deploy-api-dev] services/api not found. Nothing to deploy yet."
    exit 0
fi

if [[ -n "${API_DEPLOY_DEV_CMD:-}" ]]; then
    echo "[deploy-api-dev] running API_DEPLOY_DEV_CMD"
    bash -lc "${API_DEPLOY_DEV_CMD}"
    echo "[deploy-api-dev] completed"
    exit 0
fi

if [[ -f "${ROOT_DIR}/infra/terraform/environments/dev/main.tf" ]]; then
    echo "[deploy-api-dev] terraform dev stack detected"
    echo "[deploy-api-dev] TODO: wire terraform init/plan/apply for dev"
    exit 0
fi

if [[ -f "${ROOT_DIR}/serverless.yml" ]]; then
    echo "[deploy-api-dev] serverless.yml detected"
    echo "[deploy-api-dev] TODO: wire serverless deploy --stage dev"
    exit 0
fi

if [[ -f "${ROOT_DIR}/sst.config.ts" ]]; then
    echo "[deploy-api-dev] SST config detected"
    echo "[deploy-api-dev] TODO: wire sst deploy --stage dev"
    exit 0
fi

echo "[deploy-api-dev] no deployment framework detected"
echo "[deploy-api-dev] set API_DEPLOY_DEV_CMD in CI, or add terraform/serverless/sst config"
