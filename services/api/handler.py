"""
Lambda handler for FastAPI application using Mangum ASGI adapter.
"""
import sys
from pathlib import Path

# Add app directory to path so imports work
app_dir = Path(__file__).parent / "app"
if str(app_dir) not in sys.path:
    sys.path.insert(0, str(app_dir.parent))

from mangum import Mangum
from app.main import app

# Create Lambda handler from FastAPI app
handler = Mangum(app, lifespan="off")
