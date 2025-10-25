import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const YouTubeIntegrationStatus = () => {
  const channelUrl = 'https://www.youtube.com/channel/UCNmu5pHAa4k0rKoZ8nnYgJw';

  return (
    <Card className="border-[#FF0000]/30 bg-gradient-to-br from-[#FF0000]/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FF0000]/20">
              <Youtube className="h-5 w-5 text-[#FF0000]" />
            </div>
            <div>
              <CardTitle className="text-lg">YouTube Auto-Upload</CardTitle>
              <CardDescription>Videos automatically upload to your channel</CardDescription>
            </div>
          </div>
          <Badge className="bg-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-lg bg-card border border-border">
          <p className="text-sm font-medium mb-2">Connected Channel:</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-mono truncate flex-1">
              {channelUrl}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(channelUrl, '_blank')}
              className="ml-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Automatic upload after video generation</p>
          <p>✓ Public visibility</p>
          <p>✓ Optimized metadata and tags</p>
        </div>
      </CardContent>
    </Card>
  );
};
