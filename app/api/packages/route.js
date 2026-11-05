import { NextResponse } from 'next/server';
import { listPublicPackages } from '../../../lib/publicData';

export async function GET() {
  return NextResponse.json(await listPublicPackages());
}
