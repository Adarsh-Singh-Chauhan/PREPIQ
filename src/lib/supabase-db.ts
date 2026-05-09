/**
 * supabase-db.ts — Central Supabase Database Operations for ALL tables
 * 
 * Tables covered:
 * - interviews, sessions, login_activity, chat_history
 * - certificates, roadmap_milestones, schedule_slots, skills, users
 */

import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────

export interface InterviewInsert {
  user_name: string;
  role: string;
  score: number;
  feedback?: string;
}

export interface LoginActivityInsert {
  user_name: string;
  user_email: string;
  browser?: string;
  device?: string;
  operating_system?: string;
  login_status?: string;
}

export interface ChatHistoryInsert {
  user_name: string;
  role: 'user' | 'assistant';
  message: string;
}

export interface SessionInsert {
  user_name: string;
  domain: string;
  difficulty: string;
  duration_secs: number;
  overall_score: number;
  content_score?: number;
  communication_score?: number;
  confidence_score?: number;
  relevance_score?: number;
  ai_feedback?: string;
  transcript?: string;
}

export interface CertificateInsert {
  user_name: string;
  cert_name: string;
  issuer: string;
  course: string;
  issue_date: string;
  is_valid: boolean;
  flag_reason?: string;
  hash_signature?: string;
}

export interface RoadmapMilestoneInsert {
  user_name: string;
  phase_number: number;
  milestone_text: string;
  is_completed: boolean;
}

export interface ScheduleSlotInsert {
  user_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  topic: string;
  color: string;
  is_completed?: boolean;
}

export interface SkillInsert {
  user_name: string;
  skill_name: string;
  source: string;
  level: string;
}

export interface UserProfileInsert {
  user_name: string;
  email: string;
  college?: string;
  branch?: string;
  year?: string;
  city?: string;
  career_goal?: string;
  target_company_type?: string;
  placement_timeline?: string;
}

// ─── Connection Test ──────────────────────────────────────────

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      return { connected: false, error: error.message };
    }

    console.log('[Supabase] ✅ Connection successful');
    return { connected: true };
  } catch (err: any) {
    console.error('[Supabase] Connection test exception:', err);
    return { connected: false, error: err.message };
  }
}

// ─── Generic Helper ───────────────────────────────────────────

async function insertRow(table: string, row: any, label: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert([row])
      .select();

    if (error) {
      console.error(`[Supabase] ${label} insert error:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase] ✅ ${label} saved`);
    return { success: true, data };
  } catch (err: any) {
    console.error(`[Supabase] ${label} exception:`, err);
    return { success: false, error: err.message };
  }
}

async function fetchRows(table: string, label: string, filters?: Record<string, any>, orderBy?: string, limit?: number) {
  try {
    let query = supabase.from(table).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (orderBy) query = query.order(orderBy, { ascending: false });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error(`[Supabase] ${label} fetch error:`, error.message);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error(`[Supabase] ${label} fetch exception:`, err);
    return { success: false, error: err.message, data: [] };
  }
}

// ─── INTERVIEWS ───────────────────────────────────────────────

export async function insertInterview(data: InterviewInsert) {
  return insertRow('interviews', {
    user_name: data.user_name,
    role: data.role,
    score: data.score,
    feedback: data.feedback || null,
  }, 'Interview');
}

export async function getInterviews(userName?: string) {
  return fetchRows('interviews', 'Interviews', userName ? { user_name: userName } : undefined, 'created_at');
}

// ─── SESSIONS ─────────────────────────────────────────────────

export async function insertSession(data: SessionInsert) {
  return insertRow('sessions', {
    user_name: data.user_name,
    domain: data.domain,
    difficulty: data.difficulty,
    duration_secs: data.duration_secs,
    overall_score: data.overall_score,
    content_score: data.content_score || null,
    communication_score: data.communication_score || null,
    confidence_score: data.confidence_score || null,
    relevance_score: data.relevance_score || null,
    ai_feedback: data.ai_feedback || null,
    transcript: data.transcript || null,
  }, 'Session');
}

export async function getSessions(userName?: string) {
  return fetchRows('sessions', 'Sessions', userName ? { user_name: userName } : undefined, 'created_at');
}

// ─── LOGIN ACTIVITY ───────────────────────────────────────────

/**
 * Logs login activity via the server-side API route to bypass RLS.
 * This is fire-and-forget — it never throws or blocks the login flow.
 */
export function insertLoginActivity(data: LoginActivityInsert) {
  // Fire-and-forget: don't await, don't throw
  const payload = {
    user_name: data.user_name,
    user_email: data.user_email,
    browser: data.browser || detectBrowser(),
    device: data.device || detectDevice(),
    operating_system: data.operating_system || detectOS(),
    login_status: data.login_status || 'success',
  };

  fetch('/api/log-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        console.log('[Supabase] ✅ Login activity logged');
      } else {
        console.warn('[Supabase] ⚠️ Login activity log warning:', result.warning || 'unknown');
      }
    })
    .catch((err) => {
      // Completely silent — login activity is best-effort analytics
      console.warn('[Supabase] ⚠️ Login activity log skipped:', err.message);
    });
}

export async function getLoginActivity(userName?: string) {
  return fetchRows('login_activity', 'Login activity', userName ? { user_name: userName } : undefined, 'created_at');
}

// ─── CHAT HISTORY ─────────────────────────────────────────────

export async function insertChatMessage(data: ChatHistoryInsert) {
  return insertRow('chat_history', {
    user_name: data.user_name,
    role: data.role,
    message: data.message,
  }, 'Chat message');
}

