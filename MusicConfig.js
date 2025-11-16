/**
 * MusicConfig - Configuration constants and utilities for the music system
 * Provides track definitions, playback states, and configuration utilities
 */

// Music track configurations
const MUSIC_TRACKS = {
    'ambient-space': {
        id: 'ambient-space',
        name: 'Ambient Space',
        url: 'sounds/music/ambient-space.mp3',
        fallbackUrl: 'sounds/engine.mp3', // Temporary fallback using existing engine sound
        energyLevel: 'ambient',
        loop: true,
        preload: true,
        description: 'Calm, atmospheric background music for focused gameplay'
    },
    'cyber-pulse': {
        id: 'cyber-pulse',
        name: 'Cyber Pulse',
        url: 'sounds/music/cyber-pulse.mp3',
        fallbackUrl: 'sounds/victory.mp3', // Temporary fallback using existing victory sound
        energyLevel: 'upbeat',
        loop: true,
        preload: true,
        description: 'Energetic electronic beats matching the cyberpunk aesthetic'
    },
    'neon-rush': {
        id: 'neon-rush',
        name: 'Neon Rush',
        url: 'sounds/music/neon-rush.mp3',
        fallbackUrl: 'sounds/explosion.mp3', // Temporary fallback using existing explosion sound
        energyLevel: 'intense',
        loop: true,
        preload: true,
        description: 'High-intensity music for competitive and fast-paced gameplay'
    },
    'none': {
        id: 'none',
        name: 'No Music',
        url: null,
        fallbackUrl: null,
        energyLevel: null,
        loop: false,
        preload: false,
        description: 'Disable background music'
    }
};

// Playback states
const PLAYBACK_STATES = {
    STOPPED: 'stopped',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FADING_IN: 'fading_in',
    FADING_OUT: 'fading_out',
    DUCKED: 'ducked',
    ERROR: 'error'
};

// Error types for music system
const ERROR_TYPES = {
    LOADING_FAILED: 'loading_failed',
    NETWORK_ERROR: 'network_error',
    FORMAT_UNSUPPORTED: 'format_unsupported',
    AUTOPLAY_BLOCKED: 'autoplay_blocked',
    CONTEXT_ERROR: 'context_error',
    PLAYBACK_FAILED: 'playback_failed',
    SETTINGS_ERROR: 'settings_error',
    UNKNOWN_ERROR: 'unknown_error'
};

// Audio MIME types for format detection
const AUDIO_MIME_TYPES = {
    MP3: 'audio/mpeg',
    OGG: 'audio/ogg',
    WAV: 'audio/wav',
    M4A: 'audio/mp4'
};

// Music system configuration
const MUSIC_SYSTEM_CONFIG = {
    defaultVolume: 0.7,
    fadeInDuration: 0.5,
    fadeOutDuration: 0.5,
    duckingLevel: 0.3,
    duckingDuration: 0.2,
    maxRetries: 3,
    loadTimeout: 10000
};

// Ducking triggers for different sound effects
const DUCKING_TRIGGERS = {
    explosion: {
        duckingLevel: 0.2,
        duration: 0.3,
        recoveryDelay: 1000
    },
    victory: {
        duckingLevel: 0.3,
        duration: 0.2,
        recoveryDelay: 2000
    },
    defeat: {
        duckingLevel: 0.3,
        duration: 0.2,
        recoveryDelay: 2000
    },
    collision: {
        duckingLevel: 0.4,
        duration: 0.1,
        recoveryDelay: 500
    }
};

// Configuration utilities
const MusicConfigUtils = {
    /**
     * Check if a track ID is valid
     * @param {string} trackId - Track identifier to validate
     * @returns {boolean} True if track ID is valid
     */
    isValidTrackId(trackId) {
        return typeof trackId === 'string' && MUSIC_TRACKS.hasOwnProperty(trackId);
    },
    
    /**
     * Get ducking configuration for a sound effect
     * @param {string} effectType - Type of sound effect
     * @returns {Object|null} Ducking configuration or null if not found
     */
    getDuckingConfig(effectType) {
        return DUCKING_TRIGGERS[effectType] || null;
    },
    
    /**
     * Get all available track IDs
     * @returns {Array<string>} Array of track IDs
     */
    getAvailableTrackIds() {
        return Object.keys(MUSIC_TRACKS);
    },
    
    /**
     * Get track configuration by ID
     * @param {string} trackId - Track identifier
     * @returns {Object|null} Track configuration or null if not found
     */
    getTrackConfig(trackId) {
        return MUSIC_TRACKS[trackId] || null;
    },
    
    /**
     * Get the appropriate URL for a track (primary or fallback)
     * @param {string} trackId - Track identifier
     * @param {boolean} useFallback - Whether to use fallback URL
     * @returns {string|null} Track URL or null if not found
     */
    getTrackUrl(trackId, useFallback = false) {
        const config = MUSIC_TRACKS[trackId];
        if (!config) return null;
        
        if (useFallback && config.fallbackUrl) {
            return config.fallbackUrl;
        }
        
        return config.url;
    },
    
    /**
     * Check if a track has a fallback URL available
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if fallback URL is available
     */
    hasFallback(trackId) {
        const config = MUSIC_TRACKS[trackId];
        return config && config.fallbackUrl !== null;
    },
    
    /**
     * Get default music system configuration
     * @returns {Object} Default configuration object
     */
    getDefaultConfig() {
        return { ...MUSIC_SYSTEM_CONFIG };
    }
};

// Export using CommonJS pattern to match existing project architecture
module.exports = {
    MUSIC_TRACKS,
    PLAYBACK_STATES,
    MUSIC_SYSTEM_CONFIG,
    DUCKING_TRIGGERS,
    ERROR_TYPES,
    AUDIO_MIME_TYPES,
    MusicConfigUtils
};