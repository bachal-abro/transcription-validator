'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface AudioDropzoneProps {
  onUploadComplete?: () => void;
}

export function AudioDropzone({ onUploadComplete }: AudioDropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: string[];
    failed: { name: string; error: string }[];
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, { status: 'pending' as const })
    );
    setFiles(prev => [...prev, ...newFiles]);
    setUploadResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/wav': ['.wav'],
      'audio/mpeg': ['.mp3'],
      'audio/mp3': ['.mp3'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data.results);
      
      // Clear successfully uploaded files
      setFiles(prev => 
        prev.filter(f => !data.results.success.includes(f.name))
      );

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: [],
        failed: files.map(f => ({
          name: f.name,
          error: error instanceof Error ? error.message : 'Upload failed',
        })),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'dropzone',
          isDragActive && 'active'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop your audio files here' : 'Drag & drop audio files'}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports .wav and .mp3 files up to 50MB each
        </p>
        <Button variant="outline" className="mt-4">
          Browse Files
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Selected Files ({files.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>
          
          <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
            {files.map(file => (
              <div key={file.name} className="flex items-center gap-3 p-3">
                <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.name)}
                  disabled={isUploading}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={isUploading || files.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading {files.length} files...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="space-y-2">
          {uploadResult.success.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Successfully uploaded {uploadResult.success.length} file(s)
                </p>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {uploadResult.success.map(name => (
                    <li key={name}>• {name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {uploadResult.failed.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Failed to upload {uploadResult.failed.length} file(s)
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {uploadResult.failed.map(({ name, error }) => (
                    <li key={name}>• {name}: {error}</li>
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
