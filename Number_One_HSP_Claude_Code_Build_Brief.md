# Number One HSP — Members Area: Claude Code Build Brief

## Project Overview

Build a modern, mobile-first members area for Number One HSP, a strength & conditioning gym based in Queensferry, Flintshire, Wales. The platform serves two audiences: **members** (under 50 at launch, scaling to 120–150 in the near term) who access education content, track their body composition and strength results, and engage with community features; and **coaches/staff** who monitor member engagement, input data, and manage content.

**Live URL:** `members.numberonehsp.com`
**Main website (for reference):** `https://www.numberonehsp.com`

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **Next.js 14+ (App Router)** | SSR, API routes, excellent Claude Code support |
| Database | **Supabase Pro** (PostgreSQL + Auth + Storage) | $25/month, 8GB DB, 100K MAUs, no project pausing, daily backups — comfortably serves 150+ members |
| Styling | **Tailwind CSS** | Rapid UI development, consistent design system |
| Charts | **Recharts** or **Chart.js** | Clean data visualisation for body comp and S&C trends |
| Video Embedding | **YouTube (unlisted)** embedded via iframes | Free, no ads on unlisted, sufficient for internal education content. Migrate to Vimeo Pro later if content protection becomes a priority |
| Deployment | **Vercel** | Native Next.js hosting, free tier sufficient, custom subdomain support |
| External APIs | **GymMaster Member Portal API** | Authentication, attendance data, member details, membership status |
| External APIs | **InBody LookinBody Web API** (Phase 2) | Automated body composition scan data import |

---

## Authentication & Access Control

### Member Login
- Members authenticate using their **GymMaster credentials** (email + password) via the GymMaster Member Portal API login endpoint
- The API returns a session token (1 hour lifespan) and the member's ID
- On successful GymMaster auth, create/update a corresponding Supabase user record to store portal-specific data (education progress, preferences)
- **Access is automatically governed by membership status** — if a member's GymMaster account is inactive/expired/suspended, login is denied
- No separate account creation or management needed by staff

### GymMaster API Authentication Flow
```
1. Member enters email + password on login page
2. Frontend sends POST to /api/auth/login (Next.js API route)
3. API route calls GymMaster login endpoint:
   POST https://{SITE_NAME}.gymmasteronline.com/api/v1/member/login
   Headers: api_key (Member API key from GymMaster Settings > Integrations)
   Body: { email, password }
4. GymMaster returns: { token, memberid, expiry }
5. API route creates a secure session (httpOnly cookie or JWT)
6. Frontend redirects to /dashboard
```

### Coach/Staff Login
- Single shared coach account stored in Supabase Auth directly (email + password)
- Role flag: `role: 'coach'` in Supabase user metadata
- Coach login is a separate route: `/coach/login`
- Coach session grants access to all coach portal pages
- Can be upgraded to individual coach accounts later if the team grows

### Route Protection
- All `/dashboard/*` routes require an authenticated member session
- All `/coach/*` routes require an authenticated coach session
- Middleware checks session validity on every request
- Expired GymMaster tokens trigger re-authentication

---

## Design System

### Visual Direction
Fresh, modern, and energetic — distinct from the dark main website. This should feel like a premium app experience, not a corporate portal.

### Colour Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-primary` | `#22C55E` | Primary actions, progress bars, active states (lime/green — nods to existing branding) |
| `--brand-primary-dark` | `#16A34A` | Hover states, emphasis |
| `--bg-main` | `#F8FAFC` | Page backgrounds (light, clean slate) |
| `--bg-card` | `#FFFFFF` | Card/panel backgrounds |
| `--bg-sidebar` | `#0F172A` | Sidebar navigation (dark contrast) |
| `--text-primary` | `#0F172A` | Headings, primary text (slate-900) |
| `--text-secondary` | `#64748B` | Supporting text, labels (slate-500) |
| `--text-on-dark` | `#F8FAFC` | Text on dark sidebar/headers |
| `--accent-orange` | `#F97316` | Warnings, streaks, fire icons |
| `--accent-red` | `#EF4444` | Errors, disengaged status |
| `--accent-yellow` | `#EAB308` | At-risk status, caution |
| `--status-green` | `#22C55E` | Engaged status, completion, success |
| `--status-amber` | `#F59E0B` | At-risk status |
| `--status-red` | `#EF4444` | Disengaged status |

