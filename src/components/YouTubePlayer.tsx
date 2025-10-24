interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function YouTubePlayer({ 
  videoId, 
  title = "YouTube video",
  autoplay = false,
  className = ""
}: YouTubePlayerProps) {
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&playsinline=1`;

  return (
    <div className={`relative w-full ${className}`} style={{ paddingTop: "56.25%" }}>
      <iframe
        src={src}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
