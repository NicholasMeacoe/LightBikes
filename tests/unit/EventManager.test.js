const { EventManager } = require('../../src/events/EventManager.js');

describe('EventManager', () => {
    let eventManager;
    let mockDependencies;
    let mockGame;
    let mockPlayerController;
    let mockAudioManager;
    let mockRenderingEngine;
    let mockGlowEffectManager;
    let mockCameraEffectsManager;
    let mockDifficultyManager;
    let mockPerformanceDegradationManager;
    let mockRestartGame;
    let mockUpdatePauseOverlay;
    let mockUpdateMuteButton;
    let mockUpdatePerformanceButton;
    let mockSetAICount;
    let mockUpdateAICountUI;
    let mockUpdateDifficultyUI;

    beforeEach(() => {
        // Create mock game
        mockGame = {
            changePlayerDirection: jest.fn().mockReturnValue(true),
            resume: jest.fn().mockReturnValue(true),
            getGameState: jest.fn().mockReturnValue({ isPaused: false }),
        };

        // Create mock player controller
        mockPlayerController = {
            init: jest.fn(),
        };

        // Create mock audio manager
        mockAudioManager = {
            playTurnSound: jest.fn(),
            getMuted: jest.fn().mockReturnValue(false),
            setMuted: jest.fn(),
            initialize: jest.fn().mockResolvedValue(true),
            isMusicAvailable: jest.fn().mockReturnValue(true),
            cleanup: jest.fn(),
        };

        // Create mock rendering engine
        mockRenderingEngine = {
            renderer: {
                setSize: jest.fn(),
            },
            camera: {
                aspect: 1,
                updateProjectionMatrix: jest.fn(),
            },
        };

        // Create mock glow effect manager
        mockGlowEffectManager = {
            initialized: true,
            forceResume: jest.fn(),
            handleResize: jest.fn(),
        };

        // Create mock camera effects manager
        mockCameraEffectsManager = {
            isEnabled: jest.fn().mockReturnValue(true),
            resume: jest.fn(),
        };

        // Create mock difficulty manager
        mockDifficultyManager = {
            setDifficulty: jest.fn(),
            getCurrentDifficulty: jest.fn().mockReturnValue('medium'),
        };

        // Create mock performance degradation manager
        mockPerformanceDegradationManager = {
            getSettings: jest.fn().mockReturnValue({ performanceModeEnabled: false }),
            setPerformanceMode: jest.fn(),
        };

        // Create mock functions
        mockRestartGame = jest.fn();
        mockUpdatePauseOverlay = jest.fn();
        mockUpdateMuteButton = jest.fn();
        mockUpdatePerformanceButton = jest.fn();
        mockSetAICount = jest.fn();
        mockUpdateAICountUI = jest.fn();
        mockUpdateDifficultyUI = jest.fn();

        // Create dependencies object
        mockDependencies = {
            game: mockGame,
            playerController: mockPlayerController,
            audioManager: mockAudioManager,
            renderingEngine: mockRenderingEngine,
            glowEffectManager: mockGlowEffectManager,
            cameraEffectsManager: mockCameraEffectsManager,
            difficultyManager: mockDifficultyManager,
            performanceDegradationManager: mockPerformanceDegradationManager,
            restartGame: mockRestartGame,
            updatePauseOverlay: mockUpdatePauseOverlay,
            updateMuteButton: mockUpdateMuteButton,
            updatePerformanceButton: mockUpdatePerformanceButton,
            setAICount: mockSetAICount,
            updateAICountUI: mockUpdateAICountUI,
            updateDifficultyUI: mockUpdateDifficultyUI,
        };

        // Create DOM elements
        document.body.innerHTML = `
            <button id="restart"></button>
            <button id="resumeButton"></button>
            <button id="muteButton"></button>
            <button id="performanceButton"></button>
            <button id="up"></button>
            <button id="down"></button>
            <button id="left"></button>
            <button id="right"></button>
            <button class="ai-count-btn" data-count="1"></button>
            <button class="ai-count-btn" data-count="2"></button>
            <button class="difficulty-btn" data-level="easy"></button>
            <button class="difficulty-btn" data-level="hard"></button>
        `;

        eventManager = new EventManager(mockDependencies);
    });

    afterEach(() => {
        if (eventManager) {
            eventManager.unregisterAll();
        }
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should initialize with dependencies', () => {
            expect(eventManager.game).toBe(mockGame);
            expect(eventManager.playerController).toBe(mockPlayerController);
            expect(eventManager.audioManager).toBe(mockAudioManager);
            expect(eventManager.listeners).toEqual([]);
            expect(eventManager.audioInitialized).toBe(false);
        });
    });

    describe('registerAll', () => {
        it('should register all event listeners', () => {
            eventManager.registerAll();

            expect(mockPlayerController.init).toHaveBeenCalled();
            expect(eventManager.listeners.length).toBeGreaterThan(0);
        });
    });

    describe('registerGameControls', () => {
        it('should initialize player controller', () => {
            eventManager.registerGameControls();

            expect(mockPlayerController.init).toHaveBeenCalled();
        });

        it('should register touch controls', () => {
            eventManager.registerGameControls();

            const upButton = document.getElementById('up');
            upButton.dispatchEvent(new Event('touchstart'));

            expect(mockGame.changePlayerDirection).toHaveBeenCalledWith('ArrowUp');
            expect(mockAudioManager.playTurnSound).toHaveBeenCalled();
        });
    });

    describe('registerUIControls', () => {
        it('should register restart button', () => {
            eventManager.registerUIControls();

            const restartButton = document.getElementById('restart');
            restartButton.click();

            expect(mockRestartGame).toHaveBeenCalled();
        });

        it('should register resume button', () => {
            eventManager.registerUIControls();

            const resumeButton = document.getElementById('resumeButton');
            resumeButton.click();

            expect(mockGame.resume).toHaveBeenCalled();
            expect(mockUpdatePauseOverlay).toHaveBeenCalled();
            expect(mockGlowEffectManager.forceResume).toHaveBeenCalled();
            expect(mockCameraEffectsManager.resume).toHaveBeenCalled();
        });

        it('should register mute button', () => {
            eventManager.registerUIControls();

            const muteButton = document.getElementById('muteButton');
            muteButton.click();

            expect(mockAudioManager.setMuted).toHaveBeenCalledWith(true);
            expect(mockUpdateMuteButton).toHaveBeenCalled();
        });

        it('should register performance button', () => {
            eventManager.registerUIControls();

            const performanceButton = document.getElementById('performanceButton');
            performanceButton.click();

            expect(mockPerformanceDegradationManager.setPerformanceMode).toHaveBeenCalledWith(true);
            expect(mockUpdatePerformanceButton).toHaveBeenCalled();
        });

        it('should register AI count buttons', () => {
            eventManager.registerUIControls();

            const aiCountButton = document.querySelector('.ai-count-btn[data-count="2"]');
            aiCountButton.click();

            expect(mockSetAICount).toHaveBeenCalledWith(2);
            expect(mockUpdateAICountUI).toHaveBeenCalled();
        });

        it('should register difficulty buttons', () => {
            eventManager.registerUIControls();

            const difficultyButton = document.querySelector('.difficulty-btn[data-level="hard"]');
            difficultyButton.click();

            expect(mockDifficultyManager.setDifficulty).toHaveBeenCalledWith('hard');
            expect(mockUpdateDifficultyUI).toHaveBeenCalled();
        });
    });

    describe('registerWindowEvents', () => {
        it('should register resize handler', () => {
            eventManager.registerWindowEvents();

            window.dispatchEvent(new Event('resize'));

            expect(mockRenderingEngine.renderer.setSize).toHaveBeenCalled();
            expect(mockRenderingEngine.camera.updateProjectionMatrix).toHaveBeenCalled();
            expect(mockGlowEffectManager.handleResize).toHaveBeenCalled();
        });

        it('should register beforeunload handler', () => {
            eventManager.registerWindowEvents();

            window.dispatchEvent(new Event('beforeunload'));

            expect(mockAudioManager.cleanup).toHaveBeenCalled();
        });
    });

    describe('unregisterAll', () => {
        it('should remove all registered listeners', () => {
            eventManager.registerAll();

            const initialListenerCount = eventManager.listeners.length;
            expect(initialListenerCount).toBeGreaterThan(0);

            eventManager.unregisterAll();

            expect(eventManager.listeners).toEqual([]);
        });

        it('should prevent events from firing after unregister', () => {
            eventManager.registerAll();
            eventManager.unregisterAll();

            const restartButton = document.getElementById('restart');
            restartButton.click();

            // Should not be called because listeners were removed
            expect(mockRestartGame).not.toHaveBeenCalled();
        });
    });

    describe('registerAudioInitialization', () => {
        it('should initialize audio on first click', async () => {
            eventManager.registerAudioInitialization();

            document.dispatchEvent(new Event('click'));

            // Wait for async initialization
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAudioManager.initialize).toHaveBeenCalled();
        });

        it('should only initialize audio once', async () => {
            eventManager.registerAudioInitialization();

            document.dispatchEvent(new Event('click'));
            await new Promise((resolve) => setTimeout(resolve, 0));

            document.dispatchEvent(new Event('keydown'));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAudioManager.initialize).toHaveBeenCalledTimes(1);
        });
    });

    describe('edge cases', () => {
        it('should handle missing DOM elements gracefully', () => {
            document.body.innerHTML = '';

            expect(() => {
                eventManager.registerAll();
            }).not.toThrow();
        });

        it('should handle resume failure', () => {
            mockGame.resume.mockReturnValue(false);
            eventManager.registerUIControls();

            const resumeButton = document.getElementById('resumeButton');
            resumeButton.click();

            expect(mockGame.resume).toHaveBeenCalled();
            expect(mockUpdatePauseOverlay).not.toHaveBeenCalled();
        });

        it('should handle audio cleanup errors', () => {
            mockAudioManager.cleanup.mockImplementation(() => {
                throw new Error('Cleanup error');
            });

            eventManager.registerWindowEvents();

            expect(() => {
                window.dispatchEvent(new Event('beforeunload'));
            }).not.toThrow();
        });
    });
});
