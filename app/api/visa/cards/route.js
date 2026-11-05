import { NextResponse } from 'next/server';
import { listVisaCards } from '../../../../lib/publicData';

export async function GET() {
  return NextResponse.json(await listVisaCards());
}
