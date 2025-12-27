const { Logger } = require('../utils/Logger.js');
const { LoadingIndicator } = require('../ui/LoadingIndicator.js');
const { InitializationState } = require('../utils/InitializationState.js');
const { DOMNotReadyError, CanvasCreationError } = require('../utils/InitializationErrors.js');
const { BrowserCompatibility } = require('../utils/BrowserCompatibility.js');
const { CompatibilityWarningUI } = require('../ui/CompatibilityWarningUI.js');
const { CanvasVerifier } = require('../utils/CanvasVerifier.js');

/**
 * GameInitializer orchestrates the game initialization sequence
 * Manages phase-based initialization with progress tracking and error recovery
 */
class GameInitializer {
    /**
     * Create a GameInitializer
     * @param {RecoveryManager} recoveryManager - Error recovery manager
     */
    constructor(recoveryManager) {
        this.recoveryManager = recoveryManager;
        this.logger = Logger.create('GameInitializer');
        this.loadingIndicator = null;
        this.initializationState = null;
        this.phases = [];
    }

    /**
     * Initialize the game with proper sequence and error handling
     * @returns {Promise<Object>} Initialization result with success status and components
     */
    async initialize() {
        try {
            // Create initialization state tracker
            this.initializationState = new InitializationState();
            this.initializationState.start();
            this.initializationState.completeStep('domReady');

            // Create LoadingIndicator at start
            this.loadingIndicator = new LoadingIndicator();
            this.loadingIndicator.show('Initializing game...');

            // Initialize error handling system first
            this.loadingIndicator.updateProgress('init', 'Initializing error handling...');
            this.recoveryManager.init();
            this.initializationState.completeStep('errorHandlingInit');

            // Execute all initialization phases
            const components = {};

            // Phase 1: Browser compatibility check
            await this.executePhase(
                'compatibility',
                'Checking browser compatibility...',
                async () => {
                    const compatibilityCheck = this.performBrowserCompatibilityCheck();
                    if (!compatibilityCheck.isCompatible) {
                        throw new Error('Browser compatibility check failed');
                    }
                    return compatibilityCheck;
                }
            );

            // Phase 2: WebGL support check
            await this.executePhase('webgl', 'Checking WebGL support...', async () => {
                if (!this.checkWebGLSupport()) {
                    const webglError = new CanvasCreationError('WebGL not supported');
                    const compatibilityMessage =
                        this.recoveryManager.getWebGLCompatibilityMessage();
                    webglError.actionableSteps = compatibilityMessage.actionableSteps;
                    this.recoveryManager.handleWebGLError(webglError);
                    this.loadingIndicator.showError(webglError);
                    throw webglError;
                }
            });

            // Phase 3: Core game components
            await this.executePhase('game', 'Creating game instance...', async () => {
                components.game = await this.recoveryManager.initializeWithRecovery('Game');
                components.aiCoordinator =
                    await this.recoveryManager.initializeWithRecovery('AICoordinator');
                components.collisionDetectionEngine =
                    await this.recoveryManager.initializeWithRecovery('CollisionDetectionEngine');
                components.playerCollisionHandler =
                    await this.recoveryManager.initializeWithRecovery('PlayerCollisionHandler');
                components.playerController =
                    await this.recoveryManager.initializeWithRecovery('PlayerController');
            });

            // Phase 4: Rendering engine
            await this.executePhase('renderer', 'Initializing 3D renderer...', async () => {
                components.renderingEngine =
                    await this.recoveryManager.initializeWithRecovery('RenderingEngine');

                // Verify renderer was created successfully
                if (
                    !components.renderingEngine ||
                    !components.renderingEngine.renderer ||
                    !components.renderingEngine.scene ||
                    !components.renderingEngine.camera
                ) {
                    const rendererError = new CanvasCreationError(
                        'Failed to initialize rendering engine'
                    );
                    throw rendererError;
                }
            });

            // Phase 5: Canvas verification
            await this.executePhase('canvas', 'Verifying canvas...', async () => {
                const canvasVerifier = new CanvasVerifier();
                const verificationResult = canvasVerifier.verifyAll(
                    components.renderingEngine.renderer,
                    components.renderingEngine.scene,
                    components.renderingEngine.camera
                );

                // Log verification results for debugging
                this.logger.info('Canvas verification results:', {
                    success: verificationResult.success,
                    checks: {
                        created: verificationResult.checks.created.success,
                        visible: verificationResult.checks.visible.success,
                        size: verificationResult.checks.size.success,
                        render: verificationResult.checks.render.success,
                    },
                    errors: verificationResult.errors,
                });

                // Throw descriptive error if verification fails
                if (!verificationResult.success) {
                    const errorMessage =
                        'Canvas verification failed:\n' +
                        verificationResult.errors.map((err) => `  - ${err}`).join('\n');
                    const canvasError = new CanvasCreationError(errorMessage, verificationResult);
                    throw canvasError;
                }
            });

            // Return components for further initialization
            return {
                success: true,
                components,
                loadingIndicator: this.loadingIndicator,
                initializationState: this.initializationState,
            };
        } catch (error) {
            this.logger.error('Game initialization failed:', error);

            // Record error in state if available
            if (this.initializationState) {
                this.initializationState.recordError(
                    this.initializationState.currentStep || 'unknown',
                    error
                );
                this.logger.info(
                    'Initialization state at failure:',
                    this.initializationState.getState()
                );

                // Get recovery recommendation
                const recommendation = this.initializationState.getRecoveryRecommendation();
                this.logger.info('Recovery recommendation:', recommendation);
            }

            // Transform loading indicator to error display
            if (this.loadingIndicator) {
                this.loadingIndicator.showError(error, () => {
                    window.location.reload();
                });
            } else if (this.recoveryManager) {
                this.recoveryManager.handleInitializationError(
                    error,
                    () => {
                        window.location.reload();
                    },
                    'Game'
                );
            }

            return {
                success: false,
                error,
            };
        }
    }

