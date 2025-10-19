import { supabase } from "@/integrations/supabase/client";

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export class SelfHealingErrorHandler {
  private static instance: SelfHealingErrorHandler;
  
  private constructor() {}
  
  static getInstance(): SelfHealingErrorHandler {
    if (!SelfHealingErrorHandler.instance) {
      SelfHealingErrorHandler.instance = new SelfHealingErrorHandler();
    }
    return SelfHealingErrorHandler.instance;
  }

  async handleError(error: Error, context?: ErrorContext): Promise<void> {
    console.error('Error caught by self-healing handler:', error);

    const errorType = this.classifyError(error);
    
    try {
      // Get current user if available
      const { data: { user } } = await supabase.auth.getUser();

      // Call self-healing edge function
      const { data, error: invokeError } = await supabase.functions.invoke('self-healing', {
        body: {
          error_type: errorType,
          error_message: error.message,
          stack_trace: error.stack,
          context: context || {},
          user_id: user?.id,
        },
      });

      if (invokeError) {
        console.error('Failed to invoke self-healing function:', invokeError);
        return;
      }

      console.log('Self-healing action taken:', data);
      
      // Apply local recovery if needed
      if (data?.recovery_action?.action) {
        await this.applyLocalRecovery(data.recovery_action.action);
      }
    } catch (err) {
      console.error('Self-healing handler failed:', err);
    }
  }

  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('memory') || message.includes('heap')) return 'MemoryError';
    if (message.includes('timeout') || message.includes('timed out')) return 'TimeoutError';
    if (message.includes('network') || message.includes('fetch')) return 'NetworkError';
    if (message.includes('auth') || message.includes('unauthorized')) return 'AuthError';
    if (message.includes('database') || message.includes('sql')) return 'DatabaseError';
    
    return error.name || 'UnknownError';
  }

  private async applyLocalRecovery(action: string): Promise<void> {
    switch (action) {
      case 'clear_cache':
        // Clear browser cache and optimize local storage
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        console.log('Local cache cleared');
        break;
        
      case 'refresh_auth':
        // Refresh the session
        await supabase.auth.refreshSession();
        console.log('Auth session refreshed');
        break;
        
      case 'retry_request':
        console.log('Request queued for retry');
        // Implement retry logic if needed
        break;
        
      default:
        console.log('No local recovery action needed');
    }
  }
}

// Global error handler wrapper
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> => {
  const handler = SelfHealingErrorHandler.getInstance();
  
  try {
    return await fn();
  } catch (error) {
    await handler.handleError(error as Error, context);
    return null;
  }
};

// React error boundary compatible handler
export const reportError = (error: Error, errorInfo?: any): void => {
  const handler = SelfHealingErrorHandler.getInstance();
  handler.handleError(error, { errorInfo });
};
