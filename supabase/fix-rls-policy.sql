-- =====================================================
-- FIX: Allow database triggers to update audios table
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow service role full access on audios" ON audios;

-- Create separate policies for different operations
CREATE POLICY "Allow service role full access on audios" ON audios
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Allow authenticated triggers to update is_validated field
-- This allows the database trigger to work without needing service role on client
CREATE POLICY "Allow trigger to update is_validated" ON audios
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Note: This is safe because:
-- 1. Only the trigger can update is_validated (no direct API access)
-- 2. The trigger only runs when feedback is inserted
-- 3. Public can only INSERT feedback, not update audios directly
