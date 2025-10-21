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

    const { scenes, characters, episodeId } = await req.json();

    console.log(`🎵 Suno Audio Sync Bot: Processing ${scenes.length} scenes for episode ${episodeId}`);

    const audioSyncResults = [];

    for (const scene of scenes) {
      // Find character in scene
      const character = characters.find((c: any) => 
        scene.dialogue?.toLowerCase().includes(c.name.toLowerCase()) ||
        scene.character === c.name
      );

      if (!character?.metadata?.modules?.sunoAlbumSync) {
        console.log(`⏭️ Skipping scene - no Suno sync for ${scene.character || 'unknown'}`);
        continue;
      }

      const audioTriggers = character.metadata.modules.sunoAlbumSync.audioTriggers;
      const sceneEmotion = scene.emotion || scene.mood || 'neutral';

      // Match scene to audio track
      const matchedTrack = audioTriggers.find((track: any) =>
        track.mood === sceneEmotion ||
        track.relevance.some((r: string) => 
          sceneEmotion.toLowerCase().includes(r) ||
          scene.description?.toLowerCase().includes(r) ||
          scene.dialogue?.toLowerCase().includes(r)
        )
      );

      if (matchedTrack) {
        const audioSync = {
          sceneId: scene.id || `scene_${scenes.indexOf(scene)}`,
          character: character.name,
          handle: character.metadata.modules.sunoAlbumSync.artist,
          track: {
            title: matchedTrack.title,
            mood: matchedTrack.mood,
            relevance: matchedTrack.relevance
          },
          syncPoint: scene.timestamp || 0,
          fadeIn: 1.5, // seconds
          fadeOut: 2.0, // seconds
          volume: 0.6, // 60% volume for overlay
          timing: {
            start: scene.startTime || 0,
            end: scene.endTime || scene.duration || 10
          }
        };

        audioSyncResults.push(audioSync);
        console.log(`🎵 Synced: "${matchedTrack.title}" for ${character.name} in ${sceneEmotion} scene`);
      }
    }

    // Store audio sync metadata
    const audioMetadata = {
      episodeId,
      totalSyncs: audioSyncResults.length,
      syncs: audioSyncResults,
      characters: characters
        .filter((c: any) => c.metadata?.modules?.sunoAlbumSync)
        .map((c: any) => ({
          name: c.name,
          handle: c.metadata.modules.sunoAlbumSync.artist,
          trackCount: c.metadata.modules.sunoAlbumSync.audioTriggers.length
        })),
      generatedAt: new Date().toISOString()
    };

    // Upload to storage
    const metadataFile = `episode-${episodeId}-audio-sync.json`;
    const { error: uploadError } = await supabase.storage
      .from('episode-videos')
      .upload(metadataFile, JSON.stringify(audioMetadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload audio sync metadata:', uploadError);
    }

    console.log(`✅ Suno Audio Sync complete: ${audioSyncResults.length} tracks synced`);

    return new Response(
      JSON.stringify({
        success: true,
        audioSyncs: audioSyncResults,
        metadata: audioMetadata,
        summary: {
          totalScenes: scenes.length,
          syncedScenes: audioSyncResults.length,
          characters: audioMetadata.characters
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Suno Audio Sync Bot error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
