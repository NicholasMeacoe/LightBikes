/**
 * Example integration of ParticleSystem with existing LightBikes architecture
 * This demonstrates how the ParticleSystem integrates with the game loop and Three.js scene
 */

const { ParticleSystem } = require('./ParticleSystem.js');

/**
 * Example integration in script.js
 * This shows how to add the ParticleSystem to the existing game orchestrator
 */
function integrateParticleSystem() {
    // In script.js, after creating the renderingEngine:
    
    // Create particle system with Three.js scene from renderingEngine
    const particleSystem = new ParticleSystem(renderingEngine.scene, {
        maxParticles: 200,
        enabled: true,
        quality: 'medium',
        effects: {
            trailSparks: true,
            explosions: true,
            collections: true
        }
    });

    // Make particle system available globally
    window.particleSystem = particleSystem;

    // Integration point 1: Game loop update
    // In the animate() function, add particle system update:
    function animate() {
        requestAnimationFrame(animate);

        const gameState = game.getGameState();
        const deltaTime = 0.016; // ~60 FPS

        if (!game.gameOver) {
            if (!gameState.isPaused) {
                // Update particle system with game state
                particleSystem.update(deltaTime, gameState);

                // Emit trail sparks during movement
                if (gameState.gameStarted) {
                    // Player trail sparks
                    const playerVelocity = {
                        x: gameState.playerDirection.x * gameState.gameSpeed,
                        y: 0,
                        z: gameState.playerDirection.z * gameState.gameSpeed
                    };
                    particleSystem.emitTrailSparks(gameState.player, playerVelocity, 0x00ff00);

                    // AI trail sparks (for each AI opponent)
                    if (gameState.aiOpponents) {
                        gameState.aiOpponents.forEach(ai => {
                            if (ai.alive) {
                                const aiVelocity = {
                                    x: ai.direction.x * gameState.gameSpeed,
                                    y: 0,
                                    z: ai.direction.z * gameState.gameSpeed
                                };
                                const aiColor = getAIColor(ai.color); // Convert color name to hex
                                particleSystem.emitTrailSparks(ai, aiVelocity, aiColor);
                            }
                        });
                    }
                }

                // Other game updates...
                game.update();
                
                // Collision detection
                const collisionResult = collisionDetectionEngine.checkCollisions(game.getGameState(), game);
                const { playerCollided, aiCollided } = collisionResult;
                
                if (playerCollided || aiCollided) {
                    // Create explosion effects at collision points
                    if (playerCollided) {
                        particleSystem.createExplosion(gameState.player, 1.0);
                    }
                    if (aiCollided && gameState.aiOpponents) {
                        gameState.aiOpponents.forEach(ai => {
                            if (!ai.alive) { // AI just crashed
                                particleSystem.createExplosion(ai, 1.0);
                            }
                        });
                    }
                }
            }

            // Always render, even when paused
            renderingEngine.draw(gameState);
        }
    }

    // Integration point 2: Power-up collection effects
    // In PowerUpManager, when a power-up is collected:
    function onPowerUpCollected(powerUp, collector) {
        // Create collection particle effect
        particleSystem.createCollectionEffect(powerUp.position, powerUp.type);
        
        // Other collection logic...
    }

    // Integration point 3: Game state management
    // Pause/resume integration
    function pauseGame() {
        const pauseResult = game.pause();
        if (pauseResult) {
            particleSystem.pause();
        }
    }

    function resumeGame() {
        const resumeResult = game.resume();
        if (resumeResult) {
            particleSystem.resume();
        }
    }

    // Game restart integration
    function restartGame() {
        game.restart();
        particleSystem.reset(); // Clear all particles
    }

    // Integration point 4: Settings integration
    // Performance degradation handling
    performanceDegradationManager.setOnDegradation((action, status) => {
        if (action === 'reduce_particle_quality') {
            particleSystem.setQualityLevel('low');
        } else if (action === 'disable_particles') {
            particleSystem.setEnabled(false);
        }
    });

    performanceDegradationManager.setOnRecovery((action, status) => {
        if (action === 'restore_particle_quality') {
            particleSystem.setQualityLevel('medium');
        } else if (action === 'enable_particles') {
            particleSystem.setEnabled(true);
        }
    });

    return particleSystem;
}

/**
 * Helper function to convert AI color names to hex values
 */
function getAIColor(colorName) {
    const colorMap = {
        'red': 0xff0000,
        'blue': 0x0000ff,
        'yellow': 0xffff00,
        'purple': 0x800080,
        'cyan': 0x00ffff,
        'green': 0x00ff00,
        'orange': 0xff6600,
        'white': 0xffffff
    };
    return colorMap[colorName] || 0xff0000;
}

/**
 * Example settings UI integration
 */
function createParticleSettingsUI() {
    // Add particle settings to the game menu
    const settingsContainer = document.getElementById('settings') || document.body;
    
    const particleSettingsHTML = `
        <div id="particle-settings" class="settings-section">
            <h3>Particle Effects</h3>
            <div class="setting-row">
                <label>
                    <input type="checkbox" id="particles-enabled" checked>
                    Enable Particle Effects
                </label>
            </div>
            <div class="setting-row">
                <label>Quality:</label>
                <select id="particle-quality">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div class="setting-row">
                <label>
                    <input type="checkbox" id="trail-sparks" checked>
                    Trail Sparks
                </label>
            </div>
            <div class="setting-row">
                <label>
                    <input type="checkbox" id="explosions" checked>
                    Explosions
                </label>
            </div>
            <div class="setting-row">
                <label>
                    <input type="checkbox" id="collections" checked>
                    Collection Effects
                </label>
            </div>
        </div>
    `;
    
    settingsContainer.insertAdjacentHTML('beforeend', particleSettingsHTML);
    
    // Wire up event listeners
    document.getElementById('particles-enabled').addEventListener('change', (e) => {
        window.particleSystem.setEnabled(e.target.checked);
    });
    
    document.getElementById('particle-quality').addEventListener('change', (e) => {
        window.particleSystem.setQualityLevel(e.target.value);
    });
    
    document.getElementById('trail-sparks').addEventListener('change', (e) => {
        window.particleSystem.setEffectEnabled('trailSparks', e.target.checked);
    });
    
    document.getElementById('explosions').addEventListener('change', (e) => {
        window.particleSystem.setEffectEnabled('explosions', e.target.checked);
    });
    
    document.getElementById('collections').addEventListener('change', (e) => {
        window.particleSystem.setEffectEnabled('collections', e.target.checked);
    });
}

/**
 * Example of how to add ParticleSystem to the existing module exports
 */
// In script.js, make ParticleSystem available:
// window.ParticleSystem = ParticleSystem;
// window.particleSystem = integrateParticleSystem();

module.exports = {
    integrateParticleSystem,
    getAIColor,
    createParticleSettingsUI
};