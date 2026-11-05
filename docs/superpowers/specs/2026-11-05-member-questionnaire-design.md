# Member questionnaire ("Know your member") — design and plan

Status: proposal, nothing built. Written 2026-11-05.

## 1. What the PDF is, and how useful it is

Source: Precision Nutrition "Initial Assessment & Triage Questionnaire" (2019), 7 pages, built for one-to-one online nutrition coaching.

What it does well (worth keeping the ideas):
- Starts with goals (tick list), then the three changes that matter most, in the person's own words.
- Asks what has worked, what has not, and what has blocked them. Good coaching conversation material.
- 1-10 sliders for nutrition habits, health, support around them, schedule, stress, and the "ready / willing / able" trio. These chart well and show change over time.
- Household food roles (who shops, cooks, decides), weekly time use, sleep, coping with stress.
- Ends with what they expect from the coach and what they will do themselves.

Where it falls short for Number One HSP:
- **Health screening is thin.** Conditions, pain and medications are single Yes/No boxes with no detail. A gym needs an exercise-readiness screen (PAR-Q+ style) and injury detail. Check what N1 already uses at consultation before deciding whether to add it here or keep it separate.
- **No training detail:** no training history, equipment at home, preferred days and times, or what they want from small-group sessions.
- **Thin nutrition behaviour:** nothing on meals per day, alcohol, water or protein. Add a few simple questions.
- **Repeats data we already hold:** date of birth, phone and email come from GymMaster, and weight/body fat from InBody. Do not ask again.
- **US/online wording:** Skype, "physique competition", paper signature. Needs rewording for a UK gym.
- **Consent:** the paper disclaimer is not consent to store health data. We need our own privacy notice and an explicit consent tick.
- **Under 18s:** need a shorter version and parent/guardian consent; skip medications and household questions.

Copyright: the form is © Precision Nutrition. Use it as inspiration, and write the questions in our own words rather than copying the wording. If you want the exact wording, ask Precision Nutrition for permission first.

## 2. Where it lives in the members area

Recommendation: keep it under **Wellbeing**, as you suggested, but give the page two parts:
1. **Weekly pulse** (existing energy / sleep / stress, 1-5).
2. **My health profile** (new): the questionnaire, a summary of the member's answers, and a "refresh" button.

Why Wellbeing and not a new tab: it already sits under Tracking, members already go there to check in, and the stress and sleep questions are the same topic. Two small additions make sure it gets done:
- A Home card "Tell us about you" until the initial questionnaire is submitted.
- A link in the new-member journey (staff hub) so coaches can send it before the first session.

Initial questionnaire ~10 minutes, saved as they go (one section per screen on a phone). A shorter "refresh" (ratings, goals, anything changed) is offered at the 6-month check-in.

## 3. Questions (draft sections, our own wording)

1. Contact and emergency contact (preferred contact method only; no repeat of GymMaster data)
2. Goals: tick list, top three priorities ranked, why now
3. What has worked, not worked, blocked you before
4. Training now: active yes/no, hours per week band, types, other movement hours, equipment at home, best days/times
5. Nutrition now: 1-10 rating and why, meals per day, alcohol, water, who shops/cooks/decides
6. Health: conditions, injuries or pain (with detail), medications yes/no, 1-10 health rating
7. Life: household, support around you 1-10, weekly hours (work, study, travel, caring, other), schedule 1-10
8. Stress and recovery: stress 1-10, sleep hours band, how you cope
9. Readiness: ready, willing, able (1-10 each)
10. Expectations of us, what you will do, privacy notice and consent tick

## 4. Data and security (the important part)

Findings from reading the code:
- The members area has **no service-role key**; all database access uses the public anon key, and tables use open policies (`member_goals`, `member_tasks` and the rest).
- A member is identified by the `gymmaster_member_id` cookie, which is **readable and unsigned**, so anyone can change it and read another member's data.

That is acceptable for goals and tasks. It is **not** acceptable for health data, which is special-category data under UK GDPR. So Phase 0 comes first:
- New table `member_questionnaires` (member id, version, kind initial/refresh, status draft/submitted, submitted_at, answers jsonb, scores jsonb, flags text[], consent_at). Row-level security **on with no policy**, so the anon key can read nothing.
- All reads and writes go through server routes using a new `SUPABASE_SERVICE_ROLE_KEY` (new env var in the members-area Vercel project).
- Member routes work out the member id on the server from the httpOnly `gymmaster_token` (checked with GymMaster), never from the plain cookie.
- Coach routes require the existing Supabase `role=coach` session (already enforced for `/api/coach/*`).
- Add the table to the staff hub data-retention list, so leavers' data is deleted with the rest.
- Needs a short privacy notice update and a quick data protection impact check before launch. Not legal advice; worth a review.

