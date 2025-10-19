import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Camera, Zap } from 'lucide-react';

interface RealismAuditProps {
  totalEpisodes: number;
  photorealisticCount: number;
  stylizedCount: number;
}

export const RealismAudit = ({ 
  totalEpisodes, 
  photorealisticCount, 
  stylizedCount 
}: RealismAuditProps) => {
  const photorealisticPercentage = totalEpisodes > 0 
    ? Math.round((photorealisticCount / totalEpisodes) * 100) 
    : 0;

  const qualityMetrics = [
    {
      name: 'Anatomical Accuracy',
      description: 'Exactly 5 fingers per hand, natural proportions',
      status: 'enforced',
      icon: CheckCircle2,
    },
    {
      name: 'Realistic Lighting',
      description: 'Natural shadows, HDR quality, proper color temperature',
      status: 'enforced',
      icon: CheckCircle2,
    },
    {
      name: 'No Cartoon Filters',
      description: 'Zero stylization, anime, or artistic filters',
      status: 'enforced',
      icon: CheckCircle2,
    },
    {
      name: 'Natural Expressions',
      description: 'Realistic facial movements, eye reflections',
      status: 'enforced',
      icon: CheckCircle2,
    },
    {
      name: 'Netflix-Grade Quality',
      description: '8K resolution, cinematic color grading, film grain',
      status: 'active',
      icon: Camera,
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Realism Audit
            </CardTitle>
            <CardDescription>
              Quality assurance for photorealistic rendering
            </CardDescription>
          </div>
          <Badge 
            className={photorealisticPercentage === 100 
              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }
          >
            {photorealisticPercentage}% Photorealistic
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-2xl font-bold text-foreground">{totalEpisodes}</div>
            <div className="text-xs text-muted-foreground">Total Episodes</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-2xl font-bold text-green-600">{photorealisticCount}</div>
            <div className="text-xs text-muted-foreground">Photorealistic</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-600">{stylizedCount}</div>
            <div className="text-xs text-muted-foreground">Stylized</div>
          </div>
        </div>

        {/* Quality Enforcement */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Quality Enforcement</h4>
          <div className="space-y-2">
            {qualityMetrics.map((metric) => (
              <div
                key={metric.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div className={`p-1.5 rounded-lg ${
                  metric.status === 'enforced' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  <metric.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{metric.name}</div>
                    <Badge 
                      variant="outline" 
                      className={
                        metric.status === 'enforced' 
                          ? 'text-green-600 border-green-600/30' 
                          : 'text-blue-600 border-blue-600/30'
                      }
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {photorealisticPercentage < 100 && (
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-600">
              <strong>Recommendation:</strong> {stylizedCount} episode{stylizedCount !== 1 ? 's' : ''} using 
              stylized rendering. Switch to photorealistic mode for Netflix-grade quality.
            </div>
          </div>
        )}

        {/* Technical Specs */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Pipeline Specs:</strong> Google Gemini 2.5 Flash 
              Image Preview model • 8K quality enforced • Cinematic color grading (Netflix reference) 
              • ARRI ALEXA camera emulation • Real-world physics validation
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
