-- =====================================================
-- QUICK TEST: Check if the RLS fix has been applied
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if the trigger function has SECURITY DEFINER
SELECT 
    p.proname as function_name,
    CASE p.prosecdef 
        WHEN true THEN '✅ SECURITY DEFINER (GOOD)'
        ELSE '❌ NOT SECURITY DEFINER (BAD - NEEDS FIX)'
    END as security_mode
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'mark_audio_validated'
AND n.nspname = 'public';

-- 2. Check current RLS policies (should show multiple policies)
SELECT 
    policyname,
    CASE cmd
        WHEN 'SELECT' THEN '👁️  SELECT'
        WHEN 'UPDATE' THEN '✏️  UPDATE'
        WHEN 'INSERT' THEN '➕ INSERT'
        WHEN 'DELETE' THEN '🗑️  DELETE'
        WHEN '*' THEN '🔑 ALL'
    END as operation,
    roles,
    CASE 
        WHEN policyname LIKE '%trigger%' THEN '✅ Trigger policy (GOOD)'
        WHEN policyname LIKE '%service%' THEN '✅ Service role (GOOD)'
        WHEN policyname LIKE '%public%' THEN '✅ Public read (GOOD)'
        ELSE 'Policy'
    END as status
FROM pg_policies 
WHERE tablename = 'audios'
ORDER BY policyname;

-- 3. Check how many audios have feedback but aren't validated
-- If this returns rows, the trigger is NOT working
SELECT 
    COUNT(*) as problem_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All audios with feedback are validated (WORKING)'
        ELSE '❌ Found audios with feedback that are NOT validated (BROKEN)'
    END as status
FROM (
    SELECT a.id
    FROM audios a
    INNER JOIN feedback f ON a.id = f.audio_id
    WHERE a.is_validated = FALSE
    GROUP BY a.id
) subquery;

-- 4. Show problem audios if any exist
SELECT 
    a.id,
    a.audio_name,
    a.is_validated as validated,
    COUNT(f.id) as feedback_count,
    '❌ SHOULD BE VALIDATED' as issue
FROM audios a
INNER JOIN feedback f ON a.id = f.audio_id
WHERE a.is_validated = FALSE
GROUP BY a.id, a.audio_name, a.is_validated;
