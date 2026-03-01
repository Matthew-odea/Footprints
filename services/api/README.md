# Footprints API

## Run locally

```bash
python3 -m pip install -e ".[dev]"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Useful scripts

```bash
python3 scripts/seed_prompts.py
python3 scripts/reset_dev_data.py
python3 scripts/export_openapi.py
```
