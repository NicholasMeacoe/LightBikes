/**
 * Final validation test for the complete music system integration
 * Tests end-to-end functionality and requirement compliance
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { AudioManager } = require('@/audio/audio.js');
const { MusicPlayer } = require('@/audio/MusicPlayer.js');
const { MusicSettings } = require('@/audio/MusicSettings.js');
const { MusicTrack } = require('@/audio/MusicTrack.js');
const { MUSIC_TRACKS, ERROR_TYPES } = require('@/audio/MusicConfig.js');

// Mock Web Audio API for testing
global.AudioContext = class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = { connect: jest.fn() };
    }

    createGain() {
        return {
            gain: {
                value: 1,
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                cancelScheduledValues: jest.fn(),
            },
            connect: jest.fn(),
            disconnect: jest.fn(),
        };
    }

    createBufferSource() {
        return {
            buffer: null,
            loop: false,
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            onended: null,
        };
    }

    createBuffer(channels, length, sampleRate) {
        return {
            duration: length / sampleRate,
            length: length,
            numberOfChannels: channels,
            sampleRate: sampleRate,
            getChannelData: jest.fn(() => new Float32Array(length)),
            copyFromChannel: jest.fn(),
            copyToChannel: jest.fn(),
        };
    }

    decodeAudioData() {
        return Promise.resolve({
            duration: 120,
            numberOfChannels: 2,
            length: 5292000,
        });
    }

    resume() {
        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
};

// Mock fetch for audio loading
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'audio/mpeg' },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    })
);

describe('Music System Final Validation', () => {
    let audioManager;
    let musicPlayer;
    let musicSettings;

    // Module references
    let AudioManager;
    let MusicPlayer;
    let MusicSettings;
    let MusicTrack;
    let MUSIC_TRACKS;
    let ERROR_TYPES;
    let PLAYBACK_STATES;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Setup global fetch mock
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: () => 'audio/mpeg' },
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
            })
        );

        // Re-establish mocks
        jest.mock('@/utils/Logger.js', () => ({
            Logger: MockLoggerClass,
            logger: mockLogger,
            createLogger: jest.fn(() => mockLogger),
        }));

        // Dynamically require modules
        const AudioModule = require('@/audio/audio.js');
        const MusicPlayerModule = require('@/audio/MusicPlayer.js');
        const MusicSettingsModule = require('@/audio/MusicSettings.js');
        const MusicTrackModule = require('@/audio/MusicTrack.js');
        const MusicConfigModule = require('@/audio/MusicConfig.js');

        AudioManager = AudioModule.AudioManager;
        MusicPlayer = MusicPlayerModule.MusicPlayer;
        MusicSettings = MusicSettingsModule.MusicSettings;
        MusicTrack = MusicTrackModule.MusicTrack;
        MUSIC_TRACKS = MusicConfigModule.MUSIC_TRACKS;
        ERROR_TYPES = MusicConfigModule.ERROR_TYPES;
        PLAYBACK_STATES = MusicConfigModule.PLAYBACK_STATES;

        audioManager = new AudioManager();
        musicSettings = new MusicSettings();
    });

    afterEach(() => {
        if (musicPlayer) {
            musicPlayer.cleanup();
        }
        if (audioManager) {
            audioManager.cleanup();
        }
    });

    describe('System Integration', () => {
        it('should initialize the complete music system successfully', async () => {
            // Initialize audio manager
            const audioInitSuccess = await audioManager.initialize();
            expect(audioInitSuccess).toBe(true);

            // Check music system availability
            expect(audioManager.isMusicAvailable()).toBe(true);

            // Get music player instance
            musicPlayer = audioManager.getMusicPlayer();
            expect(musicPlayer).toBeDefined();
            expect(musicPlayer.isInitialized).toBe(true);
        });

        it('should provide all required music tracks', () => {
            const availableTracks = Object.keys(MUSIC_TRACKS);

            // Verify all required tracks are present
            expect(availableTracks).toContain('ambient-space');
            expect(availableTracks).toContain('cyber-pulse');
            expect(availableTracks).toContain('neon-rush');
            expect(availableTracks).toContain('none');

            // Verify track configurations
            expect(MUSIC_TRACKS['ambient-space'].energyLevel).toBe('ambient');
            expect(MUSIC_TRACKS['cyber-pulse'].energyLevel).toBe('upbeat');
            expect(MUSIC_TRACKS['neon-rush'].energyLevel).toBe('intense');
            expect(MUSIC_TRACKS['none'].energyLevel).toBe(null);
        });

        it('should handle fallback URLs for missing music files', () => {
            // Verify fallback URLs are configured
            expect(MUSIC_TRACKS['ambient-space'].fallbackUrl).toBeDefined();
            expect(MUSIC_TRACKS['cyber-pulse'].fallbackUrl).toBeDefined();
            expect(MUSIC_TRACKS['neon-rush'].fallbackUrl).toBeDefined();

            // Verify fallback URLs point to existing sound files
            expect(MUSIC_TRACKS['ambient-space'].fallbackUrl).toBe('sounds/engine.mp3');
            expect(MUSIC_TRACKS['cyber-pulse'].fallbackUrl).toBe('sounds/victory.mp3');
            expect(MUSIC_TRACKS['neon-rush'].fallbackUrl).toBe('sounds/explosion.mp3');
        });
    });

    describe('Game State Integration', () => {
        beforeEach(async () => {
            await audioManager.initialize();
            musicPlayer = audioManager.getMusicPlayer();
        });

        it('should handle game start events', async () => {
            const fadeInSpy = jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);

            // Simulate game start
            await audioManager.handleGameStart();

            // Verify music starts with fade-in
            expect(fadeInSpy).toHaveBeenCalled();
        });

        it('should handle game pause events', async () => {
            const fadeOutSpy = jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);
            musicPlayer.playbackState = PLAYBACK_STATES.PLAYING;

            // Simulate game pause
            await audioManager.handleGamePause();

            // Verify music fades out on pause
            expect(fadeOutSpy).toHaveBeenCalled();
        });

        it('should handle game resume events', async () => {
            const fadeInSpy = jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);
            musicPlayer.playbackState = PLAYBACK_STATES.PAUSED;

            // Simulate game resume
            await audioManager.handleGameResume();

            // Verify music fades in on resume
            expect(fadeInSpy).toHaveBeenCalled();
        });

        it('should handle game end events', async () => {
            const fadeOutSpy = jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);
            musicPlayer.playbackState = PLAYBACK_STATES.PLAYING;

            // Simulate game end
            await audioManager.handleGameEnd();

            // Verify music fades out on game end
            expect(fadeOutSpy).toHaveBeenCalled();
        });

        it('should handle game restart events', async () => {
            const onGameRestartSpy = jest
                .spyOn(musicPlayer, 'onGameRestart')
                .mockResolvedValue(true);

            // Simulate game restart
            await audioManager.handleGameRestart();

            // Verify music system handles restart
            expect(onGameRestartSpy).toHaveBeenCalled();
        });
    });

    describe('Audio Ducking Integration', () => {
        beforeEach(async () => {
            await audioManager.initialize();
            musicPlayer = audioManager.getMusicPlayer();
        });

        it('should duck music during explosion sound effects', () => {
            const duckSpy = jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);

            // Simulate explosion sound effect
            audioManager.duckMusicForSoundEffect('explosion');

            // Verify music is ducked
            expect(duckSpy).toHaveBeenCalledWith('explosion');
        });

        it('should duck music during victory sound effects', () => {
            const duckSpy = jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);

            // Simulate victory sound effect
            audioManager.duckMusicForSoundEffect('victory');

            // Verify music is ducked
            expect(duckSpy).toHaveBeenCalledWith('victory');
        });

        it('should duck music during defeat sound effects', () => {
            const duckSpy = jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);

            // Simulate defeat sound effect
            audioManager.duckMusicForSoundEffect('defeat');

            // Verify music is ducked
            expect(duckSpy).toHaveBeenCalledWith('defeat');
        });
    });

    describe('Settings Persistence', () => {
        it('should persist music volume settings', () => {
            const settings = new MusicSettings();

            // Set volume
            const success = settings.setMusicVolume(0.8);
            expect(success).toBe(true);

            // Create new settings instance to test persistence
            const newSettings = new MusicSettings();
            expect(newSettings.getMusicVolume()).toBe(0.8);
        });

        it('should persist track selection', () => {
            const settings = new MusicSettings();

            // Set track
            const success = settings.setSelectedTrack('cyber-pulse');
            expect(success).toBe(true);

            // Create new settings instance to test persistence
            const newSettings = new MusicSettings();
            expect(newSettings.getSelectedTrack()).toBe('cyber-pulse');
        });

        it('should validate settings values', () => {
            const settings = new MusicSettings();

            // Test invalid volume
            expect(settings.setMusicVolume(-0.1)).toBe(false);
            expect(settings.setMusicVolume(1.1)).toBe(false);

            // Test invalid track
            expect(settings.setSelectedTrack('invalid-track')).toBe(false);

            // Test valid values
            expect(settings.setMusicVolume(0.5)).toBe(true);
            expect(settings.setSelectedTrack('neon-rush')).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing music files gracefully', async () => {
            // Mock fetch to simulate 404 error for specific file
            global.fetch.mockImplementation((url) => {
                if (url.includes('nonexistent.mp3')) {
                    return Promise.reject(new Error('HTTP 404: Not Found'));
                }
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: { get: () => 'audio/mpeg' },
                    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
                });
            });

            const track = new MusicTrack('test-track', 'nonexistent.mp3', {
                fallbackUrl: 'sounds/engine.mp3',
            });

            const mockAudioContext = new AudioContext();
            track.setAudioContext(mockAudioContext);

            // Should attempt fallback when primary fails
            try {
                await track.load();
            } catch (e) {
                // Ignore load error if fallback works, but if it fails verify message
            }

            // If fallback works (second fetch succeeds), it should be loaded and using fallback
            if (track.isLoaded()) {
                expect(track.isUsingFallback()).toBe(true);
            } else {
                // If not loaded, it means fallback also failed (or mocked fetch failed twice)
                // But here we only mocked one rejection.
                // So we expect it to be loaded.
                expect(track.isLoaded()).toBe(true);
            }
        });

        it('should continue game operation when music system fails', async () => {
            // Mock Audio to avoid timeout in HTML5 fallback
            const mockAudio = {
                preload: 'auto',
                src: '',
                cloneNode: jest.fn(() => ({ play: jest.fn() })),
                addEventListener: jest.fn((event, callback) => {
                    if (event === 'canplaythrough' || event === 'error') {
                        // Simulate async event
                        setTimeout(() => callback(), 0);
                    }
                }),
                play: jest.fn(),
            };
            global.window.Audio = jest.fn(() => mockAudio);

            // Mock audio context creation failure
            const originalAudioContext = global.AudioContext;
            global.AudioContext = undefined;

            const audioManager = new AudioManager();
            const initSuccess = await audioManager.initialize();

            // Should not crash the game
            expect(initSuccess).toBe(true); // HTML5 fallback succeeds with mocked Audio

            // Restore original AudioContext
            global.AudioContext = originalAudioContext;
        });
    });

    describe('Performance Impact', () => {
        beforeEach(async () => {
            await audioManager.initialize();
            musicPlayer = audioManager.getMusicPlayer();
        });

        it('should not block game initialization', async () => {
            const startTime = Date.now();

            // Initialize music system
            await audioManager.initialize();

            const endTime = Date.now();
            const initTime = endTime - startTime;

            // Should complete within reasonable time (5 seconds max)
            expect(initTime).toBeLessThan(5000);
        });

        it('should provide performance metrics', () => {
            const metrics = audioManager.getPerformanceMetrics();

            expect(metrics).toHaveProperty('isInitialized');
            expect(metrics).toHaveProperty('isMuted');
            expect(metrics).toHaveProperty('maxConcurrentSounds');
        });
    });

    describe('Requirements Validation', () => {
        beforeEach(async () => {
            await audioManager.initialize();
            musicPlayer = audioManager.getMusicPlayer();
        });

        it('should meet Requirement 1: Atmospheric background music', () => {
            // Music player should be available
            expect(musicPlayer).toBeDefined();

            // Should have tracks with different energy levels
            const tracks = musicPlayer.getAvailableTracks();
            const energyLevels = tracks.map((t) => t.energyLevel).filter((e) => e !== null);

            expect(energyLevels).toContain('ambient');
            expect(energyLevels).toContain('upbeat');
            expect(energyLevels).toContain('intense');
        });

        it('should meet Requirement 2: Independent volume control', () => {
            // Should have separate volume control
            expect(typeof musicPlayer.setVolume).toBe('function');
            expect(typeof musicPlayer.getVolume).toBe('function');

            // Volume should be independent of sound effects
            const initialVolume = musicPlayer.getVolume();
            const newVolume = initialVolume === 0.5 ? 0.6 : 0.5;
            musicPlayer.setVolume(newVolume);
            expect(musicPlayer.getVolume()).toBe(newVolume);
            expect(musicPlayer.getVolume()).not.toBe(initialVolume);
        });

        it('should meet Requirement 3: Smooth audio transitions', () => {
            // Should have fade methods
            expect(typeof musicPlayer.fadeIn).toBe('function');
            expect(typeof musicPlayer.fadeOut).toBe('function');

            // Should have game event handlers
            expect(typeof musicPlayer.onGamePause).toBe('function');
            expect(typeof musicPlayer.onGameResume).toBe('function');
            expect(typeof musicPlayer.onGameEnd).toBe('function');
        });

        it('should meet Requirement 4: Multiple track options', () => {
            const tracks = musicPlayer.getAvailableTracks();

            // Should have at least 3 music tracks plus "none" option
            expect(tracks.length).toBeGreaterThanOrEqual(4);

            // Should include "none" option
            const noneTrack = tracks.find((t) => t.id === 'none');
            expect(noneTrack).toBeDefined();
            expect(noneTrack.name).toBe('No Music');
        });

        it('should meet Requirement 5: Sound effects integration', () => {
            // Should have ducking functionality
            expect(typeof musicPlayer.duck).toBe('function');
            expect(typeof musicPlayer.unduck).toBe('function');
            expect(typeof musicPlayer.onSoundEffect).toBe('function');

            // Should integrate with AudioManager
            expect(typeof audioManager.duckMusicForSoundEffect).toBe('function');
        });
    });
});
