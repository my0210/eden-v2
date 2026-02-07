import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProgressPhoto } from '@/lib/types';

const BUCKET = 'progress-photos';
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

// GET: Fetch all progress photos for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false });

  if (error) {
    console.error('Error fetching progress photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }

  // Generate signed URLs for each photo
  const photos: ProgressPhoto[] = [];
  for (const row of data || []) {
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRY);

    photos.push({
      id: row.id,
      userId: row.user_id,
      storagePath: row.storage_path,
      photoUrl: signedData?.signedUrl || '',
      takenAt: row.taken_at,
      notes: row.notes,
      createdAt: row.created_at,
    });
  }

  return NextResponse.json({ photos });
}

// POST: Upload a new progress photo
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const takenAt = formData.get('takenAt') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Generate storage path
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Insert DB record
    const { data: photoRow, error: dbError } = await supabase
      .from('progress_photos')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        taken_at: takenAt || new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 });
    }

    // Generate signed URL for the response
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    const photo: ProgressPhoto = {
      id: photoRow.id,
      userId: photoRow.user_id,
      storagePath: photoRow.storage_path,
      photoUrl: signedData?.signedUrl || '',
      takenAt: photoRow.taken_at,
      notes: photoRow.notes,
      createdAt: photoRow.created_at,
    };

    return NextResponse.json({ photo });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE: Remove a progress photo
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('id');

  if (!photoId) {
    return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
  }

  // Fetch photo to get storage path
  const { data: photoRow, error: fetchError } = await supabase
    .from('progress_photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !photoRow) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photoRow.storage_path]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    // Continue to delete DB record even if storage fails
  }

  // Delete DB record
  const { error: dbError } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id);

  if (dbError) {
    console.error('DB delete error:', dbError);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
