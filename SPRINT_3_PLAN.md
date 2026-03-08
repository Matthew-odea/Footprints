# Sprint 3 Implementation Plan: Archive-First Design

**Sprint Dates:** March 22 - April 5, 2026  
**Theme:** From Feed to Archive  
**Goal:** Implement calendar view, entry details, favorites, and basic shared experiments  
**Definition of Done:** All 5 epics shipped with >90% test coverage  

---

## Epic 1: Archive Calendar & Gallery Views

### 1.1 Calendar Grid Component

**Description:** Month-at-a-glance calendar showing completed prompts  
**User Story:**
```
As a user, I want to see all my completions in a calendar view 
so I can quickly scan which days I was active.

Given I'm on Archive screen
When I tap the calendar
Then I see current month with completed days highlighted
And I can tap a day to see that entry
And I can swipe left/right to change months
```

**Acceptance Criteria:**
- [ ] Display current month (7 rows × 7 cols grid)
- [ ] Completed days show photo thumbnail (50×50px)
- [ ] Empty days show faded background
- [ ] Month navigation arrows work (previous/next)
- [ ] Tap day → scrolls to that entry in timeline
- [ ] Swipe left/right → navigates months smoothly
- [ ] Performance: Loads <500ms for 12-month view

**Technical Spec:**

```typescript
// Frontend: screens/ArchiveScreen.tsx
type ViewMode = 'calendar' | 'timeline';

const ArchiveScreen = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const completions = useQuery(GET_COMPLETIONS, { 
    userId, 
    month: currentMonth 
  });
  
  return (
    <SafeAreaView>
      <Header title="Archive" />
      <SegmentedControl 
        values={['Calendar', 'Timeline']} 
        onValueChange={(v) => setViewMode(v === 'Calendar' ? 'calendar' : 'timeline')}
      />
      {viewMode === 'calendar' ? (
        <CalendarGrid 
          currentMonth={currentMonth}
          completions={completions.data}
          onMonthChange={setCurrentMonth}
          onDayTap={(day) => scrollTo(day)}
        />
      ) : (
        <TimelineGallery completions={completions.data} />
      )}
    </SafeAreaView>
  );
};

// Component: CalendarGrid.tsx
interface CalendarGridProps {
  currentMonth: Date;
  completions: Completion[];
  onMonthChange: (date: Date) => void;
  onDayTap: (day: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentMonth, completions, onMonthChange, onDayTap }) => {
  const weeks = getWeeksForMonth(currentMonth);
  const completionsByDate = groupBy(completions, 'date'); // e.g., "2026-03-15"
  
  return (
    <VStack>
      <HStack space="md">
        <TouchableOpacity onPress={() => onMonthChange(prevMonth(currentMonth))}>
          <Icon name="chevron-left" />
        </TouchableOpacity>
        <Text font="title">{formatMonth(currentMonth)}</Text>
        <TouchableOpacity onPress={() => onMonthChange(nextMonth(currentMonth))}>
          <Icon name="chevron-right" />
        </TouchableOpacity>
      </HStack>
      
      {/* Day labels */}
      <HStack>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <VStack key={day} flex={1} align="center">
            <Text size="sm" color="gray">{day}</Text>
          </VStack>
        ))}
      </HStack>
      
      {/* Calendar grid */}
      {weeks.map((week, weekIdx) => (
        <HStack key={weekIdx}>
          {week.map((day, dayIdx) => {
            const dateStr = formatDate(day);
            const completion = completionsByDate[dateStr]?.[0];
            
            return (
              <VStack 
                key={dayIdx} 
                flex={1} 
                aspect={1}
                borderRadius="md"
                background={day.getMonth() !== currentMonth.getMonth() ? 'transparent' : 'cream'}
                onPress={() => completion && onDayTap(dateStr)}
              >
                {completion?.photo_url ? (
                  <Image 
                    source={{ uri: completion.photo_url }}
                    fill="cover"
                    borderRadius="sm"
                  />
                ) : (
                  <Text size="xs" color="gray">{day.getDate()}</Text>
                )}
              </VStack>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};
```

**Backend Changes:**

```python
# routes/archive.py (NEW)
@router.get("/completions", response_model=list[CompletionResponse])
async def get_completions(
    user_id: str,
    start_date: str,  # "2026-03-01"
    end_date: str,    # "2026-03-31"
    limit: int = 100,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """
    Get all completions for a month date range.
    Returns photo_url, date, note, location.
    """
    if current_user.user_id != user_id:
        raise HTTPException(403, "Not authorized")
    
    completions = await store.get_completions_by_date_range(
        user_id, start_date, end_date, limit, offset
    )
    return completions

# storage_base.py (ADD method)
async def get_completions_by_date_range(
    self, 
    user_id: str, 
    start_date: str, 
    end_date: str,
    limit: int,
    offset: int
) -> list[Completion]:
    """Query completions between two dates, ordered by date DESC"""
    pass
```

