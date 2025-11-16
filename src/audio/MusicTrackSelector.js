/**
 * MusicTrackSelector - Handles track selection and metadata management
 * Provides interface for track selection with metadata display and validation
 */

const { MUSIC_TRACKS, ENERGY_LEVELS, MusicConfigUtils } = require('./MusicConfig.js');

class MusicTrackSelector {
    constructor(trackManager, settings) {
        this.trackManager = trackManager;
        this.settings = settings;
        this.currentTrackId = settings.getSelectedTrack();
        this.selectionCallbacks = [];
        
        // Validate initial selection
        this._validateSelection();
    }
    
    /**
     * Get all available tracks with metadata
     * @returns {Object[]} Array of track metadata objects
     */
    getAvailableTracks() {
        return Object.values(MUSIC_TRACKS).map(config => ({
            id: config.id,
            name: config.name,
            energyLevel: config.energyLevel,
            description: config.description || '',
            url: config.url,
            loop: config.loop,
            preload: config.preload,
            isSelected: config.id === this.currentTrackId,
            isLoaded: this.trackManager.isTrackLoaded(config.id),
            isLoading: this.trackManager.isTrackLoading(config.id),
            hasError: this.trackManager.hasTrackError(config.id),
            loadingState: this._getTrackLoadingState(config.id)
        }));
    }
    
    /**
     * Get tracks grouped by energy level
     * @returns {Object} Object with energy levels as keys and track arrays as values
     */
    getTracksByEnergyLevel() {
        const grouped = {
            [ENERGY_LEVELS.AMBIENT]: [],
            [ENERGY_LEVELS.UPBEAT]: [],
            [ENERGY_LEVELS.INTENSE]: [],
            none: []
        };
        
        const tracks = this.getAvailableTracks();
        
        for (const track of tracks) {
            if (track.energyLevel && grouped[track.energyLevel]) {
                grouped[track.energyLevel].push(track);
            } else {
                grouped.none.push(track);
            }
        }
        
        return grouped;
    }
    
    /**
     * Get the currently selected track
     * @returns {Object|null} Current track metadata or null if none selected
     */
    getCurrentTrack() {
        if (!this.currentTrackId) {
            return null;
        }
        
        const tracks = this.getAvailableTracks();
        return tracks.find(track => track.id === this.currentTrackId) || null;
    }
    
    /**
     * Select a track by ID
     * @param {string} trackId - Track identifier
     * @returns {Promise<boolean>} Resolves to true if selection was successful
     */
    async selectTrack(trackId) {
        // Validate track ID
        if (!MusicConfigUtils.isValidTrackId(trackId)) {
            console.warn(`Invalid track ID: ${trackId}`);
            return false;
        }
        
        // Check if track exists in manager
        if (!this.trackManager.hasTrack(trackId)) {
            console.warn(`Track not found in manager: ${trackId}`);
            return false;
        }
        
        const previousTrackId = this.currentTrackId;
        this.currentTrackId = trackId;
        
        try {
            // Save selection to settings
            this.settings.setSelectedTrack(trackId);
            await this.settings.save();
            
            // Notify callbacks of selection change
            this._notifySelectionChange(trackId, previousTrackId);
            
            console.log(`Track selected: ${trackId}`);
            return true;
            
        } catch (error) {
            // Revert selection on error
            this.currentTrackId = previousTrackId;
            console.error(`Failed to select track ${trackId}:`, error);
            return false;
        }
    }
    
    /**
     * Get the next track in the list (for cycling through tracks)
     * @param {boolean} skipNone - Whether to skip the "none" option
     * @returns {string|null} Next track ID or null if none available
     */
    getNextTrack(skipNone = false) {
        const tracks = this.getAvailableTracks();
        const currentIndex = tracks.findIndex(track => track.id === this.currentTrackId);
        
        if (currentIndex === -1) {
            return tracks.length > 0 ? tracks[0].id : null;
        }
        
        // Find next track
        for (let i = 1; i < tracks.length; i++) {
            const nextIndex = (currentIndex + i) % tracks.length;
            const nextTrack = tracks[nextIndex];
            
            if (!skipNone || nextTrack.id !== 'none') {
                return nextTrack.id;
            }
        }
        
        return null;
    }
    
    /**
     * Get the previous track in the list
     * @param {boolean} skipNone - Whether to skip the "none" option
     * @returns {string|null} Previous track ID or null if none available
     */
    getPreviousTrack(skipNone = false) {
        const tracks = this.getAvailableTracks();
        const currentIndex = tracks.findIndex(track => track.id === this.currentTrackId);
        
        if (currentIndex === -1) {
            return tracks.length > 0 ? tracks[tracks.length - 1].id : null;
        }
        
        // Find previous track
        for (let i = 1; i < tracks.length; i++) {
            const prevIndex = (currentIndex - i + tracks.length) % tracks.length;
            const prevTrack = tracks[prevIndex];
            
            if (!skipNone || prevTrack.id !== 'none') {
                return prevTrack.id;
            }
        }
        
        return null;
    }
    
    /**
     * Get tracks by energy level
     * @param {string} energyLevel - Energy level to filter by
     * @returns {Object[]} Array of tracks matching the energy level
     */
    getTracksByEnergy(energyLevel) {
        return this.getAvailableTracks().filter(track => 
            track.energyLevel === energyLevel
        );
    }
    
