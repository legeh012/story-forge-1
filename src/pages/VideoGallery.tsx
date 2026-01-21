import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3X3, LayoutGrid, Play, Loader2 } from 'lucide-react';
import { VideoUploader } from '@/components/VideoUploader';
import { VideoCard } from '@/components/VideoCard';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { useVideos, type Video } from '@/hooks/useVideos';
import { YouTubeVideoPlayer } from '@/components/YouTubeVideoPlayer';

// Sample YouTube videos as fallback when no uploaded videos exist
const sampleYouTubeVideos = [
  {
    id: 'yt-1',
    videoId: 'dQw4w9WgXcQ',
    title: 'Episode 1: The Beginning',
    description: 'The journey starts here with our first episode.',
    category: 'Episodes',
  },
  {
    id: 'yt-2',
    videoId: 'jNQXAC9IVRw',
    title: 'Behind the Scenes',
    description: 'See how the magic happens behind the camera.',
    category: 'Behind the Scenes',
  },
];

const categories = ['All', 'Episodes', 'Behind the Scenes', 'Spotlights', 'Trailers', 'Uncategorized'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const VideoGallery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [gridSize, setGridSize] = useState<'small' | 'large'>('large');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const { videos, loading, refetch, deleteVideo } = useVideos();

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, searchQuery, selectedCategory]);

  const handleDeleteVideo = async (id: string, url: string) => {
    await deleteVideo(id, url);
  };

  return (
    <>
      <SEOHead
        title="Video Gallery | Motion Picture Collection"
        description="Browse our collection of videos including episodes, behind the scenes, and exclusive content."
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Play className="h-8 w-8 text-primary" />
                  Video Gallery
                </h1>
                <p className="text-muted-foreground mt-1">
                  Browse and watch our video collection
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Grid Size Toggle */}
                <div className="flex gap-1 border border-border rounded-md p-1">
                  <Button
                    variant={gridSize === 'large' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setGridSize('large')}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'small' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setGridSize('small')}
                    className="h-8 w-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="mt-4">
              <VideoUploader onUploadComplete={refetch} categories={categories} />
            </div>
          </div>
        </header>

        {/* Video Grid */}
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground mt-4">Loading videos...</p>
            </div>
          ) : filteredVideos.length === 0 && videos.length === 0 ? (
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <Play className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">No videos uploaded yet</h2>
                <p className="text-muted-foreground mt-2">
                  Upload your first video using the button above, or browse sample content below.
                </p>
              </motion.div>

              {/* Sample YouTube Videos */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Sample Videos</h3>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`grid gap-6 ${
                    gridSize === 'large'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}
                >
                  {sampleYouTubeVideos.map((video) => (
                    <motion.div key={video.id} variants={itemVariants}>
                      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <YouTubeVideoPlayer
                          videoId={video.videoId}
                          title={video.title}
                          aspectRatio="16:9"
                          showControls={true}
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground truncate">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                          <span className="inline-block mt-3 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            {video.category}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Play className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-foreground">No videos found</h2>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filter criteria
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`grid gap-6 ${
                gridSize === 'large'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDeleteVideo}
                    onPlay={setSelectedVideo}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Video Count */}
          {!loading && videos.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredVideos.length} of {videos.length} videos
            </div>
          )}
        </main>

        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayerModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </div>
    </>
  );
};

export default VideoGallery;
