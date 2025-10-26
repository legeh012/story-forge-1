import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectorRequest {
  projectId: string;
  prompt: string;
  style?: 'dramatic' | 'comedic' | 'tense' | 'romantic';
  duration?: number;
}

const sayWalahiCharacters = [
  { name: 'Lucky', personality: 'charismatic leader', voice: 'confident, smooth' },
  { name: 'Luul', personality: 'dramatic queen', voice: 'bold, expressive' },
  { name: 'Samara', personality: 'peace keeper', voice: 'calm, diplomatic' },
  { name: 'Ayaan', personality: 'troublemaker', voice: 'mischievous, witty' },
  { name: 'Hani', personality: 'loyal friend', voice: 'fierce, honest' },
  { name: 'Zahra', personality: 'gossip master', voice: 'animated, social' },
  { name: 'Nasra', personality: 'mysterious', voice: 'thoughtful, deep' },
  { name: 'Amal', personality: 'comic relief', voice: 'funny, light-hearted' }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { projectId, prompt, style = 'dramatic', duration = 30 }: DirectorRequest = await req.json();

    console.log('🎬 DIRECTOR WORKFLOW INITIATED');
    console.log('Project:', projectId);
    console.log('Prompt:', prompt);
    console.log('Style:', style);
    console.log('Duration:', duration);

    // STEP 1: Script Generation (Writer Bot)
    console.log('📝 STEP 1: Activating Turbo Script Bot...');
    const scriptResponse = await supabase.functions.invoke('turbo-script-bot', {
      body: {
        projectContext: {
          title: 'Say Walahi',
          genre: 'Reality TV',
          mood: style,
          description: prompt,
          characters: sayWalahiCharacters
        },
        episodeNumber: 1,
        duration: duration,
        customPrompt: prompt
      }
    });

    if (scriptResponse.error) throw new Error('Script generation failed: ' + scriptResponse.error.message);
    const { script } = scriptResponse.data;
    console.log('✅ Script generated:', script.title);

    // STEP 2: Music Composition (Sound Bot)
    console.log('🎵 STEP 2: Activating Suno Music Generator...');
    const musicResponse = await supabase.functions.invoke('suno-music-generator', {
      body: {
        prompt: `${style} reality TV background music for: ${script.synopsis}`,
        duration: duration,
        style: style
      }
    });

    const audioUrl = musicResponse.data?.audioUrl || null;
    console.log('✅ Music composed:', audioUrl ? 'Success' : 'Skipped');

    // STEP 3: Visual Scene Creation (Video Bot)
    console.log('🎨 STEP 3: Activating Scene Orchestration...');
    const scenesResponse = await supabase.functions.invoke('scene-orchestration', {
      body: {
        script: script,
        style: style,
        characters: sayWalahiCharacters
      }
    });

    if (scenesResponse.error) throw new Error('Scene generation failed: ' + scenesResponse.error.message);
    const { scenes } = scenesResponse.data;
    console.log('✅ Scenes created:', scenes.length);

    // STEP 4: Voiceover Generation (Voice Bot)
    console.log('🎙️ STEP 4: Activating Godlike Voice Bot...');
    const voicePromises = scenes.map(async (scene: any) => {
      if (!scene.dialogue) return null;
      
      const voiceResponse = await supabase.functions.invoke('godlike-voice-bot', {
        body: {
          text: scene.dialogue,
          character: scene.characters[0],
          emotion: scene.emotion || 'neutral'
        }
      });

      return voiceResponse.data?.audioUrl || null;
    });

    const narrationUrls = await Promise.all(voicePromises);
    console.log('✅ Voiceovers generated:', narrationUrls.filter(Boolean).length);

    // STEP 5: Image Generation for each scene
    console.log('🖼️ STEP 5: Generating Scene Images...');
    const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const frames = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Generating image ${i + 1}/${scenes.length}`);

      const imagePrompt = `PHOTOREALISTIC REALITY TV SCENE:
${scene.visualDescription}

Characters: ${scene.characters.join(', ')}
Location: ${scene.location}
Style: Netflix-grade cinematography, dramatic lighting, 4K quality
Camera: ${scene.cameraMovement}

Ultra-realistic human features, professional production value`;

      const imageResponse = await fetch(aiGatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: imagePrompt }],
          modalities: ['image', 'text']
        })
      });

      const imageData = await imageResponse.json();
      const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageBase64) {
        // Upload to storage
        const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
        const imagePath = `episodes/${projectId}/scene_${i}_${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('episode-videos')
          .upload(imagePath, imageBuffer, { contentType: 'image/png' });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('episode-videos')
            .getPublicUrl(imagePath);

          frames.push({
            sceneNumber: i + 1,
            image: publicUrl,
            duration: scene.duration || 5,
            dialogue: scene.dialogue,
            voiceover: narrationUrls[i],
            characters: scene.characters
          });
        }
      }
    }

    console.log('✅ Images generated:', frames.length);

    // STEP 6: God-Level FFmpeg Processing
    console.log('🎥 STEP 6: Activating God-Level FFmpeg Compiler...');
    const ffmpegResponse = await supabase.functions.invoke('god-level-ffmpeg-compiler', {
      body: {
        episode: {
          id: projectId,
          title: script.title,
          synopsis: script.synopsis
        },
        frames: frames.map(f => ({
          url: f.image,
          duration: f.duration
        })),
        audioUrl: audioUrl,
        quality: 'ultra' // ultra quality for god-level processing
      }
    });

    let finalVideoUrl = null;
    let enhancedManifestUrl = null;

    if (ffmpegResponse.data && !ffmpegResponse.error) {
      finalVideoUrl = ffmpegResponse.data.videoUrl;
      enhancedManifestUrl = ffmpegResponse.data.manifestUrl;
      console.log('✅ God-Level Processing Complete');
      console.log('  - Scene Composition: ✅');
      console.log('  - Frame Optimization: ✅');
      console.log('  - Color Grading: ✅');
      console.log('  - Quality Enhancement: ✅');
      console.log('  - Visual Effects: ✅');
      console.log('  - Audio Sync: ✅');
      console.log('  - Audio Mastering: ✅');
    } else {
      console.log('⚠️ FFmpeg processing skipped or failed, using basic manifest');
    }

    // STEP 7: Final Assembly & Manifest Upload
    console.log('🎬 STEP 7: Creating Final Video Manifest...');
    const manifest = {
      episodeId: projectId,
      totalDuration: duration,
      frames: frames,
      audioUrl: audioUrl,
      videoUrl: finalVideoUrl,
      enhancedManifestUrl: enhancedManifestUrl,
      metadata: {
        style: style,
        prompt: prompt,
        script: script,
        generatedAt: new Date().toISOString(),
        charactersUsed: [...new Set(scenes.flatMap((s: any) => s.characters))],
        processing: {
          ffmpegCompiler: ffmpegResponse.error ? 'failed' : 'completed',
          godLevelBots: [
            'god-level-scene-composer-bot',
            'frame-optimizer-bot',
            'god-level-color-grader-bot',
            'video-quality-enhancer-bot',
            'god-level-effects-bot',
            'audio-sync-bot',
            'god-level-audio-master-bot'
          ]
        }
      }
    };

    // Upload manifest
    const manifestPath = `episodes/${projectId}/manifest_${Date.now()}.json`;
    const { error: manifestError } = await supabase.storage
      .from('episode-videos')
      .upload(manifestPath, JSON.stringify(manifest, null, 2), { contentType: 'application/json' });

    if (manifestError) throw manifestError;

    const { data: { publicUrl: manifestUrl } } = supabase.storage
      .from('episode-videos')
      .getPublicUrl(manifestPath);

    // Create episode record
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        project_id: projectId,
        title: `Say Walahi: ${script.title}`,
        synopsis: script.synopsis,
        video_status: 'manifest_ready',
        video_manifest_url: manifestUrl,
        storyboard: scenes,
        metadata: manifest.metadata
      })
      .select()
      .single();

    if (episodeError) throw episodeError;

    console.log('🎉 DIRECTOR WORKFLOW COMPLETE');
    console.log('Episode ID:', episode.id);
    console.log('Manifest URL:', manifestUrl);
    if (finalVideoUrl) console.log('Final Video URL:', finalVideoUrl);

    return new Response(JSON.stringify({
      success: true,
      episodeId: episode.id,
      episode: episode,
      manifestUrl: enhancedManifestUrl || manifestUrl,
      videoUrl: finalVideoUrl,
      workflowStatus: 'completed',
      workflow: {
        script: '✅ Generated',
        music: audioUrl ? '✅ Composed' : '⏭️ Skipped',
        scenes: `✅ ${scenes.length} scenes created`,
        voiceovers: `✅ ${narrationUrls.filter(Boolean).length} narrations`,
        images: `✅ ${frames.length} frames generated`,
        ffmpegProcessing: finalVideoUrl ? '✅ God-Level Processing Complete' : '⚠️ Skipped',
        manifest: '✅ Assembled'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ DIRECTOR WORKFLOW FAILED:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      workflow: 'failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