**Database Schema (DynamoDB):**

```
# Completion table (already exists, confirm)
PK: user_id
SK: completion_id
GSI-1 (user-date):
  PK: user_id
  SK: date (for range queries)
  
Query: user_id + date_range = O(n) where n = days in range
```

**Test Coverage:**

```python
# tests/integration/test_archive.py
def test_get_completions_returns_month():
    completions = get_completions(
        user_id="user1", 
        start_date="2026-03-01", 
        end_date="2026-03-31"
    )
    assert len(completions) == 15  # e.g., 15 in March
    assert all(c.date in date_range for c in completions)

def test_calendar_handles_empty_month():
    completions = get_completions(
        user_id="user2",  # no entries
        start_date="2026-03-01",
        end_date="2026-03-31"
    )
    assert completions == []

def test_calendar_navigates_months():
    # Confirm frontend can swipe through months without lag
    pass
```

### 1.2 Timeline Gallery View

**Description:** All entries as photo grid with infinite scroll  
**User Story:**
```
As a user, I want to see all my entries as photos
so I can visually browse my journey.

Given I'm on Archive > Timeline view
When I scroll down
Then I see more photos load
And I can tap a photo to open the full entry
```

**Acceptance Criteria:**
- [ ] Grid shows photos in 2 columns
- [ ] Each cell is 150×150px with photo overlay
- [ ] Text overlay: date, category badge
- [ ] Infinite scroll (load 20 at a time)
- [ ] Tap photo → open entry detail modal
- [ ] Pull to refresh works
- [ ] Performance: 60fps scrolling

**Technical Spec:**

```typescript
// Component: TimelineGallery.tsx
const TimelineGallery = ({ completions }: { completions: Completion[] }) => {
  const [displayedCount, setDisplayedCount] = useState(20);
  
  return (
    <FlatList
      data={completions}
      renderItem={({ item }) => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('EntryDetail', { completionId: item.id })}
          style={{ flex: 1 }}
        >
          <Image 
            source={{ uri: item.photo_url }}
            style={{ width: '100%', aspectRatio: 1 }}
          />
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 }}
          >
            <Text size="xs" color="white">{item.date}</Text>
            {item.category && <Badge label={item.category} />}
          </LinearGradient>
        </TouchableOpacity>
      )}
      numColumns={2}
      onEndReached={() => setDisplayedCount(c => c + 20)}
      refreshControl={<RefreshControl onRefresh={refetch} />}
    />
  );
};
```

---

## Epic 2: Entry Detail Panel

### 2.1 Entry Detail Screen

**Description:** Full-screen view of single entry with comments  
**User Story:**
```
As a user, I want to see the full entry with comments
so I can remember the context and read friend feedback.

Given I'm viewing an entry
When I scroll
Then I see the photo, my note, comments, and engagement
And I can like/favorite the entry
And I can scroll comments to see replies
```

**Acceptance Criteria:**
- [ ] Display photo (full width)
- [ ] Display prompt + user's note (editable by owner)
- [ ] Display metadata (date, location, category)
- [ ] Show like count (not visible to others)
- [ ] Display threaded comments (replies indented)
- [ ] Comment input at bottom
- [ ] Edit/delete own comments
- [ ] Delete own entry (with confirmation)

**Technical Spec:**

