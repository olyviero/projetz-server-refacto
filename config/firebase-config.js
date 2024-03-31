const admin = require('firebase-admin')

const serviceAccount = require('../serviceAccountKey.json')
// const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://projetz-bf05c-default-rtdb.europe-west1.firebasedatabase.app',
})

module.exports = admin
