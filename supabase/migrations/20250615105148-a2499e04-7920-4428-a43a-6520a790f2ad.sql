
-- First, let's check if the user_role and user_status types exist, and create them if they don't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Update the handle_new_user function to properly handle default admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    invite_code_record RECORD;
    is_first_user BOOLEAN;
    is_default_admin BOOLEAN;
    default_admin_emails TEXT[] := ARRAY[
        'seftecofficiail@gmail.com',
        'arras-humane-0v@icloud.com', 
        'info@lanonasis.com'
    ];
BEGIN
    -- Check if this is the first user (should become admin)
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
    
    -- Check if user email is in the default admin list
    SELECT NEW.email = ANY(default_admin_emails) INTO is_default_admin;
    
    -- Check if user used an invite code
    SELECT * INTO invite_code_record 
    FROM public.invite_codes 
    WHERE code = NEW.raw_user_meta_data->>'invite_code' 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_by IS NULL;

    -- Insert profile with proper role and status
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status,
        invite_code,
        approved_at,
        approved_by
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE 
            WHEN is_first_user OR is_default_admin THEN 'admin'::user_role 
            ELSE 'user'::user_role 
        END,
        CASE 
            WHEN is_first_user OR is_default_admin THEN 'approved'::user_status
            WHEN invite_code_record.code IS NOT NULL THEN 'approved'::user_status
            ELSE 'pending'::user_status
        END,
        NEW.raw_user_meta_data->>'invite_code',
        CASE 
            WHEN is_first_user OR is_default_admin OR invite_code_record.code IS NOT NULL 
            THEN NOW() 
            ELSE NULL 
        END,
        CASE 
            WHEN is_first_user OR is_default_admin OR invite_code_record.code IS NOT NULL 
            THEN NEW.id 
            ELSE NULL 
        END
    );

    -- Mark invite code as used if applicable
    IF invite_code_record.code IS NOT NULL THEN
        UPDATE public.invite_codes 
        SET used_by = NEW.id, used_at = NOW()
        WHERE id = invite_code_record.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't block user creation
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Admin policy to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
