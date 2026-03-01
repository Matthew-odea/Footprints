#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="${ROOT_DIR}/services/api"

echo "[deploy-api-prod] starting prod deploy"

if [[ ! -d "${API_DIR}" ]]; then
    echo "[deploy-api-prod] services/api not found. Nothing to deploy yet."
    exit 0
fi

if [[ -n "${API_DEPLOY_PROD_CMD:-}" ]]; then
    echo "[deploy-api-prod] running API_DEPLOY_PROD_CMD"
    bash -lc "${API_DEPLOY_PROD_CMD}"
    echo "[deploy-api-prod] completed"
    exit 0
fi

if [[ -f "${ROOT_DIR}/infra/terraform/environments/prod/main.tf" ]]; then
    echo "[deploy-api-prod] terraform prod stack detected"
    echo "[deploy-api-prod] TODO: wire terraform init/plan/apply for prod"
    exit 0
fi

if [[ -f "${ROOT_DIR}/serverless.yml" ]]; then
    echo "[deploy-api-prod] serverless.yml detected"
    echo "[deploy-api-prod] TODO: wire serverless deploy --stage prod"
    exit 0
fi

if [[ -f "${ROOT_DIR}/sst.config.ts" ]]; then
    echo "[deploy-api-prod] SST config detected"
    echo "[deploy-api-prod] TODO: wire sst deploy --stage prod"
    exit 0
fi

echo "[deploy-api-prod] no deployment framework detected"
echo "[deploy-api-prod] set API_DEPLOY_PROD_CMD in CI, or add terraform/serverless/sst config"
