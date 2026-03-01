#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${ROOT_DIR}/apps/mobile"
npm install

cd "${ROOT_DIR}/services/api"
python3 -m pip install -e ".[dev]"

echo "bootstrap complete"
