# Sprint 1: Photo Upload & Community Feed

**Sprint Duration:** 2 weeks  
**Sprint Goal:** Enable real photo uploads for completions and launch community feed to drive social engagement

---

## 🎯 Sprint Objectives

1. **Photo Upload Flow**: Users can capture/select photos and upload to S3 when submitting completions
2. **Community Feed**: Users can view recent friend/community activity on a new Feed screen
3. **Friend Management**: Basic friend relationships to filter feed visibility

---

## 📊 Current State Analysis

### ✅ Already Implemented
- Backend: Completion API with `photo_url` and `share_with_friends` fields
- Backend: S3 config (`api_s3_bucket`, `api_s3_completions_prefix`) in settings
- Backend: DynamoDB table with completion records
- Mobile: PromptUploadScreen with text input for photo URL (placeholder)
- Mobile: Bottom tab navigation shell (Home, History, Settings)
- CI/CD: GitHub Actions building Android APKs + Expo Updates

### ❌ Missing for Sprint
- Backend: S3 presigned URL generation endpoint
- Backend: Feed query endpoint
- Backend: Friend relationship model + CRUD APIs
- Mobile: Camera/image picker integration
- Mobile: Photo upload flow with progress
- Mobile: Feed screen implementation
- Mobile: Friend management UI
- Tests: Integration tests for new features

---

## 👥 User Stories

### Story 1: Photo Upload
**As a user**, I want to take a photo with my phone camera when submitting a completion, so I can easily prove I did the activity.

**Acceptance Criteria:**
- [ ] User taps "Add Photo" button on PromptUploadScreen
- [ ] Camera opens (or image picker on simulator)
- [ ] User captures/selects image
- [ ] Image displays as preview thumbnail
- [ ] On submit, image uploads to S3 with progress indicator
- [ ] Completion saves with real S3 URL
- [ ] Error handling for upload failures

### Story 2: Community Feed
**As a user**, I want to see what activities my friends completed recently, so I feel motivated to participate.

**Acceptance Criteria:**
- [ ] New "Feed" tab in bottom navigation
- [ ] Feed screen shows list of recent completions from friends (or all users for MVP)
- [ ] Each feed item shows: user name, prompt title, photo, note, date, location
- [ ] Feed loads on screen open and supports pull-to-refresh
- [ ] Empty state when no feed items exist
- [ ] Error handling for API failures

### Story 3: Friend Connections (Simplified MVP)
**As a user**, I want to connect with other users, so my feed shows relevant activity.

**Acceptance Criteria (MVP scope - admin seeded for now):**
- [ ] Backend: Friend relationship table/model
- [ ] Backend: Seed script to create sample friendships
- [ ] Feed endpoint filters by `share_with_friends=true` and friend relationships
- [ ] (Defer to Sprint 2: User-facing friend search/add UI)

---

## 🏗️ Technical Implementation Plan

### Phase 1: Photo Upload Backend (Days 1-3)

#### Task 1.1: S3 Presigned URL Endpoint
**File:** `services/api/app/api/v1/routes/uploads.py` (new)

```python
@router.post("/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    request: UploadUrlRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate presigned S3 URL for completion photo upload"""
    # Validate file type (jpg, png, heic)
    # Generate unique S3 key: completions/{user_id}/{uuid}.{ext}
    # Create presigned POST URL (15 min expiry)
    # Return URL + fields for client upload
```

**Schema:** `services/api/app/schemas/uploads.py` (new)
```python
class UploadUrlRequest(BaseModel):
    file_type: str  # "image/jpeg", "image/png", etc
    
class UploadUrlResponse(BaseModel):
    upload_url: str
    upload_fields: dict[str, str]
    s3_key: str  # Final S3 path for completion record
```

**Dependencies:**
- Add `boto3` S3 client initialization in `app/core/aws.py`
- Add S3 bucket name validation on startup
- Update Lambda execution role with S3 PutObject permission

**Testing:**
- Unit test: presigned URL generation
- Integration test: Upload file via presigned URL, verify S3 object exists

---

#### Task 1.2: Update Completion Schema Validation
**File:** `services/api/app/schemas/completions.py`

Change `photo_url` validation:
```python
photo_url: str = Field(
    default="",
    pattern=r"^(https?://|s3://)",  # Validate URL format
    max_length=500
)
```

**Testing:**
- Unit test: Schema validation for valid/invalid URLs

---

