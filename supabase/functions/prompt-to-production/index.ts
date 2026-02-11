import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub as string;

    const { prompt, seasonCount = 1, episodesPerSeason = 6 } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Prompt must be at least 10 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎬 PROMPT-TO-PRODUCTION: "${prompt.substring(0, 80)}..." → ${seasonCount} season(s), ${episodesPerSeason} eps each`);

    // Step 1: Use Gemini to parse the paragraph into a full production
    const systemPrompt = `You are a world-class TV showrunner and casting director from 2075. Given a paragraph concept, you produce a COMPLETE reality TV production bible.

Return ONLY valid JSON with this exact structure:
{
  "show": {
    "title": "Show title",
    "logline": "One-line pitch",
    "genre": "reality-drama|reality-comedy|docuseries|competition",
    "mood": "dramatic|comedic|inspirational|dark|glamorous",
    "theme": "Core theme in 2-3 words",
    "setting": "Primary location/world"
  },
  "cast": [
    {
      "name": "Character Name",
      "role": "protagonist|antagonist|wildcard|peacemaker|narrator|comic-relief",
      "age": 28,
      "personality": "3-4 word personality",
      "background": "One sentence backstory",
      "goals": "What they want this season",
      "voice_style": "How they speak (accent, tone, catchphrases)",
      "signature_look": "Visual description for rendering"
    }
  ],
  "locations": [
    { "name": "Location Name", "description": "Visual description", "mood": "lighting/atmosphere" }
  ],
  "season": {
    "arc": "Overall season narrative arc",
    "episodes": [
      {
        "number": 1,
        "title": "Episode Title",
        "synopsis": "2-3 sentence synopsis with character names",
        "scenes": [
          {
            "scene_number": 1,
            "location": "Location name",
            "characters": ["Name1", "Name2"],
            "action": "What happens — describe as a camera would see it",
            "emotion": "dominant-emotion",
            "music_cue": "Music style/mood",
            "duration_seconds": 45
          }
        ],
        "cliffhanger": "Episode ending hook"
      }
    ]
  }
}

Rules:
- Create ${episodesPerSeason} episodes
- Each episode needs 4-8 scenes
- Cast should have 4-8 characters
- Make it feel like Netflix/VH1 quality — dramatic, cinematic, binge-worthy
- Characters must have distinct voices and visual identities
- Every episode ends on a cliffhanger or emotional peak
- Locations should be vivid and filmable`;

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a complete production from this concept:\n\n"${prompt}"` }
        ],
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errText.substring(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from response (handle markdown code blocks)
    let production: any;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      production = JSON.parse(jsonMatch[1].trim());
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawContent.substring(0, 500));
      throw new Error('AI produced invalid JSON. Please try again.');
    }

    console.log(`✅ AI generated: "${production.show?.title}" with ${production.cast?.length} cast, ${production.season?.episodes?.length} episodes`);

    // Step 2: Create project in database
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: production.show?.title || 'Untitled Production',
        description: production.show?.logline || prompt,
        genre: production.show?.genre || 'reality-drama',
        mood: production.show?.mood || 'dramatic',
        theme: production.show?.theme || 'Drama',
        status: 'active',
        default_rendering_style: 'photorealistic',
      })
      .select()
      .single();

    if (projectError) throw new Error(`Failed to create project: ${projectError.message}`);
    console.log(`📁 Project created: ${project.id}`);

    // Step 3: Create characters
    const castData = (production.cast || []).map((char: any) => ({
      project_id: project.id,
      user_id: userId,
      name: char.name,
      role: char.role,
      age: char.age || null,
      personality: char.personality,
      background: char.background,
      goals: char.goals,
      metadata: {
        voice_style: char.voice_style,
        signature_look: char.signature_look,
        source: 'prompt-to-production',
      },
    }));

    let characters: any[] = [];
    if (castData.length > 0) {
      const { data: chars, error: charError } = await supabase
        .from('characters')
        .insert(castData)
        .select();
      if (charError) console.error('Character insert error:', charError);
      characters = chars || [];
    }
    console.log(`👥 ${characters.length} characters created`);

    // Step 4: Create episodes with scene storyboards
    const episodes: any[] = [];
    const episodeList = production.season?.episodes || [];

    for (const ep of episodeList) {
      const storyboard = (ep.scenes || []).map((scene: any) => ({
        scene_number: scene.scene_number,
        location: scene.location,
        characters: scene.characters,
        description: scene.action,
        emotion: scene.emotion,
        music_cue: scene.music_cue,
        duration_seconds: scene.duration_seconds || 30,
      }));

      const { data: episode, error: epError } = await supabase
        .from('episodes')
        .insert({
          project_id: project.id,
          user_id: userId,
          episode_number: ep.number,
          season: 1,
          title: ep.title,
          synopsis: ep.synopsis,
          script: `${ep.synopsis}\n\nCliffhanger: ${ep.cliffhanger || 'To be continued...'}`,
          storyboard,
          status: 'draft',
          video_status: 'not_started',
        })
        .select()
        .single();

      if (epError) {
        console.error(`Episode ${ep.number} error:`, epError);
      } else {
        episodes.push(episode);
      }
    }
    console.log(`📺 ${episodes.length} episodes created`);

    return new Response(
      JSON.stringify({
        success: true,
        production: {
          show: production.show,
          project,
          characters,
          episodes,
          locations: production.locations || [],
          seasonArc: production.season?.arc,
        },
        message: `🎬 "${production.show?.title}" is ready — ${characters.length} cast, ${episodes.length} episodes, film-grade production`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Prompt-to-Production error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
