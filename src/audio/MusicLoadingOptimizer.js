/**
 * MusicLoadingOptimizer - Optimizes music loading strategy to minimize startup delays
 * Implements intelligent preloading, progressive loading, and adaptive strategies
 */

const { MUSIC_SYSTEM_CONFIG } = require('./MusicConfig.js');
const { logger } = require('../utils/Logger.js');

class MusicLoadingOptimizer {
    constructor(performanceMonitor = null) {
        this.performanceMonitor = performanceMonitor;
        this.loadingHistory = [];
        this.networkConditions = {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false,
        };
        this.deviceCapabilities = {
            memory: 'unknown',
            cores: navigator.hardwareConcurrency || 4,
            isMobile: this._detectMobile(),
        };

        // Initialize network monitoring
        this._initializeNetworkMonitoring();
        this._detectDeviceCapabilities();
    }

    /**
     * Determine optimal loading strategy for given tracks
     * @param {Array} tracks - Array of track configurations
     * @param {Object} options - Loading options
     * @returns {Object} Optimized loading strategy
     */
    optimizeLoadingStrategy(tracks, options = {}) {
        const {
            priorityTrack = null,
            maxConcurrentLoads = this._getOptimalConcurrency(),
            respectDataSaver = true,
            minimizeStartupDelay = true,
        } = options;

        const strategy = {
            immediate: [], // Load immediately (blocking)
            background: [], // Load in background (non-blocking)
            onDemand: [], // Load only when needed
            deferred: [], // Load after initial game load
            loadingOrder: [],
            estimatedTime: 0,
            concurrency: maxConcurrentLoads,
        };

        // Analyze tracks and categorize
        for (const track of tracks) {
            const category = this._categorizeTrack(track, priorityTrack, respectDataSaver);
            strategy[category].push(track);
        }

        // Optimize loading order within categories
        strategy.immediate = this._optimizeLoadingOrder(strategy.immediate, 'immediate');
        strategy.background = this._optimizeLoadingOrder(strategy.background, 'background');
        strategy.onDemand = this._optimizeLoadingOrder(strategy.onDemand, 'onDemand');
        strategy.deferred = this._optimizeLoadingOrder(strategy.deferred, 'deferred');

        // Create overall loading order
        strategy.loadingOrder = [
            ...strategy.immediate,
            ...strategy.background.slice(0, maxConcurrentLoads),
            ...strategy.deferred,
        ];

        // Estimate total loading time
        strategy.estimatedTime = this._estimateLoadingTime(strategy);

        // Add optimization recommendations
        strategy.recommendations = this._generateLoadingRecommendations(strategy);

        return strategy;
    }

    /**
     * Implement progressive loading with priority-based scheduling
     * @param {Array} tracks - Tracks to load
     * @param {Function} onProgress - Progress callback
     * @param {Function} onTrackLoaded - Individual track loaded callback
     * @returns {Promise<Object>} Loading results
     */
    async progressiveLoad(tracks, onProgress = null, onTrackLoaded = null) {
        const strategy = this.optimizeLoadingStrategy(tracks);
        const results = {
            loaded: [],
            failed: [],
            totalTime: 0,
            phases: {},
        };

        const startTime = performance.now();

        try {
            // Phase 1: Immediate loading (blocking)
            if (strategy.immediate.length > 0) {
                const phaseStart = performance.now();
                const immediateResults = await this._loadTracksSequentially(
                    strategy.immediate,
                    onProgress,
                    onTrackLoaded
                );
                results.phases.immediate = {
                    duration: performance.now() - phaseStart,
                    loaded: immediateResults.loaded,
                    failed: immediateResults.failed,
                };
                results.loaded.push(...immediateResults.loaded);
                results.failed.push(...immediateResults.failed);
            }

            // Phase 2: Background loading (concurrent)
            if (strategy.background.length > 0) {
                const phaseStart = performance.now();
                const backgroundPromise = this._loadTracksConcurrently(
                    strategy.background,
                    strategy.concurrency,
                    onProgress,
                    onTrackLoaded
                );

                // Don't wait for background loading to complete
                backgroundPromise.then((backgroundResults) => {
                    results.phases.background = {
                        duration: performance.now() - phaseStart,
                        loaded: backgroundResults.loaded,
                        failed: backgroundResults.failed,
                    };
                    results.loaded.push(...backgroundResults.loaded);
                    results.failed.push(...backgroundResults.failed);
                });
            }

            // Phase 3: Deferred loading (after initial phases)
            if (strategy.deferred.length > 0) {
                setTimeout(async () => {
                    const phaseStart = performance.now();
                    const deferredResults = await this._loadTracksConcurrently(
                        strategy.deferred,
                        Math.max(1, Math.floor(strategy.concurrency / 2)),
                        onProgress,
                        onTrackLoaded
                    );
                    results.phases.deferred = {
                        duration: performance.now() - phaseStart,
                        loaded: deferredResults.loaded,
                        failed: deferredResults.failed,
                    };
                    results.loaded.push(...deferredResults.loaded);
                    results.failed.push(...deferredResults.failed);
                }, 2000); // 2 second delay
            }
        } catch (error) {
            logger.error('Progressive loading error:', { error });
        }

        results.totalTime = performance.now() - startTime;
        return results;
    }

