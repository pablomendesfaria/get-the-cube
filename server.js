import express from 'express'
import { createServer } from 'http'
import createGame from './public/game.js'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const sockets = new Server(server)

app.use(express.static('public'))

const game = createGame()

game.subscribe((command) => {
    console.log(`> Emitting ${command.type}`)
    sockets.emit(command.type, command)
})

sockets.on('connection', (socket) => {
    const playerId = socket.id
    socket.on('enter', (data) => {
        console.log(`> Player connected: ${playerId}`)
        console.log(data)

        game.addPlayer({ playerId: playerId, playerName: data.name, color: data.color})
    })

    socket.emit('setup', game.state)

    socket.on('disconnect', () => {
        game.removePlayer({ playerId: playerId })
        console.log(`> Player disconnected: ${playerId}`)
    })

    socket.on('move-player', (command) => {
        command.playerId = playerId
        command.type = 'move-player'
        
        game.movePlayer(command)
    })

    if (socket.conn.server.clientsCount === 4) {
        game.start()
    }
    console.log(socket.conn.server.clientsCount)
})

server.listen(3000, () => {
    console.log(`> Server listening on port: 3000`)
})