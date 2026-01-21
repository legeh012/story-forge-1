import React from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import type { Video } from '@/hooks/useVideos';

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string, url: string) => void;
  onPlay?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete, onPlay }) => {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Video Preview */}
        <div className="relative aspect-video bg-muted">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <Play className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Play Overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => onPlay?.(video)}
          >
            <div className="rounded-full bg-primary p-3 shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
            </div>
          </div>

          {/* Category Badge */}
          {video.category && (
            <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-full">
              {video.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {video.description}
                </p>
              )}
            </div>

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete video?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      &quot;{video.title}&quot; from your library.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(video.id, video.video_url)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(video.created_at), 'MMM d, yyyy')}
            </span>
            {video.file_size && (
              <span>{formatFileSize(video.file_size)}</span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default VideoCard;
