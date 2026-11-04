import { useEffect } from 'react';

/**
 * Lightweight native SEO component that dynamically updates document title,
 * canonical link, OpenGraph, Twitter and description meta tags.
 */
export const SEO = ({
  title: titulo = 'NEXO — Cursos e comunidade de aprendizagem',
  description:
    descricao = 'NEXO — Plataforma de aprendizagem online, mentoria por voz e vídeo em direto, certificação digital verificada e estúdio de criadores em Portugal.',
  canonical,
  ogType = 'website',
  ogImage: ogImagem = '/hero-showcase.jpg',
  keywords = 'cursos online, formação prática, mentoria por voz e vídeo, certificados portugal, programação, marketing, negócios, NEXO',
  structuredData: structuredDados,
}) => {
  useEffect(() => {
    // 1. Page Title
    document.title = titulo.includes('NEXO') ? titulo : `${titulo} | NEXO`;

    // 2. Helper to set or update meta tag
    const definirMetaTag = (attribute, valor, conteudo) => {
      if (!conteudo) return;
      let element = document.querySelector(`meta[${attribute}="${valor}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, valor);
        document.head.appendChild(element);
      }

      element.setAttribute('content', conteudo);
    };

    // 3. Meta Description & Keywords
    definirMetaTag('name', 'description', descricao);
    definirMetaTag('name', 'keywords', keywords);

    // 4. OpenGraph
    definirMetaTag('property', 'og:title', titulo);
    definirMetaTag('property', 'og:description', descricao);
    definirMetaTag('property', 'og:type', ogType);
    definirMetaTag('property', 'og:site_name', 'NEXO');
    definirMetaTag('property', 'og:locale', 'pt_PT');
    if (ogImagem) {
      const completoImagemUrl = ogImagem.startsWith('http')
        ? ogImagem
        : `${window.location.origin}${ogImagem}`;

      definirMetaTag('property', 'og:image', completoImagemUrl);
    }

    const siteOrigem = import.meta.env.VITE_SITE_URL || window.location.origin;
    const canonicalCaminho = canonical
      ? new URL(canonical, siteOrigem).pathname
      : window.location.pathname;
    const atualUrl = new URL(canonicalCaminho, siteOrigem).href;

    definirMetaTag('property', 'og:url', atualUrl);

    // 5. Twitter Cartao
    definirMetaTag('name', 'twitter:card', 'summary_large_image');
    definirMetaTag('name', 'twitter:title', titulo);
    definirMetaTag('name', 'twitter:description', descricao);
    if (ogImagem) {
      const completoImagemUrl = ogImagem.startsWith('http')
        ? ogImagem
        : `${window.location.origin}${ogImagem}`;

      definirMetaTag('name', 'twitter:image', completoImagemUrl);
    }

    // 6. Canonical URL
    let canonicalLigacao = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLigacao) {
        canonicalLigacao = document.createElement('link');
        canonicalLigacao.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLigacao);
      }

      canonicalLigacao.setAttribute('href', atualUrl);
    } else if (canonicalLigacao) {
      canonicalLigacao.setAttribute('href', atualUrl);
    }

    // 7. Structured Data (JSON-LD)
    if (structuredDados) {
      let script = document.getElementById('nexo-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'nexo-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(structuredDados);
    }
  }, [titulo, descricao, canonical, ogType, ogImagem, keywords, structuredDados]);

  return null;
};

export default SEO;