## 5. Charts and what each audience sees

Charts (recharts is already installed):
- **Radar** of the 1-10 ratings: nutrition, health, support, schedule, stress, ready/willing/able. Both coach and member.
- **Ready / willing / able** three bars, with the gap highlighted.
- **Weekly time** stacked bar (work, study, travel, caring, other) and total hours.
- **Sleep hours** and **training hours** gauges against a simple target band.
- **Goals** as chips, top three priorities as a numbered list.
- **Trend lines** for each rating once a member has two or more submissions.

Coach profile (`/coach/members/[id]`): full answers, charts, and a **flags** panel: any medical Yes, pain or injury, medication, stress 8+, sleep 5 or less, support 3 or less, readiness gap (ready high, able low). Plus "conversation starters" drawn from their free-text answers.

Member (Wellbeing > My health profile): the summary charts, goals and priorities, plus "view all my answers" and "update my answers". Health detail stays behind "view all answers", not on the summary.

## 6. Check-in on the coach profile

Today the check-in form, log and journey live only in the staff hub, which has its own sign-in. The coach profile (`/coach/members/[id]`) uses a different sign-in (Supabase). The two cannot share a browser session (different sites), so an iframe will not work.

Recommended approach: a server-to-server call.
- Coach profile gets a **Check-ins** section: Log check-in form (same fields as the staff hub), the check-in log, the journey stage, and links (Open snapshot, back to Member Admin).
- The form posts to a members-area route that checks the coach, then calls a new staff-hub route with a shared secret and the coach's email. The staff hub maps the email to its `coaches` row, so the author, validation, edit history and goal sync all stay in one place.
- New shared secret as an env var in both Vercel projects.
- Needs every coach's staff-hub `coaches.email` to match their members-area login email.

Alternative if you prefer no cross-app call: rebuild the check-in rules inside the members area. It works, but the rules would then exist twice and can drift.

## 7. Phases

0. **Foundations:** service-role key, secure member identity on the server, `member_questionnaires` table with RLS and no policy, privacy notice. No visible change.
1. **Questionnaire:** form on Wellbeing, mobile first, autosave draft, submit with consent. Home prompt.
2. **Member summary:** My health profile with charts and "view all answers".
3. **Coach view:** questionnaire card on the coach profile with charts, flags, free text.
4. **Check-in on the coach profile:** staff-hub route, members-area panel, links.
5. **Refresh and trends:** short refresh at 6 months, trend charts, staff hub journey step "Questionnaire completed" and a nudge in the contact queue.

Each phase ships on its own, with tests (answer validation, scoring and flags, access rules) and lint, as with previous work.

## 8. Decisions needed

1. Wording: write our own questions (recommended) or request permission to use Precision Nutrition's?
2. Health screening: add PAR-Q+ style questions to this form, or keep what you do at consultation?
3. Check-in on coach profile: server-to-server call (recommended) or duplicate the rules?
4. Under 18s: shorter version with parent consent (recommended), or exclude them for now?
5. Who sees health detail: all coaches, or only coaches assigned to the member and Ed?
6. "All links" on the profile: I read this as the check-in log, journey, snapshot and Member Admin links. Tell me if you meant others.

## 9. Phase 0 status (built 2026-11-05, branch `questionnaire-phase-0`)

Built, no visible change for members or coaches:
- `src/lib/supabase-admin.ts`: service-role client, server only. Throws if the key is missing (never falls back to the anon key).
- `src/lib/gymmaster.ts` `verifyMemberToken()`: asks GymMaster which member a login token belongs to. Logs nothing and returns only the id.
- `src/lib/member-auth.ts` `verifiedMemberId()`: the member id for private-data routes, from the httpOnly token, remembered for a minute per server instance. The demo login's fake token never verifies, so the demo user cannot save private data.
- `migrations/011_member_questionnaires.sql` (and `supabase-schema.sql`): `member_questionnaires` with row-level security on, no policy, and no anon/authenticated grants.

