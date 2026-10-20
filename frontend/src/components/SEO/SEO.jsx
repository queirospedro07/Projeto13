import { useEffect } from 'react';

/**
 * Lightweight native SEO component that dynamically updates document title,
 * canonical link, OpenGraph, Twitter and description meta tags.
 */
export const SEO = ({
  title = 'NEXO — Cursos e comunidade de aprendizagem',
  description = 'NEXO — Plataforma de aprendizagem online, mentoria por voz e vídeo em direto, certificação digital verificada e estúdio de criadores em Portugal.',
  canonical,
  ogType = 'website',
  ogImage = '/hero-showcase.jpg',
  keywords = 'cursos online, formação prática, mentoria por voz e vídeo, certificados portugal, programação, marketing, negócios, NEXO',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Page Title
    document.title = title.includes('NEXO') ? title : `${title} | NEXO`;

    // 2. Helper to set or update meta tag
    const setMetaTag = (attribute, value, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attribute}="${value}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // 3. Meta Description & Keywords
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);

    // 4. OpenGraph
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'NEXO');
    setMetaTag('property', 'og:locale', 'pt_PT');
    if (ogImage) {
      const fullImageUrl = ogImage.startsWith('http')
        ? ogImage
        : `${window.location.origin}${ogImage}`;

      setMetaTag('property', 'og:image', fullImageUrl);
    }

    const siteOrigin = import.meta.env.VITE_SITE_URL || window.location.origin;
    const canonicalPath = canonical
      ? new URL(canonical, siteOrigin).pathname
      : window.location.pathname;
    const currentUrl = new URL(canonicalPath, siteOrigin).href;

    setMetaTag('property', 'og:url', currentUrl);

    // 5. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      const fullImageUrl = ogImage.startsWith('http')
        ? ogImage
        : `${window.location.origin}${ogImage}`;

      setMetaTag('name', 'twitter:image', fullImageUrl);
    }

    // 6. Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }

      canonicalLink.setAttribute('href', currentUrl);
    } else if (canonicalLink) {
      canonicalLink.setAttribute('href', currentUrl);
    }

    // 7. Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.getElementById('nexo-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'nexo-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, canonical, ogType, ogImage, keywords, structuredData]);

  return null;
};

export default SEO;
