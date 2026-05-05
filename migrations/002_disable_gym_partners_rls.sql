-- Disable RLS on gym_partners table
-- Coach-managed data that requires API access, not user-based RLS

ALTER TABLE gym_partners DISABLE ROW LEVEL SECURITY;
