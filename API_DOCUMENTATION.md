# API Documentation for Story Forge

This document provides a comprehensive overview of all APIs and services used in the Story Forge application.

## Table of Contents
- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Primary APIs](#primary-apis)
- [Supabase Edge Functions](#supabase-edge-functions)
- [External Integrations](#external-integrations)

## Overview

Story Forge is a video production and content creation platform that integrates multiple AI and media services. The application uses:
- **Supabase** as the primary backend (database, authentication, edge functions)
- **Lovable AI** for image generation and AI processing
- **OpenAI** for advanced AI capabilities
- **Twilio** for SMS verification
- **Suno** for music generation (UI integration)
- **Artlist** for stock media (UI integration)

## Environment Variables

### Frontend Environment Variables (.env)
These variables are used in the React/Vite frontend application:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="akmeovotnnqbxotlerie"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbWVvdm90bm5xYnhvdGxlcmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDUzNTEsImV4cCI6MjA3NTkyMTM1MX0.JTbqmA0VU6ERkP6hCDfSCmEJu6T4DMxYkoV7wIFYxy8"
VITE_SUPABASE_URL="https://akmeovotnnqbxotlerie.supabase.co"
```

### Backend Environment Variables (Supabase Edge Functions)
These secrets need to be configured in your Supabase project settings:

```env
# Required for edge functions
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
LOVABLE_API_KEY="<your-lovable-api-key>"
OPENAI_API_KEY="<your-openai-api-key>"
TWILIO_ACCOUNT_SID="<your-twilio-account-sid>"
TWILIO_AUTH_TOKEN="<your-twilio-auth-token>"
TWILIO_VERIFY_SERVICE_SID="<your-twilio-verify-service-sid>"
```

## Primary APIs

### 1. Supabase
**Purpose:** Backend as a Service (BaaS) - Database, Authentication, Storage, Edge Functions

**Configuration:**
- Project ID: `akmeovotnnqbxotlerie`
- URL: `https://akmeovotnnqbxotlerie.supabase.co`
- Client: `@supabase/supabase-js` v2.75.0

**Key Features Used:**
- PostgreSQL database for storing projects, episodes, characters, and media
- Authentication with email/password and 2FA
- Storage for media files (images, videos, audio)
- Edge Functions (Deno runtime) for serverless backend logic
- Real-time subscriptions

**Access:**
- Frontend: Uses `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/public key)
- Backend: Uses `SUPABASE_SERVICE_ROLE_KEY` (admin key)

### 2. Lovable AI API
**Purpose:** AI-powered image generation and processing

**Usage in Edge Functions:**
- Scene analysis and composition
- Image generation from text prompts
- Color grading suggestions
- Visual effects recommendations
- Custom content enhancement

**Edge Functions Using Lovable API:**
- `god-level-scene-composer-bot`
- `god-level-color-grader-bot`
- `god-level-effects-bot`
- `frame-optimizer-bot`
- `ultra-video-bot`
- `ai-copilot`
- `production-team`
- `master-orchestrator`
- And many more...

### 3. OpenAI API
**Purpose:** Advanced AI language models and processing

**Usage:**
- Natural language processing
- AI-powered content generation
- Script writing and dialogue generation
- Character development
- Story analysis

**Edge Functions Using OpenAI:**
- `ai-copilot`
- Various content generation functions

### 4. Twilio API
**Purpose:** SMS verification and two-factor authentication

**Services Used:**
- Twilio Verify API for sending and verifying SMS codes

**Edge Functions:**
- `send-verification-code` - Sends SMS verification codes
- `verify-code` - Validates verification codes

## Supabase Edge Functions

The application has **50+ edge functions** deployed to handle various backend operations. Here are the main categories:

### Master Orchestration
- `master-orchestrator` - Coordinates all production bots and workflows
- `bot-orchestrator` - Manages bot execution and scheduling

### Video Production
- `god-level-unified-processor` - Unified video processing pipeline
- `god-level-vmaker-bot` - Advanced video creation
- `god-level-ffmpeg-compiler` - FFmpeg-based video compilation
- `ultra-video-bot` - High-quality video generation
- `batch-video-renderer` - Batch video rendering
- `render-episode-video` - Individual episode rendering
- `ffmpeg-video-engine` - Core FFmpeg operations

### Scene & Frame Processing
- `god-level-scene-composer-bot` - Scene composition and layout
- `frame-optimizer-bot` - Frame-level optimization
- `parallel-frame-generator` - Parallel frame generation
- `scene-orchestration` - Scene coordination

### Visual Effects & Color
- `god-level-color-grader-bot` - Color grading and correction
- `god-level-effects-bot` - Visual effects application
- `video-quality-enhancer-bot` - Quality enhancement

### Audio Processing
- `god-level-audio-master-bot` - Audio mastering
- `godlike-voice-bot` - Voice generation and processing
- `audio-sync-bot` - Audio synchronization
- `audio-mixer-bot` - Audio mixing
- `sound-effects-bot` - Sound effects management
- `suno-audio-sync-bot` - Suno music integration

### Music & Media Integration
- `suno-music-generator` - Generates prompts for Suno AI music
- `artlist-advanced-bot` - Artlist media integration

### Content Generation
- `generate-episode-from-prompt` - Episode generation from text
- `generate-video` - Video generation
- `generate-remix-video` - Remix video creation
- `script-generator-bot` - Script writing
- `turbo-script-bot` - Fast script generation
- `ai-character-designer` - Character design and development

### Workflow & Direction
- `director-workflow` - Director-level production control
- `expert-director` - Expert direction system
- `production-team` - Team coordination
- `episode-producer` - Episode production management

### Special Features
- `reality-tv-god-mode` - Reality TV specific features
- `confessional-logic-bot` - Confessional scene logic
- `trend-detection-bot` - Social media trend detection
- `hook-optimization-bot` - Content hook optimization
- `remix-bot` - Content remixing
- `cultural-injection-bot` - Cultural context integration

### Import & Export
- `import-characters` - Character import
- `import-from-photos` - Photo import
- `youtube-uploader` - YouTube upload integration
- `produce-and-upload-episode` - Full production pipeline
- `cross-platform-poster` - Multi-platform posting

### System & Performance
- `self-healing` - Auto-recovery and error handling
- `performance-optimizer-bot` - Performance optimization
- `performance-tracker-bot` - Performance monitoring
- `ai-response-cache` - API response caching
- `cleanup-old-episodes` - Data cleanup

### AI Assistance
- `ai-copilot` - AI assistant for users
- `ai-engineer` - Engineering assistance

### Authentication
- `send-verification-code` - 2FA code sending
- `verify-code` - 2FA code verification

### Webhooks
- `botpress-webhook` - Botpress chatbot integration

## External Integrations

### Suno AI (suno.com)
**Purpose:** AI music generation
**Integration Type:** Manual workflow (copy prompts to external service)

The application generates Suno-compatible prompts but requires users to:
1. Generate a prompt using `suno-music-generator` edge function
2. Copy the prompt
3. Visit https://suno.com/create
4. Paste and generate music
5. Download and upload back to the platform

### Artlist
**Purpose:** Stock video, audio, and effects
**Integration Type:** UI components for organization and management

The `artlist-advanced-bot` provides advanced features for working with Artlist media.

### Botpress
**Purpose:** Chatbot and conversational AI
**Integration Type:** Webhook

The `botpress-webhook` edge function receives and processes messages from Botpress chatbot.

## API Rate Limits & Considerations

### Supabase
- Free tier: Limited edge function invocations
- Database: Connection pooling enabled
- Storage: Bandwidth limits apply

### Lovable API
- Rate limits depend on your subscription
- Image generation has per-request costs

### OpenAI API
- Token-based pricing
- Rate limits based on tier
- Implement caching via `ai-response-cache` function

### Twilio
- SMS costs per message
- Verify API has rate limits for code sending

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Rotate keys regularly** - Especially after exposure
3. **Use service roles carefully** - Only in edge functions
4. **Implement rate limiting** - Prevent abuse
5. **Validate JWT tokens** - Most functions have `verify_jwt = true`
6. **Sanitize inputs** - Prevent injection attacks
7. **Use HTTPS only** - All API calls should be encrypted

## How to Set Up API Keys

### For Local Development:
1. Copy `.env` file in the root directory
2. Get Supabase keys from: https://app.supabase.com/project/akmeovotnnqbxotlerie/settings/api
3. Add other API keys as needed

### For Supabase Edge Functions:
1. Go to Supabase Dashboard
2. Navigate to Project Settings > Edge Functions
3. Add secrets under "Secrets" section:
   - `LOVABLE_API_KEY`
   - `OPENAI_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_VERIFY_SERVICE_SID`

### For Production Deployment:
1. Set environment variables in your hosting platform
2. Ensure all required secrets are configured
3. Test edge functions after deployment
4. Monitor API usage and costs

## Troubleshooting

### Common Issues:

**"API key not configured" errors:**
- Check that environment variables are set
- Verify variable names match exactly
- Redeploy edge functions after adding secrets

**Supabase connection issues:**
- Verify project ID and URL are correct
- Check if publishable key is valid
- Ensure network allows connections to Supabase

**Edge function timeouts:**
- Functions have a 60-second timeout
- Optimize heavy processing
- Consider batch operations

**Rate limit errors:**
- Implement exponential backoff
- Use the `ai-response-cache` function
- Consider upgrading API tiers

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)
- [Suno AI](https://suno.com)

## Support

For issues related to:
- **Supabase**: Contact Supabase support or check their status page
- **API Keys**: Refer to respective service documentation
- **Application bugs**: Create an issue in the repository

---

**Last Updated:** December 2024
**Project:** Story Forge (story-forge-1)
**Supabase Project ID:** akmeovotnnqbxotlerie
