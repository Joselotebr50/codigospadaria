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
  // Start Next.js dev server
  const server = spawn('npx', ['next', 'dev', '-p', '3458'], {
    cwd: '/home/z/my-project',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  server.stdout.on('data', (d) => process.stdout.write(d));
  server.stderr.on('data', (d) => process.stderr.write(d));

  console.log('Waiting for server...');
  const ready = await waitForServer(3458);
  if (!ready) {
    console.error('Server never became ready');
    server.kill();
    process.exit(1);
  }
  console.log('Server is ready!');

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Screenshot 1: Login page
  console.log('Navigating to login page...');
  await page.goto('http://127.0.0.1:3458/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/render/login-page.png', fullPage: true });
  console.log('Login screenshot saved!');

  // Screenshot 2: After login (main app)
  console.log('Attempting login...');
  await page.fill('input[type="email"]', 'admin@padaria.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/render/dashboard-page.png', fullPage: true });
  console.log('Dashboard screenshot saved!');

  await browser.close();
  server.kill('SIGTERM');
  
  // Wait a bit for server to die
  await new Promise(r => setTimeout(r, 2000));
  process.exit(0);
})();