```typescript
// screens/EntryDetailScreen.tsx
interface EntryDetailScreenProps {
  route: { params: { completionId: string } };
}

const EntryDetailScreen: React.FC<EntryDetailScreenProps> = ({ route }) => {
  const { completionId } = route.params;
  const { data: entry, isLoading } = useQuery(GET_ENTRY, { completionId });
  const { data: comments } = useQuery(GET_COMMENTS, { completionId });
  
  const [commentText, setCommentText] = useState('');
  const [isFavorited, setIsFavorited] = useState(entry?.favorited_by_me);
  
  const handleAddComment = async () => {
    await mutations.addComment(completionId, commentText);
    setCommentText('');
    refetch();
  };
  
  const handleFavorite = async () => {
    if (isFavorited) {
      await mutations.removeFavorite(completionId);
    } else {
      await mutations.addFavorite(completionId);
    }
    setIsFavorited(!isFavorited);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <ScrollView>
      {/* Header */}
      <SafeAreaView>
        <HStack justify="space-between" padding="md">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size="lg" />
          </TouchableOpacity>
          <Text font="title">{entry.prompt_title}</Text>
          {entry.is_owner && (
            <Menu>
              <MenuItem 
                label="Edit" 
                onPress={() => navigation.navigate('EditEntry', { completionId })}
              />
              <MenuItem 
                label="Delete" 
                destructive
                onPress={handleDeleteEntry}
              />
            </Menu>
          )}
        </HStack>
      </SafeAreaView>
      
      {/* Entry Content */}
      <VStack padding="md" space="md">
        {/* Photo */}
        <Image 
          source={{ uri: entry.photo_url }}
          aspectRatio={1}
          borderRadius="lg"
        />
        
        {/* Engagement Ribbon */}
        <HStack justify="space-around" borderTopWidth={1} borderColor="cream" paddingTop="md">
          <TouchableOpacity onPress={handleFavorite} flex={1}>
            <HStack justify="center" space="xs">
              <Icon 
                name={isFavorited ? "heart-fill" : "heart"} 
                color={isFavorited ? "coral" : "gray"}
              />
              <Text size="sm">{entry.like_count}</Text>
            </HStack>
          </TouchableOpacity>
          <Divider vertical />
          <HStack justify="center" space="xs" flex={1}>
            <Icon name="chat" />
            <Text size="sm">{comments.length}</Text>
          </HStack>
        </HStack>
        
        {/* Metadata */}
        <VStack space="xs" background="cream" padding="md" borderRadius="md">
          <HStack>
            <Icon name="calendar" size="sm" />
            <Text size="sm">{formatDate(entry.date)}</Text>
          </HStack>
          {entry.location && (
            <HStack>
              <Icon name="location" size="sm" />
              <Text size="sm">{entry.location}</Text>
            </HStack>
          )}
          {entry.category && (
            <Badge label={entry.category} />
          )}
        </VStack>
        
        {/* User's Note */}
        <VStack space="xs">
          <Text font="title" size="md">Your Note</Text>
          <Text>{entry.note || "(No note added)"}</Text>
        </VStack>
        
        {/* Comments Section */}
        <Divider />
        <Text font="title" size="md">Comments</Text>
        
        {comments.length === 0 ? (
          <Text color="gray" align="center" padding="md">
            No comments yet. Be the first!
          </Text>
        ) : (
          <VStack space="md">
            {comments.map((comment) => (
              <CommentThread 
                key={comment.id} 
                comment={comment}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
              />
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
    
    {/* Comment Input (sticky footer) */}
    <VStack 
      padding="md" 
      borderTopWidth={1} 
      borderColor="cream"
      background="white"
      safeAreaBottom
    >
      <HStack space="md" align="center">
        <TextInput 
          placeholder="Leave encouragement..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={280}
          flex={1}
        />
        <TouchableOpacity 
          onPress={handleAddComment}
          disabled={!commentText.trim()}
        >
          <Icon name="send" color={commentText ? 'terracotta' : 'gray'} />
        </TouchableOpacity>
      </HStack>
      <Text size="xs" color="gray" align="right">
        {commentText.length}/280
      </Text>
    </VStack>
  );
};

// Component: CommentThread.tsx
interface CommentThreadProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, text: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  
  return (
    <VStack space="xs" key={comment.id}>
      {/* Main Comment */}
      <HStack space="md" align="flex-start">
        <Avatar name={comment.author_name} size="sm" />
        <VStack flex={1} space="xs">
          <HStack justify="space-between" align="center">
            <Text font="bold" size="sm">{comment.author_name}</Text>
            <Text size="xs" color="gray">{timeAgo(comment.created_at)}</Text>
          </HStack>
          
          {editMode ? (
            <VStack space="xs">
              <TextInput 
                value={editText}
                onChangeText={setEditText}
                multiline
              />
              <HStack space="xs">
                <TouchableOpacity onPress={() => onEdit(comment.id, editText)}>
                  <Text color="terracotta" size="xs">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditMode(false)}>
                  <Text color="gray" size="xs">Cancel</Text>
                </TouchableOpacity>
              </HStack>
            </VStack>
          ) : (
            <Text>{comment.text}</Text>
          )}
          
          {/* Actions */}
          <HStack space="sm">
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
              <Text color="terracotta" size="xs">
                {isExpanded ? 'Hide' : `${comment.reply_count} Replies`}
              </Text>
            </TouchableOpacity>
            {comment.is_author && !editMode && (
              <>
                <TouchableOpacity onPress={() => setEditMode(true)}>
                  <Text color="terracotta" size="xs">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(comment.id)}>
                  <Text color="red" size="xs">Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </HStack>
        </VStack>
      </HStack>
      
      {/* Replies */}
      {isExpanded && comment.replies && (
        <VStack marginLeft="lg" space="xs" paddingLeft="md" borderLeftWidth={1} borderColor="cream">
          {comment.replies.map(reply => (
            <CommentReply key={reply.id} reply={reply} />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
```

**Backend Changes:**

