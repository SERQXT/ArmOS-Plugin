// Cloudflare Worker — Domo Proposal Feedback Proxy
// GET  /feedback?proposal_id=X&sig=Y  → returns JSON array of comments for this proposal
// POST /feedback  body: { proposal_id, sig, author_type, author_name, message, parent_id? }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Simple in-memory token cache (resets on Worker cold start — acceptable for OAuth 1hr tokens)
let tokenCache = { token: null, expires: 0 };

async function getDomoToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.expires - 60000) {
    return tokenCache.token;
  }
  const resp = await fetch(
    'https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data%20buzz',
    {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa(`${env.DOMO_CLIENT_ID}:${env.DOMO_CLIENT_SECRET}`),
      },
    }
  );
  if (!resp.ok) throw new Error(`Domo OAuth failed: ${resp.status}`);
  const data = await resp.json();
  tokenCache = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function validateSig(proposalId, sig, env) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(proposalId));
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === sig;
}

async function readDataset(token, datasetId, proposalId) {
  // Full CSV export then filter client-side (dataset is small — one file per worker instance)
  const resp = await fetch(
    `https://api.domo.com/v1/datasets/${datasetId}/data?includeHeader=true&fileName=feedback.csv`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) {
    if (resp.status === 404) return [];
    throw new Error(`Dataset read failed: ${resp.status}`);
  }
  const csv = await resp.text();
  return parseCsv(csv).filter(row => row.proposal_id === proposalId);
}

async function appendRow(token, datasetId, newRow) {
  // Read → append → replace (works for small feedback datasets)
  const getResp = await fetch(
    `https://api.domo.com/v1/datasets/${datasetId}/data?includeHeader=true&fileName=feedback.csv`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const HEADER = 'proposal_id,comment_id,created_at,author_type,author_name,message,parent_id,status';
  let existingLines = [];

  if (getResp.ok) {
    const text = await getResp.text();
    const lines = text.split('\n').filter(l => l.trim());
    // lines[0] is header — skip it; keep data lines
    if (lines.length > 1) existingLines = lines.slice(1);
  }

  const newLine = [
    csvEsc(newRow.proposal_id),
    csvEsc(newRow.comment_id),
    csvEsc(newRow.created_at),
    csvEsc(newRow.author_type),
    csvEsc(newRow.author_name),
    csvEsc(newRow.message),
    csvEsc(newRow.parent_id || ''),
    csvEsc(newRow.status || 'open'),
  ].join(',');

  const body = [HEADER, ...existingLines, newLine].join('\n');

  const putResp = await fetch(`https://api.domo.com/v1/datasets/${datasetId}/data`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/csv',
    },
    body,
  });
  if (!putResp.ok) {
    const err = await putResp.text();
    throw new Error(`Dataset write failed: ${putResp.status} — ${err}`);
  }
}

async function buzzNotify(token, channelId, text) {
  if (!channelId) return;
  await fetch(`https://api.domo.com/v1/buzz/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEsc(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseCsvLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { cols.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Request handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const responseHeaders = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

    try {
      // GET /feedback?proposal_id=X&sig=Y
      if (request.method === 'GET' && url.pathname === '/feedback') {
        const proposalId = url.searchParams.get('proposal_id');
        const sig = url.searchParams.get('sig');
        if (!proposalId || !sig) {
          return new Response(
            JSON.stringify({ error: 'Missing proposal_id or sig' }),
            { status: 400, headers: responseHeaders }
          );
        }
        if (!await validateSig(proposalId, sig, env)) {
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 403, headers: responseHeaders }
          );
        }
        const token = await getDomoToken(env);
        const comments = await readDataset(token, env.DATASET_ID, proposalId);
        return new Response(JSON.stringify({ comments }), { headers: responseHeaders });
      }

      // POST /feedback
      if (request.method === 'POST' && url.pathname === '/feedback') {
        const body = await request.json();
        const { proposal_id, sig, author_type, author_name, message, parent_id, status } = body;

        if (!proposal_id || !sig || !author_type || !author_name || !message) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: proposal_id, sig, author_type, author_name, message' }),
            { status: 400, headers: responseHeaders }
          );
        }
        if (!await validateSig(proposal_id, sig, env)) {
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 403, headers: responseHeaders }
          );
        }
        if (!['client', 'sa'].includes(author_type)) {
          return new Response(
            JSON.stringify({ error: 'author_type must be "client" or "sa"' }),
            { status: 400, headers: responseHeaders }
          );
        }

        const token = await getDomoToken(env);
        const row = {
          proposal_id,
          comment_id: genId(),
          created_at: new Date().toISOString(),
          author_type,
          author_name: String(author_name).slice(0, 120),
          message: String(message).slice(0, 2000),
          parent_id: parent_id || '',
          status: status || (author_type === 'sa' ? 'answered' : 'open'),
        };

        await appendRow(token, env.DATASET_ID, row);

        // Notify SA via Buzz when a client submits
        if (author_type === 'client' && env.BUZZ_CHANNEL_ID) {
          await buzzNotify(
            token,
            env.BUZZ_CHANNEL_ID,
            `\u{1F4CB} New proposal feedback on *${proposal_id}* from ${row.author_name}:\n> ${row.message.slice(0, 280)}`
          );
        }

        return new Response(
          JSON.stringify({ ok: true, comment_id: row.comment_id }),
          { headers: responseHeaders }
        );
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: responseHeaders });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: responseHeaders });
    }
  },
};
