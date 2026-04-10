import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Use Supabase/PostgreSQL as primary source
    try {
      const agents = await db.getAgents();

      return NextResponse.json({
        success: true,
        agents,
        count: agents.length,
        source: 'supabase',
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (supabaseError) {
      console.log('Supabase not available, trying PHP backend...', supabaseError);
    }

    // Fallback to PHP backend (for legacy compatibility)
    try {
      const phpResponse = await fetch('http://localhost/PROPLEDGER/managers/get_agents.php');
      const phpData = await phpResponse.json();

      if (phpData.success && phpData.agents) {
        return NextResponse.json({
          success: true,
          agents: phpData.agents,
          count: phpData.agents.length,
          source: 'php',
        });
      }
    } catch (phpError) {
      console.log('PHP backend also not available', phpError);
    }

    // If both fail, return empty array
    return NextResponse.json({
      success: true,
      agents: [],
      count: 0,
      source: 'none',
      message: 'No data source available',
    });

  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
