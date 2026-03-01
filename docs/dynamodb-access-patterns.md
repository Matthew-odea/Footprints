# Footprints DynamoDB Access Pattern Design

## Purpose

Define a practical single-table DynamoDB model for MVP that supports the core user flows:

- Login and profile fetch
- Active prompts list
- Prompt detail
- Completion submit
- User history timeline
- Friend/community feed
- Settings read/update

## Table Design

Use one core table:

- `footprints_core`

Primary keys:

- `PK` (partition key)
- `SK` (sort key)

Common attributes:

- `entityType`
- `createdAt`
- `updatedAt`
- `userId`
- `promptId`
- `completionId`
- optional `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`, `GSI3PK`, `GSI3SK`

## Entity Shapes

## 1) User Profile

- `PK = USER#{userId}`
- `SK = PROFILE`
- `entityType = USER_PROFILE`

## 2) User Settings

- `PK = USER#{userId}`
- `SK = SETTINGS`
- `entityType = USER_SETTINGS`

## 3) User Stats Snapshot

- `PK = USER#{userId}`
- `SK = STATS`
- `entityType = USER_STATS`

## 4) Prompt Metadata

- `PK = PROMPT#{promptId}`
- `SK = META`
- `entityType = PROMPT`
- `GSI1PK = PROMPTS#ACTIVE`
- `GSI1SK = CAT#{category}#PRI#{priority}#PROMPT#{promptId}`

## 5) User Completion

- `PK = USER#{userId}`
- `SK = COMP#{completedAtIso}#{completionId}`
- `entityType = COMPLETION`
- `GSI2PK = PROMPT#{promptId}`
- `GSI2SK = COMP#{completedAtIso}#USER#{userId}`
- `GSI3PK = COMPLETION#{completionId}`
- `GSI3SK = META`

## 6) Friendship Edge

- `PK = USER#{userId}`
- `SK = FRIEND#{friendUserId}`
- `entityType = FRIENDSHIP`

## 7) Feed Projection Item (fanout on write)

- `PK = FEED#{userId}`
- `SK = TS#{completedAtIso}#COMP#{completionId}`
- `entityType = FEED_ITEM`
- `actorUserId`, `promptTitle`, `photoUrl`, `location`, `note`

## Access Patterns to Endpoints

## `GET /me`

- Query `PK=USER#{userId}` for `PROFILE` and `STATS`.

## `PATCH /me/settings`

- Upsert `PK=USER#{userId}`, `SK=SETTINGS`.

## `GET /prompts/active`

- Query GSI1 where `GSI1PK=PROMPTS#ACTIVE`.
- Optional prefix filter in `GSI1SK` for category.

## `GET /prompts/{id}`

- Get item `PK=PROMPT#{id}`, `SK=META`.

## `POST /completions`

- Write completion item under user partition.
- Fanout feed items to each friend partition (`FEED#{friendId}`).
- Update user stats item.

## `GET /history`

- Query user partition with `SK begins_with COMP#`, descending by `SK`.

## `GET /feed`

- Query `PK=FEED#{userId}` with pagination by `SK`.

## Recommended GSIs

- **GSI1**: active prompt discovery
  - `GSI1PK`, `GSI1SK`
- **GSI2**: prompt analytics and moderation views
  - `GSI2PK`, `GSI2SK`
- **GSI3**: completion id direct lookup
  - `GSI3PK`, `GSI3SK`

## Write Flow Notes

- Completion submit is the main write transaction.
- Keep it idempotent with client-generated `completionId`.
- Use DynamoDB conditional writes to prevent duplicate completion records.
- Feed fanout can be async if friend count grows.

## Scaling Notes

- For very active users, add date bucket to feed PK:
  - `PK = FEED#{userId}#{yyyyMM}`
- For high-volume analytics, stream changes to a dedicated analytics store.

## MVP Constraints

- Prioritize correctness of user-history and prompt-completion path.
- Keep feed simple and eventually consistent.
- Add more GSIs only when a real query needs them.
