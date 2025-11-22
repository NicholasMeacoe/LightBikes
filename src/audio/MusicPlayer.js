/**
 * MusicPlayer - Central music management and playback control
 * Handles audio loading, playback state management, volume control, and track switching
 * Integrates with existing AudioManager and provides fade transitions and ducking
 */

const { MusicTrack } = require('./MusicTrack.js');
const { MusicSettings } = require('./MusicSettings.js');
const { MusicErrorHandler } = require('./MusicErrorHandler.js');
const { MusicPerformanceMonitor } = require('./MusicPerformanceMonitor.js');
const { MusicBufferManager } = require('./MusicBufferManager.js');
const { MusicLoadingOptimizer } = require('./MusicLoadingOptimizer.js');
const {
    MUSIC_TRACKS,
    PLAYBACK_STATES,
    MUSIC_SYSTEM_CONFIG,
    DUCKING_TRIGGERS,
    MusicConfigUtils
} = require('./MusicConfig.js');

class MusicPlayer {
    constructor(audioManager, settings = null) {
        // Core dependencies
        this.audioManager = audioManager;
        this.settings = settings || new MusicSettings();

        // Error handling and performance monitoring
        this.errorHandler = new MusicErrorHandler();
        this.performanceMonitor = new MusicPerformanceMonitor();
        this.bufferManager = new MusicBufferManager(this.performanceMonitor);
        this.loadingOptimizer = new MusicLoadingOptimizer(this.performanceMonitor);

        // Audio context reference (shared with AudioManager)
        this.audioContext = null;

        // Track management
        this.tracks = new Map();
        this.currentTrack = null;
        this.currentSource = null;

        // Playback state management
        this.playbackState = PLAYBACK_STATES.STOPPED;
        this.isInitialized = false;

        // Volume and gain control
        this.masterGainNode = null;
        this.currentVolume = this.settings.getMusicVolume();

        // Fade transition management
        this.fadeState = {
            active: false,
            type: null, // 'in', 'out', 'duck'
            startTime: 0,
            duration: 0,
            startVolume: 0,
            targetVolume: 0
        };

        // Audio ducking state
        this.duckingState = {
            active: false,
            originalVolume: 0,
            duckLevel: 0,
            recoveryTimeout: null
        };

        // Performance and error tracking (legacy - now handled by dedicated classes)
        this.errorCount = 0;
        this.lastError = null;

        // Initialize tracks
        this._initializeTracks();
    }

    /**
     * Initialize all available music tracks
     * @private
     */
    _initializeTracks() {
        for (const [trackId, config] of Object.entries(MUSIC_TRACKS)) {
            const track = new MusicTrack(trackId, config.url, config);
            this.tracks.set(trackId, track);
        }
    }

    /**
     * Initialize the music player with audio context
     * @param {AudioContext} audioContext - Web Audio API context from AudioManager
     * @returns {Promise<boolean>} True if initialization successful
     */
    async initialize(audioContext) {
        if (this.isInitialized) {
            return true;
        }

        try {
            this.audioContext = audioContext;

            // Start performance monitoring
            this.performanceMonitor.startMonitoring();

            // Set audio context for all tracks
            for (const track of this.tracks.values()) {
                track.setAudioContext(audioContext);
            }

            // Create master gain node for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.currentVolume;
            this.masterGainNode.connect(this.audioContext.destination);

            // Optimize loading strategy and preload tracks
            const selectedTrackId = this.settings.getSelectedTrack();
            if (selectedTrackId !== 'none') {
                const trackConfigs = Object.values(MUSIC_TRACKS).filter(track => track.id !== 'none');
                const loadingStrategy = this.loadingOptimizer.optimizeLoadingStrategy(trackConfigs, {
                    priorityTrack: selectedTrackId,
                    minimizeStartupDelay: true
                });

                // Load immediate tracks (priority track)
                for (const trackConfig of loadingStrategy.immediate) {
                    const track = this.tracks.get(trackConfig.id);
                    if (track) {
                        this.performanceMonitor.recordLoadingStart(trackConfig.id);
                        try {
                            await track.preload();
                            const audioBuffer = track.getAudioBuffer();
                            if (audioBuffer) {
                                this.bufferManager.registerBuffer(trackConfig.id, audioBuffer, trackConfig);
                            }
                            this.performanceMonitor.recordLoadingComplete(trackConfig.id, true, audioBuffer);
                        } catch (error) {
                            this.performanceMonitor.recordLoadingComplete(trackConfig.id, false);

                            // Handle loading error with error handler
                            const recovery = await this.errorHandler.handleLoadingError(
                                error, trackConfig.id, track.url, 0
                            );

                            if (recovery.action === 'degrade') {
                                console.warn(`Preloading failed for ${trackConfig.id}, continuing without music:`, recovery.message);
                            }
                        }
                    }
                }

                // Start background loading for non-immediate tracks
                if (loadingStrategy.background.length > 0) {
                    this._startBackgroundLoading(loadingStrategy.background);
                }
            }

            this.isInitialized = true;
            console.log('MusicPlayer initialized successfully');
            return true;

        } catch (error) {
            const recovery = this.errorHandler.handleAudioContextError(error, audioContext);
            this._handleError(error, 'initialization');

            if (recovery.action === 'reinitialize_audio') {
                console.warn('Audio context initialization failed, music system disabled');
            }

            return false;
        }
    }

