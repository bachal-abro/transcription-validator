-- =====================================================
-- DEBUG: Test Feedback and Trigger Functionality
-- Run these queries in Supabase SQL Editor to diagnose
-- =====================================================

-- 1. Check if feedback table has any data
SELECT COUNT(*) as total_feedback FROM feedback;

-- 2. Check recent feedback submissions
SELECT 
    f.id,
    f.audio_id,
    f.preferred_transcription_id,
    f.created_at,
    a.audio_name,
    a.is_validated
FROM feedback f
JOIN audios a ON f.audio_id = a.id
ORDER BY f.created_at DESC
LIMIT 10;

-- 3. Check which audios should be validated but aren't
SELECT 
    a.id,
    a.audio_name,
    a.is_validated,
    COUNT(f.id) as feedback_count
FROM audios a
LEFT JOIN feedback f ON a.id = f.audio_id
GROUP BY a.id, a.audio_name, a.is_validated
HAVING COUNT(f.id) > 0 AND a.is_validated = FALSE;

-- 4. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_mark_audio_validated';

-- 5. Check current RLS policies on audios table
SELECT 
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'audios';

-- 6. Test the trigger manually (replace with actual IDs)
-- First, get a sample audio and transcription ID
SELECT 
    a.id as audio_id,
    t.id as transcription_id
FROM audios a
JOIN transcriptions t ON a.id = t.audio_id
LIMIT 1;

-- Then insert test feedback (use IDs from above)
-- INSERT INTO feedback (audio_id, preferred_transcription_id, session_id)
-- VALUES ('your-audio-id', 'your-transcription-id', 'test-session-debug');

-- Check if is_validated was updated
-- SELECT id, audio_name, is_validated FROM audios WHERE id = 'your-audio-id';
