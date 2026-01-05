/**
 * MusicSettingsUI.test.js
 * Comprehensive tests for MusicSettingsUI component
 */

const { MusicSettingsUI } = require('../../src/ui/MusicSettingsUI.js');

describe('MusicSettingsUI', () => {
    let musicSettingsUI;
    let mockAudioManager;
    let mockMusicSettings;
    let mockMusicPlayer;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        // Create mock DOM elements
        const mockPanel = document.createElement('div');
        mockPanel.id = 'musicSettingsPanel';
        mockPanel.style.display = 'none';
        document.body.appendChild(mockPanel);

        const mockButton = document.createElement('button');
        mockButton.id = 'musicSettingsButton';
        document.body.appendChild(mockButton);

        const mockVolumeSlider = document.createElement('input');
        mockVolumeSlider.id = 'musicVolumeSlider';
        mockVolumeSlider.type = 'range';
        mockVolumeSlider.min = '0';
        mockVolumeSlider.max = '100';
        mockVolumeSlider.value = '70';
        document.body.appendChild(mockVolumeSlider);

        const mockVolumeValue = document.createElement('span');
        mockVolumeValue.id = 'musicVolumeValue';
        document.body.appendChild(mockVolumeValue);

        const mockStatusValue = document.createElement('span');
        mockStatusValue.id = 'musicStatusValue';
        document.body.appendChild(mockStatusValue);

        const mockCurrentTrackValue = document.createElement('span');
        mockCurrentTrackValue.id = 'currentTrackValue';
        document.body.appendChild(mockCurrentTrackValue);

        // Create track buttons
        const trackButton1 = document.createElement('button');
        trackButton1.className = 'track-btn';
        trackButton1.setAttribute('data-track', 'ambient-space');
        document.body.appendChild(trackButton1);

        const trackButton2 = document.createElement('button');
        trackButton2.className = 'track-btn';
        trackButton2.setAttribute('data-track', 'cyber-pulse');
        document.body.appendChild(trackButton2);

        // Create control buttons
        const resetButton = document.createElement('button');
        resetButton.id = 'resetMusicSettings';
        document.body.appendChild(resetButton);

        const closeButton = document.createElement('button');
        closeButton.id = 'closeMusicSettings';
        document.body.appendChild(closeButton);

        // Mock music player
        mockMusicPlayer = {
            isPlaying: jest.fn(() => false),
            isPaused: jest.fn(() => false),
            isFading: jest.fn(() => false),
            isDucked: jest.fn(() => false),
            getFadeState: jest.fn(() => ({ type: 'in' })),
        };

        // Mock music settings
        mockMusicSettings = {
            getSelectedTrack: jest.fn(() => 'ambient-space'),
            getMusicVolume: jest.fn(() => 0.7),
            reset: jest.fn(),
        };

        // Mock audio manager
        mockAudioManager = {
            isMusicAvailable: jest.fn(() => true),
            getMusicSettings: jest.fn(() => mockMusicSettings),
            getMusicPlayer: jest.fn(() => mockMusicPlayer),
            setMusicTrack: jest.fn(() => true),
            setMusicVolume: jest.fn(() => true),
        };

        // Mock logger to prevent console output during tests
        jest.mock('../../src/utils/Logger.js', () => ({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        }));
    });

    afterEach(() => {
        if (musicSettingsUI) {
            musicSettingsUI.cleanup();
        }
        jest.clearAllMocks();
    });

    describe('constructor and initialization', () => {
        it('should initialize with correct default values', () => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);

            expect(musicSettingsUI.audioManager).toBe(mockAudioManager);
            expect(musicSettingsUI.isVisible).toBe(false);
            expect(musicSettingsUI.currentTrack).toBe('ambient-space'); // Loaded from mock
            expect(musicSettingsUI.currentVolume).toBe(70); // Loaded from mock
        });

        it('should find and store DOM element references', () => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);

            expect(musicSettingsUI.panel).not.toBeNull();
            expect(musicSettingsUI.button).not.toBeNull();
            expect(musicSettingsUI.volumeSlider).not.toBeNull();
            expect(musicSettingsUI.trackButtons).toHaveLength(2);
        });

        it('should handle missing DOM elements gracefully', () => {
            // Remove required elements
            document.getElementById('musicSettingsPanel').remove();
            document.getElementById('musicSettingsButton').remove();

            expect(() => {
                musicSettingsUI = new MusicSettingsUI(mockAudioManager);
            }).not.toThrow();
        });

        it('should handle audio manager unavailable', () => {
            mockAudioManager.isMusicAvailable.mockReturnValue(false);

            expect(() => {
                musicSettingsUI = new MusicSettingsUI(mockAudioManager);
            }).not.toThrow();
        });
    });

    describe('event listeners', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should toggle panel when button is clicked', () => {
            const button = document.getElementById('musicSettingsButton');

            button.click();
            expect(musicSettingsUI.isVisible).toBe(true);

            button.click();
            expect(musicSettingsUI.isVisible).toBe(false);
        });

        it('should select track when track button is clicked', () => {
            const trackButton = document.querySelector('[data-track="cyber-pulse"]');

            trackButton.click();

            expect(mockAudioManager.setMusicTrack).toHaveBeenCalledWith('cyber-pulse');
        });

        it('should set volume when volume slider changes', () => {
            const volumeSlider = document.getElementById('musicVolumeSlider');
            volumeSlider.value = '80';

            const inputEvent = new Event('input', { bubbles: true });
            volumeSlider.dispatchEvent(inputEvent);

            expect(mockAudioManager.setMusicVolume).toHaveBeenCalledWith(0.8);
        });

        it('should reset settings when reset button is clicked', () => {
            musicSettingsUI.show(); // Need to show panel first
            const resetButton = document.getElementById('resetMusicSettings');

            resetButton.click();

            expect(mockMusicSettings.reset).toHaveBeenCalled();
        });

        it('should close panel when close button is clicked', () => {
            musicSettingsUI.show();
            const closeButton = document.getElementById('closeMusicSettings');

            closeButton.click();

            expect(musicSettingsUI.isVisible).toBe(false);
        });

        it('should close panel when escape key is pressed', () => {
            musicSettingsUI.show();

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            expect(musicSettingsUI.isVisible).toBe(false);
        });

        it('should close panel when clicking outside', () => {
            musicSettingsUI.show();

            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);

            const clickEvent = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(clickEvent, 'target', { value: outsideElement });
            document.dispatchEvent(clickEvent);

            expect(musicSettingsUI.isVisible).toBe(false);
        });
    });

    describe('track selection', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should select track successfully', () => {
            musicSettingsUI.selectTrack('neon-rush');

            expect(mockAudioManager.setMusicTrack).toHaveBeenCalledWith('neon-rush');
            expect(musicSettingsUI.currentTrack).toBe('neon-rush');
        });

        it('should handle track selection failure', () => {
            mockAudioManager.setMusicTrack.mockReturnValue(false);

            musicSettingsUI.selectTrack('invalid-track');

            expect(musicSettingsUI.currentTrack).toBe('ambient-space'); // Should remain unchanged from initial load
        });

        it('should handle audio manager unavailable during track selection', () => {
            mockAudioManager.isMusicAvailable.mockReturnValue(false);

            expect(() => {
                musicSettingsUI.selectTrack('cyber-pulse');
            }).not.toThrow();
        });

        it('should handle track selection error', () => {
            mockAudioManager.setMusicTrack.mockImplementation(() => {
                throw new Error('Track selection failed');
            });

            expect(() => {
                musicSettingsUI.selectTrack('cyber-pulse');
            }).not.toThrow();
        });
    });

    describe('volume control', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should set volume successfully', () => {
            musicSettingsUI.setVolume(80);

            expect(mockAudioManager.setMusicVolume).toHaveBeenCalledWith(0.8);
            expect(musicSettingsUI.currentVolume).toBe(80);
        });

        it('should handle volume setting when audio unavailable', () => {
            mockAudioManager.isMusicAvailable.mockReturnValue(false);

            expect(() => {
                musicSettingsUI.setVolume(50);
            }).not.toThrow();
        });

        it('should handle volume setting error', () => {
            mockAudioManager.setMusicVolume.mockImplementation(() => {
                throw new Error('Volume setting failed');
            });

            expect(() => {
                musicSettingsUI.setVolume(60);
            }).not.toThrow();
        });
    });

    describe('UI updates', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should update track button states', () => {
            musicSettingsUI.currentTrack = 'cyber-pulse';
            musicSettingsUI.updateUI();

            const activeButton = document.querySelector('[data-track="cyber-pulse"]');
            const inactiveButton = document.querySelector('[data-track="ambient-space"]');

            expect(activeButton.classList.contains('active')).toBe(true);
            expect(inactiveButton.classList.contains('active')).toBe(false);
        });

        it('should update volume display', () => {
            musicSettingsUI.currentVolume = 85;
            musicSettingsUI.updateUI();

            const volumeValue = document.getElementById('musicVolumeValue');
            const volumeSlider = document.getElementById('musicVolumeSlider');

            expect(volumeValue.textContent).toBe('85%');
            expect(volumeSlider.value).toBe('85');
        });

        it('should update current track display', () => {
            musicSettingsUI.currentTrack = 'ambient-space';
            musicSettingsUI.updateCurrentTrackDisplay();

            const currentTrackValue = document.getElementById('currentTrackValue');
            expect(currentTrackValue.textContent).toBe('Ambient Space');
        });

        it('should handle unknown track in display', () => {
            musicSettingsUI.currentTrack = 'unknown-track';
            musicSettingsUI.updateCurrentTrackDisplay();

            const currentTrackValue = document.getElementById('currentTrackValue');
            expect(currentTrackValue.textContent).toBe('unknown-track');
        });
    });

    describe('status updates', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should show playing status', () => {
            mockMusicPlayer.isPlaying.mockReturnValue(true);
            musicSettingsUI.updateStatus();

            const statusValue = document.getElementById('musicStatusValue');
            expect(statusValue.textContent).toBe('Playing');
            expect(statusValue.className).toContain('playing');
        });

        it('should show paused status', () => {
            mockMusicPlayer.isPaused.mockReturnValue(true);
            musicSettingsUI.updateStatus();

            const statusValue = document.getElementById('musicStatusValue');
            expect(statusValue.textContent).toBe('Paused');
            expect(statusValue.className).toContain('paused');
        });

        it('should show fading status', () => {
            mockMusicPlayer.isFading.mockReturnValue(true);
            mockMusicPlayer.getFadeState.mockReturnValue({ type: 'out' });
            musicSettingsUI.updateStatus();

            const statusValue = document.getElementById('musicStatusValue');
            expect(statusValue.textContent).toBe('Fading Out');
            expect(statusValue.className).toContain('fading');
        });

        it('should show ducked status', () => {
            mockMusicPlayer.isDucked.mockReturnValue(true);
            musicSettingsUI.updateStatus();

            const statusValue = document.getElementById('musicStatusValue');
            expect(statusValue.textContent).toBe('Ducked');
            expect(statusValue.className).toContain('ducked');
        });

        it('should show stopped status when audio unavailable', () => {
            mockAudioManager.isMusicAvailable.mockReturnValue(false);
            musicSettingsUI.updateStatus();

            const statusValue = document.getElementById('musicStatusValue');
            expect(statusValue.textContent).toBe('Stopped');
            expect(statusValue.className).toContain('stopped');
        });

        it('should handle missing status element', () => {
            document.getElementById('musicStatusValue').remove();

            expect(() => {
                musicSettingsUI.updateStatus();
            }).not.toThrow();
        });
    });

    describe('panel visibility', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should show panel correctly', () => {
            musicSettingsUI.show();

            expect(musicSettingsUI.isVisible).toBe(true);
            expect(musicSettingsUI.panel.style.display).toBe('block');
            expect(musicSettingsUI.button.classList.contains('active')).toBe(true);
        });

        it('should hide panel correctly', () => {
            musicSettingsUI.show();
            musicSettingsUI.hide();

            expect(musicSettingsUI.isVisible).toBe(false);
            expect(musicSettingsUI.panel.style.display).toBe('none');
            expect(musicSettingsUI.button.classList.contains('active')).toBe(false);
        });

        it('should toggle panel visibility', () => {
            expect(musicSettingsUI.isVisible).toBe(false);

            musicSettingsUI.toggle();
            expect(musicSettingsUI.isVisible).toBe(true);

            musicSettingsUI.toggle();
            expect(musicSettingsUI.isVisible).toBe(false);
        });

        it('should handle show when panel is missing', () => {
            musicSettingsUI.panel = null;

            expect(() => {
                musicSettingsUI.show();
            }).not.toThrow();
        });

        it('should handle hide when panel is missing', () => {
            musicSettingsUI.panel = null;

            expect(() => {
                musicSettingsUI.hide();
            }).not.toThrow();
        });
    });

    describe('feedback system', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should show success feedback', () => {
            musicSettingsUI.showFeedback('Test message', 'success');

            const feedbackElement = document.getElementById('music-feedback');
            expect(feedbackElement).not.toBeNull();
            expect(feedbackElement.textContent).toBe('Test message');
            expect(feedbackElement.className).toContain('success');
        });

        it('should show error feedback', () => {
            musicSettingsUI.showFeedback('Error message', 'error');

            const feedbackElement = document.getElementById('music-feedback');
            expect(feedbackElement.className).toContain('error');
        });

        it('should add feedback styles only once', () => {
            musicSettingsUI.addFeedbackStyles();
            musicSettingsUI.addFeedbackStyles();

            const styleElements = document.querySelectorAll('#music-feedback-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should auto-hide feedback after timeout', () => {
            jest.useFakeTimers();

            musicSettingsUI.showFeedback('Test message');
            const feedbackElement = document.getElementById('music-feedback');

            expect(feedbackElement.style.opacity).toBe('1');

            jest.advanceTimersByTime(3000);
            expect(feedbackElement.style.opacity).toBe('0');

            jest.advanceTimersByTime(300);
            expect(feedbackElement.style.display).toBe('none');

            jest.useRealTimers();
        });
    });

    describe('settings management', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should load settings from audio manager', () => {
            musicSettingsUI.loadSettings();

            expect(mockAudioManager.getMusicSettings).toHaveBeenCalled();
            expect(mockMusicSettings.getSelectedTrack).toHaveBeenCalled();
            expect(mockMusicSettings.getMusicVolume).toHaveBeenCalled();
        });

        it('should handle loading settings when audio unavailable', () => {
            mockAudioManager.isMusicAvailable.mockReturnValue(false);

            expect(() => {
                musicSettingsUI.loadSettings();
            }).not.toThrow();
        });

        it('should handle loading settings error', () => {
            mockAudioManager.getMusicSettings.mockImplementation(() => {
                throw new Error('Settings load failed');
            });

            expect(() => {
                musicSettingsUI.loadSettings();
            }).not.toThrow();
        });

        it('should reset settings successfully', () => {
            musicSettingsUI.resetSettings();

            expect(mockMusicSettings.reset).toHaveBeenCalled();
        });

        it('should handle reset settings error', () => {
            mockMusicSettings.reset.mockImplementation(() => {
                throw new Error('Reset failed');
            });

            expect(() => {
                musicSettingsUI.resetSettings();
            }).not.toThrow();
        });

        it('should get current settings', () => {
            musicSettingsUI.currentTrack = 'cyber-pulse';
            musicSettingsUI.currentVolume = 85;

            const settings = musicSettingsUI.getCurrentSettings();

            expect(settings).toEqual({
                track: 'cyber-pulse',
                volume: 85,
            });
        });
    });

    describe('status update intervals', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should start status updates when shown', () => {
            const updateStatusSpy = jest.spyOn(musicSettingsUI, 'updateStatus');

            musicSettingsUI.show();
            jest.advanceTimersByTime(500);

            expect(updateStatusSpy).toHaveBeenCalled();
        });

        it('should stop status updates when hidden', () => {
            musicSettingsUI.show();
            musicSettingsUI.hide();

            expect(musicSettingsUI.statusUpdateInterval).toBeNull();
        });

        it('should not start duplicate intervals', () => {
            musicSettingsUI.startStatusUpdates();
            const firstInterval = musicSettingsUI.statusUpdateInterval;

            musicSettingsUI.startStatusUpdates();

            expect(musicSettingsUI.statusUpdateInterval).toBe(firstInterval);
        });
    });

    describe('utility methods', () => {
        beforeEach(() => {
            musicSettingsUI = new MusicSettingsUI(mockAudioManager);
        });

        it('should return correct track display names', () => {
            expect(musicSettingsUI.getTrackDisplayName('none')).toBe('No Music');
            expect(musicSettingsUI.getTrackDisplayName('ambient-space')).toBe('Ambient Space');
            expect(musicSettingsUI.getTrackDisplayName('cyber-pulse')).toBe('Cyber Pulse');
            expect(musicSettingsUI.getTrackDisplayName('neon-rush')).toBe('Neon Rush');
            expect(musicSettingsUI.getTrackDisplayName('unknown')).toBe('unknown');
        });

        it('should report open state correctly', () => {
            expect(musicSettingsUI.isOpen()).toBe(false);

            musicSettingsUI.show();
            expect(musicSettingsUI.isOpen()).toBe(true);

            musicSettingsUI.hide();
            expect(musicSettingsUI.isOpen()).toBe(false);
        });

        it('should cleanup resources', () => {
            musicSettingsUI.show();
            musicSettingsUI.cleanup();

            expect(musicSettingsUI.statusUpdateInterval).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should handle initialization errors gracefully', () => {
            // Mock document methods to throw errors
            const originalGetElementById = document.getElementById;
            document.getElementById = jest.fn(() => {
                throw new Error('DOM error');
            });

            expect(() => {
                musicSettingsUI = new MusicSettingsUI(mockAudioManager);
            }).not.toThrow();

            document.getElementById = originalGetElementById;
        });

        it('should handle null audio manager', () => {
            expect(() => {
                musicSettingsUI = new MusicSettingsUI(null);
            }).not.toThrow();
        });
    });
});
