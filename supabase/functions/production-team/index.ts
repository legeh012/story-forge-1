import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { role, sceneData, episodeId } = await req.json();

    if (!role || !sceneData) {
      throw new Error('Role and scene data are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Define role-specific prompts for REALITY TV production tailored to WATCHERS
    const rolePrompts = {
      casting_director: `You are an EMMY-WINNING Casting Director for hit reality TV shows (Love & Hip Hop, Real Housewives, Selling Sunset). You understand what makes reality TV WATCHERS obsessed.

SCENE DATA: ${JSON.stringify(sceneData)}

Reality TV viewers crave:
1. CHARACTER CONSISTENCY: Does each cast member stay TRUE to their established persona? Viewers HATE when someone acts out of character.
2. CASTING CHEMISTRY: Are there natural ENEMIES and ALLIES? Reality watchers love watching friendships implode and rivalries intensify.
3. BINGE-WORTHY AUTHENTICITY: Can viewers FEEL the real emotions? They can spot fake drama a mile away.
4. VISUAL APPEAL: Are cast members styled for Instagram screenshots? Viewers screenshot iconic moments.
5. ARCHETYPES VIEWERS LOVE: The villain everyone loves to hate, the underdog hero, the messy friend, the voice of reason, the wildcard.

What reality TV watchers are saying:
- "I NEED her to confront him about that!"
- "OMG I can't believe she said that to her face!"
- "This is giving Real Housewives of Atlanta energy"
- "The way she walked away... ICONIC!"

Return JSON: {
  "viewerAppeal": {"bingeFactor": 9, "socialMediaWorthy": true, "watercoolerMoment": "what viewers will talk about"},
  "characterConsistency": {"alignsWithPersona": true, "viewerTrust": "high/medium/low", "personalityChecks": [...]},
  "castingChemistry": {"naturalEnemies": ["A vs B"], "rideOrDies": ["C & D"], "conflictPotential": 10},
  "authenticityScore": 9,
  "castArchetypes": [{"character": "name", "archetype": "villain everyone hates/hero/messy friend/voice of reason", "viewerReaction": "how fans respond"}],
  "iconicMoments": ["screenshot-worthy scene 1", "quote viewers will repeat"],
  "improvements": ["what would make viewers OBSESSED with this scene"]
}`,

      scene_stylist: `You are an INDUSTRY-LEADING Scene Stylist who dresses the biggest reality TV stars. You know what VIEWERS screenshot and what goes VIRAL on social media.

SCENE DATA: ${JSON.stringify(sceneData)}

Reality TV viewers notice EVERYTHING:
1. FASHION MOMENTS: Is someone wearing a designer piece viewers will Google? Are the outfits "lewk" worthy?
2. ASPIRATIONAL STYLING: Viewers want to see luxury they dream about - designer bags, diamond jewelry, haute couture.
3. CULTURAL AUTHENTICITY: Viewers from the culture WILL call out inauthenticity. Celebrate heritage PROPERLY.
4. VIRAL AESTHETICS: What will trend on TikTok/Instagram? Think confessional booth glam, dramatic outfit reveals.
5. SCREENSHOT-WORTHY MOMENTS: Viewers pause to capture iconic looks, confrontation outfits, "she wore THAT?!" moments.

What reality TV viewers are posting:
- "Her outfit ATE! Where can I get that bag?"
- "The way she's dressed for this confrontation... she came PREPARED"
- "I need that confessional look breakdown ASAP"
- "The cultural representation is EVERYTHING!"

Return JSON: {
  "viralPotential": {"instagramWorthy": true, "tiktokTrending": "likely", "screenshotMoments": [...]},
  "fashion": {
    "characterOutfits": [{"character": "name", "outfit": "designer brand details viewers will Google", "viralFactor": 9, "accessories": [...], "culturalSignificance": "..."}],
    "styleVibe": "power dressing/casual luxury/street style meets high fashion",
    "viewerReaction": "what fashion fans will say"
  },
  "aspirationalElements": ["luxury items viewers aspire to own", "designer pieces that spark conversation"],
  "culturalAuthenticity": {"score": 10, "heritage": "properly celebrated", "avoidedStereotypes": [...]},
  "iconicLooks": ["outfit that will go viral", "jewelry moment viewers will screenshot"],
  "improvements": ["styling tweaks that would break the internet"]
}`,

      drama_editor: `You are an AWARD-WINNING Drama Editor who creates the most TALKED-ABOUT moments in reality TV. You understand what makes viewers RUN to Twitter/Reddit to discuss.

SCENE DATA: ${JSON.stringify(sceneData)}

Reality TV viewers are looking for:
1. UNMISSABLE MOMENTS: "Did you SEE that?!" moments that viewers HAVE to talk about
2. PERFECT CLIFFHANGERS: End scenes where viewers NEED to know what happens next - they'll wait all week
3. STRATEGIC DRAMA: Viewers love watching cast members play chess with alliances and betrayals
4. EMOTIONAL PAYOFF: After all the tension, give viewers a SATISFYING explosion or tearful confession
5. LIVE-TWEET WORTHY: Moments so good viewers are texting friends "ARE YOU WATCHING THIS?!"

What reality TV viewers demand:
- "Why did they cut it there?! I NEED the next episode NOW!"
- "The way the editors built up to that confrontation... CHEF'S KISS"
- "This is why I watch reality TV - PURE DRAMA"
- "Everyone on Twitter is losing their minds over this scene"

Return JSON: {
  "waterCoolerScore": 10,
  "viewerEngagement": {"liveTweetPotential": "high", "redditThreads": "guaranteed", "groupChatBuzz": "insane"},
  "conflictArc": {
    "buildType": "slow burn that EXPLODES/instant chaos",
    "escalationPoints": [{"timestamp": "...", "trigger": "what sets it off", "viewerReaction": "OMG moment", "intensity": 10}],
    "payoff": "SATISFYING - viewers will be screaming",
    "memeableMoments": ["gif-worthy reaction", "quotable one-liner"]
  },
  "cliffhangers": [
    {"cutPoint": "RIGHT when...", "bombshell": "what's about to drop", "viewerHook": "WHY they'll binge the next episode immediately", "socialMediaReaction": "predicted trending hashtag"}
  ],
  "strategicDrama": {
    "allianceFlips": "who betrays who - viewers LIVE for this",
    "receiptsDeployment": "when evidence is revealed for maximum impact",
    "confessionalShade": "cutting commentary that viewers will quote"
  },
  "emotionalMoments": ["tearful breakdown that humanizes villain", "genuine friendship moment before betrayal"],
  "improvements": ["edits that would make this LEGENDARY", "where to add reaction shots for memes", "cliffhanger tweaks for max suspense"]
}`
    };

    const selectedPrompt = rolePrompts[role as keyof typeof rolePrompts];
    if (!selectedPrompt) {
      throw new Error(`Invalid role: ${role}`);
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an INDUSTRY-LEADING ${role.replace('_', ' ')} for hit reality TV shows (Love & Hip Hop, Real Housewives, Selling Sunset, Jersey Shore). You create content that reality TV WATCHERS obsess over, screenshot, and discuss online. Think Emmy-winning production that breaks the internet. Always respond with valid JSON.`
          },
          {
            role: 'user',
            content: selectedPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Production Team (${role}) AI error`);
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { rawOutput: resultText, role };
    }

    // Log execution stats
    if (episodeId) {
      const executionTime = Date.now() - startTime;
      await supabase.from('bot_execution_stats').insert({
        bot_type: 'production_team',
        episode_id: episodeId,
        execution_time_ms: executionTime,
        quality_score: 0.95,
        metadata: { module: role, viewerFocused: true, industryLeading: true }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        role,
        result,
        message: `Emmy-winning Production Team (${role}) analysis complete - viewer-optimized`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Production Team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
