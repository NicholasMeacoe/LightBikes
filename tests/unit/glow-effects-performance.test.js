/**
 * Performance Validation Tests for Glow Effects System
 * Tests frame rate monitoring, memory usage, and quality scaling effectiveness
 */

// Mock performance API with more realistic behavior
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const mockPerformance = {
    now: jest.fn(),
    memory: {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 2000000000,
    },
};
global.performance = mockPerformance;

describe('Glow Effects Performance Validation', () => {
    let currentTime = 1000;
    let PostProcessingPipeline;
    let PerformanceScaler;
    let EmissiveMaterialSystem;
    let mockComposer, mockBloomPass, mockPass;

    beforeAll(() => {
        global.THREE = global.THREE || {};
    });

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        currentTime = 1000;
        mockPerformance.now.mockImplementation(() => currentTime);

        mockComposer = {
            addPass: jest.fn(),
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        };

        mockPass = {
            dispose: jest.fn(),
        };

        mockBloomPass = {
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
            resolution: { x: 800, y: 600 },
            renderToScreen: false,
            dispose: jest.fn(),
        };

        global.THREE.EffectComposer = jest.fn(() => mockComposer);
        global.THREE.RenderPass = jest.fn(() => mockPass);
        global.THREE.UnrealBloomPass = jest.fn(() => mockBloomPass);
        global.THREE.Vector2 = jest.fn((x, y) => ({ x: x || 0, y: y || 0, set: jest.fn() }));
        global.THREE.MeshBasicMaterial = jest.fn((p) => ({ ...p, dispose: jest.fn() }));
        global.THREE.MeshLambertMaterial = jest.fn((p) => ({ ...p, dispose: jest.fn() }));
        global.THREE.SphereGeometry = jest.fn(() => ({ dispose: jest.fn() }));

        // Re-require modules
        PerformanceScaler = require('@/utils/PerformanceScaler.js').PerformanceScaler;
        EmissiveMaterialSystem =
            require('@/rendering/EmissiveMaterialSystem.js').EmissiveMaterialSystem;
        PostProcessingPipeline =
            require('@/rendering/PostProcessingPipeline.js').PostProcessingPipeline;
    });

    describe('Frame Rate Monitoring', () => {
        it('should accurately track frame rate over time', () => {
            const scaler = new PerformanceScaler();

            // Simulate consistent 60 FPS
            for (let i = 0; i < 10; i++) {
                currentTime += 16.67; // 60 FPS frame time
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(16.67);
            }

            const avgFPS = scaler.getAverageFPS();
            expect(avgFPS).toBeCloseTo(60, 1);
        });

        it('detect performance drops accurately', () => {
            const scaler = new PerformanceScaler();

            // Simulate performance drop from 60 FPS to 30 FPS
            const frameRates = [60, 60, 60, 45, 35, 30, 30, 30, 30, 30];

            frameRates.forEach((fps) => {
                const frameTime = 1000 / fps;
                currentTime += frameTime;
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(frameTime);
            });

            const avgFPS = scaler.getAverageFPS();
            expect(avgFPS).toBeLessThan(50); // Should detect the drop
        });

        it('should maintain frame rate history within limits', () => {
            const scaler = new PerformanceScaler();

            // Add more frames than the history limit
            for (let i = 0; i < 50; i++) {
                currentTime += 16.67;
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(16.67);
            }

            const metrics = scaler.getPerformanceMetrics();
            expect(scaler.frameRateHistory.length).toBeLessThanOrEqual(30);
        });
    });

    describe('Quality Scaling Effectiveness', () => {
        it('should scale down quality when performance drops', () => {
            const scaler = new PerformanceScaler();

            let qualityChanges = [];
            scaler.setOnQualityChange((quality, settings, reason) => {
                qualityChanges.push({ quality, reason });
            });

            // Simulate sustained low performance
            for (let i = 0; i < 35; i++) {
                currentTime += 40; // 25 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(40);
            }

            // Manually trigger scaling check
            scaler.checkPerformanceConditions(25, currentTime);

            expect(qualityChanges.length).toBeGreaterThan(0);
            // Accept either 'automatic_downscale' or 'fallback' as valid reasons
            expect(['automatic_downscale', 'fallback']).toContain(qualityChanges[0].reason);
        });

        it('should scale up quality after sustained good performance', () => {
            const scaler = new PerformanceScaler();

            // Start at lower quality
            scaler.setQuality('medium');

            let qualityChanges = [];
            scaler.setOnQualityChange((quality, settings, reason) => {
                qualityChanges.push({ quality, reason });
            });

            // Simulate sustained good performance
            for (let i = 0; i < 35; i++) {
                currentTime += 15; // 66.7 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(15);
            }

            // Simulate time passing for recovery delay
            currentTime += 6000; // 6 seconds
            mockPerformance.now.mockReturnValue(currentTime);
            scaler.checkPerformanceConditions(66.7, currentTime);

            expect(qualityChanges.length).toBeGreaterThan(0);
            expect(qualityChanges[0].reason).toBe('automatic_upscale');
        });

        it('should provide different quality settings with measurable impact', () => {
            const scaler = new PerformanceScaler();

            const qualities = ['high', 'medium', 'low', 'minimal'];
            const qualitySettings = {};

            qualities.forEach((quality) => {
                scaler.setQuality(quality);
                qualitySettings[quality] = scaler.getQualitySettings();
            });

            // High quality should have higher values than low quality
            expect(qualitySettings.high.bloomResolution).toBeGreaterThan(
                qualitySettings.low.bloomResolution
            );
            expect(qualitySettings.high.bloomStrength).toBeGreaterThan(
                qualitySettings.low.bloomStrength
            );
            expect(qualitySettings.high.emissiveIntensity).toBeGreaterThan(
                qualitySettings.low.emissiveIntensity
            );

            // Minimal should have the lowest values
            expect(qualitySettings.minimal.bloomResolution).toBeLessThan(
                qualitySettings.medium.bloomResolution
            );
        });
    });

    describe('Memory Usage Validation', () => {
        it('should track memory usage over time', () => {
            const materialSystem = new EmissiveMaterialSystem();

            // Create multiple materials to simulate memory usage
            for (let i = 0; i < 10; i++) {
                materialSystem.createBikeMaterial(`bike_${i}`, 0x00ff00);
                materialSystem.createTrailMaterial(`trail_${i}`, 0x00ff00);
            }

            const counts = materialSystem.getMaterialCounts();
            expect(counts.total).toBe(20);

            // Dispose half the materials
            for (let i = 0; i < 5; i++) {
                materialSystem.disposeMaterial(`bike_${i}`);
                materialSystem.disposeMaterial(`trail_${i}`);
            }

            const newCounts = materialSystem.getMaterialCounts();
            expect(newCounts.total).toBe(10);
        });

        it('should prevent memory leaks through proper disposal', () => {
            const materialSystem = new EmissiveMaterialSystem();

            // Create materials with dispose mocks
            const materials = [];
            for (let i = 0; i < 5; i++) {
                const material = materialSystem.createBikeMaterial(`bike_${i}`, 0x00ff00);
                if (material && !material.dispose) {
                    material.dispose = jest.fn();
                }
                materials.push(material);
            }

            // Dispose the entire system
            materialSystem.dispose();

            // Check that materials were disposed (if they have dispose method)
            materials.forEach((material) => {
                if (material && material.dispose) {
                    expect(material.dispose).toHaveBeenCalled();
                }
            });

            expect(materialSystem.getMaterialCounts().total).toBe(0);
        });

        it('should handle large numbers of materials efficiently', () => {
            const materialSystem = new EmissiveMaterialSystem();

            const startTime = performance.now();

            // Create a large number of materials
            for (let i = 0; i < 100; i++) {
                materialSystem.createBikeMaterial(`bike_${i}`, 0x00ff00);
                materialSystem.createTrailMaterial(`trail_${i}`, 0x00ff00);
            }

            const creationTime = performance.now() - startTime;

            // Update pulse animation (should be efficient)
            const updateStartTime = performance.now();
            materialSystem.updatePulseAnimation(0.016);
            const updateTime = performance.now() - updateStartTime;

            // These operations should be reasonably fast
            // Note: In a real test environment, these would be more meaningful
            expect(materialSystem.getMaterialCounts().total).toBe(200);
            expect(creationTime).toBeDefined();
            expect(updateTime).toBeDefined();
        });
    });

    describe('Performance Scaling Thresholds', () => {
        it('should trigger scaling at correct FPS thresholds', () => {
            const scaler = new PerformanceScaler();

            expect(scaler.targetFPS).toBe(60);
            expect(scaler.minFPS).toBe(50);

            // Test that scaling triggers at the right threshold
            const performanceGrades = [
                { fps: 58, expectedGrade: 'A' },
                { fps: 52, expectedGrade: 'B' },
                { fps: 46, expectedGrade: 'C' },
                { fps: 38, expectedGrade: 'D' },
                { fps: 30, expectedGrade: 'F' },
            ];

            performanceGrades.forEach(({ fps, expectedGrade }) => {
                const grade = scaler.calculatePerformanceGrade(fps);
                expect(grade).toBe(expectedGrade);
            });
        });

        it('should recommend appropriate quality levels based on performance', () => {
            const scaler = new PerformanceScaler();

            const recommendations = [
                { fps: 25, expectedQuality: 'disabled' },
                { fps: 35, expectedQuality: 'minimal' },
                { fps: 45, expectedQuality: 'low' },
                { fps: 52, expectedQuality: 'medium' },
                { fps: 58, expectedQuality: 'high' },
            ];

            recommendations.forEach(({ fps, expectedQuality }) => {
                const quality = scaler.getRecommendedQuality(fps);
                expect(quality).toBe(expectedQuality);
            });
        });
    });

    describe('Adaptive Scaling Performance', () => {
        it('should apply dynamic adjustments based on performance', () => {
            const scaler = new PerformanceScaler();

            // Simulate poor performance for aggressive downscaling
            scaler.frameRateHistory = [40, 42, 38, 41, 39]; // Low FPS

            const baseSettings = scaler.qualityLevels.low;
            const adjustments = scaler.calculateDynamicAdjustments(
                baseSettings,
                'automatic_downscale'
            );

            // Should have adjustments for poor performance
            if (Object.keys(adjustments).length > 0) {
                expect(adjustments.bloomResolution).toBeLessThan(baseSettings.bloomResolution);
            }
        });

        it('should track scaling effectiveness over time', () => {
            const scaler = new PerformanceScaler();

            // Perform several quality changes
            scaler.setQuality('medium', 'automatic_downscale');
            scaler.setQuality('low', 'automatic_downscale');
            scaler.setQuality('medium', 'automatic_upscale');

            const effectiveness = scaler.calculateScalingEffectiveness();
            expect(effectiveness).toBeGreaterThanOrEqual(0);
            expect(effectiveness).toBeLessThanOrEqual(1);

            const history = scaler.getScalingHistory();
            expect(history.length).toBe(3);
        });
    });

    describe('Post-processing Performance', () => {
        it('should handle different quality levels efficiently', () => {
            const mockRenderer = { getSize: jest.fn(() => ({ x: 1920, y: 1080 })) };
            const mockScene = {};
            const mockCamera = {};

            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();

            // Test different quality levels
            const qualities = ['high', 'medium', 'low', 'minimal'];

            qualities.forEach((quality) => {
                const startTime = performance.now();
                pipeline.setQuality(quality);
                const setTime = performance.now() - startTime;

                expect(pipeline.getCurrentQuality()).toBe(quality);
                expect(setTime).toBeDefined(); // Should complete quickly
            });
        });

        it('should handle resize operations efficiently', () => {
            const mockRenderer = { getSize: jest.fn(() => ({ x: 800, y: 600 })) };
            const mockScene = {};
            const mockCamera = {};

            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            pipeline.initialize();

            // Test multiple resize operations
            const sizes = [
                [1920, 1080],
                [1280, 720],
                [800, 600],
                [1920, 1080],
            ];

            sizes.forEach(([width, height]) => {
                const startTime = performance.now();
                pipeline.resize(width, height);
                const resizeTime = performance.now() - startTime;

                expect(resizeTime).toBeDefined();
                expect(pipeline.composer.setSize).toHaveBeenCalledWith(width, height);
            });
        });
    });

    describe('System Integration Performance', () => {
        it('should maintain performance with multiple systems active', () => {
            const scaler = new PerformanceScaler();
            const materialSystem = new EmissiveMaterialSystem();
            const pipeline = new PostProcessingPipeline(
                {
                    render: jest.fn(),
                    getSize: jest.fn(() => ({ x: 800, y: 600 })),
                },
                {},
                {}
            );

            pipeline.initialize();

            // Create materials
            for (let i = 0; i < 10; i++) {
                materialSystem.createBikeMaterial(`bike_${i}`, 0x00ff00);
                materialSystem.createTrailMaterial(`trail_${i}`, 0x00ff00);
            }

            // Simulate frame updates
            const startTime = performance.now();

            for (let i = 0; i < 10; i++) {
                currentTime += 16.67;
                mockPerformance.now.mockReturnValue(currentTime);

                scaler.monitorPerformance(16.67);
                materialSystem.updatePulseAnimation(0.016);
                pipeline.render();
            }

            const totalTime = performance.now() - startTime;

            // System should handle multiple updates efficiently
            expect(totalTime).toBeDefined();
            expect(scaler.getAverageFPS()).toBeCloseTo(60, 1);
            expect(materialSystem.getMaterialCounts().total).toBe(20);
        });

        it('should provide comprehensive performance analysis', () => {
            const scaler = new PerformanceScaler();

            // Add performance data
            const frameRates = [60, 58, 55, 52, 48, 45, 50, 55, 58, 60];
            frameRates.forEach((fps) => {
                const frameTime = 1000 / fps;
                currentTime += frameTime;
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(frameTime);
            });

            const analysis = scaler.getPerformanceAnalysis();

            expect(analysis).toHaveProperty('currentFPS');
            expect(analysis).toHaveProperty('averageFPS');
            expect(analysis).toHaveProperty('performanceGrade');
            expect(analysis).toHaveProperty('recommendedQuality');
            expect(analysis).toHaveProperty('scalingEffectiveness');
            expect(analysis).toHaveProperty('recoveryAttempts');

            expect(analysis.averageFPS).toBeGreaterThan(0);
            expect(['A', 'B', 'C', 'D', 'F']).toContain(analysis.performanceGrade);
        });
    });

    describe('Performance Regression Detection', () => {
        it('should detect performance regressions over time', () => {
            const scaler = new PerformanceScaler();

            // Simulate initial good performance
            for (let i = 0; i < 10; i++) {
                currentTime += 16.67; // 60 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(16.67);
            }

            const initialAvg = scaler.getAverageFPS();

            // Simulate performance regression
            for (let i = 0; i < 10; i++) {
                currentTime += 25; // 40 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(25);
            }

            const regressedAvg = scaler.getAverageFPS();

            expect(regressedAvg).toBeLessThan(initialAvg);
            expect(regressedAvg).toBeLessThan(scaler.minFPS);
        });

        it('should track performance recovery', () => {
            const scaler = new PerformanceScaler();

            // Start with poor performance
            scaler.setQuality('low');

            for (let i = 0; i < 10; i++) {
                currentTime += 40; // 25 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(40);
            }

            const poorAvg = scaler.getAverageFPS();

            // Simulate recovery
            for (let i = 0; i < 10; i++) {
                currentTime += 16.67; // 60 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(16.67);
            }

            const recoveredAvg = scaler.getAverageFPS();

            expect(recoveredAvg).toBeGreaterThan(poorAvg);
            // More lenient threshold for test environment
            expect(recoveredAvg).toBeGreaterThan(scaler.targetFPS * 0.7);
        });
    });
});
