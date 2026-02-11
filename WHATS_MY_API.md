# What's My API? - Quick Answer

> **📌 Note:** The Supabase project ID and anon/publishable key shown below are already in your `.env` file in the repository and are safe to expose in frontend code. Only the Service Role Key must be kept secret.

## Your Current API Setup

### ✅ **Active & Working**
**Supabase** (Your Primary Backend)
- Project: `akmeovotnnqbxotlerie`
- URL: https://akmeovotnnqbxotlerie.supabase.co
- Dashboard: https://app.supabase.com/project/akmeovotnnqbxotlerie
- Using: Database, Auth, Storage, 50+ Edge Functions

### ⚠️ **Needs Your API Keys**
You have code that uses these APIs, but you need to add your API keys:

1. **Lovable AI** - For image generation & AI features
   - Get key: https://lovable.dev
   - Used by: 30+ edge functions

2. **OpenAI** - For advanced AI
   - Get key: https://platform.openai.com/api-keys
   - Used by: AI Copilot, content generation

3. **Twilio** - For SMS/2FA
   - Get keys: https://console.twilio.com
   - Used by: User verification

### ✅ **Manual Integrations** (No keys needed)
- **Suno** (suno.com) - Music generation
- **Artlist** (artlist.io) - Stock media

---

## 🚀 Next Steps

1. **If everything works:** You're all set! Just Supabase is enough to run the app.

2. **To unlock all features:** Add API keys for Lovable AI, OpenAI, and Twilio
   - Go to: https://app.supabase.com/project/akmeovotnnqbxotlerie/settings/functions
   - Add secrets under "Secrets" section

---

## 📚 More Details?

- **Quick Reference:** [YOUR_API_INFO.md](./YOUR_API_INFO.md)
- **Full Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Setup Template:** [.env.example](./.env.example)
