# Troubleshooting: Data Not Showing on Website

## What You've Done ✅
- Created models in the database
- Imported transcriptions via CSV

## The Problem 🔍
The website shows "No audio files found" because **audio files must be uploaded separately from transcriptions**.

## Solution: Upload Audio Files First

### Step-by-Step Process:

1. **Upload Audio Files** (Must be done FIRST)
   - Go to Admin Dashboard → "Audio Upload" tab
   - Drag & drop or select your `.wav` or `.mp3` files
   - Wait for upload to complete
   - This creates entries in the `audios` table

2. **Import Transcriptions** (Done AFTER audio upload)
   - Go to Admin Dashboard → "CSV Import" tab
   - Your CSV should have these columns:
     - `audio_name` - Must match the EXACT filename you uploaded
     - `transcription` - The transcription text
   - Select the model from dropdown
   - Import the CSV

### Why This Matters:
- The CSV importer matches transcriptions to audio files by `audio_name`
- If the audio file doesn't exist in the database, the transcription import fails silently
- Check the import results to see "Audio Files Not Found" section

## Debug Your Current State

Visit: **http://localhost:3000/debug**

This page shows:
- ✅ Number of audio files in database
- ✅ Number of models in database
- ✅ Number of transcriptions in database
- ✅ Environment variables status
- ✅ Any error messages

## Common Issues:

### Issue 1: CSV Import Says "Audio Not Found"
**Cause:** Audio files weren't uploaded first
**Solution:** Upload audio files via Admin → Audio Upload tab

### Issue 2: Audio Upload Fails
**Possible causes:**
- Storage bucket `audio-files` doesn't exist in Supabase
- Wrong file format (only .wav and .mp3 supported)
- Supabase credentials incorrect

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Create bucket named `audio-files`
3. Make it public or configure RLS policies

### Issue 3: Nothing Shows After Uploading
**Check:**
1. Visit `/debug` page to see actual database contents
2. Check browser console for errors (F12)
3. Verify environment variables in `.env.local`

## Expected Workflow:

```
1. Run schema.sql in Supabase ✅ (You did this - models exist)
2. Create storage bucket in Supabase
3. Upload audio files (.wav/.mp3)
4. Import transcriptions CSV
5. View data on home page
```

## Quick Test:

1. Go to Admin Dashboard
2. Click "Audio Upload" tab
3. Upload ONE audio file (e.g., `test.wav`)
4. Go back to home page - you should see it listed!
5. Then you can import transcriptions for that file

## Need More Help?

If after uploading audio files you still don't see data:
1. Check `/debug` page for detailed database info
2. Check browser console (F12) for JavaScript errors
3. Verify your `.env.local` has correct Supabase credentials
