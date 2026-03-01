import json

from app.dependencies import get_store


DEFAULT_PROMPTS = [
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


def main() -> None:
    store = get_store()
    store.seed_prompts(DEFAULT_PROMPTS)
    print(json.dumps({"seeded": len(DEFAULT_PROMPTS)}))


if __name__ == "__main__":
    main()
