import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { FeedbackInsert } from '@/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioId, preferredTranscriptionId, userComments } = body;

    if (!audioId) {
      return NextResponse.json(
        { error: 'Audio ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const headersList = await headers();

    // Generate a session ID for anonymous users
    const sessionId = request.cookies.get('session_id')?.value || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare feedback data
    const feedbackData: FeedbackInsert = {
      audio_id: audioId,
      preferred_transcription_id: preferredTranscriptionId || null,
      user_comments: userComments || null,
      session_id: sessionId,
      user_agent: headersList.get('user-agent') || null,
    };

    // Insert feedback
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Create response with session cookie
    const response = NextResponse.json({
      message: 'Feedback submitted successfully',
      feedback: data,
    });

    // Set session cookie if not present
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const audioId = searchParams.get('audioId');

    let query = supabase.from('feedback').select('*');
    
    if (audioId) {
      query = query.eq('audio_id', audioId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
