const { createLogger } = require('./Logger.js');
const logger = createLogger('PerformanceMonitor');

/**
 * Performance Monitoring System for Multi-AI LightBikes
 * Tracks frame rate, AI calculation time, collision detection performance, and memory usage
 */
class PerformanceMonitor {
    constructor() {
        // Frame rate monitoring
        this.frameRateTarget = 60; // Target FPS
        this.frameRateThreshold = 45; // Minimum acceptable FPS
        this.frameRateHistory = [];
        this.frameRateHistorySize = 60; // Track last 60 frames (1 second at 60fps)
        this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.frameStartTime = this.lastFrameTime;
        this.frameCount = 0;

        // Degradation specific metrics
        this.consecutivePoorFrames = 0;
        this.consecutiveGoodFrames = 0;
        this.poorFPSThreshold = 35;
        this.goodFPSThreshold = 55;

        // AI calculation time tracking
        this.aiCalculationTimeTarget = 2; // Target <2ms per AI
        this.aiCalculationHistory = [];
        this.aiCalculationHistorySize = 30; // Track last 30 calculations

        // Collision detection performance monitoring
        this.collisionDetectionTimeTarget = 5; // Target <5ms total
        this.collisionDetectionHistory = [];
        this.collisionDetectionHistorySize = 30; // Track last 30 checks

        // Performance metrics collection
        this.performanceMetrics = {
            currentFPS: 60,
            averageFPS: 60,
            minFPS: 60,
            maxFPS: 60,
            aiCalculationTime: 0,
            averageAICalculationTime: 0,
            maxAICalculationTime: 0,
            collisionDetectionTime: 0,
            averageCollisionDetectionTime: 0,
            maxCollisionDetectionTime: 0,
            memoryUsage: {},
            performanceWarnings: [],
        };

        // Performance degradation tracking
        this.lowFPSStartTime = null;
        this.lowFPSDuration = 0;
        this.lowFPSThreshold = 3000; // 3 seconds in milliseconds

        // Memory monitoring
        this.memoryCheckInterval = 1000; // Check memory every second
        this.lastMemoryCheck = 0;

        // Performance reporting
        this.reportingEnabled = false;
        this.reportingInterval = 5000; // Report every 5 seconds
        this.lastReport = 0;

        // Initialize performance observer if available
        this.initializePerformanceObserver();
    }

