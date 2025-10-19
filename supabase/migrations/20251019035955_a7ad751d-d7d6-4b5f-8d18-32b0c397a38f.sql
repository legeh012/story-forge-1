-- Create new enum with ALL existing types plus new ones
CREATE TYPE bot_type_new AS ENUM (
  'trend_detection',
  'live_view_booster',
  'cross_platform_poster',
  'lead_capture',
  'remix',
  'roi_analyzer',
  'voiceover',
  'multi_channel_uploader',
  'thumbnail_designer',
  'llm_reflection',
  'video_assembly',
  'bot_orchestrator',
  'persona_bot',
  'script_generator',
  'cultural_injection',
  'affiliate_bot',
  'hook_optimization',
  'engagement_amplifier',
  'digital_product',
  'performance_tracker',
  'feedback_loop',
  'sales_funnel',
  'ab_testing',
  'expert_director',
  'production_team',
  'scene_orchestration'
);

ALTER TABLE viral_bots ALTER COLUMN bot_type TYPE bot_type_new USING bot_type::text::bot_type_new;
DROP TYPE bot_type;
ALTER TYPE bot_type_new RENAME TO bot_type;

-- Create bot templates table for scene presets
CREATE TABLE IF NOT EXISTS bot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('scene_setup', 'character_arc', 'drama_pattern')),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot templates are viewable by everyone"
ON bot_templates FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage templates"
ON bot_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create bot execution stats table
CREATE TABLE IF NOT EXISTS bot_execution_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_type bot_type NOT NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  execution_time_ms INTEGER,
  quality_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE bot_execution_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bot stats"
ON bot_execution_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM episodes 
    WHERE episodes.id = bot_execution_stats.episode_id 
    AND episodes.user_id = auth.uid()
  )
);

-- Insert scene templates
INSERT INTO bot_templates (template_type, name, description, template_data) VALUES
('scene_setup', 'Boutique Drama', 'Classic boutique confrontation scene', '{"setting": "upscale boutique", "camera_angles": ["medium close-up", "over-shoulder", "reaction shots"], "lighting": "soft natural with dramatic shadows", "typical_conflict": "business rivalry, fashion criticism", "pacing": "slow build to explosive confrontation", "duration_seconds": 180}'::jsonb),
('scene_setup', 'Fundraiser Chaos', 'Charity event that spirals into drama', '{"setting": "elegant venue with crowd", "camera_angles": ["wide establishing", "tracking shots", "intimate close-ups"], "lighting": "glamorous golden hour", "typical_conflict": "public embarrassment, secret reveals", "pacing": "medium tension with sudden escalation", "duration_seconds": 240}'::jsonb),
('scene_setup', 'Brunch Expose', 'Intimate gathering revelation scene', '{"setting": "upscale restaurant brunch", "camera_angles": ["table-level shots", "character isolation", "group reactions"], "lighting": "bright natural daylight", "typical_conflict": "secret exposure, alliance shifts", "pacing": "casual to shocked silence", "duration_seconds": 210}'::jsonb),
('character_arc', 'Villain Redemption', 'Antagonist showing vulnerability', '{"emotional_beats": ["defensive", "breaking point", "genuine emotion", "partial redemption"], "camera_focus": "tight on face for emotion", "music_cues": "soft piano to hopeful strings", "arc_duration": "2-3 episodes"}'::jsonb),
('drama_pattern', 'WhatsApp Screenshot Drama', 'Digital receipts revelation pattern', '{"setup": "rumors circulating", "escalation": "screenshots leaked", "climax": "group confrontation", "resolution": "aftermath and fallout", "visual_elements": ["phone screen inserts", "reaction montages", "text overlay"], "engagement_spike": "85%"}'::jsonb)
ON CONFLICT DO NOTHING;