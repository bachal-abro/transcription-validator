import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/client';
import { AudioGallery } from '@/components/audio-gallery';
import { Languages, Headphones } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();
  
  const { data: audios, error } = await supabase
    .from('audios')
    .select('*')
    .order('created_at', { ascending: false });

  // Log for debugging
  if (error) {
    console.error('Error fetching audios:', error);
  }
  console.log('Fetched audios count:', audios?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Languages className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Transcription Validator</h1>
              <p className="text-xs text-muted-foreground">Pakistani Languages</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Headphones className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">
          Help Improve AI Transcriptions
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Listen to audio recordings and compare transcriptions from different AI models.
          Your feedback helps us build better speech recognition for Pakistani languages
          including <span className="font-arabic">پښتو</span> (Pashto) and <span className="font-arabic">اردو</span> (Urdu).
        </p>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        {error ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-destructive font-medium">Error loading audio files</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <p className="text-xs text-muted-foreground">
              Make sure you have run the schema.sql file in Supabase and configured your .env.local file
            </p>
          </div>
        ) : !audios || audios.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No audio files found in the database.</p>
            <p className="text-sm text-muted-foreground">
              Go to the <Link href="/admin" className="text-primary underline">Admin Dashboard</Link> to upload audio files.
            </p>
          </div>
        ) : (
          <AudioGallery audios={audios} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Crowdsourced Transcription Validation System</p>
          <p className="mt-1">Supporting Pakistani Languages Research</p>
        </div>
      </footer>
    </div>
  );
}
