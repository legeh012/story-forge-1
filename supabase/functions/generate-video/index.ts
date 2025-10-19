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
    console.log('=== Video Generation Started ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { episodeId, scenes }: VideoGenerationRequest = await req.json();
    console.log(`Processing episode: ${episodeId}, Scenes count: ${scenes?.length || 0}`);

    if (!episodeId || !scenes || scenes.length === 0) {
      throw new Error('Episode ID and scenes are required');
    }

    // Update status to rendering
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('Episode status updated to rendering');

    // Start background processing (no await - runs after response)
    processVideoGeneration(supabase, episodeId, scenes).catch(error => {
      console.error('Background processing failed:', error);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started in background',
        episodeId,
        sceneCount: scenes.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
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
  scenes: Array<{ description: string; duration: number; dialogue?: string }>
) {
  try {
    console.log(`=== Background Processing Started for ${episodeId} ===`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const sceneFrames: Array<{ sceneIndex: number; imageData: string }> = [];
    
    // Process scenes sequentially to avoid rate limits
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      console.log(`Generating frame ${i + 1}/${scenes.length}: ${scene.description.substring(0, 50)}...`);

      const imagePrompt = `Photorealistic, Netflix-grade cinematic scene: ${scene.description}. 
Professional lighting, 4K quality, cinematic composition, anatomically accurate, natural expressions.`;

      try {
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
          const errorText = await imageResponse.text();
          console.error(`Image generation failed for scene ${i}:`, imageResponse.status, errorText);
          throw new Error(`Image generation failed: ${imageResponse.status}`);
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          throw new Error('No image URL in response');
        }

        console.log(`Scene ${i + 1} image generated successfully`);
        sceneFrames.push({
          sceneIndex: i,
          imageData: imageUrl
        });

        // Small delay to respect rate limits
        if (i < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error generating scene ${i}:`, error);
        throw error;
      }
    }

    console.log(`All ${sceneFrames.length} frames generated. Starting upload...`);

    // Upload frames to storage
    const frameUrls: string[] = [];
    
    for (const frame of sceneFrames) {
      try {
        // Convert base64 to blob
        const base64Data = frame.imageData.includes('base64,') 
          ? frame.imageData.split('base64,')[1]
          : frame.imageData;
        
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

        frameUrls.push(publicUrl);
        console.log(`Frame ${frame.sceneIndex} uploaded successfully`);

      } catch (error) {
        console.error(`Error uploading frame ${frame.sceneIndex}:`, error);
        throw error;
      }
    }

    // Create video metadata with downloadable clips
    const videoMetadata = {
      episodeId,
      clips: scenes.map((scene, i) => ({
        clipNumber: i + 1,
        description: scene.description,
        duration: scene.duration,
        dialogue: scene.dialogue || '',
        frameUrl: frameUrls[i],
        downloadUrl: frameUrls[i] // Image can be downloaded
      })),
      totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      clipCount: sceneFrames.length,
      generatedAt: new Date().toISOString()
    };

    console.log('Uploading metadata...');

    // Upload metadata
    const metadataFileName = `${episodeId}/metadata.json`;
    const { error: metadataError } = await supabase.storage
      .from('episode-videos')
      .upload(
        metadataFileName,
        JSON.stringify(videoMetadata, null, 2),
        {
          contentType: 'application/json',
          upsert: true
        }
      );

    if (metadataError) {
      console.error('Metadata upload error:', metadataError);
    }

    // Get metadata URL
    const { data: { publicUrl: metadataUrl } } = supabase.storage
      .from('episode-videos')
      .getPublicUrl(metadataFileName);

    // Update episode with completed status
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_render_completed_at: new Date().toISOString(),
        video_url: frameUrls[0], // First frame as preview
        storyboard: videoMetadata,
        video_render_error: null
      })
      .eq('id', episodeId);

    if (updateError) {
      console.error('Error updating episode:', updateError);
      throw updateError;
    }

    console.log(`=== Video generation completed successfully for ${episodeId} ===`);

  } catch (error) {
    console.error('=== Background processing error ===', error);
    
    // Update episode with error status
    await supabase
      .from('episodes')
      .update({
        video_status: 'failed',
        video_render_error: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', episodeId);
  }
}