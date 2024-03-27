const admin = require('./config/firebase-config')
const fs = admin.firestore()
const db = admin.database()

const port = 8000
const http = require('http')
const WebSocket = require('ws')

const server = http.createServer()
const wsServer = new WebSocket.Server({ server, host: '0.0.0.0' })

const lobbies = require('./src/lobbies')
const unanimoGame = require('./games/unanimo')

const wsConnexions = new Map()

// ---------------------------------------------------------------------------------------
// WS Messages
// ---------------------------------------------------------------------------------------
const handleMessage = async (message) => {
    const { type, uid, content } = message
    let lobbiesUpdated
    let lobbyKey

    switch (type) {
        case 'getLobbies':
            lobbiesUpdated = await lobbies.getLobbies()
            broadcastToOne(uid, { type: 'updateLobbies', content: { lobbies: lobbiesUpdated } })
            break

        case 'createLobby':
            const newLobbyKey = await lobbies.createLobby(content.lobbyName, uid)
            await lobbies.addPlayerToLobby(newLobbyKey, uid, 'admin')
            broadcastToOne(uid, { type: 'joinLobby', content: { lobbyKey: newLobbyKey } })

            lobbiesUpdated = await lobbies.getLobbies()
            broadcast({ type: 'updateLobbies', content: { lobbies: lobbiesUpdated } })

            break

        case 'joinLobby':
            lobbyKey = content.lobbyKey
            await lobbies.addPlayerToLobby(lobbyKey, uid)
            broadcastToOne(uid, { type: 'joinLobby', content: { lobbyKey: lobbyKey } })

            lobbiesUpdated = await lobbies.getLobbies()
            broadcast({ type: 'updateLobbies', content: { lobbies: lobbiesUpdated } })

            break

        case 'leaveLobby':
            lobbyKey = content.lobbyKey
            await lobbies.removePlayerFromLobby(lobbyKey, uid)
            broadcastToOne(uid, { type: 'leaveLobby' })
            lobbiesUpdated = await lobbies.getLobbies()
            broadcast({ type: 'updateLobbies', content: { lobbies: lobbiesUpdated } })

            break

        case 'deleteLobby':
            lobbyKey = content.lobbyKey
            await lobbies.deleteLobby(lobbyKey)
            lobbiesUpdated = await lobbies.getLobbies()
            broadcast({ type: 'updateLobbies', content: { lobbies: lobbiesUpdated } })
            break

        default:
            console.log(`Unhandled message type: ${type}`)
    }
}

const broadcast = (data) => {
    const message = JSON.stringify(data)
    wsConnexions.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message)
        } else {
            console.log('Connection is not open.')
            wsConnexions.delete(uid) // Optionnel : no errors from this ??
        }
    })
}

const broadcastToOne = (uid, data) => {
    const message = JSON.stringify(data)
    const ws = wsConnexions.get(uid)

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message)
        console.log(`Message sent to player ${uid}`)
    } else {
        console.log(`Connection for player ${uid} is not open or does not exist.`)
        // Optionnel : Supprimer la connexion de votre Map si elle n'est pas ouverte :
        // wsConnexions.delete(uid);
    }
}

// ---------------------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// WS on connection
// ---------------------------------------------------------------------------------------
wsServer.on('connection', (ws, request) => {
    const params = new URLSearchParams(request.url.split('?')[1])
    const uid = params.get('uid')
    console.log(`New player connected (uid: ${uid})`)

    wsConnexions.set(uid, ws)

    ws.on('message', (message) => {
        const data = JSON.parse(message)
        // console.dir(data, { depth: null })
        console.log(data)

        handleMessage(data)
    })

    ws.on('close', () => {
        wsConnexions.delete(uid)
        console.log(`player disconnected (uid: ${uid})`)
    })
})

server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`)
})