```python
# routes/entries.py
@router.get("/entries/{completion_id}", response_model=EntryDetailResponse)
async def get_entry_detail(completion_id: str, current_user = Depends(get_current_user)):
    """Get full entry with engagement counts"""
    completion = await store.get_completion(completion_id)
    
    # Check permissions (owner or friend with access)
    if not is_authorized_to_view(current_user.user_id, completion.user_id):
        raise HTTPException(403, "Not authorized")
    
    like_count = await store.get_favorite_count(completion_id)
    is_favorited = await store.is_favorited_by_user(completion_id, current_user.user_id)
    
    return EntryDetailResponse(
        **completion.dict(),
        like_count=like_count,
        favorited_by_me=is_favorited,
        is_owner=(current_user.user_id == completion.user_id)
    )

# routes/comments.py (NEW)
@router.get("/completions/{completion_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    completion_id: str,
    include_replies: bool = True,
    current_user = Depends(get_current_user)
):
    """Get comments for an entry (threaded)"""
    comments = await store.get_comments(completion_id)
    
    # Only return if user is owner or friend
    completion = await store.get_completion(completion_id)
    if not is_authorized_to_view(current_user.user_id, completion.user_id):
        raise HTTPException(403, "Not authorized")
    
    if include_replies:
        for comment in comments:
            comment.replies = await store.get_comment_replies(comment.id)
    
    return comments

@router.post("/completions/{completion_id}/comments", response_model=CommentResponse)
async def create_comment(
    completion_id: str,
    body: CreateCommentRequest,
    current_user = Depends(get_current_user)
):
    """Add comment to entry"""
    # Validate authorization
    completion = await store.get_completion(completion_id)
    if not is_friend_or_owner(current_user.user_id, completion.user_id):
        raise HTTPException(403, "Can only comment on friends' entries")
    
    comment = await store.create_comment(
        completion_id=completion_id,
        user_id=current_user.user_id,
        text=body.text,
        parent_comment_id=body.parent_comment_id  # For replies
    )
    
    return comment

@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user = Depends(get_current_user)):
    """Delete own comment"""
    comment = await store.get_comment(comment_id)
    
    if comment.user_id != current_user.user_id:
        raise HTTPException(403, "Can only delete own comments")
    
    await store.delete_comment(comment_id)
    return {"status": "deleted"}

# schemas/entries.py
class ServerComment(BaseModel):
    comment_id: str
    completion_id: str
    author_name: str
    author_id: str
    text: str
    created_at: str
    updated_at: str
    is_author: bool  # Computed for current user
    reply_count: int
    replies: list['ServerComment'] = []

class EntryDetailResponse(BaseModel):
    completion_id: str
    prompt_title: str
    photo_url: str
    note: str
    date: str
    location: str
    category: str
    like_count: int
    favorited_by_me: bool
    is_owner: bool

# storage_base.py (ADD methods)
async def create_comment(
    self, 
    completion_id: str, 
    user_id: str, 
    text: str,
    parent_comment_id: str = None
) -> Comment:
    pass

async def get_comments(self, completion_id: str) -> list[Comment]:
    pass

async def get_comment_replies(self, comment_id: str) -> list[Comment]:
    pass

async def delete_comment(self, comment_id: str) -> None:
    pass

async def get_favorite_count(self, completion_id: str) -> int:
    pass

async def is_favorited_by_user(self, completion_id: str, user_id: str) -> bool:
    pass
```

**Database Schema (DynamoDB):**

```
# NEW: Comments table
PK: completion_id
SK: comment_id
Attributes:
  - user_id
  - text
  - created_at
  - updated_at
  - parent_comment_id (for threading)

GSI-1 (by user):
  PK: user_id
  SK: created_at
  (for user's comment history)

# NEW: Favorites table
PK: completion_id
SK: user_id
Attributes:
  - created_at

(Index for favorite_count: SELECT COUNT(*) WHERE PK=completion_id)
```

**Test Coverage:**

```python
# tests/integration/test_entries.py
def test_get_entry_detail_shows_engagement():
    entry = get_entry_detail("completion_1")
    assert entry.like_count >= 0
    assert entry.is_owner == True  # For owner
    assert hasattr(entry, 'favorited_by_me')

def test_add_comment_creates_entry():
    comment = create_comment("completion_1", "Great moment!")
    assert comment.text == "Great moment!"
    assert comment.is_author == True

def test_threaded_comments_show_replies():
    parent_comment = create_comment("completion_1", "Nice!")
    reply = create_comment("completion_1", "Thanks!", parent_id=parent_comment.id)
    
    comments = get_comments("completion_1", include_replies=True)
    assert comments[0].replies[0].text == "Thanks!"

def test_delete_comment_removes_entry():
    comment = create_comment("completion_1", "Oops")
    delete_comment(comment.id)
    comments = get_comments("completion_1")
    assert not any(c.id == comment.id for c in comments)

def test_cannot_comment_on_private_entries():
    # User A has private entry, User B tries to comment
    with raises(HTTPException) as exc:
        create_comment("completion_a", "Nice!", user_id="user_b")
    assert exc.status_code == 403
```

