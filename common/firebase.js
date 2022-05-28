const firebaseAdmin = require('firebase-admin');
const firebaseServiceAccount = require('../config/firebase.json');

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
});

exports.admin = firebaseAdmin;