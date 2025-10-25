import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeUploadRequest {
  videoUrl: string;
  title: string;
  description: string;
  episodeId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { videoUrl, title, description, episodeId }: YouTubeUploadRequest = await req.json();

    console.log('Starting YouTube upload for episode:', episodeId);

    // Get YouTube credentials from secrets
    const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID');
    const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    const YOUTUBE_REFRESH_TOKEN = Deno.env.get('YOUTUBE_REFRESH_TOKEN');

    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
      throw new Error('YouTube credentials not configured');
    }

    // Get access token from refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        refresh_token: YOUTUBE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to get YouTube access token: ${error}`);
    }

    const { access_token } = await tokenResponse.json();

    // Download video from storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video from storage');
    }

    const videoBlob = await videoResponse.blob();
    const videoBuffer = await videoBlob.arrayBuffer();

    // Prepare metadata
    const metadata = {
      snippet: {
        title: title,
        description: description,
        tags: ['AI Generated', 'Reality TV', 'StoryForge'],
        categoryId: '24', // Entertainment category
      },
      status: {
        privacyStatus: 'public', // or 'private' or 'unlisted'
        selfDeclaredMadeForKids: false,
      },
    };

    // Upload to YouTube
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: video/*\r\n\r\n';

    const multipartRequestBodyEnd = closeDelimiter;

    const contentLength =
      new TextEncoder().encode(multipartRequestBody).length +
      videoBuffer.byteLength +
      new TextEncoder().encode(multipartRequestBodyEnd).length;

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': contentLength.toString(),
        },
        body: new Blob([
          new TextEncoder().encode(multipartRequestBody),
          videoBuffer,
          new TextEncoder().encode(multipartRequestBodyEnd),
        ]),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`YouTube upload failed: ${error}`);
    }

    const uploadResult = await uploadResponse.json();
    const youtubeVideoId = uploadResult.id;
    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

    console.log('Successfully uploaded to YouTube:', youtubeUrl);

    // Update episode with YouTube URL
    await supabaseClient
      .from('episodes')
      .update({
        video_url: youtubeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', episodeId);

    return new Response(
      JSON.stringify({
        success: true,
        youtubeUrl: youtubeUrl,
        videoId: youtubeVideoId,
        message: 'Video uploaded to YouTube successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('YouTube upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to upload video to YouTube'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
