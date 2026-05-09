import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjdrwefhivkdxasgzpme.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CareerGoal = {
  id: string;
  user_id: string;
  title: string;
  target_date: string;
  created_at: string;
};

export type RoadmapMilestone = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
};
