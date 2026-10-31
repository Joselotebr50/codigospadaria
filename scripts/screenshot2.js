const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
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
  const server = spawn('npx', ['next', 'dev', '-p', '3459'], {
    cwd: '/home/z/my-project',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: 'postgresql://postgres@localhost:5432/postgres' }
  });
  
  server.stdout.on('data', (d) => process.stdout.write(d));
  server.stderr.on('data', (d) => process.stderr.write(d));

  console.log('Waiting for server...');
  const ready = await waitForServer(3459);
  if (!ready) { console.error('Server not ready'); server.kill(); process.exit(1); }
  console.log('Server ready!');

  const browser = await chromium.launch({ headless: true });
  
  // Login page - viewport only
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page1 = await ctx1.newPage();
  await page1.goto('http://127.0.0.1:3459/', { waitUntil: 'networkidle', timeout: 30000 });
  await page1.waitForTimeout(2000);
  await page1.screenshot({ path: '/tmp/render/login-page.png' });
  console.log('Login screenshot saved!');
  await ctx1.close();

  // Dashboard - viewport only (logged in)
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto('http://127.0.0.1:3459/', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(1000);
  await page2.fill('input[type="email"]', 'admin@padaria.com');
  await page2.fill('input[type="password"]', 'admin123');
  await page2.click('button[type="submit"]');
  await page2.waitForTimeout(5000);
  await page2.screenshot({ path: '/tmp/render/dashboard-page.png' });
  console.log('Dashboard screenshot saved!');
  await ctx2.close();

  // Also a mobile viewport screenshot
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page3 = await ctx3.newPage();
  await page3.goto('http://127.0.0.1:3459/', { waitUntil: 'networkidle', timeout: 30000 });
  await page3.waitForTimeout(1000);
  await page3.fill('input[type="email"]', 'admin@padaria.com');
  await page3.fill('input[type="password"]', 'admin123');
  await page3.click('button[type="submit"]');
  await page3.waitForTimeout(5000);
  await page3.screenshot({ path: '/tmp/render/dashboard-mobile.png' });
  console.log('Mobile dashboard screenshot saved!');
  await ctx3.close();

  await browser.close();
  server.kill('SIGTERM');
  await new Promise(r => setTimeout(r, 1000));
  process.exit(0);
})();
