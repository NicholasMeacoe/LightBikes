/**
 * MusicErrorHandler - Comprehensive error handling for the music system
 * Provides network failure handling, audio format fallbacks, retry mechanisms,
 * and user-friendly error messaging
 */

const { ERROR_TYPES, MUSIC_SYSTEM_CONFIG, AUDIO_MIME_TYPES } = require('./MusicConfig.js');
const { logger } = require('../utils/Logger.js');

class MusicErrorHandler {
    constructor() {
        this.errorLog = [];
        this.retryAttempts = new Map();
        this.networkStatus = 'online';
        this.lastNetworkCheck = 0;

        // Initialize network monitoring
        this._setupNetworkMonitoring();
    }

    /**
     * Handle loading errors with retry logic and fallbacks
     * @param {Error} error - The original error
     * @param {string} trackId - Track identifier
     * @param {string} originalUrl - Original URL that failed
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Recovery strategy result
     */
    async handleLoadingError(error, trackId, originalUrl, attempt = 0) {
        const errorInfo = this._analyzeError(error, originalUrl);

        // Log the error
        this._logError(errorInfo, trackId, attempt);

        // Determine recovery strategy
        const strategy = this._determineRecoveryStrategy(errorInfo, attempt);

        switch (strategy.type) {
            case 'retry':
                return await this._handleRetry(trackId, originalUrl, attempt, strategy);

            case 'format_fallback':
                return await this._handleFormatFallback(trackId, originalUrl, strategy);

            case 'graceful_degradation':
                return this._handleGracefulDegradation(trackId, errorInfo, strategy.reason);

            case 'user_notification':
                return this._handleUserNotification(trackId, errorInfo);

            default:
                return this._handleFinalFailure(trackId, errorInfo);
        }
    }

    /**
     * Handle playback errors during runtime
     * @param {Error} error - The playback error
     * @param {string} operation - The operation that failed
     * @param {Object} context - Additional context information
     * @returns {Object} Recovery action result
     */
    handlePlaybackError(error, operation, context = {}) {
        const errorInfo = this._analyzeError(error, context.url);
        errorInfo.operation = operation;
        errorInfo.context = context;

        this._logError(errorInfo, context.trackId || 'unknown');

        // Determine appropriate response
        if (this._isRecoverablePlaybackError(errorInfo)) {
            return this._handleRecoverablePlaybackError(errorInfo);
        } else {
            return this._handleNonRecoverablePlaybackError(errorInfo);
        }
    }

    /**
     * Handle audio context errors (autoplay policy, suspended context, etc.)
     * @param {Error} error - The audio context error
     * @param {AudioContext} audioContext - The audio context instance
     * @returns {Object} Recovery action result
     */
    handleAudioContextError(error, audioContext) {
        const errorInfo = this._analyzeError(error);
        errorInfo.contextState = audioContext ? audioContext.state : 'unknown';

        this._logError(errorInfo, 'audio_context');

        if (this._isAutoplayPolicyError(errorInfo)) {
            return this._handleAutoplayPolicyError(errorInfo);
        } else if (this._isSuspendedContextError(errorInfo)) {
            return this._handleSuspendedContextError(errorInfo, audioContext);
        } else {
            return this._handleGenericContextError(errorInfo);
        }
    }

    /**
     * Get user-friendly error message for display
     * @param {string} trackId - Track identifier
     * @param {string} errorType - Type of error
     * @returns {string} User-friendly error message
     */
    getUserFriendlyMessage(trackId, errorType) {
        const messages = {
            [ERROR_TYPES.LOADING_FAILED]: `Unable to load music track "${trackId}". Playing without background music.`,
            [ERROR_TYPES.NETWORK_ERROR]:
                'Network connection issue. Music will be available when connection is restored.',
            [ERROR_TYPES.FORMAT_UNSUPPORTED]: `Audio format not supported for "${trackId}". Trying alternative format.`,
            [ERROR_TYPES.AUTOPLAY_BLOCKED]: 'Click anywhere to enable background music.',
            [ERROR_TYPES.CONTEXT_ERROR]:
                'Audio system initialization failed. Some features may be unavailable.',
            [ERROR_TYPES.PLAYBACK_FAILED]: `Playback error for "${trackId}". Continuing without background music.`,
            [ERROR_TYPES.SETTINGS_ERROR]:
                'Music settings could not be saved. Changes will be temporary.',
            [ERROR_TYPES.UNKNOWN_ERROR]:
                'An unexpected audio error occurred. Continuing without background music.',
        };

        return messages[errorType] || messages[ERROR_TYPES.UNKNOWN_ERROR];
    }