export async function getChatHistory(userName: string, limit: number = 50) {
  return fetchRows('chat_history', 'Chat history', { user_name: userName }, 'created_at', limit);
}

// ─── RESUMES ─────────────────────────────────────────────

export interface ResumeCheckInsert {
  user_name: string;
  score: number;
  status: string;
  feedback?: string;
}

export async function insertResumeCheck(data: ResumeCheckInsert) {
  return insertRow('resume_checks', {
    user_name: data.user_name,
    score: data.score,
    status: data.status,
    feedback: data.feedback || null,
  }, 'Resume Check');
}

export async function getResumeChecks(userName?: string) {
  return fetchRows('resume_checks', 'Resume Checks', userName ? { user_name: userName } : undefined, 'created_at');
}

// ─── CERTIFICATES ─────────────────────────────────────────────

export async function insertCertificate(data: CertificateInsert) {
  return insertRow('certificates', {
    user_name: data.user_name,
    cert_name: data.cert_name,
    issuer: data.issuer,
    course: data.course,
    issue_date: data.issue_date,
    is_valid: data.is_valid,
    flag_reason: data.flag_reason || null,
    hash_signature: data.hash_signature || null,
  }, 'Certificate');
}

export async function getCertificates(userName?: string) {
  return fetchRows('certificates', 'Certificates', userName ? { user_name: userName } : undefined, 'created_at');
}

// ─── ROADMAP MILESTONES ───────────────────────────────────────

export async function insertRoadmapMilestone(data: RoadmapMilestoneInsert) {
  return insertRow('roadmap_milestones', {
    user_name: data.user_name,
    phase_number: data.phase_number,
    milestone_text: data.milestone_text,
    is_completed: data.is_completed,
    completed_at: data.is_completed ? new Date().toISOString() : null,
  }, 'Roadmap milestone');
}

export async function updateMilestoneStatus(milestoneId: string, isCompleted: boolean) {
  try {
    const { data, error } = await supabase
      .from('roadmap_milestones')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', milestoneId)
      .select();

    if (error) {
      console.error('[Supabase] Milestone update error:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Supabase] ✅ Milestone updated');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getRoadmapMilestones(userName?: string) {
  return fetchRows('roadmap_milestones', 'Milestones', userName ? { user_name: userName } : undefined, 'phase_number');
}

// ─── SCHEDULE SLOTS ───────────────────────────────────────────

export async function insertScheduleSlot(data: ScheduleSlotInsert) {
  return insertRow('schedule_slots', {
    user_name: data.user_name,
    day_of_week: data.day_of_week,
    start_time: data.start_time,
    end_time: data.end_time,
    topic: data.topic,
    color: data.color,
    is_completed: data.is_completed || false,
  }, 'Schedule slot');
}

export async function updateScheduleSlot(slotId: string, updates: Partial<ScheduleSlotInsert>) {
  try {
    const { data, error } = await supabase
      .from('schedule_slots')
      .update(updates)
      .eq('id', slotId)
      .select();

    if (error) {
      console.error('[Supabase] Schedule slot update error:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Supabase] ✅ Schedule slot updated');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getScheduleSlots(userName?: string) {
  return fetchRows('schedule_slots', 'Schedule', userName ? { user_name: userName } : undefined);
}

// ─── SKILLS ───────────────────────────────────────────────────

export async function insertSkill(data: SkillInsert) {
  return insertRow('skills', {
    user_name: data.user_name,
    skill_name: data.skill_name,
    source: data.source,
    level: data.level,
  }, 'Skill');
}

export async function insertSkillsBulk(skills: SkillInsert[]) {
  try {
    const rows = skills.map(s => ({
      user_name: s.user_name,
      skill_name: s.skill_name,
      source: s.source,
      level: s.level,
    }));

    const { data, error } = await supabase
      .from('skills')
      .insert(rows)
      .select();

    if (error) {
      console.error('[Supabase] Skills bulk insert error:', error.message);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase] ✅ ${rows.length} skills saved`);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSkills(userName?: string) {
  return fetchRows('skills', 'Skills', userName ? { user_name: userName } : undefined);
}

// ─── USERS (Profile) ─────────────────────────────────────────

export async function upsertUserProfile(data: UserProfileInsert) {
  try {
    // Try insert first, update if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: result, error } = await supabase
        .from('users')
        .update({
          name: data.user_name,
          college: data.college || null,
          branch: data.branch || null,
          year: data.year || null,
          city: data.city || null,
          career_goal: data.career_goal || null,
          target_company_type: data.target_company_type || null,
          placement_timeline: data.placement_timeline || null,
        })
        .eq('email', data.email)
        .select();

      if (error) {
        console.error('[Supabase] User profile update error:', error.message);
        return { success: false, error: error.message };
      }
      console.log('[Supabase] ✅ User profile updated');
      return { success: true, data: result };
    } else {
      return insertRow('users', {
        name: data.user_name,
        email: data.email,
        college: data.college || null,
        branch: data.branch || null,
        year: data.year || null,
        city: data.city || null,
        career_goal: data.career_goal || null,
        target_company_type: data.target_company_type || null,
        placement_timeline: data.placement_timeline || null,
      }, 'User profile');
    }
  } catch (err: any) {
    console.error('[Supabase] User profile exception:', err);
    return { success: false, error: err.message };
  }
}

export async function getUserProfile(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('[Supabase] User profile fetch error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] User profile fetch exception:', err);
    return { success: false, error: err.message };
  }
}

// ─── Browser Detection Helpers ────────────────────────────────

function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

function detectDevice(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

function detectOS(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Other';
}
