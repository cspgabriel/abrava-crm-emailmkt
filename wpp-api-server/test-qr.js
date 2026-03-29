#!/usr/bin/env node
/**
 * 🧪 WPP API - QR Code Tester
 * 
 * Uso:
 *   node test-qr.js
 * 
 * Testa se:
 * 1. Servidor está respondendo
 * 2. QR está disponível via HTTP
 * 3. WebSocket está conectado
 */

const http = require('http');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:8787';
const WS_URL = 'ws://localhost:8787/ws';

async function testHttp() {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + '/qr');
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ GET /qr:', json.ok ? '✅ QR DISPONÍVEL' : '⚠️  QR ainda não pronto');
          if (json.ok) {
            console.log(`   QR size: ${(json.qr?.length / 1024).toFixed(1)} KB`);
          } else {
            console.log(`   Motivo: ${json.msg}`);
          }
          resolve(json.ok);
        } catch (e) {
          console.log('❌ Erro ao parsear resposta:', e.message);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log('❌ GET /qr falhou:', e.message);
      resolve(false);
    });
  });
}

async function testWebSocket() {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        
        // Aguardar mensagem
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
              console.log('✅ Status recebido via WebSocket');
              console.log(`   connectionState: ${data.connectionState}`);
              console.log(`   hasQR: ${data.hasQR}`);
              if (data.qr) {
                console.log(`   QR size: ${(data.qr.length / 1024).toFixed(1)} KB`);
              }
              resolve(data.hasQR);
              ws.close();
            }
          } catch (e) {
            console.log('⚠️  Erro ao parsear mensagem WebSocket:', e.message);
          }
        };
        
        // Timeout de 5s
        setTimeout(() => {
          console.log('⏱️  Timeout aguardando status via WebSocket');
          resolve(false);
          ws.close();
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.log('❌ WebSocket erro:', error);
        resolve(false);
      };
    } catch (e) {
      console.log('❌ Erro ao conectar WebSocket:', e.message);
      resolve(false);
    }
  });
}

async function testDebug() {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + '/debug');
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ GET /debug:', JSON.stringify(json.status, null, 2));
          resolve(true);
        } catch (e) {
          console.log('❌ Erro ao parsear debug:', e.message);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log('❌ GET /debug falhou:', e.message);
      resolve(false);
    });
  });
}

(async () => {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 WPP API - QR Code Tester');
  console.log('═'.repeat(60) + '\n');
  
  console.log('[1/3] Testando HTTP /qr endpoint...');
  const httpOk = await testHttp();
  
  console.log('\n[2/3] Testando WebSocket...');
  const wsOk = await testWebSocket();
  
  console.log('\n[3/3] Testando Debug endpoint...');
  const debugOk = await testDebug();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Resultado:');
  console.log('═'.repeat(60));
  console.log(`HTTP /qr:          ${httpOk ? '✅' : '❌'}`);
  console.log(`WebSocket:         ${wsOk ? '✅' : '❌'}`);
  console.log(`Debug endpoint:    ${debugOk ? '✅' : '❌'}`);
  
  if (!httpOk) {
    console.log('\n⚠️  Se /qr retorna "No QR available":');
    console.log('   → Servidor ainda inicializando');
    console.log('   → Aguarde a mensagem do terminal: 📸 QR CODE RECEBIDO');
    console.log('   → Depois tente novamente\n');
  }
  
  process.exit(0);
})();
