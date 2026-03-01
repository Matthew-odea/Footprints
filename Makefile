SHELL := /bin/bash

.PHONY: bootstrap mobile api dev test seed reset export-openapi

bootstrap:
	cd apps/mobile && npm install
	cd services/api && python3 -m pip install -e ".[dev]"

mobile:
	cd apps/mobile && npm run start

api:
	cd services/api && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev:
	@echo "Run API and mobile in two terminals: make api && make mobile"

test:
	cd services/api && python3 -m pytest -q
	cd apps/mobile && npm run test -- --watch=false

seed:
	cd services/api && python3 scripts/seed_prompts.py

reset:
	cd services/api && python3 scripts/reset_dev_data.py

export-openapi:
	cd services/api && python3 scripts/export_openapi.py
