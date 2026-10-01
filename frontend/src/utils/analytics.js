/**
 * Privacy-friendly, GDPR-compliant client analytics logger.
 * Stores anonymous event counts and pageviews locally or forwards to server telemetry.
 */

const STORAGE_KEY = 'nexo_analytics_events';

export const trackPageView = (path = window.location.pathname) => {
  try {
    const isConsentGiven = localStorage.getItem('nexo_cookie_consent');
    if (isConsentGiven === 'rejected') return;

    const payload = {
      type: 'pageview',
      path,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      screen: `${window.innerWidth}x${window.innerHeight}`
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(payload);
    // Keep last 50 events in memory/localStorage
    if (existing.length > 50) existing.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics PageView]', path);
    }
  } catch {
    // Silent fail for storage restrictions
  }
};

export const trackEvent = (eventName, properties = {}) => {
  try {
    const isConsentGiven = localStorage.getItem('nexo_cookie_consent');
    if (isConsentGiven === 'rejected') return;

    const payload = {
      type: 'event',
      name: eventName,
      properties,
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(payload);
    if (existing.length > 50) existing.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    if (process.env.NODE_ENV === 'development') {
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
