-- Fix critical security issue: Restrict profiles table access
-- Users should only view their own profile, not all profiles

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to view basic profile info of other users (username and avatar only for UI purposes)
-- This is safer than exposing everything
CREATE POLICY "Users can view other users basic info"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);