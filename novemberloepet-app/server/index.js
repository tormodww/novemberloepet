require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PARSE_APP_ID = process.env.PARSE_APP_ID || process.env.REACT_APP_PARSE_APP_ID;
const PARSE_REST_KEY = process.env.PARSE_REST_API_KEY || process.env.REACT_APP_PARSE_REST_API_KEY;
const PARSE_MASTER_KEY = process.env.PARSE_MASTER_KEY || process.env.REACT_APP_PARSE_MASTER_KEY;
const PARSE_SERVER_URL = process.env.PARSE_SERVER_URL || process.env.REACT_APP_PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

if (!PARSE_APP_ID || (!PARSE_REST_KEY && !PARSE_MASTER_KEY) || !PARSE_SERVER_URL) {
  console.warn('Parse REST/Master configuration missing. Please set PARSE_APP_ID, PARSE_REST_API_KEY or PARSE_MASTER_KEY, PARSE_SERVER_URL in .env');
}

const parseHeaders = () => {
  const headers = {
    'X-Parse-Application-Id': PARSE_APP_ID,
    'Content-Type': 'application/json'
  };
  // If a master key is provided, use it for server-side requests (more privileges).
  // Otherwise fall back to the REST API key.
  if (PARSE_MASTER_KEY) {
    headers['X-Parse-Master-Key'] = PARSE_MASTER_KEY;
  } else if (PARSE_REST_KEY) {
    headers['X-Parse-REST-API-Key'] = PARSE_REST_KEY;
  }
  return headers;
};

const parseUrl = (path) => `${PARSE_SERVER_URL.replace(/\/$/, '')}${path}`;

async function proxyRequest(method, path, body) {
  if (!PARSE_APP_ID || (!PARSE_REST_KEY && !PARSE_MASTER_KEY) || !PARSE_SERVER_URL) {
    const err = new Error('Proxy misconfigured: missing PARSE_APP_ID or PARSE_REST_API_KEY/PARSE_MASTER_KEY or PARSE_SERVER_URL');
    err.status = 500;
    throw err;
  }
  const url = parseUrl(path);
  try {
    const resp = await axios({ method, url, headers: parseHeaders(), data: body, validateStatus: null });
    // Log non-2xx responses from Parse for easier debugging
    if (resp.status < 200 || resp.status >= 300) {
      console.warn(`Parse responded with status ${resp.status} for ${method.toUpperCase()} ${path}:`, JSON.stringify(resp.data));
    }
    return { status: resp.status, data: resp.data };
  } catch (e) {
    // network or axios error
    const err = new Error(`Proxy request failed: ${e.message}`);
    err.status = 502;
    throw err;
  }
}

// Health endpoint to verify server-side Parse config (does NOT return secrets)
app.get('/api/_health', (req, res) => {
  const configured = !!(PARSE_APP_ID && (PARSE_REST_KEY || PARSE_MASTER_KEY) && PARSE_SERVER_URL);
  res.json({ ok: true, parseConfigured: configured, parseServerUrl: !!PARSE_SERVER_URL });
});

// Deltagere CRUD
app.get('/api/deltagere', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('get', '/classes/Deltager');
    // Returner kun listen, ikke hele Parse-objektet
    return res.status(status).json(data.results || []);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

app.post('/api/deltagere', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('post', '/classes/Deltager', req.body);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

app.put('/api/deltagere/:id', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('put', `/classes/Deltager/${req.params.id}`, req.body);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

app.delete('/api/deltagere/:id', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('delete', `/classes/Deltager/${req.params.id}`);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    if (status === 200 || status === 204) return res.json({ success: true });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// Etappe config (single object)
app.get('/api/etapper', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('get', '/classes/EtappeConfig');
    if (status >= 200 && status < 300) {
      if (Array.isArray(data.results) && data.results.length > 0) return res.json(data.results[0]);
      return res.json(data);
    }
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

app.post('/api/etapper', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('post', '/classes/EtappeConfig', req.body);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

app.put('/api/etapper/:id', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('put', `/classes/EtappeConfig/${req.params.id}`, req.body);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// Delete etappe config by id
app.delete('/api/etapper/:id', async (req, res) => {
  try {
    const { status, data } = await proxyRequest('delete', `/classes/EtappeConfig/${req.params.id}`);
    if (status === 401 || status === 403) return res.status(401).json({ error: 'unauthorized' });
    if (status === 200 || status === 204) return res.json({ success: true });
    return res.status(status).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));