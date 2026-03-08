# Footprints Product Vision: Collected Growth

**Version:** 2.0  
**Date:** March 8, 2026  
**Status:** Active  
**Next Review:** Post-Sprint 3

---

## 1. Core Philosophy

**"Your journal. Your circle. Your progress. None of it competitive."**

Footprints is a **wellbeing archive with intimate social**, not a broadcast platform. Users document their daily journeys through guided prompts, see their growth patterns over time, and celebrate progress with close friends—without comparison, algorithms, or gamification anxiety.

**Key Principle**: The app is **archive-first, not feed-first**. Your data owns the narrative.

---

## 2. What Makes Footprints Different

### From Strava
- ✅ Metrics (streaks, heatmaps) like Strava
- ❌ **No public leaderboards or comparison**
- ❌ No athlete ranking or badge hunting
- Activity is personal, not performance

### From Apple Fitness
- ✅ Celebration moments (progression rings)
- ✅ Warm, encouraging tone
- ❌ **Not just workouts—reflective moments**
- Photos and notes matter as much as data

### From Letterboxd  
- ✅ Curation and bookmarking
- ✅ Threaded social engagement
- ❌ **Not about reviewing others**
- Archive is YOUR story, friends are invited to witness

### From Instagram/BeReal
- ✅ Visual, moment-based
- ❌ **No algorithm, no infinite scroll**
- ❌ No strangers, no public metrics
- Connections are intentional and intimate

---

## 3. User Experience Vision

