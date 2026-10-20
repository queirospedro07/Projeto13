import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { SEO } from '../src/components/SEO/SEO';
import { siteMetadata } from '../scripts/site-metadata';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  document.querySelector('link[rel="canonical"]')?.remove();
});

it('usa o domínio publicado em vez do domínio de exemplo das páginas', async () => {
  vi.stubEnv('VITE_SITE_URL', 'https://learning.company.pt');
  render(<SEO canonical="https://nexo.pt/login" />);
  await waitFor(() =>
    expect(document.querySelector('link[rel="canonical"]').href).toBe(
      'https://learning.company.pt/login',
    ),
  );
  expect(document.querySelector('meta[property="og:url"]').content).toBe(
    'https://learning.company.pt/login',
  );
});

it('valida o domínio do build e impede indexação quando ainda não foi configurado', () => {
  expect(() => siteMetadata('http://insecure.company.pt')).toThrow();
  expect(() => siteMetadata('https://learning.company.pt/path')).toThrow();

  const html =
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><link rel="canonical" href="https://nexo.pt/">';

  expect(siteMetadata().transformIndexHtml(html)).toContain('noindex, nofollow');
  expect(siteMetadata('https://learning.company.pt').transformIndexHtml(html)).toContain(
    'https://learning.company.pt/',
  );
});