    /**
     * Check if the system should attempt recovery for an error
     * @param {string} trackId - Track identifier
     * @param {string} errorType - Type of error
     * @returns {boolean} True if recovery should be attempted
     */
    shouldAttemptRecovery(trackId, errorType) {
        const retryCount = this.retryAttempts.get(trackId) || 0;
        const maxRetries = MUSIC_SYSTEM_CONFIG.maxRetries;

        const recoverableErrors = [
            ERROR_TYPES.NETWORK_ERROR,
            ERROR_TYPES.LOADING_FAILED,
            ERROR_TYPES.CONTEXT_ERROR,
        ];

        return recoverableErrors.includes(errorType) && retryCount < maxRetries;
    }

    /**
     * Get error statistics for monitoring
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            errorsByTrack: {},
            recentErrors: this.errorLog.slice(-10),
            networkStatus: this.networkStatus,
            lastNetworkCheck: this.lastNetworkCheck,
        };

        // Count errors by type
        this.errorLog.forEach((error) => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
            stats.errorsByTrack[error.trackId] = (stats.errorsByTrack[error.trackId] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear error log and reset retry attempts
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
    }

    /**
     * Analyze error to determine type and characteristics
     * @param {Error} error - The error to analyze
     * @param {string} url - URL associated with the error (optional)
     * @returns {Object} Error analysis result
     * @private
     */
    _analyzeError(error, url = null) {
        const errorInfo = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            url: url,
            timestamp: Date.now(),
            type: ERROR_TYPES.UNKNOWN_ERROR,
        };

        // Analyze error message and context to determine type
        if (this._isNetworkError(error)) {
            errorInfo.type = ERROR_TYPES.NETWORK_ERROR;
        } else if (this._isLoadingError(error)) {
            errorInfo.type = ERROR_TYPES.LOADING_FAILED;
        } else if (this._isFormatError(error)) {
            errorInfo.type = ERROR_TYPES.FORMAT_UNSUPPORTED;
        } else if (this._isAutoplayError(error)) {
            errorInfo.type = ERROR_TYPES.AUTOPLAY_BLOCKED;
        } else if (this._isContextError(error)) {
            errorInfo.type = ERROR_TYPES.CONTEXT_ERROR;
        } else if (this._isPlaybackError(error)) {
            errorInfo.type = ERROR_TYPES.PLAYBACK_FAILED;
        }

