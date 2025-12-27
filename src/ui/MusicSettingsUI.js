/**
 * MusicSettingsUI - User interface for music settings
 * Provides controls for track selection, volume adjustment, and status display
 */
const { logger } = require('../utils/Logger.js');

class MusicSettingsUI {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.isVisible = false;

        // UI element references
        this.panel = null;
        this.button = null;
        this.trackButtons = [];
        this.volumeSlider = null;
        this.volumeValue = null;
        this.statusValue = null;
        this.currentTrackValue = null;

        // Current state
        this.currentTrack = 'none';
        this.currentVolume = 70;

        this.initialize();
    }

    /**
     * Initialize the music settings UI
     */
    initialize() {
        try {
            // Get UI elements
            this.panel = document.getElementById('musicSettingsPanel');
            this.button = document.getElementById('musicSettingsButton');
            this.volumeSlider = document.getElementById('musicVolumeSlider');
            this.volumeValue = document.getElementById('musicVolumeValue');
            this.statusValue = document.getElementById('musicStatusValue');
            this.currentTrackValue = document.getElementById('currentTrackValue');

            if (!this.panel || !this.button) {
                logger.warn('Music settings UI elements not found');
                return;
            }

            // Get track buttons
            this.trackButtons = Array.from(document.querySelectorAll('.track-btn'));

            // Set up event listeners
            this.setupEventListeners();

            // Load initial settings
            this.loadSettings();

            // Update UI state
            this.updateUI();

            logger.info('Music settings UI initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize music settings UI:', error);
        }
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Settings button click
        this.button.addEventListener('click', () => {
            this.toggle();
        });

        // Track selection buttons
        this.trackButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const trackId = button.getAttribute('data-track');
                this.selectTrack(trackId);
            });
        });

        // Volume slider
        if (this.volumeSlider) {
            /** @type {HTMLInputElement} */
            const target = /** @type {any} */ (event.target);
            const volume = parseInt(target.value);
            this.setVolume(volume);
        }

        // Panel buttons
        const resetButton = document.getElementById('resetMusicSettings');
        const closeButton = document.getElementById('closeMusicSettings');

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (event) => {
            /** @type {Node} */
            const target = /** @type {any} */ (event.target);
            if (this.isVisible && !this.panel.contains(target) && !this.button.contains(target)) {
                this.hide();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Load settings from the music system
     */
    loadSettings() {
        if (!this.audioManager || !this.audioManager.isMusicAvailable()) {
            return;
        }

        try {
            const musicSettings = this.audioManager.getMusicSettings();
            if (musicSettings) {
                this.currentTrack = musicSettings.getSelectedTrack();
                this.currentVolume = Math.round(musicSettings.getMusicVolume() * 100);
            }
        } catch (error) {
            logger.warn('Failed to load music settings:', error);
        }
    }

    /**
     * Update the UI to reflect current state
     */
    updateUI() {
        // Update track selection buttons
        this.trackButtons.forEach((button) => {
            const trackId = button.getAttribute('data-track');
            if (trackId === this.currentTrack) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update volume slider and display
        if (this.volumeSlider) {
            /** @type {HTMLInputElement} */
            const slider = /** @type {any} */ (this.volumeSlider);
            slider.value = this.currentVolume.toString();
        }
        if (this.volumeValue) {
            this.volumeValue.textContent = `${this.currentVolume}%`;
        }

        // Update status display
        this.updateStatus();

        // Update current track display
        this.updateCurrentTrackDisplay();
    }

    /**
     * Update the music status display
     */
    updateStatus() {
        if (!this.statusValue) {
            return;
        }

        let status = 'Stopped';
        let statusClass = 'stopped';

        if (this.audioManager && this.audioManager.isMusicAvailable()) {
            const musicPlayer = this.audioManager.getMusicPlayer();
            if (musicPlayer) {
                if (musicPlayer.isPlaying()) {
                    status = 'Playing';
                    statusClass = 'playing';
                } else if (musicPlayer.isPaused()) {
                    status = 'Paused';
                    statusClass = 'paused';
                } else if (musicPlayer.isFading()) {
                    const fadeState = musicPlayer.getFadeState();
                    status = fadeState.type === 'in' ? 'Fading In' : 'Fading Out';
                    statusClass = 'fading';
                } else if (musicPlayer.isDucked()) {
                    status = 'Ducked';
                    statusClass = 'ducked';
                }
            }
        }

        this.statusValue.textContent = status;
        this.statusValue.className = `music-status-value ${statusClass}`;
    }

    /**
     * Update the current track display
     */
    updateCurrentTrackDisplay() {
        if (!this.currentTrackValue) {
            return;
        }

        const trackNames = {
            none: 'No Music',
            'ambient-space': 'Ambient Space',
            'cyber-pulse': 'Cyber Pulse',
            'neon-rush': 'Neon Rush',
        };

        const displayName = trackNames[this.currentTrack] || this.currentTrack;
        this.currentTrackValue.textContent = displayName;
    }

    /**
     * Select a music track
     * @param {string} trackId - Track identifier
     */
    selectTrack(trackId) {
        if (!this.audioManager || !this.audioManager.isMusicAvailable()) {
            logger.warn('Music system not available');
            return;
        }

        try {
            const success = this.audioManager.setMusicTrack(trackId);
            if (success) {
                this.currentTrack = trackId;
                this.updateUI();

                // Show visual feedback
                this.showFeedback(`Track changed to: ${this.getTrackDisplayName(trackId)}`);
            } else {
                this.showFeedback('Failed to change track', 'error');
            }
        } catch (error) {
            logger.error('Failed to select track:', error);
            this.showFeedback('Error changing track', 'error');
        }
    }

    /**
     * Set the music volume
     * @param {number} volume - Volume percentage (0-100)
     */
    setVolume(volume) {
        if (!this.audioManager || !this.audioManager.isMusicAvailable()) {
            return;
        }

        try {
            const volumeLevel = volume / 100; // Convert to 0.0-1.0 range
            const success = this.audioManager.setMusicVolume(volumeLevel);

            if (success) {
                this.currentVolume = volume;
                this.updateUI();
            }
        } catch (error) {
            logger.error('Failed to set volume:', error);
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        try {
            if (this.audioManager && this.audioManager.isMusicAvailable()) {
                const musicSettings = this.audioManager.getMusicSettings();
                if (musicSettings) {
                    musicSettings.reset();
                    this.loadSettings();
                    this.updateUI();
                    this.showFeedback('Settings reset to defaults');
                }
            }
        } catch (error) {
            logger.error('Failed to reset settings:', error);
            this.showFeedback('Error resetting settings', 'error');
        }
    }

    /**
     * Get display name for a track ID
     * @param {string} trackId - Track identifier
     * @returns {string} Display name
     */
    getTrackDisplayName(trackId) {
        const trackNames = {
            none: 'No Music',
            'ambient-space': 'Ambient Space',
            'cyber-pulse': 'Cyber Pulse',
            'neon-rush': 'Neon Rush',
        };

        return trackNames[trackId] || trackId;
    }

    /**
     * Show feedback message to user
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    showFeedback(message, type = 'success') {
        // Create or update feedback element
        let feedbackElement = document.getElementById('music-feedback');

        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.id = 'music-feedback';
            feedbackElement.className = 'music-feedback';
            document.body.appendChild(feedbackElement);

            // Add styles for feedback
            this.addFeedbackStyles();
        }

        // Set message and type
        feedbackElement.textContent = message;
        feedbackElement.className = `music-feedback ${type}`;
        feedbackElement.style.display = 'block';
        feedbackElement.style.opacity = '1';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            feedbackElement.style.opacity = '0';
            setTimeout(() => {
                feedbackElement.style.display = 'none';
            }, 300);
        }, 3000);
    }

    /**
     * Add CSS styles for feedback messages
     */
    addFeedbackStyles() {
        if (document.getElementById('music-feedback-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'music-feedback-styles';
        style.textContent = `
            .music-feedback {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
                border: 2px solid #00ff00;
                opacity: 0;
                transition: opacity 0.3s ease;
                max-width: 300px;
                text-align: center;
            }
            
            .music-feedback.error {
                border-color: #ff4444;
                color: #ff6666;
            }
            
            .music-feedback.info {
                border-color: #00ffff;
                color: #66ffff;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show the music settings panel
     */
    show() {
        if (!this.panel) {
            return;
        }

        this.panel.style.display = 'block';
        this.button.classList.add('active');
        this.isVisible = true;

        // Update UI with current state
        this.loadSettings();
        this.updateUI();

        // Start status update interval
        this.startStatusUpdates();
    }

    /**
     * Hide the music settings panel
     */
    hide() {
        if (!this.panel) {
            return;
        }

        this.panel.style.display = 'none';
        this.button.classList.remove('active');
        this.isVisible = false;

        // Stop status updates
        this.stopStatusUpdates();
    }

    /**
     * Toggle the music settings panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        if (this.statusUpdateInterval) {
            return;
        }

        this.statusUpdateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateStatus();
            }
        }, 500); // Update every 500ms
    }

    /**
     * Stop periodic status updates
     */
    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    /**
     * Check if the panel is currently visible
     * @returns {boolean} True if panel is visible
     */
    isOpen() {
        return this.isVisible;
    }

    /**
     * Get current music settings
     * @returns {Object} Current settings object
     */
    getCurrentSettings() {
        return {
            track: this.currentTrack,
            volume: this.currentVolume,
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopStatusUpdates();

        // Remove event listeners would go here if we stored references
        // For now, the elements will be cleaned up when the page unloads
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicSettingsUI };
