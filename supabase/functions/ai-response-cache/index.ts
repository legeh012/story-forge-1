import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache with TTL (5 minutes default)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cleanup old cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 600000);

interface CacheRequest {
  operation: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  data?: any;
  ttl?: number; // Time to live in milliseconds
}

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

    const { operation, key, data, ttl = 300000 } = await req.json() as CacheRequest;

    switch (operation) {
      case 'get': {
        if (!key) throw new Error('Key is required for get operation');
        
        const cached = cache.get(key);
        if (!cached) {
          return new Response(
            JSON.stringify({ hit: false, data: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
          cache.delete(key);
          return new Response(
            JSON.stringify({ hit: false, data: null, reason: 'expired' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`⚡ Cache HIT for key: ${key}`);
        return new Response(
          JSON.stringify({ hit: true, data: cached.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set': {
        if (!key) throw new Error('Key is required for set operation');
        if (data === undefined) throw new Error('Data is required for set operation');

        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        });

        console.log(`💾 Cache SET for key: ${key} (TTL: ${ttl}ms)`);
        return new Response(
          JSON.stringify({ success: true, message: 'Data cached' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!key) throw new Error('Key is required for delete operation');
        
        const deleted = cache.delete(key);
        console.log(`🗑️ Cache DELETE for key: ${key} (existed: ${deleted})`);
        
        return new Response(
          JSON.stringify({ success: true, deleted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'clear': {
        cache.clear();
        console.log('🧹 Cache CLEARED');
        
        return new Response(
          JSON.stringify({ success: true, message: 'Cache cleared' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

  } catch (error) {
    console.error('Cache error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
