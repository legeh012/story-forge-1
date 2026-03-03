import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import { Code, Chrome, Package, Copy, CheckCircle, Terminal, Globe, Puzzle, BookOpen, Zap, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

const Developers = () => {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [embedTheme, setEmbedTheme] = useState('dark');
  const [embedWidth, setEmbedWidth] = useState('640');
  const [embedHeight, setEmbedHeight] = useState('360');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(blockId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={() => copyToClipboard(text, id)}
    >
      {copiedBlock === id ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  const sdkInstallCode = `npm install @storyforge/sdk`;
  const sdkInitCode = `import { StoryForge } from '@storyforge/sdk';

const sf = new StoryForge({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

// Generate an episode from a prompt
const episode = await sf.episodes.generate({
  concept: 'Two rival chefs compete in a desert cook-off',
  style: 'photorealistic',
  episodeCount: 6,
});

console.log(episode.title, episode.cast);`;

  const embedCode = `<script src="https://cdn.storyforge.dev/embed/v1.js"><\/script>
<div
  id="storyforge-player"
  data-episode-id="episode_abc123"
  data-theme="${embedTheme}"
  style="width:${embedWidth}px;height:${embedHeight}px;"
></div>
<script>
  StoryForge.embed('#storyforge-player');
<\/script>`;

  const webhookCode = `// Express.js webhook handler
app.post('/webhooks/storyforge', (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case 'episode.created':
      console.log('New episode:', data.title);
      break;
    case 'video.rendered':
      console.log('Video ready:', data.video_url);
      break;
    case 'production.complete':
      console.log('Season complete:', data.project_id);
      break;
  }

  res.status(200).json({ received: true });
});`;

  const restApiExamples = [
    {
      method: 'POST',
      endpoint: '/v1/episodes/generate',
      description: 'Generate a full episode from a text concept',
      body: `{
  "concept": "Reality dating show set in Tokyo",
  "style": "photorealistic",
  "episode_count": 8
}`,
    },
    {
      method: 'GET',
      endpoint: '/v1/projects/:id/episodes',
      description: 'List all episodes in a project',
      body: null,
    },
    {
      method: 'POST',
      endpoint: '/v1/videos/render',
      description: 'Trigger video rendering for an episode',
      body: `{
  "episode_id": "ep_abc123",
  "resolution": "1080p",
  "format": "mp4"
}`,
    },
    {
      method: 'POST',
      endpoint: '/v1/characters/design',
      description: 'AI-design a character with portrait',
      body: `{
  "name": "Kai Nakamura",
  "role": "protagonist",
  "personality": "ambitious, charming, secretive"
}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Developer Ecosystem</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Build with StoryForge
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              JavaScript SDK, REST API, embeddable widgets, and a Chrome Extension — everything you need to integrate AI-powered storytelling into your apps.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="p-6 bg-card border-border hover:border-primary/40 transition-colors cursor-pointer group">
              <Package className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">JavaScript SDK</h3>
              <p className="text-sm text-muted-foreground">Embed players, generate episodes, and manage projects from any JS app.</p>
            </Card>
            <Card className="p-6 bg-card border-border hover:border-accent/40 transition-colors cursor-pointer group">
              <Chrome className="h-8 w-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Chrome Extension</h3>
              <p className="text-sm text-muted-foreground">Clip content, save ideas, and quick-produce from any webpage.</p>
            </Card>
            <Card className="p-6 bg-card border-border hover:border-primary-glow/40 transition-colors cursor-pointer group">
              <BookOpen className="h-8 w-8 text-[hsl(var(--primary-glow))] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">API Reference</h3>
              <p className="text-sm text-muted-foreground">Full REST API with webhooks for programmatic integrations.</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sdk" className="space-y-8">
            <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto">
              <TabsTrigger value="sdk">SDK</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
              <TabsTrigger value="extension">Extension</TabsTrigger>
            </TabsList>

            {/* SDK Tab */}
            <TabsContent value="sdk" className="space-y-8">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Install the SDK</h2>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>
                <div className="relative bg-secondary rounded-lg p-4 font-mono text-sm">
                  <CopyButton text={sdkInstallCode} id="install" />
                  <code className="text-foreground">{sdkInstallCode}</code>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold">Quick Start</h2>
                </div>
                <div className="relative bg-secondary rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <CopyButton text={sdkInitCode} id="init" />
                  <pre className="text-foreground whitespace-pre">{sdkInitCode}</pre>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    SDK Features
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Episode generation from text prompts</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Character design & management</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Video rendering triggers</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Embeddable video player widget</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Webhook event subscriptions</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> TypeScript-first with full type safety</li>
                  </ul>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All API requests require a valid API key. Generate one from your dashboard settings.
                  </p>
                  <div className="relative bg-secondary rounded-lg p-4 font-mono text-xs">
                    <code className="text-foreground">
                      Authorization: Bearer sf_live_xxxxxxxxxxxx
                    </code>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">REST API Reference</h2>
                  <Badge variant="secondary">Base URL: api.storyforge.dev</Badge>
                </div>
                <p className="text-sm text-muted-foreground">All endpoints require an API key passed via the Authorization header.</p>
              </Card>

              {restApiExamples.map((api, i) => (
                <Card key={i} className="p-6 bg-card border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={api.method === 'GET' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-accent/20 text-accent border-accent/30'}>
                      {api.method}
                    </Badge>
                    <code className="text-sm font-mono text-foreground">{api.endpoint}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{api.description}</p>
                  {api.body && (
                    <div className="relative bg-secondary rounded-lg p-4 font-mono text-xs overflow-x-auto">
                      <CopyButton text={api.body} id={`api-${i}`} />
                      <pre className="text-foreground whitespace-pre">{api.body}</pre>
                    </div>
                  )}
                </Card>
              ))}

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Puzzle className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold">Webhooks</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to real-time events. Configure your webhook URL in project settings.
                </p>
                <div className="relative bg-secondary rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <CopyButton text={webhookCode} id="webhook" />
                  <pre className="text-foreground whitespace-pre">{webhookCode}</pre>
                </div>
              </Card>
            </TabsContent>

            {/* Embed Tab */}
            <TabsContent value="embed" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-bold mb-4">Embed Widget Generator</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Customize and copy the embed code to drop a StoryForge player into any website.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Theme</label>
                    <Select value={embedTheme} onValueChange={setEmbedTheme}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Width (px)</label>
                    <Input value={embedWidth} onChange={(e) => setEmbedWidth(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Height (px)</label>
                    <Input value={embedHeight} onChange={(e) => setEmbedHeight(e.target.value)} />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-secondary rounded-lg mb-6 flex items-center justify-center border border-border" style={{ width: '100%', height: '200px' }}>
                  <div className="text-center text-muted-foreground">
                    <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Player preview ({embedWidth}×{embedHeight})</p>
                    <p className="text-xs mt-1">Theme: {embedTheme}</p>
                  </div>
                </div>

                <div className="relative bg-secondary rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <CopyButton text={embedCode} id="embed" />
                  <pre className="text-foreground whitespace-pre">{embedCode}</pre>
                </div>
              </Card>
            </TabsContent>

            {/* Extension Tab */}
            <TabsContent value="extension" className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Chrome className="h-12 w-12 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-2">StoryForge Chrome Extension</h2>
                    <p className="text-muted-foreground mb-4">
                      Right-click any text, image, or video on the web to instantly turn it into a StoryForge episode concept. Save ideas, clip content, and quick-produce — all without leaving the page.
                    </p>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      <Chrome className="mr-2 h-5 w-5" />
                      Add to Chrome — Free
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Also available for Edge, Brave, and Arc</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3">✂️ Clip & Capture</h3>
                  <p className="text-sm text-muted-foreground">
                    Select any text on a webpage, right-click → "Send to StoryForge" to instantly save it as an episode concept or character idea.
                  </p>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3">⚡ Quick Produce</h3>
                  <p className="text-sm text-muted-foreground">
                    Open the extension popup, paste a concept, and trigger full production without opening the StoryForge app.
                  </p>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3">💡 Idea Vault</h3>
                  <p className="text-sm text-muted-foreground">
                    Save snippets, URLs, and images to your personal idea vault. Access them later from your StoryForge dashboard.
                  </p>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold mb-3">🔔 Production Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get desktop notifications when your episodes finish rendering or when your season production is complete.
                  </p>
                </Card>
              </div>

              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Extension Permissions</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Minimal permissions</p>
                      <p className="text-muted-foreground">Only activates on right-click context menu. No background tracking.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Key className="h-4 w-4 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Secure API key storage</p>
                      <p className="text-muted-foreground">Your API key is stored locally in Chrome's secure storage and never sent to third parties.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Developers;
