import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { getContent } from '../../../../lib/content';
import { fetchOdooJobs } from '../../../../lib/odooJobs';
import { submitToOdoo } from '../../../../lib/odooApply';

export const maxDuration = 60;

// Dashboard diagnostic: shows each step of sending an application to Odoo.
// dryRun=true only reads the form; dryRun=false sends a clearly-labelled test applicant.
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { dryRun = true, odooUrl, jobId } = await request.json().catch(() => ({}));
  const trace = [];
  const t0 = Date.now();
  try {
    const content = await getContent();
    const { jobs, mode } = await fetchOdooJobs(odooUrl || content.careers?.odooUrl);
    trace.push(['jobsMode', mode + ' — ' + jobs.length + ' jobs (' + (Date.now() - t0) + ' ms)']);
    if (!jobs.length) throw new Error('No published jobs found');
    trace.push(['allJobs', jobs.map((j) => j.title + ' [' + j.id + ']').join(' | ')]);
    const job = jobs.find((j) => j.id === jobId) || jobs[0];
    trace.push(['testJob', job.title]);
    const pdf = new TextEncoder().encode('%PDF-1.4\n% Qaser Almaraya website test file\n').buffer;
    const r = await submitToOdoo(
      job.url,
      { name: 'TEST — Qaser Website (please delete)', email: 'website-test@almarayagroup.com', phone: '0000000000', message: 'Automatic test from the website dashboard. Safe to delete.' },
      dryRun ? [] : [{ name: 'test.pdf', type: 'application/pdf', data: pdf }],
      { dryRun, trace, jobId: String(job.id).replace(/^odoo-/, '') }
    );
    trace.push(['totalTime', Date.now() - t0 + ' ms']);
    return NextResponse.json({ ok: true, id: r.id, dryRun, trace, jobs: jobs.map((j) => ({ id: j.id, title: j.title })) });
  } catch (e) {
    trace.push(['totalTime', Date.now() - t0 + ' ms']);
    return NextResponse.json({ ok: false, error: e.message || 'failed', trace });
  }
}
