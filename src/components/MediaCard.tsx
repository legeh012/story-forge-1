import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Video, Music, Image as ImageIcon, FileText, Eye } from "lucide-react";
import { useState } from "react";

type MediaAsset = {
  id: string;
  asset_type: string;
  asset_url: string;
  created_at: string;
  episode_id: string | null;
  project_id: string | null;
  metadata: any;
};

type MediaCardProps = {
  asset: MediaAsset;
  onDownload: (asset: MediaAsset) => void;
  onShare: (asset: MediaAsset) => void;
};

const MediaCard = ({ asset, onDownload, onShare }: MediaCardProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getTypeIcon = (type: string) => {
    if (type.includes('video')) return <Video className="h-5 w-5" />;
    if (type.includes('audio')) return <Music className="h-5 w-5" />;
    if (type.includes('image')) return <ImageIcon className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getTypeBadgeColor = (type: string) => {
    if (type.includes('video')) return 'bg-accent/20 text-accent border-accent/50';
    if (type.includes('audio')) return 'bg-primary-glow/20 text-primary-glow border-primary-glow/50';
    if (type.includes('image')) return 'bg-primary/20 text-primary border-primary/50';
    return 'bg-muted text-muted-foreground border-border';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPreview = () => {
    if (asset.asset_type.includes('video')) {
      return (
        <video 
          src={asset.asset_url} 
          controls 
          className="w-full h-48 object-cover rounded-t-lg bg-muted"
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (asset.asset_type.includes('image')) {
      return (
        <img 
          src={asset.asset_url} 
          alt="Media preview" 
          className="w-full h-48 object-cover rounded-t-lg bg-muted"
        />
      );
    }
    
    if (asset.asset_type.includes('audio')) {
      return (
        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary-glow/10 to-accent/10 rounded-t-lg">
          <Music className="h-16 w-16 text-primary-glow/50" />
        </div>
      );
    }
    
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg">
        <FileText className="h-16 w-16 text-primary/50" />
      </div>
    );
  };

  return (
    <Card className="overflow-hidden group hover:border-primary/50 transition-all">
      <div className="relative">
        {renderPreview()}
        <div className="absolute top-2 right-2">
          <Badge className={getTypeBadgeColor(asset.asset_type)}>
            <span className="flex items-center gap-1">
              {getTypeIcon(asset.asset_type)}
              {asset.asset_type.split('/')[0]}
            </span>
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground mb-1">
            Created {formatDate(asset.created_at)}
          </p>
          {asset.metadata?.title && (
            <h3 className="font-semibold text-foreground line-clamp-1">
              {asset.metadata.title}
            </h3>
          )}
          {asset.metadata?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {asset.metadata.description}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDownload(asset)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onShare(asset)}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        
        {asset.asset_type.includes('audio') && (
          <div className="mt-3">
            <audio src={asset.asset_url} controls className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MediaCard;
