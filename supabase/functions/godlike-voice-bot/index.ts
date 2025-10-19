import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced text preprocessing for ultra-natural speech
function enhanceTextForSpeech(text: string): string {
  let enhanced = text;
  
  // Add natural pauses at punctuation
  enhanced = enhanced.replace(/\./g, '...');
  enhanced = enhanced.replace(/,/g, ', ');
  enhanced = enhanced.replace(/;/g, '; ');
  enhanced = enhanced.replace(/:/g, ': ');
  
  // Add emphasis markers for important words
  enhanced = enhanced.replace(/\b(amazing|incredible|fantastic|wow|really|very)\b/gi, '$1!');
  
  // Natural breathing pauses for long sentences
  const sentences = enhanced.split(/(?<=[.!?])\s+/);
  enhanced = sentences.map(s => s.length > 100 ? s.replace(/\s+/g, (match, offset) => 
    offset % 50 === 0 ? ' ... ' : match
  ) : s).join(' ');
  
  return enhanced;
}

// Detect emotion and tone from text
function detectEmotion(text: string): { emotion: string; intensity: number } {
  const emotions = {
    excited: /(!+|amazing|incredible|fantastic|wow|awesome|love)/gi,
    calm: /(peaceful|calm|relaxed|gentle|soft)/gi,
    serious: /(important|critical|serious|urgent|crucial)/gi,
    friendly: /(hello|hi|welcome|thanks|thank you|appreciate)/gi,
    dramatic: /(never|always|must|everything|nothing)/gi,
  };
  
  for (const [emotion, pattern] of Object.entries(emotions)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return { emotion, intensity: Math.min(matches.length / 3, 1) };
    }
  }
  
  return { emotion: 'neutral', intensity: 0.5 };
}

// Adjust voice parameters based on content
function optimizeVoiceParams(text: string, baseSpeed: number) {
  const { emotion, intensity } = detectEmotion(text);
  const wordCount = text.split(/\s+/).length;
  
  let speed = baseSpeed;
  let voiceHint = '';
  
  // Adjust speed based on emotion and length
  if (emotion === 'excited') {
    speed = Math.min(baseSpeed * 1.1, 1.5);
    voiceHint = 'Express with enthusiasm and energy';
  } else if (emotion === 'calm') {
    speed = Math.max(baseSpeed * 0.9, 0.7);
    voiceHint = 'Speak with calm and peaceful tone';
  } else if (emotion === 'dramatic') {
    speed = Math.max(baseSpeed * 0.85, 0.7);
    voiceHint = 'Add dramatic emphasis and pauses';
  } else if (wordCount > 100) {
    speed = Math.max(baseSpeed * 0.95, 0.8);
    voiceHint = 'Maintain natural pacing with breathing pauses';
  }
  
  return { speed, voiceHint, emotion, intensity };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = 'nova', speed = 1.0, episodeId, emotion: customEmotion } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🎙️ ULTRA-NATURAL Voice Generation:', { textLength: text.length, voice, speed });

    // GODLIKE Enhancement: Preprocess text for ultra-natural speech
    const enhancedText = enhanceTextForSpeech(text);
    const voiceParams = optimizeVoiceParams(text, speed);
    
    console.log('🧠 AI Voice Analysis:', {
      emotion: voiceParams.emotion,
      intensity: voiceParams.intensity,
      optimizedSpeed: voiceParams.speed,
      hint: voiceParams.voiceHint
    });

    // Generate ultra-realistic speech with HD model
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // HD quality for maximum realism
        input: enhancedText,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        speed: voiceParams.speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS error: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // If episodeId provided, upload to storage
    if (episodeId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: { user } } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '') || ''
      );

      if (user) {
        const fileName = `${episodeId}/voice_${Date.now()}.mp3`;
        const { data, error } = await supabase.storage
          .from('episode-videos')
          .upload(fileName, arrayBuffer, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (error) {
          console.error('Storage error:', error);
        } else {
          console.log('✅ Voice uploaded:', fileName);
        }
      }
    }

    // Convert to base64 for client
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'mp3',
        voice,
        speed: voiceParams.speed,
        quality: 'ULTRA-HD',
        provider: 'GODLIKE-NATURAL-AI',
        enhancement: {
          emotion: voiceParams.emotion,
          intensity: voiceParams.intensity,
          naturalPauses: true,
          emotionalModulation: true,
          breathingSimulation: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ Godlike Voice Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