    /**
     * Execute a single initialization phase
     * @param {string} phaseId - Phase identifier
     * @param {string} message - Progress message
     * @param {Function} initFn - Initialization function
     * @returns {Promise<any>} Phase result
     */
    async executePhase(phaseId, message, initFn) {
        this.loadingIndicator.updateProgress(phaseId, message);
        const result = await initFn();
        this.initializationState.completeStep(phaseId);
        return result;
    }

    /**
     * Get current initialization state
     * @returns {Object} Current state
     */
    getInitializationState() {
        return this.initializationState ? this.initializationState.getState() : null;
    }

    /**
     * Check WebGL availability
     * @returns {boolean} True if WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl || !window.WebGLRenderingContext) {
                return false;
            }

            return true;
        } catch (e) {
            this.logger.warn('WebGL context creation failed:', e);
            return false;
        }
    }

    /**
     * Perform comprehensive browser compatibility check
     * @returns {Object} Compatibility check result
     */
    performBrowserCompatibilityCheck() {
        // Check if user already acknowledged warnings this session
        const acknowledged = sessionStorage.getItem('lightbikes_compatibility_acknowledged');

        // Create compatibility checker
        const compatibility = new BrowserCompatibility();
        const report = compatibility.checkCompatibility();

        this.logger.info('Browser Compatibility Check:', report);

        // If there are critical errors, show error and block game
        if (!report.isCompatible) {
            const warningUI = new CompatibilityWarningUI();

            if (report.errors.length > 0) {
                // Critical errors - cannot continue
                warningUI.showWarning(report);
                return { isCompatible: false, report };
            }
        }

        // If there are warnings but no errors, show warning but allow continuation
        if (report.warnings.length > 0 && !acknowledged) {
            const warningUI = new CompatibilityWarningUI();
            warningUI.showWarning(report);
            // Don't block initialization - user can dismiss and continue
        }

        return { isCompatible: true, report };
    }
}

module.exports = { GameInitializer };
