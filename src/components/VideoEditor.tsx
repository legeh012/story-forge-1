import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, Pause, RotateCcw, Download, Zap, Image as ImageIcon,
  Video, Mic, Music, Type, Sparkles, Loader2, Film
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Canvas as FabricCanvas, IText, Image as FabricImage } from 'fabric';

interface Scene {
  id: string;
  duration: number;
  background: string;
  elements: any[];
  voiceover?: string;
  music?: string;
  transition?: string;
}

interface VideoEditorProps {
  episodeId: string;
  scenes: Scene[];
  onScenesUpdate: (scenes: Scene[]) => void;
}

export const VideoEditor = ({ episodeId, scenes, onScenesUpdate }: VideoEditorProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [fps] = useState(30);
  const [resolution] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: resolution.width,
      height: resolution.height,
      backgroundColor: '#000000',
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [resolution]);

  useEffect(() => {
    if (fabricCanvas && scenes[currentScene]) {
      renderScene(scenes[currentScene]);
    }
  }, [currentScene, fabricCanvas, scenes]);

  const renderScene = async (scene: Scene) => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = scene.background || '#000000';

    // Add scene elements
    for (const element of scene.elements) {
      if (element.type === 'text') {
        const text = new IText(element.content, {
          left: element.x || 100,
          top: element.y || 100,
          fontSize: element.fontSize || 48,
          fill: element.color || '#ffffff',
          fontFamily: element.fontFamily || 'Arial',
          fontWeight: element.fontWeight || 'bold',
        });
        fabricCanvas.add(text);
      } else if (element.type === 'image' && element.url) {
        try {
          const img = await FabricImage.fromURL(element.url);
          img.set({
            left: element.x || 0,
            top: element.y || 0,
            scaleX: element.scale || 1,
            scaleY: element.scale || 1,
          });
          fabricCanvas.add(img);
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
    }

    fabricCanvas.renderAll();
  };

  const captureFrame = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!fabricCanvas) {
        resolve('');
        return;
      }
      
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      resolve(dataURL);
    });
  };

  const generateVideoFrames = async () => {
    setIsRendering(true);
    const frames: string[] = [];

    try {
      for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
        const scene = scenes[sceneIdx];
        setCurrentScene(sceneIdx);
        await renderScene(scene);

        // Generate frames for scene duration
        const frameCount = Math.ceil(scene.duration * fps);
        
        for (let i = 0; i < frameCount; i++) {
          const frame = await captureFrame();
          frames.push(frame);
          setPlaybackTime(i / fps);
        }
      }

      toast({
        title: "✅ Frames Generated",
        description: `Created ${frames.length} frames at ${fps}fps`,
      });

      return frames;

    } catch (error) {
      toast({
        title: "Frame Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsRendering(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setPlaybackTime(0);
    setCurrentScene(0);
    setIsPlaying(false);
  };

  const addTextToScene = () => {
    const newScenes = [...scenes];
    if (!newScenes[currentScene].elements) {
      newScenes[currentScene].elements = [];
    }
    
    newScenes[currentScene].elements.push({
      type: 'text',
      content: 'Edit Me',
      x: 100,
      y: 100,
      fontSize: 48,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    });

    onScenesUpdate(newScenes);
    renderScene(newScenes[currentScene]);
  };

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <Card className="p-6 bg-black border-primary/20">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
          
          {isRendering && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-xl font-bold">Rendering Frames...</p>
                <p className="text-sm text-white/60 mt-2">Scene {currentScene + 1} of {scenes.length}</p>
              </div>
            </div>
          )}

          {/* Scene Info Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-sm font-semibold">Scene {currentScene + 1} / {scenes.length}</p>
            <p className="text-xs text-white/80">{playbackTime.toFixed(2)}s / {totalDuration.toFixed(2)}s</p>
          </div>
        </div>
      </Card>

      {/* Timeline Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlayPause}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isPlaying ? (
                <><Pause className="h-5 w-5 mr-2" /> Pause</>
              ) : (
                <><Play className="h-5 w-5 mr-2" /> Play</>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" /> Reset
            </Button>

            <Button
              onClick={generateVideoFrames}
              disabled={isRendering}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isRendering ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Rendering...</>
              ) : (
                <><Film className="h-5 w-5 mr-2" /> Generate Frames</>
              )}
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-2">
            <Label>Timeline</Label>
            <Slider
              value={[playbackTime]}
              max={totalDuration}
              step={0.1}
              onValueChange={([value]) => setPlaybackTime(value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Scene Editor */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Scene Editor
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={addTextToScene}
            variant="outline"
            className="border-primary/30"
          >
            <Type className="h-4 w-4 mr-2" />
            Add Text
          </Button>

          <Button
            variant="outline"
            className="border-accent/30"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add Image
          </Button>

          <Button
            variant="outline"
            className="border-primary-glow/30"
          >
            <Mic className="h-4 w-4 mr-2" />
            Add Voice
          </Button>

          <Button
            variant="outline"
            className="border-purple-500/30"
          >
            <Music className="h-4 w-4 mr-2" />
            Add Music
          </Button>
        </div>

        {/* Scene Duration Control */}
        <div className="mt-6 space-y-2">
          <Label>Scene Duration: {scenes[currentScene]?.duration || 0}s</Label>
          <Slider
            value={[scenes[currentScene]?.duration || 3]}
            max={30}
            step={0.5}
            onValueChange={([value]) => {
              const newScenes = [...scenes];
              newScenes[currentScene].duration = value;
              onScenesUpdate(newScenes);
            }}
          />
        </div>
      </Card>

      {/* Scene List */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Scenes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setCurrentScene(idx)}
              className={`p-4 rounded-lg border-2 transition-all ${
                currentScene === idx
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-semibold">Scene {idx + 1}</p>
              <p className="text-xs text-muted-foreground">{scene.duration}s</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
