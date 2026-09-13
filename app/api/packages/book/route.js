import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { sendPackageBookingNotice } from '../../../../lib/mailer';

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const {
    package_id, hotel_choice, hotel_diff, flight_choice, flight_diff,
    nationality, customer_phone, customer_email,
    payment_method, payment_proof_url, travelers,
  } = body || {};

  if (!package_id || !customer_phone || !Array.isArray(travelers) || travelers.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const pkgs = await sql`SELECT * FROM packages WHERE id = ${package_id}`;
  if (pkgs.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  const pkg = pkgs[0];

  const adultCount = travelers.filter((t) => t.traveler_type === 'adult').length;
  const childCount = travelers.filter((t) => t.traveler_type === 'child').length;
  const basePrice = Number(pkg.price) || 0;
  const baseChildPrice = Number(pkg.child_price) || 0;
  const upgrade = (Number(hotel_diff) || 0) + (Number(flight_diff) || 0);
  const totalPrice = adultCount * (basePrice + upgrade) + childCount * (baseChildPrice + upgrade);

  // Same rule as visa applications: every new booking starts as
  // 'awaiting_review' and is never treated as confirmed until a staff member
  // checks the payment proof (or the office-payment promise) from the
  // dashboard and moves it forward themselves.
  const [booking] = await sql`
    INSERT INTO package_bookings (
      package_id, hotel_choice, hotel_diff, flight_choice, flight_diff,
      adult_count, child_count, total_price, nationality,
      customer_phone, customer_email, payment_method, payment_proof_url, payment_status
    ) VALUES (
      ${package_id}, ${hotel_choice || ''}, ${hotel_diff || 0}, ${flight_choice || ''}, ${flight_diff || 0},
      ${adultCount}, ${childCount}, ${totalPrice}, ${nationality || ''},
      ${customer_phone}, ${customer_email || ''}, ${payment_method || ''}, ${payment_proof_url || ''}, 'awaiting_review'
    )
    RETURNING *
  `;

  for (let i = 0; i < travelers.length; i++) {
    const t = travelers[i];
    await sql`
      INSERT INTO package_travelers (booking_id, traveler_type, full_name, passport_number, sort_order)
      VALUES (${booking.id}, ${t.traveler_type || 'adult'}, ${t.full_name || ''}, ${t.passport_number || ''}, ${i})
    `;
  }

  let emailResult = { skipped: true };
  try {
    emailResult = await sendPackageBookingNotice({ booking, pkg });
  } catch (err) {
    console.error('Failed to send package booking notice:', err);
    emailResult = { error: err.message };
  }

  return NextResponse.json({
    ok: true,
    booking_id: booking.id,
    total_price: totalPrice,
    email: { sent: !!emailResult.sent, skipped: !!emailResult.skipped, error: emailResult.error ? true : undefined },
  });
}
