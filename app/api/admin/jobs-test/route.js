import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { fetchOdooJobs } from '../../../../lib/odooJobs';

// Dashboard "test connection" for the Odoo jobs sync.
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { odooUrl } = await request.json().catch(() => ({}));
  try {
    const r = await fetchOdooJobs(odooUrl);
    return NextResponse.json({ ok: true, mode: r.mode, count: r.jobs.length, titles: r.jobs.slice(0, 8).map((j) => j.title), jobs: r.jobs.map((j) => ({ id: j.id, title: j.title })), note: r.note || '' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'failed' });
  }
}
