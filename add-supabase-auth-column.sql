-- ===========================================
-- ADD SUPABASE AUTH SUPPORT TO ADMINS TABLE
-- Run this in Supabase SQL Editor
-- ===========================================

-- Add supabase_user_id column to link with Supabase Auth users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admins' AND column_name = 'supabase_user_id'
    ) THEN
        ALTER TABLE admins ADD COLUMN supabase_user_id UUID;
        RAISE NOTICE 'Added supabase_user_id column to admins table';
    ELSE
        RAISE NOTICE 'supabase_user_id column already exists';
    END IF;
END $$;

-- Add token_version column if not exists (for invalidating all sessions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admins' AND column_name = 'token_version'
    ) THEN
        ALTER TABLE admins ADD COLUMN token_version INTEGER DEFAULT 0;
        RAISE NOTICE 'Added token_version column to admins table';
    ELSE
        RAISE NOTICE 'token_version column already exists';
    END IF;
END $$;

-- Create index on supabase_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_supabase_user_id ON admins(supabase_user_id);

-- Add policy for authenticated users to access their own admin record
CREATE POLICY "Authenticated users can view own admin record" 
ON admins 
FOR SELECT 
TO authenticated
USING (supabase_user_id = auth.uid());

SELECT 'Supabase Auth support added to admins table!' as status;
