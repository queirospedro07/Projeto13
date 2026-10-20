import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function siteMetadata(siteUrl = '') {
  let origin = '';

  if (siteUrl) {
    const url = new URL(siteUrl);

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('VITE_SITE_URL deve ser uma origem HTTPS sem caminhos ou credenciais.');
    }

    origin = url.origin;
  }

  return {
    name: 'site-metadata',
    apply: 'build',
    transformIndexHtml(html) {
      const result = html.replaceAll('https://nexo.pt', origin);

      return origin
        ? result
        : result.replace(
            'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
            'noindex, nofollow',
          );
    },
    writeBundle(options) {
      const output = options.dir || 'dist';
      const paths = ['/', '/explore', '/help', '/privacy', '/terms'];
      const robots = origin
        ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /creator\nDisallow: /settings\nDisallow: /messages\nDisallow: /profile\nDisallow: /learn\n\nSitemap: ${origin}/sitemap.xml\n`
        : 'User-agent: *\nDisallow: /\n';
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${origin ? paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n') : ''}\n</urlset>\n`;

      writeFileSync(resolve(output, 'robots.txt'), robots);
      writeFileSync(resolve(output, 'sitemap.xml'), sitemap);
    },
  };
}
