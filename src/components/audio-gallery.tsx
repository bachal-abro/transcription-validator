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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Audio Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
            <p className="text-sm text-muted-foreground">Validated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by filename or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <Filter className="h-4 w-4 mr-1" />
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
          <Button
            variant={filter === 'validated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('validated')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Validated
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
            <Card key={audio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {/* Play Icon */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Play className="h-5 w-5 text-primary ml-0.5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{audio.audio_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Languages className="h-3.5 w-3.5" />
                        {getLanguageLabel(audio.language_tag)}
                      </span>
                      <span>{formatDate(audio.created_at)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={audio.is_validated ? 'default' : 'secondary'}
                    className="flex-shrink-0"
                  >
                    {audio.is_validated ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Validated
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>

                  {/* Action Button */}
                  <Link href={`/validate/${audio.id}`}>
                    <Button>
                      Start Validation
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
