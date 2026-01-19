-- =====================================================
-- FIX: Update RLS Policies to Allow Trigger Updates
-- Run this in Supabase SQL Editor
-- =====================================================

-- The issue: Database triggers run with the permissions of the user who triggered them.
-- When public users insert feedback, the trigger tries to update audios but fails due to RLS.

-- Solution: Update the RLS policy to allow updates from database functions

-- Step 1: Drop the existing restrictive UPDATE policy for audios
DROP POLICY IF EXISTS "Allow service role full access on audios" ON audios;

-- Step 2: Create separate policies for different operations

-- Allow service role complete access (for admin operations)
CREATE POLICY "Service role full access on audios" ON audios
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow public read access
CREATE POLICY "Public read access on audios" ON audios
    FOR SELECT 
    TO public
    USING (true);

-- CRITICAL: Allow updates to is_validated from triggers
-- This allows the mark_audio_validated() trigger to work
CREATE POLICY "Allow trigger updates to is_validated" ON audios
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Step 3: Also ensure the trigger function has the right security context
-- Recreate the trigger function with SECURITY DEFINER
DROP TRIGGER IF EXISTS trigger_mark_audio_validated ON feedback;
DROP FUNCTION IF EXISTS mark_audio_validated();

CREATE OR REPLACE FUNCTION mark_audio_validated()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes the function run with the privileges of the owner
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE audios SET is_validated = TRUE WHERE id = NEW.audio_id;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_mark_audio_validated
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION mark_audio_validated();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON feedback TO anon, authenticated;
GRANT SELECT ON audios TO anon, authenticated;

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audios'
ORDER BY policyname;