### Typography
- **Headings:** Inter (Bold/Semibold) — clean, modern, highly readable
- **Body:** Inter (Regular/Medium)
- **Data/Numbers:** JetBrains Mono or tabular Inter — for stats, weights, percentages

### Layout Principles
- **Mobile-first** — most members will access on their phones at the gym
- Collapsible sidebar navigation on desktop; bottom tab bar on mobile
- Cards-based layout for dashboard widgets
- Generous whitespace, large touch targets
- Dark sidebar with light content area (creates clear visual hierarchy)

### Component Patterns
- **Stat cards:** Large number, small label below, optional trend arrow (↑↓)
- **Progress bars:** Rounded, green fill, percentage label
- **Trend charts:** Clean line charts with minimal gridlines, branded colours
- **Status badges:** Pill-shaped, colour-coded (green/amber/red)
- **Module cards:** Thumbnail, title, progress indicator, duration estimate

---

## Database Schema (Supabase / PostgreSQL)

### members
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gymmaster_member_id BIGINT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  avatar_url TEXT,
  membership_status TEXT DEFAULT 'active', -- active, suspended, expired
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### inbody_scans
```sql
CREATE TABLE inbody_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  skeletal_muscle_mass_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(5,2),
  body_fat_mass_kg DECIMAL(5,2),
  notes TEXT,
  entered_by TEXT DEFAULT 'coach', -- 'coach' or 'api'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### sc_test_types
```sql
CREATE TABLE sc_test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., 'Back Squat 1RM', '500m Row'
  unit TEXT NOT NULL, -- 'kg', 'seconds', 'reps', 'metres'
  higher_is_better BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### sc_test_results
```sql
CREATE TABLE sc_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  test_type_id UUID REFERENCES sc_test_types(id) ON DELETE CASCADE,
  testing_block TEXT, -- e.g., 'Block 3 - Jan 2026'
  test_date DATE NOT NULL,
  result DECIMAL(8,2) NOT NULL,
  is_personal_best BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### education_pathways
```sql
CREATE TABLE education_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- e.g., 'Nutrition Foundations'
  description TEXT,
  category TEXT NOT NULL, -- 'nutrition', 'training', 'recovery', 'mindset'
  is_sequential BOOLEAN DEFAULT false, -- true = must complete in order
  display_order INT DEFAULT 0,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### education_modules
```sql
CREATE TABLE education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES education_pathways(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., 'Understanding Calories'
  description TEXT,
  module_order INT NOT NULL,
  video_url TEXT, -- YouTube unlisted embed URL
  pdf_url TEXT, -- Supabase Storage URL or external link
  duration_minutes INT, -- estimated time to complete
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### member_module_progress
```sql
CREATE TABLE member_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  module_id UUID REFERENCES education_modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quiz_score INT, -- optional, if module has a quiz
  UNIQUE(member_id, module_id)
);
```

### education_resources (open library items — not part of a pathway)
```sql
CREATE TABLE education_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'nutrition', 'training', 'recovery', 'mindset'
  resource_type TEXT NOT NULL, -- 'video', 'pdf', 'article', 'link'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### attendance_log (synced from GymMaster)
```sql
CREATE TABLE attendance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, visit_date)
);
```

