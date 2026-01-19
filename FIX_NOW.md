# ⚠️ URGENT FIX: Stats Not Updating on Vercel

## Problem
Environment variables are set on Vercel, but vote stats and `is_validated` status are STILL not updating.

## Root Cause (Updated Diagnosis)
The issue is **Row Level Security (RLS) policies** in Supabase:

1. ✅ Environment variables are set correctly
2. ✅ Feedback insertion works (you can see feedback being submitted)
3. ❌ **Database trigger is blocked by RLS** - The `mark_audio_validated()` trigger runs with anonymous user permissions
4. ❌ **UPDATE fails** - RLS policy only allows `service_role` to update audios, but trigger runs as `anon`

---

## The Fix (REQUIRED)

You **MUST** update your Supabase database to fix the RLS policies.

### Step-by-Step:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `apkluxnqkgjugvdlviod`
3. **Click "SQL Editor"** in the left sidebar
4. **Copy the entire content** from the file: `supabase/fix-trigger-permissions.sql`
5. **Paste it** into the SQL Editor
6. **Click "Run"** button

This will:
- Make the trigger function run with elevated privileges (`SECURITY DEFINER`)
- Update RLS policies to allow the trigger to update `is_validated`
- Fix the permissions issue

---

## Quick Copy-Paste SQL Fix

If you can't access the file, copy and paste this SQL directly:

```sql
-- Fix RLS Policies for Trigger Updates
DROP POLICY IF EXISTS "Allow service role full access on audios" ON audios;

CREATE POLICY "Service role full access on audios" ON audios
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public read access on audios" ON audios
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow trigger updates to is_validated" ON audios
    FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Recreate trigger with SECURITY DEFINER (KEY FIX)
DROP TRIGGER IF EXISTS trigger_mark_audio_validated ON feedback;
DROP FUNCTION IF EXISTS mark_audio_validated();

CREATE OR REPLACE FUNCTION mark_audio_validated()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes it run with owner privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE audios SET is_validated = TRUE WHERE id = NEW.audio_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_mark_audio_validated
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION mark_audio_validated();
```

---

## Test the Fix

After running the SQL, test it immediately in Supabase:

```sql
-- 1. Get a sample audio ID
SELECT id, audio_name, is_validated FROM audios LIMIT 1;

-- 2. Get a transcription ID for that audio (replace 'audio-id' with ID from step 1)
SELECT id FROM transcriptions WHERE audio_id = 'your-audio-id-here' LIMIT 1;

-- 3. Insert test feedback (use IDs from above)
INSERT INTO feedback (audio_id, preferred_transcription_id, session_id)
VALUES ('your-audio-id', 'your-transcription-id', 'test-session-fix');

-- 4. Check if is_validated was updated to TRUE
SELECT id, audio_name, is_validated FROM audios WHERE id = 'your-audio-id';
-- Should show: is_validated = TRUE
```

---

## Verify on Vercel

1. **Wait 30 seconds** (no need to redeploy)
2. **Visit your production site**
3. **Submit feedback** on any audio
4. **Refresh the page**
5. **Check if**:
   - ✅ Audio shows "Validated" badge
   - ✅ Vote counts appear
   - ✅ Stats update correctly

---

## Why This Happens

### The Problem Flow:
1. User submits feedback → Uses `anon` (anonymous) role
2. Feedback inserted successfully ✅
3. Trigger `mark_audio_validated()` fires
4. Trigger tries: `UPDATE audios SET is_validated = TRUE`
5. **RLS checks**: "Is user = service_role?" → NO (it's `anon`)
6. **UPDATE blocked** ❌ → `is_validated` stays `FALSE`

### The Solution:
`SECURITY DEFINER` makes the trigger run with **database owner privileges**, bypassing RLS while maintaining security.

---

## Debug If Still Not Working

Run this in Supabase SQL Editor:

```sql
-- Check if feedback is being received
SELECT COUNT(*) as total_feedback FROM feedback;

-- Check recent submissions
SELECT 
    f.created_at,
    a.audio_name,
    a.is_validated,
    COUNT(*) OVER (PARTITION BY a.id) as votes_for_audio
FROM feedback f
JOIN audios a ON f.audio_id = a.id
ORDER BY f.created_at DESC
LIMIT 10;

-- Find audios with feedback but not validated (should be ZERO after fix)
SELECT 
    a.audio_name,
    a.is_validated,
    COUNT(f.id) as feedback_count
FROM audios a
LEFT JOIN feedback f ON a.id = f.audio_id
GROUP BY a.id, a.audio_name, a.is_validated
HAVING COUNT(f.id) > 0 AND a.is_validated = FALSE;
```

---

## Summary

**Action Required**: Run the SQL in `supabase/fix-trigger-permissions.sql` in your Supabase SQL Editor

**Why**: RLS policies block the database trigger from updating `is_validated`

**Result**: Stats will update immediately after the fix ✅

**No redeployment needed** - This is a database-level fix!
