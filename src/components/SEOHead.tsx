import { useEffect } from 'react';

type SEOHeadProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

const SEOHead = ({
  title = 'StoryForge - AI-Powered Interactive Storytelling Platform',
  description = 'Create viral interactive stories with persistent characters, episodic storytelling, and cross-platform deployment—all powered by advanced AI. Share to YouTube, TikTok, Instagram instantly.',
  image = 'https://lovable.dev/opengraph-image-p98pqg.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  keywords = ['AI storytelling', 'interactive stories', 'content creation', 'viral videos', 'social media', 'YouTube automation', 'TikTok content', 'Instagram reels'],
  author = 'StoryForge',
  publishedTime,
  modifiedTime,
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, useProperty = true) => {
      const attribute = useProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Standard meta tags
    updateMetaTag('description', description, false);
    updateMetaTag('keywords', keywords.join(', '), false);
    updateMetaTag('author', author, false);

    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'StoryForge');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:image', image, false);
    updateMetaTag('twitter:site', '@storyforge', false);
    updateMetaTag('twitter:creator', '@storyforge', false);

    // Article meta tags
    if (type === 'article' && publishedTime) {
      updateMetaTag('article:published_time', publishedTime);
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime);
      }
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // JSON-LD structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'StoryForge',
      description: description,
      url: url,
      image: image,
      applicationCategory: 'MultimediaApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '1250',
      },
    };

    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [title, description, image, url, type, keywords, author, publishedTime, modifiedTime]);

  return null;
};

export default SEOHead;