### Phase 2: Photo Upload Mobile (Days 4-6)

#### Task 2.1: Install Image Picker Dependencies
**Commands:**
```bash
cd apps/mobile
npx expo install expo-image-picker expo-file-system
```

**Files to update:**
- `apps/mobile/app.json` - Add camera/photo permissions for iOS/Android
- `apps/mobile/package.json` - Lock versions

---

#### Task 2.2: Create Upload Service
**File:** `apps/mobile/src/services/upload.ts` (new)

```typescript
export async function requestUploadUrl(
    token: string,
    fileType: string
): Promise<{ uploadUrl: string; uploadFields: Record<string, string>; s3Key: string }> {
    // POST /api/v1/upload-url
}

export async function uploadPhotoToS3(
    uploadUrl: string,
    uploadFields: Record<string, string>,
    localUri: string
): Promise<void> {
    // Use expo-file-system to upload via presigned POST
    // Track upload progress
}
```

---

#### Task 2.3: Update PromptUploadScreen
**File:** `apps/mobile/src/screens/PromptUploadScreen.tsx`

Changes:
- Replace text input with image picker button
- Add preview thumbnail for selected image
- Add upload progress indicator
- Flow:
  1. User taps "Add Photo"
  2. Request camera/photo permissions
  3. Open image picker
  4. Store selected image URI in state
  5. On submit: request presigned URL → upload to S3 → submit completion with S3 key

**UI Components:**
- Camera/gallery selection modal
- Image preview with edit/remove options
- Upload progress bar
- Error toast

**Testing:**
- Manual test: Camera capture on device
- Manual test: Image picker on simulator
- Manual test: Upload progress display
- Manual test: Error handling (no permissions, upload failure)

---

### Phase 3: Friend & Feed Backend (Days 7-9)

#### Task 3.1: Friend Relationship Model
**File:** `services/api/app/repositories/storage.py`

DynamoDB schema (single table design):
```
PK: USER#{user_id}
SK: FRIEND#{friend_id}
---
GSI1PK: USER#{friend_id}  # Reverse lookup
GSI1SK: FRIEND#{user_id}
---
Attributes:
- status: "pending" | "accepted" | "blocked"
- created_at: ISO timestamp
```

**Methods:**
```python
async def add_friend(user_id: str, friend_id: str) -> None
async def get_friends(user_id: str) -> list[str]  # Returns friend IDs
async def are_friends(user_id: str, friend_id: str) -> bool
```

**Testing:**
- Unit test: Friend CRUD operations
- Unit test: Bidirectional relationship queries

---

#### Task 3.2: Feed Query Endpoint
**File:** `services/api/app/api/v1/routes/feed.py` (new)

```python
@router.get("", response_model=FeedResponse)
async def get_feed(
    limit: int = 20,
    cursor: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """Get recent completions from friends"""
    # Get user's friend list
    # Query completions where:
    #   - user_id IN friend_ids
    #   - share_with_friends = true
    #   - Sort by created_at DESC
    # Include user display name + prompt title
    # Return paginated results
```

**Schema:** `services/api/app/schemas/feed.py` (new)
```python
class FeedItem(BaseModel):
    completion_id: str
    user_id: str
    user_display_name: str
    prompt_title: str
    photo_url: str
    note: str
    location: str
    date: str
    created_at: str

class FeedResponse(BaseModel):
    items: list[FeedItem]
    next_cursor: str | None
```

**DynamoDB Query Pattern:**
- Add GSI: `GSI_FeedByUser` (PK: user_id, SK: created_at)
- Filter by share_with_friends index or application-level filter

**Testing:**
- Integration test: Feed returns friend completions only
- Integration test: Private completions excluded
- Integration test: Pagination works

---

#### Task 3.3: Seed Friends Data
**File:** `infra/scripts/seed_friends.py` (new)

Create sample friendships between existing test users for local dev and testing.

---

### Phase 4: Feed Mobile UI (Days 10-12)

#### Task 4.1: Create Feed Screen
**File:** `apps/mobile/src/screens/FeedScreen.tsx` (new)

UI Components:
- FlatList with pull-to-refresh
- Feed item card:
  - User avatar/name (placeholder circle for MVP)
  - Prompt title
  - Photo (full width)
  - Note text
  - Location + date
- Loading spinner
- Empty state: "No activity yet. Complete a prompt to inspire friends!"
- Error state with retry button

