#!/usr/bin/env node
/**
 * Initialize missing Firebase Firestore collections
 * Run with: node scripts/init-firebase-collections.js
 * 
 * This script creates the necessary document structure for:
 * - annotations
 * - whatsapp_send_history
 * - whatsapp_campaigns
 * - activity_log
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS env var or service account)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../firebase-service-account.json');

console.log('🔧 Inicializando Firebase Admin...');

// Try to initialize with service account
let app;
try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'finance8-96cb0'
    });
    console.log('✅ Firebase inicializado com service account.');
  } else {
    // Fallback: use Application Default Credentials (gcloud login)
    console.log(`⚠️  Service account não encontrado em ${serviceAccountPath}`);
    console.log('💡 Certificando-se de que você está autenticado com: gcloud auth application-default login');
    app = admin.initializeApp({
      projectId: 'finance8-96cb0'
    });
  }
} catch (err) {
  console.error('❌ Erro ao inicializar Firebase Admin:', err.message);
  console.error('\n📋 Para funcionar, use um de:');
  console.error('  1. FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json node scripts/init-firebase-collections.js');
  console.error('  2. gcloud auth application-default login && node scripts/init-firebase-collections.js');
  console.error('  3. GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/init-firebase-collections.js');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Initialize a collection with a template document
 */
async function initCollection(collectionName, templateDoc = {}) {
  try {
    console.log(`\n📝 Verificando coleção: ${collectionName}`);
    
    const snapshot = await db.collection(collectionName).limit(1).get();
    
    if (!snapshot.empty) {
      console.log(`✅ Coleção "${collectionName}" já existe com ${snapshot.size} documento(s).`);
      return;
    }
    
    if (Object.keys(templateDoc).length === 0) {
      console.log(`⏭️  Coleção "${collectionName}" ainda não existe. Documentos serão criados quando dados forem adicionados.`);
      return;
    }

    // Create a template document with _template prefix
    const docId = `_init_${Date.now()}`;
    await db.collection(collectionName).doc(docId).set({
      ...templateDoc,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      _isTemplate: true,
      _note: 'Template document. Delete after collection is initialized with real data.'
    });
    
    console.log(`✅ Coleção "${collectionName}" criada com template document "${docId}".`);
  } catch (error) {
    console.error(`❌ Erro ao inicializar "${collectionName}":`, error.message);
    throw error;
  }
}

/**
 * Main initialization flow
 */
async function initializeCollections() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Inicializando Coleções Firebase');
  console.log('='.repeat(60));

  try {
    // Initialize each collection with their structure
    await initCollection('annotations', {
      entityType: 'contact', // 'contact', 'simulation', 'campaign'
      entityId: 'doc_123',
      userId: 'user_123',
      text: 'Annotation text example',
      tags: ['important', 'follow-up'],
      priority: 'high'
    });

    await initCollection('whatsapp_send_history', {
      userId: 'user_123',
      phone: '5511999999999',
      name: 'Contact Name',
      message: 'Message sent via WhatsApp',
      status: 'sent', // 'sent', 'delivered', 'read', 'failed'
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      mediaUrl: null,
      campaignId: null,
      scheduledAt: null,
      failureReason: null
    });

    await initCollection('whatsapp_campaigns', {
      name: 'Campaign Name',
      description: 'Campaign description',
      status: 'active', // 'active', 'paused', 'completed', 'archived'
      userId: 'user_123',
      message: 'Message template',
      targetContacts: ['contact_1', 'contact_2'],
      scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAt: null,
      stats: {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        read: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await initCollection('activity_log', {
      userId: 'user_123',
      action: 'send_message', // 'send_message', 'schedule_campaign', 'update_contact', etc
      resource: 'whatsapp_message',
      resourceId: 'msg_123',
      details: {
        phone: '5511999999999',
        status: 'sent'
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: null,
      userAgent: null
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Coleções inicializadas com sucesso!');
    console.log('='.repeat(60));
    console.log('\n📌 Próximos passos:');
    console.log('1. Atualizar as regras Firestore (firestore.rules)');
    console.log('2. Deploy: firebase deploy --only firestore:rules');
    console.log('3. Deletar documentos _init_ se necessário');

  } catch (error) {
    console.error('\n❌ Erro durante inicialização:', error);
    process.exit(1);
  } finally {
    // Close app
    await app.delete();
    console.log('\n✅ Firebase Admin finalizado.');
  }
}

// Run
initializeCollections().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
