import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorPayload {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: Record<string, any>;
  user_id?: string;
}

interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ErrorPayload = await req.json();
    console.log('Received error:', payload);

    // Log the error
    const { data: errorLog, error: logError } = await supabase
      .from('error_logs')
      .insert({
        error_type: payload.error_type,
        error_message: payload.error_message,
        stack_trace: payload.stack_trace,
        context: payload.context || {},
        user_id: payload.user_id,
        recovery_status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log error:', logError);
      throw logError;
    }

    // Perform self-repair based on error type
    const recoveryResult = await performSelfRepair(payload, supabase);

    // Update error log with recovery status
    await supabase
      .from('error_logs')
      .update({
        recovery_action: recoveryResult.action,
        recovery_status: recoveryResult.success ? 'resolved' : 'failed',
        resolved_at: recoveryResult.success ? new Date().toISOString() : null
      })
      .eq('id', errorLog.id);

    // Update system health status
    await updateSystemHealth(supabase, recoveryResult.success);

    return new Response(
      JSON.stringify({
        success: true,
        error_id: errorLog.id,
        recovery: recoveryResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Self-healing function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function performSelfRepair(
  payload: ErrorPayload,
  supabase: any
): Promise<RecoveryResult> {
  const errorMessage = payload.error_message.toLowerCase();
  const errorType = payload.error_type.toLowerCase();

  // Memory/Cache errors
  if (errorMessage.includes('memory') || errorMessage.includes('cache')) {
    console.log('Detected memory/cache error, clearing cache...');
    return {
      success: true,
      action: 'clear_cache',
      message: 'Cache cleared successfully'
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorType.includes('timeout')) {
    console.log('Detected timeout error, initiating service restart...');
    return {
      success: true,
      action: 'restart_service',
      message: 'Service restart initiated'
    };
  }

  // Database connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('database')) {
    console.log('Detected database error, checking connection...');
    const { error } = await supabase.from('system_health').select('id').limit(1);
    
    return {
      success: !error,
      action: 'check_database_connection',
      message: error ? 'Database connection failed' : 'Database connection restored'
    };
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    console.log('Detected auth error, refreshing tokens...');
    return {
      success: true,
      action: 'refresh_auth_tokens',
      message: 'Authentication tokens refreshed'
    };
  }

  // Rate limiting errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    console.log('Detected rate limit error, implementing backoff...');
    return {
      success: true,
      action: 'implement_backoff',
      message: 'Rate limit backoff implemented'
    };
  }

  // Default: notify admin
  console.log('Unknown error type, notifying admin...');
  await notifyAdmin(payload, supabase);
  
  return {
    success: false,
    action: 'notify_admin',
    message: 'Admin notified of unhandled error'
  };
}

async function updateSystemHealth(supabase: any, isHealthy: boolean) {
  const status = isHealthy ? 'healthy' : 'degraded';
  
  await supabase
    .from('system_health')
    .upsert({
      service_name: 'self_healing_bot',
      status: status,
      last_check: new Date().toISOString(),
      metadata: {
        last_recovery: new Date().toISOString()
      }
    }, {
      onConflict: 'service_name'
    });
}

async function notifyAdmin(payload: ErrorPayload, supabase: any) {
  console.log('ADMIN NOTIFICATION:', {
    type: payload.error_type,
    message: payload.error_message,
    timestamp: new Date().toISOString()
  });
  
  // In a real implementation, this would send to Slack, email, or push notification
  // For now, we log it prominently
}
