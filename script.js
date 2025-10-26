const { Game } = require('./game.js');
const { AIController } = require('./ai.js');
const { CollisionDetectionEngine } = require('./collision.js');
const { PlayerController } = require('./controls.js');
const { RenderingEngine } = require('./renderer.js');

const game = new Game();
const aiController = new AIController();
const collisionDetectionEngine = new CollisionDetectionEngine();
const playerController = new PlayerController(game);
const renderingEngine = new RenderingEngine(game.bounds);

playerController.init();

const restartButton = document.getElementById('restart');
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

restartButton.addEventListener('click', () => {
    game.restart();
    renderingEngine.clearTrails();
    document.getElementById('gameOver').style.display = 'none';
    restartButton.style.display = 'none';
});

upButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowUp'));
downButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowDown'));
leftButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowLeft'));
rightButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowRight'));

function animate() {
    requestAnimationFrame(animate);

    if (!game.gameOver) {
        const gameState = game.getGameState();

        // AI
        const { newDirection } = aiController.calculateAIDirection(gameState);
        game.aiDirection = newDirection;

        game.update();

        // Collision
        const { playerCollided, aiCollided } = collisionDetectionEngine.checkCollisions(game.getGameState());
        if (playerCollided || aiCollided) {
            game.gameOver = true;
        }

        renderingEngine.draw(game.getGameState());
    } else {
        document.getElementById('gameOver').style.display = 'block';
        restartButton.style.display = 'block';
    }
}

animate();