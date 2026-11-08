import { NextResponse } from 'next/server';
import { latestAlert } from '../../../../lib/news';

// Public, read-only: the travel alert shown in the bar at the top of the site.
export const revalidate = 60;

export async function GET() {
  let alert = null;
  try { alert = await latestAlert(); } catch (e) { console.error('travel alert failed', e); }
  return NextResponse.json(alert, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
