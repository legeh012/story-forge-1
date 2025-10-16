-- Grant admins full access to all tables

-- Characters table - admins can do everything
CREATE POLICY "Admins can view all characters" 
ON public.characters 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all characters" 
ON public.characters 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all characters" 
ON public.characters 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Episodes table - admins can do everything
CREATE POLICY "Admins can view all episodes" 
ON public.episodes 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all episodes" 
ON public.episodes 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all episodes" 
ON public.episodes 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all episodes" 
ON public.episodes 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Projects table - admins can do everything
CREATE POLICY "Admins can view all projects" 
ON public.projects 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all projects" 
ON public.projects 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all projects" 
ON public.projects 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Media assets table - admins can do everything
CREATE POLICY "Admins can view all media" 
ON public.media_assets 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert all media" 
ON public.media_assets 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all media" 
ON public.media_assets 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all media" 
ON public.media_assets 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table - admins can delete profiles
CREATE POLICY "Admins can delete all profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));