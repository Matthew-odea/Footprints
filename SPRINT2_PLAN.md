# Sprint 2 Planning Document

**Sprint Duration**: 2 weeks (March 10-23, 2026)  
**Goal**: Build friend system and friend-filtered feed  
**Status**: Planning

---

## Overview

Sprint 1 delivered the core photo upload and community feed MVP. Sprint 2 will build the social layer by implementing a proper friend system, allowing users to add/manage friends and see activity specifically from their friends.

**Key Problem Solved**: Currently, the feed shows all public completions. This sprint enables users to build a personal network and focus on friends' activities.

---

## Goals

1. **Enable friend relationships** - Users can add/remove friends
2. **Friend-filtered feed** - Show friend activity prominently
3. **Friend discovery** - Browse and manage friend connections
4. **Improves engagement** - Makes app more social and personal

---

## Sprint 2 Stories & Tasks

### Phase 1: Friend Model & Backend (Days 1-3)

**Story 1.1: Friend CRUD Operations**
- [ ] Add friend (POST /api/v1/friends)
  - Validation: Can't add self, can't add twice
  - Returns: Friendship with "pending" status
- [ ] Remove friend (DELETE /api/v1/friends/{friend_id})
  - Returns: 204 OK
- [ ] List friends (GET /api/v1/friends)
  - Returns: List of friendships with status, user info
- [ ] Get friend status (GET /api/v1/friends/{friend_id})
  - Returns: Friendship details
- **Time Estimate**: 8 hours
- **Tech**: FastAPI routes, DynamoDB queries, validation

**Story 1.2: Friend Seeding & Test Data**
- [ ] Seed demo user friendships for testing
  - Create 3 test friends in memory store
  - Create corresponding DynamoDB items
- [ ] Add friend test data to fixtures
- **Time Estimate**: 4 hours

**Story 1.3: Update Feed to Filter by Friends**
- [ ] Modify GET /api/v1/feed to accept filter parameter
  - Query param: `filter=friends|all` (default: all)
  - Filter: Show only friend's completions when filter=friends
- [ ] Keep pagination support
- **Time Estimate**: 6 hours

**Phase 1 Total**: 18 hours (~2 days)

---

### Phase 2: Mobile Friend Management Screen (Days 4-6)

**Story 2.1: Friends Screen UI**
- [ ] Create FriendsScreen.tsx (new tab)
  - Display list of current friends
  - Show friend name, mutual friends count, action button
  - FlatList with friend cards
- [ ] Design/styling for friend cards
  - Profile pic (placeholder icon)
  - Name and status
  - Add/Remove buttons
- **Time Estimate**: 6 hours

**Story 2.2: Friend Service & API Integration**
- [ ] Create src/services/friends.ts
  - `addFriend(token, username)` - POST /api/v1/friends
  - `removeFriend(token, friendId)` - DELETE
  - `getFriends(token)` - GET list
  - `searchUsers(token, query)` - Find users to add
- [ ] Error handling and loading states
- **Time Estimate**: 5 hours

**Story 2.3: Add Friend Functionality**
- [ ] "Search for friend" modal/screen
  - Text input for username
  - Search results list (autocomplete)
  - Add button on each result
- [ ] Handle add success/error states
- [ ] Refresh friends list after add
- **Time Estimate**: 6 hours

**Phase 2 Total**: 17 hours (~2 days)

---

### Phase 3: Feed Filtering & Navigation (Days 7-9)

**Story 3.1: Feed Filter Toggle**
- [ ] Add filter buttons to FeedScreen
  - "All" (default) - all public completions
  - "Friends" - only friend activity
  - Toggle between views
- [ ] Implement filter logic in getFeed() call
- **Time Estimate**: 4 hours

**Story 3.2: Update Navigation**
- [ ] Add Friends tab to bottom tab navigator (after Feed)
  - Icon: Ionicons "people"
  - Position: between Feed and History
- [ ] Update AppTabParamList types
- **Time Estimate**: 2 hours

**Story 3.3: Add Friend Quick Action from Feed**
- [ ] Long-press on completion card → show "Follow" button
- [ ] Optional: Quick follow from completion author name
- **Time Estimate**: 3 hours

**Phase 3 Total**: 9 hours (~1 day)

---

### Phase 4: Backend Testing (Days 10-11)

**Story 4.1: Friend Endpoint Tests**
- [ ] test_add_friend (success, validation)
- [ ] test_remove_friend (success, not found)
- [ ] test_list_friends (pagination)
- [ ] test_get_friend_status
- [ ] test_feed_filter_by_friends
- [ ] Full end-to-end flow: add friend → see in feed
- **Time Estimate**: 8 hours

**Phase 4 Total**: 8 hours (~1 day)

---

### Phase 5: Mobile Testing & Optimization (Days 12-13)

**Story 5.1: Unit Tests for Friends Service**
- [ ] Test addFriend, removeFriend, getFriends
- [ ] Test error handling
- [ ] Test loading states
- **Time Estimate**: 5 hours

**Story 5.2: Component Tests for FriendsScreen**
- [ ] Test rendering friend list
- [ ] Test add/remove friend actions
- [ ] Test empty state
- **Time Estimate**: 4 hours

**Story 5.3: Integration Testing**
- [ ] Manual test on device/emulator
- [ ] Add friend flow
- [ ] View friend's activity in feed
- [ ] Remove friend and verify feed updates
- **Time Estimate**: 4 hours