    /**
     * Play the currently selected track
     * @returns {boolean} True if playback started successfully
     */
    play() {
        if (!this.isInitialized || this.playbackState === PLAYBACK_STATES.PLAYING) {
            return false;
        }

        try {
            const selectedTrackId = this.settings.getSelectedTrack();

            // Handle "none" selection
            if (selectedTrackId === 'none') {
                this.playbackState = PLAYBACK_STATES.STOPPED;
                return true;
            }

            const track = this.tracks.get(selectedTrackId);
            if (!track || !track.isLoaded()) {
                this._handleError(new Error(`Track ${selectedTrackId} not loaded`), 'play');
                return false;
            }

            // Stop current playback if any
            this.stop();

            // Create new audio source
            this.currentSource = track.createSource();
            if (!this.currentSource) {
                this._handleError(new Error(`Failed to create source for ${selectedTrackId}`), 'play');
                return false;
            }

            // Connect to master gain node
            this.currentSource.connect(this.masterGainNode);

            // Configure looping
            this.currentSource.loop = track.shouldLoop();

            // Set up ended event handler
            this.currentSource.onended = () => {
                if (this.playbackState === PLAYBACK_STATES.PLAYING) {
                    this.playbackState = PLAYBACK_STATES.STOPPED;
                    this.currentSource = null;
                }
            };

            // Start playback
            this.currentSource.start(0);
            this.currentTrack = track;
            this.playbackState = PLAYBACK_STATES.PLAYING;

            return true;

        } catch (error) {
            this._handleError(error, 'play');
            return false;
        }
    }

    /**
     * Pause the currently playing track
     * @returns {boolean} True if pause was successful
     */
    pause() {
        if (this.playbackState !== PLAYBACK_STATES.PLAYING) {
            return false;
        }

        try {
            // Web Audio API doesn't support pause/resume, so we stop and track position
            // For music tracks that loop, we just stop and can restart from beginning
            this.stop();
            this.playbackState = PLAYBACK_STATES.PAUSED;
            return true;

        } catch (error) {
            this._handleError(error, 'pause');
            return false;
        }
    }

    /**
     * Stop the currently playing track
     * @returns {boolean} True if stop was successful
     */
    stop() {
        if (this.playbackState === PLAYBACK_STATES.STOPPED) {
            return true;
        }

        try {
            // Stop current source if playing
            if (this.currentSource) {
                this.currentSource.stop();
                this.currentSource = null;
            }

            // Clear fade state
            this.fadeState.active = false;

            // Clear ducking state
            this._clearDucking();

            this.playbackState = PLAYBACK_STATES.STOPPED;
            this.currentTrack = null;

            return true;

        } catch (error) {
            this._handleError(error, 'stop');
            return false;
        }
    }

    /**
     * Set the current track by ID
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track was set successfully
     */
    setTrack(trackId) {
        if (!MusicConfigUtils.isValidTrackId(trackId)) {
            this._handleError(new Error(`Invalid track ID: ${trackId}`), 'setTrack');
            return false;
        }

        try {
            // Update settings
            if (!this.settings.setSelectedTrack(trackId)) {
                return false;
            }

            // If currently playing, switch to new track
            const wasPlaying = this.playbackState === PLAYBACK_STATES.PLAYING;

            if (wasPlaying) {
                this.stop();

                // If new track is not "none", start playing it
                if (trackId !== 'none') {
                    return this.play();
                }
            }

            return true;

        } catch (error) {
            this._handleError(error, 'setTrack');
            return false;
        }
    }