To switch on (you do these; they are not done):
1. Run migration 011 in the **members-area** Supabase SQL Editor (check the project name first).
2. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase > members-area project > Settings > API keys > service_role) to the members-area Vercel project, and to `.env.local` for local work. Never put it in a `NEXT_PUBLIC_` variable.
3. Privacy notice: add that we collect health and lifestyle answers to tailor coaching, that they are optional, shared with your coaches, kept while the person is a member, and can be viewed or deleted on request. Needs your sign-off, and ideally a quick data-protection check.

Known and left alone: `getMemberProfile()` writes the whole GymMaster profile response (name, email) to the server logs on every call. Worth removing separately. Existing routes still trust the readable `gymmaster_member_id` cookie; only new private-data routes use `verifiedMemberId()`.

## 10. Phase 1 status (built 2026-11-05, branch `questionnaire-phase-1`, on top of phase 0)

Built, switched OFF (404 until `QUESTIONNAIRE_ENABLED=true`):
- `src/lib/questionnaire/`: `schema.ts` (10 sections, our own wording, versioned), `answers.ts` (checks), `scoring.ts` (chart numbers and 8 coach flags), `service.ts` (draft/submit rules, supabase store), `enabled.ts`.
- API: `GET /api/questionnaire`, `PUT /api/questionnaire/draft`, `POST /api/questionnaire/submit`. Each checks the switch, then `verifiedMemberId()`, then uses the service-role client. Logs codes only, never answers.
- UI: `/wellbeing/profile` (one section per screen, autosave on Next, progress bar, consent step) and a "My health profile" card on Wellbeing (only when enabled).
- Defaults I took for the open decisions: our own wording; no PAR-Q+ (health is yes/no plus detail; medication yes/no only, no names); no under-18 handling yet; all coaches can see answers (Phase 3). **Decide the under-18 and PAR-Q+ questions before turning the switch on.**
- 45 tests pass; `next build` passes. Not run against a real database (migration 011 and the key are not set up yet), so the save and submit routes are tested with a fake store only.

## 11. Youth athlete version (built 2026-11-05, branch `questionnaire-youth`)

A separate, shorter questionnaire for under 18s, completed with (or by) a parent or guardian. Own page `/wellbeing/profile/youth`, own card on Wellbeing, same switch (`QUESTIONNAIRE_ENABLED`).
- 6 sections, 29 questions (adult: 10 sections, 47). Simpler words, sport and level, upcoming events, goals with no weight-loss framing, no alcohol or household questions, a parent/guardian section (who is filling it in, guardian name and phone as the emergency contact), asthma/allergy/emergency need, school-night sleep, parent notes.
- Consent wording is the parent or legal guardian's.
- Flags: low sleep is 7 hours or fewer for the youth form (5 for adults); new flag for asthma/allergy.
- Stored in the same table with a `variant` column (migration 012). Adult and youth answers are kept apart for the same member.
- Not age-gated: anyone can open either form, because the members area does not know a member's age cheaply. A parent filling it in on their own login is allowed.
- Wording is mine; have a coach and a parent read it before launch. Safeguarding: consider who can see youth answers (all coaches by default) and whether a DBS-checked-coach-only rule is wanted.

**Deploy order matters:** run migration 012 in the members-area Supabase project BEFORE this code deploys, because the code reads the new `variant` column (the adult form too).

## 12. Wellbeing hub and injury report (built 2026-11-05, branch `injury-report`)

Wellbeing lists the three forms together: "My Health Profile", "My Health Profile: Youth Athlete", "Report an Injury". Same on/off switch.
- Injury report fields: body areas (tap front or back figure, up to 8; left and right are the member's own), date, pain 0-10, still sore or getting better, seen a physio or therapist (and who), notes, optional "tell me about therapist services", privacy notice and consent.
- Members can add several reports and mark each recovering or resolved.
- Stored in `member_injuries` (migration 013), private like the questionnaire: RLS on, no policy, server routes only, member id from the verified token.
- Staff Hub, with no change there: a member note of type "Injury / health" (author "Members area (injury report)"), and when therapist info was asked for, a general dashboard task "Injury: <name> would like therapist info (...). Forward to a therapist." Alerts are best effort: a failure never loses the report.
- Coach portal profile: "Injury history" card (areas, date, pain with 7+ in red, therapist seen, notes, "Asked about therapist services").
- Privacy notice added to the questionnaire consent step and the injury form. Draft wording: sign-off needed.
- Decided: all coaches can see health and injury answers.