---

## Epic 3: Favorites/Bookmarking System

### 3.1 Favorite Toggle

**Description:** Mark entries as favorites for later curation  
**User Story:**
```
As a user, I want to favorite meaningful moments
so I can easily find them later for reflection.

Given I'm viewing an entry
When I tap the heart icon
Then the entry is saved to my Favorites
And I can filter archive to show only favorites
```

**Acceptance Criteria:**
- [ ] Heart icon in entry detail toggles favorite
- [ ] Visual feedback (icon fill changes)
- [ ] Favorite persists across app restarts
- [ ] Archive has "Favorites" filter tab
- [ ] Favorites can be collected into shareable lists

**Technical Spec:**

```typescript
// Action in Entry Detail
const handleFavorite = async () => {
  try {
    if (isFavorited) {
      await api.removeFavorite(completionId);
    } else {
      await api.addFavorite(completionId);
    }
    setIsFavorited(!isFavorited);
    showToast({
      title: isFavorited ? "Added to favorites" : "Removed from favorites",
      duration: 2000
    });
  } catch (error) {
    showError("Failed to update favorite");
  }
};

// Filter: Archive > Favorites view
const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');

{filterMode === 'favorites' && (
  <Text color="gray" align="center">
    {favoritedCompletions.length} saved moments
  </Text>
)}
```

**Backend:**

```python
# routes/favorites.py (NEW)
@router.post("/completions/{completion_id}/favorite")
async def add_favorite(completion_id: str, current_user = Depends(get_current_user)):
    """Mark entry as favorite"""
    favorite = await store.create_favorite(completion_id, current_user.user_id)
    return {"status": "favorited", "favorite_id": favorite.id}

@router.delete("/completions/{completion_id}/favorite")
async def remove_favorite(completion_id: str, current_user = Depends(get_current_user)):
    """Remove from favorites"""
    await store.delete_favorite(completion_id, current_user.user_id)
    return {"status": "unfavorited"}

@router.get("/favorites", response_model=list[CompletionResponse])
async def get_favorite_completions(
    current_user = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get all favorited completions"""
    favorites = await store.get_favorite_completions(
        current_user.user_id, limit, offset
    )
    return favorites
```

**Test Coverage:**

```python
def test_add_favorite():
    add_favorite("completion_1")
    fav_count = get_favorite_count("completion_1")
    assert fav_count == 1

def test_remove_favorite():
    add_favorite("completion_1")
    remove_favorite("completion_1")
    assert not is_favorited_by("completion_1", "user_1")

def test_favorite_persists():
    add_favorite("completion_1")
    # App restart
    assert is_favorited_by("completion_1", "user_1")

def test_get_favorites_returns_only_user_favorites():
    add_favorite("completion_1")
    add_favorite("completion_2")
    
    user2_favorites = get_favorite_completions(user_id="user_2")
    assert len(user2_favorites) == 0  # Different user
```

---

## Epic 4: Shared Experiments (Challenges)

### 4.1 Create & Invite to Experiment

**Description:** Create shared challenges (e.g., "14-day photo challenge")  
**User Story:**
```
As a user, I want to create a shared challenge with friends
so we can encourage each other.

Given I'm on Circle screen
When I tap "+ Create Experiment"
Then I add title, description, duration
And invite specific friends
And we all get notifications
```

**Acceptance Criteria:**
- [ ] Create experiment modal (name, description, start/end dates)
- [ ] Invite friends (checkboxes or search)
- [ ] Invited friends get notification + in-app invite
- [ ] Experiment shows progress ring (% complete)
- [ ] View each participant's completion count
- [ ] Friend can accept/decline invite

**Technical Spec:**

