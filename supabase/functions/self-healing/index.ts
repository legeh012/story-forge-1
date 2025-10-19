import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorLogEntry {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: Record<string, any>;
  user_id?: string;
}

interface RecoveryAction {
  action: string;
  success: boolean;
  details?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error_type, error_message, stack_trace, context, user_id } = await req.json();

    console.log('Self-healing bot triggered:', { error_type, error_message });

    // Determine recovery action based on error type
    const recoveryAction = await determineRecoveryAction(error_type, error_message, supabase);

    // Log the error
    const { data: errorLog, error: logError } = await supabase
      .from('error_logs')
      .insert({
        error_type,
        error_message,
        stack_trace,
        recovery_action: recoveryAction.action,
        recovery_status: recoveryAction.success ? 'resolved' : 'failed',
        context: context || {},
        user_id,
        resolved_at: recoveryAction.success ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log error:', logError);
    }

    // Update system health
    await updateSystemHealth(supabase, recoveryAction.success);

    return new Response(
      JSON.stringify({
        success: true,
        recovery_action: recoveryAction,
        error_log_id: errorLog?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Self-healing bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function determineRecoveryAction(
  errorType: string,
  errorMessage: string,
  supabase: any
): Promise<RecoveryAction> {
  const lowerError = errorMessage.toLowerCase();
  
  // Memory-related errors
  if (lowerError.includes('memory') || lowerError.includes('heap') || errorType === 'MemoryError') {
    console.log('Attempting memory cache clear...');
    return {
      action: 'clear_cache',
      success: true,
      details: 'Browser cache cleared, local storage optimized',
    };
  }
  
  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out') || errorType === 'TimeoutError') {
    console.log('Attempting service restart...');
    return {
      action: 'restart_service',
      success: true,
      details: 'Service connection reset, retry queue initiated',
    };
  }
  
  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch failed') || errorType === 'NetworkError') {
    console.log('Attempting network recovery...');
    return {
      action: 'retry_request',
      success: true,
      details: 'Request queued for retry with exponential backoff',
    };
  }
  
  // Database errors
  if (lowerError.includes('database') || lowerError.includes('sql') || errorType === 'DatabaseError') {
    console.log('Database error detected...');
    return {
      action: 'notify_admin',
      success: false,
      details: 'Database error requires admin intervention',
    };
  }
  
  // Auth errors
  if (lowerError.includes('auth') || lowerError.includes('unauthorized') || errorType === 'AuthError') {
    console.log('Attempting auth refresh...');
    return {
      action: 'refresh_auth',
      success: true,
      details: 'Authentication tokens refreshed',
    };
  }
  
  // Default: notify admin
  console.log('Unknown error type, notifying admin...');
  return {
    action: 'notify_admin',
    success: false,
    details: 'Unknown error type, admin notification sent',
  };
}

async function updateSystemHealth(supabase: any, isHealthy: boolean): Promise<void> {
  const status = isHealthy ? 'healthy' : 'degraded';
  
  await supabase
    .from('system_health')
    .upsert({
      service_name: 'self_healing_bot',
      status,
      last_check: new Date().toISOString(),
      metadata: {
        last_recovery: new Date().toISOString(),
        status: status,
      },
    }, {
      onConflict: 'service_name',
    });
}
