/**
 * supabase-db.ts — Central Database Operations for ALL tables
 * 
 * ALL operations go through /api/db server-side route which uses
 * the Supabase service role key to bypass RLS policies.
 * This is necessary because the app uses localStorage auth, not Supabase Auth.
 * 
 * Tables covered:
 * - interviews, sessions, login_activity, chat_history
 * - certificates, roadmap_milestones, schedule_slots, skills, users, resume_checks
 */

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

export interface ResumeCheckInsert {
  user_name: string;
  score: number;
  status: string;
  feedback?: string;
}

// ─── Server-Side DB Helper ────────────────────────────────────

async function dbRequest(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn(`[DB] ${payload.action} on ${payload.table}:`, result.error);
    }
    return result;
  } catch (err: any) {
    console.warn(`[DB] ${payload.action} on ${payload.table} exception:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── Connection Test ──────────────────────────────────────────

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const res = await dbRequest({ action: 'select', table: 'login_activity', limit: 1 });
  return { connected: res.success, error: res.error };
}

// ─── INTERVIEWS ───────────────────────────────────────────────

export async function insertInterview(data: InterviewInsert) {
  return dbRequest({
    action: 'insert',
    table: 'interviews',
    data: {
      user_name: data.user_name,
      role: data.role,
      score: data.score,
      feedback: data.feedback || null,
    },
  });
}

export async function getInterviews(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'interviews',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'created_at',
  });
}

// ─── SESSIONS ─────────────────────────────────────────────────

export async function insertSession(data: SessionInsert) {
  return dbRequest({
    action: 'insert',
    table: 'sessions',
    data: {
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
    },
  });
}

export async function getSessions(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'sessions',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'created_at',
  });
}

// ─── LOGIN ACTIVITY ───────────────────────────────────────────

/**
 * Logs login activity via the server-side API route.
 * Fire-and-forget — never blocks the login flow.
 */
export function insertLoginActivity(data: LoginActivityInsert) {
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
        console.log('[DB] ✅ Login activity logged');
      } else {
        console.warn('[DB] ⚠️ Login activity log warning:', result.warning || 'unknown');
      }
    })
    .catch((err) => {
      console.warn('[DB] ⚠️ Login activity log skipped:', err.message);
    });
}

export async function getLoginActivity(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'login_activity',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'created_at',
  });
}

// ─── CHAT HISTORY ─────────────────────────────────────────────

export async function insertChatMessage(data: ChatHistoryInsert) {
  return dbRequest({
    action: 'insert',
    table: 'chat_history',
    data: {
      user_name: data.user_name,
      role: data.role,
      message: data.message,
    },
  });
}

export async function getChatHistory(userName: string, limit: number = 50) {
  return dbRequest({
    action: 'select',
    table: 'chat_history',
    filters: { user_name: userName },
    orderBy: 'created_at',
    limit,
  });
}

// ─── RESUMES ─────────────────────────────────────────────

export async function insertResumeCheck(data: ResumeCheckInsert) {
  return dbRequest({
    action: 'insert',
    table: 'resume_checks',
    data: {
      user_name: data.user_name,
      score: data.score,
      status: data.status,
      feedback: data.feedback || null,
    },
  });
}

export async function getResumeChecks(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'resume_checks',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'created_at',
  });
}

// ─── CERTIFICATES ─────────────────────────────────────────────

export async function insertCertificate(data: CertificateInsert) {
  return dbRequest({
    action: 'insert',
    table: 'certificates',
    data: {
      user_name: data.user_name,
      cert_name: data.cert_name,
      issuer: data.issuer,
      course: data.course,
      issue_date: data.issue_date,
      is_valid: data.is_valid,
      flag_reason: data.flag_reason || null,
      hash_signature: data.hash_signature || null,
    },
  });
}

export async function getCertificates(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'certificates',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'created_at',
  });
}

// ─── ROADMAP MILESTONES ───────────────────────────────────────

export async function insertRoadmapMilestone(data: RoadmapMilestoneInsert) {
  return dbRequest({
    action: 'insert',
    table: 'roadmap_milestones',
    data: {
      user_name: data.user_name,
      phase_number: data.phase_number,
      milestone_text: data.milestone_text,
      is_completed: data.is_completed,
      completed_at: data.is_completed ? new Date().toISOString() : null,
    },
  });
}

export async function updateMilestoneStatus(milestoneId: string, isCompleted: boolean) {
  return dbRequest({
    action: 'update',
    table: 'roadmap_milestones',
    filters: { id: milestoneId },
    data: {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    },
  });
}

export async function getRoadmapMilestones(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'roadmap_milestones',
    filters: userName ? { user_name: userName } : undefined,
    orderBy: 'phase_number',
    ascending: true,
  });
}

// ─── SCHEDULE SLOTS ───────────────────────────────────────────

export async function insertScheduleSlot(data: ScheduleSlotInsert) {
  return dbRequest({
    action: 'insert',
    table: 'schedule_slots',
    data: {
      user_name: data.user_name,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      topic: data.topic,
      color: data.color,
      is_completed: data.is_completed || false,
    },
  });
}

export async function updateScheduleSlot(slotId: string, updates: Partial<ScheduleSlotInsert>) {
  return dbRequest({
    action: 'update',
    table: 'schedule_slots',
    filters: { id: slotId },
    data: updates,
  });
}

export async function getScheduleSlots(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'schedule_slots',
    filters: userName ? { user_name: userName } : undefined,
  });
}

// ─── SKILLS ───────────────────────────────────────────────────

export async function insertSkill(data: SkillInsert) {
  return dbRequest({
    action: 'insert',
    table: 'skills',
    data: {
      user_name: data.user_name,
      skill_name: data.skill_name,
      source: data.source,
      level: data.level,
    },
  });
}

export async function insertSkillsBulk(skills: SkillInsert[]) {
  const rows = skills.map(s => ({
    user_name: s.user_name,
    skill_name: s.skill_name,
    source: s.source,
    level: s.level,
  }));

  return dbRequest({
    action: 'insert',
    table: 'skills',
    data: rows,
  });
}

export async function getSkills(userName?: string) {
  return dbRequest({
    action: 'select',
    table: 'skills',
    filters: userName ? { user_name: userName } : undefined,
  });
}

// ─── USERS (Profile) ─────────────────────────────────────────

export async function upsertUserProfile(data: UserProfileInsert) {
  // First check if user exists
  const existing = await dbRequest({
    action: 'select',
    table: 'users',
    filters: { email: data.email },
    limit: 1,
  });

  const profileData = {
    name: data.user_name,
    email: data.email,
    college: data.college || null,
    branch: data.branch || null,
    year: data.year || null,
    city: data.city || null,
    career_goal: data.career_goal || null,
    target_company_type: data.target_company_type || null,
    placement_timeline: data.placement_timeline || null,
  };

  if (existing.success && existing.data && existing.data.length > 0) {
    // Update existing
    return dbRequest({
      action: 'update',
      table: 'users',
      filters: { email: data.email },
      data: profileData,
    });
  } else {
    // Insert new
    return dbRequest({
      action: 'insert',
      table: 'users',
      data: profileData,
    });
  }
}

export async function getUserProfile(email: string) {
  const res = await dbRequest({
    action: 'select',
    table: 'users',
    filters: { email },
    limit: 1,
  });
  return {
    success: res.success,
    data: res.data?.[0] || null,
    error: res.error,
  };
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
