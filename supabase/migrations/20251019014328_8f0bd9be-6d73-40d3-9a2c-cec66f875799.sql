-- Create enum for bot types
CREATE TYPE public.bot_type AS ENUM ('trend_detection', 'hook_optimization', 'remix', 'cultural_injection');

-- Create enum for bot status
CREATE TYPE public.bot_status AS ENUM ('idle', 'running', 'completed', 'failed');

-- Viral bots configuration table
CREATE TABLE public.viral_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bot_type bot_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot activities/runs log
CREATE TABLE public.bot_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES public.viral_bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status bot_status DEFAULT 'running',
  results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Trend detections from scraping
CREATE TABLE public.trend_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  trend_type TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[],
  engagement_score INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hook optimizations
CREATE TABLE public.hook_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  original_title TEXT,
  optimized_title TEXT,
  original_description TEXT,
  optimized_description TEXT,
  thumbnail_suggestions JSONB,
  predicted_ctr DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content remixes
CREATE TABLE public.content_remixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_content TEXT,
  remix_type TEXT NOT NULL,
  remixed_content TEXT,
  viral_score INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cultural injections
CREATE TABLE public.cultural_injections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.bot_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  original_content TEXT,
  injection_type TEXT NOT NULL,
  injected_content TEXT,
  cultural_relevance_score INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viral_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_injections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bots" ON public.viral_bots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bots" ON public.viral_bots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bots" ON public.viral_bots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bots" ON public.viral_bots FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.bot_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.bot_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.bot_activities FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trends" ON public.trend_detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trends" ON public.trend_detections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own hooks" ON public.hook_optimizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hooks" ON public.hook_optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own remixes" ON public.content_remixes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own remixes" ON public.content_remixes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own injections" ON public.cultural_injections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own injections" ON public.cultural_injections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_viral_bots_updated_at
  BEFORE UPDATE ON public.viral_bots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_bot_activities_user_id ON public.bot_activities(user_id);
CREATE INDEX idx_bot_activities_status ON public.bot_activities(status);
CREATE INDEX idx_trend_detections_platform ON public.trend_detections(platform);
CREATE INDEX idx_trend_detections_detected_at ON public.trend_detections(detected_at DESC);