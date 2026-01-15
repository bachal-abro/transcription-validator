import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import type { AudioInsert } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const results: { success: string[]; failed: { name: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const file of files) {
      // Validate file type
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
      if (!validTypes.includes(file.type)) {
        results.failed.push({
          name: file.name,
          error: `Invalid file type: ${file.type}. Only .wav and .mp3 are allowed.`,
        });
        continue;
      }

      // Generate unique storage path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `uploads/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        results.failed.push({
          name: file.name,
          error: uploadError.message,
        });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(storagePath);

      // Prepare audio data
      const audioData: AudioInsert = {
        audio_name: file.name,
        storage_url: urlData.publicUrl,
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        language_tag: 'pashto', // Default language
      };

      // Insert audio record into database
      const { error: dbError } = await supabase
        .from('audios')
        .insert(audioData as never);

      if (dbError) {
        // Rollback storage upload on DB error
        await supabase.storage.from('audio-files').remove([storagePath]);
        results.failed.push({
          name: file.name,
          error: dbError.message,
        });
        continue;
      }

      results.success.push(file.name);
    }

    return NextResponse.json({
      message: `Uploaded ${results.success.length} of ${files.length} files`,
      results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ audios: data });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
