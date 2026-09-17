import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  // Auth check — only admins and managers can upload
  const user = await getSession();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }

  // Max 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 5 MB.' }, { status: 400 });
  }

  try {
    // Sanitize filename and prefix with books/
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = `books/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(safeName, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error('Blob upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed. Ensure BLOB_READ_WRITE_TOKEN is set in your Vercel environment.' },
      { status: 500 }
    );
  }
}
