# CSV Importer Updates - Model Selection at Upload Time

## Overview
The CSV importer has been updated to support selecting which AI model the transcriptions belong to at upload time. This allows you to have separate CSV files for different models (e.g., one for Peshawar, one for Whisper, etc.) instead of requiring both transcriptions in a single file.

## Changes Made

### 1. New API Endpoint: `/api/models`
- **File**: `src/app/api/models/route.ts`
- **Purpose**: Returns list of available models from the database
- **Response**: Array of models with `id`, `model_name`, and `description`

### 2. Updated CSV Import API: `/api/import-csv`
- **File**: `src/app/api/import-csv/route.ts`
- **Changes**:
  - Now accepts `modelId` parameter in request body
  - Simplified to handle single model instead of dual models
  - Expects CSV with `audio_name` and `transcription` columns (not `transcription_pesh`)
  - Still supports optional BLEU and chrF++ score columns

### 3. Enhanced CSV Importer Component
- **File**: `src/components/csv-importer.tsx`
- **New Features**:
  - Model selection dropdown appears after CSV is validated
  - Fetches available models from `/api/models` endpoint
  - Shows loading state while fetching models
  - Import button is disabled until a model is selected
  - Updated validation to check for simple format (audio_name + transcription)

## CSV Format

### Required Columns
- `audio_name` (or `audio` or `filename`) - The name of the audio file
- `transcription` - The transcription text

### Optional Columns
- `BLEU` or `bleu` or `bleu_score` - BLEU score for the transcription
- `chrF++` or `chrf` or `chrf_score` - chrF++ score for the transcription

### Example CSV
```csv
audio_name,transcription,BLEU,chrF++
audio_001.wav,ستاسو نوم څه دی؟,0.85,0.90
audio_002.wav,زه خوشحاله یم،0.92,0.88
```

## Workflow

1. **Upload Audio Files**: First, upload your audio files through the Admin Dashboard → Upload tab
2. **Prepare CSV**: Create a CSV file with audio_name and transcription columns
3. **Import CSV**: 
   - Go to Admin Dashboard → Import CSV tab
   - Drag & drop or select your CSV file
   - Review the detected columns and preview
   - Select the AI model from the dropdown
   - Click "Import X Transcriptions"

## Database Requirements

Before using the application, you must:

1. **Run the schema**: Execute `supabase/schema.sql` in your Supabase SQL Editor
2. **Create storage bucket**: Create a bucket named `audio-files` in Supabase Storage
3. **Configure environment**: Set up `.env.local` with your Supabase credentials

The schema creates default models (Peshawar and Whisper), but you can add more models by inserting into the `models` table:

```sql
INSERT INTO models (model_name, description)
VALUES ('Your Model Name', 'Description of the model');
```

## Benefits

- ✅ Simpler CSV format - just 2 required columns
- ✅ Flexibility to upload transcriptions for any model
- ✅ Support for multiple models without restructuring CSV files
- ✅ Easy to add new models to the system
- ✅ Clear validation and error messages
- ✅ Preview data before importing
