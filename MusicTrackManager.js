/**
 * MusicTrackManager - Manages loading, preloading, and track selection
 * Handles the collection of music tracks and their loading states
 */

const { MusicTrack } = require('./MusicTrack.js');
const { MUSIC_TRACKS, MUSIC_SYSTEM_CONFIG, ERROR_TYPES } = require('./MusicConfig.js');

class MusicTrackManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.tracks = new Map();
        this.preloadPromises = new Map();
        this.loadingQueue = [];
        this.isPreloading = false;
        
        // Initialize tracks from configuration
        this._initializeTracks();
    }
    
    /**
     * Initialize all tracks from configuration
     * @private
     */
    _initializeTracks() {
        for (const [trackId, config] of Object.entries(MUSIC_TRACKS)) {
            const track = new MusicTrack(trackId, config.url, config);
            track.setAudioContext(this.audioContext);
            this.tracks.set(trackId, track);
        }
    }
    
    /**
     * Get a track by ID
     * @param {string} trackId - Track identifier
     * @returns {MusicTrack|null} Track instance or null if not found
     */
    getTrack(trackId) {
        return this.tracks.get(trackId) || null;
    }
    
    /**
     * Get all available tracks
     * @returns {MusicTrack[]} Array of all track instances
     */
    getAllTracks() {
        return Array.from(this.tracks.values());
    }
    
    /**
     * Get tracks by energy level
     * @param {string} energyLevel - Energy level to filter by
     * @returns {MusicTrack[]} Array of tracks matching the energy level
     */
    getTracksByEnergyLevel(energyLevel) {
        return this.getAllTracks().filter(track => 
            track.getEnergyLevel() === energyLevel
        );
    }
    
    /**
     * Get all track IDs
     * @returns {string[]} Array of track identifiers
     */
    getTrackIds() {
        return Array.from(this.tracks.keys());
    }
    
    /**
     * Check if a track exists
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track exists
     */
    hasTrack(trackId) {
        return this.tracks.has(trackId);
    }
    
    /**
     * Load a specific track
     * @param {string} trackId - Track identifier
     * @returns {Promise<void>} Resolves when track is loaded
     */
    async loadTrack(trackId) {
        const track = this.getTrack(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        try {
            await track.load();
        } catch (error) {
            console.warn(`Failed to load track ${trackId}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Preload selected tracks during game initialization with performance monitoring
     * @param {string[]} trackIds - Array of track IDs to preload (optional, defaults to all preload-enabled tracks)
     * @param {MusicPerformanceMonitor} performanceMonitor - Performance monitor instance (optional)
     * @returns {Promise<Object>} Resolves with preload results
     */
    async preloadTracks(trackIds = null, performanceMonitor = null) {
        if (this.isPreloading) {
            // Return existing preload promises if already in progress
            return Promise.allSettled(Array.from(this.preloadPromises.values()));
        }
        
        this.isPreloading = true;
        const startTime = performance.now();
        
        try {
            // Determine which tracks to preload
            const tracksToPreload = trackIds || this._getPreloadableTracks();
            
            // Clear any existing preload promises
            this.preloadPromises.clear();
            
            // Start preloading all tracks concurrently with performance monitoring
            for (const trackId of tracksToPreload) {
                const track = this.getTrack(trackId);
                if (track && track.metadata.preload) {
                    // Record loading start if performance monitor available
                    if (performanceMonitor) {
                        performanceMonitor.recordLoadingStart(trackId);
                    }
                    
                    const preloadPromise = this._preloadTrackWithFallback(track, performanceMonitor);
                    this.preloadPromises.set(trackId, preloadPromise);
                }
            }
            
            // Wait for all preload attempts to complete
            const results = await Promise.allSettled(Array.from(this.preloadPromises.values()));
            
            // Analyze results
            const successful = results.filter(result => result.status === 'fulfilled').length;
            const failed = results.filter(result => result.status === 'rejected').length;
            const totalTime = performance.now() - startTime;
            
            console.log(`Music preloading completed in ${Math.round(totalTime)}ms: ${successful} successful, ${failed} failed`);
            
            return {
                successful,
                failed,
                total: results.length,
                totalTime: totalTime,
                averageTime: results.length > 0 ? totalTime / results.length : 0,
                results: results.map((result, index) => ({
                    trackId: tracksToPreload[index],
                    status: result.status,
                    error: result.status === 'rejected' ? result.reason : null
                }))
            };
            
        } finally {
            this.isPreloading = false;
        }
    }
    
    /**
     * Preload a single track with graceful fallback and performance monitoring
     * @param {MusicTrack} track - Track to preload
     * @param {MusicPerformanceMonitor} performanceMonitor - Performance monitor instance (optional)
     * @returns {Promise<void>} Resolves when preload completes or fails gracefully
     * @private
     */
    async _preloadTrackWithFallback(track, performanceMonitor = null) {
        try {
            await track.preload();
            
            // Record successful loading
            if (performanceMonitor) {
                performanceMonitor.recordLoadingComplete(track.getId(), true, track.getAudioBuffer());
            }
            
            console.log(`Successfully preloaded track: ${track.getId()}`);
        } catch (error) {
            // Record failed loading
            if (performanceMonitor) {
                performanceMonitor.recordLoadingComplete(track.getId(), false);
            }
            
            console.warn(`Failed to preload track ${track.getId()}, will load on demand:`, error.message);
            // Don't throw - allow graceful fallback to on-demand loading
        }
    }
    
    /**
     * Get list of tracks that should be preloaded
     * @returns {string[]} Array of track IDs to preload
     * @private
     */
    _getPreloadableTracks() {
        return this.getAllTracks()
            .filter(track => track.metadata.preload)
            .map(track => track.getId());
    }
    
    /**
     * Check if a track is loaded and ready for playback
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track is loaded
     */
    isTrackLoaded(trackId) {
        const track = this.getTrack(trackId);
        return track ? track.isLoaded() : false;
    }
    
    /**
     * Check if a track is currently loading
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track is loading
     */
    isTrackLoading(trackId) {
        const track = this.getTrack(trackId);
        return track ? track.isLoading() : false;
    }
    
    /**
     * Check if a track has an error
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track has an error
     */
    hasTrackError(trackId) {
        const track = this.getTrack(trackId);
        return track ? track.hasError() : false;
    }
    
    /**
     * Get loading status for all tracks
     * @returns {Object} Object mapping track IDs to their loading states
     */
    getLoadingStatus() {
        const status = {};
        for (const [trackId, track] of this.tracks) {
            status[trackId] = {
                state: track.getLoadingState(),
                loaded: track.isLoaded(),
                loading: track.isLoading(),
                error: track.hasError(),
                errorMessage: track.getError()
            };
        }
        return status;
    }
    
    /**
     * Get track metadata for UI display
     * @returns {Object[]} Array of track metadata objects
     */
    getTrackMetadata() {
        return this.getAllTracks().map(track => ({
            id: track.getId(),
            name: track.getName(),
            energyLevel: track.getEnergyLevel(),
            duration: track.getDuration(),
            loaded: track.isLoaded(),
            loading: track.isLoading(),
            error: track.hasError(),
            description: track.metadata.description || ''
        }));
    }
    
    /**
     * Ensure a track is loaded before use
     * @param {string} trackId - Track identifier
     * @returns {Promise<MusicTrack>} Resolves with loaded track
     */
    async ensureTrackLoaded(trackId) {
        const track = this.getTrack(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        // Handle "none" track (no loading required)
        if (trackId === 'none') {
            return track;
        }
        
        // Load track if not already loaded
        if (!track.isLoaded() && !track.isLoading()) {
            await track.load();
        } else if (track.isLoading()) {
            // Wait for existing load to complete
            await track.load();
        }
        
        if (track.hasError()) {
            throw new Error(`Track ${trackId} failed to load: ${track.getError()}`);
        }
        
        return track;
    }
    
    /**
     * Retry loading failed tracks
     * @param {string[]} trackIds - Specific track IDs to retry (optional, defaults to all failed tracks)
     * @returns {Promise<Object>} Resolves with retry results
     */
    async retryFailedTracks(trackIds = null) {
        const tracksToRetry = trackIds || this._getFailedTracks();
        
        if (tracksToRetry.length === 0) {
            return { successful: 0, failed: 0, total: 0, results: [] };
        }
        
        console.log(`Retrying ${tracksToRetry.length} failed tracks...`);
        
        const retryPromises = tracksToRetry.map(async (trackId) => {
            const track = this.getTrack(trackId);
            if (!track) {
                throw new Error(`Track not found: ${trackId}`);
            }
            
            try {
                // Reset track state before retry
                track.cleanup();
                track.setAudioContext(this.audioContext);
                
                await track.load();
                return { trackId, status: 'fulfilled', error: null };
            } catch (error) {
                return { trackId, status: 'rejected', error: error.message };
            }
        });
        
        const results = await Promise.allSettled(retryPromises);
        const successful = results.filter(result => 
            result.status === 'fulfilled' && result.value.status === 'fulfilled'
        ).length;
        const failed = results.length - successful;
        
        console.log(`Track retry completed: ${successful} successful, ${failed} failed`);
        
        return {
            successful,
            failed,
            total: results.length,
            results: results.map(result => 
                result.status === 'fulfilled' ? result.value : {
                    trackId: 'unknown',
                    status: 'rejected',
                    error: result.reason
                }
            )
        };
    }
    
    /**
     * Get list of tracks that failed to load
     * @returns {string[]} Array of track IDs that have errors
     * @private
     */
    _getFailedTracks() {
        return this.getAllTracks()
            .filter(track => track.hasError())
            .map(track => track.getId());
    }
    
    /**
     * Clean up all track resources
     */
    cleanup() {
        for (const track of this.tracks.values()) {
            track.cleanup();
        }
        this.preloadPromises.clear();
        this.loadingQueue = [];
        this.isPreloading = false;
    }
    
    /**
     * Update audio context for all tracks
     * @param {AudioContext} audioContext - New audio context
     */
    updateAudioContext(audioContext) {
        this.audioContext = audioContext;
        for (const track of this.tracks.values()) {
            track.setAudioContext(audioContext);
        }
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicTrackManager };