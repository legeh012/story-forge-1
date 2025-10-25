import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { season, projectId } = await req.json();

    if (!season || !projectId) {
      throw new Error('Season and projectId are required');
    }

    console.log(`🎬 Generating Season ${season} trailer...`);

    // Get all episodes from this season
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('episode_number, title, synopsis')
      .eq('season', season)
      .order('episode_number', { ascending: true });

    if (episodesError) throw episodesError;

    if (!episodes || episodes.length === 0) {
      throw new Error(`No episodes found for season ${season}`);
    }

    // Create dramatic trailer script
    const trailerPrompt = `Create a 60-second PREMIUM BET/VH1 REALITY TV TRAILER for Season ${season} of "Khat and Karma" - a Somali reality TV show.

Episodes in this season:
${episodes.map(ep => `Episode ${ep.episode_number}: ${ep.title}\n${ep.synopsis}`).join('\n\n')}

Generate 8-10 DRAMATIC TRAILER SCENES featuring:
- Luxury settings (penthouses, hotels, restaurants)
- Designer fashion and gold jewelry
- Explosive confrontations and tea-spilling moments
- Cultural authenticity (hijabs, diracs, Somali aunties)
- Viral-worthy quotes and cliffhangers

Each scene should be 5-7 seconds. Use fast cuts, dramatic music cues, and ending with "Coming this season on Khat & Karma"

Format as JSON array of scenes with:
{
  "scenes": [
    {
      "description": "photorealistic scene description",
      "duration": 6,
      "dialogue": "explosive quote or voiceover"
    }
  ]
}`;

    // Call Lovable AI to generate trailer scenes
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a BET/VH1 reality TV trailer producer. Create dramatic, viral-worthy trailer scenes with premium production value. Return ONLY valid JSON.'
          },
          { role: 'user', content: trailerPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    const trailerData = JSON.parse(jsonMatch[0]);
    const scenes = trailerData.scenes || [];

    console.log(`✅ Generated ${scenes.length} trailer scenes`);

    // Generate photorealistic images for each scene using Lovable AI image generation
    const generatedFrames = [];
    
    for (let i = 0; i < Math.min(scenes.length, 10); i++) {
      const scene = scenes[i];
      
      const imagePrompt = `PREMIUM BET/VH1 REALITY TV TRAILER SHOT - ${scene.description}

CRITICAL REQUIREMENTS:
- PHOTOREALISTIC, not cartoon or anime
- Netflix-grade cinematography
- Luxury settings with designer fashion
- Authentic Somali women in hijabs/diracs
- Perfect human anatomy (5 fingers per hand)
- Natural facial expressions
- Professional lighting and composition
- 16:9 aspect ratio

Style: Documentary reality TV, cinematic, high-end production`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: imagePrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          // Upload to storage
          const base64Data = imageUrl.split(',')[1];
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const fileName = `season-${season}-trailer-frame-${i}.png`;
          const filePath = `trailers/season-${season}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('episode-videos')
            .upload(filePath, imageBuffer, {
              contentType: 'image/png',
              upsert: true
            });
          
          if (!uploadError) {
            const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${filePath}`;
            generatedFrames.push({
              url: publicUrl,
              duration: scene.duration || 6,
              dialogue: scene.dialogue
            });
          }
        }
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create trailer manifest
    const trailerManifest = {
      type: 'season-trailer',
      season,
      projectId,
      frames: generatedFrames,
      totalDuration: generatedFrames.reduce((sum, f) => sum + f.duration, 0),
      metadata: {
        episodeCount: episodes.length,
        generatedAt: new Date().toISOString()
      }
    };

    // Upload manifest
    const manifestPath = `trailers/season-${season}/trailer-manifest.json`;
    const { error: manifestError } = await supabase.storage
      .from('episode-videos')
      .upload(manifestPath, JSON.stringify(trailerManifest), {
        contentType: 'application/json',
        upsert: true
      });

    if (manifestError) throw manifestError;

    const trailerUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${manifestPath}`;

    console.log(`✅ Season ${season} trailer created: ${trailerUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        trailerUrl,
        framesGenerated: generatedFrames.length,
        message: `Season ${season} trailer created successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Trailer generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
