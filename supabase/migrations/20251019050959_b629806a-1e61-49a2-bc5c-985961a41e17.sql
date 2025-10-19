-- Create storage bucket for generation attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('generation-attachments', 'generation-attachments', true);

-- Create policies for generation attachments
CREATE POLICY "Users can view generation attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'generation-attachments');

CREATE POLICY "Users can upload generation attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their generation attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'generation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their generation attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'generation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track generation attachments
CREATE TABLE IF NOT EXISTS public.generation_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generation_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for generation_attachments
CREATE POLICY "Users can view their own attachments"
ON public.generation_attachments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
ON public.generation_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
ON public.generation_attachments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
ON public.generation_attachments FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_generation_attachments_user_id ON public.generation_attachments(user_id);
CREATE INDEX idx_generation_attachments_project_id ON public.generation_attachments(project_id);
CREATE INDEX idx_generation_attachments_episode_id ON public.generation_attachments(episode_id);