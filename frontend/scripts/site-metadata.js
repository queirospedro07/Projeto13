import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function siteMetadata(siteUrl = '') {
  let origem = '';
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
    origem = url.origin;
  }
  return {
    name: 'site-metadata',
    apply: 'build',
    transformIndexHtml(html) {
      const resultado = html.replaceAll('https://nexo.pt', origem);
      return origem
        ? resultado
        : resultado.replace(
            'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
            'noindex, nofollow',
          );
    },
    writeBundle(opcoes) {
      const output = opcoes.dir || 'dist';
      const paths = ['/', '/explorar', '/ajuda', '/privacidade', '/termos'];
      const robots = origem
        ? `User-agent: *\nAllow: /\nDisallow: /administracao\nDisallow: /formador\nDisallow: /definicoes\nDisallow: /mensagens\nDisallow: /perfil\nDisallow: /aprender\nDisallow: /painel\nDisallow: /biblioteca\nDisallow: /admin\nDisallow: /creator\nDisallow: /settings\nDisallow: /messages\nDisallow: /profile\nDisallow: /learn\n\nSitemap: ${origem}/sitemap.xml\n`
        : 'User-agent: *\nDisallow: /\n';
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${origem ? paths.map((caminho) => `  <url><loc>${origem}${caminho}</loc></url>`).join('\n') : ''}\n</urlset>\n`;
      writeFileSync(resolve(output, 'robots.txt'), robots);
      writeFileSync(resolve(output, 'sitemap.xml'), sitemap);
    },
  };
}
