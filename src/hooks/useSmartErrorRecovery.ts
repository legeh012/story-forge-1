import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSelfHealing } from './useSelfHealing';

interface ErrorRecoveryState {
  retrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
  component?: string;
  action?: string;
}

export const useSmartErrorRecovery = () => {
  const { toast } = useToast();
  const { reportError } = useSelfHealing();
  const [state, setState] = useState<ErrorRecoveryState>({
    retrying: false,
    retryCount: 0,
    lastError: null,
  });

  const withRecovery = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: RecoveryOptions = {}
    ): Promise<T | null> => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        onSuccess,
        onFailure,
        component,
        action,
      } = options;

      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          setState((prev) => ({ ...prev, retrying: attempt > 0 }));
          const result = await operation();
          
          if (attempt > 0) {
            toast({
              title: "Operation successful",
              description: "Recovered automatically after temporary issue",
            });
          }
          
          setState({ retrying: false, retryCount: 0, lastError: null });
          onSuccess?.();
          return result;
        } catch (error) {
          attempt++;
          const err = error instanceof Error ? error : new Error(String(error));
          
          setState((prev) => ({ 
            ...prev, 
            retryCount: attempt,
            lastError: err 
          }));

          // Report to self-healing system
          await reportError(err, {
            component,
            action,
            metadata: { attempt, maxRetries }
          });

          if (attempt >= maxRetries) {
            setState((prev) => ({ ...prev, retrying: false }));
            onFailure?.(err);
            
            toast({
              title: "Operation failed",
              description: `${err.message}. Please try again or contact support.`,
              variant: "destructive",
            });
            
            return null;
          }

          // Show retry notification
          if (attempt < maxRetries) {
            toast({
              title: "Temporary issue detected",
              description: `Automatically retrying (${attempt}/${maxRetries})...`,
            });
            
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }
        }
      }

      return null;
    },
    [reportError, toast]
  );

  return {
    withRecovery,
    state,
    isRetrying: state.retrying,
    retryCount: state.retryCount,
  };
};
