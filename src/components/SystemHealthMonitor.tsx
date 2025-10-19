import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  recovery_action: string | null;
  recovery_status: string;
  created_at: string;
  resolved_at: string | null;
}

interface SystemHealth {
  service_name: string;
  status: string;
  last_check: string;
  metadata: any;
}

export const SystemHealthMonitor = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscriptions
    const errorChannel = supabase
      .channel('error_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'error_logs'
        },
        () => fetchData()
      )
      .subscribe();

    const healthChannel = supabase
      .channel('system_health_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_health'
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(errorChannel);
      supabase.removeChannel(healthChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [errorsResult, healthResult] = await Promise.all([
        supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('system_health')
          .select('*')
      ]);

      if (errorsResult.data) setErrorLogs(errorsResult.data);
      if (healthResult.data) setSystemHealth(healthResult.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      healthy: { variant: 'default', icon: CheckCircle },
      degraded: { variant: 'secondary', icon: AlertCircle },
      resolved: { variant: 'default', icon: CheckCircle },
      failed: { variant: 'destructive', icon: AlertCircle },
      pending: { variant: 'secondary', icon: Clock }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading system health...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemHealth.map((service) => (
              <div
                key={service.service_name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div>
                  <p className="font-medium">{service.service_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(service.last_check), { addSuffix: true })}
                  </p>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Error Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {errorLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{log.error_type}</Badge>
                        {getStatusBadge(log.recovery_status)}
                      </div>
                      <p className="text-sm font-medium">{log.error_message}</p>
                      {log.recovery_action && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Recovery: {log.recovery_action}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Occurred {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                    {log.resolved_at && (
                      <span>
                        Resolved {formatDistanceToNow(new Date(log.resolved_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {errorLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No errors logged yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
