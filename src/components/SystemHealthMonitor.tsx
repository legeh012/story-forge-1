import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  recovery_action: string;
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
    
    // Set up realtime subscription for error logs
    const channel = supabase
      .channel('error-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs'
        },
        (payload) => {
          setErrorLogs((prev) => [payload.new as ErrorLog, ...prev]);
          toast.info("New error logged and auto-recovery attempted");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch recent error logs
    const { data: logs } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch system health
    const { data: health } = await supabase
      .from('system_health')
      .select('*');

    if (logs) setErrorLogs(logs);
    if (health) setSystemHealth(health);
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-success">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-warning">Degraded</Badge>;
      default:
        return <Badge className="bg-destructive">Critical</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.length === 0 ? (
              <p className="text-muted-foreground text-sm">No health data available</p>
            ) : (
              systemHealth.map((service) => (
                <div key={service.service_name} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <h4 className="font-semibold capitalize">{service.service_name.replace('_', ' ')}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last checked: {new Date(service.last_check).toLocaleString()}
                    </p>
                  </div>
                  {getHealthBadge(service.status)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Recovery Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No errors logged yet</p>
            ) : (
              errorLogs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg bg-card space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.recovery_status)}
                      <Badge variant="outline">{log.error_type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium">{log.error_message}</p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Recovery:</span>
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {log.recovery_action || 'None'}
                    </code>
                    <Badge variant={log.recovery_status === 'resolved' ? 'default' : 'destructive'}>
                      {log.recovery_status}
                    </Badge>
                  </div>
                  
                  {log.resolved_at && (
                    <p className="text-xs text-muted-foreground">
                      Resolved: {new Date(log.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