        return errorInfo;
    }

    /**
     * Determine the best recovery strategy for an error
     * @param {Object} errorInfo - Analyzed error information
     * @param {number} attempt - Current attempt number
     * @returns {Object} Recovery strategy
     * @private
     */
    _determineRecoveryStrategy(errorInfo, attempt) {
        const maxRetries = MUSIC_SYSTEM_CONFIG.maxRetries;

        // Network errors - retry with backoff
        if (errorInfo.type === ERROR_TYPES.NETWORK_ERROR && attempt < maxRetries) {
            return {
                type: 'retry',
                delay: Math.min(1000 * Math.pow(2, attempt), 10000), // Exponential backoff, max 10s
                reason: 'Network error - retrying with backoff',
            };
        }

        // Format errors - try fallback format
        if (errorInfo.type === ERROR_TYPES.FORMAT_UNSUPPORTED) {
            return {
                type: 'format_fallback',
                reason: 'Unsupported format - trying fallback',
            };
        }

        // Loading errors - check if it's a permanent error (404, 403) or retryable
        if (errorInfo.type === ERROR_TYPES.LOADING_FAILED) {
            // Don't retry permanent errors like 404, 403
            if (errorInfo.message.includes('HTTP 404') || errorInfo.message.includes('HTTP 403')) {
                return {
                    type: 'graceful_degradation',
                    reason: 'Permanent loading error - file not found or access denied',
                };
            }

            // Retry other loading errors
            if (attempt < maxRetries) {
                return {
                    type: 'retry',
                    delay: 2000,
                    reason: 'Loading failed - retrying once',
                };
            }
        }

        // Autoplay errors - require user interaction
        if (errorInfo.type === ERROR_TYPES.AUTOPLAY_BLOCKED) {
            return {
                type: 'user_notification',
                reason: 'Autoplay blocked - user interaction required',
            };
        }

        // Context errors - try to recover context
        if (errorInfo.type === ERROR_TYPES.CONTEXT_ERROR && attempt < 1) {
            return {
                type: 'retry',
                delay: 1000,
                reason: 'Context error - attempting recovery',
            };
        }

        // Default to graceful degradation
        return {
            type: 'graceful_degradation',
            reason: 'Maximum retries exceeded or non-recoverable error',
        };
    }

    /**
     * Handle retry strategy
     * @param {string} trackId - Track identifier
     * @param {string} url - Original URL
     * @param {number} attempt - Current attempt number
     * @param {Object} strategy - Retry strategy
     * @returns {Promise<Object>} Retry result
     * @private
     */
    async _handleRetry(trackId, url, attempt, strategy) {
        // Update retry count
        this.retryAttempts.set(trackId, attempt + 1);

        // Wait for backoff delay
        if (strategy.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, strategy.delay));
        }

        return {
            action: 'retry',
            url: url,
            attempt: attempt + 1,
            delay: strategy.delay,
            reason: strategy.reason,
        };
    }

    /**
     * Handle format fallback strategy
     * @param {string} trackId - Track identifier
     * @param {string} originalUrl - Original URL
     * @param {Object} strategy - Fallback strategy
     * @returns {Promise<Object>} Fallback result
     * @private
     */
    async _handleFormatFallback(trackId, originalUrl, strategy) {
        const fallbackUrl = this._generateFallbackUrl(originalUrl);

        if (fallbackUrl && fallbackUrl !== originalUrl) {
            return {
                action: 'fallback',
                url: fallbackUrl,
                originalUrl: originalUrl,
                reason: strategy.reason,
            };
        } else {
            return this._handleGracefulDegradation(trackId, {
                type: ERROR_TYPES.FORMAT_UNSUPPORTED,
            });
        }
    }

    /**
     * Handle graceful degradation
     * @param {string} trackId - Track identifier
     * @param {Object} errorInfo - Error information
     * @returns {Object} Degradation result
     * @private
     */
    _handleGracefulDegradation(trackId, errorInfo, reason = null) {
        return {
            action: 'degrade',
            trackId: trackId,
            message: this.getUserFriendlyMessage(trackId, errorInfo.type),
            continueWithoutMusic: true,
            reason: reason || 'Graceful degradation - continue without music',
        };
    }

    /**
     * Handle user notification requirement
     * @param {string} trackId - Track identifier
     * @param {Object} errorInfo - Error information
     * @returns {Object} Notification result
     * @private
     */
    _handleUserNotification(trackId, errorInfo) {
        return {
            action: 'notify_user',
            trackId: trackId,
            message: this.getUserFriendlyMessage(trackId, errorInfo.type),
            requiresInteraction: true,
            reason: 'User interaction required for audio playback',
        };
    }

    /**
     * Handle final failure when all recovery attempts exhausted
     * @param {string} trackId - Track identifier
     * @param {Object} errorInfo - Error information
     * @returns {Object} Final failure result
     * @private
     */
    _handleFinalFailure(trackId, errorInfo) {
        return {
            action: 'fail',
            trackId: trackId,
            message: this.getUserFriendlyMessage(trackId, errorInfo.type),
            permanent: true,
            reason: 'All recovery attempts failed',
        };
    }

    /**
     * Generate fallback URL with different audio format
     * @param {string} originalUrl - Original URL
     * @returns {string|null} Fallback URL or null if no fallback available
     * @private
     */
    _generateFallbackUrl(originalUrl) {
        if (!originalUrl) return null;

        const fallbackFormats = {
            '.mp3': '.ogg',
            '.ogg': '.mp3',
            '.wav': '.mp3',
            '.m4a': '.mp3',
        };

        for (const [original, fallback] of Object.entries(fallbackFormats)) {
            if (originalUrl.endsWith(original)) {
                return originalUrl.replace(original, fallback);
            }
        }

        return null;
    }

    /**
     * Log error for monitoring and debugging
     * @param {Object} errorInfo - Error information
     * @param {string} trackId - Track identifier
     * @param {number} attempt - Attempt number
     * @private
     */
    _logError(errorInfo, trackId, attempt = 0) {
        const logEntry = {
            ...errorInfo,
            trackId: trackId,
            attempt: attempt,
            timestamp: Date.now(),
        };

        this.errorLog.push(logEntry);

        // Keep log size manageable
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }

        // Logger logging for development
        logger.warn(`Music system error [${errorInfo.type}] for track ${trackId}:`, {
            error: errorInfo.message,
        });
    }

    /**
     * Setup network status monitoring
     * @private
     */
    _setupNetworkMonitoring() {
        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
            this.networkStatus = navigator.onLine ? 'online' : 'offline';

            window.addEventListener('online', () => {
                this.networkStatus = 'online';
                this.lastNetworkCheck = Date.now();
            });

            window.addEventListener('offline', () => {
                this.networkStatus = 'offline';
                this.lastNetworkCheck = Date.now();
            });
        }
    }

    // Error type detection methods
    _isNetworkError(error) {
        const networkIndicators = [
            'fetch',
            'network',
            'timeout',
            'connection',
            'offline',
            'ERR_NETWORK',
            'ERR_INTERNET_DISCONNECTED',
        ];

        return (
            networkIndicators.some((indicator) =>
                error.message.toLowerCase().includes(indicator.toLowerCase())
            ) || this.networkStatus === 'offline'
        );
    }

    _isLoadingError(error) {
        const loadingIndicators = [
            'loading',
            'load',
            'HTTP 404',
            'HTTP 403',
            'HTTP 500',
            'not found',
            'failed to fetch',
        ];

        return loadingIndicators.some((indicator) =>
            error.message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    _isFormatError(error) {
        const formatIndicators = [
            'decode',
            'format',
            'codec',
            'unsupported',
            'invalid audio',
            'decodeAudioData',
        ];

        return formatIndicators.some((indicator) =>
            error.message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    _isAutoplayError(error) {
        const autoplayIndicators = [
            'autoplay',
            'user interaction',
            'gesture',
            'gesture',
            'not allowed',
        ];

        return autoplayIndicators.some((indicator) =>
            error.message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    _isContextError(error) {
        const contextIndicators = [
            'audiocontext',
            'audio context',
            'webaudio',
            'createGain',
            'createBufferSource',
        ];

        return contextIndicators.some((indicator) =>
            error.message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    _isPlaybackError(error) {
        const playbackIndicators = ['playback', 'play', 'start', 'stop', 'source'];

        return playbackIndicators.some((indicator) =>
            error.message.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    _isRecoverablePlaybackError(errorInfo) {
        const recoverableTypes = [
            ERROR_TYPES.NETWORK_ERROR,
            ERROR_TYPES.CONTEXT_ERROR,
            ERROR_TYPES.AUTOPLAY_BLOCKED,
        ];

        return recoverableTypes.includes(errorInfo.type);
    }

    _handleRecoverablePlaybackError(errorInfo) {
        return {
            action: 'pause_and_retry',
            canRetry: true,
            message: 'Temporary playback issue - will retry automatically',
            retryDelay: 2000,
        };
    }

    _handleNonRecoverablePlaybackError(errorInfo) {
        return {
            action: 'stop_playback',
            canRetry: false,
            message: this.getUserFriendlyMessage('current', errorInfo.type),
            permanent: true,
        };
    }

    _isAutoplayPolicyError(errorInfo) {
        return (
            errorInfo.type === ERROR_TYPES.AUTOPLAY_BLOCKED ||
            (errorInfo.contextState === 'suspended' &&
                errorInfo.message.toLowerCase().includes('autoplay'))
        );
    }

    _isSuspendedContextError(errorInfo) {
        return (
            errorInfo.contextState === 'suspended' &&
            !errorInfo.message.toLowerCase().includes('autoplay')
        );
    }

    _handleAutoplayPolicyError(errorInfo) {
        return {
            action: 'require_interaction',
            message: this.getUserFriendlyMessage('music', ERROR_TYPES.AUTOPLAY_BLOCKED),
            requiresUserGesture: true,
        };
    }

    _handleSuspendedContextError(errorInfo, audioContext) {
        return {
            action: 'resume_context',
            audioContext: audioContext,
            message: 'Resuming audio context...',
            canAutoRecover: true,
        };
    }

    _handleGenericContextError(errorInfo) {
        return {
            action: 'reinitialize_audio',
            message: this.getUserFriendlyMessage('audio', ERROR_TYPES.CONTEXT_ERROR),
            requiresReinitialization: true,
        };
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicErrorHandler };
