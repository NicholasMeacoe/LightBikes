/**
 * AudioManager - Handles all game audio operations including sound effects and background audio
 * Provides centralized audio management with mute functionality and error handling
 */
const { logger } = require('../utils/Logger.js');

class AudioManager {
    constructor() {
        // Web Audio API context - initialized lazily on first user interaction
        this.audioContext = null;

        // Music system integration
        this.musicPlayer = null;
        this.musicSettings = null;
        this.musicInitialized = false;

        // Storage for preloaded audio buffers
        this.sounds = {};

        // Audio state management
        this.isMuted = false;
        this.isInitialized = false;

        // Current playing audio references
        this.currentEngine = null;

        // Audio configuration
        this.soundConfig = {
            turn: {
                volume: 0.3,
                maxConcurrent: 1,
                cooldown: 100, // ms between plays
            },
            engine: {
                volume: 0.2,
                loop: true,
                fadeIn: 200,
                fadeOut: 200,
            },
            explosion: {
                volume: 0.8,
                priority: 'high',
                interruptOthers: true,
            },
            victory: {
                volume: 0.6,
                delay: 500, // ms after explosion
            },
            defeat: {
                volume: 0.4,
                delay: 500,
            },
            powerup_collect: {
                volume: 0.5,
                maxConcurrent: 2,
                cooldown: 50, // ms between collections
            },
            shrink_warning: {
                volume: 0.4,
                maxConcurrent: 1,
                cooldown: 1000, // Prevent warning spam
            },
            shrink_execute: {
                volume: 0.6,
                maxConcurrent: 1,
                priority: 'medium',
            },
        };

        // Performance safeguards
        this.maxConcurrentSounds = 5;
        this.activeSounds = [];

        // Turn sound spam prevention
        this.lastTurnTime = 0;

        // Audio buffer management
        this.bufferCleanupInterval = null;
        this.bufferCleanupFrequency = 30000; // 30 seconds

        // Performance monitoring
        this.performanceMetrics = {
            activeSoundsCount: 0,
            bufferMemoryUsage: 0,
            lastCleanupTime: 0,
        };

        // Load saved mute state from localStorage
        this.loadMuteState();
    }

    /**
     * Load mute state from localStorage
     * @private
     */
    loadMuteState() {
        try {
            const savedMuteState = localStorage.getItem('lightbikes_audio_muted');
            if (savedMuteState !== null) {
                this.isMuted = JSON.parse(savedMuteState);
            }
        } catch (error) {
            this.handleAudioError(error, 'localStorage');
        }
    }

    /**
     * Save mute state to localStorage
     * @private
     */
    saveMuteState() {
        try {
            localStorage.setItem('lightbikes_audio_muted', JSON.stringify(this.isMuted));
        } catch (error) {
            this.handleAudioError(error, 'localStorage');
        }
    }

    /**
     * Handle audio-related errors gracefully
     * @param {Error} error - The error that occurred
     * @param {string} soundType - The type of sound or operation that failed
     * @private
     */
    handleAudioError(error, soundType) {
        // Log error with context
        logger.warn(`Audio error for ${soundType}:`, { error });

        // Categorize error types for better handling
        const errorType = this.categorizeError(error);

        switch (errorType) {
            case 'autoplay_blocked':
                logger.info(
                    'Audio blocked by autoplay policy. Audio will start after user interaction.'
                );
                break;

            case 'format_unsupported':
                logger.warn(
                    `Audio format not supported for ${soundType}. Trying fallback formats.`
                );
                this.tryAlternativeFormat(soundType);
                break;

            case 'network_error':
                logger.warn(
                    `Network error loading ${soundType}. Audio will be disabled for this sound.`
                );
                this.markSoundUnavailable(soundType);
                break;

            case 'context_error':
                logger.error('Audio context error. Attempting to reinitialize audio system.');
                this.handleContextError();
                break;

            case 'playback_error':
                logger.warn(`Playback error for ${soundType}. Continuing without this sound.`);
                break;

            default:
                logger.warn(
                    `Unknown audio error for ${soundType}. Continuing with graceful degradation.`
                );
        }

        // Mark sound as unavailable if it's a specific sound type
        if (this.sounds[soundType]) {
            this.sounds[soundType] = {
                type: 'failed',
                buffer: null,
                loaded: false,
                error: error.message,
            };
        }

        // Continue game execution without audio - no throwing or blocking
    }

