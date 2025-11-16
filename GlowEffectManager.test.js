/**
 * Comprehensive Tests for GlowEffectManager
 * Tests initialization, update logic, material creation, and error handling
 */

// Mock Three.js objects and classes
const mockRenderer = {
    render: jest.fn(),
    getSize: jest.fn(() => ({ x: 800, y: 600 }))
};

const mockScene = {};
const mockCamera = {};

// Mock Three.js classes
global.THREE = {
    EffectComposer: jest.fn().mockImplementation(() => ({
        addPass: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
        passes: []
    })),
    RenderPass: jest.fn(),
    UnrealBloomPass: jest.fn().mockImplementation(() => ({
        strength: 1.0,
        radius: 0.4,
        threshold: 0.85,
        resolution: { x: 800, y: 600 },
        renderToScreen: false
    })),
    Vector2: jest.fn().mockImplementation((x, y) => ({ x, y })),
    MeshLambertMaterial: jest.fn().mockImplementation((params) => ({
        ...params,
        color: { setHex: jest.fn() },
        emissive: { setHex: jest.fn() },
        dispose: jest.fn()
    })),
    MeshBasicMaterial: jest.fn().mockImplementation((params) => ({
        ...params,
        color: { setHex: jest.fn() },
        emissive: { setHex: jest.fn() },
        dispose: jest.fn()
    })),
    Color: jest.fn().mockImplementation((color) => ({
        multiplyScalar: jest.fn().mockReturnThis()
    }))
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock document for WebGL checks
const mockCanvas = {
    getContext: jest.fn()
};

// Mock document.createElement before importing the module
Object.defineProperty(global.document, 'createElement', {
    value: jest.fn(() => mockCanvas),
    writable: true
});

Object.defineProperty(global.document, 'body', {
    value: {
        appendChild: jest.fn()
    },
    writable: true
});

Object.defineProperty(global.document, 'getElementById', {
    value: jest.fn(),
    writable: true
});

// Mock performance API
global.performance = {
    now: jest.fn(() => 1000),
    memory: {
        usedJSHeapSize: 50000000
    }
};

const { GlowEffectManager } = require('./GlowEffectManager.js');

describe('GlowEffectManager', () => {
    let glowEffectManager;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        
        // Reset document mock
        mockCanvas.getContext.mockReturnValue({
            getParameter: jest.fn(),
            getSupportedExtensions: jest.fn(() => ['OES_texture_float']),
            getExtension: jest.fn()
        });
        
        // Spy on document.createElement to ensure our mock is used
        jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
        
        glowEffectManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(glowEffectManager.renderer).toBe(mockRenderer);
            expect(glowEffectManager.scene).toBe(mockScene);
            expect(glowEffectManager.camera).toBe(mockCamera);
            expect(glowEffectManager.initialized).toBe(false);
            expect(glowEffectManager.enabled).toBe(true);
            expect(glowEffectManager.currentIntensity).toBe('MEDIUM');
            expect(glowEffectManager.fallbackMode).toBe(false);
            expect(glowEffectManager.isPaused).toBe(false);
        });

        it('should initialize logging system', () => {
            expect(glowEffectManager.logHistory).toEqual([]);
            expect(glowEffectManager.maxLogHistory).toBe(100);
        });
    });

    describe('Initialization', () => {
        it('should initialize successfully with WebGL support', () => {
            const result = glowEffectManager.initialize();

            expect(result).toBe(true);
            expect(glowEffectManager.initialized).toBe(true);
            expect(glowEffectManager.enabled).toBe(true);
            expect(glowEffectManager.postProcessing).toBeDefined();
            expect(glowEffectManager.materialSystem).toBeDefined();
            expect(glowEffectManager.performanceScaler).toBeDefined();
            expect(glowEffectManager.settings).toBeDefined();
        });

        it('should handle WebGL failure gracefully', () => {
            mockCanvas.getContext.mockReturnValue(null);

            const result = glowEffectManager.initialize();

            expect(result).toBe(true); // Returns true for fallback mode
            expect(glowEffectManager.enabled).toBe(false);
            expect(glowEffectManager.fallbackMode).toBe(true);
        });

        it('should handle initialization errors gracefully', () => {
            // Mock an error during initialization
            document.createElement.mockImplementation(() => {
                throw new Error('Mock initialization error');
            });

            const result = glowEffectManager.initialize();

            expect(result).toBe(true); // Should fallback
            expect(glowEffectManager.enabled).toBe(false);
            expect(glowEffectManager.fallbackMode).toBe(true);
        });

        it('should detect mobile GPU and set appropriate quality', () => {
            mockCanvas.getContext.mockReturnValue({
                getParameter: jest.fn((param) => {
                    if (param === 'RENDERER') return 'Adreno (TM) 640';
                    return 1024;
                }),
                getSupportedExtensions: jest.fn(() => ['OES_texture_float']),
                getExtension: jest.fn()
            });

            glowEffectManager.initialize();

            expect(glowEffectManager.forceQualityMode).toBe('medium');
        });
    });

    describe('Update Logic', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should update without errors when enabled', () => {
            const gameState = { isPaused: false };
            const deltaTime = 0.016;

            expect(() => {
                glowEffectManager.update(deltaTime, gameState);
            }).not.toThrow();
        });

        it('should validate update inputs', () => {
            expect(glowEffectManager.validateUpdateInputs(0.016, { isPaused: false })).toBe(true);
            expect(glowEffectManager.validateUpdateInputs(-0.1, { isPaused: false })).toBe(false);
            expect(glowEffectManager.validateUpdateInputs(2.0, { isPaused: false })).toBe(false);
            expect(glowEffectManager.validateUpdateInputs(0.016, null)).toBe(false);
            expect(glowEffectManager.validateUpdateInputs('invalid', { isPaused: false })).toBe(false);
        });

        it('should handle pause state changes correctly', () => {
            const gameState = { isPaused: true };
            glowEffectManager.update(0.016, gameState);
            expect(glowEffectManager.isPaused).toBe(true);

            gameState.isPaused = false;
            glowEffectManager.update(0.016, gameState);
            expect(glowEffectManager.isPaused).toBe(false);
        });

        it('should not update when disabled', () => {
            glowEffectManager.enabled = false;
            const gameState = { isPaused: false };

            expect(() => {
                glowEffectManager.update(0.016, gameState);
            }).not.toThrow();
        });

        it('should handle update errors gracefully', () => {
            // Mock material system to throw error
            glowEffectManager.materialSystem.updatePulseAnimation = jest.fn(() => {
                throw new Error('Mock update error');
            });

            const gameState = { isPaused: false };

            expect(() => {
                glowEffectManager.update(0.016, gameState);
            }).not.toThrow();
        });
    });

    describe('Rendering', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should render with post-processing when enabled', () => {
            glowEffectManager.render();
            expect(glowEffectManager.postProcessing.render).toHaveBeenCalled();
        });

        it('should fallback to standard rendering when disabled', () => {
            glowEffectManager.enabled = false;
            glowEffectManager.render();
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should fallback to standard rendering in fallback mode', () => {
            glowEffectManager.fallbackMode = true;
            glowEffectManager.render();
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should handle rendering errors gracefully', () => {
            glowEffectManager.postProcessing.render = jest.fn(() => {
                throw new Error('Render error');
            });

            expect(() => {
                glowEffectManager.render();
            }).not.toThrow();
            
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Intensity Settings', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should set valid intensity levels', () => {
            const validLevels = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];
            
            validLevels.forEach(level => {
                const result = glowEffectManager.setIntensity(level);
                expect(result).toBe(true);
                expect(glowEffectManager.currentIntensity).toBe(level);
            });
        });

        it('should reject invalid intensity levels', () => {
            const originalIntensity = glowEffectManager.currentIntensity;
            const result = glowEffectManager.setIntensity('INVALID');
            
            expect(result).toBe(false);
            expect(glowEffectManager.currentIntensity).toBe(originalIntensity);
        });

        it('should validate intensity levels correctly', () => {
            expect(glowEffectManager.validateIntensityLevel('HIGH')).toBe(true);
            expect(glowEffectManager.validateIntensityLevel('INVALID')).toBe(false);
            expect(glowEffectManager.validateIntensityLevel(123)).toBe(false);
            expect(glowEffectManager.validateIntensityLevel(null)).toBe(false);
        });

        it('should get correct intensity configuration', () => {
            const config = glowEffectManager.getIntensityConfig('HIGH');
            expect(config).toEqual({ emissive: 0.8, bloom: 1.5 });

            const offConfig = glowEffectManager.getIntensityConfig('OFF');
            expect(offConfig).toEqual({ emissive: 0, bloom: 0 });
        });

        it('should validate configuration objects', () => {
            const validConfig = { bloom: 1.0, emissive: 0.5, threshold: 0.8, radius: 0.4 };
            const validation = glowEffectManager.validateConfiguration(validConfig);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            const invalidConfig = { bloom: -1, emissive: 2.0 };
            const invalidValidation = glowEffectManager.validateConfiguration(invalidConfig);
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors.length).toBeGreaterThan(0);
        });

        it('should handle settings application errors', () => {
            // Mock post-processing to throw error
            glowEffectManager.postProcessing.setBloomStrength = jest.fn(() => {
                throw new Error('Mock settings error');
            });

            const result = glowEffectManager.setIntensity('HIGH');
            expect(result).toBe(false);
        });
    });

    describe('Material Creation', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should create bike materials when enabled', () => {
            const material = glowEffectManager.createBikeMaterial('player', 0x00ff00);
            
            expect(glowEffectManager.materialSystem.createBikeMaterial)
                .toHaveBeenCalledWith('player', 0x00ff00);
        });

        it('should create trail materials when enabled', () => {
            const material = glowEffectManager.createTrailMaterial('player', 0x00ff00);
            
            expect(glowEffectManager.materialSystem.createTrailMaterial)
                .toHaveBeenCalledWith('player', 0x00ff00);
        });

        it('should create fallback materials when disabled', () => {
            glowEffectManager.enabled = false;
            const material = glowEffectManager.createBikeMaterial('player', 0x00ff00);
            
            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({ color: 0x00ff00 });
        });

        it('should create fallback materials in fallback mode', () => {
            glowEffectManager.fallbackMode = true;
            glowEffectManager.initializeFallbackRendering();
            
            const material = glowEffectManager.createBikeMaterial('player', 0x00ff00);
            expect(material).toBeDefined();
        });
    });

    describe('Game State Management', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should handle game restart', () => {
            expect(() => {
                glowEffectManager.handleGameRestart();
            }).not.toThrow();
            
            expect(glowEffectManager.isPaused).toBe(false);
        });

        it('should handle game mode switching', () => {
            expect(() => {
                glowEffectManager.handleGameModeSwitch('TIME_TRIAL', 'CLASSIC');
            }).not.toThrow();
        });

        it('should force pause and resume', () => {
            glowEffectManager.forcePause();
            expect(glowEffectManager.isPaused).toBe(true);

            glowEffectManager.forceResume();
            expect(glowEffectManager.isPaused).toBe(false);
        });
    });

    describe('Resize Handling', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should handle resize events', () => {
            glowEffectManager.handleResize(1024, 768);
            expect(glowEffectManager.postProcessing.resize).toHaveBeenCalledWith(1024, 768);
        });

        it('should handle resize when post-processing is not available', () => {
            glowEffectManager.postProcessing = null;
            
            expect(() => {
                glowEffectManager.handleResize(1024, 768);
            }).not.toThrow();
        });
    });

    describe('Error Handling and Recovery', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should handle rendering failures', () => {
            const error = new Error('Mock render error');
            const result = glowEffectManager.handleRenderingFailure(error, 'test');
            
            // Should attempt recovery
            expect(typeof result).toBe('boolean');
        });

        it('should log errors with context', () => {
            glowEffectManager.logError('testMethod', 'Test error message', { test: 'context' });
            
            const logs = glowEffectManager.getLogHistory();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('ERROR');
            expect(logs[0].method).toBe('testMethod');
            expect(logs[0].message).toBe('Test error message');
        });

        it('should log warnings with context', () => {
            glowEffectManager.logWarning('testMethod', 'Test warning', { test: 'context' });
            
            const logs = glowEffectManager.getLogHistory();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('WARNING');
        });

        it('should limit log history size', () => {
            // Add more logs than the limit
            for (let i = 0; i < 105; i++) {
                glowEffectManager.logInfo('test', `Log ${i}`);
            }
            
            const logs = glowEffectManager.getLogHistory();
            expect(logs).toHaveLength(100);
        });
    });

    describe('Memory Management', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should start memory monitoring in debug mode', () => {
            // Mock debug mode
            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost' },
                writable: true
            });
            
            glowEffectManager.startMemoryMonitoring();
            expect(glowEffectManager.memoryStats).toBeDefined();
        });

        it('should check memory usage', () => {
            glowEffectManager.memoryStats = {
                initialMemory: 40000000,
                peakMemory: 0,
                samples: [],
                leakWarningThreshold: 50000000,
                lastGCTime: Date.now()
            };
            
            expect(() => {
                glowEffectManager.checkMemoryUsage();
            }).not.toThrow();
        });

        it('should handle memory leaks', () => {
            expect(() => {
                glowEffectManager.handleMemoryLeak();
            }).not.toThrow();
        });

        it('should get memory statistics', () => {
            glowEffectManager.memoryStats = {
                initialMemory: 40000000,
                peakMemory: 60000000,
                samples: [{ timestamp: Date.now(), memory: 50000000 }]
            };
            
            const stats = glowEffectManager.getMemoryStats();
            expect(stats).toHaveProperty('current');
            expect(stats).toHaveProperty('peak');
            expect(stats).toHaveProperty('increase');
        });
    });

    describe('Status and Debugging', () => {
        it('should return correct status information', () => {
            const status = glowEffectManager.getStatus();
            
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('intensity');
            expect(status).toHaveProperty('quality');
        });

        it('should dump debug state', () => {
            glowEffectManager.initialize();
            const debugState = glowEffectManager.dumpDebugState();
            
            expect(debugState).toHaveProperty('timestamp');
            expect(debugState).toHaveProperty('system');
            expect(debugState.system).toHaveProperty('enabled');
            expect(debugState.system).toHaveProperty('initialized');
        });

        it('should get WebGL information', () => {
            const webglInfo = glowEffectManager.getWebGLInfo();
            expect(webglInfo).toHaveProperty('supported');
        });
    });

    describe('Cleanup and Disposal', () => {
        it('should dispose resources properly', () => {
            glowEffectManager.initialize();
            
            glowEffectManager.dispose();
            
            expect(glowEffectManager.initialized).toBe(false);
            expect(glowEffectManager.enabled).toBe(false);
            expect(glowEffectManager.postProcessing).toBeNull();
            expect(glowEffectManager.materialSystem).toBeNull();
        });

        it('should handle disposal errors gracefully', () => {
            glowEffectManager.initialize();
            
            // Mock disposal error
            glowEffectManager.postProcessing.dispose = jest.fn(() => {
                throw new Error('Disposal error');
            });
            
            expect(() => {
                glowEffectManager.dispose();
            }).not.toThrow();
        });

        it('should clear memory monitoring interval', () => {
            glowEffectManager.memoryMonitorInterval = setInterval(() => {}, 1000);
            
            glowEffectManager.dispose();
            
            expect(glowEffectManager.memoryMonitorInterval).toBeNull();
        });
    });

    describe('Compatibility and Fallback', () => {
        it('should check WebGL support correctly', () => {
            const result = glowEffectManager.checkWebGLSupport();
            expect(typeof result).toBe('boolean');
        });

        it('should detect mobile GPU correctly', () => {
            expect(glowEffectManager.isMobileGPU('Adreno (TM) 640')).toBe(true);
            expect(glowEffectManager.isMobileGPU('NVIDIA GeForce GTX 1080')).toBe(false);
        });

        it('should initialize fallback rendering', () => {
            expect(() => {
                glowEffectManager.initializeFallbackRendering();
            }).not.toThrow();
            
            expect(glowEffectManager.fallbackMaterials).toBeDefined();
        });

        it('should show compatibility notifications', () => {
            expect(() => {
                glowEffectManager.showCompatibilityNotification('Test Title', 'Test Message');
            }).not.toThrow();
        });
    });
});