### Mental Model
Users think of Footprints as:
1. **Personal journal** (calendar + timeline of their activities)
2. **Growth dashboard** (how am I trending?)
3. **Friend circle** (who's on this journey with me?)

NOT as:
- A social feed (no algorithm)
- A competition (no leaderboards)
- A broadcast platform (closed circle only)

### Core User Journey

```
┌─────────────────────────────────────────────┐
│ DAILY RITUAL                                │
│ 1. See today's prompt (beautiful hero)      │
│ 2. Mark complete or upload photo            │
│ 3. See week's streak progress               │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ ARCHIVE BROWSING                            │
│ 1. Flip through calendar grid               │
│ 2. Favorite meaningful moments              │
│ 3. See patterns (what days am I active?)    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ SOCIAL: INVITED WITNESSES                   │
│ 1. Friends see my archive (if I share)      │
│ 2. Leave genuine encouragement              │
│ 3. Join challenges together                 │
│ 4. No comparison, no FOMO                   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ REFLECTION                                  │
│ 1. Weekly insights: "You completed 5"       │
│ 2. Monthly review: key moments + trends     │
│ 3. Shareable link (not public post)         │
└─────────────────────────────────────────────┘
```

---

## 4. Navigation Structure

### Bottom Tab Navigation (5 tabs)

```
┌────────┬────────┬────────┬────────┬────────┐
│ Home   │Archive │ Circle │Insights│Settings│
├────────┼────────┼────────┼────────┼────────┤
│Today's │Calendar│Friends │Weekly  │Profile │
│prompt &│& photos│& shared│& yearly│& prefs │
│streak  │Timeline│exprnts │digest  │& logout│
└────────┴────────┴────────┴────────┴────────┘
```

### Screen Hierarchy

**Home (Ritual Focus)**
- Today's prompt (hero)
- This week stats (ring + heatmap + count)
- Personal insight (rotates weekly)
- Friend activity sidebar (just avatars)
- Active experiment (if any)

**Archive (Collection View)**
- Calendar grid (month view, pinch to zoom)
- Timeline gallery view (all photos)
- Filter by date/category/friend
- Tap entry → full detail view
- Long-press → favorite

**Entry Detail Panel**
- Large photo
- Prompt title + your note
- Location + date + category
- "✓ Liked by Alice, Bob" (count hidden)
- Threaded comments
- Favorite toggle

**Circle (Friends & Experiments)**
- Friends list with streak + last activity
- View friend's archive (permission-based)
- Active experiments (joined + available)
- Create new experiment

**Insights (Weekly + Monthly)**
- Weekly digest (email-style card)
- Category breakdown (pie chart)
- Streak tracking (visual)
- Monthly review card
- Year-in-review (shareable link)

**Settings**
- Profile edit
- Notification preferences
- Privacy settings (who sees archive)
- Logout

---

## 5. Data Model & Schemas

### Core Entities

```python
# Completion (already exists)
class Completion(BaseModel):
    completion_id: str
    prompt_id: str
    user_id: str
    note: str
    photo_url: str
    location: str
    date: str
    created_at: str
    share_with_friends: bool

# NEW: Interaction/Engagement
class Engagement(BaseModel):
    engagement_id: str
    completion_id: str
    user_id: str  # Who engaged
    type: Literal["like", "comment"]
    created_at: str

class Comment(BaseModel):
    comment_id: str
    completion_id: str
    user_id: str  # Who commented
    text: str
    created_at: str
    updated_at: str

# NEW: Favorite/Bookmark
class Favorite(BaseModel):
    favorite_id: str
    user_id: str  # Who favorited
    completion_id: str
    created_at: str

# NEW: Shared Experience/Experiment
class Experiment(BaseModel):
    experiment_id: str
    created_by: str
    name: str  # e.g., "14-day photo challenge"
    description: str
    start_date: str
    end_date: str
    invited_users: list[str]  # User IDs invited
    theme: str  # Optional (e.g., "Morning light")
    created_at: str

class ExperimentParticipation(BaseModel):
    experiment_id: str
    user_id: str
    completed_count: int
    status: Literal["invited", "active", "completed"]
    joined_at: str

# NEW: Insight/Digest
class WeeklyInsight(BaseModel):
    insight_id: str
    user_id: str
    week_start: str
    week_end: str
    completion_count: int
    streak_current: int
    top_category: str
    personalized_message: str  # "You're most active on Thursdays"
    created_at: str
```

---

## 6. Visual Design System

### Color Palette
- **Primary**: Warm terracotta (#C97A5D)
- **Secondary**: Sage green (#8B9D5C)
- **Neutral**: Cream (#F5F1E8), Charcoal (#2C2C2C)
- **Accent**: Coral (#E8876F) for celebrations
- **Disabled**: Stone (#A9A9A9)

### Typography
- **Headlines**: Serif (Publico Text or similar) - warm, personal
- **Body**: Clean sans (Inter or similar) - readable, modern
- **Bold**: 700 weight for emphasis
- **Sizes**: 24pt (title) → 18pt (section) → 16pt (body) → 12pt (meta)

### Spacing Scale
- 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Cards: 16px padding
- Screens: 16px horizontal margin
- Bottom margins: 12px (within card), 24px (between sections)

### Components
1. **Streak Ring** - Circular progress in primary color
2. **Heatmap** - 12-week compressed view (warm tones, light grays for empty)
3. **Calendar Grid** - Month at a glance, highlighted completed days
4. **Photo Grid** - Archive gallery, square thumbnails with overlay on hover
5. **Friend Card** - Avatar (32px), name, streak count, status indicator
6. **Encouragement Tag** - Soft pill button, text only (no emoji spam)
7. **Stat Card** - Metric + sparkle animation on completion
8. **Bar Chart** - Simple categories breakdown
9. **Comment Thread** - Left-aligned, expandable replies
10. **Experiment Card** - Title, participants avatars, progress ring

---

## 7. Interaction Patterns

### Gestures
- **Tap**: Primary action (open, select)
- **Swipe left/right**: Navigate months in calendar
- **Long-press**: Favorite/bookmark entry
- **Swipe up**: Mark today's prompt complete (optional flavor)

### Feedback
- **Success**: Subtle celebration (not confetti unless big milestone)
- **Error**: Toast at bottom, 3-second autohide
- **Loading**: Spinner only (no skeleton screens yet)
- **Empty state**: Friendly message with clear next action

### Animations
- **Streak ring**: Smooth increment over 1s when completing
- **Page transitions**: Slide (not fade)
- **Comment appear**: Fade in from bottom
- **Like/engagement**: No visible counter increment (privacy-first)
- **Heatmap**: Static (no animation clutter)

---

## 8. Privacy & Permissions

### Archive Sharing
- **Default**: Private (only me)
- **Friend-viewable**: Toggle to allow friends to see archive
- **Favorites shared**: Can share collection link (anonymized if desired)

### Social Activity
- **Completions**: Only show to friends (if share_with_friends = true)
- **Experiments**: Only visible to invited friends
- **Engagement**: Friends can comment (requires acceptance)
- **Metrics**: Personal only (no comparison exposed)

### Notification Preferences
- What triggers notification:
  - Comment on your entry
  - Friend accepts experiment invite
  - Experiment milestone reached
  - Friend joined challenge
- Frequency: Real-time, daily digest, or off

---

## 9. Off-Scope (Sprint 3+)

- ❌ Real-time (WebSocket) updates
- ❌ Infinite scroll feed (archive-first reduces need)
- ❌ Advanced search (filter by location, category works)
- ❌ Stories/ephemeral content
- ❌ Messaging (comments only)
- ❌ Video uploads (photos only for MVP)
- ❌ Offline-first (assumed internet available)

---

## 10. Success Metrics

### User Engagement
- Weekly active users (WAU)
- Completion rate (% who complete ≥1 prompt/week)
- Archive browsing time
- Comment engagement (replies per week)

### Product Health
- Archive views per session (target: 1-2)
- Streak maintenance rate (% maintaining 7+ day streak)
- Experiment participation (% joining shared challenges)
- Favorite bookmarking rate (avg 3+ per month)

### Community
- Friends added per user (target: 5-10 per year)
- Shared experiments created (target: 1-2 per team)
- Comment sentiment (mostly encouraging)
- Churn rate (target: <5% monthly)

---

## 11. Roadmap

### Sprint 3 (March 22-April 5, 2026)
- [ ] Archive/calendar view
- [ ] Photo grid gallery
- [ ] Entry detail panel with comments
- [ ] Favorite/bookmarking system
- [ ] Basic shared experiments
- [ ] Weekly insights

### Sprint 4 (April 8-22, 2026)
- [ ] Monthly digest emails
- [ ] Advanced filtering (category, date range)
- [ ] Friend permissions (privacy settings)
- [ ] Experiment management (create, edit, archive)
- [ ] Analytics dashboard

### Sprint 5+ (Beyond April 22)
- [ ] Real-time notifications
- [ ] Push notifications (FCM integration)
- [ ] Activity notifications (friend joined challenge)
- [ ] Seasonal themes/reflections
- [ ] Mutual discovery (shared interests)

---

## Document Maintenance

This document is the **source of truth for product decisions**. Update it when:
- Feature scope changes
- Design system evolves
- Data model changes
- Navigation structure shifts

Review quarterly or after major sprints.

