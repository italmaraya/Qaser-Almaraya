import { NextResponse } from 'next/server';
import { getContent } from '../../../lib/content';
import { fetchOdooJobs } from '../../../lib/odooJobs';

// The Odoo requests themselves are cached for 15 minutes (see lib/odooJobs.js).
export const dynamic = 'force-dynamic';

// Jobs shown on the website: published Odoo positions + (optionally) the
// jobs typed in the dashboard.
export async function GET() {
  const content = await getContent();
  const cfg = content.careers || {};
  const manual = (content.jobs || []).map((j) => ({ ...j, source: 'manual' }));
  let odoo = { jobs: [], mode: 'off' };
  let error = '';
  if (cfg.odooUrl || process.env.ODOO_URL) {
    try {
      odoo = await fetchOdooJobs(cfg.odooUrl);
    } catch (e) {
      error = e.message || 'Could not read Odoo jobs';
    }
  }
  const hideManual = cfg.hideManualWhenOdoo !== false && odoo.jobs.length > 0;
  return NextResponse.json({
    jobs: [...odoo.jobs, ...(hideManual ? [] : manual)],
    odooCount: odoo.jobs.length,
    mode: odoo.mode,
    error,
    note: odoo.note || '',
  });
}
