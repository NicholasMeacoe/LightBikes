/**
 * MusicBufferManager - Efficient audio buffer management and memory optimization
 * Handles audio buffer lifecycle, memory cleanup, and loading strategy optimization
 */

const { MUSIC_SYSTEM_CONFIG } = require('./MusicConfig.js');
const { logger } = require('../utils/Logger.js');

class MusicBufferManager {
    constructor(performanceMonitor = null) {
        this.performanceMonitor = performanceMonitor;
        this.buffers = new Map(); // trackId -> buffer info
        this.loadingQueue = [];
        this.cleanupInterval = null;
        this.memoryThreshold = 50 * 1024 * 1024; // 50MB default threshold
        this.lastAccessTimes = new Map(); // trackId -> timestamp
        this.preloadStrategy = 'selective'; // 'all', 'selective', 'on-demand'

        // Initialize cleanup interval
        this._startCleanupInterval();
    }

    /**
     * Register an audio buffer with the manager
     * @param {string} trackId - Track identifier
     * @param {AudioBuffer} audioBuffer - Audio buffer to register
     * @param {Object} metadata - Additional metadata
     */
    registerBuffer(trackId, audioBuffer, metadata = {}) {
        if (!audioBuffer) return;

        const bufferInfo = {
            buffer: audioBuffer,
            size: this._calculateBufferSize(audioBuffer),
            registeredAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0,
            metadata: {
                duration: audioBuffer.duration,
                channels: audioBuffer.numberOfChannels,
                sampleRate: audioBuffer.sampleRate,
                ...metadata,
            },
        };

        this.buffers.set(trackId, bufferInfo);
        this.lastAccessTimes.set(trackId, Date.now());

        // Update performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.recordLoadingComplete(trackId, true, audioBuffer);
        }

