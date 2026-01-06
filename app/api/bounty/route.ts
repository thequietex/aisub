import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/bounty
 * Fetch the current active bounty
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Fetch the most recent open bounty
    const { data: bounties, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bounty' },
        { status: 500 }
      );
    }

    if (!bounties || bounties.length === 0) {
      return NextResponse.json({ bounty: null }, { status: 200 });
    }

    return NextResponse.json({ bounty: bounties[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
