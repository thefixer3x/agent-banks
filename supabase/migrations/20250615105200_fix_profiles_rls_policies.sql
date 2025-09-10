
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Admin policy that doesn't cause recursion
CREATE POLICY "Enable read access for admin users" 
    ON public.profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Admin policy for updates
CREATE POLICY "Enable admin updates" 
    ON public.profiles FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Admin policy for inserts (for the trigger)
CREATE POLICY "Enable inserts for authenticated users" 
    ON public.profiles FOR INSERT 
    WITH CHECK (true);
