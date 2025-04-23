const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceKey.json'); // Path to your service account key JSON file

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://medical-database-ce858.firebaseio.com"
});

const db = admin.firestore(); // Initialize Firestore
//const storage = admin.storage().bucket();// Optional: Export Firebase Admin and Firestore instances
module.exports = { db };