    /**
     * Initialize Performance Observer for advanced metrics
     */
    initializePerformanceObserver() {
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'measure') {
                            this.handlePerformanceMeasure(entry);
                        }
                    });
                });

                this.performanceObserver.observe({ entryTypes: ['measure'] });
            } catch (error) {
                logger.debug('Performance Observer not available:', error.message);
            }
        }
    }

    /**
     * Handle performance measure entries
     * @param {PerformanceEntry} entry - Performance measure entry
     */
    handlePerformanceMeasure(entry) {
        switch (entry.name) {
            case 'ai-calculation':
                this.recordAICalculationTime(entry.duration);
                break;
            case 'collision-detection':
                this.recordCollisionDetectionTime(entry.duration);
                break;
        }
    }

    /**
     * Start frame rate monitoring for current frame
     */
    startFrameMonitoring() {
        this.frameStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * End frame rate monitoring and calculate FPS
     */
    endFrameMonitoring() {
        const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const frameTime = currentTime - this.frameStartTime;
        const fps = 1000 / frameTime;

        // Update frame rate history
        this.frameRateHistory.push(fps);
        if (this.frameRateHistory.length > this.frameRateHistorySize) {
            this.frameRateHistory.shift();
        }

        // Update metrics
        this.performanceMetrics.currentFPS = fps;
        this.performanceMetrics.averageFPS = this.calculateAverageFPS();
        this.performanceMetrics.minFPS = Math.min(...this.frameRateHistory);
        this.performanceMetrics.maxFPS = Math.max(...this.frameRateHistory);

        // Check for low FPS conditions
        this.checkLowFPSCondition(fps, currentTime);

        // Track consecutive poor/good frames for degradation manager
        if (fps < this.poorFPSThreshold) {
            this.consecutivePoorFrames++;
            this.consecutiveGoodFrames = 0;
        } else if (fps > this.goodFPSThreshold) {
            this.consecutiveGoodFrames++;
            this.consecutivePoorFrames = 0;
        } else {
            this.consecutivePoorFrames = 0;
            this.consecutiveGoodFrames = 0;
        }

        this.frameCount++;
        this.lastFrameTime = currentTime;
    }

    /**
     * Calculate average FPS from history
     * @returns {number} Average FPS
     */
    calculateAverageFPS() {
        if (this.frameRateHistory.length === 0) return 60;

        const sum = this.frameRateHistory.reduce((acc, fps) => acc + fps, 0);
        return sum / this.frameRateHistory.length;
    }

    /**
     * Check for low FPS condition and track duration
     * @param {number} currentFPS - Current frame rate
     * @param {number} currentTime - Current timestamp
     */
    checkLowFPSCondition(currentFPS, currentTime) {
        if (currentFPS < this.frameRateThreshold) {
            if (this.lowFPSStartTime === null) {
                this.lowFPSStartTime = currentTime;
            }
            this.lowFPSDuration = currentTime - this.lowFPSStartTime;
        } else {
            // Reset low FPS tracking when performance recovers
            this.lowFPSStartTime = null;
            this.lowFPSDuration = 0;
        }
    }

    /**
     * Check if performance degradation threshold has been exceeded
     * @returns {boolean} True if degradation threshold exceeded
     */
    isPerformanceDegradationDetected() {
        return this.lowFPSDuration >= this.lowFPSThreshold;
    }

    /**
     * Start AI calculation time measurement
     * @param {string} aiId - AI entity identifier
     */
    startAICalculation(aiId) {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`ai-calculation-start-${aiId}`);
        }
        this.aiCalculationStartTime =
            typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * End AI calculation time measurement
     * @param {string} aiId - AI entity identifier
     */
    endAICalculation(aiId) {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const calculationTime = endTime - this.aiCalculationStartTime;

        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            performance.mark(`ai-calculation-end-${aiId}`);
            performance.measure(
                'ai-calculation',
                `ai-calculation-start-${aiId}`,
                `ai-calculation-end-${aiId}`
            );
        }

        this.recordAICalculationTime(calculationTime);
    }

    /**
     * Record AI calculation time in history
     * @param {number} calculationTime - Time taken for AI calculation in milliseconds
     */
    recordAICalculationTime(calculationTime) {
        this.aiCalculationHistory.push(calculationTime);
        if (this.aiCalculationHistory.length > this.aiCalculationHistorySize) {
            this.aiCalculationHistory.shift();
        }

        // Update metrics
        this.performanceMetrics.aiCalculationTime = calculationTime;
        this.performanceMetrics.averageAICalculationTime = this.calculateAverageAICalculationTime();
        this.performanceMetrics.maxAICalculationTime = Math.max(...this.aiCalculationHistory);

        // Check for performance warnings
        if (calculationTime > this.aiCalculationTimeTarget) {
            this.addPerformanceWarning(
                `AI calculation time exceeded target: ${calculationTime.toFixed(2)}ms > ${this.aiCalculationTimeTarget}ms`
            );
        }
    }

    /**
     * Calculate average AI calculation time
     * @returns {number} Average AI calculation time in milliseconds
     */
    calculateAverageAICalculationTime() {
        if (this.aiCalculationHistory.length === 0) return 0;

        const sum = this.aiCalculationHistory.reduce((acc, time) => acc + time, 0);
        return sum / this.aiCalculationHistory.length;
    }

    /**
     * Start collision detection time measurement
     */
    startCollisionDetection() {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark('collision-detection-start');
        }
        this.collisionDetectionStartTime =
            typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * End collision detection time measurement
     */
    endCollisionDetection() {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const detectionTime = endTime - this.collisionDetectionStartTime;

        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            performance.mark('collision-detection-end');
            performance.measure(
                'collision-detection',
                'collision-detection-start',
                'collision-detection-end'
            );
        }

        this.recordCollisionDetectionTime(detectionTime);
    }

    /**
     * Record collision detection time in history
     * @param {number} detectionTime - Time taken for collision detection in milliseconds
     */
    recordCollisionDetectionTime(detectionTime) {
        this.collisionDetectionHistory.push(detectionTime);
        if (this.collisionDetectionHistory.length > this.collisionDetectionHistorySize) {
            this.collisionDetectionHistory.shift();
        }

        // Update metrics
        this.performanceMetrics.collisionDetectionTime = detectionTime;
        this.performanceMetrics.averageCollisionDetectionTime =
            this.calculateAverageCollisionDetectionTime();
        this.performanceMetrics.maxCollisionDetectionTime = Math.max(
            ...this.collisionDetectionHistory
        );

        // Check for performance warnings
        if (detectionTime > this.collisionDetectionTimeTarget) {
            this.addPerformanceWarning(
                `Collision detection time exceeded target: ${detectionTime.toFixed(2)}ms > ${this.collisionDetectionTimeTarget}ms`
            );
        }
    }

    /**
     * Calculate average collision detection time
     * @returns {number} Average collision detection time in milliseconds
     */
    calculateAverageCollisionDetectionTime() {
        if (this.collisionDetectionHistory.length === 0) return 0;

        const sum = this.collisionDetectionHistory.reduce((acc, time) => acc + time, 0);
        return sum / this.collisionDetectionHistory.length;
    }

    /**
     * Monitor memory usage (if available)
     */
    monitorMemoryUsage() {
        const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

        if (currentTime - this.lastMemoryCheck < this.memoryCheckInterval) {
            return; // Skip if not enough time has passed
        }

        this.lastMemoryCheck = currentTime;

        // Check for memory API availability
        if (typeof performance !== 'undefined' && performance.memory) {
            const memoryInfo = performance.memory;
            /** @type {any} */
            this.performanceMetrics.memoryUsage = {
                usedJSHeapSize: memoryInfo.usedJSHeapSize,
                totalJSHeapSize: memoryInfo.totalJSHeapSize,
                jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
                usedMB: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
                totalMB: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
            };

            // Check for memory warnings
            const memoryUsagePercent =
                (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
            if (memoryUsagePercent > 80) {
                this.addPerformanceWarning(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
            }
        } else {
            /** @type {any} */
            this.performanceMetrics.memoryUsage = {
                usedMB: 'N/A',
                totalMB: 'N/A',
                message: 'Memory API not available',
            };
        }
    }

    /**
     * Add a performance warning
     * @param {string} warning - Warning message
     */
    addPerformanceWarning(warning) {
        const timestamp = new Date().toISOString();
        const warningEntry = { timestamp, warning };

        this.performanceMetrics.performanceWarnings.push(warningEntry);

        // Keep only last 10 warnings
        if (this.performanceMetrics.performanceWarnings.length > 10) {
            this.performanceMetrics.performanceWarnings.shift();
        }

        // Log warning for debugging
        logger.debug(`Performance Warning: ${warning}`);
    }

    /**
     * Get current performance metrics
     * @returns {Object} Current performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            frameCount: this.frameCount,
            lowFPSDuration: this.lowFPSDuration,
            isPerformanceDegraded: this.isPerformanceDegradationDetected(),
            consecutivePoorFrames: this.consecutivePoorFrames,
            consecutiveGoodFrames: this.consecutiveGoodFrames,
        };
    }

    /**
     * Enable performance reporting
     * @param {boolean} enabled - Whether to enable reporting
     */
    setReportingEnabled(enabled) {
        this.reportingEnabled = enabled;
    }

    /**
     * Generate performance report if reporting is enabled
     */
    generatePerformanceReport() {
        if (!this.reportingEnabled) return;

        const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (currentTime - this.lastReport < this.reportingInterval) {
            return; // Skip if not enough time has passed
        }

        this.lastReport = currentTime;

        const metrics = this.getPerformanceMetrics();

        logger.info('=== Performance Report ===');
        logger.info(
            `Frame Rate: ${metrics.currentFPS.toFixed(1)} FPS (avg: ${metrics.averageFPS.toFixed(1)}, min: ${metrics.minFPS.toFixed(1)}, max: ${metrics.maxFPS.toFixed(1)})`
        );
        logger.info(
            `AI Calculation: ${metrics.aiCalculationTime.toFixed(2)}ms (avg: ${metrics.averageAICalculationTime.toFixed(2)}ms, max: ${metrics.maxAICalculationTime.toFixed(2)}ms)`
        );
        logger.info(
            `Collision Detection: ${metrics.collisionDetectionTime.toFixed(2)}ms (avg: ${metrics.averageCollisionDetectionTime.toFixed(2)}ms, max: ${metrics.maxCollisionDetectionTime.toFixed(2)}ms)`
        );

        if (metrics.memoryUsage && typeof metrics.memoryUsage === 'object') {
            logger.info(
                `Memory Usage: ${metrics.memoryUsage.usedMB}MB / ${metrics.memoryUsage.totalMB}MB`
            );
        }

        if (metrics.performanceWarnings.length > 0) {
            logger.info('Recent Warnings:');
            metrics.performanceWarnings.slice(-3).forEach((warning) => {
                logger.info(`  - ${warning.warning}`);
            });
        }

        logger.info('========================');
    }

    /**
     * Update performance monitoring (call once per frame)
     */
    update() {
        this.endFrameMonitoring();
        this.monitorMemoryUsage();
        this.generatePerformanceReport();
        this.startFrameMonitoring(); // Prepare for next frame
    }

    /**
     * Reset performance monitoring
     */
    reset() {
        this.frameRateHistory = [];
        this.aiCalculationHistory = [];
        this.collisionDetectionHistory = [];
        this.frameCount = 0;
        this.lowFPSStartTime = null;
        this.lowFPSDuration = 0;
        this.performanceMetrics.performanceWarnings = [];
        this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.lastMemoryCheck = 0;
        this.lastReport = 0;
    }

    /**
     * Get performance summary for display
     * @returns {Object} Performance summary
     */
    getPerformanceSummary() {
        const metrics = this.getPerformanceMetrics();

        return {
            fps: Math.round(metrics.currentFPS),
            avgFPS: Math.round(metrics.averageFPS),
            aiTime: metrics.aiCalculationTime.toFixed(1),
            collisionTime: metrics.collisionDetectionTime.toFixed(1),
            memoryMB:
                metrics.memoryUsage && metrics.memoryUsage.usedMB
                    ? metrics.memoryUsage.usedMB
                    : 'N/A',
            warnings: metrics.performanceWarnings.length,
            degraded: metrics.isPerformanceDegraded,
        };
    }
}

module.exports = { PerformanceMonitor };
