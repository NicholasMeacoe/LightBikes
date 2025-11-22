const { PerformanceMonitor } = require('@/utils/PerformanceMonitor.js');

describe('PerformanceMonitor', () => {
    let performanceMonitor;

    beforeEach(() => {
        performanceMonitor = new PerformanceMonitor();
        
        // Mock performance.now() for consistent testing
        global.performance = {
            now: jest.fn(() => 1000),
            mark: jest.fn(),
            measure: jest.fn(),
            memory: {
                usedJSHeapSize: 10 * 1024 * 1024, // 10MB
                totalJSHeapSize: 20 * 1024 * 1024, // 20MB
                jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
            }
        };
    });

    afterEach(() => {
        delete global.performance;
    });

    describe('Frame Rate Monitoring', () => {
        it('should initialize with default frame rate target', () => {
            expect(performanceMonitor.frameRateTarget).toBe(60);
            expect(performanceMonitor.frameRateThreshold).toBe(45);
        });

        it('should track frame rate correctly', () => {
            // Mock frame timing
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startFrameMonitoring();
            
            // Simulate 16.67ms frame time (60 FPS)
            currentTime += 16.67;
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endFrameMonitoring();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.currentFPS).toBeCloseTo(60, 0);
        });

        it('should detect low FPS conditions', () => {
            // Mock low FPS scenario (30 FPS = 33.33ms frame time)
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startFrameMonitoring();
            
            currentTime += 33.33;
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endFrameMonitoring();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.currentFPS).toBeLessThan(performanceMonitor.frameRateThreshold);
        });

        it('should track low FPS duration', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            // Simulate multiple low FPS frames
            for (let i = 0; i < 5; i++) {
                performanceMonitor.startFrameMonitoring();
                currentTime += 33.33; // 30 FPS
                global.performance.now = jest.fn(() => currentTime);
                performanceMonitor.endFrameMonitoring();
            }

            expect(performanceMonitor.lowFPSDuration).toBeGreaterThan(0);
        });

        it('should detect performance degradation', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            // Simulate sustained low FPS for more than threshold
            for (let i = 0; i < 200; i++) { // Simulate ~3+ seconds of low FPS
                performanceMonitor.startFrameMonitoring();
                currentTime += 33.33; // 30 FPS
                global.performance.now = jest.fn(() => currentTime);
                performanceMonitor.endFrameMonitoring();
            }

            expect(performanceMonitor.isPerformanceDegradationDetected()).toBe(true);
        });
    });

    describe('AI Calculation Time Tracking', () => {
        it('should track AI calculation time', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startAICalculation('ai_1');
            
            currentTime += 1.5; // 1.5ms calculation time
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endAICalculation('ai_1');

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.aiCalculationTime).toBe(1.5);
        });

        it('should record AI calculation time in history', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            // Record multiple calculations
            for (let i = 0; i < 5; i++) {
                performanceMonitor.startAICalculation(`ai_${i}`);
                currentTime += 1.0 + i * 0.5; // Varying calculation times
                global.performance.now = jest.fn(() => currentTime);
                performanceMonitor.endAICalculation(`ai_${i}`);
            }

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.averageAICalculationTime).toBeGreaterThan(0);
            expect(metrics.maxAICalculationTime).toBeGreaterThan(metrics.averageAICalculationTime);
        });

        it('should generate warning for slow AI calculations', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startAICalculation('slow_ai');
            
            currentTime += 5.0; // 5ms calculation time (exceeds 2ms target)
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endAICalculation('slow_ai');

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.performanceWarnings.length).toBeGreaterThan(0);
            expect(metrics.performanceWarnings[0].warning).toContain('AI calculation time exceeded target');
        });
    });

    describe('Collision Detection Performance Monitoring', () => {
        it('should track collision detection time', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startCollisionDetection();
            
            currentTime += 3.0; // 3ms detection time
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endCollisionDetection();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.collisionDetectionTime).toBe(3.0);
        });

        it('should calculate average collision detection time', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            // Record multiple collision detections
            const times = [2.0, 3.0, 4.0, 2.5, 3.5];
            times.forEach(time => {
                performanceMonitor.startCollisionDetection();
                currentTime += time;
                global.performance.now = jest.fn(() => currentTime);
                performanceMonitor.endCollisionDetection();
            });

            const metrics = performanceMonitor.getPerformanceMetrics();
            const expectedAverage = times.reduce((sum, time) => sum + time, 0) / times.length;
            expect(metrics.averageCollisionDetectionTime).toBeCloseTo(expectedAverage, 1);
        });

        it('should generate warning for slow collision detection', () => {
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startCollisionDetection();
            
            currentTime += 8.0; // 8ms detection time (exceeds 5ms target)
            global.performance.now = jest.fn(() => currentTime);
            
            performanceMonitor.endCollisionDetection();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.performanceWarnings.length).toBeGreaterThan(0);
            expect(metrics.performanceWarnings[0].warning).toContain('Collision detection time exceeded target');
        });
    });

    describe('Memory Usage Monitoring', () => {
        it('should monitor memory usage when available', () => {
            performanceMonitor.monitorMemoryUsage();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.memoryUsage).toBeDefined();
            expect(metrics.memoryUsage.usedMB).toBe(10); // 10MB from mock
            expect(metrics.memoryUsage.totalMB).toBe(20); // 20MB from mock
        });

        it('should handle missing memory API gracefully', () => {
            delete global.performance.memory;

            performanceMonitor.monitorMemoryUsage();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.memoryUsage.message).toBe('Memory API not available');
        });

        it('should generate warning for high memory usage', () => {
            // Mock high memory usage (85% of limit)
            global.performance.memory = {
                usedJSHeapSize: 85 * 1024 * 1024, // 85MB
                totalJSHeapSize: 90 * 1024 * 1024, // 90MB
                jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
            };

            performanceMonitor.monitorMemoryUsage();

            const metrics = performanceMonitor.getPerformanceMetrics();
            expect(metrics.performanceWarnings.length).toBeGreaterThan(0);
            expect(metrics.performanceWarnings[0].warning).toContain('High memory usage');
        });
    });

    describe('Performance Metrics', () => {
        it('should provide comprehensive performance metrics', () => {
            const metrics = performanceMonitor.getPerformanceMetrics();

            expect(metrics).toHaveProperty('currentFPS');
            expect(metrics).toHaveProperty('averageFPS');
            expect(metrics).toHaveProperty('minFPS');
            expect(metrics).toHaveProperty('maxFPS');
            expect(metrics).toHaveProperty('aiCalculationTime');
            expect(metrics).toHaveProperty('averageAICalculationTime');
            expect(metrics).toHaveProperty('maxAICalculationTime');
            expect(metrics).toHaveProperty('collisionDetectionTime');
            expect(metrics).toHaveProperty('averageCollisionDetectionTime');
            expect(metrics).toHaveProperty('maxCollisionDetectionTime');
            expect(metrics).toHaveProperty('memoryUsage');
            expect(metrics).toHaveProperty('performanceWarnings');
        });

        it('should provide performance summary', () => {
            const summary = performanceMonitor.getPerformanceSummary();

            expect(summary).toHaveProperty('fps');
            expect(summary).toHaveProperty('avgFPS');
            expect(summary).toHaveProperty('aiTime');
            expect(summary).toHaveProperty('collisionTime');
            expect(summary).toHaveProperty('memoryMB');
            expect(summary).toHaveProperty('warnings');
            expect(summary).toHaveProperty('degraded');
        });
    });

    describe('Performance Reporting', () => {
        it('should enable and disable reporting', () => {
            expect(performanceMonitor.reportingEnabled).toBe(false);

            performanceMonitor.setReportingEnabled(true);
            expect(performanceMonitor.reportingEnabled).toBe(true);

            performanceMonitor.setReportingEnabled(false);
            expect(performanceMonitor.reportingEnabled).toBe(false);
        });

        it('should generate performance report when enabled', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            performanceMonitor.setReportingEnabled(true);
            
            // Force report generation by setting last report time to 0 and current time ahead
            performanceMonitor.lastReport = 0;
            global.performance.now = jest.fn(() => 10000); // 10 seconds later
            
            performanceMonitor.generatePerformanceReport();

            expect(consoleSpy).toHaveBeenCalledWith('=== Performance Report ===');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Reset Functionality', () => {
        it('should reset all performance data', () => {
            // Add some data first
            let currentTime = 1000;
            global.performance.now = jest.fn(() => currentTime);

            performanceMonitor.startFrameMonitoring();
            currentTime += 16.67;
            global.performance.now = jest.fn(() => currentTime);
            performanceMonitor.endFrameMonitoring();

            performanceMonitor.addPerformanceWarning('Test warning');

            // Verify data exists
            expect(performanceMonitor.frameRateHistory.length).toBeGreaterThan(0);
            expect(performanceMonitor.performanceMetrics.performanceWarnings.length).toBeGreaterThan(0);

            // Reset and verify data is cleared
            performanceMonitor.reset();

            expect(performanceMonitor.frameRateHistory.length).toBe(0);
            expect(performanceMonitor.aiCalculationHistory.length).toBe(0);
            expect(performanceMonitor.collisionDetectionHistory.length).toBe(0);
            expect(performanceMonitor.frameCount).toBe(0);
            expect(performanceMonitor.performanceMetrics.performanceWarnings.length).toBe(0);
        });
    });

    describe('Update Method', () => {
        it('should call all necessary update methods', () => {
            const endFrameMonitoringSpy = jest.spyOn(performanceMonitor, 'endFrameMonitoring');
            const monitorMemoryUsageSpy = jest.spyOn(performanceMonitor, 'monitorMemoryUsage');
            const generatePerformanceReportSpy = jest.spyOn(performanceMonitor, 'generatePerformanceReport');
            const startFrameMonitoringSpy = jest.spyOn(performanceMonitor, 'startFrameMonitoring');

            performanceMonitor.update();

            expect(endFrameMonitoringSpy).toHaveBeenCalled();
            expect(monitorMemoryUsageSpy).toHaveBeenCalled();
            expect(generatePerformanceReportSpy).toHaveBeenCalled();
            expect(startFrameMonitoringSpy).toHaveBeenCalled();
        });
    });
});