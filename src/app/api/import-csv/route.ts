import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptionInsert } from '@/types/database';

interface CSVRow {
  audio_name?: string;
  audio?: string;
  filename?: string;
  transcription?: string;
  BLEU?: string;
  bleu?: string;
  bleu_score?: string;
  'chrF++'?: string;
  chrf?: string;
  chrf_score?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { rows, modelId } = await request.json() as { rows: CSVRow[]; modelId: string };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid CSV data provided' },
        { status: 400 }
      );
    }

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const results = {
      processed: 0,
      transcriptionsAdded: 0,
      audioNotFound: [] as string[],
      errors: [] as { audioName: string; error: string }[],
    };

    for (const row of rows) {
      // Find audio_name from various possible column names
      const audioName = row.audio_name || row.audio || row.filename;
      const transcriptionText = row.transcription;
      
      if (!audioName || !transcriptionText) {
        continue;
      }

      // Find the audio record in database
      const { data: audioData, error: audioError } = await supabase
        .from('audios')
        .select('id')
        .eq('audio_name', audioName)
        .single();

      if (audioError || !audioData) {
        results.audioNotFound.push(audioName);
        continue;
      }

      const audio = audioData as { id: string };
      results.processed++;

      // Extract BLEU and chrF++ scores if present
      const bleuScore = parseFloat(row.BLEU || row.bleu || row.bleu_score || '0') || null;
      const chrfScore = parseFloat(row['chrF++'] || row.chrf || row.chrf_score || '0') || null;

      // Create transcription
      const transcriptionData: TranscriptionInsert = {
        audio_id: audio.id,
        model_id: modelId,
        text: transcriptionText.trim(),
        bleu_score: bleuScore,
        chrf_score: chrfScore,
        word_count: transcriptionText.trim().split(/\s+/).length,
      };
      
      const { error: insertError } = await supabase
        .from('transcriptions')
        .upsert(transcriptionData as never, {
          onConflict: 'audio_id,model_id',
        });

      if (insertError) {
        results.errors.push({
          audioName,
          error: insertError.message,
        });
      } else {
        results.transcriptionsAdded++;
      }
    }

    return NextResponse.json({
      message: 'CSV import completed',
      results,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
