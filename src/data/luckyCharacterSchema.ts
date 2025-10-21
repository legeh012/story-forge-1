export const luckyCharacterSchema = {
  character: "Lucky",
  aliases: ["Luckiee", "DJLuckLuck"],
  handle: "@djluckluck",
  role: "Founder, Artist, Chaos Architect",
  platform: "Sisters of the Diaspora",
  engine: "StoryForge",
  pullIntent: "Activate Lucky's full character schema, remix archive, and Suno-powered audio overlays",
  
  modules: {
    castBranding: {
      enabled: true,
      confessionalLogic: {
        themes: ["visionary", "chaos-native", "schema-driven", "ten steps ahead"],
        triggers: ["boutique drama", "cultural disruption", "monetization insight", "architectural vision"],
        style: "commanding presence with visionary gaze, power suit energy"
      }
    },
    
    sunoAlbumSync: {
      artist: "@djluckluck",
      audioTriggers: [
        { title: "Say Less", mood: "confident", relevance: ["dismissive", "power move"] },
        { title: "Better Than You", mood: "competitive", relevance: ["rivalry", "superiority"] },
        { title: "You're a Hater", mood: "confrontational", relevance: ["calling out", "defensive"] },
        { title: "All Out of Love", mood: "emotional", relevance: ["heartbreak", "vulnerability"] },
        { title: "Hot Sauce", mood: "spicy", relevance: ["drama", "heat"] },
        { title: "Low Key Bussin", mood: "celebratory", relevance: ["success", "vibing"] },
        { title: "Do Need Half Way Love", mood: "longing", relevance: ["relationships", "authenticity"] }
      ]
    },
    
    botDialogue: {
      emotionalPivots: [
        { from: "visionary", to: "chaos", trigger: "resistance to ideas" },
        { from: "architectural", to: "defensive", trigger: "criticism of vision" },
        { from: "cultural", to: "fierce", trigger: "appropriation attempts" }
      ],
      responsePatterns: {
        challenge: "Flips the narrative with cultural receipts and architectural logic",
        support: "Elevates allies with monetization insights and schema poetry",
        confrontation: "Weaponizes chaos-native thinking to dismantle opposition"
      }
    },
    
    episodeScaffolding: {
      arcOverlays: [
        "Boutique empire building",
        "Cultural OS architecture",
        "Legacy keeper dynamics",
        "Monetization disruption",
        "Chaos console management"
      ],
      sceneTypes: {
        confessional: {
          setting: "Architectural space with statement pieces",
          lighting: "Power lighting with cultural artifacts",
          energy: "Visionary architect meets cultural disruptor"
        },
        confrontation: {
          approach: "Schema-driven logic meets weaponized chaos",
          style: "Ten steps ahead strategy"
        },
        alliance: {
          dynamics: "Luul (ancestral wisdom), Samara (strategic precision)",
          theme: "Building empire through cultural fluency"
        }
      }
    },
    
    remixArchive: {
      enabled: true,
      trainingData: {
        voicePatterns: [
          "When they said [X], I said [elevated Y]",
          "This isn't [basic thing], this is [architectural vision]",
          "Y'all talking [surface], I'm building [legacy]"
        ],
        visualSignature: {
          aesthetic: "Power suits, statement jewelry, architectural lines",
          palette: "Rich espresso skin tone, designer headwrap, commanding presence",
          aura: "Visionary architect meets cultural disruptor"
        },
        narrativeArcs: [
          "Underdog to empire builder",
          "Cultural keeper to industry disruptor",
          "Solo vision to alliance power"
        ]
      }
    }
  },
  
  vibe: "Legacy-grade, culturally fluent, remix-obsessed, chaos-native",
  
  // Integration points for StoryForge engine
  storyForgeHooks: {
    generateConfessional: (context: { emotion: string; topic: string; sceneType: string }) => ({
      character: "Lucky",
      setting: "architectural space with statement pieces",
      dialogue: `Lucky's ${context.emotion} confessional about ${context.topic}`,
      audioTrigger: context.emotion === "confident" ? "Say Less" : "Better Than You",
      visualCues: ["power suit", "designer headwrap", "commanding presence"]
    }),
    
    selectAudioOverlay: (sceneEmotion: string) => {
      const track = luckyCharacterSchema.modules.sunoAlbumSync.audioTriggers.find(
        t => t.mood === sceneEmotion || t.relevance.some(r => sceneEmotion.includes(r))
      );
      return track || luckyCharacterSchema.modules.sunoAlbumSync.audioTriggers[0];
    },
    
    getEmotionalPivot: (currentState: string, trigger: string) => {
      return luckyCharacterSchema.modules.botDialogue.emotionalPivots.find(
        p => p.from === currentState && trigger.includes(p.trigger)
      );
    }
  }
};

export type LuckyCharacterSchema = typeof luckyCharacterSchema;
