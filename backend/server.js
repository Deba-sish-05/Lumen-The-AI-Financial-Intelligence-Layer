// server.js
/**
 * Server for GST verification with key rotation + caching.
 *
 * NOTE: Verify the provider endpoint & header requirements in the KnowYourGST docs.
 * I used an example URL below. If KnowYourGST expects a different endpoint or headers,
 * adjust buildRequestConfig() accordingly.
 */

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const dotenv = require('dotenv');

dotenv.config();

/* ===== Configuration from .env ===== */
const PORT = process.env.PORT || 4000;
const RAW_KEYS_ENV = process.env.KNOWYOURGST_KEYS || '';
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
const KEY_COOLDOWN_SECONDS = Number(process.env.KEY_COOLDOWN_SECONDS || 300);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

/* ===== Helpers: parse keys from .env ===== */
function parseKeys(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .map(s => s.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}
const API_KEYS = parseKeys(RAW_KEYS_ENV);

if (API_KEYS.length === 0) {
  console.warn('WARNING: No KNOWYOURGST_KEYS found in .env (API_KEYS is empty).');
}

/* ===== In-memory state ===== */
// NodeCache for caching GSTIN responses (auto TTL)
const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS, checkperiod: Math.max(60, Math.floor(CACHE_TTL_SECONDS / 2)) });

// key state: stores { cooldownUntil: epochMs, lastError: string }
const keyState = {}; // keyed by API key string
API_KEYS.forEach(k => { keyState[k] = { cooldownUntil: 0, lastError: null }; });

/* ===== Key cooldown helpers ===== */
function isKeyCooled(key) {
  const st = keyState[key];
  if (!st) return false;
  return (st.cooldownUntil || 0) > Date.now();
}

function markKeyCooldown(key, reason) {
  if (!keyState[key]) keyState[key] = {};
  const until = Date.now() + (KEY_COOLDOWN_SECONDS * 1000);
  keyState[key].cooldownUntil = until;
  keyState[key].lastError = reason ? String(reason) : 'cooldown';
  console.warn(`[KeyCooldown] Marked key (prefix=${key.slice(0,6)}) on cooldown until ${new Date(until).toISOString()} (reason: ${reason})`);
}

/* ===== Build request to KnowYourGST =====
 * NOTE: Confirm the correct URL, headers, and param names from the provider docs.
 * Example used below might need to be updated to match the real API:
 *  - Example URL pattern used: https://www.knowyourgst.com/developers/gstincall/?passthrough=<key>&gstin=<gstin>
 *  - You might instead have to call: https://api.knowyourgst.com/v1/gstin/<gstin> with header 'X-API-KEY'
 */
function buildRequestConfig(key, gstin) {
  // Example: passthrough param style (adjust if provider uses a different scheme)
  const url = `https://www.knowyourgst.com/developers/gstincall/?passthrough=${encodeURIComponent(key)}&gstin=${encodeURIComponent(gstin)}`;
  return {
    method: 'get',
    url,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Accept': 'application/json',
      // If provider expects API key as header instead, replace the above URL usage and use:
      // 'X-API-KEY': key
    }
  };
}

/* ===== Key rotation logic ===== */
function partitionKeysByCooldown() {
  const fresh = [], cooled = [];
  for (const k of API_KEYS) {
    if (isKeyCooled(k)) cooled.push(k); else fresh.push(k);
  }
  return { fresh, cooled };
}

/**
 * Try the provider using keys in order. Prefers fresh keys; cooled keys are attempted as fallback.
 * Returns { keyUsed, data } on success, or throws an Error / object on failure.
 */
async function callProviderWithRotation(gstin) {
  if (!API_KEYS || API_KEYS.length === 0) {
    throw new Error('No KnowYourGST API keys configured.');
  }

  const { fresh, cooled } = partitionKeysByCooldown();
  const orderedKeys = [...fresh, ...cooled]; // prefer fresh first

  let lastError = null;

  for (const key of orderedKeys) {
    try {
      const cfg = buildRequestConfig(key, gstin);
      const resp = await axios(cfg);

      if (resp && resp.status >= 200 && resp.status < 300) {
        // success
        return { keyUsed: key, data: resp.data };
      } else {
        // non-2xx
        lastError = new Error(`Non-2xx status: ${resp.status}`);
        // Mark key cooled for these statuses
        if ([401, 403, 429, 500, 502, 503, 504].includes(resp.status)) {
          markKeyCooldown(key, `status_${resp.status}`);
        }
      }
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;

      // Decide cooling policy
      if (status && status >= 400 && status < 500 && status !== 429) {
        // client error (likely bad key or unauthorized) - cool this key
        markKeyCooldown(key, `4xx_${status}`);
      } else {
        // network / rate-limit / server errors - also cooldown conservatively
        markKeyCooldown(key, `retryable_${status || err.code || 'network'}`);
      }

      // continue to next key
      continue;
    }
  }

  // All keys tried and none returned success
  const aggregated = new Error('All KnowYourGST API keys attempted and failed.');
  aggregated.lastError = lastError;
  throw aggregated;
}

