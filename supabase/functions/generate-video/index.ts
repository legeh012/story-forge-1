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

    // Update status to rendering
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId)
      .eq('user_id', user.id);

    // Return immediately while processing in background for better scalability
    const backgroundTask = async () => {
      try {
        await processVideoGeneration(supabase, episodeId, scenes, user.id);
      } catch (error) {
        console.error('Background video generation error:', error);
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', episodeId)
          .eq('user_id', user.id);
      }
    };

    // Start background processing (function will continue after response)
    backgroundTask();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started in background',
        episodeId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202, // Accepted
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

async function processVideoGeneration(
  supabase: any,
  episodeId: string,
  scenes: Array<{ description: string; duration: number; dialogue?: string }>,
  userId: string
) {
  console.log(`Processing video generation for episode ${episodeId}`);

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  // Generate images for each scene using Lovable AI
  const sceneFrames: Array<{ sceneIndex: number; imageData: string }> = [];
  
  // Process scenes in batches of 3 to avoid overwhelming the API
  const BATCH_SIZE = 3;
  for (let batchStart = 0; batchStart < scenes.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, scenes.length);
    const batchPromises = [];
    
    for (let i = batchStart; i < batchEnd; i++) {
      const scene = scenes[i];
      
      console.log(`Generating frame ${i + 1}/${scenes.length}: ${scene.description}`);

      // Generate photorealistic scene image with retry logic
      const generateImage = async (retries = 3): Promise<string> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const imagePrompt = `Photorealistic, Netflix-grade cinematic scene: ${scene.description}. 
Professional lighting, film quality, 4K resolution, cinematic composition, anatomically accurate, natural expressions, realistic human features.`;

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
              if (imageResponse.status === 429 || imageResponse.status === 402) {
                throw new Error(`Rate limit or payment required. Please check your Lovable AI usage.`);
              }
              throw new Error(`Image generation failed: ${imageResponse.status}`);
            }

            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

            if (!imageUrl) {
              throw new Error('No image URL in response');
            }

            return imageUrl;
          } catch (error) {
            if (attempt === retries - 1) throw error;
            console.log(`Retry ${attempt + 1}/${retries} for scene ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
        throw new Error(`Failed after ${retries} attempts`);
      };

      batchPromises.push(
        generateImage().then(imageUrl => ({
          sceneIndex: i,
          imageData: imageUrl
        }))
      );
    }
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    sceneFrames.push(...batchResults);
    
    // Small delay between batches to respect rate limits
    if (batchEnd < scenes.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Upload frames to Supabase Storage in parallel batches
  const frameUrls: string[] = new Array(sceneFrames.length);
  
  // Upload in batches for better performance
  const UPLOAD_BATCH_SIZE = 5;
  for (let i = 0; i < sceneFrames.length; i += UPLOAD_BATCH_SIZE) {
    const batch = sceneFrames.slice(i, i + UPLOAD_BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (frame) => {
        try {
          // Convert base64 to blob
          const base64Data = frame.imageData.split(',')[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const fileName = `${episodeId}/frame_${frame.sceneIndex}.png`;
          
          const { error: uploadError } = await supabase.storage
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

          frameUrls[frame.sceneIndex] = publicUrl;
        } catch (error) {
          console.error(`Error uploading frame ${frame.sceneIndex}:`, error);
          throw error;
        }
      })
    );
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
  const { error: updateError } = await supabase
    .from('episodes')
    .update({
      video_status: 'completed',
      video_render_completed_at: new Date().toISOString(),
      video_url: frameUrls[0], // First frame as thumbnail
      storyboard: videoMetadata,
      video_render_error: null
    })
    .eq('id', episodeId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating episode:', updateError);
    throw updateError;
  }

  console.log(`Video generation completed for episode ${episodeId}`);
}
