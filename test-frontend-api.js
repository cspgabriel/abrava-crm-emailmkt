#!/usr/bin/env node
/**
 * 🧪 Frontend ↔ API Integration Tester
 * Verifica se o frontend consegue se conectar à API corretamente
 */

const http = require('http');
const https = require('https');

const tests = [
  {
    name: 'Status do Servidor (localhost)',
    url: 'http://localhost:8787/status',
    method: 'GET'
  },
  {
    name: 'QR Code (localhost)',
    url: 'http://localhost:8787/qr',
    method: 'GET'
  },
  {
    name: 'Status do Servidor (produção)',
    url: 'https://wpp-api.abravacom.com.br/status',
    method: 'GET',
    headers: { 'X-API-Key': process.env.WPP_API_KEY || 'sua-chave-aqui' }
  }
];

const testOne = (test) => {
  return new Promise((resolve) => {
    const protocol = test.url.startsWith('https') ? https : http;

    const request = protocol.request(test.url, {
      method: test.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Frontend-API-Tester/1.0',
        ...test.headers
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          test: test.name,
          status: res.statusCode,
          headers: res.headers,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          corsHeaders: {
            'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
          },
          data: data.length > 200 ? data.substring(0, 200) + '...' : data
        });
      });
    });

    request.on('error', (err) => {
      resolve({
        test: test.name,
        ok: false,
        error: err.message,
        code: err.code
      });
    });

    request.on('timeout', () => {
      request.abort();
      resolve({
        test: test.name,
        ok: false,
        error: 'Timeout (5s)',
        code: 'TIMEOUT'
      });
    });

    request.end();
  });
};

const runTests = async () => {
  console.log('\n🧪 Frontend ↔ API Integration Tests\n');
  console.log('=' .repeat(60) + '\n');

  for (const test of tests) {
    const result = await testOne(test);
    
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    console.log(`   Status: ${result.status || result.error}`);
    
    if (result.corsHeaders['Access-Control-Allow-Origin']) {
      console.log(`   CORS Origin: ${result.corsHeaders['Access-Control-Allow-Origin']}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error} (${result.code})`);
    }
    
    if (result.data) {
      console.log(`   Data: ${result.data}`);
    }
    
    console.log();
  }

  console.log('=' .repeat(60));
  console.log('\n💡 Se algum teste falhar:');
  console.log('   1. Verifique se o servidor está rodando (node server.js)');
  console.log('   2. Verifique CORS no wpp-api-server/server.js (linhas 42-75)');
  console.log('   3. Verifique as URLs (localhost vs produção)');
  console.log('   4. Verifique firewalls/proxy\n');
};

runTests().catch(console.error);