**State Management:**
- Feed items array
- Loading state
- Error state
- Pagination cursor

---

#### Task 4.2: Add Feed API Client
**File:** `apps/mobile/src/services/api.ts`

```typescript
export async function getFeed(
    token: string,
    cursor?: string
): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    return request<FeedResponse>("/api/v1/feed", {
        headers: { Authorization: `Bearer ${token}` },
        params: { cursor },
    });
}
```

---

#### Task 4.3: Add Feed to Navigation
**File:** `apps/mobile/src/navigation/AppNavigator.tsx`

Update tab navigator:
```tsx
<Tab.Screen
    name="Feed"
    component={FeedScreen}
    options={{
        tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
    }}
/>
```

**Testing:**
- Manual test: Feed screen loads items
- Manual test: Pull-to-refresh works
- Manual test: Pagination loads more items
- Manual test: Empty state displays correctly
- Manual test: Error state + retry works

---

### Phase 5: Testing & Quality (Days 13-14)

#### Task 5.1: Backend Integration Tests
**File:** `services/api/tests/integration/test_photo_upload_flow.py` (new)

Test cases:
- User requests upload URL → uploads file → creates completion with S3 URL
- Invalid file type rejected
- Expired presigned URL fails gracefully

**File:** `services/api/tests/integration/test_feed_flow.py` (new)

Test cases:
- User with friends sees their completions in feed
- Private completions excluded from feed
- User without friends sees empty feed
- Pagination returns correct subset

---

#### Task 5.2: Mobile Manual Test Plan
**File:** `docs/sprint-1-test-plan.md` (new)

Create comprehensive test checklist for:
- Photo upload happy path
- Photo upload error cases
- Feed display and interaction
- Edge cases (no photo, no friends, network errors)

---

#### Task 5.3: Performance Testing
- Photo upload: Test with large images (10MB+)
- Feed: Test with 100+ items (pagination performance)
- Mobile: Test on low-end Android device

---

### Phase 6: Deployment (Day 14)

#### Task 6.1: Update Lambda Permissions
**File:** `infra/terraform/modules/api_lambda/main.tf` (or SAM template)

Add S3 permissions to Lambda execution role:
```hcl
statement {
  actions = [
    "s3:PutObject",
    "s3:GetObject",
  ]
  resources = [
    "${aws_s3_bucket.completions.arn}/*"
  ]
}
```

---

#### Task 6.2: Deploy Backend
```bash
cd services/api
sam build && sam deploy --stack-name footprints-api-dev
```

Run smoke tests against deployed API:
- Test upload URL generation
- Test feed endpoint

---

#### Task 6.3: Deploy Mobile
```bash
cd apps/mobile
git add . && git commit -m "feat: photo upload + feed implementation"
git push  # Triggers GitHub Actions
```

Wait for:
- Android APK build completes
- Share APK link with testers

Also publish Expo Update for existing installed APKs:
```bash
npx eas update --auto
```

---

## 📦 Dependencies & Prerequisites

### Required Before Starting
- [ ] AWS S3 bucket created (or use existing)
- [ ] S3 bucket CORS configured for presigned POST
- [ ] Lambda IAM role has S3 permissions
- [ ] Test devices/simulators available with camera access

### External Dependencies
- expo-image-picker: Camera/gallery access
- expo-file-system: Upload handling
- boto3: S3 presigned URL generation (already installed)

---

## 🚨 Risks & Mitigations

### Risk 1: Large Photo Uploads
**Impact:** Slow uploads on mobile data  
**Mitigation:**
- Compress images before upload (expo-image-manipulator)
- Show upload progress indicator
- Add cancel upload option
- Set reasonable size limit (5MB)

### Risk 2: S3 Costs
**Impact:** Unexpected AWS bills  
**Mitigation:**
- Set S3 lifecycle policy (delete after 90 days for MVP)
- Monitor CloudWatch metrics
- Set billing alerts at $50, $100 thresholds

### Risk 3: Friend Graph Complexity
**Impact:** Query performance degrades with many friends  
**Mitigation:**
- Start with simple all-users feed for MVP
- Add friend filtering in Sprint 2
- Use DynamoDB GSI for efficient queries
- Implement pagination from day 1

### Risk 4: Camera Permissions on iOS
**Impact:** App rejected if permissions not properly explained  
**Mitigation:**
- Add clear NSCameraUsageDescription in app.json
- Add NSPhotoLibraryUsageDescription
- Test permission flows thoroughly

