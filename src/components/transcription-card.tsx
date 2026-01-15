'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ThumbsUp, BarChart3, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transcription, Model } from '@/types/database';

interface TranscriptionCardProps {
  transcription: Transcription & { model: Model };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  voteCount?: number;
  totalVotes?: number;
  showVotes?: boolean;
  disabled?: boolean;
}

export function TranscriptionCard({
  transcription,
  isSelected = false,
  onSelect,
  voteCount = 0,
  totalVotes = 0,
  showVotes = true,
  disabled = false,
}: TranscriptionCardProps) {
  const votePercentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  // Use actual model name from database
  const modelLabel = transcription.model.model_name;
  const isWinning = voteCount > 0 && totalVotes > 0 && votePercentage >= 50;

  return (
    <Card 
      className={cn(
        'transcription-card group relative h-full flex flex-col transition-all duration-300 overflow-hidden rounded-2xl',
        'border-2 shadow-lg hover:shadow-xl',
        isSelected 
          ? 'border-primary shadow-primary/20 ring-4 ring-primary/10 scale-[1.02]' 
          : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:scale-[1.01]',
        isWinning && 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20'
      )}
    >
      {/* Decorative gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"
      )} />
      
      {/* Winning indicator */}
      {isWinning && showVotes && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-lg">
            <CheckCircle className="h-3 w-3" />
            Leading
          </div>
        </div>
      )}

      <CardHeader className="pb-4 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={isSelected ? "default" : "secondary"} 
              className={cn(
                "text-sm px-3 py-1.5 rounded-xl font-semibold shadow-sm transition-all",
                isSelected && "shadow-md shadow-primary/25"
              )}
            >
              {modelLabel}
            </Badge>
            {isSelected && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary rounded-lg">
                <Check className="h-3 w-3 mr-1" />
                Your Choice
              </Badge>
            )}
          </div>
          {transcription.word_count && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {transcription.word_count} words
            </span>
          )}
        </div>
        
        {/* Metrics */}
        {(transcription.bleu_score || transcription.chrf_score) && (
          <div className="flex gap-3">
            {transcription.bleu_score && (
              <div className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <BarChart3 className="h-3 w-3" />
                <span className="font-medium">BLEU: {transcription.bleu_score.toFixed(2)}</span>
              </div>
            )}
            {transcription.chrf_score && (
              <div className="flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <span className="font-medium">chrF++: {transcription.chrf_score.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col relative z-10">
        {/* RTL Transcription Text */}
        <div 
          dir="rtl" 
          lang="ps"
          className={cn(
            "rtl-text-container flex-1 text-rtl-lg leading-rtl-loose mb-4 overflow-auto max-h-[320px]",
            "p-5 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-white/50 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/50",
            "border-2 border-slate-200/60 dark:border-slate-700/60",
            "shadow-inner",
            isSelected && "border-primary/30 bg-primary/5"
          )}
        >
          {transcription.text}
        </div>

        {/* Vote Stats */}
        {showVotes && totalVotes > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5" />
                {voteCount} vote{voteCount !== 1 ? 's' : ''}
              </span>
              <span className={cn(
                "font-bold text-lg",
                votePercentage >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
              )}>
                {votePercentage}%
              </span>
            </div>
            <div className="relative h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden shadow-inner">
              <div 
                className={cn(
                  "h-full transition-all duration-700 ease-out rounded-full",
                  votePercentage >= 50 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50" 
                    : "bg-gradient-to-r from-primary to-blue-500"
                )}
                style={{ width: `${votePercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Vote Button */}
        {onSelect && (
          <Button
            onClick={() => onSelect(transcription.id)}
            variant={isSelected ? 'default' : 'outline'}
            disabled={disabled}
            className={cn(
              "w-full transition-all duration-300 rounded-xl h-12 font-semibold text-base",
              "relative overflow-hidden group/btn",
              isSelected 
                ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 border-0" 
                : "border-2 border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5 hover:shadow-md"
            )}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSelected ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Selected as Better</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                  <span>Vote for this Version</span>
                </>
              )}
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
