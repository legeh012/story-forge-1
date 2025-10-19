-- Add new bot types to the enum
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'cross_platform_poster';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'multi_channel_uploader';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'engagement_amplifier';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'live_view_booster';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'affiliate_bot';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'lead_capture';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'sales_funnel';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'digital_product';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'script_generator';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'thumbnail_designer';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'video_assembly';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'voiceover';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'performance_tracker';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'ab_testing';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'roi_analyzer';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'feedback_loop';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'llm_reflection';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'bot_orchestrator';
ALTER TYPE public.bot_type ADD VALUE IF NOT EXISTS 'persona_bot';

-- Table for scheduled posts
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  post_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for engagement actions
CREATE TABLE public.engagement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_url TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for affiliate tracking
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  commission_rate DECIMAL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for lead captures
CREATE TABLE public.lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lead_email TEXT,
  lead_name TEXT,
  source_platform TEXT,
  source_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for generated scripts
CREATE TABLE public.generated_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  script_type TEXT NOT NULL,
  script_content TEXT NOT NULL,
  viral_score INTEGER,
  used BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for generated thumbnails
CREATE TABLE public.generated_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  thumbnail_url TEXT NOT NULL,
  concept TEXT,
  predicted_ctr DECIMAL,
  used BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for performance analytics
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content_id TEXT,
  platform TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  watch_time INTEGER DEFAULT 0,
  ctr DECIMAL,
  retention_rate DECIMAL,
  engagement_rate DECIMAL,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for A/B tests
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  variant_a_performance JSONB,
  variant_b_performance JSONB,
  winner TEXT,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all new tables
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scheduled posts" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled posts" ON public.scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled posts" ON public.scheduled_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own engagement actions" ON public.engagement_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagement actions" ON public.engagement_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own affiliate links" ON public.affiliate_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate links" ON public.affiliate_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate links" ON public.affiliate_links FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" ON public.lead_captures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.lead_captures FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scripts" ON public.generated_scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scripts" ON public.generated_scripts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own thumbnails" ON public.generated_thumbnails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own thumbnails" ON public.generated_thumbnails FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ab tests" ON public.ab_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ab tests" ON public.ab_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ab tests" ON public.ab_tests FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_scheduled_posts_user ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_time ON public.scheduled_posts(scheduled_time);
CREATE INDEX idx_performance_metrics_content ON public.performance_metrics(content_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);