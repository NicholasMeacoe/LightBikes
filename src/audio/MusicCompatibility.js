/**
 * MusicCompatibility - Handles browser compatibility for music system
 * Provides Web Audio API feature detection, autoplay policy handling,
 * and mobile browser audio context management
 */
const { logger } = require('../utils/Logger.js');

class MusicCompatibility {
    constructor() {
        this.audioContext = null;
        this.isWebAudioSupported = null;
        this.autoplayAllowed = null;
        this.userInteractionRequired = true;
        this.mobileAudioUnlocked = false;

        // Initialize compatibility checks
        this._detectWebAudioSupport();
        this._setupAutoplayDetection();
        this._setupMobileAudioHandling();
    }

    /**
     * Check if Web Audio API is supported
     * @returns {boolean} True if Web Audio API is available
     */
    isWebAudioAPISupported() {
        return this.isWebAudioSupported;
    }

    /**
     * Check if autoplay is allowed in the current browser
     * @returns {boolean|null} True if allowed, false if blocked, null if unknown
     */
    isAutoplayAllowed() {
        return this.autoplayAllowed;
    }

    /**
     * Check if user interaction is required before audio can play
     * @returns {boolean} True if user interaction is required
     */
    isUserInteractionRequired() {
        return this.userInteractionRequired;
    }

    /**
     * Check if mobile audio has been unlocked
     * @returns {boolean} True if mobile audio is unlocked
     */
    isMobileAudioUnlocked() {
        return this.mobileAudioUnlocked;
    }

    /**
     * Get or create an audio context
     * @returns {AudioContext|null} Audio context or null if not supported
     */
    getAudioContext() {
        if (!this.isWebAudioSupported) {
            return null;
        }

        if (!this.audioContext) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContextClass();

                // Handle suspended context (autoplay policy)
                if (this.audioContext.state === 'suspended') {
                    this.userInteractionRequired = true;
                }
            } catch (error) {
                logger.warn('Failed to create audio context:', { error });
                return null;
            }
        }

        return this.audioContext;
    }

    /**
     * Attempt to unlock audio context after user interaction
     * @returns {Promise<boolean>} True if unlock was successful
     */
    async unlockAudioContext() {
        const context = this.getAudioContext();

        if (!context) {
            return false;
        }

        try {
            if (context.state === 'suspended') {
                await context.resume();
            }

            // Test with a silent buffer to ensure unlock
            await this._testAudioUnlock(context);

            this.userInteractionRequired = false;
            this.mobileAudioUnlocked = true;
            this.autoplayAllowed = true;

            return true;
        } catch (error) {
            logger.warn('Failed to unlock audio context:', { error });
            return false;
        }
    }

    /**
     * Check if the current browser is mobile
     * @returns {boolean} True if mobile browser detected
     */
    isMobileBrowser() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Check if the current browser is iOS Safari
     * @returns {boolean} True if iOS Safari detected
     */
    isIOSSafari() {
        /** @type {any} */
        const win = window;
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !win.MSStream;
    }

    /**
     * Get browser-specific audio format support
     * @returns {Object} Object with format support information
     */
    getAudioFormatSupport() {
        const audio = new Audio();

        return {
            mp3: audio.canPlayType('audio/mpeg') !== '',
            ogg: audio.canPlayType('audio/ogg') !== '',
            wav: audio.canPlayType('audio/wav') !== '',
            m4a: audio.canPlayType('audio/mp4') !== '',
        };
    }

    /**
     * Get the preferred audio format for the current browser
     * @returns {string} Preferred audio format extension
     */
    getPreferredAudioFormat() {
        const support = this.getAudioFormatSupport();

        // Prefer MP3 for broad compatibility
        if (support.mp3) return 'mp3';
        if (support.m4a) return 'm4a';
        if (support.ogg) return 'ogg';
        if (support.wav) return 'wav';

        return 'mp3'; // Fallback
    }

    /**
     * Setup event listeners for user interaction detection
     * @param {Function} callback - Callback to execute after user interaction
     */
    setupUserInteractionHandler(callback) {
        if (!this.userInteractionRequired) {
            callback();
            return;
        }

        const handleInteraction = async () => {
            const unlocked = await this.unlockAudioContext();

            if (unlocked) {
                callback();

                // Remove listeners after successful unlock
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
                document.removeEventListener('keydown', handleInteraction);
            }
        };

        // Listen for various user interaction events
        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
    }

    /**
     * Get compatibility information summary
     * @returns {Object} Compatibility information
     */
    getCompatibilityInfo() {
        return {
            webAudioSupported: this.isWebAudioSupported,
            autoplayAllowed: this.autoplayAllowed,
            userInteractionRequired: this.userInteractionRequired,
            mobileAudioUnlocked: this.mobileAudioUnlocked,
            isMobile: this.isMobileBrowser(),
            isIOSSafari: this.isIOSSafari(),
            audioFormats: this.getAudioFormatSupport(),
            preferredFormat: this.getPreferredAudioFormat(),
        };
    }

    /**
     * Detect Web Audio API support
     * @private
     */
    _detectWebAudioSupport() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.isWebAudioSupported = !!AudioContextClass;
        } catch (error) {
            this.isWebAudioSupported = false;
        }
    }

    /**
     * Setup autoplay detection
     * @private
     */
    _setupAutoplayDetection() {
        // Initial assumption based on browser type
        if (this.isMobileBrowser()) {
            this.autoplayAllowed = false;
            this.userInteractionRequired = true;
        } else {
            // Desktop browsers may allow autoplay, but we'll test
            this.autoplayAllowed = null; // Unknown until tested
        }
    }

    /**
     * Setup mobile audio handling
     * @private
     */
    _setupMobileAudioHandling() {
        if (this.isMobileBrowser()) {
            this.mobileAudioUnlocked = false;
            this.userInteractionRequired = true;
        } else {
            this.mobileAudioUnlocked = true; // Not applicable on desktop
        }
    }

    /**
     * Test audio unlock with a silent buffer
     * @param {AudioContext} context - Audio context to test
     * @returns {Promise<void>} Promise that resolves when test completes
     * @private
     */
    async _testAudioUnlock(context) {
        return new Promise((resolve, reject) => {
            try {
                // Create a silent buffer
                const buffer = context.createBuffer(1, 1, 22050);
                const source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(context.destination);

                // Play the silent buffer
                source.start(0);

                // Resolve after a short delay
                setTimeout(resolve, 100);
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicCompatibility };
