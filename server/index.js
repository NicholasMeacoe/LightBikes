const { GameServer } = require('./GameServer');

// Get port from environment or use default
const PORT = parseInt(process.env.PORT || '3000', 10);

// Create and start server
const server = new GameServer(PORT);
server.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    server.stop();
    process.exit(0);
});

module.exports = { server };
