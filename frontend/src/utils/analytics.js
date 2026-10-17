/**
 * Consent-based local analytics logger.
 * Stores anonymous event counts and pageviews locally or forwards to server telemetry.
 */

const STORAGE_KEY = 'nexo_analytics_events';
const hasAnalyticsConsent = () => {
  try {
    const raw = localStorage.getItem('nexo_cookie_consent');
    if (!raw || raw === 'rejected') return false;
    if (raw === 'accepted') return true;
    const parsed = JSON.parse(raw);
    return parsed?.analytics === true;
  } catch {
    return false;
  }
};
export const initGA = () => {
  if (!hasAnalyticsConsent()) return;
};
export const trackPageView = (path = window.location.pathname) => {
  try {
    if (!hasAnalyticsConsent()) return;
    const payload = {
      type: 'pageview',
      path,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      screen: `${window.innerWidth}x${window.innerHeight}`,
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(payload);
    // Keep last 50 events in memory/localStorage
    if (existing.length > 50) existing.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    if (import.meta.env.DEV) {
      console.log('[Analytics PageView]', path);
    }
  } catch {
    // Silent fail for storage restrictions
  }
};
export const trackEvent = (eventName, properties = {}) => {
  try {
    if (!hasAnalyticsConsent()) return;
    const payload = {
      type: 'event',
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(payload);
    if (existing.length > 50) existing.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    if (import.meta.env.DEV) {
      console.log('[Analytics Event]', eventName, properties);
    }
  } catch {
    // Silent fail
  }
};
export const getStoredAnalytics = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};
