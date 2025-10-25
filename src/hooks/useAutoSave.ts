import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  table: string;
  id: string | null;
  data: Record<string, any>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ table, id, data, delay = 2000, enabled = true }: AutoSaveOptions) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  const save = useCallback(async () => {
    if (!id || !enabled) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your changes are saved locally. We'll retry automatically.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [id, table, data, enabled, toast]);

  useEffect(() => {
    if (!enabled || !id) return;

    const currentData = JSON.stringify(data);
    
    // Only save if data actually changed
    if (currentData === previousDataRef.current) return;
    
    previousDataRef.current = currentData;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, id, save]);

  return {
    isSaving,
    lastSaved,
    save,
  };
};
