'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Play, CheckCircle, Clock, Languages, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Audio } from '@/types/database';

interface AudioGalleryProps {
  audios: Audio[];
}

export function AudioGallery({ audios }: AudioGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'validated' | 'pending'>('all');

  const filteredAudios = useMemo(() => {
    return audios.filter(audio => {
      // Search filter
      const matchesSearch = 
        audio.audio_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (audio.language_tag?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'validated' && audio.is_validated) ||
        (filter === 'pending' && !audio.is_validated);

      return matchesSearch && matchesFilter;
    });
  }, [audios, searchQuery, filter]);

  const stats = useMemo(() => {
    const validated = audios.filter(a => a.is_validated).length;
    return {
      total: audios.length,
      validated,
      pending: audios.length - validated,
    };
  }, [audios]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLanguageLabel = (tag: string | null) => {
    const labels: Record<string, string> = {
      pashto: 'Pashto',
      urdu: 'Urdu',
      punjabi: 'Punjabi',
      sindhi: 'Sindhi',
      balochi: 'Balochi',
    };
    return labels[tag || ''] || tag || 'Unknown';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-2 sm:px-4">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-2 sm:px-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.validated}</div>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Validated</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-2 sm:px-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search audio files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1 h-10 rounded-xl"
          >
            <Filter className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">All</span>
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="flex-1 h-10 rounded-xl"
          >
            <Clock className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Pending</span>
          </Button>
          <Button
            variant={filter === 'validated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('validated')}
            className="flex-1 h-10 rounded-xl"
          >
            <CheckCircle className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Validated</span>
          </Button>
        </div>
      </div>

      {/* Audio List */}
      {filteredAudios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || filter !== 'all'
                ? 'No audio files match your filters'
                : 'No audio files uploaded yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAudios.map(audio => (
            <Link key={audio.id} href={`/validate/${audio.id}`}>
              <Card className="hover:shadow-lg transition-all active:scale-[0.99] border-none shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Play Icon */}
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary ml-0.5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate mb-1.5">{audio.audio_name}</h3>
                      <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Badge variant={audio.is_validated ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5">
                          {audio.is_validated ? (
                            <>
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              Validated
                            </>
                          ) : (
                            <>
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Languages className="h-3 w-3" />
                          {getLanguageLabel(audio.language_tag)}
                        </span>
                        <span className="hidden sm:inline">{formatDate(audio.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button size="sm" className="rounded-xl h-9 px-4 shrink-0 hidden sm:flex">
                      Start
                    </Button>
                    <Button size="icon" className="rounded-xl h-9 w-9 shrink-0 sm:hidden">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredAudios.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredAudios.length} of {audios.length} audio files
        </p>
      )}
    </div>
  );
}