---

## 📏 Definition of Done

### Backend
- [ ] Upload URL endpoint deployed and accessible
- [ ] Feed endpoint deployed and returns data
- [ ] Friend relationships seeded in DynamoDB
- [ ] Unit tests pass (>80% coverage for new code)
- [ ] Integration tests pass
- [ ] API documented in OpenAPI spec

### Mobile
- [ ] Camera/picker flow works on device
- [ ] Photo uploads successfully to S3
- [ ] Upload progress displays correctly
- [ ] Completion saves with real S3 URL
- [ ] Feed screen displays friend activity
- [ ] Pull-to-refresh works
- [ ] Empty/error states implemented
- [ ] No TypeScript errors
- [ ] Lint passes

### Deployment
- [ ] Backend deployed to Lambda
- [ ] Mobile APK built via CI/CD
- [ ] Expo Update published
- [ ] Smoke tests pass on production
- [ ] Test users can complete full flow

### Documentation
- [ ] Sprint retrospective completed
- [ ] Known issues logged
- [ ] Sprint 2 backlog updated

---

## 🔄 Sprint Ceremonies

### Daily Standup (15 min)
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

### Mid-Sprint Review (Day 7)
- Demo photo upload flow (backend + mobile POC)
- Adjust scope if needed (cut friend mgmt to Sprint 2?)

### Sprint Review (Day 14)
- Demo full working flow:
  1. User logs in
  2. Selects prompt
  3. Takes photo
  4. Submits completion with photo
  5. Views completion in history with photo
  6. Views friend's completion in feed
- Gather feedback from stakeholders

### Sprint Retrospective (Day 14)
- What went well?
- What didn't go well?
- What will we improve in Sprint 2?

---

## 📊 Success Metrics

### Sprint Goals
- [ ] 100% of user stories completed (if all 3 stories done)
- [ ] 0 P0 bugs remaining
- [ ] Test coverage >80% for new code
- [ ] Mobile APK successfully installs on 3 test devices

### User Metrics (post-sprint)
- Photo upload success rate >95%
- Feed engagement: >50% users view feed after completing prompt
- Avg time to submit completion with photo <2 min

---

## 🗓️ Detailed Timeline

### Week 1: Photo Upload
| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Backend: Presigned URL endpoint | API endpoint working in local dev |
| 2 | Backend: Testing + deployment prep | Unit tests pass, Lambda permissions updated |
| 3 | Mobile: Image picker integration | Camera/gallery opens, image selected |
| 4 | Mobile: Upload flow | Photo uploads to S3 with progress |
| 5 | Mobile: Integration + testing | Full upload flow works end-to-end |

### Week 2: Feed
| Day | Focus | Deliverable |
|-----|-------|-------------|
| 6 | Backend: Friend model + seed | Friend relationships in DynamoDB |
| 7 | Backend: Feed endpoint | Feed API returns friend completions |
| 8 | Mobile: Feed screen UI | Feed screen displays static data |
| 9 | Mobile: Feed integration | Feed loads real data from API |
| 10 | Testing: Integration tests | All integration tests pass |
| 11 | Testing: Manual QA | Test plan executed, bugs logged |
| 12 | Bug fixes + polish | P0 bugs resolved |
| 13 | Deployment | Backend deployed, APK built |
| 14 | Demo + retrospective | Sprint reviewed, Sprint 2 planned |

---

## 🚀 Sprint 2 Preview (Next)

Based on Sprint 1 outcomes, Sprint 2 will focus on:

1. **Friend Management UI**
   - User search/discovery
   - Send/accept friend requests
   - Friend list management

2. **Photo Improvements**
   - Image compression/optimization
   - Multiple photo support
   - Photo filters/editing

3. **Feed Enhancements**
   - Like/react to posts
   - Comments on completions
   - Share to external platforms

4. **Habit Mechanics**
   - Streak tracking
   - Completion stats dashboard
   - Achievement badges

---

## 📝 Notes

- This is an ambitious 2-week sprint. If falling behind by mid-sprint, consider:
  - Moving friend management to Sprint 2 (simplify feed to show all public completions)
  - Deferring image compression/optimization
  - Reducing test coverage target to 70%

- Keep daily communication tight to unblock issues quickly

- Prioritize working end-to-end flow over pixel-perfect UI

- Document all technical decisions and trade-offs made during sprint
