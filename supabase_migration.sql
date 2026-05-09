-- ============================================================================
-- PrepIQ: Complete Supabase Migration for ALL Tables
-- ============================================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ── 1. Disable RLS on ALL tables ──
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships DISABLE ROW LEVEL SECURITY;

-- ── 2. Add user_name to tables that need it ──

-- Sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'user_name') THEN
    ALTER TABLE public.sessions ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Chat history
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_history' AND column_name = 'user_name') THEN
    ALTER TABLE public.chat_history ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Interviews: feedback column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'feedback') THEN
    ALTER TABLE public.interviews ADD COLUMN feedback TEXT;
  END IF;
END $$;

-- Certificates: extra columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'user_name') THEN
    ALTER TABLE public.certificates ADD COLUMN user_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'cert_name') THEN
    ALTER TABLE public.certificates ADD COLUMN cert_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'issuer') THEN
    ALTER TABLE public.certificates ADD COLUMN issuer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'course') THEN
    ALTER TABLE public.certificates ADD COLUMN course TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'issue_date') THEN
    ALTER TABLE public.certificates ADD COLUMN issue_date TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'hash_signature') THEN
    ALTER TABLE public.certificates ADD COLUMN hash_signature TEXT;
  END IF;
END $$;

-- Roadmap milestones: user_name
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roadmap_milestones' AND column_name = 'user_name') THEN
    ALTER TABLE public.roadmap_milestones ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Schedule slots: user_name
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedule_slots' AND column_name = 'user_name') THEN
    ALTER TABLE public.schedule_slots ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Skills: user_name
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skills' AND column_name = 'user_name') THEN
    ALTER TABLE public.skills ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Users: make id NOT require auth.users reference (for localStorage auth)
-- We need to allow inserts without auth.users FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE public.users ADD COLUMN name TEXT;
  END IF;
END $$;

-- ── 3. Grant access ──
GRANT ALL ON public.interviews TO anon;
GRANT ALL ON public.login_activity TO anon;
GRANT ALL ON public.sessions TO anon;
GRANT ALL ON public.chat_history TO anon;
GRANT ALL ON public.certificates TO anon;
GRANT ALL ON public.roadmap_milestones TO anon;
GRANT ALL ON public.schedule_slots TO anon;
GRANT ALL ON public.skills TO anon;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.questions TO anon;
GRANT ALL ON public.internships TO anon;

-- ── 4. Verify ──
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns c2 WHERE c2.table_name = t.table_name AND c2.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