    /**
     * Categorize error types for better handling
     * @param {Error} error - The error to categorize
     * @returns {string} Error category
     * @private
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();

        if (message.includes('autoplay') || message.includes('user activation')) {
            return 'autoplay_blocked';
        }

        if (message.includes('format') || message.includes('codec') || message.includes('decode')) {
            return 'format_unsupported';
        }

        if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
            return 'network_error';
        }

        if (message.includes('context') || message.includes('suspended')) {
            return 'context_error';
        }

        if (message.includes('play') || message.includes('start')) {
            return 'playback_error';
        }

        return 'unknown';
    }

    /**
     * Try alternative audio format when primary format fails
     * @param {string} soundType - The sound type to find alternative for
     * @private
     */
    tryAlternativeFormat(soundType) {
        const capabilities = this.detectBrowserCapabilities();
        const soundFiles = this.getSoundFileList();
        const originalPath = soundFiles[soundType];

        if (!originalPath) {
            return;
        }

        // Try different formats based on browser support
        const alternatives = [];

        if (capabilities.formats.ogg && originalPath.includes('.mp3')) {
            alternatives.push(originalPath.replace('.mp3', '.ogg'));
        }

        if (capabilities.formats.wav) {
            alternatives.push(originalPath.replace(/\.(mp3|ogg)$/, '.wav'));
        }

        // Try loading alternatives
        alternatives.forEach(async (altPath) => {
            try {
                await this.loadSoundBuffer(soundType, altPath);
                logger.info(`Successfully loaded alternative format for ${soundType}: ${altPath}`);
            } catch (altError) {
                logger.warn(`Alternative format also failed for ${soundType}: ${altPath}`);
            }
        });
    }

    /**
     * Mark a sound as unavailable
     * @param {string} soundType - The sound type to mark as unavailable
     * @private
     */
    markSoundUnavailable(soundType) {
        this.sounds[soundType] = {
            type: 'unavailable',
            buffer: null,
            loaded: false,
            error: 'Sound marked as unavailable due to loading failure',
        };
    }

