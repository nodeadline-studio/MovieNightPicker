import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title = "MovieNightPicker - Find Your Perfect Movie Tonight | Random Movie Generator",
  description = "Discover your next favorite movie instantly! MovieNightPicker is the ultimate random movie generator and recommendation tool. Find movies by genre, year, rating, and mood. Perfect for movie night, date night, or when you can't decide what to watch. Free movie picker with thousands of films from all genres.",
  keywords = "movie picker, random movie generator, movie recommendation, what to watch, movie finder, film picker, movie night, random movie, movie selector, film recommendation, movie discovery, cinema picker, movie roulette, film finder, movie suggestions, what movie to watch, random film generator, movie database, film database, movie search, entertainment picker",
  ogImage = "https://movienightpicker.com/og-image.jpg"
}) => {
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic SEO meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', 'MovieNightPicker');
    setMetaTag('robots', 'index, follow');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph meta tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:url', window.location.href, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'MovieNightPicker', true);
    
    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    
    // Additional SEO tags
    setMetaTag('theme-color', '#1f2937');
    setMetaTag('application-name', 'MovieNightPicker');
    setMetaTag('apple-mobile-web-app-title', 'MovieNightPicker');
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    
    // Structured data for search engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "MovieNightPicker",
      "description": description,
      "url": "https://movienightpicker.com",
      "applicationCategory": "Entertainment",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "creator": {
        "@type": "Organization",
        "name": "MovieNightPicker"
      },
      "keywords": keywords.split(', ')
    };
    
    // Add or update structured data
    let structuredDataScript = document.querySelector('#structured-data') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);
    
  }, [title, description, keywords, ogImage]);

  return null; // This component doesn't render anything
};

export default SEOHead; 