-- Fix Supabase Storage Public Access
-- Run this in Supabase SQL Editor

-- 1. Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'portfolio-media';

-- 2. Drop all existing policies for clean slate
DROP POLICY IF EXISTS "Public Read Access 17a7vvj_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload 17a7vvj_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update 17a7vvj_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update 17a7vvj_1" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete 17a7vvj_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete 17a7vvj_1" ON storage.objects;

-- 3. Create simple public access policy for SELECT (read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-media');

-- 4. Allow authenticated users to INSERT
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-media');

-- 5. Allow service role to do everything
CREATE POLICY "Service Role All Access"
ON storage.objects
TO service_role
USING (bucket_id = 'portfolio-media')
WITH CHECK (bucket_id = 'portfolio-media');

-- 6. Verify
SELECT * FROM storage.buckets WHERE id = 'portfolio-media';
