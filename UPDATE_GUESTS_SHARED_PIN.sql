-- ============================================
-- UPDATE ALL GUESTS TO SHARED PIN
-- ============================================
-- This updates all existing guests to use the shared PIN: WEDDING2024

-- Update all guests to use the shared PIN
UPDATE guests
SET guest_code = 'WEDDING2024'
WHERE guest_code IS NOT NULL;

-- Verify the update
SELECT
    id,
    name,
    email,
    guest_code,
    date_added
FROM guests
ORDER BY date_added;

-- Success message
SELECT '✅ All guests updated to shared PIN: WEDDING2024' as status;