/* ===== Normalize provider response =====
 * Convert provider's response to a stable schema our frontend expects.
 * Adjust property names according to the actual provider response.
 */
function normalizeProviderResponse(gstin, providerData) {
  // providerData shape is provider-specific; adapt as required.
  // Attempt to map common fields with safe fallbacks.
  const pd = providerData || {};
  return {
    gstin: pd.gstin || gstin || pd.GSTIN || pd.tax_id || null,
    legalName: pd.legalName || pd.legal_name || pd.legalname || pd.legal || pd.entity_name || null,
    tradeName: pd.tradeName || pd.tradename || pd.businessName || pd.business_name || null,
    status: pd.status || pd.ACTIVE || pd.isActive || pd.registration_status || 'Unknown',
    registrationDate: pd.registrationDate || pd.reg_date || pd.registration_on || null,
    address: pd.address || pd.registered_address || pd.addr || null,
    businessType: pd.businessType || pd.type || pd.entity_type || null,
    taxpayerType: pd.taxpayerType || pd.taxpayer_type || null,
    raw: pd // include raw provider data for debugging (can be large)
  };
}

/* ===== Express app & endpoints ===== */
const app = express();
app.use(express.json());

// POST form: { gstin: "XXXXXXXXXXXX" }
app.post('/api/gstin/verify', async (req, res) => {
  try {
    const { gstin } = req.body || {};
    if (!gstin || typeof gstin !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid gstin in body' });
    }
    const normalized = gstin.trim().toUpperCase();

    // Check cache first
    const cached = cache.get(normalized);
    if (cached) {
      return res.json({ success: true, source: 'cache', fromCache: true, keyUsed: null, data: cached });
    }

    // Call provider with key rotation
    const providerResp = await callProviderWithRotation(normalized);

    // Normalize and cache
    const normalizedData = normalizeProviderResponse(normalized, providerResp.data);
    cache.set(normalized, normalizedData, CACHE_TTL_SECONDS);

    return res.json({
      success: true,
      source: 'provider',
      fromCache: false,
      keyUsed: providerResp.keyUsed,
      data: normalizedData
    });

  } catch (err) {
    console.error('Error in /api/gstin/verify:', err && (err.message || err.toString()), err?.lastError ? err.lastError : '');
    return res.status(502).json({
      success: false,
      error: 'Failed to verify GSTIN',
      details: err && err.message ? err.message : String(err)
    });
  }
});

// GET version for convenience
app.get('/api/gstin/verify/:gstin', async (req, res) => {
  const gstin = (req.params.gstin || '').trim();
  if (!gstin) return res.status(400).json({ success: false, error: 'Missing gstin param' });
  // delegate to POST handler logic by invoking internally
  req.body = { gstin };
  return app._router.handle(req, res, () => {});
});

/* ===== Dev-only: Inspect key states (cooldown info) ===== */
app.get('/internal/key-state', (req, res) => {
  const now = Date.now();
  const keys = API_KEYS.map(k => ({
    prefix: k.slice(0, 8) + '••',
    cooled: isKeyCooled(k),
    cooldownUntil: keyState[k] ? keyState[k].cooldownUntil || 0 : 0,
    lastError: keyState[k] ? keyState[k].lastError : null
  }));
  res.json({ now, keys });
});

/* ===== Start server ===== */
app.listen(PORT, () => {
  console.log(`GST verification server listening on port ${PORT}`);
  console.log(`Cache TTL (s): ${CACHE_TTL_SECONDS}, Key cooldown (s): ${KEY_COOLDOWN_SECONDS}`);
  console.log(`Configured keys: ${API_KEYS.length} (first key prefix=${API_KEYS[0] ? API_KEYS[0].slice(0,8)+'••' : 'none'})`);
});
