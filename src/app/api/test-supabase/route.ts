/**
 * GET /api/test-supabase
 * 
 * Quick diagnostic endpoint to verify Supabase connectivity and
 * whether the service role key can bypass RLS on login_activity.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    supabase_url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING',
    service_role_key: serviceRoleKey
      ? `✅ Present (${serviceRoleKey.length} chars, starts with ${serviceRoleKey.substring(0, 20)}...)`
      : '❌ MISSING or EMPTY',
    anon_key: anonKey ? `✅ Present (${anonKey.length} chars)` : '❌ MISSING',
    service_key_looks_valid: false,
    tests: {} as Record<string, any>,
  };

  // Check if the service role key looks like a valid JWT (3 dot-separated parts)
  const jwtParts = serviceRoleKey.split('.');
  results.service_key_looks_valid = jwtParts.length === 3 && jwtParts.every(p => p.length > 10);
  if (!results.service_key_looks_valid) {
    results.service_key_warning = `⚠️ Key has ${jwtParts.length} part(s) — a valid JWT should have exactly 3 parts separated by dots. Your key may be truncated.`;
  }

  // Test 1: Basic connection with anon key
  try {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anonClient.from('interviews').select('id').limit(1);
    results.tests.anon_connection = error
      ? { status: '❌ FAILED', error: error.message }
      : { status: '✅ OK', rows: data?.length ?? 0 };
  } catch (err: any) {
    results.tests.anon_connection = { status: '❌ EXCEPTION', error: err.message };
  }

  // Test 2: Service role key — try to insert and immediately delete a test row
  if (serviceRoleKey) {
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Try inserting a test row
      const testRow = {
        user_name: '__test_connection__',
        user_email: 'test@prepiq.local',
        browser: 'Test',
        device: 'Test',
        operating_system: 'Test',
        login_status: 'connection_test',
      };

      const { data: insertData, error: insertError } = await adminClient
        .from('login_activity')
        .insert([testRow])
        .select();

      if (insertError) {
        results.tests.service_role_insert = {
          status: '❌ FAILED',
          error: insertError.message,
          hint: insertError.message.includes('row-level security')
            ? '⚠️ RLS is still blocking — the service role key may be invalid or truncated.'
            : undefined,
        };
      } else {
        results.tests.service_role_insert = {
          status: '✅ SUCCESS — RLS bypassed!',
          inserted_id: insertData?.[0]?.id,
        };

        // Clean up: delete the test row
        if (insertData?.[0]?.id) {
          await adminClient
            .from('login_activity')
            .delete()
            .eq('id', insertData[0].id);
          results.tests.cleanup = { status: '✅ Test row cleaned up' };
        }
      }
    } catch (err: any) {
      results.tests.service_role_insert = { status: '❌ EXCEPTION', error: err.message };
    }
  } else {
    results.tests.service_role_insert = { status: '⏭️ SKIPPED — no service role key configured' };
  }

  // Test 3: Try with anon key to confirm RLS blocks it
  try {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: rlsError } = await anonClient
      .from('login_activity')
      .insert([{
        user_name: '__test_rls__',
        user_email: 'rls_test@prepiq.local',
        browser: 'Test',
        device: 'Test',
        operating_system: 'Test',
        login_status: 'rls_test',
      }]);

    results.tests.anon_rls_check = rlsError
      ? { status: '✅ EXPECTED — Anon key correctly blocked by RLS', error: rlsError.message }
      : { status: '⚠️ Anon key was NOT blocked — RLS might be disabled' };
  } catch (err: any) {
    results.tests.anon_rls_check = { status: '❌ EXCEPTION', error: err.message };
  }

  return NextResponse.json(results, { status: 200 });
}
