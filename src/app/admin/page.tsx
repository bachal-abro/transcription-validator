'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AudioDropzone } from '@/components/audio-dropzone';
import { CSVImporter } from '@/components/csv-importer';
import { ModelManager } from '@/components/model-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  RefreshCw,
  Database,
  HardDrive,
  Settings
} from 'lucide-react';

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage audio files and transcriptions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage Bucket</p>
                  <p className="font-semibold">audio-files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Database</p>
                  <p className="font-semibold">Supabase PostgreSQL</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" key={refreshKey}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Audio Upload
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV Import
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Audio Batch Uploader</CardTitle>
                <CardDescription>
                  Upload .wav and .mp3 audio files to Supabase Storage. 
                  Files will be automatically cataloged in the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AudioDropzone onUploadComplete={handleRefresh} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Smart CSV Importer</CardTitle>
                <CardDescription>
                  Import transcriptions from a CSV file. Select the model and upload 
                  a CSV with audio_name and transcription columns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVImporter onImportComplete={handleRefresh} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>Model Management</CardTitle>
                <CardDescription>
                  Add, edit, or delete AI models. Models are used to categorize transcriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <ol className="space-y-3">
              <li>
                <strong>Manage Models:</strong> Use the Manage Models tab to add, edit, or delete 
                AI models. Default models (Peshawar, Whisper) are created by the schema.
              </li>
              <li>
                <strong>Upload Audio Files:</strong> Use the Audio Upload tab to batch upload 
                your .wav or .mp3 files. They will be stored in Supabase Storage.
              </li>
              <li>
                <strong>Import Transcriptions:</strong> Prepare a CSV file with columns:
                <ul className="mt-2 ml-4">
                  <li><code>audio_name</code> - The filename (must match uploaded files)</li>
                  <li><code>transcription</code> - The transcription text</li>
                  <li><code>BLEU</code> and <code>chrF++</code> - Optional metrics</li>
                </ul>
                Select the model from the dropdown before importing.
              </li>
              <li>
                <strong>Validate:</strong> Return to the home page to see uploaded audio files 
                and start the validation process.
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
