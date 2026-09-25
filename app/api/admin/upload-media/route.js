import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { requireAdmin } from '../../../../lib/session';

// Direct-to-storage uploads for large files (homepage hero videos).
// The browser uploads straight to Vercel Blob, so the usual 4.5 MB request
// limit of server functions doesn't apply. Only logged-in admins get a token.
export async function POST(request) {
  const body = await request.json();
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await requireAdmin(request))) throw new Error('Not authenticated');
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 150 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 400 });
  }
}
