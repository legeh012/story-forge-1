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
    const { audioUrl, scenes, frames, quality = 'premium' } = await req.json();

    console.log('🎵 GOD-LEVEL AUDIO MASTER BOT ACTIVATED');
    console.log(`🎯 Quality: ${quality.toUpperCase()}`);
    console.log(`🎬 Mastering audio for ${frames?.length || 0} frames`);

    // Audio mastering settings
    const masteringSettings = getAudioMasteringSettings(quality);
    
    // Dynamic range compression for broadcast
    const compressionSettings = getBroadcastCompression();
    
    // EQ settings for reality TV
    const eqSettings = getRealityTVEQ();
    
    // Limiter settings to prevent clipping
    const limiterSettings = getBroadcastLimiter();
    
    // Loudness normalization (for broadcast standards)
    const loudnessSettings = getLoudnessNormalization();

    console.log('✅ Audio mastering configured');
    console.log(`📊 Target loudness: ${loudnessSettings.targetLUFS} LUFS`);
    console.log(`🎚️ Dynamic range: ${compressionSettings.ratio}:1`);

    return new Response(
      JSON.stringify({
        success: true,
        masteringSettings,
        compressionSettings,
        eqSettings,
        limiterSettings,
        loudnessSettings,
        ffmpegAudioFilters: generateFFmpegAudioFilters({
          compression: compressionSettings,
          eq: eqSettings,
          limiter: limiterSettings,
          loudness: loudnessSettings
        })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Audio master error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getAudioMasteringSettings(quality: string) {
  const settings: Record<string, any> = {
    premium: {
      bitrate: '192k',
      sampleRate: 48000,
      channels: 2,
      codec: 'aac',
      profile: 'aac_low'
    },
    broadcast: {
      bitrate: '256k',
      sampleRate: 48000,
      channels: 2,
      codec: 'aac',
      profile: 'aac_main'
    },
    ultra: {
      bitrate: '320k',
      sampleRate: 48000,
      channels: 2,
      codec: 'aac',
      profile: 'aac_main'
    }
  };

  return settings[quality] || settings.premium;
}

function getBroadcastCompression() {
  return {
    threshold: -18,  // dB
    ratio: 4,        // 4:1 compression ratio
    attack: 5,       // ms
    release: 50,     // ms
    makeupGain: 2,   // dB
    kneeWidth: 2.5   // dB
  };
}

function getRealityTVEQ() {
  return {
    // Boost presence for dialogue clarity
    presence: {
      frequency: 3000,
      gain: 3,
      q: 1.5
    },
    // Boost high end for crispness
    air: {
      frequency: 10000,
      gain: 2,
      q: 0.7
    },
    // Cut mud
    mud: {
      frequency: 250,
      gain: -2,
      q: 1.0
    },
    // Boost bass for impact
    bass: {
      frequency: 80,
      gain: 2,
      q: 1.2
    },
    // Reduce harshness
    harshness: {
      frequency: 5000,
      gain: -1.5,
      q: 2.0
    }
  };
}

function getBroadcastLimiter() {
  return {
    ceiling: -0.1,     // dB (just below 0dB to prevent clipping)
    threshold: -2,     // dB
    release: 100,      // ms
    lookahead: 5       // ms
  };
}

function getLoudnessNormalization() {
  return {
    targetLUFS: -16,   // Standard for streaming platforms
    truePeak: -1.0,    // dB TP
    range: 8,          // LU (loudness units)
    standard: 'EBU R128'
  };
}

function generateFFmpegAudioFilters(settings: any) {
  const filters = [];

  // High-pass filter to remove rumble
  filters.push('highpass=f=80');

  // EQ adjustments
  const eq = settings.eq;
  filters.push(`equalizer=f=${eq.bass.frequency}:width_type=q:width=${eq.bass.q}:g=${eq.bass.gain}`);
  filters.push(`equalizer=f=${eq.mud.frequency}:width_type=q:width=${eq.mud.q}:g=${eq.mud.gain}`);
  filters.push(`equalizer=f=${eq.presence.frequency}:width_type=q:width=${eq.presence.q}:g=${eq.presence.gain}`);
  filters.push(`equalizer=f=${eq.harshness.frequency}:width_type=q:width=${eq.harshness.q}:g=${eq.harshness.gain}`);
  filters.push(`equalizer=f=${eq.air.frequency}:width_type=q:width=${eq.air.q}:g=${eq.air.gain}`);

  // Compression
  const comp = settings.compression;
  filters.push(`acompressor=threshold=${comp.threshold}dB:ratio=${comp.ratio}:attack=${comp.attack}:release=${comp.release}:makeup=${comp.makeupGain}dB:knee=${comp.kneeWidth}dB`);

  // Loudness normalization
  filters.push(`loudnorm=I=${settings.loudness.targetLUFS}:TP=${settings.loudness.truePeak}:LRA=${settings.loudness.range}`);

  // Limiter (prevent clipping)
  const lim = settings.limiter;
  filters.push(`alimiter=limit=${lim.ceiling}dB:attack=${lim.lookahead}:release=${lim.release}`);

  return filters.join(',');
}
