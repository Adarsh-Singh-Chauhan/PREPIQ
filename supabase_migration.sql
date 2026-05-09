-- PrepIQ Migration: Fix tables for localStorage auth
-- Run this in your Supabase SQL Editor to make all features work live.
-- This adds missing columns and disables RLS that was blocking writes.

-- 1. Add user_name column to tables that only have user_id
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.roadmap_milestones ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS cert_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issuer TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS hash_signature TEXT;
ALTER TABLE public.schedule_slots ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Create interviews table (was missing from original schema)
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    role TEXT,
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create resume_checks table (was missing from original schema)
CREATE TABLE IF NOT EXISTS public.resume_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    score INTEGER,
    status TEXT,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fix users table to not require auth.users FK
-- Drop the old FK constraint if it exists, then alter the default
DO $$
BEGIN
    -- Drop FK constraint on users.id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
    END IF;
    
    -- Set default UUID generation if not already
    ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not alter users table: %', SQLERRM;
END $$;

-- 5. Drop FK constraints on other tables that reference users(id)
DO $$
BEGIN
    -- sessions
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sessions_user_id_fkey') THEN
        ALTER TABLE public.sessions DROP CONSTRAINT sessions_user_id_fkey;
    END IF;
    -- roadmap_milestones
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'roadmap_milestones_user_id_fkey') THEN
        ALTER TABLE public.roadmap_milestones DROP CONSTRAINT roadmap_milestones_user_id_fkey;
    END IF;
    -- chat_history
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chat_history_user_id_fkey') THEN
        ALTER TABLE public.chat_history DROP CONSTRAINT chat_history_user_id_fkey;
    END IF;
    -- certificates
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'certificates_user_id_fkey') THEN
        ALTER TABLE public.certificates DROP CONSTRAINT certificates_user_id_fkey;
    END IF;
    -- schedule_slots
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'schedule_slots_user_id_fkey') THEN
        ALTER TABLE public.schedule_slots DROP CONSTRAINT schedule_slots_user_id_fkey;
    END IF;
    -- skills
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'skills_user_id_fkey') THEN
        ALTER TABLE public.skills DROP CONSTRAINT skills_user_id_fkey;
    END IF;
    -- login_activity
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'login_activity_user_id_fkey') THEN
        ALTER TABLE public.login_activity DROP CONSTRAINT login_activity_user_id_fkey;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FK cleanup: %', SQLERRM;
END $$;

-- 6. Disable RLS on all tables (required since app uses localStorage auth)
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

-- Done! All tables are now ready for the PrepIQ app.
-- The /api/db server route uses the service role key to bypass any remaining policies.
