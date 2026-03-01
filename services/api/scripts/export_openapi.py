import json
from pathlib import Path

from app.main import app


def main() -> None:
    output_path = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "openapi" / "api.v1.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(app.openapi(), indent=2), encoding="utf-8")
    print(str(output_path))


if __name__ == "__main__":
    main()
