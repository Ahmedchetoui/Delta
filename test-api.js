#!/usr/bin/env node

/**
 * Script de test pour vérifier la connectivité API Delta Fashion
 * Usage: node test-api.js
 */

const https = require('https');
const http = require('http');

const API_BASE = 'https://delta-n5d8.onrender.com';
const FRONTEND_URL = 'https://delta-e79s-4lp8o17ah-deltas-projects-ce7253f2.vercel.app';

// Fonction utilitaire pour faire des requêtes HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Tests à exécuter
const tests = [
  {
    name: 'API Health Check',
    url: `${API_BASE}/api/health`,
    method: 'GET'
  },
  {
    name: 'Database Health Check',
    url: `${API_BASE}/api/db-health`,
    method: 'GET'
  },
  {
    name: 'Manifest.json',
    url: `${API_BASE}/manifest.json`,
    method: 'GET'
  },
  {
    name: 'CORS Preflight Test',
    url: `${API_BASE}/api/auth/login`,
    method: 'OPTIONS',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    }
  }
];

// Fonction principale de test
async function runTests() {
  console.log('🧪 Tests de connectivité API Delta Fashion\n');
  console.log(`Backend: ${API_BASE}`);
  console.log(`Frontend: ${FRONTEND_URL}\n`);
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`⏳ ${test.name}...`);
      
      const options = {
        method: test.method || 'GET',
        headers: test.headers || {}
      };

      const result = await makeRequest(test.url, options);
      
      if (result.statusCode >= 200 && result.statusCode < 400) {
        console.log(`✅ ${test.name} - Status: ${result.statusCode}`);
        
        // Vérifications spécifiques
        if (test.name === 'CORS Preflight Test') {
          const corsHeader = result.headers['access-control-allow-origin'];
          if (corsHeader) {
            console.log(`   🔗 CORS Origin: ${corsHeader}`);
          } else {
            console.log(`   ⚠️  Pas d'en-tête CORS trouvé`);
          }
        }
        
        if (test.name === 'API Health Check' && result.data) {
          try {
            const data = JSON.parse(result.data);
            console.log(`   📊 Environment: ${data.environment || 'N/A'}`);
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        passed++;
      } else {
        console.log(`❌ ${test.name} - Status: ${result.statusCode}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Erreur: ${error.message}`);
      failed++;
    }
    
    console.log(''); // Ligne vide
  }

  // Résumé
  console.log('📋 Résumé des tests:');
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! L\'API est opérationnelle.');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  // Conseils de dépannage
  if (failed > 0) {
    console.log('\n🔧 Conseils de dépannage:');
    console.log('1. Vérifiez que le backend est déployé et accessible');
    console.log('2. Contrôlez les variables d\'environnement sur Render');
    console.log('3. Vérifiez la configuration CORS dans server.js');
    console.log('4. Consultez les logs Render pour plus de détails');
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
