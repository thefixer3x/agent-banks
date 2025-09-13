-- Fix profiles table structure for enhanced auth
-- Ensure the profiles table has all required columns

-- Add email column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email text NOT NULL DEFAULT '';
    END IF;
END $$;

-- Ensure all required columns exist
DO $$ 
BEGIN 
    -- Add approved_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'approved_at') THEN
        ALTER TABLE profiles ADD COLUMN approved_at timestamptz;
    END IF;
    
    -- Add approved_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'approved_by') THEN
        ALTER TABLE profiles ADD COLUMN approved_by uuid;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    
    -- Add invite_code if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'invite_code') THEN
        ALTER TABLE profiles ADD COLUMN invite_code text;
    END IF;
END $$;

-- Create or update the handle_new_user function for enhanced auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user'::user_role,
    CASE 
      WHEN new.email = ANY(string_to_array(current_setting('app.default_admin_emails', true), ','))
      THEN 'approved'::user_status
      ELSE 'pending'::user_status
    END,
    now(),
    now()
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update existing profiles to have email from auth.users
UPDATE profiles 
SET email = auth.users.email,
    updated_at = now()
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND (profiles.email IS NULL OR profiles.email = '');

-- Set up RLS policies for enhanced security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role and status)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = OLD.role 
    AND status = OLD.status
  );

-- Policy: Admins can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;