import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoGenerationRequest {
  episodeId: string;
  scenes: Array<{
    description: string;
    duration: number;
    dialogue?: string;
  }>;
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

    const { episodeId, scenes }: VideoGenerationRequest = await req.json();

    if (!episodeId || !scenes || scenes.length === 0) {
      throw new Error('Episode ID and scenes are required');
    }

    console.log(`Starting video generation for episode ${episodeId} with ${scenes.length} scenes`);

    // Update episode status to rendering
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId)
      .eq('user_id', user.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Generate images for each scene using Lovable AI
    const sceneFrames: Array<{ sceneIndex: number; imageData: string }> = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      console.log(`Generating frame ${i + 1}/${scenes.length}: ${scene.description}`);

      // Generate photorealistic scene image
      const imagePrompt = `Photorealistic, Netflix-grade cinematic scene: ${scene.description}. 
Professional lighting, film quality, 4K resolution, cinematic composition.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        throw new Error(`Image generation failed for scene ${i + 1}`);
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error(`No image generated for scene ${i + 1}`);
      }

      sceneFrames.push({
        sceneIndex: i,
        imageData: imageUrl
      });
    }

    // For now, we'll store the scene frames and create a slideshow-style video
    // In a production environment, you'd use a video API service like RunwayML or Pika
    
    // Upload frames to Supabase Storage
    const frameUrls: string[] = [];
    
    for (const frame of sceneFrames) {
      // Convert base64 to blob
      const base64Data = frame.imageData.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${episodeId}/frame_${frame.sceneIndex}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('episode-videos')
        .upload(fileName, binaryData, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`Failed to upload frame ${frame.sceneIndex}:`, uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('episode-videos')
        .getPublicUrl(fileName);

      frameUrls.push(publicUrl);
    }

    // Create video metadata
    const videoMetadata = {
      episodeId,
      scenes: scenes.map((scene, i) => ({
        ...scene,
        frameUrl: frameUrls[i]
      })),
      totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      frameCount: sceneFrames.length,
      generatedAt: new Date().toISOString()
    };

    // Update episode with completed video info
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_render_completed_at: new Date().toISOString(),
        video_url: frameUrls[0], // First frame as thumbnail for now
        storyboard: videoMetadata
      })
      .eq('id', episodeId)
      .eq('user_id', user.id);

    console.log(`Video generation completed for episode ${episodeId}`);

    return new Response(
      JSON.stringify({
        success: true,
        episodeId,
        frameUrls,
        videoMetadata,
        message: 'Video frames generated successfully. Scene images are ready for playback.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
