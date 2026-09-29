// Reads published job positions from Odoo Recruitment.
//
// Two ways, picked automatically:
//  1. Official API (Odoo "Custom" plan): set ODOO_API_KEY (+ optional ODOO_DB)
//     in Vercel → uses /json/2/hr.job/search_read.
//  2. Any plan: reads the public careers page <odoo-url>/jobs that Odoo
//     Website generates for every published job.
// Results are cached for 15 minutes.

import { parse } from 'node-html-parser';

const TTL = 900; // seconds
const UA = { 'User-Agent': 'QaserAlmarayaWebsite/1.0 (+jobs sync)' };

function cleanUrl(u) {
  let s = String(u || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const x = new URL(s);
    return x.origin;
  } catch {
    return '';
  }
}

function htmlToLines(html, max = 4) {
  if (!html) return [];
  const root = parse(String(html));
  let items = root.querySelectorAll('li').map((l) => l.text.trim()).filter(Boolean);
  if (!items.length) {
    items = root.text.split(/\n|(?<=[.!؟?])\s+/).map((t) => t.trim()).filter((t) => t.length > 3);
  }
  return items.slice(0, max).map((t) => (t.length > 140 ? t.slice(0, 137) + '…' : t));
}

// ── 1. Official JSON-2 API ────────────────────────────────────────────
async function viaApi(base) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', Authorization: 'bearer ' + process.env.ODOO_API_KEY, ...UA };
  if (process.env.ODOO_DB) headers['X-Odoo-Database'] = process.env.ODOO_DB;
  const res = await fetch(base + '/json/2/hr.job/search_read', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      domain: [['is_published', '=', true]],
      fields: ['name', 'description', 'address_id', 'no_of_recruitment', 'website_url', 'department_id', 'contract_type_id'],
    }),
    next: { revalidate: TTL },
  });
  if (!res.ok) throw new Error('Odoo API ' + res.status);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: 'odoo-' + r.id,
    title: r.name,
    tag: (r.department_id && r.department_id[1]) || '',
    location: [r.address_id && r.address_id[1], r.contract_type_id && r.contract_type_id[1]].filter(Boolean).join(' — '),
    bullets: htmlToLines(r.description),
    url: r.website_url ? base + r.website_url : base + '/jobs',
    source: 'odoo',
  }));
}

// ── 2. Public careers page ─────────────────────────────────────────────
const JOB_HREF = /^(?:https?:\/\/[^/]+)?\/jobs\/(?:detail\/)?([a-z0-9\u0600-\u06FF%-]+-\d+)\/?$/i;

async function viaPublicPage(base) {
  const res = await fetch(base + '/jobs', { headers: UA, next: { revalidate: TTL } });
  if (!res.ok) throw new Error('Odoo careers page ' + res.status);
  const root = parse(await res.text());
  const byHref = new Map();
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href').split('?')[0].split('#')[0];
    if (!JOB_HREF.test(href) || /\/jobs\/(apply|page|country|office|department)/i.test(href)) return;
    const heading = a.querySelector('h1,h2,h3,h4,h5,h6,[itemprop=title],.o_job_name');
    const title = (heading ? heading.text : a.text).replace(/\s+/g, ' ').trim();
    const prev = byHref.get(href);
    // Keep the most descriptive link text found for this job
    if (!prev || (title && title.length > (prev.title || '').length && title.length < 120)) {
      const card = a.closest('div,li,article') || a;
      const texts = card.text.replace(/\s+/g, ' ').trim();
      byHref.set(href, { href, title: title || prev?.title || '', cardText: texts });
    }
  });

  const jobs = [...byHref.values()].filter((j) => j.title).slice(0, 30);
  // Short summary from each job page's meta description (cached as well)
  await Promise.all(
    jobs.map(async (j) => {
      try {
        const r = await fetch(base + j.href, { headers: UA, next: { revalidate: TTL } });
        if (!r.ok) return;
        const page = parse(await r.text());
        const meta = page.querySelector('meta[name=description]')?.getAttribute('content') || page.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        j.summary = meta.trim();
        const addr = page.querySelector('[itemprop=address], address');
        j.location = addr ? addr.text.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
      } catch {}
    })
  );

  return jobs.map((j) => ({
    id: 'odoo-' + j.href.split('-').pop(),
    title: j.title,
    tag: '',
    location: j.location || '',
    bullets: j.summary ? [j.summary.length > 180 ? j.summary.slice(0, 177) + '…' : j.summary] : [],
    url: base + j.href,
    source: 'odoo',
  }));
}

export async function fetchOdooJobs(odooUrl) {
  const base = cleanUrl(odooUrl || process.env.ODOO_URL);
  if (!base) return { jobs: [], mode: 'off' };
  if (process.env.ODOO_API_KEY) {
    try {
      return { jobs: await viaApi(base), mode: 'api' };
    } catch (e) {
      // Plan without API access, wrong key, etc. — fall back to the public page.
      const jobs = await viaPublicPage(base);
      return { jobs, mode: 'public', note: 'API failed: ' + e.message };
    }
  }
  return { jobs: await viaPublicPage(base), mode: 'public' };
}
