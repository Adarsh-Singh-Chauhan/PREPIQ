-- ============================================================================
-- PrepIQ: Interview Session Recording & Report Schema
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── 1. Create interview_sessions table ──
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  domain TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Intermediate',
  recording_path TEXT,
  recording_signed_url TEXT,
  report_json JSONB,
  overall_score INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  technical_score INTEGER DEFAULT 0,
  duration_secs INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Disable RLS for the new table ──
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.interview_sessions TO anon;

-- ── 3. Create Supabase Storage bucket for recordings ──
-- NOTE: You must also create the bucket in the Supabase Dashboard:
-- Storage → New bucket → Name: "interview-recordings" → Private (unchecked Public)
-- The bucket must be created via the dashboard UI.

-- ── 4. Storage policies for the bucket (run after creating bucket) ──
-- Allow authenticated and anonymous uploads (since we use localStorage auth)
-- Run these ONLY after creating the bucket in the dashboard:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('interview-recordings', 'interview-recordings', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'interview-recordings');
-- CREATE POLICY "Allow reads" ON storage.objects FOR SELECT USING (bucket_id = 'interview-recordings');
-- CREATE POLICY "Allow deletes" ON storage.objects FOR DELETE USING (bucket_id = 'interview-recordings');

-- ── 5. Add index for fast lookups ──
CREATE INDEX IF NOT EXISTS idx_interview_sessions_email ON public.interview_sessions(email);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created ON public.interview_sessions(created_at DESC);

-- ── 6. Verify ──
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'interview_sessions' AND table_schema = 'public'
ORDER BY ordinal_position;
