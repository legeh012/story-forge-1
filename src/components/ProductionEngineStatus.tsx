import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Cpu, Film, Users, Zap, RefreshCw, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EngineStats {
  totalEpisodes: number;
  completedVideos: number;
  failedVideos: number;
  renderingVideos: number;
  totalCharacters: number;
  recentEpisodes: any[];
}

export const ProductionEngineStatus = () => {
  const [stats, setStats] = useState<EngineStats>({
    totalEpisodes: 0, completedVideos: 0, failedVideos: 0,
    renderingVideos: 0, totalCharacters: 0, recentEpisodes: [],
  });
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchStats();
    checkEngine();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [epCount, vidComplete, vidFailed, vidRendering, charCount, recent] = await Promise.all([
      supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('video_status', 'completed'),
      supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('video_status', 'failed'),
      supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('video_status', ['rendering', 'processing']),
      supabase.from('characters').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('episodes').select('id, title, episode_number, video_status, updated_at')
        .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
    ]);

    setStats({
      totalEpisodes: epCount.count || 0,
      completedVideos: vidComplete.count || 0,
      failedVideos: vidFailed.count || 0,
      renderingVideos: vidRendering.count || 0,
      totalCharacters: charCount.count || 0,
      recentEpisodes: recent.data || [],
    });
  };

  const checkEngine = async () => {
    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke('infinite-creation-engine', {
        body: { action: 'status', prompt: 'ping' },
      });
      setEngineOnline(data?.engineReachable === true);
    } catch {
      setEngineOnline(false);
    } finally {
      setChecking(false);
    }
  };

  const completionRate = stats.totalEpisodes > 0
    ? Math.round((stats.completedVideos / stats.totalEpisodes) * 100)
    : 0;

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    if (status === 'rendering' || status === 'processing') return <Clock className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Production Engine
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={engineOnline === true ? 'bg-green-500' : engineOnline === false ? 'bg-destructive' : 'bg-muted'}>
              {engineOnline === null ? 'Checking...' : engineOnline ? '🟢 Online' : '🔴 Offline'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => { fetchStats(); checkEngine(); }} disabled={checking}>
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Film, label: 'Episodes', value: stats.totalEpisodes, color: 'text-primary' },
            { icon: Zap, label: 'Videos Done', value: stats.completedVideos, color: 'text-green-500' },
            { icon: Cpu, label: 'Rendering', value: stats.renderingVideos, color: 'text-yellow-500' },
            { icon: Users, label: 'Cast', value: stats.totalCharacters, color: 'text-accent' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-background/50">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Completion */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Video Completion</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Recent queue */}
        {stats.recentEpisodes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recent</p>
            {stats.recentEpisodes.map((ep) => (
              <div key={ep.id} className="flex items-center justify-between text-sm py-1.5">
                <div className="flex items-center gap-2">
                  {statusIcon(ep.video_status)}
                  <span className="truncate max-w-[200px]">Ep {ep.episode_number}: {ep.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">{ep.video_status?.replace(/_/g, ' ')}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
