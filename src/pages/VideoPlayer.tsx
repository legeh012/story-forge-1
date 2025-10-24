import { useState } from 'react';
import Navigation from '@/components/Navigation';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play, Youtube } from 'lucide-react';

export default function VideoPlayer() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Example video ID
  const [inputValue, setInputValue] = useState('');

  const extractVideoId = (url: string) => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If no pattern matches, assume it's already a video ID
    return url;
  };

  const handleLoadVideo = () => {
    if (inputValue.trim()) {
      const id = extractVideoId(inputValue.trim());
      setVideoId(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Youtube className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                YouTube Player
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Preview and embed YouTube videos with our responsive player
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Load Video</CardTitle>
              <CardDescription>
                Enter a YouTube URL or video ID to load a video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">YouTube URL or Video ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="video-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                  />
                  <Button onClick={handleLoadVideo} className="gap-2">
                    <Play className="h-4 w-4" />
                    Load
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
              <CardDescription>
                Current video ID: {videoId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YouTubePlayer 
                videoId={videoId}
                title="Demo YouTube Video"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Example</CardTitle>
              <CardDescription>
                How to use the YouTubePlayer component in your code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import YouTubePlayer from '@/components/YouTubePlayer';

function MyComponent() {
  return (
    <YouTubePlayer 
      videoId="${videoId}"
      title="My Video"
      autoplay={false}
    />
  );
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
