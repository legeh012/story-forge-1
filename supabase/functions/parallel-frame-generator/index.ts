import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { episodeId, scenes, userId } = await req.json();
    
    console.log(`🚀 PARALLEL Frame Generation Started for ${episodeId}`);
    console.log(`Generating ${scenes.length} frames in parallel...`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate all frames in parallel
    const startTime = Date.now();
    const framePromises = scenes.map(async (scene: any, index: number) => {
      const frameStartTime = Date.now();
      console.log(`🎨 Frame ${index + 1}/${scenes.length} generation started`);
      
      const prompt = `${scene.description}. Ultra high resolution, photorealistic, Netflix-quality cinematography, perfect lighting, professional color grading, anatomically correct, natural expressions.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{
            role: "user",
            content: prompt
          }],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image generation failed for frame ${index}: ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        throw new Error(`No image URL in response for frame ${index}`);
      }

      const frameTime = Date.now() - frameStartTime;
      console.log(`✅ Frame ${index + 1} generated in ${frameTime}ms`);
      
      return {
        index,
        imageUrl,
        scene,
        generationTime: frameTime
      };
    });

    // Wait for all frames to complete
    const frames = await Promise.all(framePromises);
    const totalGenerationTime = Date.now() - startTime;
    
    console.log(`🎉 ALL ${frames.length} frames generated in ${totalGenerationTime}ms (${(totalGenerationTime/1000).toFixed(2)}s)`);

    // Upload all frames in parallel
    const uploadStartTime = Date.now();
    const uploadPromises = frames.map(async ({ index, imageUrl, scene }) => {
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${userId}/${episodeId}/frame_${index}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('episode-videos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed for frame ${index}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('episode-videos')
        .getPublicUrl(fileName);

      console.log(`📤 Frame ${index} uploaded successfully`);
      
      return {
        index,
        url: publicUrl,
        scene
      };
    });

    const uploadedFrames = await Promise.all(uploadPromises);
    const totalUploadTime = Date.now() - uploadStartTime;
    
    console.log(`📦 ALL frames uploaded in ${totalUploadTime}ms (${(totalUploadTime/1000).toFixed(2)}s)`);

    // Upload metadata
    const metadata = {
      episodeId,
      frames: uploadedFrames.map(f => ({
        index: f.index,
        url: f.url,
        description: f.scene.description,
        dialogue: f.scene.dialogue
      })),
      generatedAt: new Date().toISOString(),
      totalFrames: uploadedFrames.length,
      performance: {
        generationTime: totalGenerationTime,
        uploadTime: totalUploadTime,
        totalTime: totalGenerationTime + totalUploadTime
      }
    };

    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const { error: metadataError } = await supabase.storage
      .from('episode-videos')
      .upload(`${userId}/${episodeId}/metadata.json`, metadataBlob, {
        contentType: 'application/json',
        upsert: true
      });

    if (metadataError) {
      console.error('Metadata upload error:', metadataError);
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎬 COMPLETE: Total processing time ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);

    // Call compile-video to create MP4 video manifest
    console.log('🎥 Compiling frames into video...');
    try {
      const frameUrls = uploadedFrames.map(f => f.url);
      const frameDurations = scenes.map((scene: any) => parseFloat(scene.duration) || 5);

      const compileResponse = await fetch(`${supabaseUrl}/functions/v1/compile-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          userId,
          frameUrls,
          frameDurations,
          metadata
        }),
      });

      if (!compileResponse.ok) {
        console.error('Video compilation failed:', await compileResponse.text());
      } else {
        console.log('✅ Video manifest created successfully');
      }
    } catch (compileError) {
      console.error('Failed to compile video:', compileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        frames: uploadedFrames,
        performance: {
          totalFrames: frames.length,
          framesGenerated: frames.length,
          generationTimeMs: totalGenerationTime,
          uploadTimeMs: totalUploadTime,
          totalTimeMs: totalTime,
          averagePerFrame: Math.round(totalGenerationTime / frames.length)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Parallel frame generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
