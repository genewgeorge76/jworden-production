// Thin wrapper around Google Analytics 4 + Google Ads conversion tracking.
// Uses the global gtag() function loaded in index.html. All calls are safe no-ops
// if gtag isn't available yet (e.g. during SSR or before the script loads).

import {
  getAttributionEventParams,
  getOfflineConversionIdentifiers,
  persistAttribution,
} from '@/lib/adsAttribution';

// ─────────────────────────────────────────────────────────────
// GOOGLE ADS CONVERSION IDs
// ─────────────────────────────────────────────────────────────
// Your Google Ads account ID (installed in index.html): AW-18031160509
//
// To activate conversion tracking, create 2 conversion actions in Google Ads:
//   Tools → Conversions → + New conversion action → "Website"
//
// 1. LEAD SUBMITTED — fires when someone completes the quote form
//    Name it: "Quote Form Submit"
//    Value: Use the same value for each conversion → $250
//
// 2. PHONE CLICK — fires when someone clicks a phone number
//    Name it: "Phone Call Click"
//    Value: Use the same value for each conversion → $150
//
// After creating each, Google gives you a "Conversion label" (e.g. "AbC-D_efGhIjKl")
// Paste them below — replace PASTE_LEAD_LABEL and PASTE_PHONE_LABEL.
const GADS_ID = import.meta.env.VITE_GADS_ID || 'AW-1410045668';
const LEAD_LABEL = import.meta.env.VITE_GADS_LABEL_LEAD_FORM || 'PASTE_LEAD_LABEL';
const PHONE_LABEL = import.meta.env.VITE_GADS_LABEL_PHONE_CLICK || 'PASTE_PHONE_LABEL';

const GADS_LEAD_CONVERSION = `${GADS_ID}/${LEAD_LABEL}`;
const GADS_PHONE_CONVERSION = `${GADS_ID}/${PHONE_LABEL}`;

const hasGtag = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Track a GA4 event.
 * @param {string} eventName - GA4 event name (e.g. 'lead_submitted', 'photo_analyzed')
 * @param {object} params - event parameters (value, currency, etc.)
 */
export const trackEvent = (eventName, params = {}) => {
  persistAttribution();
  if (!hasGtag()) return;
  window.gtag('event', eventName, { ...getAttributionEventParams(), ...params });
};

/**
 * Fire a Google Ads conversion.
 * Call this when a real business event happens (lead submitted, call clicked).
 * @param {string} sendTo - e.g. 'AW-XXXXXXXX/YYYYYYYY' (Ads conversion ID + label)
 * @param {object} params - { value, currency, transaction_id }
 */
export const trackConversion = (sendTo, params = {}) => {
  if (!hasGtag()) return;
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    ...params,
  });
};

/**
 * Convenience: track a lead submission to both GA4 and Google Ads.
 * Replace the AW-XXXXXXXX/YYYYYYYY with your real Ads conversion ID when you
 * create it in Google Ads (Tools & Settings → Conversions).
 */
export const trackLeadSubmission = (lead = {}) => {
  // GA4 event
  trackEvent('generate_lead', {
    surface_type: lead.surface_type,
    sqft: lead.sqft,
    urgency: lead.urgency,
    lead_id: lead.id,
    value: 250, // estimated lead value for ROAS math
    currency: 'USD',
  });

  // Google Ads conversion — only fires once you paste your conversion label above
  if (!GADS_LEAD_CONVERSION.includes('PASTE_')) {
    trackConversion(GADS_LEAD_CONVERSION, {
      value: 250,
      currency: 'USD',
    });
  }
};

export const trackLeadOutcome = (lead = {}) => {
  const closedValue = Number(lead.closed_value || lead.contract_value || 0);
  const grossProfit = Number(lead.closed_gross_profit || 0);

  trackEvent('lead_outcome_recorded', {
    lead_id: lead.id,
    status: lead.status,
    conversion_source: lead.conversion_source,
    gross_margin_band: lead.gross_margin_band,
    closed_value: closedValue || undefined,
    gross_profit: grossProfit || undefined,
    value: closedValue || undefined,
    currency: closedValue ? 'USD' : undefined,
  });
};

export const buildOfflineConversionPayload = (lead = {}) => {
  const ids = getOfflineConversionIdentifiers();
  const conversionValue = Number(lead.closed_value || lead.contract_value || 0);
  const conversionDateTime = lead.closed_at || new Date().toISOString();

  return {
    lead_id: lead.id,
    conversion_name: 'Quote Form Submit',
    conversion_time: conversionDateTime,
    conversion_value: conversionValue,
    currency: 'USD',
    gclid: lead.gclid || ids.gclid || undefined,
    wbraid: lead.wbraid || ids.wbraid || undefined,
    gbraid: lead.gbraid || ids.gbraid || undefined,
    eligible: Boolean(conversionValue > 0 && (lead.gclid || ids.gclid || lead.wbraid || ids.wbraid || lead.gbraid || ids.gbraid)),
  };
};

export const trackOfflineConversionReady = (lead = {}) => {
  const payload = buildOfflineConversionPayload(lead);
  trackEvent('offline_conversion_ready', {
    lead_id: payload.lead_id,
    conversion_name: payload.conversion_name,
    conversion_value: payload.conversion_value || undefined,
    gclid_present: Boolean(payload.gclid),
    wbraid_present: Boolean(payload.wbraid),
    gbraid_present: Boolean(payload.gbraid),
    eligible: payload.eligible,
    currency: payload.conversion_value ? 'USD' : undefined,
  });
  return payload;
};

export const trackLandingPageView = (page = {}) => {
  trackEvent('landing_page_view', {
    landing_slug: page.slug,
    landing_keyword: page.primaryKeyword,
    ad_intent: page.adIntent,
    ad_group: page.adGroup,
    keyword_cluster: Array.isArray(page.keywordCluster)
      ? page.keywordCluster.join(' | ')
      : undefined,
  });
};

export const trackLandingPrimaryCta = (page = {}, location = 'unknown') => {
  trackEvent('landing_primary_cta_click', {
    landing_slug: page.slug,
    landing_keyword: page.primaryKeyword,
    ad_intent: page.adIntent,
    ad_group: page.adGroup,
    keyword_cluster: Array.isArray(page.keywordCluster)
      ? page.keywordCluster.join(' | ')
      : undefined,
    cta_location: location,
    value: 35,
    currency: 'USD',
  });
};

export const trackQualifiedLeadSignal = (page = {}, signal = 'unknown') => {
  trackEvent('qualified_lead_signal', {
    landing_slug: page.slug,
    landing_keyword: page.primaryKeyword,
    ad_intent: page.adIntent,
    ad_group: page.adGroup,
    keyword_cluster: Array.isArray(page.keywordCluster)
      ? page.keywordCluster.join(' | ')
      : undefined,
    signal,
    value: 120,
    currency: 'USD',
  });
};

/**
 * Track when someone clicks the phone CTA — a strong intent signal.
 */
export const trackPhoneClick = (source = 'unknown') => {
  trackEvent('phone_click', { source });
  if (!GADS_PHONE_CONVERSION.includes('PASTE_')) {
    trackConversion(GADS_PHONE_CONVERSION, {
      value: 150,
      currency: 'USD',
    });
  }
};

/**
 * Track AI photo analyzer usage.
 */
export const trackPhotoAnalysis = (result = {}) => {
  trackEvent('photo_analyzed', {
    condition_grade: result.condition_grade,
    recommended_action: result.recommended_action,
  });
};
