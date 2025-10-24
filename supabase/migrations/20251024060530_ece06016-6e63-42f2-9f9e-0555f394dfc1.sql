-- Cloud Services Infrastructure Tables

-- Service registry for all cloud services
CREATE TABLE IF NOT EXISTS public.cloud_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('saas', 'paas', 'baas', 'laas', 'xaas')),
  service_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  config JSONB DEFAULT '{}'::jsonb,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Service operations log
CREATE TABLE IF NOT EXISTS public.service_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.cloud_services(id),
  operation_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Service metrics and monitoring
CREATE TABLE IF NOT EXISTS public.service_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.cloud_services(id),
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- AI orchestration events
CREATE TABLE IF NOT EXISTS public.orchestration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  services_involved TEXT[] DEFAULT ARRAY[]::TEXT[],
  decision_reasoning TEXT,
  actions_taken JSONB,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cloud_services_user ON public.cloud_services(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_services_type ON public.cloud_services(service_type);
CREATE INDEX IF NOT EXISTS idx_service_operations_user ON public.service_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_service_operations_service ON public.service_operations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_metrics_service ON public.service_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_events_user ON public.orchestration_events(user_id);

-- RLS Policies
ALTER TABLE public.cloud_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orchestration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cloud services"
  ON public.cloud_services FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own service operations"
  ON public.service_operations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own service metrics"
  ON public.service_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orchestration events"
  ON public.orchestration_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cloud_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cloud_services_updated_at
  BEFORE UPDATE ON public.cloud_services
  FOR EACH ROW
  EXECUTE FUNCTION update_cloud_services_updated_at();