    /**
     * Get list of available tracks
     * @returns {Array} Array of track information objects
     */
    getAvailableTracks() {
        const trackList = [];

        for (const track of this.tracks.values()) {
            trackList.push({
                id: track.getId(),
                name: track.getName(),
                energyLevel: track.getEnergyLevel(),
                duration: track.getDuration(),
                isLoaded: track.isLoaded(),
                loadingState: track.getLoadingState()
            });
        }

        return trackList;
    }

    /**
     * Get current track information
     * @returns {Object|null} Current track info or null if none
     */
    getCurrentTrack() {
        if (!this.currentTrack) {
            return null;
        }

        return {
            id: this.currentTrack.getId(),
            name: this.currentTrack.getName(),
            energyLevel: this.currentTrack.getEnergyLevel(),
            duration: this.currentTrack.getDuration(),
            playbackState: this.playbackState
        };
    }

    /**
     * Set the music volume (0.0 to 1.0)
     * @param {number} level - Volume level
     * @returns {boolean} True if volume was set successfully
     */
    setVolume(level) {
        if (typeof level !== 'number' || level < 0 || level > 1) {
            this._handleError(new Error(`Invalid volume level: ${level}`), 'setVolume');
            return false;
        }

        try {
            // Update settings
            if (!this.settings.setMusicVolume(level)) {
                return false;
            }

            this.currentVolume = level;

            // Apply volume immediately if initialized
            if (this.masterGainNode) {
                // If we're in a fade transition, update the target volume
                if (this.fadeState.active) {
                    this.fadeState.targetVolume = level;
                } else {
                    // Apply volume immediately
                    this.masterGainNode.gain.value = level;
                }
            }

            return true;

        } catch (error) {
            this._handleError(error, 'setVolume');
            return false;
        }
    }

    /**
     * Get the current music volume
     * @returns {number} Current volume level (0.0 to 1.0)
     */
    getVolume() {
        return this.currentVolume;
    }

    /**
     * Check if music is currently playing
     * @returns {boolean} True if music is playing
     */
    isPlaying() {
        return this.playbackState === PLAYBACK_STATES.PLAYING;
    }

    /**
     * Check if music is currently paused
     * @returns {boolean} True if music is paused
     */
    isPaused() {
        return this.playbackState === PLAYBACK_STATES.PAUSED;
    }

    /**
     * Get the current playback state
     * @returns {string} Current playback state
     */
    getPlaybackState() {
        return this.playbackState;
    }

    /**
     * Handle error with context and graceful degradation
     * @param {Error} error - The error that occurred
     * @param {string} operation - The operation that failed
     * @param {Object} context - Additional context information
     * @private
     */
    _handleError(error, operation, context = {}) {
        this.errorCount++;
        this.lastError = {
            message: error.message,
            operation: operation,
            timestamp: Date.now()
        };

        // Use error handler for comprehensive error handling
        const recovery = this.errorHandler.handlePlaybackError(error, operation, {
            ...context,
            trackId: this.currentTrack ? this.currentTrack.getId() : 'unknown'
        });

        console.warn(`MusicPlayer error in ${operation}:`, error);

        // Apply recovery action
        if (recovery.action === 'pause_and_retry' && recovery.canRetry) {
            setTimeout(() => {
                if (this.playbackState === PLAYBACK_STATES.STOPPED) {
                    this.play();
                }
            }, recovery.retryDelay || 2000);
        } else if (recovery.action === 'stop_playback') {
            this.stop();
        }

        // Set error state if too many errors
        if (this.errorCount > 5) {
            this.playbackState = PLAYBACK_STATES.ERROR;
        }

        // Continue execution - don't throw errors that would break the game
    }

    /**
     * Clear ducking state and recovery timeout
     * @private
     */
    _clearDucking() {
        if (this.duckingState.recoveryTimeout) {
            clearTimeout(this.duckingState.recoveryTimeout);
            this.duckingState.recoveryTimeout = null;
        }

        this.duckingState.active = false;
        this.duckingState.originalVolume = 0;
        this.duckingState.duckLevel = 0;
    }

