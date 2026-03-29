/*
Usage: node scripts/create-admin.js --email admin@example.com --password 12345678 --name "Admin Name"

Place your Firebase service account JSON at ./serviceAccountKey.json before running.
This script uses the Firebase Admin SDK to create an Auth user, set a custom claim 'admin',
and write a user document in Firestore with role: 'admin'.
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : true;
      out[key] = val;
      if (val !== true) i++;
    }
  }
  return out;
}

(async () => {
  try {
    const argv = parseArgs();
    const email = argv.email;
    const password = argv.password || 'ChangeMe123!';
    const displayName = argv.name || 'Admin';

    if (!email) {
      console.error('Please provide --email argument.');
      process.exit(1);
    }

    const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(keyPath)) {
      console.error('serviceAccountKey.json not found in project root. Place your Firebase service account key there.');
      process.exit(1);
    }

    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    const auth = admin.auth();
    const db = admin.firestore();

    // Create user
    let userRecord;
    try {
      userRecord = await auth.createUser({ email, password, displayName });
      console.log('Created Auth user:', userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log('User already exists, fetching...');
        userRecord = await auth.getUserByEmail(email);
        console.log('Found user:', userRecord.uid);
      } else {
        throw e;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
    console.log('Set custom claim role=admin');

    // Write Firestore user doc
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email: email.toLowerCase(),
      displayName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('Created/updated Firestore user doc with role admin.');
    console.log('Done. You can now sign in with that account in the app.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
})();
