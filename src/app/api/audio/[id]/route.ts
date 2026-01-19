import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Fetch audio with transcriptions and model info
    const { data: audio, error: audioError } = await supabase
      .from('audios')
      .select('*')
      .eq('id', id)
      .single();

    if (audioError || !audio) {
      return NextResponse.json(
        { error: 'Audio not found' },
        { status: 404 }
      );
    }

    // Fetch transcriptions with model information
    const { data: transcriptions, error: transError } = await supabase
      .from('transcriptions')
      .select(`
        *,
        model:models(*)
      `)
      .eq('audio_id', id);

    if (transError) {
      return NextResponse.json(
        { error: transError.message },
        { status: 500 }
      );
    }

    // Fetch feedback stats for this audio
    const { data: feedbackStats } = await supabase
      .from('feedback')
      .select('preferred_transcription_id')
      .eq('audio_id', id) as { data: { preferred_transcription_id: string | null }[] | null };

    // Calculate vote counts
    const voteCounts: Record<string, number> = {};
    if (feedbackStats) {
      for (const fb of feedbackStats) {
        const prefId = fb.preferred_transcription_id;
        if (prefId) {
          voteCounts[prefId] = (voteCounts[prefId] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      audio,
      transcriptions: transcriptions || [],
      voteCounts,
      totalVotes: feedbackStats?.length || 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Fetch audio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