    /**
     * Handle audio context errors by attempting recovery
     * @private
     */
    handleContextError() {
        if (this.audioContext) {
            try {
                // Try to resume suspended context
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().catch((resumeError) => {
                        logger.warn('Failed to resume audio context:', { error: resumeError });
                    });
                }

                // If context is closed, mark for reinitialization
                if (this.audioContext.state === 'closed') {
                    this.audioContext = null;
                    this.isInitialized = false;
                    logger.info(
                        'Audio context closed. Will reinitialize on next audio interaction.'
                    );
                }
            } catch (recoveryError) {
                logger.error('Audio context recovery failed:', { error: recoveryError });
                this.audioContext = null;
                this.isInitialized = false;
            }
        }
    }

    /**
     * Check if Web Audio API is supported
     * @returns {boolean} True if Web Audio API is available
     * @private
     */
    isWebAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * Check browser autoplay policy compliance
     * @returns {Promise<boolean>} True if autoplay is allowed
     * @private
     */
    async checkAutoplayPolicy() {
        if (!this.audioContext) {
            return false;
        }

        try {
            // Test if we can create and start a silent audio source
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            // If we get here without error, autoplay is likely allowed
            return true;
        } catch (error) {
            logger.warn('Autoplay policy may be blocking audio:', { error });
            return false;
        }
    }

    /**
     * Detect browser-specific audio capabilities
     * @returns {Object} Browser capability information
     * @private
     */
    detectBrowserCapabilities() {
        const capabilities = {
            webAudio: this.isWebAudioSupported(),
            html5Audio: !!window.Audio,
            formats: {
                mp3: false,
                ogg: false,
                wav: false,
                m4a: false,
            },
            autoplayBlocked: false,
        };

        // Test audio format support
        if (capabilities.html5Audio) {
            const audio = new Audio();
            capabilities.formats.mp3 = !!(audio.canPlayType && audio.canPlayType('audio/mpeg'));
            capabilities.formats.ogg = !!(audio.canPlayType && audio.canPlayType('audio/ogg'));
            capabilities.formats.wav = !!(audio.canPlayType && audio.canPlayType('audio/wav'));
            capabilities.formats.m4a = !!(audio.canPlayType && audio.canPlayType('audio/mp4'));
        }

        return capabilities;
    }

    /**
     * Handle user interaction to comply with autoplay policies
     * Should be called on first user interaction (click, touch, keypress)
     * @returns {Promise<boolean>} True if audio context was successfully activated
     */
    async handleUserInteraction() {
        if (!this.isInitialized) {
            return await this.initialize();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                logger.info('Audio context activated by user interaction');
                return true;
            } catch (error) {
                this.handleAudioError(error, 'user_interaction');
                return false;
            }
        }

        return true;
    }

    /**
     * Get current mute state
     * @returns {boolean} Current mute state
     */
    getMuted() {
        return this.isMuted;
    }

    /**
     * Set mute state and persist to localStorage
     * @param {boolean} muted - New mute state
     */
    setMuted(muted) {
        this.isMuted = muted;
        this.saveMuteState();

        if (muted) {
            this.stopAllAudio();
            // Also stop music when muted
            this.stopMusic();
        }
    }

    /**
     * Stop all currently playing audio
     * @private
     */
    stopAllAudio() {
        // Stop engine sound if playing
        if (this.currentEngine) {
            try {
                if (
                    this.currentEngine &&
                    typeof (/** @type {any} */ (this.currentEngine).stop) === 'function'
                ) {
                    /** @type {any} */ (this.currentEngine).stop();
                }
            } catch (error) {
                this.handleAudioError(error, 'engine_stop');
            }
            this.currentEngine = null;
        }

        // Stop all active sounds
        this.activeSounds.forEach((sound) => {
            try {
                if (sound && sound.stop) {
                    sound.stop();
                }
            } catch (error) {
                this.handleAudioError(error, 'active_sound_stop');
            }
        });

        this.activeSounds = [];
    }

    /**
     * Initialize audio context and preload sounds on first user interaction
     * Implements lazy loading to comply with browser autoplay policies
     * @returns {Promise<boolean>} True if initialization successful, false otherwise
     */
    async initialize() {
        // Return early if already initialized
        if (this.isInitialized) {
            return true;
        }

        try {
            // Check for Web Audio API support
            if (!this.isWebAudioSupported()) {
                logger.warn('Web Audio API not supported, falling back to HTML5 Audio');
                return this.initializeHTMLAudio();
            }

            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Handle suspended context (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    logger.info('Audio context resumed successfully');
                } catch (resumeError) {
                    logger.warn('Failed to resume audio context, may need user interaction:', {
                        error: resumeError,
                    });
                    // Don't fail initialization, just note that user interaction may be needed
                }
            }

            // Check autoplay policy compliance
            const autoplayAllowed = await this.checkAutoplayPolicy();
            if (!autoplayAllowed) {
                logger.info('Autoplay may be blocked. Audio will start after user interaction.');
            }

            // Preload all sound files
            const preloadSuccess = await this.preloadSounds();

            if (preloadSuccess) {
                this.isInitialized = true;
                this.startBufferCleanup(); // Start periodic cleanup

                // Initialize music system
                await this.initializeMusicSystem();

                logger.info('AudioManager initialized successfully');
                return true;
            } else {
                logger.warn(
                    'AudioManager initialization completed with some audio loading failures'
                );
                this.isInitialized = true; // Still mark as initialized to prevent retries
                this.startBufferCleanup(); // Start cleanup even with partial success
                return false;
            }
        } catch (error) {
            this.handleAudioError(error, 'initialization');
            return false;
        }
    }

    /**
     * Fallback initialization using HTML5 Audio elements
     * Used when Web Audio API is not supported
     * @returns {Promise<boolean>} True if fallback initialization successful
     * @private
     */
    async initializeHTMLAudio() {
        try {
            // Create HTML5 Audio elements for each sound
            const soundFiles = this.getSoundFileList();

            for (const [soundName, filePath] of Object.entries(soundFiles)) {
                try {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = filePath;

                    // Store as HTML5 Audio element instead of buffer
                    this.sounds[soundName] = {
                        type: 'html5',
                        element: audio,
                        loaded: false,
                    };

                    // Wait for audio to be ready
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout loading ${soundName}`));
                        }, 5000);

                        audio.addEventListener('canplaythrough', () => {
                            clearTimeout(timeout);
                            this.sounds[soundName].loaded = true;
                            resolve();
                        });

                        audio.addEventListener('error', () => {
                            clearTimeout(timeout);
                            reject(new Error(`Failed to load ${soundName}`));
                        });
                    });
                } catch (error) {
                    this.handleAudioError(error, soundName);
                    // Continue with other sounds even if one fails
                }
            }

            this.isInitialized = true;
            this.startBufferCleanup(); // Start cleanup for HTML5 fallback too
            logger.info('AudioManager initialized with HTML5 Audio fallback');
            return true;
        } catch (error) {
            this.handleAudioError(error, 'html5_initialization');
            return false;
        }
    }

    /**
     * Preload all sound files into audio buffers
     * Implements error handling for failed loads and format fallbacks
     * @returns {Promise<boolean>} True if all sounds loaded successfully, false if some failed
     * @private
     */
    async preloadSounds() {
        const soundFiles = this.getSoundFileList();
        const loadPromises = [];

        for (const [soundName, filePath] of Object.entries(soundFiles)) {
            const loadPromise = this.loadSoundBuffer(soundName, filePath)
                .then(() => {
                    logger.info(`Successfully loaded ${soundName}`);
                })
                .catch((error) => {
                    this.handleAudioError(error, soundName);
                    // Try fallback format if primary fails
                    return this.tryFallbackFormat(soundName, filePath);
                });

            loadPromises.push(loadPromise);
        }

        // Wait for all loading attempts to complete
        await Promise.allSettled(loadPromises);

        // Count successful loads
        let successCount = 0;
        const totalSounds = Object.keys(soundFiles).length;

        for (const soundName of Object.keys(soundFiles)) {
            if (this.sounds[soundName] && this.sounds[soundName].loaded) {
                successCount++;
            }
        }

        const allLoaded = successCount === totalSounds;

        if (allLoaded) {
            logger.info('All audio files preloaded successfully');
        } else {
            logger.warn(`Audio preloading completed: ${successCount}/${totalSounds} sounds loaded`);
        }

        return allLoaded;
    }

    /**
     * Load a single sound file into an audio buffer
     * @param {string} soundName - Name identifier for the sound
     * @param {string} filePath - Path to the audio file
     * @returns {Promise<void>} Resolves when sound is loaded
     * @private
     */
    async loadSoundBuffer(soundName, filePath) {
        try {
            // Fetch the audio file
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Get array buffer from response
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Store the decoded buffer
            this.sounds[soundName] = {
                type: 'webaudio',
                buffer: audioBuffer,
                loaded: true,
            };
        } catch (error) {
            throw new Error(`Failed to load ${soundName} from ${filePath}: ${error.message}`);
        }
    }

    /**
     * Try loading a fallback format when primary format fails
     * @param {string} soundName - Name identifier for the sound
     * @param {string} originalPath - Original file path that failed
     * @returns {Promise<void>} Resolves when fallback is loaded or fails
     * @private
     */
    async tryFallbackFormat(soundName, originalPath) {
        try {
            // Convert MP3 path to OGG fallback
            const fallbackPath = originalPath.replace('.mp3', '.ogg');

            if (fallbackPath === originalPath) {
                // No fallback available
                throw new Error('No fallback format available');
            }

            logger.info(`Trying fallback format for ${soundName}: ${fallbackPath}`);
            await this.loadSoundBuffer(soundName, fallbackPath);

            // If we get here, fallback succeeded
            return Promise.resolve();
        } catch (fallbackError) {
            // Both formats failed - create placeholder
            this.sounds[soundName] = {
                type: 'failed',
                buffer: null,
                loaded: false,
            };

            logger.warn(
                `All formats failed for ${soundName}, audio will be disabled for this sound`
            );
            return Promise.resolve(); // Don't reject, just mark as failed
        }
    }

    /**
     * Get the list of sound files to preload
     * @returns {Object} Map of sound names to file paths
     * @private
     */
    getSoundFileList() {
        return {
            turn: 'sounds/turn.mp3',
            engine: 'sounds/engine.mp3',
            explosion: 'sounds/explosion.mp3',
            victory: 'sounds/victory.mp3',
            defeat: 'sounds/defeat.mp3',
            powerup_collect: 'sounds/turn.mp3', // Using turn sound as placeholder for power-up collection
            shrink_warning: 'sounds/turn.mp3', // Using turn sound for warning beep
            shrink_execute: 'sounds/explosion.mp3', // Using explosion sound for shrink effect
        };
    }

    /**
     * Play turn sound effect with spam prevention
     * Implements cooldown mechanism to prevent overlapping turn sounds
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
     */
    playTurnSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        // Check cooldown to prevent spam (max once per direction change)
        const currentTime = Date.now();
        const timeSinceLastTurn = currentTime - this.lastTurnTime;

        if (timeSinceLastTurn < this.soundConfig.turn.cooldown) {
            return; // Still in cooldown period
        }

        // Update last turn time
        this.lastTurnTime = currentTime;

        try {
            const turnSound = this.sounds.turn;

            // Check if sound is available and loaded
            if (!turnSound || !turnSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (turnSound.type === 'webaudio') {
                this.playWebAudioSound('turn', turnSound.buffer);
            } else if (turnSound.type === 'html5') {
                this.playHTML5Sound('turn', turnSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'turn_playback');
        }
    }

    /**
     * Play a sound using Web Audio API
     * @param {string} soundName - Name of the sound for configuration lookup
     * @param {AudioBuffer} buffer - Audio buffer to play
     * @private
     */
    playWebAudioSound(soundName, buffer) {
        if (!this.audioContext || !buffer) {
            return;
        }

        try {
            // Create buffer source
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            const config = this.soundConfig[soundName];
            gainNode.gain.value = config ? config.volume : 0.5;

            // Connect audio graph
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configure looping if needed
            if (config && config.loop) {
                source.loop = true;
            }

            // Start playback
            source.start(0);

            // Track active sound for cleanup
            this.activeSounds.push(source);

            // Clean up when sound ends (for non-looping sounds)
            if (!source.loop) {
                source.onended = () => {
                    const index = this.activeSounds.indexOf(source);
                    if (index > -1) {
                        this.activeSounds.splice(index, 1);
                    }
                };
            }

            // Enforce concurrent sound limit
            this.enforcePlaybackLimits();

            return source;
        } catch (error) {
            this.handleAudioError(error, `${soundName}_webaudio_playback`);
            return null;
        }
    }

    /**
     * Play a sound using HTML5 Audio element
     * @param {string} soundName - Name of the sound for configuration lookup
     * @param {HTMLAudioElement} audioElement - HTML5 audio element to play
     * @private
     */
    playHTML5Sound(soundName, audioElement) {
        if (!audioElement) {
            return;
        }

        try {
            // Clone the audio element to allow overlapping playback
            /** @type {HTMLAudioElement} */
            const audio = /** @type {HTMLAudioElement} */ (audioElement.cloneNode());
            const config = this.soundConfig[soundName];

            // Set volume
            audio.volume = config ? config.volume : 0.5;

            // Configure looping if needed
            if (config && config.loop) {
                audio.loop = true;
            }

            // Play the sound
            const playPromise = audio.play();

            // Handle play promise (required for some browsers)
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    this.handleAudioError(error, `${soundName}_html5_playback`);
                });
            }

            // Track for cleanup
            this.activeSounds.push(audio);

            // Enforce concurrent sound limit
            this.enforcePlaybackLimits();

            // Clean up when sound ends (for non-looping sounds)
            if (!audio.loop) {
                audio.onended = () => {
                    const index = this.activeSounds.indexOf(audio);
                    if (index > -1) {
                        this.activeSounds.splice(index, 1);
                    }
                };
            }

            return audio;
        } catch (error) {
            this.handleAudioError(error, `${soundName}_html5_playback`);
            return null;
        }
    }

    /**
     * Start engine background audio with smooth looping
     * Implements looping engine audio that continues during direction changes
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     */
    startEngineSound() {
        // Return early if muted, not initialized, or engine already playing
        if (this.isMuted || !this.isInitialized || this.currentEngine) {
            return;
        }

        try {
            const engineSound = this.sounds.engine;

            // Check if sound is available and loaded
            if (!engineSound || !engineSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (engineSound.type === 'webaudio') {
                this.currentEngine = this.startWebAudioEngine(engineSound.buffer);
            } else if (engineSound.type === 'html5') {
                this.currentEngine = this.startHTML5Engine(engineSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'engine_start');
        }
    }

    /**
     * Stop engine background audio
     * Stops the currently playing engine sound
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     */
    stopEngineSound() {
        if (!this.currentEngine) {
            return;
        }

        try {
            /** @type {any} */
            const engine = this.currentEngine;
            if (engine.stop) {
                // Web Audio API source
                engine.stop();
            } else if (engine.pause) {
                // HTML5 Audio element
                engine.pause();
                engine.currentTime = 0;
            }

            // Remove from active sounds tracking
            const index = this.activeSounds.indexOf(this.currentEngine);
            if (index > -1) {
                this.activeSounds.splice(index, 1);
            }

            this.currentEngine = null;
        } catch (error) {
            this.handleAudioError(error, 'engine_stop');
            this.currentEngine = null; // Clear reference even if stop failed
        }
    }

    /**
     * Start engine sound using Web Audio API
     * @param {AudioBuffer} buffer - Engine audio buffer
     * @returns {AudioBufferSourceNode} The created audio source
     * @private
     */
    startWebAudioEngine(buffer) {
        if (!this.audioContext || !buffer) {
            return null;
        }

        try {
            // Create buffer source
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = true; // Enable seamless looping

            // Create gain node for volume control and fade effects
            const gainNode = this.audioContext.createGain();
            const config = this.soundConfig.engine;

            // Start with zero volume for fade-in effect
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

            // Fade in over configured duration
            const fadeInDuration = (config.fadeIn || 200) / 1000; // Convert ms to seconds
            gainNode.gain.linearRampToValueAtTime(
                config.volume || 0.2,
                this.audioContext.currentTime + fadeInDuration
            );

            // Connect audio graph
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Start playback
            source.start(0);

            // Track active sound
            this.activeSounds.push(source);

            // Store gain node reference for potential fade-out
            /** @type {any} */ (source).gainNode = gainNode;

            return source;
        } catch (error) {
            this.handleAudioError(error, 'engine_webaudio_start');
            return null;
        }
    }

    /**
     * Start engine sound using HTML5 Audio
     * @param {HTMLAudioElement} audioElement - Engine audio element
     * @returns {HTMLAudioElement} The created audio element
     * @private
     */
    startHTML5Engine(audioElement) {
        if (!audioElement) {
            return null;
        }

        try {
            // Clone the audio element
            /** @type {HTMLAudioElement} */
            const audio = /** @type {HTMLAudioElement} */ (audioElement.cloneNode());
            const config = this.soundConfig.engine;

            // Configure for looping
            audio.loop = true;
            audio.volume = config.volume || 0.2;

            // Play the sound
            const playPromise = audio.play();

            // Handle play promise
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    this.handleAudioError(error, 'engine_html5_start');
                });
            }

            // Track active sound
            this.activeSounds.push(audio);

            return audio;
        } catch (error) {
            this.handleAudioError(error, 'engine_html5_start');
            return null;
        }
    }

    /**
     * Play explosion sound effect that interrupts other audio
     * Implements high-priority explosion sound that stops engine audio
     * Requirements: 3.1, 3.2, 3.3, 3.4
     */
    playExplosionSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            // Duck music for explosion sound effect
            this.duckMusicForSoundEffect('explosion');

            // Stop engine audio immediately (explosion interrupts engine)
            this.stopEngineSound();

            const explosionSound = this.sounds.explosion;

            // Check if sound is available and loaded
            if (!explosionSound || !explosionSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (explosionSound.type === 'webaudio') {
                this.playWebAudioSound('explosion', explosionSound.buffer);
            } else if (explosionSound.type === 'html5') {
                this.playHTML5Sound('explosion', explosionSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'explosion_playback');
        }
    }

    /**
     * Play victory sound effect after explosion completes
     * Implements victory audio that plays after explosion with delay
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    playVictorySound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            const victorySound = this.sounds.victory;

            // Check if sound is available and loaded
            if (!victorySound || !victorySound.loaded) {
                return; // Sound not available, fail silently
            }

            // Apply delay to play after explosion completes
            const config = this.soundConfig.victory;
            const delay = config.delay || 500; // Default 500ms delay

            setTimeout(() => {
                // Check if still not muted (user might have muted during delay)
                if (this.isMuted) {
                    return;
                }

                // Duck music for victory sound effect
                this.duckMusicForSoundEffect('victory');

                if (victorySound.type === 'webaudio') {
                    this.playWebAudioSound('victory', victorySound.buffer);
                } else if (victorySound.type === 'html5') {
                    this.playHTML5Sound('victory', victorySound.element);
                }
            }, delay);
        } catch (error) {
            this.handleAudioError(error, 'victory_playback');
        }
    }

    /**
     * Play defeat sound effect after explosion completes
     * Implements defeat audio that plays after explosion with delay
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    playDefeatSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            const defeatSound = this.sounds.defeat;

            // Check if sound is available and loaded
            if (!defeatSound || !defeatSound.loaded) {
                return; // Sound not available, fail silently
            }

            // Apply delay to play after explosion completes
            const config = this.soundConfig.defeat;
            const delay = config.delay || 500; // Default 500ms delay

            setTimeout(() => {
                // Check if still not muted (user might have muted during delay)
                if (this.isMuted) {
                    return;
                }

                // Duck music for defeat sound effect
                this.duckMusicForSoundEffect('defeat');

                if (defeatSound.type === 'webaudio') {
                    this.playWebAudioSound('defeat', defeatSound.buffer);
                } else if (defeatSound.type === 'html5') {
                    this.playHTML5Sound('defeat', defeatSound.element);
                }
            }, delay);
        } catch (error) {
            this.handleAudioError(error, 'defeat_playback');
        }
    }

    /**
     * Handle game start event
     * Starts engine sound and background music when game begins
     * Requirements: 7.3, 2.1
     * @returns {Promise<boolean>} True if handled successfully
     */
    async handleGameStart() {
        if (!this.isInitialized || this.isMuted) {
            return false;
        }

        try {
            // Start engine sound for game beginning
            this.startEngineSound();

            // Start background music with fade-in using event handler
            if (this.musicPlayer) {
                return await this.musicPlayer.onGameStart();
            }
            return true;
        } catch (error) {
            this.handleAudioError(error, 'game_start');
            return false;
        }
    }

    /**
     * Handle game pause event
     * Pauses all audio and music when game is paused
     * Requirements: 7.3, 2.4
     * @returns {Promise<boolean>} True if handled successfully
     */
    async handleGamePause() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Stop engine sound when paused
            this.stopEngineSound();

            // Fade out music when paused using event handler
            if (this.musicPlayer) {
                return await this.musicPlayer.onGamePause();
            }
            return true;
        } catch (error) {
            this.handleAudioError(error, 'game_pause');
            return false;
        }
    }

    /**
     * Handle game resume event
     * Resumes appropriate audio and music when game is resumed
     * Requirements: 7.3, 2.4
     * @returns {Promise<boolean>} True if handled successfully
     */
    async handleGameResume() {
        if (!this.isInitialized || this.isMuted) {
            return false;
        }

        try {
            // Restart engine sound when resumed
            this.startEngineSound();

            // Fade in music when resumed using event handler
            if (this.musicPlayer) {
                return await this.musicPlayer.onGameResume();
            }
            return true;
        } catch (error) {
            this.handleAudioError(error, 'game_resume');
            return false;
        }
    }

    /**
     * Handle game end event
     * Stops all audio and music when game ends
     * Requirements: 7.3, 2.4
     * @returns {Promise<boolean>} True if handled successfully
     */
    async handleGameEnd() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Stop all audio when game ends
            this.stopAllAudio();

            // Fade out music when game ends using event handler
            if (this.musicPlayer) {
                return await this.musicPlayer.onGameEnd();
            }
            return true;
        } catch (error) {
            this.handleAudioError(error, 'game_end');
            return false;
        }
    }

    /**
     * Handle game restart event
     * Restarts music with fresh start
     * Requirements: 6.6
     * @returns {Promise<boolean>} True if handled successfully
     */
    async handleGameRestart() {
        if (!this.isInitialized || this.isMuted) {
            return false;
        }

        try {
            // Handle music restart using event handler
            if (this.musicPlayer) {
                return await this.musicPlayer.onGameRestart();
            }
            return true;
        } catch (error) {
            this.handleAudioError(error, 'game_restart');
            return false;
        }
    }

    /**
     * Play power-up collection sound effect
     * Implements collection audio feedback for power-up system
     * Requirements: 6.1, 6.2
     */
    playPowerUpCollectionSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            const collectionSound = this.sounds.powerup_collect;

            // Check if sound is available and loaded
            if (!collectionSound || !collectionSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (collectionSound.type === 'webaudio') {
                this.playWebAudioSound('powerup_collect', collectionSound.buffer);
            } else if (collectionSound.type === 'html5') {
                this.playHTML5Sound('powerup_collect', collectionSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'powerup_collection_playback');
        }
    }

    /**
     * Play arena shrink warning sound effect
     * Implements warning audio cue triggered 2 seconds before shrink
     * Requirements: 2.5
     */
    playShrinkWarningSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            const warningSound = this.sounds.shrink_warning;

            // Check if sound is available and loaded
            if (!warningSound || !warningSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (warningSound.type === 'webaudio') {
                this.playWebAudioSound('shrink_warning', warningSound.buffer);
            } else if (warningSound.type === 'html5') {
                this.playHTML5Sound('shrink_warning', warningSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'shrink_warning_playback');
        }
    }

    /**
     * Play arena shrink execution sound effect
     * Implements dramatic audio cue when boundaries actually contract
     * Requirements: 7.3, 7.5
     */
    playShrinkExecuteSound() {
        // Return early if muted or not initialized
        if (this.isMuted || !this.isInitialized) {
            return;
        }

        try {
            const shrinkSound = this.sounds.shrink_execute;

            // Check if sound is available and loaded
            if (!shrinkSound || !shrinkSound.loaded) {
                return; // Sound not available, fail silently
            }

            if (shrinkSound.type === 'webaudio') {
                this.playWebAudioSound('shrink_execute', shrinkSound.buffer);
            } else if (shrinkSound.type === 'html5') {
                this.playHTML5Sound('shrink_execute', shrinkSound.element);
            }
        } catch (error) {
            this.handleAudioError(error, 'shrink_execute_playback');
        }
    }

    /**
     * Start periodic buffer cleanup to manage memory usage
     * @private
     */
    startBufferCleanup() {
        if (this.bufferCleanupInterval) {
            return; // Already running
        }

        this.bufferCleanupInterval = setInterval(() => {
            this.performBufferCleanup();
        }, this.bufferCleanupFrequency);
    }

    /**
     * Stop periodic buffer cleanup
     * @private
     */
    stopBufferCleanup() {
        if (this.bufferCleanupInterval) {
            clearInterval(this.bufferCleanupInterval);
            this.bufferCleanupInterval = null;
        }
    }

    /**
     * Perform buffer cleanup and memory management
     * @private
     */
    performBufferCleanup() {
        try {
            // Clean up finished audio sources
            this.activeSounds = this.activeSounds.filter((sound) => {
                if (!sound) {
                    return false;
                }

                // Check if Web Audio source has ended
                if (
                    sound.playbackState === 'finished' ||
                    (sound.context && sound.context.state === 'closed')
                ) {
                    return false;
                }

                // Check if HTML5 audio has ended
                if (sound.ended || sound.paused) {
                    return false;
                }

                return true;
            });

            // Update performance metrics
            this.performanceMetrics.activeSoundsCount = this.activeSounds.length;
            this.performanceMetrics.lastCleanupTime = Date.now();

            // Calculate approximate buffer memory usage
            let memoryUsage = 0;
            for (const soundName in this.sounds) {
                const sound = this.sounds[soundName];
                if (sound && sound.buffer && sound.buffer.length) {
                    // Approximate memory usage: channels * length * 4 bytes per sample
                    memoryUsage += sound.buffer.numberOfChannels * sound.buffer.length * 4;
                }
            }
            this.performanceMetrics.bufferMemoryUsage = memoryUsage;

            // Log performance metrics in development
            if (process.env.NODE_ENV === 'development') {
                logger.debug('Audio Performance Metrics:', this.performanceMetrics);
            }
        } catch (error) {
            this.handleAudioError(error, 'buffer_cleanup');
        }
    }

    /**
     * Enforce concurrent audio playback limits
     * @private
     */
    enforcePlaybackLimits() {
        // Remove oldest sounds if we exceed the limit
        while (this.activeSounds.length > this.maxConcurrentSounds) {
            const oldestSound = this.activeSounds.shift();
            if (oldestSound) {
                try {
                    if (oldestSound.stop) {
                        oldestSound.stop();
                    } else if (oldestSound.pause) {
                        oldestSound.pause();
                    }
                } catch (error) {
                    this.handleAudioError(error, 'playback_limit_enforcement');
                }
            }
        }
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics object
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            maxConcurrentSounds: this.maxConcurrentSounds,
            isInitialized: this.isInitialized,
            isMuted: this.isMuted,
        };
    }

    /**
     * Initialize the music system with shared audio context
     * @returns {Promise<boolean>} True if music system initialized successfully
     * @private
     */
    async initializeMusicSystem() {
        if (this.musicInitialized || !this.audioContext) {
            return false;
        }

        try {
            // Import music system components
            const { MusicPlayer } = require('./MusicPlayer.js');
            const { MusicSettings } = require('./MusicSettings.js');

            // Initialize music settings
            this.musicSettings = new MusicSettings();

            // Initialize music player with shared audio context
            this.musicPlayer = new MusicPlayer(this, this.musicSettings);
            const musicInitSuccess = await this.musicPlayer.initialize(this.audioContext);

            if (musicInitSuccess) {
                this.musicInitialized = true;
                logger.info('Music system initialized successfully');
                return true;
            } else {
                logger.warn('Music system initialization failed, continuing without music');
                return false;
            }
        } catch (error) {
            this.handleAudioError(error, 'music_initialization');
            logger.warn('Music system unavailable, continuing without music');
            return false;
        }
    }

    /**
     * Get the music player instance
     * @returns {any} Music player instance or null if not initialized
     */
    getMusicPlayer() {
        return this.musicPlayer;
    }

    /**
     * Get the music settings instance
     * @returns {any} Music settings instance or null if not initialized
     */
    getMusicSettings() {
        return this.musicSettings;
    }

    /**
     * Check if music system is initialized and available
     * @returns {boolean} True if music system is ready
     */
    isMusicAvailable() {
        return !!(this.musicInitialized && this.musicPlayer && this.musicSettings);
    }

    /**
     * Start background music with fade-in
     * @returns {boolean} True if music started successfully
     */
    startMusic() {
        if (!this.isMusicAvailable() || this.isMuted) {
            return false;
        }

        try {
            return this.musicPlayer.play();
        } catch (error) {
            this.handleAudioError(error, 'music_start');
            return false;
        }
    }

    /**
     * Stop background music with fade-out
     * @returns {boolean} True if music stopped successfully
     */
    stopMusic() {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.stop();
        } catch (error) {
            this.handleAudioError(error, 'music_stop');
            return false;
        }
    }

    /**
     * Pause background music with fade-out
     * @returns {boolean} True if music paused successfully
     */
    pauseMusic() {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.pause();
        } catch (error) {
            this.handleAudioError(error, 'music_pause');
            return false;
        }
    }

    /**
     * Resume background music with fade-in
     * @returns {boolean} True if music resumed successfully
     */
    resumeMusic() {
        if (!this.isMusicAvailable() || this.isMuted) {
            return false;
        }

        try {
            return this.musicPlayer.play();
        } catch (error) {
            this.handleAudioError(error, 'music_resume');
            return false;
        }
    }

    /**
     * Set music volume (0.0 to 1.0)
     * @param {number} volume - Volume level
     * @returns {boolean} True if volume was set successfully
     */
    setMusicVolume(volume) {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.setVolume(volume);
        } catch (error) {
            this.handleAudioError(error, 'music_volume');
            return false;
        }
    }

    /**
     * Get current music volume
     * @returns {number} Current music volume (0.0 to 1.0)
     */
    getMusicVolume() {
        if (!this.isMusicAvailable()) {
            return 0;
        }

        try {
            return this.musicPlayer.getVolume();
        } catch (error) {
            this.handleAudioError(error, 'music_get_volume');
            return 0;
        }
    }

    /**
     * Set the current music track
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if track was set successfully
     */
    setMusicTrack(trackId) {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.setTrack(trackId);
        } catch (error) {
            this.handleAudioError(error, 'music_set_track');
            return false;
        }
    }

    /**
     * Get available music tracks
     * @returns {Array} Array of available track information
     */
    getAvailableMusicTracks() {
        if (!this.isMusicAvailable()) {
            return [];
        }

        try {
            return this.musicPlayer.getAvailableTracks();
        } catch (error) {
            this.handleAudioError(error, 'music_get_tracks');
            return [];
        }
    }

    /**
     * Check if music is currently playing
     * @returns {boolean} True if music is playing
     */
    isMusicPlaying() {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.isPlaying();
        } catch (error) {
            this.handleAudioError(error, 'music_is_playing');
            return false;
        }
    }

    /**
     * Fade in background music over specified duration
     * @param {number} duration - Fade duration in seconds (optional)
     * @returns {Promise<boolean>} Resolves when fade completes
     */
    async fadeMusicIn(duration = null) {
        if (!this.isMusicAvailable() || this.isMuted) {
            return false;
        }

        try {
            return await this.musicPlayer.fadeIn(duration);
        } catch (error) {
            this.handleAudioError(error, 'music_fade_in');
            return false;
        }
    }

    /**
     * Fade out background music over specified duration
     * @param {number} duration - Fade duration in seconds (optional)
     * @returns {Promise<boolean>} Resolves when fade completes
     */
    async fadeMusicOut(duration = null) {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return await this.musicPlayer.fadeOut(duration);
        } catch (error) {
            this.handleAudioError(error, 'music_fade_out');
            return false;
        }
    }

    /**
     * Duck music volume during sound effects
     * @param {string} effectType - Type of sound effect being played
     * @returns {boolean} True if ducking was applied
     */
    duckMusicForSoundEffect(effectType) {
        if (!this.isMusicAvailable()) {
            return false;
        }

        try {
            return this.musicPlayer.onSoundEffect(effectType);
        } catch (error) {
            this.handleAudioError(error, 'music_ducking');
            return false;
        }
    }

    /**
     * Clean up audio resources
     * @private
     */
    cleanup() {
        this.stopAllAudio();
        this.stopBufferCleanup();

        // Clean up music system
        if (this.musicPlayer) {
            try {
                this.musicPlayer.cleanup();
            } catch (error) {
                this.handleAudioError(error, 'music_cleanup');
            }
            this.musicPlayer = null;
        }

        this.musicSettings = null;
        this.musicInitialized = false;

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (error) {
                this.handleAudioError(error, 'context_cleanup');
            }
        }

        // Clear all sound buffers
        this.sounds = {};

        this.audioContext = null;
        this.isInitialized = false;
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { AudioManager };
