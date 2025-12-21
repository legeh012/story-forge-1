# Your API Configuration - Quick Reference

> **🔒 Security Note:** The Supabase project ID and anon/publishable key shown in this document are already committed to your repository in the `.env` file. These are safe to expose in frontend code as they have row-level security. Only the Service Role Key must be kept secret and is never shown here.

## 🔑 Your Active APIs

This document provides a quick reference to all the APIs currently configured in your Story Forge project.

---

## ✅ Currently Configured APIs

### 1. **Supabase** (Primary Backend)
- **Project ID:** `akmeovotnnqbxotlerie`
- **URL:** `https://akmeovotnnqbxotlerie.supabase.co`
- **Publishable Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbWVvdm90bm5xYnhvdGxlcmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDUzNTEsImV4cCI6MjA3NTkyMTM1MX0.JTbqmA0VU6ERkP6hCDfSCmEJu6T4DMxYkoV7wIFYxy8`
- **Status:** ✅ Active
- **Usage:** Database, Authentication, Storage, 50+ Edge Functions

**Dashboard Access:** https://app.supabase.com/project/akmeovotnnqbxotlerie

---

## ⚙️ APIs Requiring Configuration

These APIs are referenced in your code but need to be configured with your own keys:

### 2. **Lovable AI** 
- **Purpose:** Image generation, scene composition, AI processing
- **Required For:** Most edge functions (god-level bots, frame optimization, etc.)
- **Configuration Status:** ⚠️ Needs your API key
- **Where to Get:** https://lovable.dev
- **Where to Set:** Supabase Dashboard > Project Settings > Edge Functions > Secrets
- **Secret Name:** `LOVABLE_API_KEY`
- **Used By:** 30+ edge functions

### 3. **OpenAI**
- **Purpose:** Advanced AI, natural language processing, content generation
- **Required For:** AI Copilot, script generation, character development
- **Configuration Status:** ⚠️ Needs your API key
- **Where to Get:** https://platform.openai.com/api-keys
- **Where to Set:** Supabase Dashboard > Project Settings > Edge Functions > Secrets
- **Secret Name:** `OPENAI_API_KEY`
- **Used By:** Multiple AI-powered features

### 4. **Twilio** 
- **Purpose:** Two-factor authentication (2FA), SMS verification
- **Required For:** User verification, security features
- **Configuration Status:** ⚠️ Needs configuration
- **Where to Get:** https://console.twilio.com
- **Required Secrets:**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID`
- **Where to Set:** Supabase Dashboard > Project Settings > Edge Functions > Secrets

---

## 🎵 Manual Integrations (No API Key Needed)

### 5. **Suno AI** (Music Generation)
- **Purpose:** AI music generation for episodes
- **Integration:** Manual workflow (generate prompt → copy → paste in Suno)
- **Website:** https://suno.com/create
- **Status:** ✅ UI integrated
- **How it Works:**
  1. Use the Suno Music Studio in your app
  2. Generate a prompt
  3. Copy it to clipboard
  4. Open Suno.com
  5. Generate music
  6. Download and upload back

### 6. **Artlist** (Stock Media)
- **Purpose:** Stock videos, music, sound effects
- **Integration:** UI organization tools
- **Website:** https://artlist.io
- **Status:** ✅ UI integrated
- **Note:** You need an Artlist subscription to download media

### 7. **Botpress** (Chatbot)
- **Purpose:** Conversational AI, chatbot
- **Integration:** Webhook integration
- **Status:** ⚠️ Optional - requires separate setup
- **Edge Function:** `botpress-webhook`

---

## 📊 API Usage Summary

| API | Status | Type | Cost Model |
|-----|--------|------|------------|
| Supabase | ✅ Active | Backend | Freemium / Usage-based |
| Lovable AI | ⚠️ Not Set | AI Generation | API calls |
| OpenAI | ⚠️ Not Set | AI Processing | Token-based |
| Twilio | ⚠️ Not Set | SMS/2FA | Per message |
| Suno | ✅ Manual | Music Gen | External subscription |
| Artlist | ✅ Manual | Stock Media | External subscription |
| Botpress | ⚠️ Optional | Chatbot | External service |

---

## 🚀 Quick Setup Guide

### Step 1: Verify Supabase (Already Done ✅)
Your Supabase project is already connected and working!

### Step 2: Add Lovable AI Key (Recommended)
1. Sign up at https://lovable.dev
2. Get your API key
3. Go to https://app.supabase.com/project/akmeovotnnqbxotlerie/settings/functions
4. Click "Add Secret"
5. Name: `LOVABLE_API_KEY`, Value: your key
6. Save

### Step 3: Add OpenAI Key (Recommended)
1. Sign up at https://platform.openai.com
2. Create an API key
3. Go to Supabase edge functions settings (same as above)
4. Add secret: `OPENAI_API_KEY`

### Step 4: Add Twilio (For 2FA)
1. Sign up at https://www.twilio.com
2. Get your Account SID, Auth Token, and Verify Service SID
3. Add three secrets in Supabase:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_VERIFY_SERVICE_SID`

### Step 5: External Services (Optional)
- **Suno:** Create account at suno.com for music generation
- **Artlist:** Subscribe at artlist.io for stock media
- **Botpress:** Set up if you want chatbot features

---

## 🔒 Security Reminders

- ✅ Your Supabase **Publishable Key** (anon key) is safe to expose in frontend code
- ❌ Never expose **Service Role Key** - only use in edge functions
- ❌ Never commit API keys to Git
- ✅ Use environment variables for all sensitive data
- ⚠️ Rotate keys regularly for security

---

## 📚 Full Documentation

For complete API documentation, architecture details, and troubleshooting, see:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[.env.example](./.env.example)** - Environment variables template

---

## 🆘 Need Help?

1. **Can't find your Supabase keys?**
   - Go to: https://app.supabase.com/project/akmeovotnnqbxotlerie/settings/api
   
2. **Edge functions not working?**
   - Check that secrets are set in Supabase Dashboard
   - Redeploy functions after adding secrets

3. **API rate limits?**
   - Check your tier/plan with each service
   - Implement caching (ai-response-cache function available)

4. **Service costs?**
   - Supabase: Check your project usage
   - OpenAI: Monitor token usage in dashboard
   - Twilio: Review SMS costs per message

---

**Last Updated:** December 2024  
**Your Supabase Project:** akmeovotnnqbxotlerie