    /**
     * Get current error information
     * @returns {Object|null} Last error info or null if no errors
     */
    getLastError() {
        return this.lastError;
    }

    /**
     * Get music player status information
     * @returns {Object} Status information object
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            playbackState: this.playbackState,
            currentTrack: this.getCurrentTrack(),
            volume: this.currentVolume,
            selectedTrackId: this.settings.getSelectedTrack(),
            fadeActive: this.fadeState.active,
            duckingActive: this.duckingState.active,
            errorCount: this.errorCount,
            lastError: this.lastError
        };
    }

    /**
     * Fade in the music over specified duration
     * @param {number} duration - Fade duration in seconds (optional)
     * @returns {Promise<boolean>} Resolves when fade completes
     */
    async fadeIn(duration = null) {
        if (!this.isInitialized || !this.masterGainNode) {
            return false;
        }

        try {
            const fadeDuration = duration || this.settings.getFadeInDuration();

            // Record fade operation for performance monitoring
            this.performanceMonitor.recordFadeOperation('in', fadeDuration);

            // Start playing if not already playing
            if (this.playbackState !== PLAYBACK_STATES.PLAYING) {
                // Set volume to 0 before starting
                this.masterGainNode.gain.value = 0;

                if (!this.play()) {
                    return false;
                }
            }

            // Set up fade state
            this.fadeState = {
                active: true,
                type: 'in',
                startTime: this.audioContext.currentTime,
                duration: fadeDuration,
                startVolume: this.masterGainNode.gain.value,
                targetVolume: this.currentVolume
            };

            this.playbackState = PLAYBACK_STATES.FADING_IN;

            // Perform the fade using Web Audio API
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(0, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(
                this.currentVolume,
                currentTime + fadeDuration
            );

            // Wait for fade to complete
            await this._waitForFade(fadeDuration);

            // Update state after fade completes
            this.fadeState.active = false;
            this.playbackState = PLAYBACK_STATES.PLAYING;

            return true;

        } catch (error) {
            this._handleError(error, 'fadeIn', { duration: fadeDuration });
            this.fadeState.active = false;
            return false;
        }
    }

    /**
     * Fade out the music over specified duration
     * @param {number} duration - Fade duration in seconds (optional)
     * @returns {Promise<boolean>} Resolves when fade completes
     */
    async fadeOut(duration = null) {
        if (!this.isInitialized || !this.masterGainNode || this.playbackState === PLAYBACK_STATES.STOPPED) {
            return false;
        }

        try {
            const fadeDuration = duration || this.settings.getFadeOutDuration();

            // Set up fade state
            this.fadeState = {
                active: true,
                type: 'out',
                startTime: this.audioContext.currentTime,
                duration: fadeDuration,
                startVolume: this.masterGainNode.gain.value,
                targetVolume: 0
            };

            this.playbackState = PLAYBACK_STATES.FADING_OUT;

            // Perform the fade using Web Audio API
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(0, currentTime + fadeDuration);

            // Wait for fade to complete
            await this._waitForFade(fadeDuration);

            // Stop playback after fade completes
            this.stop();

            // Restore volume for next playback
            this.masterGainNode.gain.value = this.currentVolume;

            return true;

        } catch (error) {
            this._handleError(error, 'fadeOut');
            this.fadeState.active = false;
            return false;
        }
    }

    /**
     * Wait for a fade operation to complete
     * @param {number} duration - Duration to wait in seconds
     * @returns {Promise<void>} Resolves after duration
     * @private
     */
    _waitForFade(duration) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, duration * 1000);
        });
    }

    /**
     * Check if a fade transition is currently active
     * @returns {boolean} True if fade is active
     */
    isFading() {
        return this.fadeState.active;
    }

    /**
     * Get current fade state information
     * @returns {Object} Fade state object
     */
    getFadeState() {
        return {
            active: this.fadeState.active,
            type: this.fadeState.type,
            progress: this._calculateFadeProgress(),
            duration: this.fadeState.duration
        };
    }

    /**
     * Calculate current fade progress (0.0 to 1.0)
     * @returns {number} Fade progress
     * @private
     */
    _calculateFadeProgress() {
        if (!this.fadeState.active || !this.audioContext) {
            return 0;
        }

        const elapsed = this.audioContext.currentTime - this.fadeState.startTime;
        const progress = Math.min(elapsed / this.fadeState.duration, 1.0);

        return Math.max(progress, 0);
    }

    /**
     * Cancel any active fade transition
     * @returns {boolean} True if fade was cancelled
     */
    cancelFade() {
        if (!this.fadeState.active || !this.masterGainNode) {
            return false;
        }

        try {
            // Cancel scheduled gain changes
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);

            // Set to current volume immediately
            this.masterGainNode.gain.setValueAtTime(this.currentVolume, currentTime);

            // Clear fade state
            this.fadeState.active = false;

            // Update playback state
            if (this.playbackState === PLAYBACK_STATES.FADING_IN ||
                this.playbackState === PLAYBACK_STATES.FADING_OUT) {
                this.playbackState = this.currentSource ? PLAYBACK_STATES.PLAYING : PLAYBACK_STATES.STOPPED;
            }

            return true;

        } catch (error) {
            this._handleError(error, 'cancelFade');
            return false;
        }
    }

    /**
     * Perform a smooth volume transition between two levels
     * @param {number} targetVolume - Target volume level (0.0 to 1.0)
     * @param {number} duration - Transition duration in seconds
     * @returns {Promise<boolean>} Resolves when transition completes
     */
    async smoothVolumeTransition(targetVolume, duration = 0.5) {
        if (!this.isInitialized || !this.masterGainNode) {
            return false;
        }

        if (targetVolume < 0 || targetVolume > 1) {
            this._handleError(new Error(`Invalid target volume: ${targetVolume}`), 'smoothVolumeTransition');
            return false;
        }

        try {
            // Cancel any existing fade
            this.cancelFade();

            // Set up transition
            const currentTime = this.audioContext.currentTime;
            const startVolume = this.masterGainNode.gain.value;

            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(startVolume, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);

            // Update current volume setting
            this.currentVolume = targetVolume;
            this.settings.setMusicVolume(targetVolume);

            // Wait for transition to complete
            await this._waitForFade(duration);

            return true;

        } catch (error) {
            this._handleError(error, 'smoothVolumeTransition');
            return false;
        }
    }

    /**
     * Duck the music volume to allow sound effects to be heard clearly
     * @param {number} level - Duck level (0.0 to 1.0, where 0.3 means reduce to 30% of current volume)
     * @param {number} duration - Duck transition duration in seconds
     * @returns {boolean} True if ducking was applied successfully
     */
    duck(level = null, duration = null) {
        if (!this.isInitialized || !this.masterGainNode || this.playbackState !== PLAYBACK_STATES.PLAYING) {
            return false;
        }

        try {
            const duckLevel = level !== null ? level : this.settings.getDuckingLevel();
            const duckDuration = duration !== null ? duration : this.settings.getDuckingDuration();

            // Record ducking operation for performance monitoring
            this.performanceMonitor.recordDuckingOperation(duckLevel, duckDuration);

            // Validate parameters
            if (duckLevel < 0 || duckLevel > 1) {
                this._handleError(new Error(`Invalid duck level: ${duckLevel}`), 'duck');
                return false;
            }

            // Store original volume if not already ducking
            if (!this.duckingState.active) {
                this.duckingState.originalVolume = this.masterGainNode.gain.value;
            }

            // Calculate target ducked volume
            const targetVolume = this.duckingState.originalVolume * duckLevel;

            // Apply ducking transition
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duckDuration);

            // Update ducking state
            this.duckingState.active = true;
            this.duckingState.duckLevel = duckLevel;
            this.playbackState = PLAYBACK_STATES.DUCKED;

            return true;

        } catch (error) {
            this._handleError(error, 'duck');
            return false;
        }
    }

    /**
     * Restore music volume after ducking
     * @param {number} duration - Recovery duration in seconds
     * @returns {boolean} True if unducking was successful
     */
    unduck(duration = null) {
        if (!this.isInitialized || !this.masterGainNode || !this.duckingState.active) {
            return false;
        }

        try {
            const recoveryDuration = duration !== null ? duration : this.settings.getDuckingRecovery();

            // Apply recovery transition
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(
                this.duckingState.originalVolume,
                currentTime + recoveryDuration
            );

            // Clear ducking state
            this._clearDucking();

            // Restore playback state if it was DUCKED
            if (this.playbackState === PLAYBACK_STATES.DUCKED) {
                this.playbackState = PLAYBACK_STATES.PLAYING;
            }

            return true;

        } catch (error) {
            this._handleError(error, 'unduck');
            return false;
        }
    }

    /**
     * Handle sound effects that trigger ducking
     * @param {string} effectType - Type of sound effect ('explosion', 'victory', 'defeat')
     * @returns {boolean} True if ducking was triggered
     */
    onSoundEffect(effectType) {
        if (!DUCKING_TRIGGERS[effectType]) {
            return false;
        }

        const config = DUCKING_TRIGGERS[effectType];

        // Apply ducking
        this.duck(config.level, config.duration);

        // Schedule automatic recovery
        if (this.duckingState.recoveryTimeout) {
            clearTimeout(this.duckingState.recoveryTimeout);
        }

        this.duckingState.recoveryTimeout = setTimeout(() => {
            this.unduck(config.recovery);
        }, (config.duration + config.hold) * 1000);

        return true;
    }

    /**
     * Handle game start event
     */
    async onGameStart() {
        if (this.settings.shouldPlayOnStart()) {
            // If we have a selected track, play it
            if (this.settings.getSelectedTrack() !== 'none') {
                // Use fade in if configured
                if (this.settings.shouldFadeIn()) {
                    await this.fadeIn();
                } else {
                    this.play();
                }
            }
        }
    }

    /**
     * Handle game pause event
     */
    async onGamePause() {
        if (this.isPlaying()) {
            // Pause music or lower volume based on preference
            // For now, we'll just pause
            this.pause();
        }
    }

    /**
     * Handle game resume event
     */
    async onGameResume() {
        if (this.isPaused()) {
            // Resume playback
            this.play();
        }
    }

    /**
     * Handle game end event
     */
    async onGameEnd() {
        // Fade out music on game end
        if (this.isPlaying()) {
            await this.fadeOut(2.0); // Slower fade out for game end
        }
    }

    /**
     * Handle game restart event
     */
    async onGameRestart() {
        // Stop current music and restart (potentially with new track if randomized)
        await this.stop();

        // Restart music
        await this.onGameStart();
    }

    /**
     * Clean up resources
     */


    /**
     * Restore music volume after ducking
     * @param {number} duration - Recovery transition duration in seconds
     * @returns {boolean} True if recovery was applied successfully
     */
    unduck(duration = null) {
        if (!this.duckingState.active || !this.masterGainNode) {
            return false;
        }

        try {
            const recoveryDuration = duration !== null ? duration : this.settings.getDuckingDuration();

            // Apply recovery transition
            const currentTime = this.audioContext.currentTime;
            this.masterGainNode.gain.cancelScheduledValues(currentTime);
            this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
            this.masterGainNode.gain.linearRampToValueAtTime(
                this.duckingState.originalVolume,
                currentTime + recoveryDuration
            );

            // Clear ducking state
            this._clearDucking();
            this.playbackState = PLAYBACK_STATES.PLAYING;

            return true;

        } catch (error) {
            this._handleError(error, 'unduck');
            return false;
        }
    }

    /**
     * Handle sound effect playback with automatic ducking
     * @param {string} effectType - Type of sound effect being played
     * @returns {boolean} True if ducking was applied
     */
    onSoundEffect(effectType) {
        if (!this.isInitialized || this.playbackState !== PLAYBACK_STATES.PLAYING) {
            return false;
        }

        try {
            // Get ducking configuration for this sound effect
            const duckingConfig = MusicConfigUtils.getDuckingConfig(effectType);

            if (!duckingConfig) {
                // Use default ducking for unknown sound effects
                return this.duck();
            }

            // Apply specific ducking for this sound effect
            const success = this.duck(duckingConfig.duckingLevel, duckingConfig.duration);

            if (success) {
                // Schedule recovery after the sound effect should complete
                this._scheduleDuckingRecovery(duckingConfig.recoveryDelay || 200);
            }

            return success;

        } catch (error) {
            this._handleError(error, 'onSoundEffect');
            return false;
        }
    }

    /**
     * Schedule automatic recovery from ducking after a delay
     * @param {number} delay - Delay in milliseconds before recovery
     * @private
     */
    _scheduleDuckingRecovery(delay) {
        // Clear any existing recovery timeout
        if (this.duckingState.recoveryTimeout) {
            clearTimeout(this.duckingState.recoveryTimeout);
        }

        // Schedule recovery
        this.duckingState.recoveryTimeout = setTimeout(() => {
            this.unduck();
        }, delay);
    }

    /**
     * Check if music is currently ducked
     * @returns {boolean} True if music is ducked
     */
    isDucked() {
        return this.duckingState.active;
    }

    /**
     * Get current ducking state information
     * @returns {Object} Ducking state object
     */
    getDuckingState() {
        return {
            active: this.duckingState.active,
            originalVolume: this.duckingState.originalVolume,
            duckLevel: this.duckingState.duckLevel,
            hasRecoveryScheduled: !!this.duckingState.recoveryTimeout
        };
    }

    /**
     * Manually trigger ducking for explosion sound effects
     * Implements automatic ducking for high-priority explosion sounds
     */
    onExplosionSound() {
        return this.onSoundEffect('explosion');
    }

    /**
     * Manually trigger ducking for collision sound effects
     * Implements automatic ducking for collision sounds
     */
    onCollisionSound() {
        return this.onSoundEffect('collision');
    }

    /**
     * Manually trigger ducking for victory sound effects
     * Implements automatic ducking for victory sounds
     */
    onVictorySound() {
        return this.onSoundEffect('victory');
    }

    /**
     * Manually trigger ducking for defeat sound effects
     * Implements automatic ducking for defeat sounds
     */
    onDefeatSound() {
        return this.onSoundEffect('defeat');
    }

    /**
     * Handle game start event - begin music with fade-in
     * @returns {Promise<boolean>} True if music started successfully
     */
    async onGameStart() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Start music with fade-in
            return await this.fadeIn();
        } catch (error) {
            this._handleError(error, 'onGameStart');
            return false;
        }
    }

    /**
     * Handle game pause event - fade out music
     * @returns {Promise<boolean>} True if music paused successfully
     */
    async onGamePause() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Fade out music when paused
            return await this.fadeOut(0.5);
        } catch (error) {
            this._handleError(error, 'onGamePause');
            return false;
        }
    }

    /**
     * Handle game resume event - fade in music
     * @returns {Promise<boolean>} True if music resumed successfully
     */
    async onGameResume() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Fade in music when resumed
            return await this.fadeIn(0.5);
        } catch (error) {
            this._handleError(error, 'onGameResume');
            return false;
        }
    }

    /**
     * Handle game end event - fade out music
     * @returns {Promise<boolean>} True if music stopped successfully
     */
    async onGameEnd() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Fade out music when game ends
            return await this.fadeOut(1.0);
        } catch (error) {
            this._handleError(error, 'onGameEnd');
            return false;
        }
    }

    /**
     * Handle game restart event - start fresh music
     * @returns {Promise<boolean>} True if music restarted successfully
     */
    async onGameRestart() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Stop current music
            this.stop();

            // Clear any ducking state
            this._clearDucking();

            // Start fresh music with fade-in
            return await this.fadeIn();
        } catch (error) {
            this._handleError(error, 'onGameRestart');
            return false;
        }
    }

    /**
     * Start background loading for non-priority tracks
     * @param {Array} trackConfigs - Track configurations to load in background
     * @private
     */
    _startBackgroundLoading(trackConfigs) {
        // Use setTimeout to avoid blocking initialization
        setTimeout(async () => {
            try {
                const results = await this.loadingOptimizer.progressiveLoad(
                    trackConfigs,
                    (progress, trackId) => {
                        console.log(`Background loading progress: ${Math.round(progress * 100)}% (${trackId})`);
                    },
                    (trackId, success, loadTime, error) => {
                        if (success) {
                            const track = this.tracks.get(trackId);
                            if (track) {
                                const audioBuffer = track.getAudioBuffer();
                                if (audioBuffer) {
                                    const trackConfig = MUSIC_TRACKS[trackId];
                                    this.bufferManager.registerBuffer(trackId, audioBuffer, trackConfig);
                                }
                            }
                        }
                    }
                );

                console.log(`Background loading completed: ${results.loaded.length} loaded, ${results.failed.length} failed`);
            } catch (error) {
                console.warn('Background loading error:', error);
            }
        }, 100); // Small delay to allow initialization to complete
    }

    /**
     * Get comprehensive error and performance information
     * @returns {Object} System status including errors and performance metrics
     */
    getSystemStatus() {
        return {
            ...this.getStatus(),
            errorStatistics: this.errorHandler.getErrorStatistics(),
            performanceMetrics: this.performanceMonitor.getMetrics(),
            memoryUsage: this.performanceMonitor.getMemoryUsage(),
            loadingPerformance: this.performanceMonitor.getLoadingPerformance(),
            frameRateImpact: this.performanceMonitor.getFrameRateImpact(),
            optimizationRecommendations: this.performanceMonitor.getOptimizationRecommendations(),
            bufferStatistics: this.bufferManager.getStatistics(),
            bufferMemoryUsage: this.bufferManager.getMemoryUsage()
        };
    }

    /**
     * Perform system optimization based on current performance metrics
     * @returns {Object} Optimization results
     */
    async performOptimization() {
        const recommendations = this.performanceMonitor.getOptimizationRecommendations();
        const results = {
            performed: [],
            skipped: [],
            errors: []
        };

        // Perform buffer manager optimization
        try {
            const bufferOptimization = this.bufferManager.optimizeLoadingStrategy();
            if (bufferOptimization.optimizations.length > 0) {
                results.performed.push({
                    action: 'buffer_optimization',
                    result: bufferOptimization
                });
            }
        } catch (error) {
            results.errors.push({
                action: 'buffer_optimization',
                error: error.message
            });
        }

        // Perform memory cleanup if needed
        const memoryUsage = this.bufferManager.getMemoryUsage();
        if (memoryUsage.utilizationPercentage > 80) {
            try {
                const cleanupResult = this.bufferManager.performCleanup({ forceCleanup: false });
                results.performed.push({
                    action: 'memory_cleanup',
                    result: cleanupResult
                });
            } catch (error) {
                results.errors.push({
                    action: 'memory_cleanup',
                    error: error.message
                });
            }
        }

        for (const recommendation of recommendations) {
            try {
                switch (recommendation.action) {
                    case 'cleanup_buffers':
                        const cleanupResult = this.bufferManager.performCleanup();
                        results.performed.push({
                            action: recommendation.action,
                            result: cleanupResult
                        });
                        break;

                    case 'reduce_complexity':
                        // Reduce audio processing complexity
                        this.settings.setMusicVolume(Math.min(this.settings.getMusicVolume(), 0.7));
                        results.performed.push({
                            action: recommendation.action,
                            result: 'Reduced volume to minimize processing load'
                        });
                        break;

                    case 'optimize_files':
                        // Suggest loading strategy optimization
                        const currentStrategy = this.bufferManager.preloadStrategy;
                        const recommendedStrategy = this.bufferManager.getRecommendedPreloadStrategy();
                        if (currentStrategy !== recommendedStrategy) {
                            this.bufferManager.setPreloadStrategy(recommendedStrategy);
                            results.performed.push({
                                action: recommendation.action,
                                result: `Changed preload strategy from ${currentStrategy} to ${recommendedStrategy}`
                            });
                        } else {
                            results.skipped.push({
                                action: recommendation.action,
                                reason: 'Already using optimal preload strategy'
                            });
                        }
                        break;

                    default:
                        results.skipped.push({
                            action: recommendation.action,
                            reason: 'No automatic optimization available'
                        });
                }
            } catch (error) {
                results.errors.push({
                    action: recommendation.action,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stop();
        this._clearDucking();

        // Cancel any active fades
        this.cancelFade();

        // Stop monitoring and optimization systems
        if (this.performanceMonitor) {
            this.performanceMonitor.cleanup();
        }

        if (this.bufferManager) {
            this.bufferManager.cleanup();
        }

        if (this.loadingOptimizer) {
            this.loadingOptimizer.cleanup();
        }

        // Clear error log
        if (this.errorHandler) {
            this.errorHandler.clearErrorLog();
        }

        // Clear all tracks
        for (const track of this.tracks.values()) {
            track.cleanup();
        }
        this.tracks.clear();

        // Disconnect audio nodes
        if (this.masterGainNode) {
            this.masterGainNode.disconnect();
            this.masterGainNode = null;
        }

        this.audioContext = null;
        this.isInitialized = false;
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicPlayer };