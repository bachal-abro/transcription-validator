# Fix: Updates Not Working on Vercel

## Problem
Vote stats, `is_validated` status, and other database updates work on localhost but not on Vercel.

## Root Cause
The issue occurs because:

1. **Environment variables are not deployed** - `.env.local` is in `.gitignore`
2. **Missing Service Role Key** - The database trigger needs elevated permissions to update the `audios` table
3. **Row Level Security (RLS)** - Supabase RLS policies block updates without proper authentication

## Solution Options

### Option 1: Add Environment Variables to Vercel (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Select your project
   - Navigate to **Settings** → **Environment Variables**

2. **Add these variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://apkluxnqkgjugvdlviod.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwa2x1eG5xa2dqdWd2ZGx2aW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzQ3MDMsImV4cCI6MjA4NDA1MDcwM30.09RF_k393VrWnNaZmrGjCLOUBBHW54FsYvNzZw6leng
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwa2x1eG5xa2dqdWd2ZGx2aW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ3NDcwMywiZXhwIjoyMDg0MDUwNzAzfQ.NNQacp0-VTpnmLH8fbmDxKI_0CjfgcJEFIariWXUQwA
   ```

3. **Set for all environments**: Check "Production", "Preview", and "Development"

4. **Redeploy**:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Option 2: Update RLS Policy (More Secure)

If you prefer not to use the service role key on the client, update your Supabase RLS policy:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor
3. **Run the SQL** from `supabase/fix-rls-policy.sql`

This allows database triggers to work without needing the service role key.

## How to Verify the Fix

1. **Deploy to Vercel** (or redeploy)
2. **Visit your production site**
3. **Submit feedback** on any audio
4. **Check the audio gallery** - the audio should now show as "Validated"
5. **Vote counts should update** in real-time

## Technical Details

### The Database Trigger
Located in `supabase/schema.sql` (lines 145-153):

```sql
CREATE OR REPLACE FUNCTION mark_audio_validated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE audios SET is_validated = TRUE WHERE id = NEW.audio_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mark_audio_validated
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION mark_audio_validated();
```

This trigger automatically sets `is_validated = TRUE` when feedback is submitted.

### The RLS Policy
The current policy (line 179-180) requires service role:

```sql
CREATE POLICY "Allow service role full access on audios" ON audios
    FOR ALL USING (auth.role() = 'service_role');
```

Without the service role key, the trigger can't update the `audios` table.

## Quick Check

To verify your environment variables are set on Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see all three variables listed
3. Each should be available for Production, Preview, and Development

## Still Not Working?

If updates still don't work after adding environment variables:

1. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for errors during feedback submission

2. **Check browser console**:
   - Open DevTools (F12)
   - Look for API errors when submitting feedback

3. **Verify RLS policies**:
   - Go to Supabase Dashboard → Authentication → Policies
   - Ensure policies allow public feedback insertion

4. **Test the trigger manually** in Supabase SQL Editor:
   ```sql
   -- Insert test feedback
   INSERT INTO feedback (audio_id, preferred_transcription_id, session_id)
   VALUES (
     'your-audio-id-here',
     'your-transcription-id-here', 
     'test-session'
   );
   
   -- Check if is_validated was updated
   SELECT id, audio_name, is_validated 
   FROM audios 
   WHERE id = 'your-audio-id-here';
   ```

## Summary

The issue is that `.env.local` files are not deployed to production. You **must** add your Supabase credentials to Vercel's environment variables for the app to work in production.
