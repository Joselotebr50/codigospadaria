// Test archive feature
const http = require('http');

function fetchJSON(path, method='GET', body=null, headers={}) {
  return new Promise((resolve, reject) => {
    const opts = { hostname:'localhost', port:3000, path, method, headers: {'Content-Type':'application/json', ...headers} };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Get products
  const d1 = await fetchJSON('/api/products?archived=false');
  console.log(`1. Ativos: ${d1.total}, Arquivados: ${d1.archivedCount}`);
  const p = d1.products[0];
  console.log(`   Primeiro: ${p.descricao} (id=${p.id.slice(0,12)})`);

  // 2. Archive
  const d2 = await fetchJSON(`/api/products/${p.id}`, 'PUT', {archived:true}, {Authorization:'Bearer test'});
  console.log(`\n2. Arquivado: ${d2.descricao} → archived=${d2.archived}`);

  // 3. Check archived list
  const d3 = await fetchJSON('/api/products?archived=true');
  console.log(`\n3. Aba Arquivados: ${d3.products.length} produtos`);
  d3.products.forEach(p => console.log(`   📦 ${p.descricao}`));

  // 4. Check active
  const d4 = await fetchJSON('/api/products?archived=false');
  console.log(`\n4. Ativos: ${d4.total}, Arquivados: ${d4.archivedCount}`);

  // 5. Restore
  const d5 = await fetchJSON(`/api/products/${p.id}`, 'PUT', {archived:false}, {Authorization:'Bearer test'});
  console.log(`\n5. Restaurado: ${d5.descricao} → archived=${d5.archived}`);

  // 6. Final
  const d6 = await fetchJSON('/api/products?archived=false');
  console.log(`\n6. Estado final: Ativos: ${d6.total}, Arquivados: ${d6.archivedCount}`);
}

main().catch(e => console.error('Error:', e));
