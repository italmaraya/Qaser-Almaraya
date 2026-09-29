// Sends an application from our website into Odoo Recruitment.
//
// It uses the job's own public application form on the Odoo website (the one
// Odoo shows at /jobs/apply/...). Our server reads that form, fills in the
// applicant's details and files, and submits it exactly like a browser would,
// so Odoo creates the applicant with their real name, email, phone and CV.
// Works on every Odoo plan (no API needed).

import { parse } from 'node-html-parser';

const UA = 'Mozilla/5.0 (compatible; QaserAlmarayaWebsite/1.0; +jobs)';

function cookiesFrom(res, jar) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
  list.forEach((c) => {
    const [pair] = String(c).split(';');
    const [k, ...v] = pair.split('=');
    if (k) jar[k.trim()] = v.join('=').trim();
  });
}
const cookieHeader = (jar) => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');

async function getPage(url, jar) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookieHeader(jar) }, redirect: 'follow', cache: 'no-store' });
  cookiesFrom(res, jar);
  if (!res.ok) throw new Error('Odoo page ' + res.status);
  return parse(await res.text());
}

function findApplicantForm(root) {
  return (
    root.querySelector('form[data-model_name="hr.applicant"]') ||
    root.querySelector('form[data-model_name="hr.candidate"]') ||
    root.querySelector('form#hr_recruitment_form') ||
    root.querySelector('form[action*="/website/form"]')
  );
}

/**
 * @param {string} jobUrl  full URL of the job page on the Odoo website
 * @param {{name,email,phone,linkedin?,message}} a
 * @param {{name:string,type:string,data:ArrayBuffer}[]} files
 * @returns {Promise<{id:number|string}>}
 */
export async function submitToOdoo(jobUrl, a, files = [], opts = {}) {
  const base = new URL(jobUrl).origin;
  const jar = {};
  const trace = opts.trace || [];
  const step = (k, v) => trace.push([k, v]);
  step('jobUrl', jobUrl);

  // 1. Find the application form (on the job page, or on its /jobs/apply/ page)
  // This job's Odoo record id is the number at the end of its address (…/jobs/ui-ux-designer-5).
  const jobPath = new URL(jobUrl).pathname.replace(/\/$/, '');
  const slug = jobPath.split('/').pop();
  const jobId = opts.jobId || (slug.match(/-(\d+)$/) || [])[1] || '';
  step('jobId', jobId || 'unknown');

  let root = await getPage(jobUrl, jar);
  let form = findApplicantForm(root);
  let formPage = jobUrl;
  if (!form) {
    // Go to THIS job's own apply page. The job page may also link to other
    // jobs' apply pages (e.g. "other open positions"), so never take the first link blindly.
    const links = root.querySelectorAll('a[href]').map((x) => x.getAttribute('href')).filter((h) => /\/jobs\/apply\//.test(h));
    const own = links.find((h) => h.split('?')[0].replace(/\/$/, '').endsWith('/' + slug)) || links.find((h) => jobId && new RegExp('-' + jobId + '(?:[/?#]|$)').test(h));
    const candidates = [own, '/jobs/apply/' + slug].filter(Boolean);
    for (const c of candidates) {
      try {
        formPage = new URL(c, base).href;
        root = await getPage(formPage, jar);
        form = findApplicantForm(root);
        if (form) break;
      } catch {}
    }
  }
  step('formPage', formPage);
  step('formFound', !!form);
  if (!form) {
    step('pageTitle', root.querySelector('title')?.text || '');
    step('formsOnPage', root.querySelectorAll('form').map((x) => (x.getAttribute('action') || '') + ' ' + (x.getAttribute('data-model_name') || '')).join(' | ') || 'none');
    throw new Error('No application form found on the Odoo job page');
  }

  // 2. Work out which field is which on this Odoo version
  const inputs = form.querySelectorAll('input,textarea,select');
  const names = inputs.map((el) => ({ el, name: el.getAttribute('name') || '', type: (el.getAttribute('type') || el.tagName).toLowerCase() })).filter((x) => x.name);
  const pick = (re, types) => names.find((x) => re.test(x.name) && (!types || types.includes(x.type)))?.name;
  const f = {
    name: pick(/^(partner_name|name)$/i) || pick(/name/i, ['text', 'input']),
    email: pick(/email/i),
    phone: pick(/phone|mobile/i),
    linkedin: pick(/linkedin/i),
    text: names.find((x) => x.type === 'textarea')?.name,
    file: names.find((x) => x.type === 'file')?.name || 'Resume',
  };
  step('fields', names.map((x) => x.name + ':' + x.type).join(', '));
  step('mapped', JSON.stringify(f));
  if (!f.name || !f.email) throw new Error('Unexpected Odoo form layout');

  // 3. Build the submission: Odoo's hidden fields (job, department, token…) + ours
  const fd = new FormData();
  names.filter((x) => x.type === 'hidden').forEach((x) => fd.append(x.name, x.el.getAttribute('value') || ''));
  names.filter((x) => x.type === 'select').forEach((x) => {
    const opt = x.el.querySelector('option[selected]') || x.el.querySelector('option');
    if (opt) fd.set(x.name, opt.getAttribute('value') || '');
  });
  // Always file the applicant under the job they chose on our website.
  const formJob = names.find((x) => x.name === 'job_id');
  if (jobId) {
    if (formJob && formJob.type === 'hidden' && String(formJob.el.getAttribute('value')) !== String(jobId)) step('formJobMismatch', 'form had job_id=' + formJob.el.getAttribute('value') + ', corrected to ' + jobId);
    fd.set('job_id', String(jobId));
  }
  step('sentJobId', fd.get('job_id') || 'none');
  fd.set(f.name, a.name);
  fd.set(f.email, a.email);
  if (f.phone && a.phone) fd.set(f.phone, a.phone);
  if (f.linkedin && a.linkedin) fd.set(f.linkedin, a.linkedin);
  if (f.text && a.message) fd.set(f.text, a.message);
  files.forEach((file) => fd.append(f.file, new Blob([file.data], { type: file.type || 'application/octet-stream' }), file.name));

  const model = form.getAttribute('data-model_name') || 'hr.applicant';
  let action = form.getAttribute('action') || '/website/form/';
  const actionUrl = new URL(action, base);
  if (actionUrl.pathname.endsWith('/')) actionUrl.pathname += model;

  step('action', actionUrl.href);
  step('captcha', /recaptcha|turnstile|cf-turnstile|g-recaptcha/i.test(root.toString()) ? 'YES — spam protection found on the form' : 'none found');
  if (opts.dryRun) return { id: null, dryRun: true, trace };

  // 4. Submit like the Odoo website's own form script does
  const res = await fetch(actionUrl.href, {
    method: 'POST',
    headers: { 'User-Agent': UA, Cookie: cookieHeader(jar), Referer: formPage, Origin: base, 'X-Requested-With': 'XMLHttpRequest' },
    body: fd,
    cache: 'no-store',
  });
  const text = await res.text();
  step('response', res.status + ' ' + text.slice(0, 400));
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok || !data || (!data.id && data.id !== 0)) {
    const why = data.error || (data.error_fields ? 'Odoo rejected fields: ' + Object.keys(data.error_fields).join(', ') : 'HTTP ' + res.status);
    throw new Error(why);
  }
  return { id: data.id, trace };
}
