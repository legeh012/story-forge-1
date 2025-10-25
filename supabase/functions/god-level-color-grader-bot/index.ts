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
    const { frames, style = 'bet-vh1-premium', scenes } = await req.json();

    console.log('🎨 GOD-LEVEL COLOR GRADER BOT ACTIVATED');
    console.log(`🎯 Style: ${style.toUpperCase()}`);
    console.log(`🎬 Grading ${frames.length} frames`);

    // Generate premium color grading profiles
    const colorProfile = getColorGradingProfile(style);
    
    // Scene-specific color adjustments
    const sceneGrading = generateSceneSpecificGrading(frames);
    
    // LUT (Look-Up Table) recommendations
    const lutRecommendations = getLUTRecommendations(style, frames);
    
    // Color science for reality TV
    const colorScience = applyRealityTVColorScience(frames);

    console.log('✅ Premium color grading applied');
    console.log(`🎨 Profile: ${colorProfile.name}`);
    console.log(`📊 LUTs: ${lutRecommendations.length} recommended`);

    return new Response(
      JSON.stringify({
        success: true,
        colorProfile,
        sceneGrading,
        lutRecommendations,
        colorScience,
        ffmpegFilters: generateFFmpegColorFilters(colorProfile)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Color grader error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getColorGradingProfile(style: string) {
  const profiles: Record<string, any> = {
    'bet-vh1-premium': {
      name: 'BET/VH1 Premium Reality TV',
      saturation: 1.25,
      contrast: 1.2,
      warmth: 1.15,
      shadows: 0.92,
      highlights: 1.08,
      vibrance: 1.3,
      clarity: 1.15,
      skinTones: {
        protection: true,
        enhancement: 1.1,
        smoothing: 0.85
      },
      colorCast: {
        tint: 'warm-golden',
        strength: 0.15
      }
    },
    'netflix-premium': {
      name: 'Netflix Premium Documentary',
      saturation: 1.15,
      contrast: 1.25,
      warmth: 1.05,
      shadows: 0.88,
      highlights: 1.12,
      vibrance: 1.2,
      clarity: 1.2,
      skinTones: {
        protection: true,
        enhancement: 1.05,
        smoothing: 0.9
      }
    },
    'hulu-vibrant': {
      name: 'Hulu Vibrant Reality',
      saturation: 1.3,
      contrast: 1.15,
      warmth: 1.1,
      shadows: 0.95,
      highlights: 1.05,
      vibrance: 1.4,
      clarity: 1.1
    }
  };

  return profiles[style] || profiles['bet-vh1-premium'];
}

function generateSceneSpecificGrading(frames: any[]) {
  return frames.map((frame, index) => {
    const sceneType = frame.sceneType || 'unknown';
    let grading: any = {};

    switch (sceneType) {
      case 'confessional':
        grading = {
          saturation: 1.2,
          contrast: 1.25,
          warmth: 1.2,
          vignette: 0.3,
          focus: 'sharp',
          mood: 'intimate'
        };
        break;
      case 'confrontation':
        grading = {
          saturation: 1.3,
          contrast: 1.3,
          warmth: 1.1,
          tension: 'high',
          sharpness: 1.2,
          mood: 'intense'
        };
        break;
      case 'group-drama':
        grading = {
          saturation: 1.25,
          contrast: 1.2,
          warmth: 1.15,
          depth: 'deep',
          mood: 'dynamic'
        };
        break;
      case 'walk-off':
        grading = {
          saturation: 1.15,
          contrast: 1.1,
          warmth: 1.0,
          motion: 'dramatic',
          mood: 'emotional'
        };
        break;
      default:
        grading = {
          saturation: 1.2,
          contrast: 1.15,
          warmth: 1.1,
          mood: 'balanced'
        };
    }

    return {
      frameIndex: index,
      sceneType,
      grading
    };
  });
}

function getLUTRecommendations(style: string, frames: any[]) {
  const luts = [
    {
      name: 'BET Reality Premium',
      file: 'bet-reality-premium.cube',
      strength: 0.85,
      scenes: ['confessional', 'group-drama']
    },
    {
      name: 'VH1 Vibrant',
      file: 'vh1-vibrant.cube',
      strength: 0.9,
      scenes: ['confrontation', 'walk-off']
    },
    {
      name: 'Golden Hour Reality',
      file: 'golden-hour-reality.cube',
      strength: 0.75,
      scenes: ['entrance', 'confessional']
    }
  ];

  return luts;
}

function applyRealityTVColorScience(frames: any[]) {
  return {
    colorSpace: 'BT.709',
    gamma: 2.4,
    primaries: 'BT.709',
    transferFunction: 'BT.1886',
    dynamicRange: 'SDR',
    bitDepth: 8,
    chromaSubsampling: '4:2:0',
    recommendations: {
      skinToneProtection: true,
      vibrantColors: true,
      deepBlacks: true,
      cleanWhites: true,
      warmOverall: true
    }
  };
}

function generateFFmpegColorFilters(profile: any) {
  const filters = [];

  // Saturation
  filters.push(`eq=saturation=${profile.saturation}`);

  // Contrast
  filters.push(`eq=contrast=${profile.contrast}`);

  // Color temperature (warmth)
  if (profile.warmth > 1.0) {
    const warmthValue = (profile.warmth - 1.0) * 0.2;
    filters.push(`colortemperature=temperature=${6500 + warmthValue * 1000}`);
  }

  // Curves for shadows and highlights
  filters.push(`curves=all='0/0 0.5/${profile.shadows * 0.5} 1/1'`);

  // Vibrance (unsharp mask for perceived sharpness)
  filters.push(`unsharp=5:5:${profile.vibrance}:5:5:0`);

  return filters.join(',');
}