    /**
     * Adapt loading strategy based on current conditions
     * @param {Object} currentStrategy - Current loading strategy
     * @returns {Object} Adapted strategy
     */
    adaptStrategy(currentStrategy) {
        const adaptations = [];
        const newStrategy = { ...currentStrategy };

        // Adapt based on network conditions
        if (
            this.networkConditions.effectiveType === 'slow-2g' ||
            this.networkConditions.effectiveType === '2g'
        ) {
            // Move background tracks to on-demand for slow connections
            newStrategy.onDemand.push(...newStrategy.background);
            newStrategy.background = [];
            adaptations.push('Moved background tracks to on-demand due to slow network');
        }

        // Adapt based on data saver mode
        if (this.networkConditions.saveData) {
            // Move all non-immediate tracks to on-demand
            newStrategy.onDemand.push(...newStrategy.background, ...newStrategy.deferred);
            newStrategy.background = [];
            newStrategy.deferred = [];
            adaptations.push('Enabled on-demand loading due to data saver mode');
        }

        // Adapt based on memory constraints
        if (this.deviceCapabilities.memory === 'low') {
            // Reduce concurrent loading
            newStrategy.concurrency = Math.max(1, Math.floor(newStrategy.concurrency / 2));
            adaptations.push('Reduced concurrency due to low memory');
        }

        // Adapt based on loading history
        const recentFailures = this._getRecentFailures();
        if (recentFailures.length > 2) {
            // Be more conservative with loading
            newStrategy.concurrency = Math.max(1, newStrategy.concurrency - 1);
            adaptations.push('Reduced concurrency due to recent loading failures');
        }

        newStrategy.adaptations = adaptations;
        return newStrategy;
    }

    /**
     * Get optimal concurrency based on device and network conditions
     * @returns {number} Optimal number of concurrent loads
     * @private
     */
    _getOptimalConcurrency() {
        let concurrency = 3; // Default

        // Adjust based on network conditions
        if (this.networkConditions.effectiveType === '4g') {
            concurrency = 4;
        } else if (this.networkConditions.effectiveType === '3g') {
            concurrency = 2;
        } else if (
            this.networkConditions.effectiveType === 'slow-2g' ||
            this.networkConditions.effectiveType === '2g'
        ) {
            concurrency = 1;
        }

        // Adjust based on device capabilities
        if (this.deviceCapabilities.cores >= 8) {
            concurrency += 1;
        } else if (this.deviceCapabilities.cores <= 2) {
            concurrency = Math.max(1, concurrency - 1);
        }

        // Adjust based on memory
        if (this.deviceCapabilities.memory === 'low') {
            concurrency = Math.max(1, Math.floor(concurrency / 2));
        }

        return Math.min(concurrency, 6); // Cap at 6 concurrent loads
    }

