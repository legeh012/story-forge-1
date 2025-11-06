-- Create table for video generation progress tracking
CREATE TABLE IF NOT EXISTS public.video_generation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  episode_id UUID NOT NULL,
  current_phase INTEGER NOT NULL DEFAULT 0,
  total_phases INTEGER NOT NULL DEFAULT 9,
  phase_name TEXT NOT NULL,
  phase_status TEXT NOT NULL DEFAULT 'running',
  phase_details JSONB DEFAULT '{}'::jsonb,
  processing_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_generation_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own video progress"
  ON public.video_generation_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress"
  ON public.video_generation_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress"
  ON public.video_generation_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER TABLE public.video_generation_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_generation_progress;

-- Create index for faster queries
CREATE INDEX idx_video_progress_episode ON public.video_generation_progress(episode_id);
CREATE INDEX idx_video_progress_user ON public.video_generation_progress(user_id);