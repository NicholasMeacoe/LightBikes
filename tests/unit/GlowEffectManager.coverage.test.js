const { logger } = require('../../src/utils/Logger.js');

describe('GlowEffectManager Coverage', () => {
    let GlowEffectManager;
    let glowManager;
    let mockRenderer;
    let mockScene;
    let mockCamera;

    // Define mock variables at test scope
    let mockPostProcessing;
    let mockMaterialSystem;
    let mockPerformanceScaler;
    let mockSettings;
    let mockThree;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Setup mock instances
        mockPostProcessing = {
            initialize: jest.fn().mockReturnValue(true),
            configureBloomParameters: jest.fn(),
            render: jest.fn(),
            resize: jest.fn(),
            setQuality: jest.fn(),
            setBloomStrength: jest.fn(),
            setEnabled: jest.fn(),
            dispose: jest.fn(),
            getStatus: jest.fn().mockReturnValue({}),
        };

        mockMaterialSystem = {
            createBikeMaterial: jest.fn(),
            createTrailMaterial: jest.fn(),
            updatePulseAnimation: jest.fn(),
            setGlobalIntensityMultiplier: jest.fn(),
            pausePulse: jest.fn(),
            resumePulse: jest.fn(),
            dispose: jest.fn(),
            materials: new Map(),
            pulseState: {},
        };

        mockPerformanceScaler = {
            monitorPerformance: jest.fn(),
            currentQuality: 'high',
            setQuality: jest.fn(),
            scaleQualityDown: jest.fn(),
            scalingEnabled: true,
        };

        mockSettings = {
            getIntensity: jest.fn().mockReturnValue('MEDIUM'),
            setIntensity: jest.fn(),
        };

        mockThree = {
            MeshLambertMaterial: jest.fn().mockImplementation((params) => ({
                color: params.color,
                emissive: params.emissive,
                isMaterial: true,
            })),
            MeshBasicMaterial: jest.fn().mockImplementation((params) => ({
                color: params.color,
                transparent: params.transparent,
                opacity: params.opacity,
                emissive: params.emissive,
                isMaterial: true,
            })),
            Color: jest.fn().mockImplementation((hex) => ({
                setHex: jest.fn(),
                multiplyScalar: jest.fn().mockReturnThis(),
                getHex: jest.fn().mockReturnValue(hex),
            })),
            Vector2: jest.fn(),
            Vector3: jest.fn(),
        };

        // Use doMock to avoid hoisting issues and reference local variables
        jest.doMock('../../src/utils/Logger.js', () => ({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        }));

        jest.doMock('../../src/rendering/PostProcessingPipeline.js', () => ({
            PostProcessingPipeline: jest.fn().mockImplementation(() => mockPostProcessing),
        }));

        jest.doMock('../../src/rendering/EmissiveMaterialSystem.js', () => ({
            EmissiveMaterialSystem: jest.fn().mockImplementation(() => mockMaterialSystem),
        }));

        jest.doMock('../../src/utils/PerformanceScaler.js', () => ({
            PerformanceScaler: jest.fn().mockImplementation(() => mockPerformanceScaler),
        }));

        jest.doMock('../../src/systems/GlowSettings.js', () => ({
            GlowSettings: jest.fn().mockImplementation(() => mockSettings),
        }));

        jest.doMock('three', () => mockThree);
        global.THREE = mockThree;

        // Require Class under test
        GlowEffectManager = require('../../src/rendering/GlowEffectManager.js').GlowEffectManager;

        mockRenderer = {
            render: jest.fn(),
            getSize: jest.fn().mockReturnValue({ width: 800, height: 600 }),
        };
        mockScene = {};
        mockCamera = {};

        // Window setup
        window.glowSettingsUI = { handleResize: jest.fn() };
        window.renderingEngine = { getParticleSystem: jest.fn() };

        const mockContext = {
            getParameter: jest.fn((param) => {
                if (param === 0x1f00) return 'WebGL 1.0'; // VERSION
                if (param === 0x1f01) return 'Test Renderer'; // RENDERER
                if (param === 0x1f02) return 'Test Vendor'; // VENDOR
                return 4096; // Default size for MAX_TEXTURE_SIZE etc
            }),
            getSupportedExtensions: jest
                .fn()
                .mockReturnValue(['OES_texture_float', 'OES_texture_half_float']),
            getExtension: jest.fn().mockReturnValue({}),
            VERSION: 0x1f00,
            VENDOR: 0x1f02,
            RENDERER: 0x1f01,
            MAX_TEXTURE_SIZE: 1024,
            MAX_RENDERBUFFER_SIZE: 1024,
        };

        jest.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'canvas') {
                return {
                    getContext: jest.fn().mockReturnValue(mockContext),
                };
            }
            return {
                style: {},
                appendChild: jest.fn(),
                id: '',
                innerHTML: '',
            };
        });

        glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
    });

    afterEach(() => {
        delete global.THREE;
        jest.restoreAllMocks();
    });

    describe('Happy Path (Standard Usage)', () => {
        it('should initialize successfully', () => {
            const result = glowManager.initialize();
            expect(result).toBe(true);
            expect(glowManager.initialized).toBe(true);
            expect(glowManager.fallbackMode).toBe(false);
        });

        it('should update subsystems', () => {
            glowManager.initialize();
            glowManager.update(0.016, { isPaused: false });
            expect(mockMaterialSystem.updatePulseAnimation).toHaveBeenCalledWith(0.016);
            expect(mockPerformanceScaler.monitorPerformance).toHaveBeenCalledWith(0.016);
        });

        it('should render via post-processing', () => {
            glowManager.initialize();
            glowManager.render();
            expect(mockPostProcessing.render).toHaveBeenCalled();
        });

        it('should set intensity', () => {
            glowManager.initialize();
            glowManager.setIntensity('HIGH');
            expect(mockPostProcessing.setBloomStrength).toHaveBeenCalled();
            expect(mockPostProcessing.configureBloomParameters).toHaveBeenCalled();
        });
    });

    describe('Initialization & WebGL Compatibility', () => {
        it('should handle missing WebGL context', () => {
            jest.spyOn(document, 'createElement').mockReturnValue({
                getContext: jest.fn().mockReturnValue(null),
            });

            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            const result = glowManager.initialize();

            expect(result).toBe(true);
            expect(glowManager.fallbackMode).toBe(true);
            expect(glowManager.enabled).toBe(false);
        });

        it('should handle missing extensions', () => {
            const mockContext = {
                getParameter: jest.fn((p) => {
                    if (p === 3) return 'Test Renderer';
                    return 4096;
                }),
                getSupportedExtensions: jest.fn().mockReturnValue([]),
                getExtension: jest.fn().mockReturnValue(null),
                VERSION: 1,
                VENDOR: 2,
                RENDERER: 3,
                MAX_TEXTURE_SIZE: 4,
                MAX_RENDERBUFFER_SIZE: 5,
            };

            jest.spyOn(document, 'createElement').mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockContext),
            });

            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();

            expect(glowManager.initialized).toBe(true);
            expect(glowManager.fallbackMode).toBe(false);
        });

        it('should detect mobile GPU and force medium quality', () => {
            const mockContext = {
                getParameter: jest.fn((p) => {
                    return 'Adreno 530';
                }),
                getSupportedExtensions: jest
                    .fn()
                    .mockReturnValue(['OES_texture_float', 'OES_texture_half_float']),
                getExtension: jest.fn().mockReturnValue({}),
            };
            jest.spyOn(document, 'createElement').mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockContext),
            });

            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();

            expect(glowManager.forceQualityMode).toBe('medium');
        });

        it('should handle small max texture size', () => {
            const mockContext = {
                getParameter: jest.fn((param) => {
                    if (typeof param === 'string' || param === 0x1f01) return 'Test Renderer';
                    return 512;
                }),
                getSupportedExtensions: jest
                    .fn()
                    .mockReturnValue(['OES_texture_float', 'OES_texture_half_float']),
                getExtension: jest.fn().mockReturnValue({}),
            };
            jest.spyOn(document, 'createElement').mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockContext),
            });

            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();

            expect(glowManager.forceQualityMode).toBe('low');
        });
    });

    describe('Fallback Rendering & Materials', () => {
        beforeEach(() => {
            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initializeFallbackRendering();
            glowManager.fallbackMode = true;
            glowManager.enabled = false;
        });

        it('should create fallback bike material', () => {
            const mat = glowManager.createBikeMaterial('test', 0xff0000);
            expect(mat.emissive).toBeDefined();
            expect(mockThree.MeshLambertMaterial).toHaveBeenCalled();
        });

        it('should create fallback trail material', () => {
            const mat = glowManager.createTrailMaterial('test', 0x00ff00);
            expect(mat.emissive).toBeDefined();
            expect(mockThree.MeshBasicMaterial).toHaveBeenCalled();
            expect(mat.transparent).toBe(true);
        });

        it('should fallback render method', () => {
            glowManager.render();
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Error Recovery & Handling', () => {
        beforeEach(() => {
            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();
        });

        it('should attempt full recovery chain on render failure', () => {
            // Mock PostProcessing render to throw
            mockPostProcessing.render.mockImplementation(() => {
                throw new Error('PostProcessing Fail');
            });

            // First attempt: Quality reduction
            mockPerformanceScaler.scaleQualityDown.mockImplementation(() => {
                mockPerformanceScaler.currentQuality = 'medium';
            });

            glowManager.render();
            expect(mockPerformanceScaler.scaleQualityDown).toHaveBeenCalled();

            // Second attempt: Fail again, should disable PP
            mockPostProcessing.render.mockClear();
            mockPostProcessing.render.mockImplementation(() => {
                throw new Error('PostProcessing Fail 2');
            });
            mockPerformanceScaler.currentQuality = 'disabled';
            mockPostProcessing.setEnabled.mockClear();

            glowManager.render();
            expect(mockPostProcessing.setEnabled).toHaveBeenCalledWith(false);
        });

        it('should fail initialization gracefully if both normal and fallback fail', () => {
            mockPostProcessing.initialize.mockReturnValue(false);
            glowManager.initializeFallbackRendering = jest.fn().mockImplementation(() => {
                throw new Error('Fallback fail');
            });

            const result = glowManager.initialize();
            expect(result).toBe(false);
            expect(glowManager.enabled).toBe(false);
        });

        it('should handle error applying intensity settings', () => {
            mockMaterialSystem.setGlobalIntensityMultiplier.mockImplementation(() => {
                throw new Error('Material Fail');
            });
            const result = glowManager.setIntensity('HIGH');
            expect(result).toBe(false);
        });
    });

    describe('Game Mode & State', () => {
        beforeEach(() => {
            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();
        });

        it('should handle TIME_TRIAL mode switch', () => {
            glowManager.handleGameModeSwitch('TIME_TRIAL');
            expect(mockMaterialSystem.dispose).toHaveBeenCalled();
        });

        it('should handle ARENA_SHRINK mode switch', () => {
            glowManager.handleGameModeSwitch('ARENA_SHRINK');
        });

        it('should handle resize', () => {
            glowManager.handleResize(100, 100);
            expect(mockPostProcessing.resize).toHaveBeenCalledWith(100, 100);
            expect(window.glowSettingsUI.handleResize).toHaveBeenCalled();
        });

        it('should check particle compatibility', () => {
            window.renderingEngine.getParticleSystem.mockReturnValue({});
            expect(glowManager.checkParticleCompatibility()).toBe(true);
        });

        it('should handle particle compatibility check error', () => {
            window.renderingEngine.getParticleSystem.mockImplementation(() => {
                throw new Error('Check fail');
            });
            expect(glowManager.checkParticleCompatibility()).toBe(true);
        });

        it('should force pause and resume', () => {
            glowManager.forcePause();
            expect(mockMaterialSystem.pausePulse).toHaveBeenCalled();
            expect(glowManager.isPaused).toBe(true);

            glowManager.forceResume();
            expect(mockMaterialSystem.resumePulse).toHaveBeenCalled();
            expect(glowManager.isPaused).toBe(false);
        });
    });

    describe('Debug Utils & Logging', () => {
        it('should get WebGL info', () => {
            const info = glowManager.getWebGLInfo();
            expect(info).toBeDefined();
        });

        it('should dump debug state', () => {
            glowManager.initialize();
            const state = glowManager.dumpDebugState();
            expect(state).toBeDefined();
            expect(state.memory).toBeDefined();
        });

        it('should start memory monitoring', () => {
            jest.useFakeTimers();
            glowManager.shouldMonitorMemory = jest.fn().mockReturnValue(true);
            glowManager.startMemoryMonitoring();

            expect(glowManager.memoryStats).toBeDefined();

            jest.advanceTimersByTime(30000);
            jest.useRealTimers();
        });

        it('should log via helpers', () => {
            // Basic coverage for log helpers
            glowManager.logInfo('test', 'message');
            glowManager.logWarning('test', 'message');
            glowManager.logError('test', 'message');
            expect(glowManager.getLogHistory().length).toBeGreaterThan(0);
            glowManager.clearLogHistory();
            expect(glowManager.getLogHistory().length).toBe(0);
        });
    });

    describe('Resource Management & Notifications', () => {
        beforeEach(() => {
            glowManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
            glowManager.initialize();
        });

        it('should dispose all resources correctly', () => {
            glowManager.startMemoryMonitoring();
            const mockNotification = { parentElement: { removeChild: jest.fn() } };
            jest.spyOn(document, 'getElementById').mockReturnValue(mockNotification);

            glowManager.dispose();

            expect(mockPostProcessing.dispose).toHaveBeenCalled();
            expect(mockMaterialSystem.dispose).toHaveBeenCalled();
            expect(mockNotification.parentElement.removeChild).toHaveBeenCalledWith(
                mockNotification
            );
            expect(glowManager.initialized).toBe(false);
            expect(glowManager.enabled).toBe(false);
        });

        it('should handle memory leaks', () => {
            window.gc = jest.fn();
            jest.useFakeTimers();
            glowManager.handleMemoryLeak();
            expect(window.gc).toHaveBeenCalled();
            expect(mockPerformanceScaler.setQuality).toHaveBeenCalledWith('minimal');
            jest.runAllTimers();
            jest.useRealTimers();
        });

        it('should check memory usage and trigger leak detection', () => {
            glowManager.shouldMonitorMemory = jest.fn().mockReturnValue(true);
            const baseline = 10 * 1024 * 1024;
            const leak = 60 * 1024 * 1024;

            glowManager.getMemoryUsage = jest
                .fn()
                .mockReturnValueOnce(baseline)
                .mockReturnValue(baseline + leak);

            glowManager.startMemoryMonitoring();
            // Spy on handleMemoryLeak
            const handleSpy = jest.spyOn(glowManager, 'handleMemoryLeak');
            // Call check which uses 2nd value
            glowManager.checkMemoryUsage();

            expect(handleSpy).toHaveBeenCalled();
        });

        it('should show compatibility notification', () => {
            jest.useFakeTimers();
            const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
            jest.spyOn(document, 'getElementById').mockReturnValue(null);

            // Spy on setTimeout
            const timeoutSpy = jest.spyOn(global, 'setTimeout');

            glowManager.showCompatibilityNotification('Test Title', 'Test Message');

            expect(appendSpy).toHaveBeenCalled();
            const notification = appendSpy.mock.calls[0][0];
            expect(notification.innerHTML).toContain('Test Title');

            // Verify timeout set (auto-hide logic)
            expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);

            jest.useRealTimers();
        });
    });
});
