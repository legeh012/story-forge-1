import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export const useSelfHealing = () => {
  const reportError = useCallback(async (
    error: Error,
    context?: ErrorContext
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call self-healing edge function
      const { data, error: healingError } = await supabase.functions.invoke('self-healing', {
        body: {
          error_type: error.name || 'UnknownError',
          error_message: error.message,
          stack_trace: error.stack,
          context: context || {},
          user_id: user?.id
        }
      });

      if (healingError) {
        console.error('Self-healing failed:', healingError);
        return { success: false };
      }

      console.log('Self-healing response:', data);
      return data;
    } catch (err) {
      console.error('Failed to report error to self-healing system:', err);
      return { success: false };
    }
  }, []);

  return { reportError };
};
