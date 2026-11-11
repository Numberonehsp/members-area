# Members Area (Gym)

Member-facing web app for the gym. Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Supabase (`@supabase/ssr` for auth/session handling).

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## Key files
- `src/` — application code
- `supabase-schema.sql` and `migrations/` — database schema; keep these in sync when changing tables
- `Number_One_HSP_Claude_Code_Build_Brief.md` — original build brief
- `session-notes-members-area.md` — running notes from past sessions; check before large changes

## Conventions
- Next.js 16 has breaking changes vs. training data — see AGENTS.md note below and read `node_modules/next/dist/docs/` when unsure.
- Use `@supabase/ssr` patterns for server-side Supabase access, not the plain client.

@AGENTS.md
