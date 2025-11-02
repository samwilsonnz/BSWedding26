-- ============================================
-- FIX SUPABASE STORAGE RLS POLICY
-- ============================================
-- This enables public uploads to the registry-images bucket

-- Step 1: Allow INSERT (uploads) for authenticated and anon users
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'registry-images');

-- Step 2: Allow SELECT (downloads) for everyone
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'registry-images');

-- Step 3: Verify the policies
SELECT * FROM storage.buckets WHERE name = 'registry-images';
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%registry%';

-- Success message
SELECT '✅ Storage RLS policies fixed! You can now upload images.' as status;
