import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Search, Filter, Video, Music, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MediaCard from "@/components/MediaCard";
import SocialShareDialog from "@/components/SocialShareDialog";

type MediaAsset = {
  id: string;
  asset_type: string;
  asset_url: string;
  created_at: string;
  episode_id: string | null;
  project_id: string | null;
  metadata: any;
};

const MediaLibrary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setLoading(false);
      fetchMediaAssets();
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMediaAssets = async () => {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching media",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMediaAssets(data || []);
    setFilteredAssets(data || []);
  };

  useEffect(() => {
    let filtered = mediaAssets;

    if (selectedType !== "all") {
      filtered = filtered.filter(asset => asset.asset_type === selectedType);
    }

    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(asset.metadata).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  }, [searchQuery, selectedType, mediaAssets]);

  const handleDownload = async (asset: MediaAsset) => {
    try {
      const response = await fetch(asset.asset_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.asset_type}-${asset.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your file is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const handleShare = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setShareDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    if (type.includes('audio')) return <Music className="h-4 w-4" />;
    if (type.includes('image')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getTypeStats = () => {
    const stats = {
      all: mediaAssets.length,
      video: mediaAssets.filter(a => a.asset_type.includes('video')).length,
      audio: mediaAssets.filter(a => a.asset_type.includes('audio')).length,
      image: mediaAssets.filter(a => a.asset_type.includes('image')).length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = getTypeStats();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Media Library
          </h1>
          <p className="text-muted-foreground">
            View, download, and share your generated content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border-primary/20 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold text-primary">{stats.all}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/50" />
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-accent/20 hover:border-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold text-accent">{stats.video}</p>
              </div>
              <Video className="h-8 w-8 text-accent/50" />
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-primary-glow/20 hover:border-primary-glow/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audio</p>
                <p className="text-2xl font-bold text-primary-glow">{stats.audio}</p>
              </div>
              <Music className="h-8 w-8 text-primary-glow/50" />
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-primary/20 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Images</p>
                <p className="text-2xl font-bold text-primary">{stats.image}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-primary/50" />
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredAssets.length === 0 ? (
          <Card className="p-12 text-center bg-card border-dashed">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No media assets found</h3>
            <p className="text-muted-foreground mb-6">
              {mediaAssets.length === 0 
                ? "Start creating episodes to generate media content"
                : "Try adjusting your search or filters"
              }
            </p>
            {mediaAssets.length === 0 && (
              <Button onClick={() => navigate('/episodes')}>
                Create Episode
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onDownload={handleDownload}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      <SocialShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        asset={selectedAsset}
      />
    </div>
  );
};

export default MediaLibrary;
