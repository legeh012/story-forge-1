import React, { useState, useCallback } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Player } from '@remotion/player';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface YouTubeVideoPlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  showControls?: boolean;
}

// YouTube embed component for Remotion composition
const YouTubeComposition: React.FC<{ videoId: string }> = ({ videoId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'hsl(240 10% 3.9%)' }}>
      <div style={{ opacity }} className="w-full h-full flex items-center justify-center">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
    </AbsoluteFill>
  );
};

// Intro animation sequence
const IntroSequence: React.FC<{ title?: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.3, fps * 0.8, fps], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  const titleScale = interpolate(frame, [0, fps * 0.3], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(frame, [0, fps * 0.3], [20, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale}) translateY(${titleY}px)`,
        }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
          {title || 'Now Playing'}
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
      </div>
    </AbsoluteFill>
  );
};

// Main composition that combines intro and video
const VideoComposition: React.FC<{ videoId: string; title?: string }> = ({ videoId, title }) => {
  const { fps } = useVideoConfig();
  const introDuration = fps * 1.5; // 1.5 second intro

  return (
    <>
      <Sequence from={0} durationInFrames={introDuration}>
        <IntroSequence title={title} />
      </Sequence>
      <Sequence from={introDuration}>
        <YouTubeComposition videoId={videoId} />
      </Sequence>
    </>
  );
};

export const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({
  videoId,
  title,
  autoPlay = false,
  className,
  aspectRatio = '16:9',
  showControls = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio];

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    const playerElement = document.querySelector('.remotion-player');
    if (playerElement && document.fullscreenEnabled) {
      playerElement.requestFullscreen?.();
    }
  }, []);

  return (
    <div className={cn('relative group rounded-xl overflow-hidden bg-card border border-border shadow-lg', className)}>
      {/* Video Player */}
      <div className={cn('w-full', aspectRatioClass)}>
        <Player
          component={VideoComposition}
          inputProps={{ videoId, title }}
          durationInFrames={30 * 60 * 10} // 10 minutes at 30fps
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          autoPlay={autoPlay}
          loop
          className="remotion-player"
        />
      </div>

      {/* Custom Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground hover:scale-110 transition-transform"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Progress Bar */}
            <div className="w-full">
              <Slider
                value={[currentTime]}
                max={100}
                step={0.1}
                className="cursor-pointer"
                onValueChange={(value) => setCurrentTime(value[0])}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-foreground hover:text-primary">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                  <SkipForward className="w-5 h-5" />
                </Button>
                
                {/* Volume Control */}
                <div className="flex items-center gap-2 ml-2">
                  <Button variant="ghost" size="sm" onClick={handleMuteToggle} className="text-foreground hover:text-primary">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {title && (
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">{title}</span>
                )}
                <Button variant="ghost" size="sm" onClick={handleFullscreen} className="text-foreground hover:text-primary">
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoPlayer;
