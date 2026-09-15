import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';

// Public endpoint (no login) — the customer is already on the tracking page
// having found their own application by phone number or order number, so we
// re-check that same phone number here before attaching anything, to stop a
// stranger who only guessed an order number from attaching files to it.
export async function POST(request) {
  await ensureSchema();
  const { applicationId, phone, url } = await request.json().catch(() => ({}));

  if (!applicationId || !url) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  const apps = await sql`
    SELECT a.id, a.customer_phone, a.internal_status_id, ist.allows_customer_upload
    FROM visa_applications a
    LEFT JOIN internal_statuses ist ON ist.id = a.internal_status_id
    WHERE a.id = ${applicationId}
  `;
  if (apps.length === 0) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
  const application = apps[0];

  const digitsOnly = (s) => String(s || '').replace(/[^0-9]/g, '');
  if (!phone || !digitsOnly(application.customer_phone).includes(digitsOnly(phone))) {
    return NextResponse.json({ error: 'رقم الهاتف لا يطابق هذا الطلب' }, { status: 403 });
  }

  if (!application.allows_customer_upload) {
    return NextResponse.json({ error: 'لا يمكن رفع ملف في الحالة الحالية لهذا الطلب' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE visa_applications
    SET customer_upload_url = ${url}, customer_upload_at = now()
    WHERE id = ${applicationId}
    RETURNING id, customer_upload_url, customer_upload_at
  `;

  // Leaves a visible trail in the same status-history log staff already
  // check, so the upload shows up in the dashboard immediately.
  await sql`
    INSERT INTO visa_status_history (application_id, internal_status_id, changed_by, note)
    VALUES (${applicationId}, ${application.internal_status_id}, 'customer', ${'رفع العميل ملفاً: ' + url})
  `;

  return NextResponse.json({ ok: true, application: rows[0] });
}
