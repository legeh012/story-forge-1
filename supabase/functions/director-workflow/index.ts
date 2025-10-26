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

// Say Walahi Sisters - The Diaspora Characters
const sayWalahiCharacters = [
  {
    name: "Lucky",
    role: "The Founder - Visionary Architect",
    traits: ["chaos-native", "schema-driven", "visionary", "ten steps ahead"],
    personality: "Builds cinematic OSs while flipping tropes into monetization, always architecting the next cultural disruption",
    voice: "commanding, visionary, powerful",
    appearance: {
      skin_tone: "rich espresso",
      face: "commanding presence, visionary gaze",
      hair: "flowing waves under designer headwrap",
      style: "power suits, statement jewelry, architectural aesthetic",
      aura: "visionary architect meets cultural disruptor"
    }
  },
  {
    name: "Luul",
    role: "The Flamekeeper - Cultural Anchor",
    traits: ["ancestral", "legacy-keeper", "confessional fire", "pure presence"],
    personality: "Holds the ancestral line and lights the confessional fire, her presence is pure legacy and cultural wisdom",
    voice: "ancestral, wise, powerful",
    appearance: {
      skin_tone: "warm caramel",
      face: "sharp features, ancestral wisdom in her gaze",
      hair: "sleek bun under traditional hijab",
      style: "elegant traditional meets modern power, heritage fabrics",
      aura: "ancestral flame meets generational keeper"
    }
  },
  {
    name: "Samara",
    role: "The Strategist - Quiet Architect",
    traits: ["precise", "emotional logic coder", "monetization visionary", "quiet power"],
    personality: "Precision over noise. Codes emotional logic into every scene and sees monetization arcs before they drop",
    voice: "calculating, precise, strategic",
    appearance: {
      skin_tone: "honey beige",
      face: "calculating eyes, strategic smile",
      hair: "sleek styling under minimalist hijab",
      style: "architectural precision, clean lines, strategic aesthetic",
      aura: "quiet architect of emotional systems"
    }
  },
  {
    name: "Ayaan",
    role: "The Architect - Systems Queen",
    traits: ["backend brilliant", "front-end finesse", "schema poet", "systems thinker"],
    personality: "Builds backend brilliance and front-end finesse. Her overlays are schema poetry in motion",
    voice: "tech-forward, systematic, poetic",
    appearance: {
      skin_tone: "deep mahogany",
      face: "focused intensity, architectural vision",
      hair: "natural curls under bold printed wrap",
      style: "tech-forward elegance, systematic aesthetic",
      aura: "systems queen meets code poetry"
    }
  },
  {
    name: "Hani",
    role: "The Oracle - Spiritual Strategist",
    traits: ["trauma map reader", "energy grid keeper", "emotional compass", "spiritual"],
    personality: "Reads trauma maps like episode scripts. Her energy grid is the show's emotional compass and spiritual north",
    voice: "spiritual, knowing, compassionate",
    appearance: {
      skin_tone: "soft cinnamon",
      face: "knowing eyes, spiritual presence",
      hair: "flowing under elegant hijab",
      style: "spiritual elegance, energy-aware aesthetic, mystical touches",
      aura: "oracle meets emotional cartographer"
    }
  },
  {
    name: "Zahra",
    role: "The Flame - Satirical Provocateur",
    traits: ["satirical", "trope dismantler", "viral thinker", "weaponized humor"],
    personality: "Weaponizes humor to dismantle tropes. Her confessionals are viral think pieces that break the internet",
    voice: "sharp, satirical, provocative",
    appearance: {
      skin_tone: "honey beige",
      face: "sharp wit, provocative smile",
      hair: "bold styling under statement hijab",
      style: "provocateur chic, satirical aesthetic, viral ready",
      aura: "flame meets satirical genius"
    }
  },
  {
    name: "Nasra",
    role: "Sweetheart - Emotional Core",
    traits: ["vulnerable", "emotional superpower", "soft chaos", "storyline magnet"],
    personality: "The softness in the chaos. Her vulnerability is her superpower and her storyline always lands perfectly",
    voice: "gentle, heartfelt, vulnerable",
    appearance: {
      skin_tone: "deep mahogany",
      face: "gentle features, heartfelt expression",
      hair: "soft styling under pastel hijab",
      style: "sweetheart aesthetic, emotional elegance, vulnerability as power",
      aura: "emotional core meets gentle strength"
    }
  },
  {
    name: "Amal",
    role: "The Instigator - Chaos Console",
    traits: ["pivot master", "plot twist queen", "viral disruptor", "cinematic upgrader"],
    personality: "Thrives on pivots, plot twists, and viral disruption. Every scene she enters becomes a cinematic upgrade",
    voice: "mischievous, dynamic, disruptive",
    appearance: {
      skin_tone: "warm bronze",
      face: "mischievous energy, instigator smile",
      hair: "dynamic styling under bold chiffon hijab",
      style: "chaos chic, plot twist aesthetic, viral energy",
      aura: "instigator meets cinematic chaos architect"
    }
  }
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

      const imagePrompt = `PHOTOREALISTIC REALITY TV SCENE - SAY WALAHI SISTERS:
${scene.visualDescription}

CAST MEMBERS PRESENT:
${scene.characters.map((charName: string) => {
  const char = sayWalahiCharacters.find(c => c.name === charName);
  if (!char) return `${charName} - Somali woman in modern setting`;
  return `${char.name} (${char.role}):
  - Appearance: ${char.appearance.skin_tone} skin, ${char.appearance.face}, ${char.appearance.hair}
  - Style: ${char.appearance.style}
  - Energy: ${char.appearance.aura}
  - Personality: ${char.personality}`;
}).join('\n\n')}

SCENE SETTING:
Location: ${scene.location}
Camera Movement: ${scene.cameraMovement}
Lighting: Netflix-grade cinematic, dramatic reality TV lighting
Quality: 4K photorealistic, BET/VH1 production value

CRITICAL REQUIREMENTS:
- Show REAL Somali diaspora sisters in luxury modern setting
- Authentic hijabi fashion - elegant, modern, designer
- Natural human expressions and body language
- Professional reality TV cinematography
- No cartoon or anime style - PHOTOREALISTIC ONLY
- Accurate human anatomy and proportions`;


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
