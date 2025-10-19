import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Facebook, Instagram, Twitter, Share2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

type MediaAsset = {
  id: string;
  asset_type: string;
  asset_url: string;
  created_at: string;
  episode_id: string | null;
  project_id: string | null;
  metadata: any;
};

type SocialShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: MediaAsset | null;
};

const SocialShareDialog = ({ open, onOpenChange, asset }: SocialShareDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    if (asset) {
      navigator.clipboard.writeText(asset.asset_url);
      setLinkCopied(true);
      toast({
        title: "Link copied",
        description: "Media URL copied to clipboard",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleYouTubeUpload = async () => {
    setUploading(true);
    // TODO: Implement YouTube upload via edge function
    toast({
      title: "Coming Soon",
      description: "YouTube upload functionality will be available soon. Configure your YouTube API credentials in settings.",
      variant: "destructive",
    });
    setUploading(false);
  };

  const handleTikTokUpload = async () => {
    setUploading(true);
    // TODO: Implement TikTok upload via edge function
    toast({
      title: "Coming Soon",
      description: "TikTok upload functionality will be available soon. Configure your TikTok API credentials in settings.",
      variant: "destructive",
    });
    setUploading(false);
  };

  const handleInstagramShare = async () => {
    setUploading(true);
    // TODO: Implement Instagram share via edge function
    toast({
      title: "Coming Soon",
      description: "Instagram sharing will be available soon. Configure your Instagram API credentials in settings.",
      variant: "destructive",
    });
    setUploading(false);
  };

  const handleTwitterShare = async () => {
    if (asset) {
      const text = encodeURIComponent(title || "Check out my creation!");
      const url = encodeURIComponent(asset.asset_url);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
  };

  const handleFacebookShare = async () => {
    if (asset) {
      const url = encodeURIComponent(asset.asset_url);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  if (!asset) return null;

  const isVideo = asset.asset_type.includes('video');
  const isImage = asset.asset_type.includes('image');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share to Social Media</DialogTitle>
          <DialogDescription>
            Upload or share your content across multiple platforms
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Direct Link</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="quick-share">Quick Share</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Media URL</Label>
              <div className="flex gap-2">
                <Input value={asset.asset_url} readOnly className="flex-1" />
                <Button variant="outline" onClick={handleCopyLink}>
                  {linkCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy this link to share your media directly
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your upload"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Button
                onClick={handleYouTubeUpload}
                disabled={uploading || !isVideo}
                className="bg-[hsl(0_100%_50%)] hover:bg-[hsl(0_100%_45%)] text-primary-foreground"
              >
                <Youtube className="mr-2 h-4 w-4" />
                Upload to YouTube
              </Button>

              <Button
                onClick={handleTikTokUpload}
                disabled={uploading || !isVideo}
                className="bg-[hsl(0_0%_0%)] hover:bg-[hsl(0_0%_20%)] text-primary-foreground"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Upload to TikTok
              </Button>

              <Button
                onClick={handleInstagramShare}
                disabled={uploading || (!isVideo && !isImage)}
                className="bg-gradient-to-r from-[hsl(280_90%_60%)] to-[hsl(340_85%_60%)] hover:from-[hsl(280_90%_55%)] hover:to-[hsl(340_85%_55%)] text-primary-foreground"
              >
                <Instagram className="mr-2 h-4 w-4" />
                Share to Instagram
              </Button>
            </div>

            {!isVideo && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Video uploads are only available for video content
              </p>
            )}
          </TabsContent>

          <TabsContent value="quick-share" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share directly to social platforms without uploading
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleTwitterShare}
                variant="outline"
                className="border-blue-500 hover:bg-blue-50"
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-500" />
                Share on Twitter
              </Button>

              <Button
                onClick={handleFacebookShare}
                variant="outline"
                className="border-blue-600 hover:bg-blue-50"
              >
                <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                Share on Facebook
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShareDialog;
