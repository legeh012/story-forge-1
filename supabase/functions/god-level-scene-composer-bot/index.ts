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
    const { scenes, frames, episodeId } = await req.json();

    console.log('🎬 GOD-LEVEL SCENE COMPOSER BOT ACTIVATED');
    console.log(`📊 Composing ${scenes?.length || 0} scenes with ${frames.length} frames`);

    // Analyze scene flow and pacing
    const sceneAnalysis = analyzeSceneFlow(frames);
    
    // Optimize scene timing for maximum engagement
    const optimizedTiming = optimizeSceneTiming(frames, sceneAnalysis);
    
    // Calculate dramatic arcs
    const dramaticArcs = calculateDramaticArcs(frames);
    
    // Generate scene transitions
    const transitionPoints = identifyTransitionPoints(frames);

    console.log('✅ Scene composition optimized');
    console.log(`📊 Dramatic intensity: ${dramaticArcs.averageIntensity.toFixed(2)}`);
    console.log(`🎭 Transition points: ${transitionPoints.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sceneAnalysis,
        optimizedTiming,
        dramaticArcs,
        transitionPoints,
        recommendations: {
          pacing: sceneAnalysis.pacing,
          emotionalFlow: dramaticArcs.flow,
          engagementScore: sceneAnalysis.engagementScore
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scene composer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function analyzeSceneFlow(frames: any[]) {
  const sceneTypes = frames.map(f => f.sceneType || 'unknown');
  const hasConfessionals = sceneTypes.filter(s => s === 'confessional').length;
  const hasConfrontations = sceneTypes.filter(s => s === 'confrontation').length;
  const hasDrama = sceneTypes.filter(s => s === 'group-drama').length;

  return {
    totalScenes: frames.length,
    confessionals: hasConfessionals,
    confrontations: hasConfrontations,
    groupDrama: hasDrama,
    pacing: hasConfrontations > 2 ? 'fast' : 'moderate',
    engagementScore: (hasConfrontations * 30 + hasConfessionals * 20 + hasDrama * 25) / frames.length
  };
}

function optimizeSceneTiming(frames: any[], analysis: any) {
  return frames.map((frame, index) => {
    let optimalDuration = frame.duration || 5;

    // Confessionals can be longer for emotional impact
    if (frame.sceneType === 'confessional') {
      optimalDuration = Math.min(optimalDuration * 1.2, 7);
    }

    // Confrontations should be quick and punchy
    if (frame.sceneType === 'confrontation') {
      optimalDuration = Math.min(optimalDuration * 0.9, 5);
    }

    // Group drama needs breathing room
    if (frame.sceneType === 'group-drama') {
      optimalDuration = Math.min(optimalDuration * 1.1, 6);
    }

    return {
      frameIndex: index,
      originalDuration: frame.duration,
      optimalDuration: Math.max(3, optimalDuration),
      reasoning: `Optimized for ${frame.sceneType} scene type`
    };
  });
}

function calculateDramaticArcs(frames: any[]) {
  const intensityMap: Record<string, number> = {
    'confrontation': 0.9,
    'walk-off': 0.8,
    'group-drama': 0.7,
    'confessional': 0.6,
    'entrance': 0.5,
    'unknown': 0.4
  };

  const arcs = frames.map((frame, index) => ({
    frameIndex: index,
    sceneType: frame.sceneType || 'unknown',
    intensity: intensityMap[frame.sceneType || 'unknown'] || 0.4,
    position: index / frames.length
  }));

  const avgIntensity = arcs.reduce((sum, arc) => sum + arc.intensity, 0) / arcs.length;

  return {
    arcs,
    averageIntensity: avgIntensity,
    flow: avgIntensity > 0.6 ? 'high-energy' : 'balanced',
    peakMoment: arcs.reduce((max, arc) => arc.intensity > max.intensity ? arc : max, arcs[0])
  };
}

function identifyTransitionPoints(frames: any[]) {
  const transitions = [];
  
  for (let i = 0; i < frames.length - 1; i++) {
    const current = frames[i].sceneType || 'unknown';
    const next = frames[i + 1].sceneType || 'unknown';
    
    let transitionType = 'fade';
    let duration = 0.5;
    
    // Dramatic transitions
    if (current === 'confrontation' && next === 'confessional') {
      transitionType = 'quick-cut';
      duration = 0.1;
    } else if (current === 'confessional' && next === 'group-drama') {
      transitionType = 'dissolve';
      duration = 0.7;
    } else if (current === 'walk-off' && next === 'entrance') {
      transitionType = 'fade-black';
      duration = 1.0;
    } else if (current === 'group-drama' && next === 'confrontation') {
      transitionType = 'smash-cut';
      duration = 0.05;
    }
    
    transitions.push({
      fromIndex: i,
      toIndex: i + 1,
      fromScene: current,
      toScene: next,
      type: transitionType,
      duration
    });
  }
  
  return transitions;
}
