/**
 * POST /api/log-activity
 * 
 * Server-side endpoint for logging login activity to Supabase.
 * Uses the service role key (if available) to bypass RLS policies,
 * or falls back to the anon key with graceful error handling.
 * 
 * This keeps the login flow non-blocking — if logging fails,
 * the user still logs in successfully.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Build a server-side Supabase client
// Prefer the service role key (bypasses RLS), fall back to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_name, user_email, browser, device, operating_system, login_status } = body;

    if (!user_name || !user_email) {
      return NextResponse.json(
        { success: false, error: 'user_name and user_email are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('login_activity')
      .insert([{
        user_name,
        user_email,
        browser: browser || 'Unknown',
        device: device || 'Unknown',
        operating_system: operating_system || 'Unknown',
        login_status: login_status || 'success',
      }])
      .select();

    if (error) {
      console.warn('[API /log-activity] Supabase insert warning:', error.message);
      // Return success anyway — login activity is non-critical analytics
      return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.warn('[API /log-activity] Exception:', err.message);
    // Never fail the response — this is best-effort analytics
    return NextResponse.json({ success: false, warning: err.message }, { status: 200 });
  }
}
