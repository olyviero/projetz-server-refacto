const admin = require('../config/firebase-config')
const fs = admin.firestore()
const db = admin.database()

/**
 ------------------------------------------------------------------------------------------
 * Get Players infos from Firestore
 * @param {Number} uid
 * @return {Object} player's infos
*/
const getPlayerInfosFromFirestore = async (uid) => {
    try {
        const userRef = fs.collection('users').doc(uid) // Utilisez `fs` pour Firestore
        const doc = await userRef.get()
        if (doc.exists) {
            console.log(doc.data())
            return doc.data()
        } else {
            console.log('No such document!')
            return null
        }
    } catch (error) {
        console.error('Error getting document:', error)
        throw error
    }
}

/**
 ------------------------------------------------------------------------------------------
 * Get All Lobbies
 * @return {Object} all lobbies
*/
const getLobbies = async () => {
    try {
        const lobbiesRef = db.ref('lobbies')
        const snapshot = await lobbiesRef.get()

        if (snapshot.exists()) {
            console.log(snapshot.val())
            return snapshot.val()
        } else {
            return {}
        }
    } catch (error) {
        console.error('Error getting lobbies data:', error)
        throw error
    }
}

/**
 ------------------------------------------------------------------------------------------
 * Create a new lobby
 * @param {String} lobbyName
 * @param {Number} uid
 * @return {number} new lobby's key
*/
const createLobby = async (lobbyName, uid) => {
    try {
        const newLobbyKey = db.ref().child('lobbies').push().key
        const newLobbyRef = db.ref(`lobbies/${newLobbyKey}`)
        const newLobby = {
            name: lobbyName,
        }

        await newLobbyRef.set(newLobby)
        console.log(`Lobby created with key: ${newLobbyKey}`)

        return newLobbyKey
    } catch (error) {
        console.error('Error creating lobby:', error)
        throw error
    }
}

/**
 ------------------------------------------------------------------------------------------
 * Delete a lobby
 * @param {String} lobbyName
 * @param {Number} lobbyKey
 * @return {number} new lobby's key
*/
const deleteLobby = async (lobbyKey) => {
    try {
        const lobbyPath = `lobbies/${lobbyKey}`
        const lobbyRef = admin.database().ref(lobbyPath)

        await lobbyRef.remove()

        console.log(`Lobbby ${lobbyKey} deleted`)
    } catch (error) {
        console.error('Error deleting lobby:', error)
        throw error
    }
}

// ---------------------------------------------------------------------------------------
// Add PLAYER to LOBBY
// ---------------------------------------------------------------------------------------
const addPlayerToLobby = async (lobbyKey, uid, role) => {
    try {
        const playerInfos = await getPlayerInfosFromFirestore(uid)
        if (!playerInfos) {
            console.error("Aucune information trouvée pour l'UID:", uid)
            return
        }

        const playerPath = `lobbies/${lobbyKey}/players/${uid}`
        const playerRef = admin.database().ref(playerPath)

        await playerRef.set({
            username: playerInfos.username || 'Anonyme',
            photoURL:
                playerInfos.photoURL ||
                'https://toppng.com/uploads/preview/roger-berry-avatar-placeholder-11562991561rbrfzlng6h.png',
            role: role || 'player',
            points: 0,
        })

        console.log(`Player ${uid} added to lobby ${lobbyKey} with info:`, playerInfos)
    } catch (error) {
        console.error('Error adding player to lobby:', error)
        throw error
    }
}

// ---------------------------------------------------------------------------------------
// Remove PLAYER from LOBBY
// ---------------------------------------------------------------------------------------
const removePlayerFromLobby = async (lobbyKey, uid) => {
    try {
        const playerPath = `lobbies/${lobbyKey}/players/${uid}`
        const playerRef = admin.database().ref(playerPath)

        await playerRef.remove()

        console.log(`Player ${uid} removed from lobby ${lobbyKey}`)
    } catch (error) {
        console.error('Error removing player from lobby:', error)
        throw error
    }
}

module.exports = { getLobbies, createLobby, deleteLobby, addPlayerToLobby, removePlayerFromLobby }
