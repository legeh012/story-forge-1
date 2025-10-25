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
    const { frames, episodeId, quality } = await req.json();

    console.log('🔧 FRAME OPTIMIZER BOT ACTIVATED');
    console.log(`📊 Optimizing ${frames.length} frames for ${quality} quality`);

    // Optimize frame durations for smooth playback
    const optimizedFrames = frames.map((frame: any, index: number) => {
      let optimizedDuration = frame.duration;

      // Ensure minimum duration for readability
      if (optimizedDuration < 3) {
        optimizedDuration = 3;
      }

      // Cap maximum duration to prevent boring scenes
      if (optimizedDuration > 8) {
        optimizedDuration = 8;
      }

      // Add slight variation to prevent monotony
      const variation = (Math.random() - 0.5) * 0.5; // ±0.25s variation
      optimizedDuration += variation;

      return {
        ...frame,
        duration: Math.max(3, optimizedDuration), // Ensure minimum 3s
        index,
        optimized: true
      };
    });

    // Calculate optimal frame transitions
    const transitions = calculateTransitions(optimizedFrames);

    // Analyze frame quality needs
    const qualityAnalysis = analyzeQualityNeeds(frames, quality);

    console.log('✅ Frame optimization complete');
    console.log(`📊 Avg duration: ${(optimizedFrames.reduce((sum: number, f: any) => sum + f.duration, 0) / optimizedFrames.length).toFixed(2)}s`);
    console.log(`🎬 Transitions: ${transitions.length} suggested`);

    return new Response(
      JSON.stringify({
        success: true,
        frames: optimizedFrames,
        optimizedCount: optimizedFrames.length,
        transitions,
        qualityAnalysis,
        stats: {
          totalDuration: optimizedFrames.reduce((sum: number, f: any) => sum + f.duration, 0),
          avgDuration: optimizedFrames.reduce((sum: number, f: any) => sum + f.duration, 0) / optimizedFrames.length,
          minDuration: Math.min(...optimizedFrames.map((f: any) => f.duration)),
          maxDuration: Math.max(...optimizedFrames.map((f: any) => f.duration))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Frame optimizer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateTransitions(frames: any[]) {
  const transitions = [];
  
  for (let i = 0; i < frames.length - 1; i++) {
    const currentScene = frames[i].sceneType || 'unknown';
    const nextScene = frames[i + 1].sceneType || 'unknown';
    
    // Suggest transition based on scene types
    let transitionType = 'fade';
    
    if (currentScene === 'confrontation' && nextScene === 'confessional') {
      transitionType = 'quick-cut';
    } else if (currentScene === 'confessional' && nextScene === 'group-drama') {
      transitionType = 'fade';
    } else if (currentScene === 'walk-off' && nextScene === 'entrance') {
      transitionType = 'dissolve';
    }
    
    transitions.push({
      fromFrame: i,
      toFrame: i + 1,
      type: transitionType,
      duration: transitionType === 'quick-cut' ? 0.1 : 0.5
    });
  }
  
  return transitions;
}

function analyzeQualityNeeds(frames: any[], quality: string) {
  const sceneTypes = frames.map((f: any) => f.sceneType).filter(Boolean);
  const hasConfessionals = sceneTypes.includes('confessional');
  const hasAction = sceneTypes.includes('confrontation') || sceneTypes.includes('walk-off');
  
  return {
    recommendedBitrate: quality === 'ultra' ? '8M' : quality === 'premium' ? '6M' : '4M',
    recommendedCRF: quality === 'ultra' ? 18 : quality === 'premium' ? 21 : 23,
    needsDenoising: false, // Premium quality doesn't need denoising
    needsSharpening: hasAction, // Sharpen action scenes
    needsColorGrading: true, // Always apply BET/VH1 color grading
    cinematicMode: hasConfessionals // Enable cinematic mode for confessionals
  };
}
