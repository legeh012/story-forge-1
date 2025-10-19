-- Add video rendering fields to episodes table
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'not_started' CHECK (video_status IN ('not_started', 'rendering', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS video_render_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_render_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_render_error TEXT;

-- Create storage bucket for rendered videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('episode-videos', 'episode-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for episode videos
CREATE POLICY "Users can view episode videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'episode-videos');

CREATE POLICY "Authenticated users can upload episode videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'episode-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own episode videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'episode-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own episode videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'episode-videos' 
  AND auth.role() = 'authenticated'
);