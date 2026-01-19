'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AudioPlayer } from '@/components/audio-player';
import { TranscriptionCard } from '@/components/transcription-card';
import { FeedbackForm } from '@/components/feedback-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  AlertCircle,
  Languages,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Audio, Transcription, Model } from '@/types/database';

interface AudioData {
  audio: Audio;
  transcriptions: (Transcription & { model: Model })[];
  voteCounts: Record<string, number>;
  totalVotes: number;
}

export default function ValidatePage() {
  const params = useParams();
  const router = useRouter();
  const audioId = params.id as string;
  
  const [data, setData] = useState<AudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const [allAudios, setAllAudios] = useState<Audio[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch current audio data with cache busting
        const response = await fetch(`/api/audio/${audioId}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load audio');
        }
        const audioData = await response.json();
        setData(audioData);

        // Fetch all audios for navigation
        const audiosResponse = await fetch(`/api/upload?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (audiosResponse.ok) {
          const audiosData = await audiosResponse.json();
          setAllAudios(audiosData.audios || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [audioId]);

  const handleSelectTranscription = (id: string) => {
    setSelectedTranscriptionId(id);
  };

  const handleFeedbackSubmit = async () => {
    // Refresh vote counts after submission
    try {
      const response = await fetch(`/api/audio/${audioId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const audioData = await response.json();
        setData(audioData);
      }
    } catch {
      // Ignore refresh errors
    }
    setSelectedTranscriptionId(null);
  };

  // Navigation helpers
  const currentIndex = allAudios.findIndex(a => a.id === audioId);
  const prevAudio = currentIndex > 0 ? allAudios[currentIndex - 1] : null;
  const nextAudio = currentIndex < allAudios.length - 1 ? allAudios[currentIndex + 1] : null;

  // Sort transcriptions: Peshawar first, then Whisper
  const sortedTranscriptions = data?.transcriptions.sort((a, b) => {
    if (a.model.model_name === 'Peshawar') return -1;
    if (b.model.model_name === 'Peshawar') return 1;
    return 0;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading audio data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Audio</h2>
          <p className="text-muted-foreground mb-4">{error || 'Audio not found'}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { audio, voteCounts, totalVotes } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-32">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-sm sm:text-lg truncate">
                  {audio.audio_name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <Badge variant="outline" className="text-[10px] sm:text-xs border-primary/20 bg-primary/5 h-5">
                    <Languages className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    {audio.language_tag || 'Unknown'}
                  </Badge>
                  {totalVotes > 0 && (
                    <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {totalVotes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevAudio}
                onClick={() => prevAudio && router.push(`/validate/${prevAudio.id}`)}
                className="h-9 w-9 sm:w-auto sm:px-3 rounded-xl border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {currentIndex + 1}/{allAudios.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextAudio}
                onClick={() => nextAudio && router.push(`/validate/${nextAudio.id}`)}
                className="h-9 w-9 sm:w-auto sm:px-3 rounded-xl border-slate-200 dark:border-slate-700"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Instructions */}
        <div className="relative overflow-hidden rounded-2xl mb-4 sm:mb-8 shadow-lg shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
          <div className="relative backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Languages className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  How to Validate
                </h2>
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">1</div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Listen to the audio</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">2</div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Read both versions</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">3</div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Vote for better one</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">4</div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Add notes (optional)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcription Cards */}
        {sortedTranscriptions.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Transcriptions Available</h3>
            <p className="text-muted-foreground">
              This audio file does not have any transcriptions yet.
            </p>
            <Link href="/admin" className="inline-block mt-4">
              <Button variant="outline">
                Import Transcriptions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-6 mb-4 sm:mb-8">
              {sortedTranscriptions.map(transcription => (
                <TranscriptionCard
                  key={transcription.id}
                  transcription={transcription}
                  isSelected={selectedTranscriptionId === transcription.id}
                  onSelect={handleSelectTranscription}
                  voteCount={voteCounts[transcription.id] || 0}
                  totalVotes={totalVotes}
                  showVotes={totalVotes > 0}
                />
              ))}
            </div>

            {/* Feedback Form */}
            <FeedbackForm
              audioId={audioId}
              selectedTranscriptionId={selectedTranscriptionId}
              onSubmit={handleFeedbackSubmit}
            />
          </>
        )}
      </main>

      {/* Sticky Audio Player */}
      <AudioPlayer
        src={audio.storage_url}
        title={audio.audio_name}
        sticky={true}
      />
    </div>
  );
}
