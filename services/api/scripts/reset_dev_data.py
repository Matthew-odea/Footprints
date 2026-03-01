from app.repositories.storage import MemoryDataStore


def main() -> None:
    MemoryDataStore.users_by_username = {}
    MemoryDataStore.users_by_id = {}
    MemoryDataStore.prompts_by_id = {}
    MemoryDataStore.completions_by_user = {}
    print("memory datastore reset complete")


if __name__ == "__main__":
    main()
