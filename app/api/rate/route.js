import { NextResponse } from 'next/server';
import { getExchangeRate } from '../../../lib/settings';

// Public: the USD→IQD rate used for the website's currency switch.
export const revalidate = 60;
export async function GET() {
  return NextResponse.json({ usd_iqd_rate: await getExchangeRate() });
}
