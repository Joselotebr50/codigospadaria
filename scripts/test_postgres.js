// Testa login e produtos com o banco PostgreSQL
const { spawn } = require('child_process');
const http = require('http');

function req(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      host: '127.0.0.1', port: 3460, path, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const r = http.request(options, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function check(port, path) {
  return new Promise((resolve) => {
    const r = http.get(`http://127.0.0.1:${port}${path}`, (res) => { res.resume(); resolve(res.statusCode === 200); });
    r.on('error', () => resolve(false));
    r.setTimeout(2000, () => { r.destroy(); resolve(false); });
  });
}

(async () => {
  const server = spawn('npx', ['next', 'dev', '-p', '3460'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, DATABASE_URL: 'postgresql://postgres@localhost:5432/postgres' },
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (d) => process.stderr.write(d));

  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) { await new Promise(r => setTimeout(r, 2000)); ready = await check(3460, '/'); }

  if (!ready) { console.log('FALHA: servidor nao subiu'); server.kill(); process.exit(1); }
  console.log('Servidor OK');

  // Teste 1: login com credenciais corretas
  const login = await req('/api/auth/login', 'POST', { email: 'admin@padaria.com', password: 'admin123' });
  console.log('LOGIN  ->', login.status, login.body.slice(0, 120));

  // Teste 2: login com senha errada
  const bad = await req('/api/auth/login', 'POST', { email: 'admin@padaria.com', password: 'errada' });
  console.log('SENHA ERRADA ->', bad.status, bad.body.slice(0, 80));

  // Teste 3: lista de produtos
  const prods = await req('/api/products?archived=false', 'GET');
  const j = JSON.parse(prods.body);
  console.log('PRODUTOS ->', prods.status, '| total:', j.total, '| categorias:', (j.categories || []).map(c => c.name + ':' + c.count).join(', '));

  server.kill('SIGTERM');
  await new Promise(r => setTimeout(r, 1000));
  process.exit(0);
})();
