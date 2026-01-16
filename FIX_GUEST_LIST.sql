-- FIX GUEST LIST: Remove duplicates and add delete policy
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

-- ===========================================
-- 1. ADD DELETE POLICY FOR GUEST_LIST
-- ===========================================

DROP POLICY IF EXISTS "Allow delete for guest_list" ON guest_list;
CREATE POLICY "Allow delete for guest_list"
ON guest_list FOR DELETE TO anon USING (true);

-- ===========================================
-- 2. REMOVE ALL DUPLICATES (Keep lowest ID per name+family_group)
-- ===========================================

DELETE FROM guest_list
WHERE id NOT IN (
    SELECT MIN(id)
    FROM guest_list
    GROUP BY LOWER(TRIM(name)), family_group
);

-- ===========================================
-- 3. VERIFY RESULTS
-- ===========================================

-- Should show unique guests only
SELECT name, family_group, COUNT(*) as count
FROM guest_list
GROUP BY name, family_group
HAVING COUNT(*) > 1;

-- Show total count (should be ~71 guests)
SELECT COUNT(*) as total_guests FROM guest_list;

-- Show family groupings
SELECT family_group, array_agg(name ORDER BY name) as members
FROM guest_list
GROUP BY family_group
ORDER BY family_group;
