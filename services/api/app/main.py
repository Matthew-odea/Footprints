from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import (
    auth,
    archive,
    comments,
    completions,
    favorites,
    feed,
    friends,
    health,
    history,
    prompts,
    uploads,
    users,
)
from app.core.config import get_settings
from app.dependencies import get_store

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown lifecycle."""
    # Startup
    seed_defaults()
    yield
    # Shutdown (if needed in future)


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


app = FastAPI(title=settings.app_name, lifespan=lifespan)

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
app.include_router(archive.router, prefix=settings.api_prefix)
app.include_router(comments.router, prefix=settings.api_prefix)
app.include_router(favorites.router, prefix=settings.api_prefix)
app.include_router(uploads.router, prefix=settings.api_prefix + "/uploads")
app.include_router(feed.router, prefix=settings.api_prefix + "/feed")
app.include_router(friends.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
