import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Video, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  title: string;
  category: string;
}

interface VideoUploaderProps {
  onUploadComplete?: () => void;
  categories: string[];
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  categories,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upload videos.',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported video format.`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 500MB limit.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
      title: file.name.replace(/\.[^/.]+$/, ''),
      category: 'Uncategorized',
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (const uploadFile of newUploadingFiles) {
      await uploadVideo(uploadFile, user.id);
    }
  }, [toast]);

  const uploadVideo = async (uploadFile: UploadingFile, userId: string) => {
    try {
      const fileExt = uploadFile.file.name.split('.').pop();
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id && f.status === 'uploading' && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, uploadFile.file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Insert video metadata
      const { error: dbError } = await supabase.from('videos').insert({
        user_id: userId,
        title: uploadFile.title,
        video_url: publicUrl,
        category: uploadFile.category,
        file_size: uploadFile.file.size,
      });

      if (dbError) throw dbError;

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, progress: 100, status: 'completed' as const }
            : f
        )
      );

      toast({
        title: 'Upload complete',
        description: `${uploadFile.title} has been uploaded successfully.`,
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      );

      toast({
        title: 'Upload failed',
        description: `Failed to upload ${uploadFile.title}.`,
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const updateFileMetadata = (id: string, field: 'title' | 'category', value: string) => {
    setUploadingFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(!isOpen)} className="gap-2">
        <Upload className="h-4 w-4" />
        Upload Videos
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Drop Zone */}
            <Card
              className={`relative border-2 border-dashed transition-colors p-8 ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div
                  className={`rounded-full p-4 transition-colors ${
                    isDragging ? 'bg-primary/20' : 'bg-muted'
                  }`}
                >
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Drag and drop videos here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • MP4, WebM, OGG, MOV up to 500MB
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
            </Card>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Uploads ({uploadingFiles.length})
                  </h3>
                  {uploadingFiles.some(f => f.status === 'completed') && (
                    <Button variant="ghost" size="sm" onClick={clearCompleted}>
                      Clear completed
                    </Button>
                  )}
                </div>

                {uploadingFiles.map(file => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {file.status === 'uploading' && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {file.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={file.title}
                            onChange={e =>
                              updateFileMetadata(file.id, 'title', e.target.value)
                            }
                            placeholder="Video title"
                            className="h-8 text-sm"
                            disabled={file.status !== 'uploading'}
                          />
                          <Select
                            value={file.category}
                            onValueChange={value =>
                              updateFileMetadata(file.id, 'category', value)
                            }
                            disabled={file.status !== 'uploading'}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c !== 'All').map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                              <SelectItem value="Uncategorized">
                                Uncategorized
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {file.status === 'uploading' && (
                          <div className="space-y-1">
                            <Progress value={file.progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">
                              Uploading... {file.progress}%
                            </p>
                          </div>
                        )}

                        {file.status === 'error' && (
                          <p className="text-xs text-destructive">{file.error}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {(file.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoUploader;
