-- Fix lead_captures RLS - users should only see their own leads
DROP POLICY IF EXISTS "Users can insert own leads" ON public.lead_captures;
DROP POLICY IF EXISTS "Users can view own leads" ON public.lead_captures;

CREATE POLICY "Users can insert own leads" ON public.lead_captures
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" ON public.lead_captures
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads" ON public.lead_captures
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Fix system_health RLS - only admins should manage
DROP POLICY IF EXISTS "Admins can view system health" ON public.system_health;
DROP POLICY IF EXISTS "System can manage health status" ON public.system_health;

CREATE POLICY "Admins can view system health" ON public.system_health
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system health" ON public.system_health
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix error_logs RLS - restrict inserts to service role only via edge functions
DROP POLICY IF EXISTS "System can insert error logs" ON public.error_logs;

CREATE POLICY "Service role can insert error logs" ON public.error_logs
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Improve profiles RLS - keep public viewing but restrict updates
DROP POLICY IF EXISTS "Users can view other users basic info" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add missing delete policy for user_roles
CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));