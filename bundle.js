(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class AIController {
    constructor() {
        this.aiState = 'DEFENSIVE';
        this.aiStateCooldown = 0;
    }

    calculateAIDirection(gameState) {
        // Validate input parameters
        if (!gameState || !gameState.ai || !gameState.player || !gameState.aiDirection) {
            return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
        }

        const { ai, player, playerTrail = [], aiTrail = [], bounds = 30, aiDirection, aiState = 'DEFENSIVE', aiStateCooldown = 0 } = gameState;

        const whiskerDistances = this.runDefensiveCheck(gameState);

        let newDirection = aiDirection;

        // Turn away from boundaries earlier (10 units) and add random turns
        if (whiskerDistances.forward < 10) {
            // Turn to the side with more clearance
            if (whiskerDistances.left > whiskerDistances.right) {
                newDirection = { x: aiDirection.z, z: -aiDirection.x };
            } else {
                newDirection = { x: -aiDirection.z, z: aiDirection.x };
            }
        } else if (Math.random() < 0.02) {
            // Occasional random turn to make movement less predictable
            newDirection = Math.random() > 0.5
                ? { x: aiDirection.z, z: -aiDirection.x }
                : { x: -aiDirection.z, z: aiDirection.x };
        }

        return { newDirection, newState: 'DEFENSIVE' };
    }

    runDefensiveCheck(gameState) {
        // Validate input parameters
        if (!gameState || !gameState.ai || !gameState.aiDirection) {
            return { forward: 0, left: 0, right: 0 };
        }

        const { ai, playerTrail = [], aiTrail = [], bounds = 30, aiDirection } = gameState;

        const whiskers = {
            forward: { x: aiDirection.x, z: aiDirection.z },
            left: { x: aiDirection.z, z: -aiDirection.x },
            right: { x: -aiDirection.z, z: aiDirection.x }
        };

        const whiskerLength = 20;
        const obstacles = [...playerTrail, ...(aiTrail.length > 10 ? aiTrail.slice(0, aiTrail.length - 10) : aiTrail)];
        const whiskerDistances = { forward: whiskerLength, left: whiskerLength, right: whiskerLength };

        for (const [direction, whisker] of Object.entries(whiskers)) {
            for (let i = 1; i <= whiskerLength; i++) {
                const checkX = ai.x + whisker.x * i * 0.1;
                const checkZ = ai.z + whisker.z * i * 0.1;

                let collision = false;
                if (checkX <= -bounds || checkX >= bounds || checkZ <= -bounds || checkZ >= bounds) {
                    collision = true;
                }

                if (!collision) {
                    for (const segment of obstacles) {
                        if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                            if (Math.abs(checkX - segment.x) < 0.15 && Math.abs(checkZ - segment.z) < 0.15) {
                                collision = true;
                                break;
                            }
                        }
                    }
                }

                if (collision) {
                    whiskerDistances[direction] = i;
                    break;
                }
            }
        }
        return whiskerDistances;
    }
}

module.exports = { AIController };

},{}],2:[function(require,module,exports){
class CollisionDetectionEngine {
    checkCollisions(gameState) {
        if (gameState.frameCount < 10) {
            return { playerCollided: false, aiCollided: false };
        }

        const { player, ai, playerTrail, aiTrail, bounds } = gameState;

        const playerCollided = this.isCollided(player, playerTrail, aiTrail, bounds);
        const aiCollided = this.isCollided(ai, aiTrail, playerTrail, bounds);

        return { playerCollided, aiCollided };
    }

    isCollided(bike, ownTrail, opponentTrail, bounds) {
        // Boundary Check
        if (bike.x <= -bounds || bike.x >= bounds || bike.z <= -bounds || bike.z >= bounds) {
            return true;
        }

        const collisionTolerance = 0.1;
        const excludeRecentSegments = 5;

        // Trail Collision Check
        if (ownTrail.length > excludeRecentSegments) {
            for (let i = 0; i < ownTrail.length - excludeRecentSegments; i++) {
                const segment = ownTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                        return true;
                    }
                }
            }
        }

        for (const segment of opponentTrail) {
            if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                    return true;
                }
            }
        }

        return false;
    }
}

module.exports = { CollisionDetectionEngine };

},{}],3:[function(require,module,exports){
class PlayerController {
    constructor(game) {
        this.game = game;
    }

    init() {
        document.addEventListener('keydown', (event) => {
            this.game.changePlayerDirection(event.key);
        });
    }
}

module.exports = { PlayerController };

},{}],4:[function(require,module,exports){


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
},{}],5:[function(require,module,exports){
class RenderingEngine {
    constructor(bounds) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000033);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 20);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Arena
        const gridHelper = new THREE.GridHelper(bounds * 2, bounds * 2);
        this.scene.add(gridHelper);
        const boxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(bounds * 2, 1, bounds * 2)));
        this.scene.add(boxHelper);

        // Player
        const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.scene.add(this.player);

        // AI
        const aiGeometry = new THREE.BoxGeometry(1, 1, 1);
        const aiMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.ai = new THREE.Mesh(aiGeometry, aiMaterial);
        this.scene.add(this.ai);

        this.playerTrail = [];
        this.aiTrail = [];
    }

    draw(gameState) {
        // Update 3D objects from game state
        this.player.position.x = gameState.player.x;
        this.player.position.z = gameState.player.z;

        this.ai.position.x = gameState.ai.x;
        this.ai.position.z = gameState.ai.z;

        // Create new trail segments
        if (this.playerTrail.length < gameState.playerTrail.length) {
            const lastSegment = gameState.playerTrail[gameState.playerTrail.length - 1];
            this.createTrailSegment(lastSegment, 0x00ff00, this.playerTrail);
        }

        if (this.aiTrail.length < gameState.aiTrail.length) {
            const lastSegment = gameState.aiTrail[gameState.aiTrail.length - 1];
            this.createTrailSegment(lastSegment, 0xff0000, this.aiTrail);
        }

        this.updateCamera(this.player.position);
        this.renderer.render(this.scene, this.camera);
    }

    createTrailSegment(position, color, trail) {
        const trailGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const trailMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
        const trailSegment = new THREE.Mesh(trailGeometry, trailMaterial);
        trailSegment.position.x = position.x;
        trailSegment.position.z = position.z;
        this.scene.add(trailSegment);
        trail.push(trailSegment);
    }

    updateCamera(playerPosition) {
        this.camera.position.x = playerPosition.x;
        this.camera.position.y = 20;
        this.camera.position.z = playerPosition.z + 15;
        this.camera.lookAt(playerPosition);
    }

    clearTrails() {
        for (const segment of this.playerTrail) {
            this.scene.remove(segment);
        }
        for (const segment of this.aiTrail) {
            this.scene.remove(segment);
        }
        this.playerTrail.length = 0;
        this.aiTrail.length = 0;
    }
}

module.exports = { RenderingEngine };

},{}],6:[function(require,module,exports){
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
},{"./ai.js":1,"./collision.js":2,"./controls.js":3,"./game.js":4,"./renderer.js":5}]},{},[6]);
