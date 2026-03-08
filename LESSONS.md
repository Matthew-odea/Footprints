# Development Lessons: Avoiding Common Mistakes

This document captures patterns and mistakes encountered during development to avoid repeating them.

## Storage Layer Editing Pattern

### The Problem

The original `storage.py` (924 lines) combined an abstract base class with two implementations (MemoryDataStore and DynamoDataStore). When making edits:

1. **Large patch problem**: Applying large multi-method patches at once caused cascading indentation errors
2. **Syntax validation gap**: Not validating syntax immediately after each edit allowed errors to compound
3. **Blast radius**: A single misplaced bracket in one method affected 5+ downstream methods in the same class
4. **Review friction**: 900+ line diffs made code review nearly impossible

### The Solution: Small Patches + Immediate Validation

**Pattern**: For files >300 lines with multiple classes:
1. Split into smaller files (base.py, implementation1.py, implementation2.py)
2. When editing, change 1-2 lines at a time
3. Validate syntax immediately after each change with:
   ```bash
   python3 -c "from app.module import ClassA; from app.module import ClassB; print('✓ OK')"
   ```
4. Commit frequently (every 2-3 validated changes)

### Applied Solution: Storage Refactoring

Original structure:
```
storage.py (924 lines)
├── DataStore (abstract, ~100 lines)
├── MemoryDataStore (implementation, ~350 lines)
└── DynamoDataStore (implementation, ~470 lines)
```

Refactored to:
```
storage_base.py (100 lines)
├── DataStore (abstract)
├── utc_now_iso() (helper)

memory_store.py (340 lines)
└── MemoryDataStore (implementation)

dynamo_store.py (470 lines)
└── DynamoDataStore (implementation)

storage.py (12 lines)
└── Re-exports only (backward compatible)
```

**Benefits**:
- Each file <400 lines (cognitive load reduced)
- Edits to MemoryDataStore don't risk DynamoDataStore syntax
- Test fixture changes to validate syntax take 5-10 seconds, not 2 minutes
- Code review diffs now show intent, not indentation cascades

### Why This Matters

When implementing friend approval with bidirectional state tracking, the codebase needed:
- `seed_friends()` changes → `add_friend()` changes → `accept_friend_request()` changes
- Each change could be 3-5 lines of dict manipulation

With 924-line monolith:
- Patch #1: 15 lines, introduces indentation error at line 236 in unrelated code
- Patch #2: 20 lines, tries to fix error, creates orphaned code block
- Patch #3: 25 lines, cascading failure across 3 methods
- Result: Multiple revert cycles, 2+ hours of debugging

With split files:
- Patch #1 to memory_store.py: 3 lines, validate (10 sec)
- Patch #2 to memory_store.py: 2 lines, validate (8 sec)
- Patch #3 to dynamo_store.py: 4 lines, validate (9 sec)
- All tests passing in <90 seconds

## Friendship State Tracking Pattern

### The Data Model

Friend relationships are **bidirectional and symmetric**:

```
When alice sends friend request to bob:
  - alice.friendships += {request_id, friend_id=bob, status=pending, requested_by=alice, ...}
  - bob.friendships += {request_id, friend_id=alice, status=pending, requested_by=alice, ...}
                                           ^same request                       ^same requester
```

**Why this matters**: The `requested_by` field must be identical in both users' records so Bob knows who initiated.

### The Mistake: Asymmetric State

If alice's record has `requested_by=alice` but bob's has `requested_by=bob`:
- `get_incoming_requests()` filters for `status=pending AND requested_by != user_id`
- Bob sees the request as "incoming" ✓
- Alice sees it as "outgoing" ✗ (should filter for `requested_by == user_id`)

**Prevention**: When creating bidirectional relationships, create both records in a single function and copy the same `request_id` and `requested_by` fields.

## Test Fixture Isolation Pattern

### The Problem

Tests share global state through class variables:

```python
class MemoryDataStore(DataStore):
    users_by_username: dict = {}    # Shared! Not reset between tests
    friendships: dict = {}           # Shared! Contaminates next test
```

A test that adds 5 friends affects the next test's friend count.

### The Solution: Singleton + State Reset

```python
# conftest.py
TEST_STORE = MemoryDataStore()  # Single instance, preserved across tests

@pytest.fixture()
def reset_memory_store():
    """Clear user/friendship state, keep prompts."""
    MemoryDataStore.users_by_username.clear()
    MemoryDataStore.users_by_id.clear()
    MemoryDataStore.completions_by_user.clear()
    MemoryDataStore.friendships.clear()
    # NOTE: Don't clear prompts_by_id (seeded once at app startup)

@pytest.fixture()
def client(reset_memory_store):
    app.dependency_overrides[get_store] = lambda: TEST_STORE
    # ... TestClient setup
    app.dependency_overrides.clear()
```

**Key insight**: Dependency overrides must be set in the fixture's `setup` phase (before test runs), not in teardown. The override must point to a persistent singleton so seeded data survives test boundaries.

## Validation Checklist

After any edit to `storage.py` or similar large files:

- [ ] Syntax check: `python3 -c "from app.repositories.storage import ..."`
- [ ] Test check: `pytest tests/integration/test_friend_requests.py -q`
- [ ] If test fails, revert change and re-assess scope
- [ ] If test passes, commit with message: `fix(storage): [method] - [what changed]`

## Summary

The refactoring from 924-line monolith to 3-file split reduced edit friction from 2+ hour cascading failures to <2 minute validate/test cycles. This enables confident iteration on complex features like bidirectional friendship tracking.

**Golden rule**: If a file has multiple implementations (MemoryStore, DynamoDB, etc.), split them before adding features. The short-term cost of refactoring saves 10x debugging time later.
