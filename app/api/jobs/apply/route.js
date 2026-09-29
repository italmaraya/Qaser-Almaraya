import { NextResponse } from 'next/server';
import { sendJobApplicationEmail } from '../../../../lib/mailer';
import { getContent } from '../../../../lib/content';
import { fetchOdooJobs } from '../../../../lib/odooJobs';
import { submitToOdoo } from '../../../../lib/odooApply';

// Only files uploaded through our own form (Vercel Blob) are forwarded.
function isOurBlob(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && /\.blob\.vercel-storage\.com$/.test(x.hostname);
  } catch {
    return false;
  }
}

async function download(u, label) {
  if (!u || !isOurBlob(u)) return null;
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) return null;
  const buf = await r.arrayBuffer();
  const ext = (new URL(u).pathname.match(/\.([a-z0-9]{2,5})$/i) || [, 'pdf'])[1];
  return { name: label + '.' + ext, type: r.headers.get('content-type') || 'application/octet-stream', data: buf };
}

// Applying talks to Odoo several times — allow more than the 10 s default.
export const maxDuration = 60;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { job, odooJobId, name, phone, email, bring, cvUrl, coverUrl, workUrl } = body || {};

  if (!name || !phone || !email || !bring || !cvUrl || !coverUrl) {
    return NextResponse.json({ error: 'يرجى تعبئة جميع الحقول المطلوبة ورفع الملفات المطلوبة' }, { status: 400 });
  }

  // Jobs published in Odoo → the application goes straight into Odoo Recruitment.
  if (odooJobId) {
    try {
      const content = await getContent();
      const { jobs } = await fetchOdooJobs(content.careers?.odooUrl);
      const target = jobs.find((j) => j.id === odooJobId);
      if (!target) throw new Error('Job no longer published in Odoo');
      const safeName = String(name).replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/\s+/g, '_') || 'applicant';
      const files = (await Promise.all([
        download(cvUrl, 'CV_' + safeName),
        download(coverUrl, 'Cover_Letter_' + safeName),
        download(workUrl, 'Work_Samples_' + safeName),
      ])).filter(Boolean);
      const message = [bring, '', 'Applied via almarayagroup.iq'].join('\n');
      const r = await submitToOdoo(target.url, { name, email, phone, message }, files, { jobId: String(target.id).replace(/^odoo-/, '') });
      return NextResponse.json({ ok: true, odoo: true, id: r.id });
    } catch (err) {
      // Never lose an application: if Odoo refuses it, email it to HR instead.
      console.error('Odoo application failed, falling back to email:', err && err.message);
      try {
        await sendJobApplicationEmail({ job: (job || '') + ' (Odoo: ' + (err.message || 'error') + ')', name, phone, email, bring, cvUrl, coverUrl, workUrl });
        return NextResponse.json({ ok: true, odoo: false });
      } catch (mailErr) {
        console.error('Fallback email failed too:', mailErr);
        return NextResponse.json({ error: 'تعذر إرسال الطلب، حاول لاحقاً' }, { status: 500 });
      }
    }
  }

  try {
    await sendJobApplicationEmail({ job, name, phone, email, bring, cvUrl, coverUrl, workUrl });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Job application email failed:', err);
    return NextResponse.json({ error: 'تعذر إرسال الطلب، حاول لاحقاً' }, { status: 500 });
  }
}
