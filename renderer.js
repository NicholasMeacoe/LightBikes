class RenderingEngine {
    constructor(bounds) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 20);
        
        // Create renderer with proper settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        
        // Set clear color to dark blue instead of black for visibility
        this.renderer.setClearColor(0x000033, 1.0);
        
        // Set size and append to DOM
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Store original camera position for camera effects
        this.originalCameraPosition = this.camera.position.clone();
        this.cameraEffectsManager = null; // Will be set by orchestrator

        // Initialize ThemeEngine for arena theme management
        const { ThemeEngine } = require('./ThemeEngine.js');
        this.themeEngine = new ThemeEngine(this.scene, this.renderer);
        
        // Initialize emissive material system for glow effects
        const { EmissiveMaterialSystem } = require('./EmissiveMaterialSystem.js');
        this.emissiveMaterialSystem = new EmissiveMaterialSystem();
        
        // Initialize trail style renderer
        const { TrailStyleRenderer } = require('./TrailStyleRenderer.js');
        this.trailStyleRenderer = new TrailStyleRenderer(this.scene, this.emissiveMaterialSystem);

        // Initialize with default theme (this will set up lighting, background, and grid)
        this.themeEngine.loadTheme('classic-grid');

        // Player entities - support for dual players
        this.playerEntities = new Map(); // id -> THREE.Mesh
        this.playerTrails = new Map(); // id -> trail segments array
        this.playerLabels = new Map(); // id -> label mesh
        
        // Maintain backward compatibility with single player
        this.player = null; // Will be set to first player for compatibility
        this.playerTrail = []; // Will reference first player trail for compatibility

        // AI entities - support for multiple AI opponents
        this.aiEntities = new Map(); // id -> THREE.Mesh
        this.aiTrails = new Map(); // id -> trail segments array
        
        // Maintain backward compatibility with single AI
        this.ai = null; // Will be set to first AI for compatibility
        this.aiTrail = []; // Will reference first AI trail for compatibility

        this.playerTrail = [];
        
        // Boundary visualization system
        this.boundaryVisualization = {
            currentBoundaries: null,
            futureBoundaries: null,
            warningFlash: {
                active: false,
                intensity: 0.0,
                flashRate: 4, // 4 flashes per second
                lastFlashTime: 0
            },
            shrinkAnimation: {
                active: false,
                progress: 0.0,
                duration: 500, // 0.5 seconds
                startTime: 0,
                startBounds: null,
                targetBounds: null
            }
        };
        
        // Power-up rendering with instanced rendering optimization
        this.powerUpObjects = new Map(); // id -> THREE.Object3D
        this.powerUpAnimations = new Map(); // id -> animation data
        
        // Instanced rendering for power-ups (when multiple of same type exist)
        this.instancedMeshes = new Map(); // type -> THREE.InstancedMesh
        this.instanceMatrices = new Map(); // type -> Float32Array for matrices
        this.instanceCounts = new Map(); // type -> current instance count
        this.maxInstancesPerType = 3; // Max power-ups of same type (matches SPAWN_CONFIG.maxActivePowerUps)
        
        // Particle system for collection effects
        this.collectionParticles = [];
        this.particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        this.particleMaterials = {
            speed: new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true }),
            shield: new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true }),
            eraser: new THREE.MeshBasicMaterial({ color: 0x9932cc, transparent: true }),
            ghost: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
        };
        
        // Initialize instanced meshes for power-up types
        this.initializeInstancedMeshes();
        
        // Particle system integration
        this.particleSystem = null;
        this.particleSystemEnabled = true;
        
        // Split screen camera system for multiplayer
        this.splitScreenCamera = null;
    }

    /**
     * Set the CameraEffectsManager reference for integration
     * @param {Object} cameraEffectsManager - CameraEffectsManager instance
     */
    setCameraEffectsManager(cameraEffectsManager) {
        this.cameraEffectsManager = cameraEffectsManager;
    }

    draw(gameState) {
        // Handle pause/resume state changes for glow effects
        this.handleGlowPauseState(gameState);
        
        // Update emissive material pulse animation
        const deltaTime = this.calculateDeltaTime();
        this.emissiveMaterialSystem.updatePulseAnimation(deltaTime);
        
        // Update trail style effects (rainbow color cycling, etc.)
        this.trailStyleRenderer.updateTrailEffects(deltaTime);
        
        // Update player entities from game state
        this.updatePlayerEntities(gameState);

        // Clean up crashed AI entities before updating
        this.cleanupCrashedAIs(gameState);

        // Handle multiple AI opponents
        this.updateAIEntities(gameState);

        // Create new trail segments for all players
        this.updatePlayerTrails(gameState);

        // Create AI trail segments for all AI opponents
        this.updateAITrails(gameState);

        // Update power-up animations
        this.updatePowerUpAnimations();
        
        // Update particle effects
        this.updateParticleEffects();
        this.updateCollectionNotifications();
        
        // Update integrated particle system
        this.updateIntegratedParticleSystem(gameState);

        // Update boundary visualization if arena state is available
        if (gameState.arenaState) {
            this.updateBoundaryVisualization(gameState.arenaState);
        }

        // Update camera based on player positions
        this.updateCameraForPlayers(gameState);
        
        // Render with camera effects if available, otherwise use standard rendering
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled() && this.cameraEffectsManager.hasPostProcessing()) {
            this.cameraEffectsManager.render(this.scene, this.camera);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Calculate delta time for animations
     * @returns {number} Delta time in seconds
     */
    calculateDeltaTime() {
        const currentTime = Date.now();
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            return 0.016; // Default to 60fps
        }
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        return Math.min(deltaTime, 0.1); // Cap at 100ms to prevent large jumps
    }

    /**
     * Handle pause/resume state changes for glow effects
     * @param {Object} gameState - Current game state
     */
    handleGlowPauseState(gameState) {
        if (!this.emissiveMaterialSystem) return;
        
        const isPaused = gameState.isPaused || false;
        
        // Track previous pause state to detect changes
        if (this.lastPauseState === undefined) {
            this.lastPauseState = isPaused;
        }
        
        // Handle pause state changes
        if (isPaused && !this.lastPauseState) {
            // Game was just paused
            this.emissiveMaterialSystem.pausePulse();
        } else if (!isPaused && this.lastPauseState) {
            // Game was just resumed
            this.emissiveMaterialSystem.resumePulse();
        }
        
        this.lastPauseState = isPaused;
    }

    /**
     * Update AI entities based on game state
     * Handles creation, positioning, and visibility of multiple AI opponents
     */
    updateAIEntities(gameState) {
        // Handle multiple AI opponents from aiOpponents array
        if (gameState.aiOpponents && gameState.aiOpponents.length > 0) {
            gameState.aiOpponents.forEach(aiOpponent => {
                if (aiOpponent.alive) {
                    let aiMesh = this.aiEntities.get(aiOpponent.id);
                    
                    // Create AI mesh if it doesn't exist
                    if (!aiMesh) {
                        const aiGeometry = new THREE.BoxGeometry(1, 1, 1);
                        const aiColor = this.getColorHex(aiOpponent.color);
                        const aiMaterial = this.emissiveMaterialSystem.createBikeMaterial(aiOpponent.id, aiColor);
                        aiMesh = new THREE.Mesh(aiGeometry, aiMaterial);
                        this.scene.add(aiMesh);
                        this.aiEntities.set(aiOpponent.id, aiMesh);
                        
                        // Initialize trail array for this AI
                        if (!this.aiTrails.has(aiOpponent.id)) {
                            this.aiTrails.set(aiOpponent.id, []);
                        }
                    }
                    
                    // Update position
                    aiMesh.position.x = aiOpponent.x;
                    aiMesh.position.z = aiOpponent.z;
                    aiMesh.visible = true;
                } else {
                    // Hide crashed AI entities
                    const aiMesh = this.aiEntities.get(aiOpponent.id);
                    if (aiMesh) {
                        aiMesh.visible = false;
                    }
                }
            });
            
            // Maintain backward compatibility - set first AI as legacy ai property
            const firstAI = gameState.aiOpponents[0];
            if (firstAI && firstAI.alive) {
                this.ai = this.aiEntities.get(firstAI.id);
                this.aiTrail = this.aiTrails.get(firstAI.id) || [];
            }
        } else {
            // No AI opponents - hide all AI entities
            this.aiEntities.forEach(aiMesh => {
                aiMesh.visible = false;
            });
            this.ai = null;
            this.aiTrail = [];
        }
        
        // Handle backward compatibility with single AI (gameState.ai)
        if (gameState.ai && !gameState.aiOpponents) {
            // Legacy single AI mode
            if (!this.ai) {
                const aiGeometry = new THREE.BoxGeometry(1, 1, 1);
                const aiMaterial = this.emissiveMaterialSystem.createBikeMaterial('legacy_ai', 0xff0000);
                this.ai = new THREE.Mesh(aiGeometry, aiMaterial);
                this.scene.add(this.ai);
            }
            
            this.ai.position.x = gameState.ai.x;
            this.ai.position.z = gameState.ai.z;
            this.ai.visible = true;
        }
    }

    /**
     * Update AI trails for all AI opponents
     * Creates new trail segments with appropriate colors
     */
    updateAITrails(gameState) {
        if (gameState.aiOpponents && gameState.aiOpponents.length > 0) {
            gameState.aiOpponents.forEach(aiOpponent => {
                if (aiOpponent.alive && aiOpponent.trail) {
                    const aiTrail = this.aiTrails.get(aiOpponent.id) || [];
                    
                    // Create new trail segments if needed
                    if (aiTrail.length < aiOpponent.trail.length) {
                        const lastSegment = aiOpponent.trail[aiOpponent.trail.length - 1];
                        const aiColor = this.getColorHex(aiOpponent.color);
                        this.createTrailSegment(lastSegment, aiColor, aiTrail, aiOpponent.id);
                        this.aiTrails.set(aiOpponent.id, aiTrail);
                    }
                }
            });
        }
        
        // Handle backward compatibility with single AI trail
        if (gameState.ai && gameState.aiTrail && this.aiTrail.length < gameState.aiTrail.length) {
            const lastSegment = gameState.aiTrail[gameState.aiTrail.length - 1];
            this.createTrailSegment(lastSegment, 0xff0000, this.aiTrail, 'legacy_ai');
        }
    }

    /**
     * Convert color name to hex value for AI entities
     * @param {string} colorName - Color name (red, blue, yellow, purple)
     * @returns {number} Hex color value
     */
    getColorHex(colorName) {
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
        return colorMap[colorName] || 0xff0000; // Default to red if color not found
    }

    /**
     * Get player color based on player ID
     * @param {string} playerId - Player ID ('P1', 'P2', etc.)
     * @returns {number} Hex color value
     */
    getPlayerColor(playerId) {
        const playerColorMap = {
            'P1': 0x00ff00, // Green for Player 1
            'P2': 0x0000ff, // Blue for Player 2
            'player': 0x00ff00, // Backward compatibility
            'player1': 0x00ff00,
            'player2': 0x0000ff
        };
        return playerColorMap[playerId] || 0x00ff00; // Default to green
    }

    /**
     * Update player entities based on game state
     * Handles creation, positioning, and visibility of dual players
     */
    updatePlayerEntities(gameState) {
        // Handle multiplayer game state with player1 and player2
        if (gameState.player1 && gameState.player2) {
            this.updatePlayerEntity('P1', gameState.player1);
            this.updatePlayerEntity('P2', gameState.player2);
            
            // Maintain backward compatibility - set first player as legacy player property
            this.player = this.playerEntities.get('P1');
            this.playerTrail = this.playerTrails.get('P1') || [];
        } 
        // Handle players array (alternative multiplayer format)
        else if (gameState.players && gameState.players.length > 0) {
            gameState.players.forEach(player => {
                if (player.id && player.isAlive) {
                    this.updatePlayerEntity(player.id, player);
                }
            });
            
            // Set first player as legacy player property
            const firstPlayer = gameState.players[0];
            if (firstPlayer) {
                this.player = this.playerEntities.get(firstPlayer.id);
                this.playerTrail = this.playerTrails.get(firstPlayer.id) || [];
            }
        }
        // Handle backward compatibility with single player
        else if (gameState.player) {
            this.updatePlayerEntity('player', gameState.player);
            this.player = this.playerEntities.get('player');
            this.playerTrail = this.playerTrails.get('player') || [];
        }
    }

    /**
     * Update individual player entity
     * @param {string} playerId - Player ID
     * @param {Object} playerState - Player state object
     */
    updatePlayerEntity(playerId, playerState) {
        if (!playerState.isAlive) {
            // Hide crashed player entities
            const playerMesh = this.playerEntities.get(playerId);
            if (playerMesh) {
                playerMesh.visible = false;
            }
            const playerLabel = this.playerLabels.get(playerId);
            if (playerLabel) {
                playerLabel.visible = false;
            }
            return;
        }

        let playerMesh = this.playerEntities.get(playerId);
        let playerLabel = this.playerLabels.get(playerId);
        
        // Create player mesh if it doesn't exist
        if (!playerMesh) {
            const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
            const playerColor = this.getPlayerColor(playerId);
            const playerMaterial = this.emissiveMaterialSystem.createBikeMaterial(playerId, playerColor);
            playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
            this.scene.add(playerMesh);
            this.playerEntities.set(playerId, playerMesh);
            
            // Initialize trail array for this player
            if (!this.playerTrails.has(playerId)) {
                this.playerTrails.set(playerId, []);
            }
        }
        
        // Create player label if it doesn't exist
        if (!playerLabel && (playerId === 'P1' || playerId === 'P2')) {
            playerLabel = this.createPlayerLabel(playerId);
            this.playerLabels.set(playerId, playerLabel);
        }
        
        // Update position
        playerMesh.position.x = playerState.x || playerState.position?.x || 0;
        playerMesh.position.z = playerState.z || playerState.position?.z || 0;
        playerMesh.visible = true;
        
        // Update label position if it exists
        if (playerLabel) {
            playerLabel.position.x = playerMesh.position.x;
            playerLabel.position.z = playerMesh.position.z;
            playerLabel.position.y = 2; // Position above the player
            playerLabel.visible = true;
        }
    }

    /**
     * Create player identification label
     * @param {string} playerId - Player ID ('P1' or 'P2')
     * @returns {THREE.Mesh} Label mesh
     */
    createPlayerLabel(playerId) {
        // Create a simple colored cube as a label (in a real implementation, this would be text)
        const labelGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const labelColor = this.getPlayerColor(playerId);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            color: labelColor,
            transparent: true,
            opacity: 0.8
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.y = 2; // Position above player
        
        // Add to scene
        this.scene.add(label);
        
        // In a real implementation, you would create text geometry or use CSS2DRenderer
        // For now, we'll use a colored cube that matches the player color
        console.log(`Created label for ${playerId}`);
        
        return label;
    }

    /**
     * Update player trails for all players
     * Creates new trail segments with appropriate colors
     */
    updatePlayerTrails(gameState) {
        // Handle multiplayer game state with player1 and player2
        if (gameState.player1 && gameState.player2) {
            this.updatePlayerTrail('P1', gameState.player1);
            this.updatePlayerTrail('P2', gameState.player2);
        }
        // Handle players array (alternative multiplayer format)
        else if (gameState.players && gameState.players.length > 0) {
            gameState.players.forEach(player => {
                if (player.id && player.isAlive) {
                    this.updatePlayerTrail(player.id, player);
                }
            });
        }
        // Handle backward compatibility with single player
        else if (gameState.player && gameState.playerTrail) {
            const playerTrail = this.playerTrails.get('player') || [];
            if (playerTrail.length < gameState.playerTrail.length) {
                const lastSegment = gameState.playerTrail[gameState.playerTrail.length - 1];
                this.createTrailSegment(lastSegment, 0x00ff00, playerTrail, 'player');
                this.playerTrails.set('player', playerTrail);
            }
        }
    }

    /**
     * Update individual player trail
     * @param {string} playerId - Player ID
     * @param {Object} playerState - Player state object
     */
    updatePlayerTrail(playerId, playerState) {
        if (!playerState.isAlive || !playerState.trail) return;
        
        const playerTrail = this.playerTrails.get(playerId) || [];
        
        // Create new trail segments if needed
        if (playerTrail.length < playerState.trail.length) {
            const lastSegment = playerState.trail[playerState.trail.length - 1];
            const playerColor = this.getPlayerColor(playerId);
            this.createTrailSegment(lastSegment, playerColor, playerTrail, playerId);
            this.playerTrails.set(playerId, playerTrail);
        }
    }

    createTrailSegment(position, color, trail, playerId = null) {
        // Use customization color template if available for player
        let finalColor = color;
        if (playerId && this.emissiveMaterialSystem.getTrailColorTemplate) {
            finalColor = this.emissiveMaterialSystem.getTrailColorTemplate(playerId);
        }
        
        // Create styled trail segment using TrailStyleRenderer
        const trailSegment = this.trailStyleRenderer.createStyledTrailSegment(
            position, 
            finalColor, 
            trail, 
            playerId
        );
        
        // Only add to trail array if segment was actually created (not skipped for dashed style)
        if (trailSegment) {
            trail.push(trailSegment);
        }
    }

    updateCamera(playerPosition) {
        // Calculate base camera position
        const baseCameraPosition = {
            x: playerPosition.x,
            y: 20,
            z: playerPosition.z + 15
        };

        // Apply camera effects if available
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            const effectsOffset = this.cameraEffectsManager.getCameraOffset();
            this.camera.position.x = baseCameraPosition.x + effectsOffset.x;
            this.camera.position.y = baseCameraPosition.y + effectsOffset.y;
            this.camera.position.z = baseCameraPosition.z + effectsOffset.z;
        } else {
            // No effects - use base position
            this.camera.position.x = baseCameraPosition.x;
            this.camera.position.y = baseCameraPosition.y;
            this.camera.position.z = baseCameraPosition.z;
        }

        this.camera.lookAt(playerPosition);
    }

    /**
     * Update camera for multiplayer scenarios
     * @param {Object} gameState - Current game state
     */
    updateCameraForPlayers(gameState) {
        // Initialize split screen camera if not already done
        if (!this.splitScreenCamera) {
            const { SplitScreenCamera } = require('./SplitScreenCamera.js');
            this.splitScreenCamera = new SplitScreenCamera(this.camera);
        }

        // Collect alive players for camera tracking
        const alivePlayers = [];
        
        // Handle multiplayer game state with player1 and player2
        if (gameState.player1 && gameState.player2) {
            if (gameState.player1.isAlive) alivePlayers.push(gameState.player1);
            if (gameState.player2.isAlive) alivePlayers.push(gameState.player2);
        }
        // Handle players array format
        else if (gameState.players && gameState.players.length > 0) {
            alivePlayers.push(...gameState.players.filter(p => p.isAlive));
        }
        // Handle backward compatibility with single player
        else if (gameState.player) {
            alivePlayers.push(gameState.player);
        }

        // Update split screen camera with alive players
        this.splitScreenCamera.setPlayers(alivePlayers);
        
        // Get camera effects offset if available
        const effectsOffset = (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) 
            ? this.cameraEffectsManager.getCameraOffset() 
            : { x: 0, y: 0, z: 0 };
        
        // Update camera with arena state if available
        this.splitScreenCamera.update(effectsOffset, gameState.arenaState);
        
        // Fallback to legacy camera system if no players found
        if (alivePlayers.length === 0 && this.player) {
            this.updateCamera(this.player.position);
        }
    }

    clearTrails() {
        // Clear all trails using the trail style renderer
        this.trailStyleRenderer.clearAllTrails();
        
        // Clear all player entities and trails
        this.clearAllPlayers();
        
        // Clear all AI entities and trails
        this.clearAllAIs();
        
        // Clear boundary visualizations when clearing trails (game reset)
        this.clearBoundaryVisualization();
        
        // Reset particle system on game reset
        this.resetParticleSystem();

        // Reset camera effects on game reset
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            this.cameraEffectsManager.reset();
        }
        
        // Reset split screen camera on game reset
        if (this.splitScreenCamera) {
            this.splitScreenCamera.reset();
        }
    }

    /**
     * Initialize instanced meshes for efficient power-up rendering
     */
    initializeInstancedMeshes() {
        const powerUpTypes = {
            'SPEED_BOOST': {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 0x0066ff,
                    emissive: 0x0066ff,
                    emissiveIntensity: 0.3
                })
            },
            'SHIELD': {
                geometry: new THREE.SphereGeometry(0.6, 16, 16),
                material: new THREE.MeshLambertMaterial({
                    color: 0xffd700,
                    emissive: 0xffd700,
                    emissiveIntensity: 0.3
                })
            },
            'TRAIL_ERASER': {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 0x9932cc,
                    emissive: 0x9932cc,
                    emissiveIntensity: 0.3
                })
            },
            'GHOST_MODE': {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7
                })
            }
        };

        for (const [type, config] of Object.entries(powerUpTypes)) {
            // Create instanced mesh for this power-up type
            const instancedMesh = new THREE.InstancedMesh(
                config.geometry,
                config.material,
                this.maxInstancesPerType
            );
            
            // Initialize with invisible instances (will be updated when power-ups spawn)
            const matrix = new THREE.Matrix4();
            matrix.makeScale(0, 0, 0); // Make invisible initially
            for (let i = 0; i < this.maxInstancesPerType; i++) {
                instancedMesh.setMatrixAt(i, matrix);
            }
            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.count = 0; // No visible instances initially
            
            this.scene.add(instancedMesh);
            this.instancedMeshes.set(type, instancedMesh);
            this.instanceCounts.set(type, 0);
            
            // Initialize matrix array for this type
            this.instanceMatrices.set(type, new Float32Array(this.maxInstancesPerType * 16));
        }
    }

    /**
     * Register power-up entities for rendering with instanced rendering optimization
     * Called by PowerUpManager when new power-ups are spawned
     */
    registerPowerUps(powerUpEntities) {
        // Group power-ups by type for instanced rendering decision
        const powerUpsByType = new Map();
        for (const powerUp of powerUpEntities) {
            if (!powerUpsByType.has(powerUp.type)) {
                powerUpsByType.set(powerUp.type, []);
            }
            powerUpsByType.get(powerUp.type).push(powerUp);
        }

        // Remove power-ups that no longer exist
        const currentIds = new Set(powerUpEntities.map(p => p.id));
        for (const [id, object] of this.powerUpObjects) {
            if (!currentIds.has(id)) {
                this.removePowerUp(id);
            }
        }

        // Decide rendering method based on count per type
        for (const [type, powerUps] of powerUpsByType) {
            if (powerUps.length > 1 && this.instancedMeshes.has(type)) {
                // Use instanced rendering for multiple power-ups of same type
                this.updateInstancedPowerUps(type, powerUps);
            } else {
                // Use individual meshes for single power-ups or unsupported types
                for (const powerUp of powerUps) {
                    if (!this.powerUpObjects.has(powerUp.id)) {
                        this.createPowerUpObject(powerUp);
                    }
                }
            }
        }

        // Clear instanced meshes for types with no power-ups
        for (const [type, instancedMesh] of this.instancedMeshes) {
            if (!powerUpsByType.has(type)) {
                instancedMesh.count = 0;
                this.instanceCounts.set(type, 0);
            }
        }
    }

    /**
     * Create 3D object for a power-up entity
     */
    createPowerUpObject(powerUp) {
        const { type, position, appearance } = powerUp;
        let geometry, material, mesh;

        // Create geometry based on power-up type
        switch (appearance.shape) {
            case 'cube':
                geometry = new THREE.BoxGeometry(
                    appearance.size.x,
                    appearance.size.y,
                    appearance.size.z
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(appearance.size.radius, 16, 16);
                break;
            case 'diamond':
                // Create diamond by rotating a cube 45 degrees
                geometry = new THREE.BoxGeometry(
                    appearance.size.x,
                    appearance.size.y,
                    appearance.size.z
                );
                break;
            default:
                console.warn(`Unknown power-up shape: ${appearance.shape}`);
                geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        }

        // Create material with glow effect
        if (appearance.glow) {
            material = new THREE.MeshLambertMaterial({
                color: appearance.color,
                emissive: appearance.color,
                emissiveIntensity: 0.3,
                transparent: appearance.opacity !== undefined,
                opacity: appearance.opacity || 1.0
            });
        } else {
            material = new THREE.MeshLambertMaterial({
                color: appearance.color,
                transparent: appearance.opacity !== undefined,
                opacity: appearance.opacity || 1.0
            });
        }

        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        // Special handling for diamond shape (rotate cube)
        if (appearance.shape === 'diamond') {
            mesh.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
        }

        this.scene.add(mesh);
        this.powerUpObjects.set(powerUp.id, mesh);

        // Initialize animation data
        this.initializePowerUpAnimation(powerUp.id, type, mesh);
    }

    /**
     * Initialize animation data for a power-up
     */
    initializePowerUpAnimation(id, type, mesh) {
        const animationData = {
            type: type,
            mesh: mesh,
            startTime: Date.now(),
            rotationSpeed: { x: 0, y: 0, z: 0 },
            floatAmplitude: 0,
            floatSpeed: 0,
            originalY: mesh.position.y,
            opacityRange: { min: 1, max: 1 },
            opacitySpeed: 0
        };

        // Configure animation based on power-up type
        switch (type) {
            case 'SPEED_BOOST':
                // Blue glowing cube with rotation
                animationData.rotationSpeed.y = 0.02;
                break;
            case 'SHIELD':
                // Golden sphere with floating animation
                animationData.floatAmplitude = 0.1;
                animationData.floatSpeed = 0.003;
                break;
            case 'TRAIL_ERASER':
                // Purple diamond with multi-axis rotation
                animationData.rotationSpeed.x = 0.015;
                animationData.rotationSpeed.y = 0.02;
                animationData.rotationSpeed.z = 0.01;
                break;
            case 'GHOST_MODE':
                // Translucent white cube with opacity animation
                animationData.opacityRange = { min: 0.4, max: 0.9 };
                animationData.opacitySpeed = 0.004;
                break;
        }

        this.powerUpAnimations.set(id, animationData);
    }

    /**
     * Update power-up animations each frame
     */
    updatePowerUpAnimations() {
        const currentTime = Date.now();

        for (const [id, animData] of this.powerUpAnimations) {
            const { mesh, startTime, rotationSpeed, floatAmplitude, floatSpeed, originalY, opacityRange, opacitySpeed } = animData;
            const elapsed = currentTime - startTime;

            // Apply rotation
            if (rotationSpeed.x !== 0) mesh.rotation.x += rotationSpeed.x;
            if (rotationSpeed.y !== 0) mesh.rotation.y += rotationSpeed.y;
            if (rotationSpeed.z !== 0) mesh.rotation.z += rotationSpeed.z;

            // Apply floating animation
            if (floatAmplitude > 0) {
                mesh.position.y = originalY + Math.sin(elapsed * floatSpeed) * floatAmplitude;
            }

            // Apply opacity animation
            if (opacityRange.min !== opacityRange.max) {
                const opacityMid = (opacityRange.min + opacityRange.max) / 2;
                const opacityAmp = (opacityRange.max - opacityRange.min) / 2;
                const opacity = opacityMid + Math.sin(elapsed * opacitySpeed) * opacityAmp;
                mesh.material.opacity = opacity;
            }
        }
    }

    /**
     * Remove a power-up from rendering
     */
    removePowerUp(powerUpId) {
        const mesh = this.powerUpObjects.get(powerUpId);
        if (mesh) {
            this.scene.remove(mesh);
            
            // Dispose of geometry and material to free memory
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            
            this.powerUpObjects.delete(powerUpId);
        }

        this.powerUpAnimations.delete(powerUpId);
    }

    /**
     * Update instanced power-ups for efficient rendering of multiple same-type power-ups
     */
    updateInstancedPowerUps(type, powerUps) {
        const instancedMesh = this.instancedMeshes.get(type);
        if (!instancedMesh) return;

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const scale = new THREE.Vector3(1, 1, 1);

        // Update instances for this type
        for (let i = 0; i < powerUps.length && i < this.maxInstancesPerType; i++) {
            const powerUp = powerUps[i];
            
            // Set position
            position.set(powerUp.position.x, powerUp.position.y, powerUp.position.z);
            
            // Set rotation based on animation (simplified for instanced rendering)
            const time = Date.now() * 0.001;
            switch (type) {
                case 'SPEED_BOOST':
                    rotation.set(0, time * 2, 0);
                    break;
                case 'TRAIL_ERASER':
                    rotation.set(time * 1.5, time * 2, time);
                    break;
                case 'GHOST_MODE':
                    rotation.set(0, time * 1.5, 0);
                    break;
                default:
                    rotation.set(0, 0, 0);
            }
            
            // Special handling for diamond shape (Trail Eraser)
            if (type === 'TRAIL_ERASER') {
                rotation.x += Math.PI / 4;
                rotation.z += Math.PI / 4;
            }
            
            // Create transformation matrix
            matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
            instancedMesh.setMatrixAt(i, matrix);
            
            // Remove from individual rendering if it exists
            if (this.powerUpObjects.has(powerUp.id)) {
                this.removePowerUp(powerUp.id);
            }
        }

        // Hide unused instances
        const invisibleMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
        for (let i = powerUps.length; i < this.maxInstancesPerType; i++) {
            instancedMesh.setMatrixAt(i, invisibleMatrix);
        }

        instancedMesh.count = Math.min(powerUps.length, this.maxInstancesPerType);
        instancedMesh.instanceMatrix.needsUpdate = true;
        this.instanceCounts.set(type, instancedMesh.count);
    }

    /**
     * Clear all power-ups from rendering (for game reset)
     */
    clearPowerUps() {
        // Clear individual power-up objects
        for (const [id] of this.powerUpObjects) {
            this.removePowerUp(id);
        }
        
        // Clear instanced meshes
        for (const [type, instancedMesh] of this.instancedMeshes) {
            instancedMesh.count = 0;
            this.instanceCounts.set(type, 0);
            
            // Hide all instances
            const invisibleMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
            for (let i = 0; i < this.maxInstancesPerType; i++) {
                instancedMesh.setMatrixAt(i, invisibleMatrix);
            }
            instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }

    /**
     * Create particle effect for power-up collection
     */
    createCollectionParticles(position, powerUpType) {
        const particleCount = 8;
        const particles = [];
        
        // Get material based on power-up type
        let material;
        switch (powerUpType) {
            case 'SPEED_BOOST':
                material = this.particleMaterials.speed;
                break;
            case 'SHIELD':
                material = this.particleMaterials.shield;
                break;
            case 'TRAIL_ERASER':
                material = this.particleMaterials.eraser;
                break;
            case 'GHOST_MODE':
                material = this.particleMaterials.ghost;
                break;
            default:
                material = this.particleMaterials.speed;
        }

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(this.particleGeometry, material.clone());
            
            // Set initial position
            particle.position.set(position.x, position.y, position.z);
            
            // Random velocity
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.1;
            particle.userData = {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: 0.05 + Math.random() * 0.1,
                    z: Math.sin(angle) * speed
                },
                life: 1.0,
                decay: 0.02 + Math.random() * 0.01
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        this.collectionParticles.push(...particles);
    }

    /**
     * Update particle effects
     */
    updateParticleEffects() {
        const particlesToRemove = [];
        
        for (let i = 0; i < this.collectionParticles.length; i++) {
            const particle = this.collectionParticles[i];
            const userData = particle.userData;
            
            // Update position
            particle.position.x += userData.velocity.x;
            particle.position.y += userData.velocity.y;
            particle.position.z += userData.velocity.z;
            
            // Apply gravity
            userData.velocity.y -= 0.002;
            
            // Update life and opacity
            userData.life -= userData.decay;
            particle.material.opacity = userData.life;
            
            // Mark for removal if life is over
            if (userData.life <= 0) {
                particlesToRemove.push(i);
            }
        }
        
        // Remove dead particles
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            const index = particlesToRemove[i];
            const particle = this.collectionParticles[index];
            
            this.scene.remove(particle);
            if (particle.material) particle.material.dispose();
            
            this.collectionParticles.splice(index, 1);
        }
    }

    /**
     * Display collection notification text
     */
    displayCollectionNotification(powerUpType, position) {
        // Create a simple text notification using CSS2DRenderer would be ideal,
        // but for now we'll create a temporary colored cube as visual feedback
        const notificationGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let notificationMaterial;
        let text = '';
        
        switch (powerUpType) {
            case 'SPEED_BOOST':
                notificationMaterial = new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.8 });
                text = 'Speed Boost!';
                break;
            case 'SHIELD':
                notificationMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.8 });
                text = 'Shield!';
                break;
            case 'TRAIL_ERASER':
                notificationMaterial = new THREE.MeshBasicMaterial({ color: 0x9932cc, transparent: true, opacity: 0.8 });
                text = 'Trail Eraser!';
                break;
            case 'GHOST_MODE':
                notificationMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
                text = 'Ghost Mode!';
                break;
            default:
                notificationMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
                text = 'Power-Up!';
        }
        
        const notification = new THREE.Mesh(notificationGeometry, notificationMaterial);
        notification.position.set(position.x, position.y + 2, position.z);
        
        // Add animation data for floating upward and fading
        notification.userData = {
            startTime: Date.now(),
            duration: 2000, // 2 seconds
            startY: position.y + 2,
            isNotification: true
        };
        
        this.scene.add(notification);
        this.collectionParticles.push(notification); // Reuse particle system for cleanup
        
        // Log the text notification (in a real implementation, this would be displayed as UI text)
        console.log(`Collection Notification: ${text}`);
    }

    /**
     * Update collection notifications
     */
    updateCollectionNotifications() {
        const currentTime = Date.now();
        
        for (const particle of this.collectionParticles) {
            if (particle.userData && particle.userData.isNotification) {
                const elapsed = currentTime - particle.userData.startTime;
                const progress = elapsed / particle.userData.duration;
                
                if (progress >= 1) {
                    // Mark for removal
                    particle.userData.life = 0;
                } else {
                    // Float upward and fade out
                    particle.position.y = particle.userData.startY + progress * 3;
                    particle.material.opacity = 0.8 * (1 - progress);
                }
            }
        }
    }

    /**
     * Create current boundary visualization
     * @param {Object} bounds - Boundary coordinates {minX, maxX, minZ, maxZ}
     */
    createCurrentBoundaryVisualization(bounds) {
        // Remove existing current boundaries
        if (this.boundaryVisualization.currentBoundaries) {
            this.scene.remove(this.boundaryVisualization.currentBoundaries);
            if (this.boundaryVisualization.currentBoundaries.geometry) {
                this.boundaryVisualization.currentBoundaries.geometry.dispose();
            }
            if (this.boundaryVisualization.currentBoundaries.material) {
                this.boundaryVisualization.currentBoundaries.material.dispose();
            }
        }

        // Create boundary lines using LineSegments for better visibility
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        // Create boundary lines (4 walls of the arena)
        // Bottom wall (minZ)
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.maxX, 0, bounds.minZ);
        // Top wall (maxZ)
        vertices.push(bounds.minX, 0, bounds.maxZ, bounds.maxX, 0, bounds.maxZ);
        // Left wall (minX)
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.minX, 0, bounds.maxZ);
        // Right wall (maxX)
        vertices.push(bounds.maxX, 0, bounds.minZ, bounds.maxX, 0, bounds.maxZ);

        // Add vertical lines for better visibility
        const height = 2;
        // Vertical lines at corners
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.minX, height, bounds.minZ);
        vertices.push(bounds.maxX, 0, bounds.minZ, bounds.maxX, height, bounds.minZ);
        vertices.push(bounds.minX, 0, bounds.maxZ, bounds.minX, height, bounds.maxZ);
        vertices.push(bounds.maxX, 0, bounds.maxZ, bounds.maxX, height, bounds.maxZ);

        // Top boundary lines
        vertices.push(bounds.minX, height, bounds.minZ, bounds.maxX, height, bounds.minZ);
        vertices.push(bounds.minX, height, bounds.maxZ, bounds.maxX, height, bounds.maxZ);
        vertices.push(bounds.minX, height, bounds.minZ, bounds.minX, height, bounds.maxZ);
        vertices.push(bounds.maxX, height, bounds.minZ, bounds.maxX, height, bounds.maxZ);

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Create bright, contrasting material
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff, // Bright cyan for high visibility
            linewidth: 3,
            transparent: true,
            opacity: 1.0
        });

        const boundaryLines = new THREE.LineSegments(geometry, material);
        this.scene.add(boundaryLines);
        this.boundaryVisualization.currentBoundaries = boundaryLines;
    }

    /**
     * Create future boundary preview visualization
     * @param {Object} bounds - Future boundary coordinates {minX, maxX, minZ, maxZ}
     */
    createFutureBoundaryVisualization(bounds) {
        // Remove existing future boundaries
        if (this.boundaryVisualization.futureBoundaries) {
            this.scene.remove(this.boundaryVisualization.futureBoundaries);
            if (this.boundaryVisualization.futureBoundaries.geometry) {
                this.boundaryVisualization.futureBoundaries.geometry.dispose();
            }
            if (this.boundaryVisualization.futureBoundaries.material) {
                this.boundaryVisualization.futureBoundaries.material.dispose();
            }
        }

        // Create translucent boundary preview
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        // Create boundary lines for future position
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.maxX, 0, bounds.minZ);
        vertices.push(bounds.minX, 0, bounds.maxZ, bounds.maxX, 0, bounds.maxZ);
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.minX, 0, bounds.maxZ);
        vertices.push(bounds.maxX, 0, bounds.minZ, bounds.maxX, 0, bounds.maxZ);

        // Add vertical preview lines
        const height = 1.5;
        vertices.push(bounds.minX, 0, bounds.minZ, bounds.minX, height, bounds.minZ);
        vertices.push(bounds.maxX, 0, bounds.minZ, bounds.maxX, height, bounds.minZ);
        vertices.push(bounds.minX, 0, bounds.maxZ, bounds.minX, height, bounds.maxZ);
        vertices.push(bounds.maxX, 0, bounds.maxZ, bounds.maxX, height, bounds.maxZ);

        vertices.push(bounds.minX, height, bounds.minZ, bounds.maxX, height, bounds.minZ);
        vertices.push(bounds.minX, height, bounds.maxZ, bounds.maxX, height, bounds.maxZ);
        vertices.push(bounds.minX, height, bounds.minZ, bounds.minX, height, bounds.maxZ);
        vertices.push(bounds.maxX, height, bounds.minZ, bounds.maxX, height, bounds.maxZ);

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Create translucent material for preview
        const material = new THREE.LineBasicMaterial({
            color: 0xff6600, // Orange for future boundaries
            linewidth: 2,
            transparent: true,
            opacity: 0.3 // Translucent as specified in requirements
        });

        const futureBoundaryLines = new THREE.LineSegments(geometry, material);
        this.scene.add(futureBoundaryLines);
        this.boundaryVisualization.futureBoundaries = futureBoundaryLines;
    }

    /**
     * Update boundary visualization based on arena state
     * @param {Object} arenaState - Current arena state from ArenaShrinker
     */
    updateBoundaryVisualization(arenaState) {
        if (!arenaState) return;

        const currentTime = Date.now();

        // Always update current boundaries
        this.createCurrentBoundaryVisualization(arenaState.currentBounds);

        // Show future boundaries during warning periods
        if (arenaState.warningActive) {
            this.createFutureBoundaryVisualization(arenaState.nextBounds);
            
            // Activate warning flash
            if (!this.boundaryVisualization.warningFlash.active) {
                this.boundaryVisualization.warningFlash.active = true;
                this.boundaryVisualization.warningFlash.lastFlashTime = currentTime;
            }
        } else {
            // Hide future boundaries when not in warning
            if (this.boundaryVisualization.futureBoundaries) {
                this.scene.remove(this.boundaryVisualization.futureBoundaries);
                this.boundaryVisualization.futureBoundaries = null;
            }
            
            // Deactivate warning flash
            this.boundaryVisualization.warningFlash.active = false;
        }

        // Update warning flash effect
        this.updateWarningFlash(currentTime);
        
        // Update shrinking animation
        this.updateShrinkAnimation(currentTime);
    }

    /**
     * Update warning flash effect
     * @param {number} currentTime - Current timestamp
     */
    updateWarningFlash(currentTime) {
        const flash = this.boundaryVisualization.warningFlash;
        
        if (!flash.active || !this.boundaryVisualization.currentBoundaries) {
            return;
        }

        // Calculate flash intensity (4 flashes per second)
        const flashInterval = 1000 / flash.flashRate; // 250ms per flash cycle
        const timeSinceLastFlash = currentTime - flash.lastFlashTime;
        const flashCycle = (timeSinceLastFlash % flashInterval) / flashInterval;
        
        // Create pulsing red effect
        const redIntensity = Math.sin(flashCycle * Math.PI * 2) * 0.5 + 0.5;
        const flashColor = new THREE.Color(1, redIntensity * 0.2, redIntensity * 0.2);
        
        // Apply flash effect to current boundaries
        this.boundaryVisualization.currentBoundaries.material.color = flashColor;
        this.boundaryVisualization.currentBoundaries.material.opacity = 0.8 + redIntensity * 0.2;
    }

    /**
     * Start shrinking animation
     * @param {Object} startBounds - Starting boundary coordinates
     * @param {Object} targetBounds - Target boundary coordinates
     */
    startShrinkAnimation(startBounds, targetBounds) {
        const animation = this.boundaryVisualization.shrinkAnimation;
        animation.active = true;
        animation.progress = 0.0;
        animation.startTime = Date.now();
        animation.startBounds = { ...startBounds };
        animation.targetBounds = { ...targetBounds };
    }

    /**
     * Update shrinking animation
     * @param {number} currentTime - Current timestamp
     */
    updateShrinkAnimation(currentTime) {
        const animation = this.boundaryVisualization.shrinkAnimation;
        
        if (!animation.active) return;

        const elapsed = currentTime - animation.startTime;
        animation.progress = Math.min(elapsed / animation.duration, 1.0);

        if (animation.progress >= 1.0) {
            // Animation complete
            animation.active = false;
            return;
        }

        // Interpolate boundary positions for smooth animation
        const t = animation.progress;
        const currentBounds = {
            minX: animation.startBounds.minX + (animation.targetBounds.minX - animation.startBounds.minX) * t,
            maxX: animation.startBounds.maxX + (animation.targetBounds.maxX - animation.startBounds.maxX) * t,
            minZ: animation.startBounds.minZ + (animation.targetBounds.minZ - animation.startBounds.minZ) * t,
            maxZ: animation.startBounds.maxZ + (animation.targetBounds.maxZ - animation.startBounds.maxZ) * t
        };

        // Update boundary visualization with interpolated bounds
        this.createCurrentBoundaryVisualization(currentBounds);

        // Add red flash effect during shrinking
        if (this.boundaryVisualization.currentBoundaries) {
            const flashIntensity = Math.sin(animation.progress * Math.PI * 8) * 0.5 + 0.5;
            const flashColor = new THREE.Color(1, flashIntensity * 0.3, flashIntensity * 0.3);
            this.boundaryVisualization.currentBoundaries.material.color = flashColor;
        }
    }

    /**
     * Remove crashed AI entity and its trail from rendering
     * @param {string} aiId - ID of the crashed AI entity
     */
    removeCrashedAI(aiId) {
        // Remove AI entity mesh
        const aiMesh = this.aiEntities.get(aiId);
        if (aiMesh) {
            this.scene.remove(aiMesh);
            
            // Dispose of geometry and material to free memory
            if (aiMesh.geometry) {
                aiMesh.geometry.dispose();
            }
            if (aiMesh.material) {
                aiMesh.material.dispose();
            }
            
            this.aiEntities.delete(aiId);
        }
        
        // Remove AI trail segments
        const aiTrail = this.aiTrails.get(aiId);
        if (aiTrail) {
            for (const segment of aiTrail) {
                this.scene.remove(segment);
                
                // Dispose of emissive material through material system
                if (segment.userData && segment.userData.materialId) {
                    this.emissiveMaterialSystem.disposeMaterial(segment.userData.materialId);
                }
                
                // Dispose of geometry to free memory
                if (segment.geometry) {
                    segment.geometry.dispose();
                }
            }
            this.aiTrails.delete(aiId);
        }
        
        // Update backward compatibility references if this was the first AI
        if (this.ai === aiMesh) {
            // Find next alive AI or set to null
            const nextAI = Array.from(this.aiEntities.values())[0];
            this.ai = nextAI || null;
            
            const nextTrail = Array.from(this.aiTrails.values())[0];
            this.aiTrail = nextTrail || [];
        }
    }

    /**
     * Clean up all crashed AI entities based on game state
     * This method only hides crashed AIs, doesn't remove them completely
     * @param {Object} gameState - Current game state
     */
    cleanupCrashedAIs(gameState) {
        if (!gameState.aiOpponents) return;
        
        // Find AIs that are no longer in the game state and remove them completely
        const aiIdsInGame = new Set(gameState.aiOpponents.map(ai => ai.id));
        const aiIdsToRemove = [];
        
        this.aiEntities.forEach((mesh, aiId) => {
            if (!aiIdsInGame.has(aiId)) {
                aiIdsToRemove.push(aiId);
            }
        });
        
        // Remove AIs that are no longer in the game
        aiIdsToRemove.forEach(aiId => {
            this.removeCrashedAI(aiId);
        });
    }

    /**
     * Clear all AI entities and trails (for game reset)
     */
    clearAllAIs() {
        // Remove all AI entity meshes
        this.aiEntities.forEach((mesh, aiId) => {
            this.scene.remove(mesh);
            
            // Dispose of geometry and material to free memory
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh.material) {
                mesh.material.dispose();
            }
        });
        this.aiEntities.clear();
        
        // Remove all AI trail segments
        this.aiTrails.forEach((trail, aiId) => {
            for (const segment of trail) {
                this.scene.remove(segment);
                
                // Dispose of emissive material through material system
                if (segment.userData && segment.userData.materialId) {
                    this.emissiveMaterialSystem.disposeMaterial(segment.userData.materialId);
                }
                
                // Dispose of geometry to free memory
                if (segment.geometry) {
                    segment.geometry.dispose();
                }
            }
        });
        this.aiTrails.clear();
        
        // Clear backward compatibility references
        if (this.ai && this.ai.parent) {
            this.scene.remove(this.ai);
            if (this.ai.geometry) {
                this.ai.geometry.dispose();
            }
            if (this.ai.material) {
                this.ai.material.dispose();
            }
        }
        this.ai = null;
        this.aiTrail = [];
    }

    /**
     * Clear all player entities and trails (for game reset)
     */
    clearAllPlayers() {
        // Remove all player entity meshes
        this.playerEntities.forEach((mesh, playerId) => {
            this.scene.remove(mesh);
            
            // Dispose of geometry and material to free memory
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh.material) {
                mesh.material.dispose();
            }
        });
        this.playerEntities.clear();
        
        // Remove all player labels
        this.playerLabels.forEach((label, playerId) => {
            this.scene.remove(label);
            
            // Dispose of geometry and material to free memory
            if (label.geometry) {
                label.geometry.dispose();
            }
            if (label.material) {
                label.material.dispose();
            }
        });
        this.playerLabels.clear();
        
        // Remove all player trail segments
        this.playerTrails.forEach((trail, playerId) => {
            for (const segment of trail) {
                this.scene.remove(segment);
                
                // Dispose of emissive material through material system
                if (segment.userData && segment.userData.materialId) {
                    this.emissiveMaterialSystem.disposeMaterial(segment.userData.materialId);
                }
                
                // Dispose of geometry to free memory
                if (segment.geometry) {
                    segment.geometry.dispose();
                }
            }
        });
        this.playerTrails.clear();
        
        // Clear backward compatibility references
        if (this.player && this.player.parent) {
            this.scene.remove(this.player);
            if (this.player.geometry) {
                this.player.geometry.dispose();
            }
            if (this.player.material) {
                this.player.material.dispose();
            }
        }
        this.player = null;
        this.playerTrail = [];
    }

    /**
     * Clear all boundary visualizations
     */
    clearBoundaryVisualization() {
        // Clear current boundaries
        if (this.boundaryVisualization.currentBoundaries) {
            this.scene.remove(this.boundaryVisualization.currentBoundaries);
            if (this.boundaryVisualization.currentBoundaries.geometry) {
                this.boundaryVisualization.currentBoundaries.geometry.dispose();
            }
            if (this.boundaryVisualization.currentBoundaries.material) {
                this.boundaryVisualization.currentBoundaries.material.dispose();
            }
            this.boundaryVisualization.currentBoundaries = null;
        }

        // Clear future boundaries
        if (this.boundaryVisualization.futureBoundaries) {
            this.scene.remove(this.boundaryVisualization.futureBoundaries);
            if (this.boundaryVisualization.futureBoundaries.geometry) {
                this.boundaryVisualization.futureBoundaries.geometry.dispose();
            }
            if (this.boundaryVisualization.futureBoundaries.material) {
                this.boundaryVisualization.futureBoundaries.material.dispose();
            }
            this.boundaryVisualization.futureBoundaries = null;
        }

        // Reset animation states
        this.boundaryVisualization.warningFlash.active = false;
        this.boundaryVisualization.shrinkAnimation.active = false;
    }

    /**
     * Initialize particle system integration
     * @param {Object} particleSystemClass - ParticleSystem class constructor
     * @param {Object} settings - Particle system settings
     */
    initializeParticleSystem(particleSystemClass, settings = {}) {
        if (!particleSystemClass) {
            console.warn('ParticleSystem class not provided to RenderingEngine');
            return;
        }

        try {
            // Create particle system with this renderer's scene
            this.particleSystem = new particleSystemClass(this.scene, {
                maxParticles: settings.maxParticles || 200,
                enabled: settings.enabled !== false,
                quality: settings.quality || 'medium',
                effects: {
                    trailSparks: settings.effects?.trailSparks !== false,
                    explosions: settings.effects?.explosions !== false,
                    collections: settings.effects?.collections !== false
                }
            });

            this.particleSystemEnabled = true;
            console.log('ParticleSystem integrated with RenderingEngine');
        } catch (error) {
            console.error('Failed to initialize ParticleSystem:', error);
            this.particleSystem = null;
            this.particleSystemEnabled = false;
        }
    }

    /**
     * Update integrated particle system
     * @param {Object} gameState - Current game state
     */
    updateIntegratedParticleSystem(gameState) {
        if (!this.particleSystem || !this.particleSystemEnabled) {
            return;
        }

        try {
            // Calculate delta time (simplified for integration)
            const currentTime = Date.now();
            const deltaTime = this.lastParticleUpdate ? (currentTime - this.lastParticleUpdate) / 1000 : 0.016;
            this.lastParticleUpdate = currentTime;

            // Update particle system
            this.particleSystem.update(deltaTime, gameState);

            // Emit trail sparks for moving entities
            this.emitTrailSparksForEntities(gameState);

        } catch (error) {
            console.error('Error updating integrated particle system:', error);
            // Disable particle system on error to prevent further issues
            this.particleSystemEnabled = false;
        }
    }

    /**
     * Emit trail sparks for moving entities
     * @param {Object} gameState - Current game state
     */
    emitTrailSparksForEntities(gameState) {
        if (!this.particleSystem || !gameState) return;

        const baseGameSpeed = gameState.gameSpeed || 0.1;

        // Emit trail sparks for player if moving
        if (gameState.player && gameState.playerDirection) {
            // Get player speed multiplier from power-up system if available
            const playerSpeedMultiplier = gameState.powerUpManager ? 
                gameState.powerUpManager.getSpeedMultiplier('player') : 1.0;
            const actualPlayerSpeed = baseGameSpeed * playerSpeedMultiplier;
            
            const playerVelocity = {
                x: gameState.playerDirection.x * actualPlayerSpeed,
                y: 0,
                z: gameState.playerDirection.z * actualPlayerSpeed
            };
            
            // Only emit if actually moving
            if (Math.abs(playerVelocity.x) > 0.01 || Math.abs(playerVelocity.z) > 0.01) {
                // Use green color matching player trail (0x00ff00)
                this.particleSystem.emitTrailSparks(
                    gameState.player, 
                    playerVelocity, 
                    0x00ff00, 
                    actualPlayerSpeed
                );
            }
        }

        // Emit trail sparks for AI opponents
        if (gameState.aiOpponents) {
            gameState.aiOpponents.forEach(ai => {
                if (ai.alive && ai.direction) {
                    // Get AI speed multiplier from power-up system if available
                    const aiSpeedMultiplier = gameState.powerUpManager ? 
                        gameState.powerUpManager.getSpeedMultiplier('ai') : 1.0;
                    const actualAISpeed = baseGameSpeed * aiSpeedMultiplier;
                    
                    const aiVelocity = {
                        x: ai.direction.x * actualAISpeed,
                        y: 0,
                        z: ai.direction.z * actualAISpeed
                    };
                    
                    // Only emit if actually moving
                    if (Math.abs(aiVelocity.x) > 0.01 || Math.abs(aiVelocity.z) > 0.01) {
                        // Use color matching AI trail color
                        const aiColor = this.getColorHex(ai.color);
                        this.particleSystem.emitTrailSparks(
                            ai, 
                            aiVelocity, 
                            aiColor, 
                            actualAISpeed
                        );
                    }
                }
            });
        }

        // Handle backward compatibility with single AI
        if (gameState.ai && gameState.aiDirection && !gameState.aiOpponents) {
            const aiSpeedMultiplier = gameState.powerUpManager ? 
                gameState.powerUpManager.getSpeedMultiplier('ai') : 1.0;
            const actualAISpeed = baseGameSpeed * aiSpeedMultiplier;
            
            const aiVelocity = {
                x: gameState.aiDirection.x * actualAISpeed,
                y: 0,
                z: gameState.aiDirection.z * actualAISpeed
            };
            
            if (Math.abs(aiVelocity.x) > 0.01 || Math.abs(aiVelocity.z) > 0.01) {
                // Use red color for backward compatibility
                this.particleSystem.emitTrailSparks(
                    gameState.ai, 
                    aiVelocity, 
                    0xff0000, 
                    actualAISpeed
                );
            }
        }
    }

    /**
     * Trigger explosion particle effect
     * @param {Object} position - Explosion position {x, y, z}
     * @param {number} intensity - Explosion intensity (0-1)
     */
    createExplosionEffect(position, intensity = 1.0) {
        if (this.particleSystem && this.particleSystemEnabled) {
            this.particleSystem.createExplosion(position, intensity);
        }
    }

    /**
     * Trigger collection particle effect
     * @param {Object} position - Collection position {x, y, z}
     * @param {string} powerUpType - Type of power-up collected
     */
    createCollectionEffect(position, powerUpType) {
        if (this.particleSystem && this.particleSystemEnabled) {
            this.particleSystem.createCollectionEffect(position, powerUpType);
        }
    }

    /**
     * Get particle system instance
     * @returns {Object|null} Particle system instance or null if not initialized
     */
    getParticleSystem() {
        return this.particleSystem;
    }

    /**
     * Reinitialize particle system with new settings
     * @param {Object} settings - New particle system settings
     */
    reinitializeParticleSystem(settings = {}) {
        if (this.particleSystem) {
            // Dispose of existing particle system
            this.particleSystem.dispose();
            this.particleSystem = null;
        }

        // Get the ParticleSystem class from the existing system or require it
        const { ParticleSystem } = require('./ParticleSystem.js');
        
        // Reinitialize with new settings
        this.initializeParticleSystem(ParticleSystem, settings);
    }

    /**
     * Enable or disable particle system
     * @param {boolean} enabled - Whether to enable particle system
     */
    setParticleSystemEnabled(enabled) {
        this.particleSystemEnabled = enabled;
        if (this.particleSystem) {
            this.particleSystem.setEnabled(enabled);
        }
    }

    /**
     * Set particle system quality level
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    setParticleQuality(quality) {
        if (this.particleSystem) {
            this.particleSystem.setQualityLevel(quality);
        }
    }

    /**
     * Pause particle system
     */
    pauseParticleSystem() {
        if (this.particleSystem) {
            this.particleSystem.pause();
        }
    }

    /**
     * Resume particle system
     */
    resumeParticleSystem() {
        if (this.particleSystem) {
            this.particleSystem.resume();
        }
    }

    /**
     * Reset particle system (clear all particles)
     */
    resetParticleSystem() {
        if (this.particleSystem) {
            this.particleSystem.reset();
        }
    }

    /**
     * Pause emissive material pulse animation
     */
    pauseGlowEffects() {
        if (this.emissiveMaterialSystem) {
            this.emissiveMaterialSystem.pausePulse();
        }
    }

    /**
     * Resume emissive material pulse animation
     */
    resumeGlowEffects() {
        if (this.emissiveMaterialSystem) {
            this.emissiveMaterialSystem.resumePulse();
        }
    }

    /**
     * Set glow effect intensity
     * @param {number} multiplier - Intensity multiplier (0-1)
     */
    setGlowIntensity(multiplier) {
        if (this.emissiveMaterialSystem) {
            this.emissiveMaterialSystem.setGlobalIntensityMultiplier(multiplier);
        }
    }

    /**
     * Get emissive material system status
     * @returns {Object} Status information
     */
    getGlowEffectStatus() {
        return this.emissiveMaterialSystem ? this.emissiveMaterialSystem.getStatus() : null;
    }

    /**
     * Set arena theme
     * @param {string} themeName - Name of the theme to apply
     * @returns {boolean} Success status
     */
    setArenaTheme(themeName) {
        if (!this.themeEngine) {
            console.warn('ThemeEngine not initialized');
            return false;
        }
        
        return this.themeEngine.loadTheme(themeName);
    }

    /**
     * Get available arena themes
     * @returns {Array} Array of available theme names
     */
    getAvailableThemes() {
        if (!this.themeEngine) {
            return [];
        }
        
        return this.themeEngine.getAvailableThemes();
    }

    /**
     * Get current arena theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        if (!this.themeEngine) {
            return 'classic-grid';
        }
        
        return this.themeEngine.getCurrentTheme();
    }

    /**
     * Generate theme preview data
     * @param {string} themeName - Theme name
     * @returns {Object|null} Preview data or null if invalid
     */
    generateThemePreview(themeName) {
        if (!this.themeEngine) {
            return null;
        }
        
        return this.themeEngine.generateThemePreview(themeName);
    }

    /**
     * Get theme configuration
     * @param {string} themeName - Theme name
     * @returns {Object|null} Theme configuration or null if invalid
     */
    getThemeConfig(themeName) {
        if (!this.themeEngine) {
            return null;
        }
        
        return this.themeEngine.getThemeConfig(themeName);
    }

    /**
     * Reset to default theme
     */
    resetThemeToDefault() {
        if (this.themeEngine) {
            this.themeEngine.resetToDefault();
        }
    }

    /**
     * Get ThemeEngine instance for advanced theme operations
     * @returns {Object|null} ThemeEngine instance or null if not initialized
     */
    getThemeEngine() {
        return this.themeEngine;
    }

    /**
     * Check if WebGL is available in the browser
     * @returns {boolean} True if WebGL is supported
     */
    isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return false;
            }
            
            // Additional check for WebGL context
            return !!(window.WebGLRenderingContext && gl);
        } catch (e) {
            console.error('WebGL availability check failed:', e);
            return false;
        }
    }

    /**
     * Display error message when WebGL is not supported
     */
    showWebGLError() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'webgl-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        
        errorDiv.innerHTML = `
            <h2 style="margin: 0 0 15px 0; font-size: 2em;">WebGL Not Supported</h2>
            <p style="margin: 0 0 15px 0; font-size: 1.1em;">
                Your browser does not support WebGL, which is required for this game.
            </p>
            <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">
                Please try using a modern browser like:
            </p>
            <ul style="list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 0.9em;">
                <li>• Chrome 90+</li>
                <li>• Firefox 88+</li>
                <li>• Safari 14+</li>
                <li>• Edge 90+</li>
            </ul>
            <p style="margin: 0; font-size: 0.8em; color: #ffcccc;">
                If you're using a supported browser, WebGL may be disabled in your settings.
            </p>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Log to console for debugging
        console.error('WebGL is not available. The game cannot run without WebGL support.');
    }
}

module.exports = { RenderingEngine };