### community_challenges
```sql
CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- e.g., 'January Attendance Challenge'
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'attendance', 'education', 'custom'
  target_value INT, -- e.g., 20 (visits), 5 (modules completed)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### challenge_entries
```sql
CREATE TABLE challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  current_value INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, member_id)
);
```

### member_awards
```sql
CREATE TABLE member_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  award_type TEXT NOT NULL, -- 'athlete_of_the_month', 'commitment_club', 'achievement'
  title TEXT NOT NULL, -- e.g., 'Athlete of the Month — April 2026', 'First Pull-Up!'
  body TEXT, -- short write-up / reason for the award
  image_url TEXT,
  award_month DATE, -- the month this award relates to (first of month, e.g., 2026-04-01)
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### gym_partners
```sql
CREATE TABLE gym_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., 'PhysioCare Queensferry'
  description TEXT, -- short blurb about the partner
  logo_url TEXT, -- uploaded to Supabase Storage
  website_url TEXT, -- link to their website or social media
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Page Structure & Routes

### Member Portal

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing/Login | Login form, gym branding, brief value proposition |
| `/dashboard` | Member Dashboard | Welcome, quick stats, continue learning, attendance streak, upcoming events |
| `/education` | Education Hub | Browse pathways and open library |
| `/education/pathway/[id]` | Pathway View | Sequential or open module list with progress tracking |
| `/education/module/[id]` | Module View | Video player, PDF download, mark as complete, quiz (if applicable) |
| `/education/library` | Open Library | Browsable/filterable collection of standalone resources |
| `/results` | My Results Overview | Tabs or cards linking to InBody and S&C sections |
| `/results/body-composition` | InBody Dashboard | Trend charts for weight, SMM, BF%, BFM; scan history table |
| `/results/strength` | S&C Testing Dashboard | Per-test trend charts, PB highlights, testing block comparison |
| `/community` | Community Hub | Active challenges, leaderboards, member awards |
| `/community/challenge/[id]` | Challenge Detail | Progress tracker, participant list, countdown |
| `/community/awards` | Awards & Recognition | Current month winners (AOTM, Commitment Club), member achievements, past winners archive |
| `/partners` | Gym Partners | Grid of local partner businesses with logos, descriptions, and links |
| `/profile` | My Profile | Personal details (read-only from GymMaster), notification preferences |

### Coach Portal

| Route | Page | Description |
|-------|------|-------------|
| `/coach/login` | Coach Login | Separate login form |
| `/coach` | Coach Dashboard | Member overview with engagement traffic lights, quick stats, alerts |
| `/coach/members` | All Members | Searchable/filterable list, sort by engagement, last visit, education progress |
| `/coach/members/[id]` | Member Detail | Full drill-down: InBody history, S&C results, education progress, attendance, notes |
| `/coach/input/inbody` | InBody Data Entry | Form to input scan results for a member (select member → enter metrics) |
| `/coach/input/testing` | S&C Testing Entry | Form to input testing block results (select member → select tests → enter results) |
| `/coach/input/testing/manage` | Manage Test Types | Add/edit/deactivate test types, set units and sort order |
| `/coach/content` | Content Manager | Upload/organise education pathways, modules, and library resources |
| `/coach/community` | Community Manager | Create/edit challenges, publish member awards |
| `/coach/partners` | Partner Manager | Add/edit/remove gym partner listings |
| `/coach/reports` | Engagement Reports | Education completion rates, attendance trends, member engagement scores |

---

## Feature Specifications

### F1: Member Dashboard (`/dashboard`)

**Layout:** Single-column on mobile, two-column grid on desktop.

**Widgets (top to bottom, mobile order):**

1. **Welcome Banner**
   - "Welcome back, {first_name}" with current date
   - If member's birthday is within 7 days (pulled from GymMaster DOB): show birthday message/confetti

2. **Continue Learning Card**
   - Shows the last module the member was watching or the next unfinished module in their active pathway
   - Thumbnail, pathway name, module title, progress bar
   - Click → goes directly to that module

3. **Quick Stats Row** (4 stat cards in a horizontal scroll on mobile)
   - Current weight (latest InBody)
   - Current body fat % (latest InBody)
   - Skeletal muscle mass (latest InBody)
   - Visits this month (from attendance_log)
   - Each card shows value + small trend indicator (↑↓ vs previous reading/month)

4. **Attendance Streak**
   - Current week heatmap (Mon–Sun, filled dots for days visited)
   - "X visits this month" with progress toward monthly target if a challenge is active
   - Streak counter: "5 weeks in a row with 3+ visits" (or similar logic)

5. **Active Challenges Preview**
   - Show 1–2 active challenges the member has joined
   - Progress bar toward target
   - "View all" link to /community

6. **Latest Awards**
   - If a recent award has been published (AOTM or Commitment Club), show a card with photo, name, award type, and short excerpt
   - "View all" link to /community/awards

### F2: Education Hub (`/education`)

**Layout:** Category tabs at the top (All, Nutrition, Training, Recovery, Mindset), then content below.

**Two sections:**

1. **Structured Pathways**
   - Card grid showing each published pathway
   - Card shows: thumbnail, title, module count, estimated total duration, member's progress (e.g., "3/6 completed")
   - Badge: "Sequential" (must complete in order) or "Open" (browse freely)
   - Click → pathway detail page

2. **Open Library**
   - Below pathways, or accessible via a tab/link
   - Filterable grid of standalone resources (videos, PDFs, articles)
   - Each card: thumbnail, title, type badge (Video/PDF/Article), category tag
   - Click → opens resource directly (video plays inline, PDF opens in new tab)

### F3: Pathway & Module View (`/education/pathway/[id]` and `/education/module/[id]`)

**Pathway page:**
- Header: pathway title, description, progress bar
- Module list (ordered): each shows title, duration, status icon (locked/not started/in progress/completed)
- If `is_sequential = true`: modules after the first incomplete one show a lock icon and are not clickable
- If `is_sequential = false`: all modules are clickable regardless of completion

**Module page:**
- Video player (YouTube unlisted embed, responsive 16:9)
- Below video: module title, description, estimated duration
- PDF download button (if PDF exists for this module)
- "Mark as Complete" button (large, prominent, green)
- Optional: simple quiz (2–3 multiple choice questions) — quiz must be passed to mark complete
- Navigation: "Previous Module" / "Next Module" buttons
- Completion triggers progress update in `member_module_progress`

### F4: InBody Body Composition Dashboard (`/results/body-composition`)

**Layout:**

1. **Latest Scan Summary**
   - 4 large stat cards: Weight, SMM, BF%, BFM
   - Each shows current value, date of last scan, change since previous scan (green positive / red negative, contextually — e.g., weight down = green if in fat loss phase, SMM up = always green)
   - Simplify: BF% down and SMM up = green arrows, weight and BFM use BF% direction

2. **Trend Charts**
   - One chart per metric (or a combined chart with toggleable lines)
   - X-axis: scan dates
   - Y-axis: metric value
   - Data points are clickable/hoverable to see exact values
   - Time range filter: last 3 months, 6 months, 1 year, all time

3. **Scan History Table**
   - Collapsible table showing all scans
   - Columns: Date, Weight, SMM, BF%, BFM
   - Most recent at top
   - Highlight personal bests (lowest BF%, highest SMM)

### F5: S&C Testing Dashboard (`/results/strength`)

**Layout:**

1. **Testing Block Selector**
   - Dropdown or tabs to switch between testing blocks (e.g., "Block 4 — March 2026")
   - "Compare blocks" toggle to show side-by-side with a previous block

2. **Results Grid**
   - Card per test type showing: test name, latest result with unit, PB badge if applicable, trend arrow vs previous block
   - Example: "Back Squat 1RM — 120kg ⬆️ (+5kg) 🏆 PB"

3. **Individual Test Trend Chart**
   - Click any test card to expand a trend chart showing all historical results for that test
   - X-axis: test dates / block names
   - Y-axis: result value

### F6: Community Hub (`/community`)

**Layout:**

1. **Active Challenges**
   - Card per active challenge: title, description, date range, participant count
   - Member's progress bar if they've joined
   - "Join Challenge" button if they haven't
   - Click → challenge detail page with leaderboard

2. **Challenge Leaderboard**
   - On challenge detail page: ranked list of participants by current_value
   - Show: rank, member first name + last initial, progress value, completion badge
   - Current member's position highlighted

3. **Attendance Leaderboard**
   - Monthly visits leaderboard (top 10)
   - Show: rank, first name + last initial, visit count
   - Updates from attendance_log data

4. **Awards & Recognition**
   - Current month: large featured cards for Athlete of the Month and Commitment Club winners
   - Recent member achievements displayed as smaller cards
   - "View all awards" link to `/community/awards` for the full archive
   - Archive page: grouped by month, filterable by award type, scrollable history

### F7: Coach Dashboard (`/coach`)

**Layout:**

1. **Summary Stats Row**
   - Total active members
   - Average visits this month (across all members)
   - Education completion rate (% of all assigned modules completed across all members)
   - Members at risk (amber + red count)

2. **Member Engagement Table**
   - Columns: Name, Last Visit, Visits (This Month), Education Progress, InBody (Last Scan Date), Status
   - **Status logic:**
     - 🟢 Green (Engaged): visited in last 7 days AND logged into portal in last 14 days
     - 🟡 Amber (At Risk): last visit 8–21 days ago OR no portal login in 30 days
     - 🔴 Red (Disengaged): no visit in 21+ days
   - Sortable by any column
   - Click row → member detail page

3. **Quick Actions**
   - "Input InBody Scan" button → /coach/input/inbody
   - "Input Testing Results" button → /coach/input/testing
   - "Create Challenge" button → /coach/community
   - "Give Award" button → /coach/community
   - "Manage Partners" button → /coach/partners

4. **Upcoming Birthdays**
   - List of members with birthdays in the next 30 days
   - Pulled from GymMaster DOB data

### F8: Coach Data Input Forms

**InBody Input (`/coach/input/inbody`):**
- Member selector (searchable dropdown of all active members)
- Date picker (defaults to today)
- Fields: Weight (kg), Skeletal Muscle Mass (kg), Body Fat % (%), Body Fat Mass (kg)
- Optional notes field
- "Save Scan" button
- Confirmation message with quick link to view the member's body comp dashboard
- Validation: all numeric, reasonable ranges (e.g., weight 30–250kg)

**S&C Testing Input (`/coach/input/testing`):**
- Step 1: Select testing block (existing or create new — name + date)
- Step 2: Select member (searchable dropdown)
- Step 3: Shows all active test types with input fields
- Each test row: test name, unit, input field, checkbox to mark as PB
- Auto-detect PB: if the entered value exceeds all previous values for that member/test, auto-tick PB
- "Save Results" button
- Option to "Save & Next Member" for efficient batch entry during testing week

**Manage Test Types (`/coach/input/testing/manage`):**
- List of all test types with: name, unit, higher_is_better toggle, active/inactive toggle, sort order
- "Add Test Type" form
- Edit inline
- Deactivate (not delete) to preserve historical data

### F9: Coach Content Manager (`/coach/content`)

**Pathways & Modules:**
- List all pathways with edit/publish/unpublish toggles
- Click pathway → see module list, reorder (drag or arrows), edit, add new module
- Module edit form: title, description, video URL (YouTube unlisted), PDF upload (to Supabase Storage), duration, published toggle
- Create new pathway form: title, description, category, sequential toggle, thumbnail upload

**Open Library:**
- List all resources with edit/publish/unpublish
- Add new resource: title, description, category, type (video/PDF/article/link), URL, thumbnail
- Bulk operations not needed at this scale

---

## GymMaster API Integration Details

### Endpoints to Use

**Authentication:**
- `POST /api/v1/member/login` — authenticate member with email + password, returns token + memberid

**Member Data (called with staff API key for coach portal, or member token for member portal):**
- `GET /api/v1/member/account` — member's name, email, DOB, phone, photo
- `GET /api/v1/member/visits` — visit counts grouped by month
- `GET /api/v1/member/memberships` — current membership status, type, start/end dates

**Configuration:**
- API keys are found in GymMaster Settings > Integrations
- Two keys exist: "API Key for Members" (used with member's own token) and "API Key for Staff" (used for coach-level access)
- Base URL: `https://{SITE_NAME}.gymmasteronline.com/api/v1/`
- Responses are cached for up to 2–10 minutes depending on endpoint

