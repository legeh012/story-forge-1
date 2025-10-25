import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtlistRequest {
  episodeId: string;
  mode: 'full_production' | 'scene_analysis' | 'color_grade' | 'smart_editing' | 'content_optimization';
  customPrompt?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { episodeId, mode, customPrompt } = await req.json() as ArtlistRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log(`🎨 Artlist Advanced Bot: Mode ${mode} for episode ${episodeId}`);

    // Fetch episode data
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*, projects(*)')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) throw new Error('Episode not found');

    const results: any = {
      mode,
      episodeId,
      timestamp: new Date().toISOString(),
      enhancements: {},
    };

    // Mode-specific AI operations
    switch (mode) {
      case 'full_production': {
        console.log('🎬 Running full production pipeline...');
        
        // Scene Analysis
        const sceneAnalysis = await analyzeScenes(LOVABLE_API_KEY, episode);
        results.enhancements.sceneAnalysis = sceneAnalysis;

        // Smart Editing
        const editingSuggestions = await generateEditingSuggestions(LOVABLE_API_KEY, episode, sceneAnalysis);
        results.enhancements.editing = editingSuggestions;

        // Color Grading
        const colorGrade = await generateColorGrading(LOVABLE_API_KEY, episode);
        results.enhancements.colorGrade = colorGrade;

        // Content Optimization
        const optimization = await optimizeContent(LOVABLE_API_KEY, episode);
        results.enhancements.optimization = optimization;

        break;
      }

      case 'scene_analysis': {
        const analysis = await analyzeScenes(LOVABLE_API_KEY, episode);
        results.enhancements.sceneAnalysis = analysis;
        break;
      }

      case 'color_grade': {
        const colorGrade = await generateColorGrading(LOVABLE_API_KEY, episode);
        results.enhancements.colorGrade = colorGrade;
        break;
      }

      case 'smart_editing': {
        const sceneAnalysis = await analyzeScenes(LOVABLE_API_KEY, episode);
        const editing = await generateEditingSuggestions(LOVABLE_API_KEY, episode, sceneAnalysis);
        results.enhancements.editing = editing;
        break;
      }

      case 'content_optimization': {
        const optimization = await optimizeContent(LOVABLE_API_KEY, episode);
        results.enhancements.optimization = optimization;
        break;
      }
    }

    // Apply custom prompt if provided
    if (customPrompt) {
      const customEnhancement = await applyCustomPrompt(LOVABLE_API_KEY, episode, customPrompt);
      results.enhancements.custom = customEnhancement;
    }

    // Update episode with enhancements
    const updatedMetadata = {
      ...episode.metadata,
      artlist_enhancements: results.enhancements,
      last_artlist_run: new Date().toISOString(),
    };

    await supabase
      .from('episodes')
      .update({ metadata: updatedMetadata })
      .eq('id', episodeId);

    // Log activity
    await supabase.from('bot_activities').insert({
      bot_type: 'artlist-advanced',
      episode_id: episodeId,
      status: 'completed',
      metadata: { mode, results },
      user_id: user.id,
    });

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Artlist Advanced Bot completed ${mode} mode successfully`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Artlist Advanced Bot Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeScenes(apiKey: string, episode: any) {
  const prompt = `Analyze this reality TV episode for optimal scene structure:

Title: ${episode.title}
Synopsis: ${episode.synopsis}
Script: ${episode.script || 'Not provided'}

Provide advanced scene analysis including:
1. Scene breakdown with timestamps
2. Emotional arc mapping
3. Pacing recommendations
4. Transition suggestions
5. Key moment identification
6. Audience retention points

Return as JSON with structure: {
  scenes: [{sceneNumber, startTime, endTime, emotionalTone, pacingScore, transitions, keyMoments}],
  overallArc: string,
  recommendations: string[]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Scene analysis failed');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

async function generateEditingSuggestions(apiKey: string, episode: any, sceneAnalysis: any) {
  const prompt = `Based on this scene analysis, provide smart editing suggestions:

Episode: ${episode.title}
Scene Analysis: ${JSON.stringify(sceneAnalysis)}

Generate advanced editing recommendations:
1. Cut timing precision
2. B-roll insertion points
3. Music cue placements
4. Sound effect triggers
5. Visual effect opportunities
6. Pacing adjustments

Return as JSON: {
  cuts: [{time, type, reason}],
  bRoll: [{time, description, duration}],
  musicCues: [{time, mood, intensity}],
  effects: [{time, type, parameters}],
  pacingAdjustments: string[]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Editing suggestions failed');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

async function generateColorGrading(apiKey: string, episode: any) {
  const prompt = `Create professional color grading recommendations for this reality TV episode:

Title: ${episode.title}
Genre: Reality TV / Drama
Mood: ${episode.metadata?.mood || 'Dramatic'}

Provide advanced color grading specifications:
1. Primary color scheme
2. Secondary color accents
3. Shadows/midtones/highlights adjustments
4. LUT recommendations
5. Scene-specific grading
6. Emotional color mapping

Return as JSON: {
  primaryScheme: {base, accent1, accent2},
  adjustments: {shadows, midtones, highlights, saturation, contrast},
  lutRecommendations: string[],
  sceneGrades: [{sceneNumber, colorProfile, emotionalIntent}],
  technicalSpecs: {colorSpace, gamma, blackLevel, whiteLevel}
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Color grading failed');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

async function optimizeContent(apiKey: string, episode: any) {
  const prompt = `Optimize this content for maximum engagement and virality:

Episode: ${episode.title}
Synopsis: ${episode.synopsis}
Current Script: ${episode.script || 'Not provided'}

Provide comprehensive optimization:
1. Hook strength analysis (0-100)
2. Pacing optimization
3. Cliffhanger placement
4. Emotional beat distribution
5. Audience retention strategy
6. Platform-specific adaptations (TikTok, YouTube, Instagram)
7. Viral moment identification

Return as JSON: {
  hookScore: number,
  optimizedPacing: string,
  cliffhangers: [{time, description, intensity}],
  emotionalBeats: [{time, emotion, intensity}],
  retentionStrategy: string[],
  platformAdaptations: {tiktok: string, youtube: string, instagram: string},
  viralMoments: [{time, description, probability}],
  recommendations: string[]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Content optimization failed');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

async function applyCustomPrompt(apiKey: string, episode: any, customPrompt: string) {
  const prompt = `Custom enhancement request for reality TV episode:

Episode: ${episode.title}
Synopsis: ${episode.synopsis}

Custom Request: ${customPrompt}

Provide detailed implementation plan and results as JSON: {
  analysis: string,
  implementation: string[],
  expectedOutcome: string,
  technicalRequirements: string[]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Custom prompt failed');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}
