/**
 * POST /api/db
 * 
 * Server-side endpoint for ALL Supabase database operations.
 * Uses the service role key to bypass RLS policies, since
 * the app uses localStorage auth (not Supabase Auth).
 * 
 * Supports: insert, upsert, select, update, delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { action, table, data, filters, orderBy, limit, updateData } = body;

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name is required' }, { status: 400 });
    }

    switch (action) {
      case 'insert': {
        const rows = Array.isArray(data) ? data : [data];
        const { data: result, error } = await supabaseAdmin
          .from(table)
          .insert(rows)
          .select();

        if (error) {
          console.warn(`[API /db] Insert into ${table} error:`, error.message);
          return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: true, data: result });
      }

      case 'upsert': {
        const rows = Array.isArray(data) ? data : [data];
        const { data: result, error } = await supabaseAdmin
          .from(table)
          .upsert(rows, { onConflict: body.onConflict || 'id' })
          .select();

        if (error) {
          console.warn(`[API /db] Upsert into ${table} error:`, error.message);
          return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: true, data: result });
      }

      case 'select': {
        let query = supabaseAdmin.from(table).select('*');

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (orderBy) query = query.order(orderBy, { ascending: body.ascending ?? false });
        if (limit) query = query.limit(limit);

        const { data: result, error } = await query;

        if (error) {
          console.warn(`[API /db] Select from ${table} error:`, error.message);
          return NextResponse.json({ success: false, error: error.message, data: [] });
        }
        return NextResponse.json({ success: true, data: result || [] });
      }

      case 'update': {
        if (!filters || Object.keys(filters).length === 0) {
          return NextResponse.json({ success: false, error: 'Filters required for update' }, { status: 400 });
        }

        let query = supabaseAdmin.from(table).update(updateData || data);
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data: result, error } = await query.select();

        if (error) {
          console.warn(`[API /db] Update ${table} error:`, error.message);
          return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: true, data: result });
      }

      case 'delete': {
        if (!filters || Object.keys(filters).length === 0) {
          return NextResponse.json({ success: false, error: 'Filters required for delete' }, { status: 400 });
        }

        let query = supabaseAdmin.from(table).delete();
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { error } = await query;

        if (error) {
          console.warn(`[API /db] Delete from ${table} error:`, error.message);
          return NextResponse.json({ success: false, error: error.message });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API /db] Exception:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
