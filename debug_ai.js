const { calculateAIDirection } = require('./game.js');

// Debug the AI behavior
const gameState = {
    bounds: 30,
    player: { x: 0, y: 0, z: 0 },
    playerDirection: { x: 1, y: 0, z: 0 },
    playerTrail: [],
    ai: { x: 29.95, y: 0, z: 5 },
    aiDirection: { x: 1, y: 0, z: 0 },
    aiTrail: [],
    aiState: 'DEFENSIVE',
    aiStateCooldown: 0
};

console.log('Testing AI near boundary:');
console.log('AI position:', gameState.ai);
console.log('AI direction:', gameState.aiDirection);
console.log('Bounds:', gameState.bounds);

const result = calculateAIDirection(gameState);
console.log('Result:', result);
