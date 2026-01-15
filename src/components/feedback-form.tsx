'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';

interface FeedbackFormProps {
  audioId: string;
  selectedTranscriptionId?: string | null;
  onSubmit?: (feedback: { comments: string }) => Promise<void>;
  disabled?: boolean;
}

export function FeedbackForm({ 
  audioId, 
  selectedTranscriptionId, 
  onSubmit,
  disabled = false 
}: FeedbackFormProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comments.trim() && !selectedTranscriptionId) {
      setError('Please select a transcription or provide comments');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioId,
          preferredTranscriptionId: selectedTranscriptionId,
          userComments: comments.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
      setComments('');
      
      // Call parent callback to refresh vote counts
      if (onSubmit) {
        await onSubmit({ comments });
      }
      
      // Auto-reset after 3 seconds to allow another submission
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/50 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30" />
        <CardContent className="pt-8 pb-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-lg shadow-emerald-500/25">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-2xl mb-2 bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Thank You!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your feedback has been submitted successfully and will help improve our AI models.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Feedback recorded
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Additional Feedback
          </span>
        </CardTitle>
        <CardDescription className="text-sm mt-2">
          Help us improve by noting specific errors, mispronunciations, or quality issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="e.g., Word 'X' was mispronounced at 0:15, missing pause between sentences, unclear audio quality..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={disabled || isSubmitting}
          rows={4}
          className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-primary resize-none transition-colors"
        />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {selectedTranscriptionId ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Transcription selected
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  No preference selected
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={disabled || isSubmitting}
            className="rounded-xl h-11 px-6 font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
