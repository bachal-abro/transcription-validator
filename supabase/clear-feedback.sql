-- =====================================================
-- DELETE ALL FEEDBACK AND VOTES
-- Run this in Supabase SQL Editor
-- WARNING: This will permanently delete all feedback data
-- =====================================================

-- Delete all feedback records (includes votes and comments)
DELETE FROM feedback;

-- Optional: Reset is_validated status on all audios
UPDATE audios SET is_validated = FALSE;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM feedback) as remaining_feedback,
    (SELECT COUNT(*) FROM audios WHERE is_validated = TRUE) as validated_audios;

-- Expected result: remaining_feedback = 0, validated_audios = 0