    /**
     * Get a random track from a specific energy level
     * @param {string} energyLevel - Energy level to choose from
     * @param {boolean} excludeCurrent - Whether to exclude the currently selected track
     * @returns {string|null} Random track ID or null if none available
     */
    getRandomTrackByEnergy(energyLevel, excludeCurrent = true) {
        const tracks = this.getTracksByEnergy(energyLevel);
        
        if (excludeCurrent) {
            const filtered = tracks.filter(track => track.id !== this.currentTrackId);
            if (filtered.length > 0) {
                return filtered[Math.floor(Math.random() * filtered.length)].id;
            }
        }
        
        return tracks.length > 0 ? tracks[Math.floor(Math.random() * tracks.length)].id : null;
    }
    
    /**
     * Check if a track is available for selection
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track is available
     */
    isTrackAvailable(trackId) {
        if (!MusicConfigUtils.isValidTrackId(trackId)) {
            return false;
        }
        
        // "none" is always available
        if (trackId === 'none') {
            return true;
        }
        
        // Check if track exists and is not in error state
        return this.trackManager.hasTrack(trackId) && 
               !this.trackManager.hasTrackError(trackId);
    }
    
    /**
     * Get track selection statistics
     * @returns {Object} Statistics about track availability and states
     */
    getSelectionStats() {
        const tracks = this.getAvailableTracks();
        const stats = {
            total: tracks.length,
            loaded: 0,
            loading: 0,
            error: 0,
            available: 0,
            byEnergyLevel: {
                [ENERGY_LEVELS.AMBIENT]: 0,
                [ENERGY_LEVELS.UPBEAT]: 0,
                [ENERGY_LEVELS.INTENSE]: 0,
                none: 0
            }
        };
        
        for (const track of tracks) {
            if (track.isLoaded) stats.loaded++;
            if (track.isLoading) stats.loading++;
            if (track.hasError) stats.error++;
            if (this.isTrackAvailable(track.id)) stats.available++;
            
            if (track.energyLevel && stats.byEnergyLevel[track.energyLevel] !== undefined) {
                stats.byEnergyLevel[track.energyLevel]++;
            } else {
                stats.byEnergyLevel.none++;
            }
        }
        
        return stats;
    }
    
    /**
     * Register a callback for track selection changes
     * @param {Function} callback - Callback function (newTrackId, previousTrackId) => void
     */
    onSelectionChange(callback) {
        if (typeof callback === 'function') {
            this.selectionCallbacks.push(callback);
        }
    }
    
    /**
     * Remove a selection change callback
     * @param {Function} callback - Callback function to remove
     */
    removeSelectionCallback(callback) {
        const index = this.selectionCallbacks.indexOf(callback);
        if (index !== -1) {
            this.selectionCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Get detailed metadata for a specific track
     * @param {string} trackId - Track identifier
     * @returns {Object|null} Detailed track metadata or null if not found
     */
    getTrackDetails(trackId) {
        const config = MusicConfigUtils.getTrackConfig(trackId);
        if (!config) {
            return null;
        }
        
        const track = this.trackManager.getTrack(trackId);
        
        return {
            id: config.id,
            name: config.name,
            energyLevel: config.energyLevel,
            description: config.description || '',
            url: config.url,
            loop: config.loop,
            preload: config.preload,
            duration: track ? track.getDuration() : null,
            isSelected: config.id === this.currentTrackId,
            isLoaded: track ? track.isLoaded() : false,
            isLoading: track ? track.isLoading() : false,
            hasError: track ? track.hasError() : false,
            errorMessage: track ? track.getError() : null,
            loadingState: track ? track.getLoadingState() : 'not_loaded',
            metadata: track ? track.getMetadata() : config
        };
    }
    
    /**
     * Validate the current selection and fix if invalid
     * @private
     */
    _validateSelection() {
        if (!this.currentTrackId || !MusicConfigUtils.isValidTrackId(this.currentTrackId)) {
            // Reset to default if invalid
            this.currentTrackId = 'ambient-space';
            this.settings.setSelectedTrack(this.currentTrackId);
            console.warn('Invalid track selection reset to default');
        }
    }
    
    /**
     * Get loading state for a track
     * @param {string} trackId - Track identifier
     * @returns {string} Loading state description
     * @private
     */
    _getTrackLoadingState(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) {
            return 'not_found';
        }
        
        return track.getLoadingState();
    }
    
    /**
     * Notify callbacks of selection change
     * @param {string} newTrackId - New track ID
     * @param {string} previousTrackId - Previous track ID
     * @private
     */
    _notifySelectionChange(newTrackId, previousTrackId) {
        for (const callback of this.selectionCallbacks) {
            try {
                callback(newTrackId, previousTrackId);
            } catch (error) {
                console.error('Error in selection change callback:', error);
            }
        }
    }
    
    /**
     * Reset selection to default
     * @returns {Promise<boolean>} Resolves to true if reset was successful
     */
    async resetToDefault() {
        return await this.selectTrack('ambient-space');
    }
    
    /**
     * Export current selection state
     * @returns {Object} Current selection state
     */
    exportState() {
        return {
            currentTrackId: this.currentTrackId,
            availableTracks: this.getAvailableTracks().map(track => ({
                id: track.id,
                name: track.name,
                energyLevel: track.energyLevel,
                isLoaded: track.isLoaded,
                hasError: track.hasError
            })),
            stats: this.getSelectionStats()
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.selectionCallbacks = [];
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicTrackSelector };