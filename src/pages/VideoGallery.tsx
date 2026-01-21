import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { YouTubeVideoPlayer } from '@/components/YouTubeVideoPlayer';
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
import { Search, Grid3X3, LayoutGrid, Play } from 'lucide-react';

interface Video {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  category?: string;
}

// Sample video data - replace with actual data from your backend
const sampleVideos: Video[] = [
  {
    id: '1',
    videoId: 'dQw4w9WgXcQ',
    title: 'Episode 1: The Beginning',
    description: 'The journey starts here with our first episode.',
    aspectRatio: '16:9',
    category: 'Episodes',
  },
  {
    id: '2',
    videoId: 'jNQXAC9IVRw',
    title: 'Behind the Scenes',
    description: 'See how the magic happens behind the camera.',
    aspectRatio: '16:9',
    category: 'Behind the Scenes',
  },
  {
    id: '3',
    videoId: '9bZkp7q19f0',
    title: 'Episode 2: Rising Action',
    description: 'The drama intensifies in this thrilling episode.',
    aspectRatio: '16:9',
    category: 'Episodes',
  },
  {
    id: '4',
    videoId: 'kJQP7kiw5Fk',
    title: 'Character Spotlight: Main Cast',
    description: 'Get to know our main characters better.',
    aspectRatio: '16:9',
    category: 'Spotlights',
  },
  {
    id: '5',
    videoId: 'RgKAFK5djSk',
    title: 'Season Finale Teaser',
    description: 'A sneak peek at what is coming next.',
    aspectRatio: '16:9',
    category: 'Trailers',
  },
  {
    id: '6',
    videoId: 'JGwWNGJdvx8',
    title: 'Episode 3: The Twist',
    description: 'Nobody saw this coming!',
    aspectRatio: '16:9',
    category: 'Episodes',
  },
];

const categories = ['All', 'Episodes', 'Behind the Scenes', 'Spotlights', 'Trailers'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

const VideoGallery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [gridSize, setGridSize] = useState<'small' | 'large'>('large');

  const filteredVideos = sampleVideos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          </div>
        </header>

        {/* Video Grid */}
        <main className="container mx-auto px-4 py-8">
          {filteredVideos.length === 0 ? (
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
              {filteredVideos.map((video) => (
                <motion.div
                  key={video.id}
                  variants={itemVariants}
                  className="group"
                >
                  <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <YouTubeVideoPlayer
                      videoId={video.videoId}
                      title={video.title}
                      aspectRatio={video.aspectRatio || '16:9'}
                      showControls={true}
                    />
                    <div className="p-4">
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
                      </div>
                      {video.category && (
                        <span className="inline-block mt-3 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {video.category}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Video Count */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredVideos.length} of {sampleVideos.length} videos
          </div>
        </main>
      </div>
    </>
  );
};

export default VideoGallery;
