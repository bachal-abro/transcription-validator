import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: models, error } = await supabase
      .from('models')
      .select('id, model_name, description')
      .order('model_name');

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }

    return NextResponse.json(models || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new model
export async function POST(request: NextRequest) {
  try {
    const { model_name, description } = await request.json();

    if (!model_name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('models')
      .insert({ model_name, description } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
