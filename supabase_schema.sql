-- PrepIQ Supabase Schema

-- Enable pgvector for face embeddings (if needed, otherwise use float[])
-- CREATE EXTENSION IF NOT EXISTS vector;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    college TEXT,
    branch TEXT,
    year TEXT,
    city TEXT,
    career_goal TEXT,
    target_company_type TEXT,
    placement_timeline TEXT,
    face_embedding FLOAT[], -- Using float[] for simplicity if vector extension is not available
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- LOGIN ACTIVITY
CREATE TABLE IF NOT EXISTS public.login_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

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

-- SESSIONS TABLE (Mock Interviews)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    phase_number INTEGER,
    milestone_text TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    file_url TEXT,
    ocr_data JSONB,
    is_valid BOOLEAN,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHAT HISTORY (Sage)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- SCHEDULE SLOTS (Timetable)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week TEXT, -- 'Monday', 'Tuesday', etc.
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
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    skill_name TEXT,
    source TEXT, -- 'resume' or 'manual'
    level TEXT, -- 'beginner', 'intermediate', 'expert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) - Basic Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;


-- Policies (Allow users to see only their own data)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON public.roadmap_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.roadmap_milestones FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat history" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat history" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own slots" ON public.schedule_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own slots" ON public.schedule_slots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skills" ON public.skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.skills FOR INSERT WITH CHECK (auth.uid() = user_id);