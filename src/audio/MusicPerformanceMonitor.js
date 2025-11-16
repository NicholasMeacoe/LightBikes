/**
 * MusicPerformanceMonitor - Performance monitoring and optimization for music system
 * Tracks memory usage, loading performance, frame rate impact, and provides optimization recommendations
 */

const { MUSIC_SYSTEM_CONFIG } = require('./MusicConfig.js');

class MusicPerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: {
                audioBuffers: 0,
                totalAllocated: 0,
                peakUsage: 0,
                lastCleanup: Date.now()
            },
            loading: {
                totalTracks: 0,
                loadedTracks: 0,
                failedTracks: 0,
                averageLoadTime: 0,
                loadTimes: []
            },
            playback: {
                totalPlayTime: 0,
                fadeOperations: 0,
                duckingOperations: 0,
                contextSwitches: 0,
                lastPerformanceCheck: Date.now()
            },
            frameRate: {
                baseline: 0,
                current: 0,
                impactDetected: false,
                measurements: []
            }
        };
        
        this.performanceObserver = null;
        this.memoryCleanupInterval = null;
        this.frameRateMonitor = null;
        
        // Initialize monitoring
        this._initializeMonitoring();
    }
    
    /**
     * Start monitoring music system performance
     */
    startMonitoring() {
        this._startMemoryMonitoring();
        this._startFrameRateMonitoring();
        this._startPerformanceObserver();
        
        console.log('Music performance monitoring started');
    }
    
    /**
     * Stop all performance monitoring
     */
    stopMonitoring() {
        this._stopMemoryMonitoring();
        this._stopFrameRateMonitoring();
        this._stopPerformanceObserver();
        
        console.log('Music performance monitoring stopped');
    }
    
    /**
     * Record track loading start
     * @param {string} trackId - Track identifier
     * @param {number} fileSize - File size in bytes (optional)
     */
    recordLoadingStart(trackId, fileSize = 0) {
        const loadingEntry = {
            trackId: trackId,
            startTime: performance.now(),
            fileSize: fileSize,
            completed: false
        };
        
        this.metrics.loading.loadTimes.push(loadingEntry);
        this.metrics.loading.totalTracks++;
    }
    
    /**
     * Record track loading completion
     * @param {string} trackId - Track identifier
     * @param {boolean} success - Whether loading was successful
     * @param {AudioBuffer} audioBuffer - Loaded audio buffer (optional)
     */
    recordLoadingComplete(trackId, success, audioBuffer = null) {
        const loadingEntry = this.metrics.loading.loadTimes.find(
            entry => entry.trackId === trackId && !entry.completed
        );
        
        if (loadingEntry) {
            loadingEntry.completed = true;
            loadingEntry.endTime = performance.now();
            loadingEntry.duration = loadingEntry.endTime - loadingEntry.startTime;
            loadingEntry.success = success;
            
            if (success) {
                this.metrics.loading.loadedTracks++;
                
                // Record memory usage if buffer provided
                if (audioBuffer) {
                    this._recordAudioBufferMemory(trackId, audioBuffer);
                }
                
                // Update average load time
                this._updateAverageLoadTime();
            } else {
                this.metrics.loading.failedTracks++;
            }
        }
    }
    
    /**
     * Record fade operation performance
     * @param {string} type - Fade type ('in', 'out', 'transition')
     * @param {number} duration - Fade duration in seconds
     */
    recordFadeOperation(type, duration) {
        this.metrics.playback.fadeOperations++;
        
        // Monitor for excessive fade operations that might impact performance
        const recentFades = this.metrics.playback.fadeOperations;
        if (recentFades > MUSIC_SYSTEM_CONFIG.MAX_CONCURRENT_FADE_OPERATIONS) {
            console.warn('High number of concurrent fade operations detected:', recentFades);
        }
    }
    
    /**
     * Record ducking operation
     * @param {number} duckLevel - Ducking level (0.0 to 1.0)
     * @param {number} duration - Ducking duration in seconds
     */
    recordDuckingOperation(duckLevel, duration) {
        this.metrics.playback.duckingOperations++;
    }
    
    /**
     * Record audio context switch or recreation
     */
    recordContextSwitch() {
        this.metrics.playback.contextSwitches++;
        
        // Context switches can be expensive, warn if too frequent
        if (this.metrics.playback.contextSwitches > 5) {
            console.warn('Frequent audio context switches detected - may impact performance');
        }
    }
    
    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics summary
     */
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now(),
            recommendations: this._generateRecommendations()
        };
    }
    
    /**
     * Get memory usage summary
     * @returns {Object} Memory usage information
     */
    getMemoryUsage() {
        return {
            audioBuffers: this.metrics.memory.audioBuffers,
            totalAllocated: this.metrics.memory.totalAllocated,
            peakUsage: this.metrics.memory.peakUsage,
            lastCleanup: this.metrics.memory.lastCleanup,
            recommendedCleanup: this._shouldPerformCleanup()
        };
    }
    
    /**
     * Get loading performance summary
     * @returns {Object} Loading performance information
     */
    getLoadingPerformance() {
        const successRate = this.metrics.loading.totalTracks > 0 
            ? (this.metrics.loading.loadedTracks / this.metrics.loading.totalTracks) * 100 
            : 0;
            
        return {
            totalTracks: this.metrics.loading.totalTracks,
            loadedTracks: this.metrics.loading.loadedTracks,
            failedTracks: this.metrics.loading.failedTracks,
            successRate: successRate,
            averageLoadTime: this.metrics.loading.averageLoadTime,
            slowestLoad: this._getSlowestLoadTime(),
            fastestLoad: this._getFastestLoadTime()
        };
    }
    
    /**
     * Get frame rate impact assessment
     * @returns {Object} Frame rate impact information
     */
    getFrameRateImpact() {
        return {
            baseline: this.metrics.frameRate.baseline,
            current: this.metrics.frameRate.current,
            impactDetected: this.metrics.frameRate.impactDetected,
            impactPercentage: this._calculateFrameRateImpact(),
            recommendation: this._getFrameRateRecommendation()
        };
    }
    
    /**
     * Trigger memory cleanup for unused audio buffers
     * @returns {Object} Cleanup results
     */
    performMemoryCleanup() {
        const beforeCleanup = this.metrics.memory.totalAllocated;
        
        // This would be called by the music system to clean up unused buffers
        // The actual cleanup is performed by the MusicTrackManager
        
        this.metrics.memory.lastCleanup = Date.now();
        
        const afterCleanup = this.metrics.memory.totalAllocated;
        const freedMemory = beforeCleanup - afterCleanup;
        
        return {
            freedMemory: freedMemory,
            beforeCleanup: beforeCleanup,
            afterCleanup: afterCleanup,
            timestamp: Date.now()
        };
    }
    
    /**
     * Check if performance optimization is needed
     * @returns {boolean} True if optimization is recommended
     */
    needsOptimization() {
        const recommendations = this._generateRecommendations();
        return recommendations.length > 0;
    }
    
    /**
     * Get optimization recommendations
     * @returns {Array} Array of optimization recommendations
     */
    getOptimizationRecommendations() {
        return this._generateRecommendations();
    }
    
    /**
     * Reset all performance metrics
     */
    resetMetrics() {
        this.metrics = {
            memory: {
                audioBuffers: 0,
                totalAllocated: 0,
                peakUsage: 0,
                lastCleanup: Date.now()
            },
            loading: {
                totalTracks: 0,
                loadedTracks: 0,
                failedTracks: 0,
                averageLoadTime: 0,
                loadTimes: []
            },
            playback: {
                totalPlayTime: 0,
                fadeOperations: 0,
                duckingOperations: 0,
                contextSwitches: 0,
                lastPerformanceCheck: Date.now()
            },
            frameRate: {
                baseline: 0,
                current: 0,
                impactDetected: false,
                measurements: []
            }
        };
    }
    
    /**
     * Initialize performance monitoring systems
     * @private
     */
    _initializeMonitoring() {
        // Set up periodic cleanup check
        this.memoryCleanupInterval = setInterval(() => {
            if (this._shouldPerformCleanup()) {
                console.log('Memory cleanup recommended for music system');
            }
        }, MUSIC_SYSTEM_CONFIG.AUDIO_BUFFER_CLEANUP_INTERVAL);
    }
    
    /**
     * Start memory usage monitoring
     * @private
     */
    _startMemoryMonitoring() {
        // Monitor memory usage if available
        if ('memory' in performance) {
            this._memoryMonitorInterval = setInterval(() => {
                this._checkMemoryUsage();
            }, 5000); // Check every 5 seconds
        }
    }
    
    /**
     * Stop memory monitoring
     * @private
     */
    _stopMemoryMonitoring() {
        if (this._memoryMonitorInterval) {
            clearInterval(this._memoryMonitorInterval);
            this._memoryMonitorInterval = null;
        }
    }
    
    /**
     * Start frame rate monitoring
     * @private
     */
    _startFrameRateMonitoring() {
        if ('requestAnimationFrame' in window) {
            let frameCount = 0;
            let lastTime = performance.now();
            
            const measureFrameRate = () => {
                frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - lastTime >= 1000) { // Every second
                    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                    this._recordFrameRate(fps);
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
            };
            
            this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
        }
    }
    
    /**
     * Stop frame rate monitoring
     * @private
     */
    _stopFrameRateMonitoring() {
        if (this.frameRateMonitor) {
            cancelAnimationFrame(this.frameRateMonitor);
            this.frameRateMonitor = null;
        }
    }
    
    /**
     * Start performance observer for detailed metrics
     * @private
     */
    _startPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name.includes('music') || entry.name.includes('audio')) {
                            this._recordPerformanceEntry(entry);
                        }
                    });
                });
                
                this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (error) {
                console.warn('Performance observer not available:', error);
            }
        }
    }
    
    /**
     * Stop performance observer
     * @private
     */
    _stopPerformanceObserver() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
    }
    
    /**
     * Record audio buffer memory usage
     * @param {string} trackId - Track identifier
     * @param {AudioBuffer} audioBuffer - Audio buffer
     * @private
     */
    _recordAudioBufferMemory(trackId, audioBuffer) {
        if (!audioBuffer) return;
        
        // Estimate memory usage: channels * length * 4 bytes per sample (32-bit float)
        const estimatedSize = audioBuffer.numberOfChannels * audioBuffer.length * 4;
        
        this.metrics.memory.audioBuffers++;
        this.metrics.memory.totalAllocated += estimatedSize;
        
        if (this.metrics.memory.totalAllocated > this.metrics.memory.peakUsage) {
            this.metrics.memory.peakUsage = this.metrics.memory.totalAllocated;
        }
    }
    
    /**
     * Update average loading time
     * @private
     */
    _updateAverageLoadTime() {
        const completedLoads = this.metrics.loading.loadTimes.filter(
            entry => entry.completed && entry.success
        );
        
        if (completedLoads.length > 0) {
            const totalTime = completedLoads.reduce((sum, entry) => sum + entry.duration, 0);
            this.metrics.loading.averageLoadTime = totalTime / completedLoads.length;
        }
    }
    
    /**
     * Get slowest loading time
     * @returns {number} Slowest load time in milliseconds
     * @private
     */
    _getSlowestLoadTime() {
        const completedLoads = this.metrics.loading.loadTimes.filter(
            entry => entry.completed && entry.success
        );
        
        return completedLoads.length > 0 
            ? Math.max(...completedLoads.map(entry => entry.duration))
            : 0;
    }
    
    /**
     * Get fastest loading time
     * @returns {number} Fastest load time in milliseconds
     * @private
     */
    _getFastestLoadTime() {
        const completedLoads = this.metrics.loading.loadTimes.filter(
            entry => entry.completed && entry.success
        );
        
        return completedLoads.length > 0 
            ? Math.min(...completedLoads.map(entry => entry.duration))
            : 0;
    }
    
    /**
     * Record frame rate measurement
     * @param {number} fps - Frames per second
     * @private
     */
    _recordFrameRate(fps) {
        this.metrics.frameRate.current = fps;
        this.metrics.frameRate.measurements.push({
            fps: fps,
            timestamp: Date.now()
        });
        
        // Keep only recent measurements
        if (this.metrics.frameRate.measurements.length > 60) {
            this.metrics.frameRate.measurements = this.metrics.frameRate.measurements.slice(-30);
        }
        
        // Set baseline if not set
        if (this.metrics.frameRate.baseline === 0) {
            this.metrics.frameRate.baseline = fps;
        }
        
        // Detect significant frame rate impact
        const impact = this._calculateFrameRateImpact();
        this.metrics.frameRate.impactDetected = impact > 10; // More than 10% drop
    }
    
    /**
     * Calculate frame rate impact percentage
     * @returns {number} Impact percentage
     * @private
     */
    _calculateFrameRateImpact() {
        if (this.metrics.frameRate.baseline === 0) return 0;
        
        const impact = ((this.metrics.frameRate.baseline - this.metrics.frameRate.current) / 
                       this.metrics.frameRate.baseline) * 100;
        
        return Math.max(0, impact);
    }
    
    /**
     * Get frame rate recommendation
     * @returns {string} Recommendation message
     * @private
     */
    _getFrameRateRecommendation() {
        const impact = this._calculateFrameRateImpact();
        
        if (impact > 20) {
            return 'Significant frame rate impact detected. Consider reducing audio quality or disabling music.';
        } else if (impact > 10) {
            return 'Moderate frame rate impact detected. Monitor performance closely.';
        } else {
            return 'No significant frame rate impact detected.';
        }
    }
    
    /**
     * Check if memory cleanup should be performed
     * @returns {boolean} True if cleanup is recommended
     * @private
     */
    _shouldPerformCleanup() {
        const timeSinceLastCleanup = Date.now() - this.metrics.memory.lastCleanup;
        const memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
        
        return timeSinceLastCleanup > MUSIC_SYSTEM_CONFIG.AUDIO_BUFFER_CLEANUP_INTERVAL ||
               this.metrics.memory.totalAllocated > memoryThreshold;
    }
    
    /**
     * Check current memory usage
     * @private
     */
    _checkMemoryUsage() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            
            // Log warning if memory usage is high
            if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.8) {
                console.warn('High memory usage detected - consider cleaning up audio buffers');
            }
        }
    }
    
    /**
     * Record performance entry from observer
     * @param {PerformanceEntry} entry - Performance entry
     * @private
     */
    _recordPerformanceEntry(entry) {
        // Record relevant performance entries for analysis
        if (entry.duration > 16) { // Longer than one frame at 60fps
            console.log(`Long-running music operation detected: ${entry.name} (${entry.duration}ms)`);
        }
    }
    
    /**
     * Generate optimization recommendations
     * @returns {Array} Array of recommendation objects
     * @private
     */
    _generateRecommendations() {
        const recommendations = [];
        
        // Memory recommendations
        if (this._shouldPerformCleanup()) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: 'Audio buffer cleanup recommended to free memory',
                action: 'cleanup_buffers'
            });
        }
        
        // Loading performance recommendations
        if (this.metrics.loading.averageLoadTime > 5000) {
            recommendations.push({
                type: 'loading',
                priority: 'high',
                message: 'Slow audio loading detected. Consider reducing file sizes or using compression',
                action: 'optimize_files'
            });
        }
        
        // Frame rate recommendations
        if (this.metrics.frameRate.impactDetected) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Frame rate impact detected. Consider reducing audio processing complexity',
                action: 'reduce_complexity'
            });
        }
        
        // Context switch recommendations
        if (this.metrics.playback.contextSwitches > 3) {
            recommendations.push({
                type: 'stability',
                priority: 'medium',
                message: 'Frequent audio context switches detected. Check for initialization issues',
                action: 'fix_context_handling'
            });
        }
        
        // Loading failure recommendations
        const failureRate = this.metrics.loading.totalTracks > 0 
            ? (this.metrics.loading.failedTracks / this.metrics.loading.totalTracks) * 100 
            : 0;
            
        if (failureRate > 20) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                message: 'High audio loading failure rate. Check network connectivity and file availability',
                action: 'improve_reliability'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Clean up monitoring resources
     */
    cleanup() {
        this.stopMonitoring();
        
        if (this.memoryCleanupInterval) {
            clearInterval(this.memoryCleanupInterval);
            this.memoryCleanupInterval = null;
        }
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicPerformanceMonitor };