// qa-shot.js — MCP-free Domo browser validation via ryuu credentials.
// Usage:
//   NODE_PATH=$(npm root -g) node qa-shot.js <instance> <pagePathOrUrl> <outPng> [waitMs] [--probe "<SQL>"] [--alias <alias>]
// Example:
//   node qa-shot.js wings-travel /page/431190219/kpis/details/238173886 /tmp/card.png
// Never prints tokens or the SID.

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLIENT_ID = 'domo:internal:devstudio';

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const instanceArg = process.argv[2];
const pageArg = process.argv[3];
const outPng = process.argv[4] || '/tmp/qa_shot.png';
const waitMs = Number(process.argv[5] && !process.argv[5].startsWith('--') ? process.argv[5] : 22000);
const probeSql = arg('--probe');
const alias = arg('--alias'); // custom-app data alias, needed only for --probe

if (!instanceArg || !pageArg) {
  console.error('Usage: node qa-shot.js <instance> <pagePathOrUrl> <outPng> [waitMs] [--probe SQL] [--alias ALIAS]');
  process.exit(2);
}

const INST = instanceArg.includes('.') ? instanceArg : instanceArg + '.domo.com';
const URL = /^https?:\/\//.test(pageArg) ? pageArg : ('https://' + INST + pageArg);

async function getSid() {
  const loginFile = path.join(os.homedir(), '.config/configstore/ryuu/' + INST + '.json');
  if (!fs.existsSync(loginFile)) throw new Error('No ryuu login for ' + INST + '. Run: domo login -i ' + INST + ' -t <token>');
  const rt = JSON.parse(fs.readFileSync(loginFile, 'utf8')).refreshToken;
  if (!rt) throw new Error('No refreshToken in ' + loginFile);
  const tokRes = await fetch('https://' + INST + '/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: rt }),
  });
  const at = (await tokRes.json()).access_token;
  if (!at) throw new Error('Token exchange failed (status ' + tokRes.status + ')');
  const sidRes = await fetch('https://' + INST + '/api/oauth2/sid', { headers: { Authorization: 'Bearer ' + at } });
  const sid = (await sidRes.json()).sid;
  if (!sid) throw new Error('SID fetch failed (status ' + sidRes.status + ')');
  return sid;
}

(async () => {
  const sid = await getSid();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });

  // Inject the session header ONLY on the main Domo domain. Leave the app-proxy
  // (domoapps) and third-party asset hosts untouched to avoid breaking embed auth
  // and triggering CORS preflight failures.
  await context.route('https://' + INST + '/**', async route => {
    const h = route.request().headers();
    const headers = {};
    for (const k in h) if (typeof h[k] === 'string') headers[k] = h[k];
    headers['x-domo-authentication'] = sid;
    try { return await route.continue({ headers }); } catch (e) { return route.continue(); }
  });
  await context.addCookies([{ name: 'DA-SID', value: sid, domain: '.' + INST, path: '/' }]);

  const page = await context.newPage();
  try { await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); }
  catch (e) { console.log('goto:', e.message); }
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: outPng, fullPage: true });

  // Read the embedded app iframe: logged-in user (from its URL) + rendered text.
  let appInfo = '(no app iframe found)';
  let probeOut = null;
  for (const f of page.frames()) {
    if (/domoapps/.test(f.url())) {
      try {
        const info = await f.evaluate(() => {
          const p = new URLSearchParams(location.search);
          return { user: p.get('userName'), body: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 800) };
        });
        appInfo = JSON.stringify(info);
      } catch (e) { appInfo = 'frame eval err: ' + e.message; }

      if (probeSql && alias) {
        try {
          probeOut = await f.evaluate(async ({ sql, al }) => {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 40000);
            const t0 = performance.now();
            try {
              // Correct pro-code SQL path: POST /sql/v1/{alias} with SQL as body.
              const res = await fetch('/sql/v1/' + al, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'text/plain', Accept: 'application/json' },
                body: sql, signal: ctrl.signal,
              });
              const txt = await res.text();
              clearTimeout(to);
              return { status: res.status, ms: Math.round(performance.now() - t0), bytes: txt.length, head: txt.slice(0, 220) };
            } catch (e) { clearTimeout(to); return { err: String(e), ms: Math.round(performance.now() - t0) }; }
          }, { sql: probeSql, al: alias });
        } catch (e) { probeOut = { err: e.message }; }
      }
    }
  }

  console.log('FINAL_URL:', page.url());
  console.log('SCREENSHOT:', outPng);
  console.log('APP_IFRAME:', appInfo);
  if (probeSql) console.log('PROBE (POST /sql/v1/' + (alias || '?') + '):', alias ? JSON.stringify(probeOut) : 'pass --alias <appDataAlias> to probe');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message || e); process.exit(1); });
