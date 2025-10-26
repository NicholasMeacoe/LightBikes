(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function calculateAIDirection(gameState) {
    // Validate input parameters
    if (!gameState || !gameState.ai || !gameState.player || !gameState.aiDirection) {
        return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
    }

    const { ai, player, playerTrail = [], aiTrail = [], bounds = 30, aiDirection, aiState = 'DEFENSIVE', aiStateCooldown = 0 } = gameState;

    const whiskerDistances = runDefensiveCheck(gameState);

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

function runDefensiveCheck(gameState) {
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
    const obstacles = [...playerTrail, ...aiTrail.slice(0, Math.max(0, aiTrail.length - 10))];
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

class Game {
    constructor() {
        this.bounds = 30;
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
            aiState: this.aiState,
            aiStateCooldown: this.aiStateCooldown
        };
    }

    init() {
        this.gameOver = false;
        this.frameCount = 0;

        this.player = { x: 0, y: 0, z: 0 };
        this.playerDirection = { x: 1, y: 0, z: 0 };
        this.playerTrail = [];
        this.playerPreviousPosition = { x: 0, y: 0, z: 0 };

        this.ai = { x: 0, y: 0, z: -10 };
        this.aiDirection = { x: 1, y: 0, z: 0 };
        this.aiTrail = [];
        this.aiPreviousPosition = { x: 0, y: 0, z: 5 };
        this.aiState = 'DEFENSIVE';
        this.aiStateCooldown = 0;
    }

    update() {
        if (this.gameOver) return;

        // Collision Detection
        if (this.frameCount >= 10) {
            // Boundary Check - detect if outside or at boundary
            if (this.player.x <= -this.bounds || this.player.x >= this.bounds || 
                this.player.z <= -this.bounds || this.player.z >= this.bounds) {
                this.gameOver = true;
            }
            if (this.ai.x <= -this.bounds || this.ai.x >= this.bounds || 
                this.ai.z <= -this.bounds || this.ai.z >= this.bounds) {
                this.gameOver = true;
            }

            // Trail Collision Check - exclude recent segments to prevent self-collision
            const collisionTolerance = 0.1;
            const excludeRecentSegments = 5;
            
            // Check player trail collisions
            for (let i = 0; i < this.playerTrail.length; i++) {
                const segment = this.playerTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    // Check if this is a recent segment for the player
                    const isRecentForPlayer = i >= this.playerTrail.length - excludeRecentSegments;
                    
                    // Player collision with own trail (skip recent segments)
                    if (!isRecentForPlayer && Math.abs(this.player.x - segment.x) < collisionTolerance && Math.abs(this.player.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                    
                    // AI collision with player trail (check all segments)
                    if (Math.abs(this.ai.x - segment.x) < collisionTolerance && Math.abs(this.ai.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                }
            }
            
            // Check AI trail collisions
            for (let i = 0; i < this.aiTrail.length; i++) {
                const segment = this.aiTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    // Check if this is a recent segment for the AI
                    const isRecentForAI = i >= this.aiTrail.length - excludeRecentSegments;
                    
                    // Player collision with AI trail (check all segments)
                    if (Math.abs(this.player.x - segment.x) < collisionTolerance && Math.abs(this.player.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                    
                    // AI collision with own trail (skip recent segments)
                    if (!isRecentForAI && Math.abs(this.ai.x - segment.x) < collisionTolerance && Math.abs(this.ai.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                }
            }
        }

        if (this.gameOver) return;

        this.frameCount++;

        // Move Player
        this.player.x += this.playerDirection.x * 0.1;
        this.player.z += this.playerDirection.z * 0.1;

        // Create Player Trail
        this.playerTrail.push({ ...this.player });

        // Update AI
        const { newDirection, newState } = calculateAIDirection(this.getGameState());
        this.aiDirection = newDirection;
        this.aiState = newState;

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

    restart() {
        this.init();
    }
}

module.exports = { Game, calculateAIDirection };
},{}],2:[function(require,module,exports){
const { Game } = require('./game.js');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000033);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 20);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const game = new Game();

// Arena
const gridHelper = new THREE.GridHelper(game.bounds * 2, game.bounds * 2);
scene.add(gridHelper);
const boxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(game.bounds * 2, 1, game.bounds * 2)));
scene.add(boxHelper);

// Player
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// AI
const aiGeometry = new THREE.BoxGeometry(1, 1, 1);
const aiMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const ai = new THREE.Mesh(aiGeometry, aiMaterial);
scene.add(ai);

const restartButton = document.getElementById('restart');
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

document.addEventListener('keydown', (event) => {
    game.changePlayerDirection(event.key);
});

restartButton.addEventListener('click', () => {
    game.restart();
    // Clear Trails from scene
    for (const segment of playerTrail) {
        scene.remove(segment);
    }
    for (const segment of aiTrail) {
        scene.remove(segment);
    }
    playerTrail.length = 0;
    aiTrail.length = 0;

    document.getElementById('gameOver').style.display = 'none';
    restartButton.style.display = 'none';
});

upButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowUp'));
downButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowDown'));
leftButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowLeft'));
rightButton.addEventListener('touchstart', () => game.changePlayerDirection('ArrowRight'));

const playerTrail = [];
const aiTrail = [];

function animate() {
    requestAnimationFrame(animate);

    if (!game.gameOver) {
        game.update();

        // Update 3D objects from game state
        player.position.x = game.player.x;
        player.position.z = game.player.z;

        ai.position.x = game.ai.x;
        ai.position.z = game.ai.z;

        // Create new trail segments
        if (playerTrail.length < game.playerTrail.length) {
            const lastSegment = game.playerTrail[game.playerTrail.length - 1];
            const trailGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
            const trailMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
            const trailSegment = new THREE.Mesh(trailGeometry, trailMaterial);
            trailSegment.position.x = lastSegment.x;
            trailSegment.position.z = lastSegment.z;
            scene.add(trailSegment);
            playerTrail.push(trailSegment);
        }

        if (aiTrail.length < game.aiTrail.length) {
            const lastSegment = game.aiTrail[game.aiTrail.length - 1];
            const trailGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
            const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
            const trailSegment = new THREE.Mesh(trailGeometry, trailMaterial);
            trailSegment.position.x = lastSegment.x;
            trailSegment.position.z = lastSegment.z;
            scene.add(trailSegment);
            aiTrail.push(trailSegment);
        }

        // Camera follows player
        camera.position.x = player.position.x;
        camera.position.y = 20;
        camera.position.z = player.position.z + 15;
        camera.lookAt(player.position);
    } else {
        document.getElementById('gameOver').style.display = 'block';
        restartButton.style.display = 'block';
    }

    renderer.render(scene, camera);
}

animate();
},{"./game.js":1}]},{},[2]);
