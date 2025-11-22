/**
 * Integration Tests for Glow Effects System
 * Tests the interaction between GlowEffectManager, renderer, and game systems
 */

// Mock Three.js and dependencies
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

// Mock performance API
global.performance = {
    now: jest.fn(() => 1000)
};

// Mock document
const mockCanvas = {
    getContext: jest.fn().mockReturnValue({
        getParameter: jest.fn(),
        getSupportedExtensions: jest.fn(() => ['OES_texture_float']),
        getExtension: jest.fn()
    })
};

global.document = {
    createElement: jest.fn(() => mockCanvas),
    body: { appendChild: jest.fn() },
    getElementById: jest.fn()
};

describe('Glow Effects Integration Tests', () => {
    let mockRenderer, mockScene, mockCamera;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        
        mockRenderer = {
            render: jest.fn(),
            getSize: jest.fn(() => ({ x: 800, y: 600 }))
        };
        mockScene = {};
        mockCamera = {};
    });

    describe('Post-processing Pipeline Integration', () => {
        it('should integrate post-processing with existing renderer', () => {
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            const result = pipeline.initialize();
            
            expect(result).toBe(true);
            expect(THREE.EffectComposer).toHaveBeenCalledWith(mockRenderer);
            expect(THREE.RenderPass).toHaveBeenCalledWith(mockScene, mockCamera);
            expect(THREE.UnrealBloomPass).toHaveBeenCalled();
        });

        it('should handle quality changes affecting bloom parameters', () => {
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();
            
            // Test quality scaling
            pipeline.setQuality('medium');
            expect(pipeline.getCurrentQuality()).toBe('medium');
            
            pipeline.setQuality('low');
            expect(pipeline.getCurrentQuality()).toBe('low');
        });

        it('should render through post-processing pipeline', () => {
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();
            
            pipeline.render();
            expect(pipeline.composer.render).toHaveBeenCalled();
        });
    });

    describe('Performance Scaling Integration', () => {
        it('should scale quality based on performance metrics', () => {
            const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
            
            const scaler = new PerformanceScaler();
            const qualityChangeCallback = jest.fn();
            scaler.setOnQualityChange(qualityChangeCallback);
            
            // Simulate low performance
            for (let i = 0; i < 30; i++) {
                scaler.monitorPerformance(50); // 20 FPS (50ms frame time)
            }
            
            // Manually trigger scaling check
            scaler.checkPerformanceConditions(20, performance.now());
            
            expect(scaler.getCurrentQuality()).not.toBe('high');
        });

        it('should provide performance metrics for monitoring', () => {
            const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
            
            const scaler = new PerformanceScaler();
            
            // Add some performance data
            scaler.monitorPerformance(16.67); // 60 FPS
            scaler.monitorPerformance(20);    // 50 FPS
            scaler.monitorPerformance(25);    // 40 FPS
            
            const metrics = scaler.getPerformanceMetrics();
            
            expect(metrics).toHaveProperty('currentFPS');
            expect(metrics).toHaveProperty('averageFPS');
            expect(metrics).toHaveProperty('currentQuality');
            expect(metrics.averageFPS).toBeGreaterThan(0);
        });
    });

    describe('Settings Persistence Integration', () => {
        it('should persist and load glow settings', () => {
            const { GlowSettings } = require('@/systems/GlowSettings.js');
            
            const settings = new GlowSettings();
            
            // Set and save a setting
            settings.setIntensity('HIGH');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.stringContaining('"intensity":"HIGH"')
            );
            
            // Mock loading the setting
            localStorageMock.getItem.mockReturnValue('{"intensity":"HIGH","version":1}');
            
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('HIGH');
        });

        it('should provide configuration for different intensity levels', () => {
            const { GlowSettings } = require('@/systems/GlowSettings.js');
            
            const settings = new GlowSettings();
            
            settings.setIntensity('OFF');
            let config = settings.getIntensityConfig();
            expect(config.emissive).toBe(0);
            expect(config.bloom).toBe(0);
            
            settings.setIntensity('HIGH');
            config = settings.getIntensityConfig();
            expect(config.emissive).toBe(0.8);
            expect(config.bloom).toBe(1.5);
        });
    });

    describe('Material System Integration', () => {
        it('should create and manage materials for game entities', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            
            // Create materials for different entities
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const trailMaterial = materialSystem.createTrailMaterial('trail_1', 0x00ff00);
            
            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0x00ff00,
                    emissive: 0x00ff00
                })
            );
            
            expect(THREE.MeshBasicMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    transparent: true
                })
            );
            
            // Check material counts
            const counts = materialSystem.getMaterialCounts();
            expect(counts.bike).toBe(1);
            expect(counts.trail).toBe(1);
            expect(counts.total).toBe(2);
        });

        it('should update pulse animation across all materials', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const trailMaterial = materialSystem.createTrailMaterial('trail_1', 0x00ff00);
            
            const initialBikeIntensity = bikeMaterial.emissiveIntensity;
            const initialTrailIntensity = trailMaterial.emissiveIntensity;
            
            // Update pulse animation
            materialSystem.updatePulseAnimation(0.625); // 1/4 of cycle
            
            // Materials should have updated intensities
            expect(bikeMaterial.emissiveIntensity).not.toBe(initialBikeIntensity);
            expect(trailMaterial.emissiveIntensity).not.toBe(initialTrailIntensity);
            
            // Bike should be brighter than trail
            expect(bikeMaterial.emissiveIntensity).toBeGreaterThan(trailMaterial.emissiveIntensity);
        });

        it('should handle global intensity changes', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const initialIntensity = bikeMaterial.emissiveIntensity;
            
            // Change global intensity
            materialSystem.setGlobalIntensityMultiplier(0.5);
            
            expect(bikeMaterial.emissiveIntensity).toBe(initialIntensity * 0.5);
        });
    });

    describe('Game State Integration', () => {
        it('should handle pause and resume states', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            materialSystem.createBikeMaterial('player', 0x00ff00);
            
            // Test pause functionality
            materialSystem.pausePulse();
            expect(materialSystem.getPulseState().paused).toBe(true);
            
            // Update should not change intensity when paused
            const material = materialSystem.getMaterial('player');
            const pausedIntensity = material.emissiveIntensity;
            
            materialSystem.updatePulseAnimation(1.0);
            expect(material.emissiveIntensity).toBe(pausedIntensity);
            
            // Resume should allow updates
            materialSystem.resumePulse();
            expect(materialSystem.getPulseState().paused).toBe(false);
        });

        it('should handle entity lifecycle (creation and disposal)', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            
            // Create material
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            expect(materialSystem.getMaterial('player')).toBe(material);
            
            // Dispose material
            materialSystem.disposeMaterial('player');
            expect(materialSystem.getMaterial('player')).toBeNull();
            expect(material.dispose).toHaveBeenCalled();
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle WebGL initialization failures gracefully', () => {
            // Mock WebGL failure
            mockCanvas.getContext.mockReturnValue(null);
            
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            const result = pipeline.initialize();
            
            // Should fail gracefully
            expect(result).toBe(false);
            expect(pipeline.initialized).toBe(false);
        });

        it('should handle rendering errors with fallback', () => {
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();
            
            // Mock rendering error
            pipeline.composer.render = jest.fn(() => {
                throw new Error('Render error');
            });
            
            // Should not throw and should fallback
            expect(() => {
                pipeline.render();
            }).not.toThrow();
            
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should handle settings corruption gracefully', () => {
            const { GlowSettings } = require('@/systems/GlowSettings.js');
            
            // Mock corrupted localStorage data
            localStorageMock.getItem.mockReturnValue('invalid json');
            
            const settings = new GlowSettings();
            
            // Should use defaults when settings are corrupted
            expect(settings.getIntensity()).toBe('MEDIUM');
        });
    });

    describe('Performance Integration', () => {
        it('should coordinate performance scaling with quality settings', () => {
            const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const scaler = new PerformanceScaler();
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();
            
            // Set up quality change callback
            scaler.setOnQualityChange((quality, settings) => {
                pipeline.setQuality(quality);
            });
            
            // Trigger quality change
            scaler.setQuality('low');
            
            expect(pipeline.getCurrentQuality()).toBe('low');
        });

        it('should provide comprehensive system status', () => {
            const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            
            const scaler = new PerformanceScaler();
            const materialSystem = new EmissiveMaterialSystem();
            
            // Add some data
            scaler.monitorPerformance(16.67);
            materialSystem.createBikeMaterial('player', 0x00ff00);
            
            const performanceStatus = scaler.getPerformanceStatus();
            const materialStatus = materialSystem.getStatus();
            
            expect(performanceStatus).toHaveProperty('fps');
            expect(performanceStatus).toHaveProperty('quality');
            expect(materialStatus).toHaveProperty('materialCount');
            expect(materialStatus).toHaveProperty('pulseIntensity');
        });
    });

    describe('Memory Management Integration', () => {
        it('should properly dispose of all resources', () => {
            const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
            const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
            
            const materialSystem = new EmissiveMaterialSystem();
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            
            // Create some resources
            const material1 = materialSystem.createBikeMaterial('player', 0x00ff00);
            const material2 = materialSystem.createTrailMaterial('trail_1', 0x00ff00);
            pipeline.initialize();
            
            // Dispose everything
            materialSystem.dispose();
            pipeline.dispose();
            
            // Check that resources were disposed
            expect(material1.dispose).toHaveBeenCalled();
            expect(material2.dispose).toHaveBeenCalled();
            expect(pipeline.composer.dispose).toHaveBeenCalled();
            
            expect(materialSystem.getMaterialCounts().total).toBe(0);
            expect(pipeline.initialized).toBe(false);
        });
    });
});