    /**
     * Categorize a track for loading strategy
     * @param {Object} track - Track configuration
     * @param {string} priorityTrack - Priority track ID
     * @param {boolean} respectDataSaver - Whether to respect data saver mode
     * @returns {string} Loading category
     * @private
     */
    _categorizeTrack(track, priorityTrack, respectDataSaver) {
        // Priority track gets immediate loading
        if (track.id === priorityTrack) {
            return 'immediate';
        }

        // Data saver mode - only load on demand
        if (respectDataSaver && this.networkConditions.saveData) {
            return 'onDemand';
        }

        // Small tracks can be loaded immediately
        if (track.estimatedSize && track.estimatedSize < 1024 * 1024) {
            // < 1MB
            return 'background';
        }

        // High-priority tracks based on energy level
        if (track.energyLevel === 'ambient' || track.preload === true) {
            return 'background';
        }

        // Slow network - defer non-essential tracks
        if (
            this.networkConditions.effectiveType === 'slow-2g' ||
            this.networkConditions.effectiveType === '2g'
        ) {
            return 'onDemand';
        }

        // Default to deferred loading
        return 'deferred';
    }

    /**
     * Optimize loading order within a category
     * @param {Array} tracks - Tracks to order
     * @param {string} category - Loading category
     * @returns {Array} Optimized track order
     * @private
     */
    _optimizeLoadingOrder(tracks, category) {
        if (tracks.length <= 1) return tracks;

        return tracks.sort((a, b) => {
            // Sort by priority factors
            let scoreA = 0;
            let scoreB = 0;

            // Prefer smaller files for faster loading
            if (a.estimatedSize && b.estimatedSize) {
                scoreA += (b.estimatedSize - a.estimatedSize) / 1000; // Smaller is better
            }

            // Prefer tracks marked for preload
            if (a.preload) scoreA += 10;
            if (b.preload) scoreB += 10;

            // Prefer ambient tracks (likely to be used first)
            if (a.energyLevel === 'ambient') scoreA += 5;
            if (b.energyLevel === 'ambient') scoreB += 5;

            // Consider loading history (prefer tracks that loaded successfully before)
            const aHistory = this._getTrackLoadingHistory(a.id);
            const bHistory = this._getTrackLoadingHistory(b.id);

            if (aHistory.successRate > bHistory.successRate) scoreA += 3;
            if (bHistory.successRate > aHistory.successRate) scoreB += 3;

            return scoreB - scoreA; // Higher score first
        });
    }

    /**
     * Load tracks sequentially
     * @param {Array} tracks - Tracks to load
     * @param {Function} onProgress - Progress callback
     * @param {Function} onTrackLoaded - Track loaded callback
     * @returns {Promise<Object>} Loading results
     * @private
     */
    async _loadTracksSequentially(tracks, onProgress, onTrackLoaded) {
        const results = { loaded: [], failed: [] };

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const startTime = performance.now();

            try {
                // Record loading start
                if (this.performanceMonitor) {
                    this.performanceMonitor.recordLoadingStart(track.id, track.estimatedSize);
                }

                // Simulate track loading (actual implementation would load the track)
                await this._simulateTrackLoading(track);

                const loadTime = performance.now() - startTime;
                this._recordLoadingResult(track.id, true, loadTime);

                results.loaded.push(track.id);

                if (onTrackLoaded) {
                    onTrackLoaded(track.id, true, loadTime);
                }

                if (onProgress) {
                    onProgress((i + 1) / tracks.length, track.id);
                }
            } catch (error) {
                const loadTime = performance.now() - startTime;
                this._recordLoadingResult(track.id, false, loadTime, error.message);

                results.failed.push({ trackId: track.id, error: error.message });

                if (onTrackLoaded) {
                    onTrackLoaded(track.id, false, loadTime, error);
                }
            }
        }

