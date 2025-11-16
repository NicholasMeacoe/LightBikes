/**
 * Example client demonstrating how to connect to the LightBikes multiplayer server
 * This is for testing and demonstration purposes
 */

const io = require('socket.io-client');

// Connect to server
const socket = io('http://localhost:3000');

// Connection events
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    
    // Example: Create a room
    socket.emit('createRoom', {
        maxPlayers: 4,
        gameMode: 'classic',
        isPrivate: false,
        playerName: 'TestPlayer'
    });
});

socket.on('connected', (data) => {
    console.log('Connection acknowledged:', data);
});

// Room events
socket.on('roomCreated', (data) => {
    console.log('Room created:', data.roomId);
    console.log('Room data:', data.room);
});

socket.on('roomJoined', (data) => {
    console.log('Joined room:', data.roomId);
    console.log('Room data:', data.room);
});

socket.on('playerJoined', (data) => {
    console.log('Player joined:', data.player.name);
    console.log('Updated room:', data.room);
});

socket.on('playerLeft', (data) => {
    console.log('Player left:', data.playerId);
});

socket.on('playerReady', (data) => {
    console.log('Player ready status:', data.playerId, data.isReady);
});

// Game events
socket.on('gameStarting', (data) => {
    console.log('Game starting in', data.countdown, 'seconds');
});

socket.on('gameStarted', (data) => {
    console.log('Game started!');
});

socket.on('gameEnded', (data) => {
    console.log('Game ended. Winner:', data.winner);
});

// Chat events
socket.on('chat', (data) => {
    console.log(`[${data.playerName}]: ${data.message}`);
});

// Error events
socket.on('error', (data) => {
    console.error('Error:', data.type, '-', data.message);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Example commands (uncomment to test)

// Set ready status
// setTimeout(() => {
//     socket.emit('setReady', true);
// }, 2000);

// Send chat message
// setTimeout(() => {
//     socket.emit('chat', 'Hello from test client!');
// }, 3000);

// Get room list
// setTimeout(() => {
//     socket.emit('getRoomList');
// }, 1000);

// socket.on('roomList', (rooms) => {
//     console.log('Available rooms:', rooms);
// });

// Quick match
// setTimeout(() => {
//     socket.emit('quickMatch');
// }, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nDisconnecting...');
    socket.disconnect();
    process.exit(0);
});
