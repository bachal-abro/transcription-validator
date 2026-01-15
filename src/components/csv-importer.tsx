'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, Upload, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CSVRow {
  audio_name?: string;
  audio?: string;
  filename?: string;
  transcription_pesh?: string;
  transcription?: string;
  BLEU?: string;
  bleu?: string;
  bleu_score?: string;
  'chrF++'?: string;
  chrf?: string;
  chrf_score?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  processed: number;
  transcriptionsAdded: number;
  audioNotFound: string[];
  errors: { audioName: string; error: string }[];
}

interface Model {
  id: string;
  model_name: string;
  description: string | null;
}

interface CSVImporterProps {
  onImportComplete?: () => void;
}

export function CSVImporter({ onImportComplete }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);  const [modelError, setModelError] = useState<string | null>(null);
  // Fetch available models on component mount
  useEffect(() => {
    async function fetchModels() {
      setLoadingModels(true);
      setModelError(null);
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          // API returns array directly, not wrapped in an object
          const modelsArray = Array.isArray(data) ? data : [];
          setModels(modelsArray);
          // Auto-select first model if available
          if (modelsArray.length > 0) {
            setSelectedModel(modelsArray[0].id);
          } else {
            setModelError('No models found. Please run schema.sql first.');
          }
        } else {
          const errorData = await response.json();
          setModelError(errorData.error || 'Failed to load models');
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setModelError('Failed to connect to server');
      } finally {
        setLoadingModels(false);
      }
    }
    fetchModels();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setParseError(null);
    setImportResult(null);

    Papa.parse<CSVRow>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          return;
        }
        
        setParsedData(results.data);
        setColumns(results.meta.fields || []);
      },
      error: (error) => {
        setParseError(error.message);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleClear = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setImportResult(null);
    setParseError(null);
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || !selectedModel) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rows: parsedData,
          modelId: selectedModel 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data.results);
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setImportResult({
        processed: 0,
        transcriptionsAdded: 0,
        audioNotFound: [],
        errors: [{ audioName: 'Import', error: error instanceof Error ? error.message : 'Import failed' }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Check if required columns exist
  const hasAudioColumn = columns.some(c => 
    ['audio_name', 'audio', 'filename'].includes(c.toLowerCase())
  );
  const hasTranscriptionColumn = columns.some(c => 
    c.toLowerCase() === 'transcription'
  );

  return (
    <div className="space-y-4">
      {!file ? (
        // Dropzone
        <div
          {...getRootProps()}
          className={cn(
            'dropzone',
            isDragActive && 'active'
          )}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file'}
          </p>
          <p className="text-sm text-muted-foreground">
            Must contain: audio_name, transcription columns
          </p>
          <Button variant="outline" className="mt-4">
            Browse Files
          </Button>
        </div>
      ) : (
        // File Preview
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {parsedData.length} rows • {columns.length} columns
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={isImporting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Parse Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{parseError}</p>
              </div>
            </div>
          )}

          {/* Column Detection */}
          {!parseError && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Detected Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {columns.map(col => (
                  <span
                    key={col}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      ['audio_name', 'audio', 'filename'].includes(col.toLowerCase())
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        : col.toLowerCase() === 'transcription'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : ['bleu', 'chrf++', 'chrf'].includes(col.toLowerCase())
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {col}
                  </span>
                ))}
              </div>

              {/* Validation Messages */}
              <div className="space-y-1 text-sm">
                <div className={cn('flex items-center gap-2', hasAudioColumn ? 'text-green-600' : 'text-red-600')}>
                  {hasAudioColumn ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{hasAudioColumn ? 'Audio filename column detected' : 'Missing audio_name column'}</span>
                </div>
                <div className={cn('flex items-center gap-2', hasTranscriptionColumn ? 'text-green-600' : 'text-red-600')}>
                  {hasTranscriptionColumn ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{hasTranscriptionColumn ? 'Transcription column detected' : 'Missing transcription column'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && !parseError && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <p className="text-sm font-medium">Data Preview (first 5 rows)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {columns.slice(0, 5).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium truncate max-w-[150px]">
                          {col}
                        </th>
                      ))}
                      {columns.length > 5 && (
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          +{columns.length - 5} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {columns.slice(0, 5).map(col => (
                          <td key={col} className="px-3 py-2 truncate max-w-[150px]" title={row[col]}>
                            {row[col] || '-'}
                          </td>
                        ))}
                        {columns.length > 5 && <td className="px-3 py-2 text-muted-foreground">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {!parseError && hasAudioColumn && hasTranscriptionColumn && (
            <div className="p-4 border rounded-lg space-y-3">
              <label className="text-sm font-medium">Select Model</label>
              {loadingModels ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading models...
                </div>
              ) : modelError ? (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Error Loading Models</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{modelError}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Make sure you have run the schema.sql file in Supabase and configured .env.local
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    value={selectedModel || ''}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    disabled={isImporting}
                  >
                    <option value="">-- Select a model --</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.model_name}
                      </option>
                    ))}
                  </select>
                  {!selectedModel && models.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Choose which AI model generated these transcriptions
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Import Button */}
          {!parseError && (
            <Button
              onClick={handleImport}
              disabled={isImporting || !hasAudioColumn || !hasTranscriptionColumn || !selectedModel}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing {parsedData.length} rows...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {parsedData.length} Transcriptions
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="space-y-2">
          {importResult.transcriptionsAdded > 0 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Import Successful
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Added {importResult.transcriptionsAdded} transcriptions for {importResult.processed} audio files
                </p>
              </div>
            </div>
          )}

          {importResult.audioNotFound.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {importResult.audioNotFound.length} Audio Files Not Found
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Upload these audio files first:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 max-h-20 overflow-auto">
                  {importResult.audioNotFound.slice(0, 10).map(name => (
                    <li key={name}>• {name}</li>
                  ))}
                  {importResult.audioNotFound.length > 10 && (
                    <li>...and {importResult.audioNotFound.length - 10} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {importResult.errors.length} Error(s)
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err.audioName}: {err.error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
