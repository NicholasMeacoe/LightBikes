/**
 * Performance Stress Integration Test
 * Verifies the interaction between GameLoop, PerformanceMonitor, and PerformanceDegradationManager
 * under simulated stress conditions.
 */

const { GameLoop } = require('../../src/game-loop/GameLoop.js');
const { PerformanceMonitor } = require('../../src/utils/PerformanceMonitor.js');
const {
    PerformanceDegradationManager,
} = require('../../src/utils/PerformanceDegradationManager.js');

// Mock Logger
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};
jest.mock('../../src/utils/Logger.js', () => ({
    createLogger: jest.fn(() => mockLogger),
    logger: mockLogger,
}));

// Mock DeviceCapabilityDetector with factory
jest.mock('../../src/utils/DeviceCapabilityDetector.js', () => ({
    DeviceCapabilityDetector: jest.fn().mockImplementation(() => ({
        detect: jest.fn().mockReturnValue({
            webglSupported: true,
            postProcessingSupported: true,
            isLowEndDevice: false,
            gpuTier: 'high',
        }),
        capabilities: {
            webglSupported: true,
            postProcessingSupported: true,
            isLowEndDevice: false,
        },
        getSummary: jest.fn().mockReturnValue({}),
    })),
}));

describe('Performance Stress Integration', () => {
    let gameLoop;
    let performanceMonitor;
    let degradationManager;
    let mockDeps;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Setup requestAnimationFrame mocks
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(cb, 16));
        jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id));

        // Real PerformanceMonitor
        performanceMonitor = new PerformanceMonitor();

        // Mock DeviceCapabilityDetector explicit instance
        const mockDetector = {
            detect: jest.fn().mockReturnValue({
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: false,
                gpuTier: 'high',
            }),
            capabilities: {
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: false,
            },
            getSummary: jest.fn().mockReturnValue({}),
        };

        // Real PerformanceDegradationManager injected with mock detector
        degradationManager = new PerformanceDegradationManager(mockDetector, performanceMonitor);

        // Mock game components
        mockDeps = {
            game: { getGameState: jest.fn().mockReturnValue({}), update: jest.fn() },
            renderingEngine: { draw: jest.fn() },
            glowEffectManager: { update: jest.fn(), render: jest.fn() },
            cameraEffectsManager: {
                setEnabled: jest.fn(),
                update: jest.fn(),
                isEnabled: jest.fn().mockReturnValue(true),
                pause: jest.fn(),
                resume: jest.fn(),
            },
            motionBlurController: { setEnabled: jest.fn(), setQuality: jest.fn() },
            cameraShakeController: { setEnabled: jest.fn() },
            recoveryManager: {
                handleFeatureRuntimeError: jest.fn(),
                isFeatureDisabled: jest.fn().mockReturnValue(false),
            },
            powerUpManager: {
                update: jest.fn(),
                checkCollections: jest.fn(),
                getAllActiveEffects: jest.fn().mockReturnValue([]),
            },
            statusIndicator: { updateStatus: jest.fn(), updateTimers: jest.fn() },
            audioManager: { handleGamePause: jest.fn() },
            scoreDisplay: { updateGameplayScores: jest.fn() },
            survivalTimer: { getElapsedTime: jest.fn() },
            leaderboardSystem: { isNewRecord: jest.fn() },
            achievementSystem: { checkMilestone: jest.fn() },
            localScoringUI: { updateScores: jest.fn() },
            splitScreenCamera: { update: jest.fn() },
            collisionDetectionEngine: { checkCollisions: jest.fn().mockReturnValue({}) },
            playerCollisionHandler: { checkMultiplayerCollisions: jest.fn().mockReturnValue({}) },
            uiManager: {},
            modeUI: {},
            aiCoordinator: {},
            difficultyManager: { getDifficultyConfig: jest.fn().mockReturnValue({}) },
            calculateMultiAIDirections: jest.fn().mockReturnValue([]),
            applyAIDecisions: jest.fn(),
            handleMultiAICollisions: jest.fn(),
            updatePauseOverlay: jest.fn(),
            updateTimeTrialDisplay: jest.fn(),
            updateArenaShrinkDisplay: jest.fn(),
            updateRemainingEntityDisplay: jest.fn(),
            showMultiplayerGameOver: jest.fn(),
            showTimeTrialGameOver: jest.fn(),
            showArenaShrinkGameOver: jest.fn(),
            showMultiAIGameOver: jest.fn(),
        };

        // Initialize Degradation Manager
        degradationManager.initialize(
            mockDeps.cameraEffectsManager,
            mockDeps.motionBlurController,
            mockDeps.cameraShakeController
        );

        // Setup GameLoop with real performance components
        gameLoop = new GameLoop({
            ...mockDeps,
            performanceMonitor,
            performanceDegradationManager: degradationManager,
        });
    });

    afterEach(() => {
        gameLoop.stop();
        jest.useRealTimers();
    });

    it('should degrade quality when frame time is high (simulating lag)', () => {
        // Fast forward initial time to bypass cooldowns (starts at 0)
        jest.advanceTimersByTime(5000);
        degradationManager.lastQualityAdjustment = 0; // Ensure logic sees it as old enough relative to Date.now()
        // Wait, if Date.now() is 5000, lastQualityAdjustment 0. Diff 5000 > 3000. OK.

        let now = 5000;
        jest.spyOn(performance, 'now').mockImplementation(() => now);

        // Simulate CPU load inside game update: increase time by 40ms
        mockDeps.game.update.mockImplementation(() => {
            now += 40;
        });

        gameLoop.start();

        // Verify initial state
        expect(degradationManager.degradationState.currentLevel).toBe(0);

        // Run for enough frames to trigger degradation (>30 poor frames)
        // AND > 60 total frames (PerformanceDegradationManager safety check)
        for (let i = 0; i < 70; i++) {
            jest.advanceTimersByTime(16);
            if (i % 10 === 0) {
                const m = performanceMonitor.getPerformanceMetrics();
                // console.log(`Frame ${i}: FPS=${m.currentFPS} Poor=${m.consecutivePoorFrames}`);
            }
        }

        expect(degradationManager.degradationState.currentLevel).toBeGreaterThan(0);
    });

    it('should recover when frame time improves', () => {
        // Fast forward
        jest.advanceTimersByTime(5000);

        let now = 5000;
        jest.spyOn(performance, 'now').mockImplementation(() => now);

        // Simulate light load
        mockDeps.game.update.mockImplementation(() => {
            now += 5;
        });

        // Force degrade first
        degradationManager.setDegradationLevel(1);
        degradationManager.lastQualityAdjustment = 0;

        expect(degradationManager.degradationState.currentLevel).toBe(1);

        gameLoop.start();

        // Run for enough frames to trigger recovery
        for (let i = 0; i < 150; i++) {
            jest.advanceTimersByTime(16);
        }

        expect(degradationManager.degradationState.currentLevel).toBe(0);
    });
});
