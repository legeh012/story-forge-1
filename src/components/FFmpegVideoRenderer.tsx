import { useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, Film, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoManifest {
  episodeId: string;
  totalDuration: number;
  frames: Array<{
    sceneNumber: number;
    image: string;
    duration: number;
    dialogue: string;
    characters: string[];
  }>;
  metadata: {
    style: string;
    prompt: string;
    generatedAt: string;
    charactersUsed: string[];
  };
}

interface FFmpegVideoRendererProps {
  manifestUrl: string;
  episodeTitle: string;
  onComplete?: (videoUrl: string) => void;
}

export const FFmpegVideoRenderer = ({ manifestUrl, episodeTitle, onComplete }: FFmpegVideoRendererProps) => {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [manifest, setManifest] = useState<VideoManifest | null>(null);

  useEffect(() => {
    loadFFmpeg();
    loadManifest();
  }, [manifestUrl]);

  const loadManifest = async () => {
    try {
      const response = await fetch(manifestUrl);
      const data = await response.json();
      setManifest(data);
    } catch (error) {
      console.error('Failed to load manifest:', error);
      toast.error('Failed to load video manifest');
    }
  };

  const loadFFmpeg = async () => {
    try {
      const ffmpegInstance = new FFmpeg();
      
      ffmpegInstance.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpegInstance.on('progress', ({ progress: prog }) => {
        setProgress(Math.round(prog * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setFFmpeg(ffmpegInstance);
      setLoaded(true);
      toast.success('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Failed to load video engine');
    }
  };

  const renderVideo = async () => {
    if (!ffmpeg || !manifest) {
      toast.error('Video engine not ready');
      return;
    }

    setRendering(true);
    setProgress(0);

    try {
      toast.info('Downloading scene images...');

      // Download and write all images to FFmpeg filesystem
      for (let i = 0; i < manifest.frames.length; i++) {
        const frame = manifest.frames[i];
        const imageData = await fetchFile(frame.image);
        await ffmpeg.writeFile(`image${i}.png`, imageData);
        setProgress(Math.round(((i + 1) / manifest.frames.length) * 30));
      }

      toast.info('Generating video...');

      // Create concat demuxer file
      let concatContent = '';
      for (let i = 0; i < manifest.frames.length; i++) {
        concatContent += `file 'image${i}.png'\n`;
        concatContent += `duration ${manifest.frames[i].duration}\n`;
      }
      // Add last frame again for ffmpeg concat
      concatContent += `file 'image${manifest.frames.length - 1}.png'\n`;
      
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

      // Run FFmpeg command
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        'output.mp4'
      ]);

      // Read the output video
      const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setVideoUrl(url);
      setProgress(100);
      toast.success('Video rendered successfully!');

      if (onComplete) {
        onComplete(url);
      }
    } catch (error) {
      console.error('Rendering error:', error);
      toast.error('Failed to render video: ' + error.message);
    } finally {
      setRendering(false);
    }
  };

  const downloadVideo = () => {
    if (!videoUrl) return;

    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${episodeTitle.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Video downloaded!');
  };

  if (!manifest) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Video Renderer
        </CardTitle>
        <CardDescription>
          {manifest.frames.length} scenes • {manifest.totalDuration}s • Characters: {manifest.metadata.charactersUsed.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded && (
          <div className="text-center p-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading video engine...</p>
          </div>
        )}

        {loaded && !videoUrl && (
          <Button 
            onClick={renderVideo} 
            disabled={rendering}
            className="w-full"
            size="lg"
          >
            {rendering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rendering... {progress}%
              </>
            ) : (
              <>
                <Film className="w-4 h-4 mr-2" />
                Render Video
              </>
            )}
          </Button>
        )}

        {rendering && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
          </div>
        )}

        {videoUrl && (
          <div className="space-y-4">
            <video 
              src={videoUrl} 
              controls 
              className="w-full rounded-lg"
              poster={manifest.frames[0]?.image}
            />
            <Button 
              onClick={downloadVideo} 
              variant="outline" 
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
