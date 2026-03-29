#!/usr/bin/env node
/**
 * migrate-auth-to-firestore.js
 *
 * Usage: node migrate-auth-to-firestore.js <serviceAccountKey.json>
 *
 * This script uses the Firebase Admin SDK to list users in Firebase Auth
 * and create corresponding documents in Firestore under the `users` collection
 * for users that do not yet have a document.
 *
 * NOTE: run this locally with a Service Account JSON file for your Firebase
 * project. Do NOT commit your service account file to the repository.
 */

const admin = require('firebase-admin');

const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error('Usage: node migrate-auth-to-firestore.js <serviceAccountKey.json>');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
} catch (e) {
  console.error('Failed to initialize Firebase Admin. Did you provide a valid path?', e);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function migrate() {
  try {
    let nextPageToken;
    do {
      const result = await auth.listUsers(1000, nextPageToken);
      console.log(`Fetched ${result.users.length} users from Auth`);
      for (const user of result.users) {
        const docRef = db.collection('users').doc(user.uid);
        const userDoc = await docRef.get();
        if (!userDoc.exists) {
          await docRef.set({
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || (user.email || '').split('@')[0],
            role: 'client',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('Created user doc for', user.uid);
        } else {
          console.log('Already exists', user.uid);
        }
      }
      nextPageToken = result.pageToken;
    } while (nextPageToken);
    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

migrate();
