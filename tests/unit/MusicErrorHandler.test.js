/**
 * Tests for MusicErrorHandler class
 * Verifies error handling, recovery strategies, and graceful degradation
 */

const { MusicErrorHandler } = require('./MusicErrorHandler.js');
const { ERROR_TYPES } = require('./MusicConfig.js');

// Mock navigator for network monitoring
Object.defineProperty(navigator, 'onLine', {
    value: true,
    configurable: true
});

describe('MusicErrorHandler', () => {
    let errorHandler;
    
    beforeEach(() => {
        errorHandler = new MusicErrorHandler();
        
        // Mock window events for network monitoring
        global.window = {
            addEventListener: jest.fn()
        };
    });
    
    afterEach(() => {
        if (errorHandler) {
            errorHandler.clearErrorLog();
        }
    });
    
    describe('constructor', () => {
        it('should initialize with empty error log', () => {
            expect(errorHandler.errorLog).toEqual([]);
            expect(errorHandler.retryAttempts.size).toBe(0);
            expect(errorHandler.networkStatus).toBe('online');
        });
    });
    
    describe('error analysis', () => {
        it('should correctly identify network errors', () => {
            const networkError = new Error('Failed to fetch');
            const errorInfo = errorHandler._analyzeError(networkError);
            
            expect(errorInfo.type).toBe(ERROR_TYPES.NETWORK_ERROR);
            expect(errorInfo.message).toBe('Failed to fetch');
        });
        
        it('should correctly identify loading errors', () => {
            const loadingError = new Error('HTTP 404: Not Found');
            const errorInfo = errorHandler._analyzeError(loadingError);
            
            expect(errorInfo.type).toBe(ERROR_TYPES.LOADING_FAILED);
        });
        
        it('should correctly identify format errors', () => {
            const formatError = new Error('decodeAudioData failed');
            const errorInfo = errorHandler._analyzeError(formatError);
            
            expect(errorInfo.type).toBe(ERROR_TYPES.FORMAT_UNSUPPORTED);
        });
        
        it('should correctly identify autoplay errors', () => {
            const autoplayError = new Error('autoplay policy blocked');
            const errorInfo = errorHandler._analyzeError(autoplayError);
            
            expect(errorInfo.type).toBe(ERROR_TYPES.AUTOPLAY_BLOCKED);
        });
        
        it('should default to unknown error type', () => {
            const unknownError = new Error('Something went wrong');
            const errorInfo = errorHandler._analyzeError(unknownError);
            
            expect(errorInfo.type).toBe(ERROR_TYPES.UNKNOWN_ERROR);
        });
    });
    
    describe('loading error handling', () => {
        it('should handle network errors with retry strategy', async () => {
            const networkError = new Error('Failed to fetch');
            
            const recovery = await errorHandler.handleLoadingError(
                networkError, 'test-track', 'test.mp3', 0
            );
            
            expect(recovery.action).toBe('retry');
            expect(recovery.attempt).toBe(1);
            expect(recovery.delay).toBeGreaterThan(0);
        });
        
        it('should handle format errors with fallback strategy', async () => {
            const formatError = new Error('Unsupported audio format');
            
            const recovery = await errorHandler.handleLoadingError(
                formatError, 'test-track', 'test.mp3', 0
            );
            
            expect(recovery.action).toBe('fallback');
            expect(recovery.url).toBe('test.ogg');
            expect(recovery.originalUrl).toBe('test.mp3');
        });
        
        it('should handle 404 errors with graceful degradation', async () => {
            const notFoundError = new Error('HTTP 404: Not Found');
            
            const recovery = await errorHandler.handleLoadingError(
                notFoundError, 'test-track', 'test.mp3', 0
            );
            
            expect(recovery.action).toBe('degrade');
            expect(recovery.continueWithoutMusic).toBe(true);
        });
        
        it('should handle autoplay errors with user notification', async () => {
            const autoplayError = new Error('autoplay policy blocked');
            
            const recovery = await errorHandler.handleLoadingError(
                autoplayError, 'test-track', 'test.mp3', 0
            );
            
            expect(recovery.action).toBe('notify_user');
            expect(recovery.requiresInteraction).toBe(true);
        });
        
        it('should exhaust retries and fail gracefully', async () => {
            const networkError = new Error('Network timeout');
            
            const recovery = await errorHandler.handleLoadingError(
                networkError, 'test-track', 'test.mp3', 3 // Max retries exceeded
            );
            
            expect(recovery.action).toBe('degrade');
            expect(recovery.reason).toContain('Maximum retries exceeded');
        });
    });
    
    describe('playback error handling', () => {
        it('should handle recoverable playback errors', () => {
            const contextError = new Error('AudioContext suspended');
            
            const recovery = errorHandler.handlePlaybackError(
                contextError, 'play', { trackId: 'test-track' }
            );
            
            expect(recovery.action).toBe('pause_and_retry');
            expect(recovery.canRetry).toBe(true);
            expect(recovery.retryDelay).toBeDefined();
        });
        
        it('should handle non-recoverable playback errors', () => {
            const fatalError = new Error('Audio hardware failure');
            
            const recovery = errorHandler.handlePlaybackError(
                fatalError, 'play', { trackId: 'test-track' }
            );
            
            expect(recovery.action).toBe('stop_playback');
            expect(recovery.canRetry).toBe(false);
            expect(recovery.permanent).toBe(true);
        });
    });
    
    describe('audio context error handling', () => {
        it('should handle suspended context errors', () => {
            const suspendedError = new Error('Context suspended');
            const mockContext = { state: 'suspended' };
            
            const recovery = errorHandler.handleAudioContextError(suspendedError, mockContext);
            
            expect(recovery.action).toBe('resume_context');
            expect(recovery.audioContext).toBe(mockContext);
            expect(recovery.canAutoRecover).toBe(true);
        });
        
        it('should handle autoplay policy errors', () => {
            const autoplayError = new Error('autoplay policy violation');
            const mockContext = { state: 'suspended' };
            
            const recovery = errorHandler.handleAudioContextError(autoplayError, mockContext);
            
            expect(recovery.action).toBe('require_interaction');
            expect(recovery.requiresUserGesture).toBe(true);
        });
        
        it('should handle generic context errors', () => {
            const genericError = new Error('AudioContext creation failed');
            const mockContext = { state: 'closed' };
            
            const recovery = errorHandler.handleAudioContextError(genericError, mockContext);
            
            expect(recovery.action).toBe('reinitialize_audio');
            expect(recovery.requiresReinitialization).toBe(true);
        });
    });
    
    describe('user-friendly messages', () => {
        it('should provide appropriate message for loading failures', () => {
            const message = errorHandler.getUserFriendlyMessage('test-track', ERROR_TYPES.LOADING_FAILED);
            
            expect(message).toContain('test-track');
            expect(message).toContain('Unable to load');
        });
        
        it('should provide appropriate message for network errors', () => {
            const message = errorHandler.getUserFriendlyMessage('test-track', ERROR_TYPES.NETWORK_ERROR);
            
            expect(message).toContain('Network connection');
            expect(message).toContain('connection is restored');
        });
        
        it('should provide appropriate message for autoplay blocks', () => {
            const message = errorHandler.getUserFriendlyMessage('test-track', ERROR_TYPES.AUTOPLAY_BLOCKED);
            
            expect(message).toContain('Click anywhere');
            expect(message).toContain('enable background music');
        });
        
        it('should provide fallback message for unknown errors', () => {
            const message = errorHandler.getUserFriendlyMessage('test-track', 'unknown_type');
            
            expect(message).toContain('unexpected audio error');
        });
    });
    
    describe('recovery decision making', () => {
        it('should recommend recovery for network errors within retry limit', () => {
            const shouldRecover = errorHandler.shouldAttemptRecovery('test-track', ERROR_TYPES.NETWORK_ERROR);
            
            expect(shouldRecover).toBe(true);
        });
        
        it('should not recommend recovery after max retries', () => {
            // Simulate max retries reached
            errorHandler.retryAttempts.set('test-track', 3);
            
            const shouldRecover = errorHandler.shouldAttemptRecovery('test-track', ERROR_TYPES.NETWORK_ERROR);
            
            expect(shouldRecover).toBe(false);
        });
        
        it('should not recommend recovery for non-recoverable errors', () => {
            const shouldRecover = errorHandler.shouldAttemptRecovery('test-track', ERROR_TYPES.FORMAT_UNSUPPORTED);
            
            expect(shouldRecover).toBe(false);
        });
    });
    
    describe('error statistics', () => {
        it('should track error statistics correctly', () => {
            // Simulate some errors
            errorHandler._logError({ type: ERROR_TYPES.NETWORK_ERROR, message: 'Network failed' }, 'track1');
            errorHandler._logError({ type: ERROR_TYPES.LOADING_FAILED, message: 'Load failed' }, 'track2');
            errorHandler._logError({ type: ERROR_TYPES.NETWORK_ERROR, message: 'Network failed again' }, 'track1');
            
            const stats = errorHandler.getErrorStatistics();
            
            expect(stats.totalErrors).toBe(3);
            expect(stats.errorsByType[ERROR_TYPES.NETWORK_ERROR]).toBe(2);
            expect(stats.errorsByType[ERROR_TYPES.LOADING_FAILED]).toBe(1);
            expect(stats.errorsByTrack['track1']).toBe(2);
            expect(stats.errorsByTrack['track2']).toBe(1);
        });
        
        it('should limit error log size', () => {
            // Add many errors to test log size limit
            for (let i = 0; i < 150; i++) {
                errorHandler._logError({ type: ERROR_TYPES.UNKNOWN_ERROR, message: `Error ${i}` }, `track${i}`);
            }
            
            expect(errorHandler.errorLog.length).toBeLessThanOrEqual(100);
        });
    });
    
    describe('format fallback generation', () => {
        it('should generate MP3 to OGG fallback', () => {
            const fallbackUrl = errorHandler._generateFallbackUrl('music/track.mp3');
            expect(fallbackUrl).toBe('music/track.ogg');
        });
        
        it('should generate OGG to MP3 fallback', () => {
            const fallbackUrl = errorHandler._generateFallbackUrl('music/track.ogg');
            expect(fallbackUrl).toBe('music/track.mp3');
        });
        
        it('should return null for unsupported formats', () => {
            const fallbackUrl = errorHandler._generateFallbackUrl('music/track.flac');
            expect(fallbackUrl).toBeNull();
        });
        
        it('should return null for null input', () => {
            const fallbackUrl = errorHandler._generateFallbackUrl(null);
            expect(fallbackUrl).toBeNull();
        });
    });
    
    describe('network monitoring', () => {
        it('should detect offline status', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true
            });
            
            const offlineHandler = new MusicErrorHandler();
            expect(offlineHandler.networkStatus).toBe('offline');
        });
        
        it('should treat network errors as offline-related when offline', () => {
            errorHandler.networkStatus = 'offline';
            
            const regularError = new Error('Something failed');
            const isNetworkError = errorHandler._isNetworkError(regularError);
            
            expect(isNetworkError).toBe(true);
        });
    });
    
    describe('cleanup', () => {
        it('should clear error log and retry attempts', () => {
            // Add some data
            errorHandler._logError({ type: ERROR_TYPES.NETWORK_ERROR, message: 'Test' }, 'track1');
            errorHandler.retryAttempts.set('track1', 2);
            
            errorHandler.clearErrorLog();
            
            expect(errorHandler.errorLog).toEqual([]);
            expect(errorHandler.retryAttempts.size).toBe(0);
        });
    });
});