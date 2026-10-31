// Diagnóstico: mede posição real do código Bal no mobile
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}
async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkServer(port)) return true;
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

(async () => {
  const server = spawn('npx', ['next', 'dev', '-p', '3461'], {
    cwd: '/home/z/my-project',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: 'postgresql://postgres@localhost:5432/postgres' },
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  if (!await waitForServer(3461)) { console.error('server fail'); server.kill(); process.exit(1); }
  console.log('Server OK');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:3461/', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@padaria.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);

  const diag = await page.evaluate(() => {
    const out = { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, url: location.href, bodySnippet: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 200), cards: [] };
    const hasLogout = !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sair'));
    out.loggedIn = hasLogout;
    const grid = document.querySelector('main .grid');
    out.gridExists = !!grid;
    if (grid) {
      const rows = grid.children;
      out.gridChildren = rows.length;
      Array.from(rows).slice(0, 3).forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const bal = card.querySelector('.font-mono.font-bold');
        out.cards.push({
          card: { x: Math.round(cardRect.x), w: Math.round(cardRect.width) },
          balText: bal ? bal.textContent : null,
          balRight: bal ? Math.round(bal.getBoundingClientRect().right) : null,
          balX: bal ? Math.round(bal.getBoundingClientRect().x) : null,
        });
      });
    }
    return out;
  });
  console.log(JSON.stringify(diag, null, 2));

  await browser.close();
  server.kill('SIGTERM');
  await new Promise(r => setTimeout(r, 800));
  process.exit(0);
})();
