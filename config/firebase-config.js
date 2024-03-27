const admin = require('firebase-admin')

const serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://projetz-bf05c-default-rtdb.europe-west1.firebasedatabase.app',
})

module.exports = admin
