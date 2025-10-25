import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface EpisodeCleanupProps {
  currentEpisodeId: string;
  currentEpisodeTitle: string;
}

export const EpisodeCleanup = ({ currentEpisodeId, currentEpisodeTitle }: EpisodeCleanupProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCleanup = async () => {
    try {
      setIsDeleting(true);
      toast.loading("🗑️ Deleting old episodes...");

      const { data, error } = await supabase.functions.invoke('cleanup-old-episodes', {
        body: { keepEpisodeId: currentEpisodeId }
      });

      if (error) throw error;

      toast.dismiss();
      toast.success(`✅ Deleted ${data.deletedCount} old episodes`);
      
      // Refresh the page to show updated list
      setTimeout(() => window.location.reload(), 1000);

    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.dismiss();
      toast.error(`Failed to cleanup episodes: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-4 border-destructive/50 bg-destructive/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">🗑️ Clean Up Old Episodes</h3>
          <p className="text-xs text-muted-foreground">
            Delete all episodes except: <span className="font-medium">{currentEpisodeTitle}</span>
          </p>
        </div>
        <Button
          onClick={handleCleanup}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Old Episodes
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
