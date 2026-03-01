# Footprints API

## Run locally

```bash
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Useful scripts

```bash
python scripts/seed_prompts.py
python scripts/reset_dev_data.py
python scripts/export_openapi.py
```
