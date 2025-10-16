// Viral content optimization utilities

export const generateTrendingHashtags = (content: string, category: 'story' | 'video' | 'art' | 'general' = 'general'): string[] => {
  const baseHashtags = {
    story: ['#storytelling', '#creativewriting', '#writerscommunity', '#amwriting', '#writersofinstagram'],
    video: ['#viral', '#trending', '#foryou', '#fyp', '#viralvideo', '#contentcreator'],
    art: ['#digitalart', '#aiart', '#creativeart', '#artistsoninstagram', '#artoftheday'],
    general: ['#content', '#creative', '#innovation', '#ai', '#tech']
  };

  const trendingHashtags = [
    '#ai', '#artificialintelligence', '#contentcreation', '#creator',
    '#viral2024', '#trending2024', '#innovation', '#technology',
    '#storytelling', '#interactive', '#immersive', '#future'
  ];

  const categoryTags = baseHashtags[category] || baseHashtags.general;
  
  // Combine category-specific and trending hashtags
  const allTags = [...new Set([...categoryTags, ...trendingHashtags])];
  
  // Return top 15 most relevant
  return allTags.slice(0, 15);
};

export const optimizeForPlatform = (content: {
  title: string;
  description: string;
  tags?: string[];
}, platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook') => {
  const platformLimits = {
    youtube: {
      titleMax: 100,
      descMax: 5000,
      tagsMax: 500,
      hashtagsInTitle: true,
      hashtagsInDesc: true,
    },
    tiktok: {
      titleMax: 150,
      descMax: 2200,
      tagsMax: 100,
      hashtagsInTitle: true,
      hashtagsInDesc: true,
    },
    instagram: {
      titleMax: 2200,
      descMax: 2200,
      tagsMax: 30,
      hashtagsInTitle: true,
      hashtagsInDesc: true,
    },
    twitter: {
      titleMax: 280,
      descMax: 280,
      tagsMax: 10,
      hashtagsInTitle: true,
      hashtagsInDesc: false,
    },
    facebook: {
      titleMax: 255,
      descMax: 63206,
      tagsMax: 50,
      hashtagsInTitle: false,
      hashtagsInDesc: true,
    },
  };

  const limits = platformLimits[platform];
  
  let optimizedTitle = content.title.slice(0, limits.titleMax);
  let optimizedDesc = content.description.slice(0, limits.descMax);
  const hashtags = content.tags?.slice(0, limits.tagsMax) || [];

  // Add hashtags strategically
  if (limits.hashtagsInTitle && hashtags.length > 0) {
    const remainingTitleSpace = limits.titleMax - optimizedTitle.length;
    if (remainingTitleSpace > 15) {
      optimizedTitle += ' ' + hashtags.slice(0, 2).join(' ');
    }
  }

  if (limits.hashtagsInDesc) {
    const hashtagString = '\n\n' + hashtags.join(' ');
    if (optimizedDesc.length + hashtagString.length <= limits.descMax) {
      optimizedDesc += hashtagString;
    }
  }

  return {
    title: optimizedTitle.trim(),
    description: optimizedDesc.trim(),
    hashtags: hashtags,
    platform,
  };
};

export const generateViralTitle = (baseTitle: string, category: string): string => {
  const viralPrefixes = [
    'VIRAL:',
    '🔥',
    'TRENDING:',
    '⚡',
    'MUST WATCH:',
    '💯',
  ];

  const viralSuffixes = [
    '(You Won\'t Believe This!)',
    '🚀',
    '(MIND BLOWN)',
    '💥',
    '(VIRAL ALERT)',
  ];

  const prefix = viralPrefixes[Math.floor(Math.random() * viralPrefixes.length)];
  const suffix = viralSuffixes[Math.floor(Math.random() * viralSuffixes.length)];

  return `${prefix} ${baseTitle} ${suffix}`;
};

export const getBestPostingTimes = (platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook'): string[] => {
  const timings = {
    youtube: ['2PM-4PM EST', '8PM-11PM EST'],
    tiktok: ['6AM-10AM EST', '7PM-11PM EST'],
    instagram: ['11AM-1PM EST', '7PM-9PM EST'],
    twitter: ['8AM-10AM EST', '6PM-9PM EST'],
    facebook: ['1PM-4PM EST', '6PM-8PM EST'],
  };

  return timings[platform];
};

export const calculateViralScore = (metrics: {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  watchTime?: number;
}): number => {
  const weights = {
    views: 1,
    likes: 3,
    shares: 5,
    comments: 4,
    watchTime: 2,
  };

  let score = 0;
  score += (metrics.views || 0) * weights.views;
  score += (metrics.likes || 0) * weights.likes;
  score += (metrics.shares || 0) * weights.shares;
  score += (metrics.comments || 0) * weights.comments;
  score += (metrics.watchTime || 0) * weights.watchTime;

  return Math.min(Math.round(score / 1000), 100);
};

export const getContentOptimizationTips = (platform: string): string[] => {
  const tips = {
    youtube: [
      'Use custom thumbnails with high contrast and faces',
      'Add chapters/timestamps in description',
      'Include end screens and cards',
      'Create playlists for binge-watching',
      'Use YouTube Shorts for viral potential',
    ],
    tiktok: [
      'Hook viewers in first 3 seconds',
      'Use trending sounds and effects',
      'Post 3-5 times per day',
      'Engage with comments immediately',
      'Create series content for retention',
    ],
    instagram: [
      'Use all 30 hashtags strategically',
      'Post Reels for maximum reach',
      'Create carousel posts for engagement',
      'Use Instagram Stories with polls/questions',
      'Collaborate with other creators',
    ],
    twitter: [
      'Thread your content for engagement',
      'Use relevant trending hashtags',
      'Tweet during peak hours',
      'Include visual media always',
      'Engage with replies quickly',
    ],
    facebook: [
      'Go live regularly for algorithm boost',
      'Share to relevant groups',
      'Use Facebook Watch for video content',
      'Create events for engagement',
      'Utilize Facebook Stories',
    ],
  };

  return tips[platform as keyof typeof tips] || tips.youtube;
};