```typescript
// screens/CreateExperimentScreen.tsx
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [duration, setDuration] = useState(14);
const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

const handleCreate = async () => {
  const experiment = await api.createExperiment({
    name,
    description,
    duration_days: duration,
    invited_user_ids: selectedFriends
  });
  
  navigation.navigate('ExperimentDetail', { experimentId: experiment.id });
};

// Component: ExperimentCard.tsx
const ExperimentCard = ({ experiment }: { experiment: Experiment }) => {
  const [status, setStatus] = useState(experiment.user_status);
  
  const handleAccept = async () => {
    await api.joinExperiment(experiment.id);
    setStatus('active');
  };
  
  return (
    <Card>
      <VStack space="md">
        <Text font="title">{experiment.name}</Text>
        <Text color="gray">{experiment.description}</Text>
        
        {/* Progress */}
        {status === 'active' && (
          <VStack>
            <ProgressRing 
              percentage={(experiment.user_completions / experiment.duration_days) * 100}
              label={`${experiment.user_completions} / ${experiment.duration_days}`}
            />
            <Text size="sm" color="gray">
              {experiment.status === 'completed' ? 'Challenge completed!' : 'In progress'}
            </Text>
          </VStack>
        )}
        
        {/* Participants */}
        <VStack space="xs">
          <Text font="bold" size="sm">Participants</Text>
          <HStack space="xs">
            {experiment.participants.map(p => (
              <VStack key={p.user_id} align="center" space="xs">
                <Avatar name={p.name} />
                <Text size="xs">{p.completion_count}</Text>
              </VStack>
            ))}
          </HStack>
        </VStack>
        
        {/* Actions */}
        {status === 'invited' && (
          <HStack space="md">
            <Button 
              onPress={handleAccept}
              flex={1}
              label="Accept"
            />
            <Button 
              onPress={() => api.declineExperiment(experiment.id)}
              flex={1}
              variant="outline"
              label="Decline"
            />
          </HStack>
        )}
      </VStack>
    </Card>
  );
};
```

**Backend:**

```python
# routes/experiments.py (NEW)
@router.post("/experiments", response_model=ExperimentResponse)
async def create_experiment(
    body: CreateExperimentRequest,
    current_user = Depends(get_current_user)
):
    """Create a shared experiment"""
    experiment = await store.create_experiment(
        created_by=current_user.user_id,
        name=body.name,
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        invited_user_ids=body.invited_user_ids
    )
    
    # Send notifications to invited users
    for user_id in body.invited_user_ids:
        await notification_service.send(
            user_id=user_id,
            title=f"{current_user.name} invited you to '{body.name}'",
            type="experiment_invite",
            data={"experiment_id": experiment.id}
        )
    
    return experiment

@router.post("/experiments/{experiment_id}/join")
async def join_experiment(experiment_id: str, current_user = Depends(get_current_user)):
    """Accept experiment invite and join"""
    await store.join_experiment(experiment_id, current_user.user_id)
    return {"status": "joined"}

@router.get("/experiments", response_model=list[ExperimentResponse])
async def get_user_experiments(
    status: str = None,  # 'invited', 'active', 'completed'
    current_user = Depends(get_current_user)
):
    """Get all experiments user is invited to or participating in"""
    experiments = await store.get_user_experiments(
        current_user.user_id, 
        status=status
    )
    
    # Enrich with daily completion counts
    for exp in experiments:
        exp.user_completions = await store.count_completions(
            user_id=current_user.user_id,
            date_start=exp.start_date,
            date_end=exp.end_date
        )
        exp.participants = await store.get_experiment_participants(exp.id)
    
    return experiments
```

**Database Schema:**

```
# NEW: Experiments table
PK: experiment_id
SK: created_by#created_at
Attributes:
  - name
  - description
  - start_date
  - end_date
  - invited_user_ids (list)
  - status (active, completed, canceled)

# NEW: ExperimentParticipation table
PK: experiment_id
SK: user_id
Attributes:
  - status (invited, active, completed, declined)
  - joined_at
  - completed_count (number of days they completed)

GSI-1 (user view):
  PK: user_id
  SK: start_date
  (for listing user's experiments)
```

**Test Coverage:**

```python
def test_create_experiment():
    exp = create_experiment(
        name="March Challenge",
        duration_days=14,
        invited_user_ids=["user_2", "user_3"]
    )
    assert exp.name == "March Challenge"
    assert len(exp.invited_user_ids) == 2

def test_join_experiment():
    exp = create_experiment(invited_user_ids=["user_2"])
    join_experiment(exp.id, user_id="user_2")
    
    exp_data = get_experiment(exp.id)
    assert any(p.user_id == "user_2" and p.status == "active" 
               for p in exp_data.participants)

def test_experiment_progress_calculated():
    exp = create_experiment(duration_days=14)
    # User completes 3 prompts during experiment period
    
    exp_data = get_experiment(exp.id)
    assert exp_data.user_completions == 3
    assert exp_data.progress_percentage == 3/14 * 100
```

---

## Epic 5: Weekly Insights

### 5.1 Generate Weekly Insight

**Description:** Compute and show weekly stats  
**User Story:**
```
As a user, I want to see my weekly summary
so I can reflect on my progress.

Given it's Sunday night
When I open the app
Then I see a weekly digest card on Home
With stats on completions, streaks, patterns
```

