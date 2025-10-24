import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, Cpu, Database, BarChart3, Layers, 
  Zap, CheckCircle2, AlertCircle, Activity 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CloudServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [orchestrationEvents, setOrchestrationEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
  };

  const fetchData = async () => {
    try {
      const { data: servicesData } = await supabase
        .from('cloud_services')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: metricsData } = await supabase
        .from('service_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(20);

      const { data: eventsData } = await supabase
        .from('orchestration_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setServices(servicesData || []);
      setMetrics(metricsData || []);
      setOrchestrationEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const invokeService = async (serviceType: string, operation: string, data: any = {}) => {
    try {
      const functionName = `${serviceType}-bot`;
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { operation, data }
      });

      if (error) throw error;

      toast({
        title: `${serviceType.toUpperCase()} Service Activated`,
        description: 'AI bot is processing your request...',
      });

      fetchData();
      return result;
    } catch (error) {
      toast({
        title: 'Service Error',
        description: error instanceof Error ? error.message : 'Service invocation failed',
        variant: 'destructive',
      });
    }
  };

  const orchestrateTask = async (task: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('xaas-orchestrator', {
        body: { task, context: { timestamp: new Date().toISOString() } }
      });

      if (error) throw error;

      toast({
        title: '🎯 XaaS Orchestrator Activated',
        description: 'AI is coordinating services for your task...',
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Orchestration Error',
        description: error instanceof Error ? error.message : 'Failed to orchestrate task',
        variant: 'destructive',
      });
    }
  };

  const serviceIcons: Record<string, any> = {
    saas: Cloud,
    paas: Layers,
    baas: Database,
    laas: BarChart3,
    xaas: Cpu,
  };

  const serviceColors: Record<string, string> = {
    saas: 'from-blue-500 to-cyan-500',
    paas: 'from-purple-500 to-pink-500',
    baas: 'from-green-500 to-emerald-500',
    laas: 'from-orange-500 to-red-500',
    xaas: 'from-violet-500 to-purple-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
            AI Cloud Services Platform
          </h1>
          <p className="text-muted-foreground text-lg">
            Autonomous cloud infrastructure powered by AI orchestration
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="orchestration">XaaS</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {['saas', 'paas', 'baas', 'laas', 'xaas'].map((type) => {
                const Icon = serviceIcons[type];
                return (
                  <Card key={type} className={`p-6 bg-gradient-to-br ${serviceColors[type]} text-white`}>
                    <Icon className="h-8 w-8 mb-3" />
                    <h3 className="text-lg font-bold uppercase">{type}</h3>
                    <p className="text-sm opacity-90 mt-1">
                      {type === 'saas' && 'Software Layer'}
                      {type === 'paas' && 'Platform Layer'}
                      {type === 'baas' && 'Backend Layer'}
                      {type === 'laas' && 'Logging Layer'}
                      {type === 'xaas' && 'Orchestrator'}
                    </p>
                    <Badge className="mt-3 bg-white/20 hover:bg-white/30">
                      Active
                    </Badge>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => orchestrateTask('Optimize video generation pipeline')}
                  className="bg-gradient-to-r from-primary to-accent h-auto py-4"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">Orchestrate Task</div>
                    <div className="text-xs opacity-90">Let AI coordinate services</div>
                  </div>
                </Button>

                <Button
                  onClick={() => invokeService('laas', 'analyze_health')}
                  variant="outline"
                  className="h-auto py-4"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">System Health</div>
                    <div className="text-xs opacity-70">Run diagnostics</div>
                  </div>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {['saas', 'baas', 'laas'].map((serviceType) => {
              const Icon = serviceIcons[serviceType];
              return (
                <Card key={serviceType} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${serviceColors[serviceType]}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold uppercase">{serviceType}</h3>
                        <p className="text-sm text-muted-foreground">
                          {serviceType === 'saas' && 'Application services and user management'}
                          {serviceType === 'baas' && 'Backend infrastructure and data'}
                          {serviceType === 'laas' && 'Logging and analytics'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => invokeService(serviceType, 'status_check')}
                      variant="outline"
                    >
                      Check Status
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => invokeService(serviceType, 'optimize')}
                    >
                      Optimize
                    </Button>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="orchestration" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="h-8 w-8 text-violet-500" />
                <div>
                  <h2 className="text-2xl font-bold">XaaS Orchestrator</h2>
                  <p className="text-muted-foreground">AI-powered service coordination</p>
                </div>
              </div>

              <p className="mb-4 text-sm">
                The XaaS (Everything as a Service) orchestrator uses AI to intelligently coordinate
                multiple service layers, optimize workflows, and automatically handle complex tasks.
              </p>

              <Button
                onClick={() => orchestrateTask('Generate and deploy new video episode')}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Test Orchestration
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Recent Orchestration Events</h3>
              {orchestrationEvents.length === 0 ? (
                <p className="text-muted-foreground">No orchestration events yet</p>
              ) : (
                <div className="space-y-3">
                  {orchestrationEvents.map((event) => (
                    <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{event.event_type}</h4>
                        <Badge variant={event.success ? 'default' : 'destructive'}>
                          {event.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.decision_reasoning}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {event.services_involved?.map((service: string) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4">System Metrics</h3>
              {metrics.length === 0 ? (
                <p className="text-muted-foreground">No metrics recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{metric.metric_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(metric.recorded_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="text-lg">{metric.metric_value}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4">Service Operations Log</h3>
              <Button
                onClick={() => invokeService('laas', 'analyze_logs', { timeframe: '24h' })}
                className="mb-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Logs
              </Button>
              <p className="text-muted-foreground">
                LaaS bot will analyze recent operations and provide insights
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CloudServices;
