import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frames, scenes, style = 'reality-tv' } = await req.json();

    console.log('✨ GOD-LEVEL EFFECTS BOT ACTIVATED');
    console.log(`🎯 Style: ${style.toUpperCase()}`);
    console.log(`🎬 Adding effects to ${frames.length} frames`);

    // Visual effects recommendations
    const visualEffects = getVisualEffects(frames, style);
    
    // Motion graphics overlays
    const motionGraphics = getMotionGraphics(frames);
    
    // Reality TV specific effects
    const realityTVEffects = getRealityTVEffects(frames);
    
    // Zoom and pan effects
    const cameraEffects = getCameraEffects(frames);

    console.log('✅ Effects configured');
    console.log(`✨ Visual effects: ${visualEffects.length}`);
    console.log(`🎬 Motion graphics: ${motionGraphics.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        visualEffects,
        motionGraphics,
        realityTVEffects,
        cameraEffects,
        ffmpegEffects: generateFFmpegEffects({
          visual: visualEffects,
          camera: cameraEffects
        })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Effects bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getVisualEffects(frames: any[], style: string) {
  return frames.map((frame, index) => {
    const sceneType = frame.sceneType || 'unknown';
    const effects = [];

    // Add glow effect for dramatic moments
    if (sceneType === 'confrontation' || sceneType === 'walk-off') {
      effects.push({
        type: 'glow',
        intensity: 0.3,
        color: 'warm'
      });
    }

    // Add vignette for confessionals
    if (sceneType === 'confessional') {
      effects.push({
        type: 'vignette',
        intensity: 0.4,
        falloff: 0.6
      });
    }

    // Add subtle film grain for authenticity
    effects.push({
      type: 'grain',
      intensity: 0.15,
      size: 1.5
    });

    // Add sharpening
    effects.push({
      type: 'sharpen',
      amount: 1.2
    });

    return {
      frameIndex: index,
      sceneType,
      effects
    };
  });
}

function getMotionGraphics(frames: any[]) {
  const graphics: any[] = [];

  frames.forEach((frame, index) => {
    const sceneType = frame.sceneType || 'unknown';

    // Add character name lower thirds for confessionals
    if (sceneType === 'confessional') {
      graphics.push({
        type: 'lower-third',
        frameIndex: index,
        animation: 'slide-in',
        duration: 3,
        style: 'premium-reality-tv'
      });
    }

    // Add dramatic text overlays for confrontations
    if (sceneType === 'confrontation') {
      graphics.push({
        type: 'tension-text',
        frameIndex: index,
        animation: 'pulse',
        duration: 2,
        style: 'dramatic'
      });
    }
  });

  return graphics;
}

function getRealityTVEffects(frames: any[]) {
  return {
    flashbacks: {
      enabled: false,
      style: 'quick-flash'
    },
    reactions: {
      enabled: true,
      style: 'dramatic-zoom'
    },
    soundEffects: {
      dramaBoom: true,
      gasps: true,
      recordScratch: false
    },
    overlays: {
      thoughtBubbles: false,
      emojis: false,
      flashingText: true
    }
  };
}

function getCameraEffects(frames: any[]) {
  return frames.map((frame, index) => {
    const sceneType = frame.sceneType || 'unknown';
    let effect = null;

    switch (sceneType) {
      case 'confrontation':
        effect = {
          type: 'dramatic-zoom',
          startScale: 1.0,
          endScale: 1.15,
          duration: frame.duration || 5,
          easing: 'ease-in'
        };
        break;
      case 'confessional':
        effect = {
          type: 'slow-push',
          startScale: 1.0,
          endScale: 1.08,
          duration: frame.duration || 5,
          easing: 'linear'
        };
        break;
      case 'walk-off':
        effect = {
          type: 'pull-back',
          startScale: 1.1,
          endScale: 1.0,
          duration: frame.duration || 5,
          easing: 'ease-out'
        };
        break;
      case 'entrance':
        effect = {
          type: 'reveal-zoom',
          startScale: 1.2,
          endScale: 1.0,
          duration: frame.duration || 5,
          easing: 'ease-out'
        };
        break;
    }

    return {
      frameIndex: index,
      sceneType,
      effect
    };
  });
}

function generateFFmpegEffects(settings: any) {
  const filters = [];

  // Add subtle film grain
  filters.push('noise=alls=10:allf=t');

  // Add sharpening
  filters.push('unsharp=5:5:1.2:5:5:0.0');

  // Add slight glow effect
  filters.push('gblur=sigma=2:steps=2');

  return filters.join(',');
}