**Acceptance Criteria:**
- [ ] Compute weekly_digest every Sunday 23:59 UTC
- [ ] Show completion count ("You completed 5 this week")
- [ ] Show streak status ("7-day streak maintained")
- [ ] Show top category
- [ ] Show personalized insight (rotates weekly message)
- [ ] Insight is shareable as card/image

**Technical Spec:**

```typescript
// HomeScreen insight card
const [insight, setInsight] = useState(null);

useEffect(() => {
  const fetchWeeklyInsight = async () => {
    const week = getWeekBoundaries(new Date());
    const insight = await api.getWeeklyInsight(
      week.start_date,
      week.end_date
    );
    setInsight(insight);
  };
  
  fetchWeeklyInsight();
}, []);

{insight && (
  <Card>
    <VStack space="md" padding="lg" background="cream" borderRadius="lg">
      <Text font="title" size="lg">Week of {formatDate(insight.week_start)}</Text>
      
      <HStack justify="space-around">
        <VStack align="center">
          <Text font="bold" size="xl">{insight.completion_count}</Text>
          <Text size="sm" color="gray">Completed</Text>
        </VStack>
        <VStack align="center">
          <Text font="bold" size="xl">{insight.current_streak}</Text>
          <Text size="sm" color="gray">Day Streak</Text>
        </VStack>
        <VStack align="center">
          {insight.top_category && (
            <>
              <Badge label={insight.top_category} />
              <Text size="xs" color="gray">Most</Text>
            </>
          )}
        </VStack>
      </HStack>
      
      <Divider />
      
      <Text size="md" align="center" font="italic">
        "{insight.personalized_message}"
      </Text>
      
      <Button 
        label="Share Week" 
        onPress={() => shareInsight(insight)}
        variant="outline"
      />
    </VStack>
  </Card>
)}
```

**Backend:**

```python
# routes/insights.py (NEW)
@router.get("/insights/weekly", response_model=WeeklyInsightResponse)
async def get_weekly_insight(
    start_date: str,
    end_date: str,
    current_user = Depends(get_current_user)
):
    """
    Get weekly summary for date range.
    Called by: Home screen on load, Weekly email generation
    """
    completions = await store.get_completions_by_date_range(
        current_user.user_id,
        start_date,
        end_date
    )
    
    # Compute metrics
    completion_count = len(completions)
    categories = [c.category for c in completions if c.category]
    top_category = Counter(categories).most_common(1)[0][0] if categories else None
    
    # Calculate current streak
    current_streak = await store.calculate_streak(current_user.user_id)
    
    # Generate personalized message
    message = _generate_weekly_message(
        completion_count,
        current_streak,
        top_category,
        completions
    )
    
    return WeeklyInsightResponse(
        week_start=start_date,
        week_end=end_date,
        completion_count=completion_count,
        current_streak=current_streak,
        top_category=top_category,
        personalized_message=message
    )

# Utility: message generation
def _generate_weekly_message(count, streak, category, completions):
    """Generate personalized weekly reflection"""
    messages = {
        'zero': [
            "Sometimes the best week is a rest week. 💚",
            "Life happens. Come back when you're ready.",
        ],
        'low': [  # 1-3
            "Small steps still move you forward.",
            "You showed up. That matters.",
        ],
        'medium': [  # 4-6
            "You're building something real here.",
            "Consistency is becoming your habit.",
        ],
        'high': [  # 7+
            "An incredible week of growth! 🌱",
            "You're unstoppable this week.",
        ],
        'category': {
            'fitness': "Your body is getting the attention it deserves.",
            'reflection': "Words matter. Keep exploring your thoughts.",
            'creative': "You're channeling your creativity beautifully.",
            'gratitude': "Gratitude is reshaping your perspective.",
        },
        'streak': {
            7: f"A week-long streak! Mark this moment 🔥",
            14: "Two weeks of consistency. You're truly committed.",
            21: f"Three weeks! You're unstoppable.",
            30: f"A month! {emoji} This is how change happens.",
        }
    }
    
    # Pick based on tier
    if count == 0:
        return random.choice(messages['zero'])
    elif count <= 3:
        base_msg = random.choice(messages['low'])
    elif count <= 6:
        base_msg = random.choice(messages['medium'])
    else:
        base_msg = random.choice(messages['high'])
    
    # Add streak bonus if milestone
    if streak in messages['streak']:
        return messages['streak'][streak]
    
    return base_msg

# Scheduled task (Lambda scheduled event)
@router.post("/admin/generate-weekly-insights")
async def generate_weekly_insights(event):
    """
    Run every Sunday 23:59 UTC.
    Generate insights for all users and send emails.
    Triggered by: CloudWatch Events rule
    """
    all_users = await store.get_all_users()
    
    for user in all_users:
        week = get_week_boundaries(datetime.now(timezone.utc))
        
        insight = await get_weekly_insight(
            week.start_date,
            week.end_date,
            current_user=user
        )
        
        # Store for later retrieval
        await store.save_weekly_insight(user.user_id, insight)
        
        # Send email
        await email_service.send_weekly_digest(
            user.email,
            user.name,
            insight
        )
    
    return {"status": "completed", "users_processed": len(all_users)}

# schemas/insights.py
class WeeklyInsightResponse(BaseModel):
    week_start: str
    week_end: str
    completion_count: int
    current_streak: int
    top_category: str = None
    personalized_message: str
    shareable_link: str = None  # Generated if user clicks "Share"
```

