-- Create remix_vault table to archive generated remix videos
CREATE TABLE IF NOT EXISTS public.remix_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  cast_selection TEXT,
  music_track TEXT,
  overlay_style TEXT,
  remix_metadata JSONB DEFAULT '{}'::jsonb,
  ttl TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  views INTEGER DEFAULT 0,
  cast_reactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remix_vault ENABLE ROW LEVEL SECURITY;

-- Users can view their own remix videos
CREATE POLICY "Users can view own remix videos"
ON public.remix_vault
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own remix videos
CREATE POLICY "Users can insert own remix videos"
ON public.remix_vault
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own remix videos
CREATE POLICY "Users can update own remix videos"
ON public.remix_vault
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own remix videos
CREATE POLICY "Users can delete own remix videos"
ON public.remix_vault
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_remix_vault_updated_at
BEFORE UPDATE ON public.remix_vault
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();