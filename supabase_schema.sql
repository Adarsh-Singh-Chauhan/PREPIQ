-- PrepIQ Supabase Schema (Updated for Local Auth)
-- Since the app uses localStorage auth instead of Supabase Auth,
-- tables use user_name TEXT as the primary identifier instead of
-- auth.users UUID references.

-- USERS TABLE (no auth.users FK)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    college TEXT,
    branch TEXT,
    year TEXT,
    city TEXT,
    career_goal TEXT,
    target_company_type TEXT,
    placement_timeline TEXT,
    face_embedding FLOAT[],
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOGIN ACTIVITY
CREATE TABLE IF NOT EXISTS public.login_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    user_email TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    browser TEXT,
    device TEXT,
    operating_system TEXT,
    login_status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INTERVIEWS (summary table)
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    role TEXT,
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SESSIONS TABLE (Mock Interviews detailed)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    domain TEXT,
    difficulty TEXT,
    duration_secs INTEGER,
    overall_score INTEGER,
    content_score INTEGER,
    communication_score INTEGER,
    confidence_score INTEGER,
    relevance_score INTEGER,
    body_language_score INTEGER,
    transcript TEXT,
    recording_url TEXT,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTIONS BANK
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT,
    difficulty TEXT,
    question_text TEXT,
    ideal_answer_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROADMAP MILESTONES
CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    phase_number INTEGER,
    milestone_text TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    cert_name TEXT,
    issuer TEXT,
    course TEXT,
    issue_date TEXT,
    file_url TEXT,
    ocr_data JSONB,
    is_valid BOOLEAN,
    flag_reason TEXT,
    hash_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHAT HISTORY (Sage)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    role TEXT CHECK (role IN ('user', 'assistant')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INTERNSHIPS
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    company TEXT,
    domain TEXT,
    skills_required TEXT[],
    stipend TEXT,
    location TEXT,
    work_mode TEXT,
    apply_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RESUME CHECKS
CREATE TABLE IF NOT EXISTS public.resume_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    score INTEGER,
    status TEXT,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHEDULE SLOTS (Timetable)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    day_of_week TEXT,
    start_time TIME,
    end_time TIME,
    topic TEXT,
    color TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT,
    skill_name TEXT,
    source TEXT,
    level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IMPORTANT: For the app to work, you must either:
-- 1. DISABLE RLS on all tables (easiest for development/hackathon):

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

-- 2. OR use service role key in your .env.local:
--    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
--    The /api/db endpoint uses this key to bypass RLS automatically.