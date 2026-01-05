-- FIX ALL RLS POLICIES FOR WEDDING REGISTRY
-- Run this in Supabase SQL Editor to fix all permission issues

-- ===========================================
-- 1. FIX SITE_CONTENT TABLE (Content Editor)
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admin updates to site content" ON site_content;
DROP POLICY IF EXISTS "Allow admin insert to site content" ON site_content;

-- Create permissive policies for anon key (used by our server)
CREATE POLICY "Allow all updates to site content"
ON site_content FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all inserts to site content"
ON site_content FOR INSERT TO anon WITH CHECK (true);

-- Ensure select works too
DROP POLICY IF EXISTS "Allow public read access to site content" ON site_content;
CREATE POLICY "Allow public read access to site content"
ON site_content FOR SELECT TO anon USING (true);

-- ===========================================
-- 2. ADD THANK YOU FIELDS TO CONTRIBUTIONS
-- ===========================================

ALTER TABLE contributions ADD COLUMN IF NOT EXISTS thank_you_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS thank_you_sent_at TIMESTAMP;

-- ===========================================
-- 3. FIX GUESTS TABLE (if needed)
-- ===========================================

-- Ensure guest updates work
DROP POLICY IF EXISTS "Allow update for guests" ON guests;
CREATE POLICY "Allow update for guests"
ON guests FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert for guests" ON guests;
CREATE POLICY "Allow insert for guests"
ON guests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for guests" ON guests;
CREATE POLICY "Allow delete for guests"
ON guests FOR DELETE TO anon USING (true);

-- ===========================================
-- 4. FIX CONTRIBUTIONS TABLE
-- ===========================================

DROP POLICY IF EXISTS "Allow update for contributions" ON contributions;
CREATE POLICY "Allow update for contributions"
ON contributions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ===========================================
-- 5. FIX RSVPS TABLE
-- ===========================================

-- Ensure RSVPs can be managed
DROP POLICY IF EXISTS "Allow delete for rsvps" ON rsvps;
CREATE POLICY "Allow delete for rsvps"
ON rsvps FOR DELETE TO anon USING (true);

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check all policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
