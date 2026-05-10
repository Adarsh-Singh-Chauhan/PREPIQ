-- ============================================================================
-- PrepIQ: Fix RLS Policies (Safe / Idempotent)
-- ============================================================================
-- Run this in Supabase SQL Editor to clear all stale RLS policies
-- and disable RLS on all PrepIQ tables.
-- ============================================================================

-- Step 1: Drop ALL existing RLS policies on all PrepIQ tables
-- This uses a DO block to dynamically find and drop every policy.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'users', 'sessions', 'interviews', 'roadmap_milestones',
              'chat_history', 'certificates', 'schedule_slots', 'skills',
              'login_activity', 'resume_checks', 'questions', 'internships',
              'interview_sessions'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- Step 2: Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant access to anon role (needed for localStorage-based auth)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Done! All RLS policies have been removed and RLS is disabled.
-- The app uses the service role key via /api/db, so RLS is not needed.