### Sync Strategy
- **Member data:** Fetch on login, cache in Supabase `members` table, refresh daily via cron or on each login
- **Attendance:** Sync visit data nightly via a scheduled function (Vercel Cron or Supabase Edge Function)
- **Membership status:** Check on each login attempt; also sync nightly to update the coach dashboard

### Environment Variables Required
```
GYMMASTER_SITE_NAME=numberonehsp
GYMMASTER_MEMBER_API_KEY=xxxxx
GYMMASTER_STAFF_API_KEY=xxxxx
```

---

## InBody Integration (Phase 2)

### Overview
InBody's LookinBody Web platform provides a Web API with webhook support. When a member completes an InBody scan, the data can be automatically pushed to the members area.

### Setup Steps
1. Register for LookinBody Web account (may already have one with the InBody device)
2. Submit the API Facility Application Form to InBody to get API access
3. Obtain API key from LookinBody portal (API-KEY section)
4. Configure a webhook in LookinBody pointing to: `https://members.numberonehsp.com/api/webhooks/inbody`
5. Build the webhook handler to receive scan data and insert into `inbody_scans` table
6. Match incoming scans to members via phone number (InBody's unique identifier)

### Webhook Endpoint
```
POST /api/webhooks/inbody
- Receives JSON payload with scan results
- Matches member by phone number → member_id
- Inserts into inbody_scans with entered_by = 'api'
- Returns 200 OK
```

### Phase 2 Note
For initial launch, coaches will input InBody data manually via the coach portal. The API integration should be built as a separate enhancement once the core platform is stable and InBody API access has been arranged.

---

## Community Features Specification

### Challenges System
- Coaches create challenges with: title, description, type (attendance/education/custom), target value, date range
- Members can browse and join active challenges from the community hub
- Progress tracking:
  - **Attendance challenges:** `current_value` auto-increments from attendance_log within the challenge date range
  - **Education challenges:** `current_value` auto-increments based on module completions
  - **Custom challenges:** coaches manually update values (e.g., "complete 30 workouts in 30 days" tracked manually)
- Leaderboard shows all participants ranked by progress
- Completed members get a visual badge on the leaderboard

### Attendance Leaderboard
- Auto-generated monthly leaderboard from attendance_log
- Shows top 10 members by visit count for the current month
- Resets monthly
- Display: rank, first name + last initial (privacy), visit count

### Member Awards & Recognition
- Coaches create awards from the coach portal with three types:
  - **Athlete of the Month:** One winner per month, selected by coaches. Prominent display with photo, name, and write-up
  - **Commitment Club:** Monthly recognition for consistent attendance/effort. Can have multiple winners per month
  - **Member Achievements:** Flexible catch-all for any other recognition (e.g., "First Pull-Up", "100th Session", "Lost 10kg"). Can be awarded at any time
- Published awards appear on the community hub and as a card on the member dashboard
- **Current month display:** Large, prominent cards for this month's AOTM and Commitment Club winners at the top of the awards page
- **Archive:** Scrollable/filterable history of all past awards, grouped by month. Members can browse back through previous months
- Award winners get a badge on their profile visible to coaches in the coach portal

---

## Gym Partners Feature Specification

### Member View (`/partners`)

**Layout:** Clean grid of partner cards, 2 columns on mobile, 3–4 on desktop.

**Each partner card shows:**
- Partner logo (square or landscape, displayed at consistent size)
- Partner name (bold)
- Short description (1–2 sentences about what they do)
- "Visit" button linking to their website or social media page (opens in new tab)

**Page header:** Brief intro text, e.g., "We're proud to work with these local businesses. As a Number One member, you're part of a wider community."

**Sort order:** Controlled by `display_order` in the database (coaches can reorder via the partner manager).

### Coach Partner Manager (`/coach/partners`)

- List of all partners with active/inactive toggle
- Add new partner form: name, description, logo upload (to Supabase Storage), website URL
- Edit existing partners inline
- Drag or arrow-based reordering for display order
- Deactivate (not delete) to hide from member view without losing data

---

## Mobile Responsiveness Requirements

- **Primary device is mobile** — most members will access at the gym on their phone
- Bottom navigation bar on mobile with 5 tabs: Dashboard, Learn, Results, Community, Partners
- Sidebar navigation on desktop/tablet (collapsible)
- All touch targets minimum 44x44px
- Video player must be full-width on mobile with proper aspect ratio
- Charts must be readable on small screens (consider horizontal scroll for dense data)
- Forms (especially coach data input) must work well on tablet (coaches may use an iPad at the gym)

---

## Security & Data Considerations

### Row-Level Security (Supabase RLS)
- Members can only read their own data (inbody_scans, sc_test_results, member_module_progress, attendance_log)
- Coaches can read all member data and write to: inbody_scans, sc_test_results, education content tables, community tables
- Members can write to: member_module_progress (their own rows only), challenge_entries (their own)

### GDPR / UK Data Protection
- Privacy policy page explaining what data is stored and why
- Body composition data is health data (special category under GDPR) — ensure consent is captured
- Data stored in Supabase (can choose EU region for data residency)
- Members should be able to request data export or deletion

### Content Protection
- YouTube unlisted videos are not indexed by search engines but can be viewed by anyone with the link — this is acceptable for internal gym education content. If content protection becomes a priority later, migrate to Vimeo Pro with domain-restricted playback
- PDF downloads are available to authenticated members only (served through API route, not public URLs)
- Supabase Storage buckets for PDFs should be private, with signed URLs generated on request

---

## Deployment Configuration

### Vercel Setup
- Connect GitHub repository to Vercel
- Set custom domain: `members.numberonehsp.com`
- DNS: Add CNAME record pointing `members` to `cname.vercel-dns.com`
- Environment variables set in Vercel dashboard (all API keys, Supabase URL, etc.)

### Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# GymMaster
GYMMASTER_SITE_NAME=numberonehsp
GYMMASTER_MEMBER_API_KEY=xxxxx
GYMMASTER_STAFF_API_KEY=xxxxx

# InBody (Phase 2)
INBODY_API_KEY=xxxxx
INBODY_API_URL=https://apieur.lookinbody.com/

# App
NEXTAUTH_SECRET=xxxxx
NEXT_PUBLIC_APP_URL=https://members.numberonehsp.com
```

---

## Build Phases

### Phase 1 — Core Platform (Build First)
- [ ] Project setup: Next.js + Supabase + Tailwind + Vercel
- [ ] Database schema creation (all tables above)
- [ ] GymMaster API integration: member login + data sync
- [ ] Member dashboard with quick stats and welcome
- [ ] Coach login and coach dashboard with member list + traffic light engagement
- [ ] Attendance data sync from GymMaster
- [ ] Basic mobile navigation and responsive layout

### Phase 2 — Education Hub
- [ ] Education pathway and module data model + CRUD
- [ ] Coach content manager (create/edit pathways, modules, resources)
- [ ] Member education hub: pathway browsing, module viewing, video playback
- [ ] Progress tracking: mark as complete, progress bars, sequential locking
- [ ] Open library for standalone resources
- [ ] "Continue learning" widget on dashboard

### Phase 3 — Results Tracking
- [ ] Coach InBody data input form
- [ ] Member body composition dashboard with trend charts
- [ ] Coach S&C test type management
- [ ] Coach S&C testing result input form (with batch entry)
- [ ] Member S&C dashboard with test history and PB tracking
- [ ] Auto-PB detection

### Phase 4 — Community, Awards & Partners
- [ ] Coach challenge creation
- [ ] Member challenge browsing, joining, and progress tracking
- [ ] Attendance leaderboard (auto-generated monthly)
- [ ] Challenge leaderboards
- [ ] Awards system: Athlete of the Month, Commitment Club, Member Achievements (coach creates, members view)
- [ ] Awards archive page with monthly grouping and filtering
- [ ] Current month winners featured prominently on community hub and dashboard
- [ ] Gym Partners page (member-facing grid with logos, descriptions, links)
- [ ] Coach partner manager (add/edit/reorder/deactivate partners)
- [ ] Birthday alerts on coach dashboard

### Phase 5 — Polish & Enhancements
- [ ] InBody API webhook integration (replacing manual entry)
- [ ] Engagement reporting page for coaches
- [ ] Email notifications (welcome, challenge reminders, re-engagement)
- [ ] Data export functionality (GDPR compliance)
- [ ] Performance optimisation and accessibility audit

---

## File/Folder Structure (Suggested for Claude Code)

```
/src
  /app
    /page.tsx                          -- Landing/login page
    /dashboard
      /page.tsx                        -- Member dashboard
    /education
      /page.tsx                        -- Education hub
      /pathway/[id]/page.tsx           -- Pathway detail
      /module/[id]/page.tsx            -- Module view
      /library/page.tsx                -- Open library
    /results
      /page.tsx                        -- Results overview
      /body-composition/page.tsx       -- InBody dashboard
      /strength/page.tsx               -- S&C dashboard
    /community
      /page.tsx                        -- Community hub
      /challenge/[id]/page.tsx         -- Challenge detail
      /awards/page.tsx                 -- Awards archive (all past winners)
    /partners
      /page.tsx                        -- Gym partners grid
    /profile
      /page.tsx                        -- Member profile
    /coach
      /login/page.tsx                  -- Coach login
      /page.tsx                        -- Coach dashboard
      /members/page.tsx                -- All members list
      /members/[id]/page.tsx           -- Member detail drill-down
      /input
        /inbody/page.tsx               -- InBody data entry
        /testing/page.tsx              -- S&C testing entry
        /testing/manage/page.tsx       -- Manage test types
      /content/page.tsx                -- Content manager
      /community/page.tsx              -- Community manager (challenges + awards)
      /partners/page.tsx               -- Gym partner manager
      /reports/page.tsx                -- Engagement reports
    /api
      /auth/login/route.ts             -- GymMaster auth proxy
      /auth/coach-login/route.ts       -- Coach auth
      /webhooks/inbody/route.ts        -- InBody webhook (Phase 2)
      /sync/attendance/route.ts        -- GymMaster attendance sync
      /sync/members/route.ts           -- GymMaster member data sync
  /components
    /layout
      /Sidebar.tsx                     -- Desktop sidebar nav
      /MobileNav.tsx                   -- Mobile bottom tab bar
      /DashboardLayout.tsx             -- Wrapper with nav
      /CoachLayout.tsx                 -- Wrapper with coach nav
    /dashboard
      /WelcomeBanner.tsx
      /QuickStats.tsx
      /ContinueLearning.tsx
      /AttendanceStreak.tsx
      /ActiveChallenges.tsx
    /education
      /PathwayCard.tsx
      /ModuleList.tsx
      /ModulePlayer.tsx
      /ProgressBar.tsx
      /ResourceCard.tsx
    /results
      /StatCard.tsx
      /TrendChart.tsx
      /ScanHistoryTable.tsx
      /TestResultCard.tsx
    /community
      /ChallengeCard.tsx
      /Leaderboard.tsx
      /AwardCard.tsx
      /AwardArchive.tsx
      /AwardForm.tsx
    /partners
      /PartnerCard.tsx
      /PartnerForm.tsx
    /coach
      /MemberTable.tsx
      /EngagementBadge.tsx
      /InBodyForm.tsx
      /TestingForm.tsx
      /ContentEditor.tsx
      /PartnerManager.tsx
    /ui                                -- Shared UI primitives
      /Button.tsx
      /Card.tsx
      /Input.tsx
      /Select.tsx
      /Modal.tsx
      /Badge.tsx
      /Tabs.tsx
  /lib
    /supabase.ts                       -- Supabase client init
    /gymmaster.ts                      -- GymMaster API helper functions
    /auth.ts                           -- Session management utilities
    /utils.ts                          -- Formatting, date helpers, etc.
  /types
    /index.ts                          -- TypeScript types for all data models
```

---

## Notes for Claude Code

- **Start with Phase 1** — get auth, dashboard shell, and coach member list working first before building features
- **Use Supabase client libraries** (`@supabase/supabase-js` and `@supabase/ssr`) for all database operations
- **GymMaster API calls should always go through Next.js API routes** (never expose API keys to the client)
- **Mobile-first responsive design** — design for 375px width first, then scale up
- **All coach-facing forms need good error handling and loading states** — coaches will be inputting data between sessions and need it to be quick and reliable
- **Charts should be clean and readable** — avoid clutter; use Recharts with a minimal theme matching the design system colours
- **Skeleton loading states** on all data-fetching pages for a polished feel
- **Toast notifications** for successful actions (data saved, module completed, challenge joined)
- The S&C test types table should be **fully configurable by coaches** — Ed will provide the specific tests later, but the system must allow any test name/unit combination to be added
- **Seed data:** Create a seeder script that populates example pathways, modules, test types, and a demo member for development/testing