        return results;
    }

    /**
     * Load tracks concurrently with limited concurrency
     * @param {Array} tracks - Tracks to load
     * @param {number} concurrency - Maximum concurrent loads
     * @param {Function} onProgress - Progress callback
     * @param {Function} onTrackLoaded - Track loaded callback
     * @returns {Promise<Object>} Loading results
     * @private
     */
    async _loadTracksConcurrently(tracks, concurrency, onProgress, onTrackLoaded) {
        const results = { loaded: [], failed: [] };
        const semaphore = new Array(concurrency).fill(null);
        let completed = 0;

        const loadTrack = async (track) => {
            const startTime = performance.now();

            try {
                if (this.performanceMonitor) {
                    this.performanceMonitor.recordLoadingStart(track.id, track.estimatedSize);
                }

                await this._simulateTrackLoading(track);

                const loadTime = performance.now() - startTime;
                this._recordLoadingResult(track.id, true, loadTime);

                results.loaded.push(track.id);

                if (onTrackLoaded) {
                    onTrackLoaded(track.id, true, loadTime);
                }
            } catch (error) {
                const loadTime = performance.now() - startTime;
                this._recordLoadingResult(track.id, false, loadTime, error.message);

                results.failed.push({ trackId: track.id, error: error.message });

                if (onTrackLoaded) {
                    onTrackLoaded(track.id, false, loadTime, error);
                }
            }

            completed++;
            if (onProgress) {
                onProgress(completed / tracks.length, track.id);
            }
        };

        // Process tracks with concurrency limit
        const promises = [];
        for (let i = 0; i < tracks.length; i += concurrency) {
            const batch = tracks.slice(i, i + concurrency);
            const batchPromises = batch.map((track) => loadTrack(track));
            promises.push(...batchPromises);

            // Wait for current batch to complete before starting next
            await Promise.allSettled(batchPromises);
        }

        await Promise.allSettled(promises);
        return results;
    }

    /**
     * Simulate track loading (placeholder for actual loading logic)
     * @param {Object} track - Track to load
     * @returns {Promise<void>} Loading promise
     * @private
     */
    async _simulateTrackLoading(track) {
        // Simulate loading time based on file size and network conditions
        const baseTime = track.estimatedSize ? (track.estimatedSize / 1024 / 1024) * 1000 : 2000; // 1s per MB
        const networkMultiplier = this._getNetworkSpeedMultiplier();
        const loadTime = baseTime * networkMultiplier;

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional failures
                if (Math.random() < 0.05) {
                    // 5% failure rate
                    reject(new Error('Simulated loading failure'));
                } else {
                    resolve();
                }
            }, loadTime);
        });
    }

    /**
     * Get network speed multiplier for loading time estimation
     * @returns {number} Speed multiplier
     * @private
     */
    _getNetworkSpeedMultiplier() {
        switch (this.networkConditions.effectiveType) {
            case '4g':
                return 0.5;
            case '3g':
                return 1.0;
            case '2g':
                return 3.0;
            case 'slow-2g':
                return 6.0;
            default:
                return 1.0;
        }
    }

    /**
     * Record loading result for history tracking
     * @param {string} trackId - Track identifier
     * @param {boolean} success - Whether loading was successful
     * @param {number} loadTime - Loading time in milliseconds
     * @param {string} error - Error message if failed
     * @private
     */
    _recordLoadingResult(trackId, success, loadTime, error = null) {
        const result = {
            trackId: trackId,
            success: success,
            loadTime: loadTime,
            error: error,
            timestamp: Date.now(),
            networkConditions: { ...this.networkConditions },
        };

        this.loadingHistory.push(result);

        // Keep history manageable
        if (this.loadingHistory.length > 100) {
            this.loadingHistory = this.loadingHistory.slice(-50);
        }
    }

    /**
     * Get loading history for a specific track
     * @param {string} trackId - Track identifier
     * @returns {Object} Track loading history
     * @private
     */
    _getTrackLoadingHistory(trackId) {
        const trackHistory = this.loadingHistory.filter((entry) => entry.trackId === trackId);
        const successCount = trackHistory.filter((entry) => entry.success).length;

        return {
            attempts: trackHistory.length,
            successes: successCount,
            failures: trackHistory.length - successCount,
            successRate: trackHistory.length > 0 ? successCount / trackHistory.length : 0,
            averageLoadTime:
                trackHistory.length > 0
                    ? trackHistory.reduce((sum, entry) => sum + entry.loadTime, 0) /
                      trackHistory.length
                    : 0,
        };
    }

    /**
     * Get recent loading failures
     * @returns {Array} Recent failure entries
     * @private
     */
    _getRecentFailures() {
        const recentTime = Date.now() - 5 * 60 * 1000; // Last 5 minutes
        return this.loadingHistory.filter(
            (entry) => !entry.success && entry.timestamp > recentTime
        );
    }

    /**
     * Estimate total loading time for a strategy
     * @param {Object} strategy - Loading strategy
     * @returns {number} Estimated time in milliseconds
     * @private
     */
    _estimateLoadingTime(strategy) {
        let totalTime = 0;

        // Immediate loading (sequential)
        for (const track of strategy.immediate) {
            const baseTime = track.estimatedSize
                ? (track.estimatedSize / 1024 / 1024) * 1000
                : 2000;
            totalTime += baseTime * this._getNetworkSpeedMultiplier();
        }

        // Background loading (concurrent)
        if (strategy.background.length > 0) {
            const maxTrackTime = Math.max(
                ...strategy.background.map((track) => {
                    const baseTime = track.estimatedSize
                        ? (track.estimatedSize / 1024 / 1024) * 1000
                        : 2000;
                    return baseTime * this._getNetworkSpeedMultiplier();
                })
            );
            totalTime += maxTrackTime; // Concurrent loading time is limited by slowest track
        }

        return totalTime;
    }

    /**
     * Generate loading recommendations
     * @param {Object} strategy - Loading strategy
     * @returns {Array} Array of recommendations
     * @private
     */
    _generateLoadingRecommendations(strategy) {
        const recommendations = [];

        if (strategy.immediate.length > 3) {
            recommendations.push({
                type: 'performance',
                message: 'Consider reducing immediate loading tracks to improve startup time',
                priority: 'medium',
            });
        }

        if (this.networkConditions.saveData && strategy.background.length > 0) {
            recommendations.push({
                type: 'data_usage',
                message: 'Data saver mode detected - consider on-demand loading only',
                priority: 'high',
            });
        }

        if (strategy.estimatedTime > 10000) {
            recommendations.push({
                type: 'performance',
                message: 'Long loading time estimated - consider progressive loading',
                priority: 'high',
            });
        }

        return recommendations;
    }

    /**
     * Initialize network condition monitoring
     * @private
     */
    _initializeNetworkMonitoring() {
        if ('connection' in navigator) {
            /** @type {any} */
            const connection = navigator.connection;
            this.networkConditions = {
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false,
            };

            // Listen for network changes
            connection.addEventListener('change', () => {
                this.networkConditions = {
                    effectiveType: connection.effectiveType || 'unknown',
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0,
                    saveData: connection.saveData || false,
                };
            });
        }
    }

    /**
     * Detect device capabilities
     * @private
     */
    _detectDeviceCapabilities() {
        // Detect memory level
        if ('memory' in performance) {
            const memInfo = performance.memory;
            if (memInfo.jsHeapSizeLimit < 1024 * 1024 * 1024) {
                // < 1GB
                this.deviceCapabilities.memory = 'low';
            } else if (memInfo.jsHeapSizeLimit < 4 * 1024 * 1024 * 1024) {
                // < 4GB
                this.deviceCapabilities.memory = 'medium';
            } else {
                this.deviceCapabilities.memory = 'high';
            }
        }
    }

    /**
     * Detect if device is mobile
     * @returns {boolean} True if mobile device
     * @private
     */
    _detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.loadingHistory = [];
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicLoadingOptimizer };
