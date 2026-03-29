const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAjsurNMA4OxzpuZ8EfXvAmXGN-TqkT9H8",
  authDomain: "finance8-96cb0.firebaseapp.com",
  projectId: "finance8-96cb0",
  storageBucket: "finance8-96cb0.firebasestorage.app",
  messagingSenderId: "589745239376",
  appId: "1:589745239376:web:efd94d2a73e42506aa2855"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const leadsRef = collection(db, 'simulations');
    // We want the most recent simulation to see what fields it actually has
    const q = query(leadsRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const fs = require('fs');
    if(snapshot.empty) {
        console.log("No documents found.");
    } else {
        snapshot.forEach(doc => {
            const out = { id: doc.id, data: doc.data() };
            fs.writeFileSync('data.json', JSON.stringify(out, null, 2));
            console.log("Saved to data.json");
        });
    }
    process.exit(0);
}

run().catch(console.error);
