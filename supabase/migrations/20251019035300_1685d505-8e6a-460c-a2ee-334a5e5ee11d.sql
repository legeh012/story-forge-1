-- Add realism settings to episodes
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS rendering_style TEXT DEFAULT 'photorealistic' CHECK (rendering_style IN ('photorealistic', 'stylized')),
ADD COLUMN IF NOT EXISTS realism_settings JSONB DEFAULT '{
  "anatomical_accuracy": true,
  "realistic_lighting": true,
  "no_cartoon_filters": true,
  "natural_expressions": true,
  "finger_count_validation": true,
  "netflix_grade": true
}'::jsonb;

-- Add realism settings to projects for default preferences
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS default_rendering_style TEXT DEFAULT 'photorealistic' CHECK (default_rendering_style IN ('photorealistic', 'stylized'));