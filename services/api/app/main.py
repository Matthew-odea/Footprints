from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import auth, completions, health, history, prompts, users
from app.core.config import get_settings
from app.dependencies import get_store

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(prompts.router, prefix=settings.api_prefix)
app.include_router(completions.router, prefix=settings.api_prefix)
app.include_router(history.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)


@app.on_event("startup")
def seed_defaults() -> None:
    store = get_store()
    store.seed_prompts(
        [
            {
                "id": "prompt-1",
                "title": "Plant a tree in your neighborhood",
                "description": "Plant a tree to help improve local biodiversity and air quality.",
                "category": "environment",
                "guidance": [
                    "Contact local environmental groups",
                    "Check city tree planting programs",
                    "Research native species for your area",
                ],
                "active": True,
            },
            {
                "id": "prompt-2",
                "title": "Go on a 30 minute run",
                "description": "Get moving and track a simple 30-minute cardio session.",
                "category": "wellbeing",
                "guidance": [
                    "Pick a safe route",
                    "Warm up for 5 minutes",
                    "Log your run details after completion",
                ],
                "active": True,
            },
            {
                "id": "prompt-3",
                "title": "Volunteer at a local organization",
                "description": "Spend time helping a local community initiative.",
                "category": "community",
                "guidance": [
                    "Find a local organization",
                    "Choose one volunteer slot",
                    "Capture what you contributed",
                ],
                "active": True,
            },
        ]
    )
