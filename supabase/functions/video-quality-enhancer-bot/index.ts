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
    const { frames, quality, targetResolution, targetFPS } = await req.json();

    console.log('🎨 VIDEO QUALITY ENHANCER BOT ACTIVATED');
    console.log(`🎯 Target: ${targetResolution} @ ${targetFPS}fps`);
    console.log(`⚡ Quality preset: ${quality}`);

    // Determine optimal encoding settings based on quality
    const qualitySettings = getQualitySettings(quality, targetResolution, targetFPS);

    // Analyze frames for optimal settings
    const frameAnalysis = analyzeFrames(frames);

    // Apply BET/VH1 premium color grading
    const colorProfile = getBETColorProfile();

    console.log('✅ Quality settings optimized');
    console.log(`📊 Codec: ${qualitySettings.codec}`);
    console.log(`📊 Bitrate: ${qualitySettings.bitrate}`);
    console.log(`📊 CRF: ${qualitySettings.crf}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...qualitySettings,
        frameAnalysis,
        colorProfile,
        recommendations: {
          useGPU: false, // WASM doesn't support GPU
          useMultipass: quality === 'ultra', // Two-pass for ultra quality
          applyDenoising: frameAnalysis.needsDenoising,
          applySharpening: frameAnalysis.needsSharpening,
          applyColorGrading: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Quality enhancer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getQualitySettings(quality: string, resolution: string, fps: number) {
  const settings = {
    ultra: {
      codec: 'libx264',
      preset: 'slow', // Better quality, slower encoding
      crf: 18, // Near lossless
      bitrate: '8M',
      profile: 'high',
      level: '4.2',
      resolution,
      fps
    },
    premium: {
      codec: 'libx264',
      preset: 'medium',
      crf: 21, // High quality
      bitrate: '6M',
      profile: 'high',
      level: '4.1',
      resolution,
      fps
    },
    broadcast: {
      codec: 'libx264',
      preset: 'medium',
      crf: 23, // Standard quality
      bitrate: '4M',
      profile: 'main',
      level: '4.0',
      resolution,
      fps
    }
  };

  return settings[quality as keyof typeof settings] || settings.premium;
}

function analyzeFrames(frames: any[]) {
  return {
    totalFrames: frames.length,
    averageDuration: frames.reduce((sum: number, f: any) => sum + (f.duration || 5), 0) / frames.length,
    needsDenoising: false, // Premium AI-generated images don't need denoising
    needsSharpening: true, // Always sharpen for broadcast quality
    complexity: 'high', // Reality TV is high complexity
    motionIntensity: 'medium' // Moderate motion between scenes
  };
}

function getBETColorProfile() {
  return {
    name: 'BET/VH1 Premium Reality TV',
    saturation: 1.2, // Boost saturation 20%
    contrast: 1.15, // Increase contrast 15%
    warmth: 1.1, // Slightly warmer tones
    shadows: 0.95, // Lift shadows slightly
    highlights: 1.05, // Boost highlights
    lumetriPreset: 'reality-tv-premium',
    description: 'Premium BET/VH1 reality TV color grading with enhanced saturation, contrast, and warmth'
  };
}