**Phase 5 Total**: 13 hours (~2 days)

---

### Phase 6: Deployment & Documentation (Days 14)

**Story 6.1: Deploy Backend**
- [ ] Build Lambda with friend endpoints
- [ ] Verify all endpoints are live
- [ ] Smoke test in production
- **Time Estimate**: 2 hours

**Story 6.2: Build & Deploy Mobile**
- [ ] Commit all changes
- [ ] GitHub Actions builds APK
- [ ] Verify on device
- **Time Estimate**: 1 hour

**Story 6.3: Documentation**
- [ ] Update sprint results
- [ ] Document friend API endpoints
- [ ] Add friend system to README
- **Time Estimate**: 2 hours

**Phase 6 Total**: 5 hours (~0.5 days)

---

## Technical Specifications

### Backend Changes

**DynamoDB Schema Updates**

```
Friendship Entity:
- PK: USER#{user_id}
- SK: FRIEND#{friend_id}
- Attributes:
  - status: "pending" | "accepted" | "blocked"
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
  - displayName: Friend's display name (for quick access)
```

**New Endpoints**

```
POST /api/v1/friends
- Body: { "friend_id": str } or { "username": str }
- Returns: { friendship_id, user_id, friend_id, status, created_at }

DELETE /api/v1/friends/{friend_id}
- Returns: 204 No Content

GET /api/v1/friends
- Query: page, limit
- Returns: { items: [Friendship], next_cursor? }

GET /api/v1/friends/{friend_id}
- Returns: Friendship details

GET /api/v1/feed?filter=friends
- When filter=friends: Only return completions from friends
- Default: All public completions (current behavior)

GET /api/v1/users/search?q=username
- Search for users to add as friends
- Returns: { items: [{ user_id, username, display_name }] }
```

**Updated Repositories**

```python
# storage.py additions
add_friend(user_id, friend_id) -> dict
remove_friend(user_id, friend_id) -> bool
get_friends(user_id, limit, cursor) -> tuple[list, cursor]
get_friend(user_id, friend_id) -> dict
search_users(query, limit) -> list[dict]
```

### Mobile Changes

**New Files**
- `src/screens/FriendsScreen.tsx` (~250 lines)
- `src/screens/AddFriendModal.tsx` (~150 lines)
- `src/services/friends.ts` (~100 lines)

**Modified Files**
- `src/screens/FeedScreen.tsx` - Add filter buttons
- `src/navigation/AppNavigator.tsx` - Add Friends tab
- `src/navigation/types.ts` - Update AppTabParamList

**New Services**

```typescript
// friends.ts
addFriend(token, friendId|username): Promise<Friendship>
removeFriend(token, friendId): Promise<void>
getFriends(token, limit?, cursor?): Promise<{ items, next_cursor }>
searchUsers(token, query): Promise<User[]>
```

---

## Success Criteria

### Backend ✅
- [ ] All 5 friend endpoints working
- [ ] Friend CRUD fully tested (8+ tests)
- [ ] Feed filtering by friends working
- [ ] No performance regressions

### Mobile ✅
- [ ] Friends network is intuitive
- [ ] Can add friend in < 15 seconds
- [ ] Feed filter toggles smoothly
- [ ] All tests passing

### User Experience ✅
- [ ] Users can build networks
- [ ] Friend activity is clear in feed
- [ ] Friend-filtered view increases engagement
- [ ] No bugs in friend management

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Friend filtering breaks pagination | High | Test with multiple friends early |
| UI gets cluttered with toggle | Medium | Design toggle carefully, test UX |
| Friend search is slow | Medium | Index usernames in DynamoDB |
| Users confused by "all" vs "friends" | Medium | Clear labeling and icons |

---

## Dependencies & Prerequisites

**Before Sprint 2 Starts:**
- [ ] Sprint 1 passed all manual QA on device
- [ ] No critical bugs in current deployment
- [ ] Lambda and S3 are stable

**External Dependencies:**
- None - all changes within controlled services

---

## Estimated Effort

| Phase | Hours | Days |
|-------|-------|------|
| Phase 1: Backend Friend CRUD | 18 | 2 |
| Phase 2: Mobile Screens | 17 | 2 |
| Phase 3: Feed Filtering & Nav | 9 | 1 |
| Phase 4: Backend Testing | 8 | 1 |
| Phase 5: Mobile Testing | 13 | 2 |
| Phase 6: Deployment | 5 | 0.5 |
| **Total** | **70** | **8.5 days** |

**Buffer**: 1.5 days for unforeseen issues  
**Total Sprint**: 10 days (fits in 2-week sprint)

---

## Definition of Done

A feature is done when:
- ✅ Code is written and reviewed
- ✅ Unit tests passing (>80% coverage)
- ✅ Integration tests passing
- ✅ Manual QA completed on device
- ✅ No regressions in existing features
- ✅ Deployed to production
- ✅ Documentation updated

---

## Post-Sprint 2 Opportunities

**If we finish early:**
1. Image compression for uploads
2. User profiles with activity summary
3. Notifications for friend activity
4. Activity status (online/offline)
5. Direct messaging

**Future Sprints:**
- Sprint 3: Activity sharing & notifications
- Sprint 4: User profiles & discovery
- Sprint 5: Performance & optimizations

---

## Questions & Next Steps

1. **Start Date**: March 10, 2026?
2. **Any features you want to prioritize?**
3. **Any concerns about the scope?**

Ready to start Sprint 2 planning sessions or jump into Phase 1?