**Database Schema:**

```
# NEW: WeeklyInsights table (optional, for analytics)
PK: user_id
SK: week_start_date
Attributes:
  - completion_count
  - current_streak
  - top_category
  - personalized_message
  - created_at

(Used for historical tracking if needed)
```

**Test Coverage:**

```python
def test_get_weekly_insight():
    # Add 5 completions in a week
    insight = get_weekly_insight("2026-03-01", "2026-03-07")
    assert insight.completion_count == 5
    assert insight.current_streak > 0

def test_top_category_calculated():
    # Add 3 fitness, 2 reflection
    insight = get_weekly_insight("2026-03-01", "2026-03-07")
    assert insight.top_category == 'fitness'

def test_personalized_message_tier():
    # Test message varies by count
    insight_3 = get_weekly_insight_with_completions(3)
    assert insight_3.personalized_message contains "small"
    
    insight_7 = get_weekly_insight_with_completions(7)
    assert insight_7.personalized_message contains "incredible"

def test_weekly_insights_scheduled():
    # Trigger Sunday night job
    generate_weekly_insights()
    
    # Verify insights created for all users
    user_insight = get_stored_insight("user_1", "2026-03-01")
    assert user_insight is not None
```

---

## Timeline & Dependencies

### Phase 1: Foundation (Week 1-2)
- [ ] Epic 1.1: Calendar grid component
- [ ] Epic 1.2: Timeline gallery
- [ ] Backend: get_completions_by_date_range endpoint

### Phase 2: Interaction (Week 2-3)
- [ ] Epic 2.1: Entry detail screen
- [ ] Epic 3.1: Favorite toggle
- [ ] Backend: Comments table + endpoints
- [ ] Backend: Favorites table + endpoints

### Phase 3: Social (Week 3-4)
- [ ] Epic 4.1: Create + join experiments
- [ ] Backend: Experiments table + endpoints
- [ ] Notification infrastructure

### Phase 4: Reflection (Week 4)
- [ ] Epic 5.1: Weekly insights
- [ ] Scheduled tasks (Lambda @weekly)
- [ ] Email integration

---

## Success Criteria

### User Metrics
- [ ] Archive browsing time: >2 min/session
- [ ] Favorites per user: >3 per month
- [ ] Experiment participation: >80% of invited friends join
- [ ] Weekly insight shares: >40% of users share weekly

### Technical Metrics
- [ ] Test coverage: >90%
- [ ] API response time: <200ms (p95)
- [ ] DynamoDB queries: <50 RCU per user/day
- [ ] Zero breaking changes to existing endpoints
- [ ] Mobile app: <3MB size increase

### Quality Gates
- All tests passing ✅
- Zero console errors in mobile app ✅
- Accessibility (WCAG 2.1 AA) ✅
- Performance (Lighthouse >90) ✅

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Comment spam | Moderation queue, friend-only model reduces attack surface |
| Favorite explosion (UI lag) | Pagination + lazy loading |
| Experiment notification fatigue | Daily digest instead of real-time |
| Streak breakage (data bugs) | Comprehensive test suite + daily audit |
| Archive slowness (many photos) | Thumbnail generation + CDN caching |

---

## Rollout Plan

### Canary (5% of users)
- March 22-24: Archive calendar view only
- Metrics: Crash-free rate >99.9%, <5s load time mean
- Rollback window: 48 hours

### Beta (25% of users)
- March 25-29: Add entry detail + comments
- Metrics: Archive engagement >70%, comment sentiment positive
- Rollback window: 72 hours

### General Availability (100%)
- April 1: Full release (experiments + insights)
- Post-launch monitoring: 1 week (on-call rotation)

---

## Notes & Open Questions

1. **Comment moderation**: Do we need content review beyond friend-only? Defer to Sprint 4.
2. **Experiment themes**: Can users customize theme colors? Defer to Sprint 4.
3. **Email design**: Who owns template design? Design review in week 2.
4. **Internationalization**: Should weekly messages support multiple languages? Defer to Sprint 5.
5. **Analytics**: What events should we track? (Created in ANALYTICS_PLAN.md, separate sprint)

