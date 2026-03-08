"""
Storage layer providing unified data access.

This module re-exports the abstract DataStore interface and its implementations:
- MemoryDataStore: In-memory storage for development and testing
- DynamoDataStore: AWS DynamoDB-backed storage for production
"""

from app.repositories.storage_base import DataStore, utc_now_iso
from app.repositories.memory_store import MemoryDataStore
from app.repositories.dynamo_store import DynamoDataStore

__all__ = ["DataStore", "MemoryDataStore", "DynamoDataStore", "utc_now_iso"]