        // Check if cleanup is needed
        this._checkMemoryUsage();
    }

    /**
     * Get an audio buffer and update access tracking
     * @param {string} trackId - Track identifier
     * @returns {AudioBuffer|null} Audio buffer or null if not found
     */
    getBuffer(trackId) {
        const bufferInfo = this.buffers.get(trackId);
        if (!bufferInfo) return null;

        // Update access tracking
        bufferInfo.lastAccessed = Date.now();
        bufferInfo.accessCount++;
        this.lastAccessTimes.set(trackId, Date.now());

        return bufferInfo.buffer;
    }

    /**
     * Remove a buffer from management
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if buffer was removed
     */
    removeBuffer(trackId) {
        const removed = this.buffers.delete(trackId);
        this.lastAccessTimes.delete(trackId);

        if (removed) {
            logger.info(`Removed audio buffer for track: ${trackId}`);
        }

        return removed;
    }

    /**
     * Check if a buffer is registered
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if buffer exists
     */
    hasBuffer(trackId) {
        return this.buffers.has(trackId);
    }

    /**
     * Get buffer information without accessing the buffer
     * @param {string} trackId - Track identifier
     * @returns {Object|null} Buffer information or null if not found
     */
    getBufferInfo(trackId) {
        const bufferInfo = this.buffers.get(trackId);
        if (!bufferInfo) return null;

        return {
            size: bufferInfo.size,
            registeredAt: bufferInfo.registeredAt,
            lastAccessed: bufferInfo.lastAccessed,
            accessCount: bufferInfo.accessCount,
            metadata: bufferInfo.metadata,
        };
    }

    /**
     * Get total memory usage of all managed buffers
     * @returns {Object} Memory usage information
     */
    getMemoryUsage() {
        let totalSize = 0;
        let bufferCount = 0;
        const bufferSizes = [];

        for (const bufferInfo of this.buffers.values()) {
            totalSize += bufferInfo.size;
            bufferCount++;
            bufferSizes.push(bufferInfo.size);
        }

        return {
            totalSize: totalSize,
            bufferCount: bufferCount,
            averageSize: bufferCount > 0 ? totalSize / bufferCount : 0,
            largestBuffer: bufferSizes.length > 0 ? Math.max(...bufferSizes) : 0,
            smallestBuffer: bufferSizes.length > 0 ? Math.min(...bufferSizes) : 0,
            memoryThreshold: this.memoryThreshold,
            utilizationPercentage: (totalSize / this.memoryThreshold) * 100,
        };
    }

    /**
     * Perform memory cleanup based on usage patterns
     * @param {Object} options - Cleanup options
     * @returns {Object} Cleanup results
     */
    performCleanup(options = {}) {
        const {
            maxAge = 30 * 60 * 1000, // 30 minutes default
            minAccessCount = 1,
            forceCleanup = false,
        } = options;

        const beforeCleanup = this.getMemoryUsage();
        const removedBuffers = [];
        const currentTime = Date.now();

        // Identify buffers for cleanup
        for (const [trackId, bufferInfo] of this.buffers.entries()) {
            const age = currentTime - bufferInfo.lastAccessed;
            const shouldRemove =
                forceCleanup ||
                (age > maxAge && bufferInfo.accessCount >= minAccessCount) ||
                (beforeCleanup.totalSize > this.memoryThreshold && age > maxAge / 2);

            if (shouldRemove) {
                removedBuffers.push({
                    trackId: trackId,
                    size: bufferInfo.size,
                    age: age,
                    accessCount: bufferInfo.accessCount,
                });

                this.removeBuffer(trackId);
            }
        }

        const afterCleanup = this.getMemoryUsage();
        const freedMemory = beforeCleanup.totalSize - afterCleanup.totalSize;

        if (removedBuffers.length > 0) {
            logger.info(
                `Audio buffer cleanup: freed ${this._formatBytes(freedMemory)} from ${removedBuffers.length} buffers`
            );
        }

        return {
            freedMemory: freedMemory,
            removedBuffers: removedBuffers,
            beforeCleanup: beforeCleanup,
            afterCleanup: afterCleanup,
            timestamp: currentTime,
        };
    }

    /**
     * Set memory threshold for automatic cleanup
     * @param {number} threshold - Memory threshold in bytes
     */
    setMemoryThreshold(threshold) {
        this.memoryThreshold = Math.max(threshold, 10 * 1024 * 1024); // Minimum 10MB
        logger.info(
            `Audio buffer memory threshold set to ${this._formatBytes(this.memoryThreshold)}`
        );
    }

    /**
     * Set preload strategy
     * @param {string} strategy - Preload strategy ('all', 'selective', 'on-demand')
     */
    setPreloadStrategy(strategy) {
        const validStrategies = ['all', 'selective', 'on-demand'];
        if (validStrategies.includes(strategy)) {
            this.preloadStrategy = strategy;
            logger.info(`Audio buffer preload strategy set to: ${strategy}`);
        } else {
            logger.warn(
                `Invalid preload strategy: ${strategy}. Valid options: ${validStrategies.join(', ')}`
            );
        }
    }

    /**
     * Get preload strategy recommendation based on system capabilities
     * @returns {string} Recommended preload strategy
     */
    getRecommendedPreloadStrategy() {
        // Check available memory (if supported)
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const availableMemory = memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize;

            if (availableMemory < 50 * 1024 * 1024) {
                // Less than 50MB
                return 'on-demand';
            } else if (availableMemory < 100 * 1024 * 1024) {
                // Less than 100MB
                return 'selective';
            } else {
                return 'all';
            }
        }

        // Fallback based on connection type
        if ('connection' in navigator) {
            /** @type {any} */
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                return 'on-demand';
            } else if (connection.effectiveType === '3g') {
                return 'selective';
            }
        }

        return 'selective'; // Safe default
    }

    /**
     * Optimize loading strategy based on current conditions
     * @returns {Object} Optimization results
     */
    optimizeLoadingStrategy() {
        const currentUsage = this.getMemoryUsage();
        const recommendedStrategy = this.getRecommendedPreloadStrategy();
        const optimizations = [];

        // Memory optimization
        if (currentUsage.utilizationPercentage > 80) {
            this.performCleanup({ forceCleanup: false });
            optimizations.push('Performed memory cleanup due to high utilization');
        }

        // Strategy optimization
        if (this.preloadStrategy !== recommendedStrategy) {
            const oldStrategy = this.preloadStrategy;
            this.setPreloadStrategy(recommendedStrategy);
            optimizations.push(
                `Changed preload strategy from ${oldStrategy} to ${recommendedStrategy}`
            );
        }

        // Threshold optimization
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const optimalThreshold = Math.min(
                memInfo.jsHeapSizeLimit * 0.1, // 10% of heap limit
                100 * 1024 * 1024 // Max 100MB
            );

            if (Math.abs(this.memoryThreshold - optimalThreshold) > 10 * 1024 * 1024) {
                this.setMemoryThreshold(optimalThreshold);
                optimizations.push(
                    `Adjusted memory threshold to ${this._formatBytes(optimalThreshold)}`
                );
            }
        }

        return {
            optimizations: optimizations,
            currentStrategy: this.preloadStrategy,
            memoryUsage: currentUsage,
            timestamp: Date.now(),
        };
    }

    /**
     * Get buffer statistics for monitoring
     * @returns {Object} Buffer statistics
     */
    getStatistics() {
        const stats = {
            totalBuffers: this.buffers.size,
            memoryUsage: this.getMemoryUsage(),
            accessPatterns: {},
            ageDistribution: {},
            preloadStrategy: this.preloadStrategy,
        };

        // Analyze access patterns
        const accessCounts = [];
        const ages = [];
        const currentTime = Date.now();

        for (const bufferInfo of this.buffers.values()) {
            accessCounts.push(bufferInfo.accessCount);
            ages.push(currentTime - bufferInfo.registeredAt);
        }

        if (accessCounts.length > 0) {
            stats.accessPatterns = {
                average: accessCounts.reduce((a, b) => a + b, 0) / accessCounts.length,
                max: Math.max(...accessCounts),
                min: Math.min(...accessCounts),
            };
        }

        if (ages.length > 0) {
            stats.ageDistribution = {
                averageAge: ages.reduce((a, b) => a + b, 0) / ages.length,
                oldestBuffer: Math.max(...ages),
                newestBuffer: Math.min(...ages),
            };
        }

        return stats;
    }

    /**
     * Calculate the size of an audio buffer in bytes
     * @param {AudioBuffer} audioBuffer - Audio buffer to measure
     * @returns {number} Size in bytes
     * @private
     */
    _calculateBufferSize(audioBuffer) {
        // Each sample is 32-bit float (4 bytes)
        return audioBuffer.numberOfChannels * audioBuffer.length * 4;
    }

    /**
     * Check current memory usage and trigger cleanup if needed
     * @private
     */
    _checkMemoryUsage() {
        const usage = this.getMemoryUsage();

        if (usage.totalSize > this.memoryThreshold) {
            logger.warn(
                `Audio buffer memory usage (${this._formatBytes(usage.totalSize)}) exceeds threshold (${this._formatBytes(this.memoryThreshold)})`
            );

            // Perform automatic cleanup
            this.performCleanup({
                maxAge: 15 * 60 * 1000, // 15 minutes for aggressive cleanup
                forceCleanup: false,
            });
        }
    }

    /**
     * Start automatic cleanup interval
     * @private
     */
    _startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, MUSIC_SYSTEM_CONFIG.AUDIO_BUFFER_CLEANUP_INTERVAL);
    }

    /**
     * Stop automatic cleanup interval
     * @private
     */
    _stopCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Format bytes for human-readable display
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Clean up all resources
     */
    cleanup() {
        this._stopCleanupInterval();

        // Clear all buffers
        const bufferCount = this.buffers.size;
        this.buffers.clear();
        this.lastAccessTimes.clear();
        this.loadingQueue = [];

        logger.info(`Audio buffer manager cleanup: removed ${bufferCount} buffers`);
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicBufferManager };
