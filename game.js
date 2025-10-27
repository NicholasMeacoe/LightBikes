

class Game {
    constructor() {
        this.bounds = 30;
        this.isPaused = false;
        this.init();
    }

    getGameState() {
        return {
            bounds: this.bounds,
            player: this.player,
            playerDirection: this.playerDirection,
            playerTrail: this.playerTrail,
            ai: this.ai,
            aiDirection: this.aiDirection,
            aiTrail: this.aiTrail,
            isPaused: this.isPaused
        };
    }

    init() {
        this.gameOver = false;
        this.frameCount = 0;
        this.isPaused = false;

        this.player = { x: 0, y: 0, z: 0 };
        this.playerDirection = { x: 1, y: 0, z: 0 };
        this.playerTrail = [];
        this.playerPreviousPosition = { x: 0, y: 0, z: 0 };

        this.ai = { x: 0, y: 0, z: -10 };
        this.aiDirection = { x: 1, y: 0, z: 0 };
        this.aiTrail = [];
        this.aiPreviousPosition = { x: 0, y: 0, z: 5 };

    }

    update() {
        if (this.gameOver || this.isPaused) return;



        this.frameCount++;

        // Move Player
        this.player.x += this.playerDirection.x * 0.1;
        this.player.z += this.playerDirection.z * 0.1;

        // Create Player Trail
        this.playerTrail.push({ ...this.player });

        // Move AI
        this.ai.x += this.aiDirection.x * 0.1;
        this.ai.z += this.aiDirection.z * 0.1;

        // Create AI Trail
        this.aiTrail.push({ ...this.ai });
    }

    changePlayerDirection(key) {
        if (!key || typeof key !== 'string') {
            return; // Handle invalid input gracefully
        }
        
        switch (key) {
            case 'ArrowUp':
                if (this.playerDirection.z === 0) this.playerDirection = { x: 0, y: 0, z: -1 };
                break;
            case 'ArrowDown':
                if (this.playerDirection.z === 0) this.playerDirection = { x: 0, y: 0, z: 1 };
                break;
            case 'ArrowLeft':
                if (this.playerDirection.x === 0) this.playerDirection = { x: -1, y: 0, z: 0 };
                break;
            case 'ArrowRight':
                if (this.playerDirection.x === 0) this.playerDirection = { x: 1, y: 0, z: 0 };
                break;
            default:
                // Handle unknown keys gracefully by doing nothing
                break;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    restart() {
        this.init();
    }
}

module.exports = { Game };