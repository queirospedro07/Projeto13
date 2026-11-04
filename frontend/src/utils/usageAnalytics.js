import { lerJsonCompativel } from './fieldCompatibility.js';
/**
 * Consent-based local analytics logger.
 * Stores anonymous event counts and pageviews locally or forwards to server telemetry.
 */

const STORAGE_KEY = 'nexo_analytics_events';
const temAnaliseConsentimento = () => {
  try {
    const raw = localStorage.getItem('nexo_cookie_consent');
    if (!raw || raw === 'rejeitado') return false;
    if (raw === 'accepted') return true;
    const parsed = lerJsonCompativel(raw);

    return parsed?.analytics === true;
  } catch {
    return false;
  }
};

const iniciarGA = () => {
  if (!temAnaliseConsentimento()) return;
};

export { iniciarGA as initGA };

export const registarPaginaVista = (caminho = window.location.pathname) => {
  try {
    if (!temAnaliseConsentimento()) return;
    const payload = {
      type: 'pageview',
      path: caminho,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      screen: `${window.innerWidth}x${window.innerHeight}`,
    };
    const existente = lerJsonCompativel(localStorage.getItem(STORAGE_KEY) || '[]');

    existente.push(payload);
    // Keep last 50 events in memory/localStorage
    if (existente.length > 50) existente.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existente));
    if (import.meta.env.DEV) {
      console.log('[Analytics PageView]', caminho);
    }
  } catch {
    // Mantém a utilização possível quando o navegador restringe o armazenamento.
  }
};

export const registarEvento = (eventoNome, properties = {}) => {
  try {
    if (!temAnaliseConsentimento()) return;
    const payload = {
      type: 'event',
      name: eventoNome,
      properties,
      timestamp: new Date().toISOString(),
    };
    const existente = lerJsonCompativel(localStorage.getItem(STORAGE_KEY) || '[]');

    existente.push(payload);
    if (existente.length > 50) existente.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existente));
    if (import.meta.env.DEV) {
      console.log('[Analytics Event]', eventoNome, properties);
    }
  } catch {
    // Silent fail
  }
};

export const obterGuardadoAnalise = () => {
  try {
    return lerJsonCompativel(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};
