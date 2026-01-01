/**
 * MusicPlayer Tests
 * Tests for the MusicPlayer class functionality including playback controls,
 * fade transitions, and audio ducking integration
 */

const mockLoggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

let MusicPlayerClass;
let MusicSettingsClass;

describe('MusicPlayer', () => {
    let musicPlayer;
    let mockSettings;
    let mockGainNode;
    let mockAudioContext;
    let mockAudioManager;
    let mockTrack;
    let mockNoneTrack;

    beforeEach(() => {
        // Reset mocks and modules
        jest.resetModules();
        jest.clearAllMocks();

        // 1. Setup Fresh Mocks
        mockGainNode = {
            gain: {
                value: 0.7,
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                cancelScheduledValues: jest.fn(),
            },
            connect: jest.fn(),
            disconnect: jest.fn(),
        };

        mockAudioContext = {
            createGain: jest.fn(() => mockGainNode),
            createBufferSource: jest.fn().mockImplementation(() => ({
                buffer: null,
                loop: false,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null,
            })),
            destination: { connect: jest.fn() },
            currentTime: 0,
            state: 'running',
            resume: jest.fn().mockResolvedValue(),
        };

        mockAudioManager = {
            audioContext: mockAudioContext,
            isInitialized: true,
            isMuted: false,
        };

        mockTrack = {
            getId: () => 'ambient-space',
            getName: () => 'Ambient Space',
            getEnergyLevel: () => 'ambient',
            getDuration: () => 120,
            isLoaded: jest.fn().mockReturnValue(true),
            getLoadingState: () => 'loaded',
            shouldLoop: () => true,
            createSource: jest.fn(() => mockAudioContext.createBufferSource()),
            setAudioContext: jest.fn(),
            preload: jest.fn().mockResolvedValue(),
            cleanup: jest.fn(),
            getAudioBuffer: jest.fn(),
        };

        mockNoneTrack = {
            getId: () => 'none',
            getName: () => 'No Music',
            getEnergyLevel: () => null,
            getDuration: () => null,
            isLoaded: () => true,
            getLoadingState: () => 'loaded',
            shouldLoop: () => false,
            createSource: () => null,
            setAudioContext: jest.fn(),
            preload: jest.fn().mockResolvedValue(),
            cleanup: jest.fn(),
            getAudioBuffer: jest.fn(),
        };

        // Establish the mock BEFORE requiring the modules
        jest.mock('@/utils/Logger.js', () => ({
            Logger: {
                create: jest.fn(() => mockLoggerInstance),
            },
            logger: mockLoggerInstance,
            createLogger: jest.fn(() => mockLoggerInstance),
            __mockLoggerInstance: mockLoggerInstance,
        }));

        // Require inside isolateModules or after mock
        const MusicPlayerModule = require('@/audio/MusicPlayer.js');
        const MusicSettingsModule = require('@/audio/MusicSettings.js');
        MusicPlayerClass = MusicPlayerModule.MusicPlayer;
        MusicSettingsClass = MusicSettingsModule.MusicSettings;

        // Create mock settings
        mockSettings = new MusicSettingsClass();
        jest.spyOn(mockSettings, 'getMusicVolume').mockReturnValue(0.7);
        jest.spyOn(mockSettings, 'getSelectedTrack').mockReturnValue('ambient-space');
        jest.spyOn(mockSettings, 'getFadeInDuration').mockReturnValue(0.5);
        jest.spyOn(mockSettings, 'getFadeOutDuration').mockReturnValue(0.5);
        jest.spyOn(mockSettings, 'getDuckingLevel').mockReturnValue(0.3);
        jest.spyOn(mockSettings, 'getDuckingDuration').mockReturnValue(0.2);
        jest.spyOn(mockSettings, 'getDuckingRecovery').mockReturnValue(0.2);
        jest.spyOn(mockSettings, 'setSelectedTrack').mockReturnValue(true);
        jest.spyOn(mockSettings, 'setMusicVolume').mockReturnValue(true);

        // Create music player
        musicPlayer = new MusicPlayerClass(mockAudioManager, mockSettings);

        // Force audio context and gain node for tests
        musicPlayer.audioContext = mockAudioContext;
        musicPlayer.masterGainNode = mockAudioContext.createGain(); // Uses fresh mockGainNode
        musicPlayer.isInitialized = true;
        musicPlayer.playbackState = 'stopped'; // Ensure clean state

        // Force logger if it's undefined
        if (!musicPlayer.logger) {
            musicPlayer.logger = mockLoggerInstance;
        }

        // Mock the tracks map
        musicPlayer.tracks.set('ambient-space', mockTrack);
        musicPlayer.tracks.set('none', mockNoneTrack);
    });

    afterEach(() => {
        if (musicPlayer) {
            musicPlayer.cleanup();
        }
    });

    describe('Initialization', () => {
        it('should initialize successfully with audio context', async () => {
            musicPlayer.isInitialized = false;
            musicPlayer.masterGainNode = null;

            // Re-mock createGain to ensure it returns the node for this specific test
            const createGainSpy = jest
                .spyOn(mockAudioContext, 'createGain')
                .mockReturnValue(mockGainNode);

            const result = await musicPlayer.initialize(mockAudioContext);

            expect(result).toBe(true);
            expect(musicPlayer.isInitialized).toBe(true);
            expect(musicPlayer.audioContext).toBe(mockAudioContext);
            expect(mockAudioContext.createGain).toHaveBeenCalled();

            createGainSpy.mockRestore();
        });

        it('should not reinitialize if already initialized', async () => {
            musicPlayer.isInitialized = true;
            const createGainCallCount = mockAudioContext.createGain.mock.calls.length;

            const result = await musicPlayer.initialize(mockAudioContext);

            expect(result).toBe(true);
            expect(mockAudioContext.createGain).toHaveBeenCalledTimes(createGainCallCount);
        });

        it('should handle initialization errors gracefully', async () => {
            musicPlayer.isInitialized = false;
            const errorSpy = jest.spyOn(mockAudioContext, 'createGain').mockImplementation(() => {
                throw new Error('Audio context error');
            });

            const result = await musicPlayer.initialize(mockAudioContext);

            expect(result).toBe(false);
            expect(musicPlayer.isInitialized).toBe(false);

            errorSpy.mockRestore();
        });
    });

    describe('Basic Playback Controls', () => {
        beforeEach(() => {
            musicPlayer.isInitialized = true;
            musicPlayer.audioContext = mockAudioContext;
            musicPlayer.masterGainNode = mockGainNode;
            musicPlayer.playbackState = 'stopped';

            // Ensure track is loaded in the player's tracks map
            const track = musicPlayer.tracks.get('ambient-space');
            if (track) {
                jest.spyOn(track, 'isLoaded').mockReturnValue(true);
                jest.spyOn(track, 'createSource').mockReturnValue(
                    mockAudioContext.createBufferSource()
                );
            }
        });

        it('should play selected track successfully', () => {
            const result = musicPlayer.play();

            expect(result).toBe(true);
            expect(musicPlayer.isPlaying()).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('playing');
        });

        it('should not play if track is "none"', () => {
            mockSettings.getSelectedTrack.mockReturnValue('none');

            const result = musicPlayer.play();

            expect(result).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('stopped');
        });

        it('should stop playback successfully', () => {
            musicPlayer.play();

            const result = musicPlayer.stop();

            expect(result).toBe(true);
            expect(musicPlayer.isPlaying()).toBe(false);
            expect(musicPlayer.getPlaybackState()).toBe('stopped');
        });

        it('should pause playback successfully', () => {
            musicPlayer.play();

            const result = musicPlayer.pause();

            expect(result).toBe(true);
            expect(musicPlayer.isPaused()).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('paused');
        });

        it('should not play if not initialized', () => {
            musicPlayer.isInitialized = false;

            const result = musicPlayer.play();

            expect(result).toBe(false);
        });
    });

    describe('Track Selection and Switching', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should set track successfully', () => {
            const result = musicPlayer.setTrack('ambient-space');

            expect(result).toBe(true);
            expect(mockSettings.setSelectedTrack).toHaveBeenCalledWith('ambient-space');
        });

        it('should reject invalid track ID', () => {
            const result = musicPlayer.setTrack('invalid-track');

            expect(result).toBe(false);
            expect(mockSettings.setSelectedTrack).not.toHaveBeenCalled();
        });

        it('should switch tracks while playing', () => {
            musicPlayer.play();
            mockSettings.getSelectedTrack.mockReturnValue('cyber-pulse');

            // Add cyber-pulse track to mock
            const cyberTrack = { ...mockTrack, getId: () => 'cyber-pulse' };
            musicPlayer.tracks.set('cyber-pulse', cyberTrack);

            const result = musicPlayer.setTrack('cyber-pulse');

            expect(result).toBe(true);
            expect(musicPlayer.isPlaying()).toBe(true);
        });

        it('should get available tracks list', () => {
            const tracks = musicPlayer.getAvailableTracks();

            expect(Array.isArray(tracks)).toBe(true);
            expect(tracks.length).toBeGreaterThan(0);
            expect(tracks[0]).toHaveProperty('id');
            expect(tracks[0]).toHaveProperty('name');
        });

        it('should get current track info', () => {
            musicPlayer.currentTrack = musicPlayer.tracks.get('ambient-space');
            musicPlayer.playbackState = 'playing';

            const currentTrack = musicPlayer.getCurrentTrack();

            expect(currentTrack).not.toBeNull();
            expect(currentTrack.id).toBe('ambient-space');
            expect(currentTrack.playbackState).toBe('playing');
        });

        it('should return null for current track when stopped', () => {
            const currentTrack = musicPlayer.getCurrentTrack();

            expect(currentTrack).toBeNull();
        });
    });

    describe('Volume Control', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should set volume successfully', () => {
            const result = musicPlayer.setVolume(0.5);

            expect(result).toBe(true);
            expect(musicPlayer.getVolume()).toBe(0.5);
            expect(mockSettings.setMusicVolume).toHaveBeenCalledWith(0.5);
        });

        it('should reject invalid volume values', () => {
            const result1 = musicPlayer.setVolume(-0.1);
            const result2 = musicPlayer.setVolume(1.1);
            const result3 = musicPlayer.setVolume('invalid');

            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });

        it('should apply volume immediately to gain node', () => {
            musicPlayer.setVolume(0.8);

            expect(mockGainNode.gain.value).toBe(0.8);
        });

        it('should get current volume', () => {
            musicPlayer.setVolume(0.6);

            const volume = musicPlayer.getVolume();

            expect(volume).toBe(0.6);
        });
    });

    describe('Fade Transitions', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should fade in successfully', async () => {
            const fadePromise = musicPlayer.fadeIn(0.1); // Short duration for test

            expect(musicPlayer.getPlaybackState()).toBe('fading_in');
            expect(musicPlayer.isFading()).toBe(true);

            const result = await fadePromise;

            expect(result).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('playing');
            expect(musicPlayer.isFading()).toBe(false);
        });

        it('should fade out successfully', async () => {
            musicPlayer.play();

            const fadePromise = musicPlayer.fadeOut(0.1); // Short duration for test

            expect(musicPlayer.getPlaybackState()).toBe('fading_out');
            expect(musicPlayer.isFading()).toBe(true);

            const result = await fadePromise;

            expect(result).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('stopped');
            expect(musicPlayer.isFading()).toBe(false);
        });

        it('should cancel fade transition', () => {
            musicPlayer.play();
            musicPlayer.fadeOut(1.0); // Long duration

            const result = musicPlayer.cancelFade();

            expect(result).toBe(true);
            expect(musicPlayer.isFading()).toBe(false);
        });

        it('should get fade state information', () => {
            musicPlayer.fadeIn(0.5);

            const fadeState = musicPlayer.getFadeState();

            expect(fadeState.active).toBe(true);
            expect(fadeState.type).toBe('in');
            expect(fadeState.duration).toBe(0.5);
        });

        it('should perform smooth volume transition', async () => {
            const result = await musicPlayer.smoothVolumeTransition(0.4, 0.1);

            expect(result).toBe(true);
            expect(musicPlayer.getVolume()).toBe(0.4);
        });
    });

    describe('Audio Ducking', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
            musicPlayer.play();
        });

        it('should duck volume successfully', () => {
            const result = musicPlayer.duck(0.3, 0.1);

            expect(result).toBe(true);
            expect(musicPlayer.isDucked()).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('ducked');
        });

        it('should unduck volume successfully', () => {
            musicPlayer.duck(0.3, 0.1);

            const result = musicPlayer.unduck(0.1);

            expect(result).toBe(true);
            expect(musicPlayer.isDucked()).toBe(false);
            expect(musicPlayer.getPlaybackState()).toBe('playing');
        });

        it('should handle sound effect ducking', () => {
            const result = musicPlayer.onSoundEffect('explosion');

            expect(result).toBe(true);
            expect(musicPlayer.isDucked()).toBe(true);
        });

        it('should handle explosion sound ducking', () => {
            const result = musicPlayer.onExplosionSound();

            expect(result).toBe(true);
            expect(musicPlayer.isDucked()).toBe(true);
        });

        it('should handle collision sound ducking', () => {
            const result = musicPlayer.onCollisionSound();

            expect(result).toBe(true);
            expect(musicPlayer.isDucked()).toBe(true);
        });

        it('should get ducking state information', () => {
            musicPlayer.duck(0.4);

            const duckingState = musicPlayer.getDuckingState();

            expect(duckingState.active).toBe(true);
            expect(duckingState.duckLevel).toBe(0.4);
        });

        it('should not duck if not playing', () => {
            musicPlayer.stop();

            const result = musicPlayer.duck();

            expect(result).toBe(false);
            expect(musicPlayer.isDucked()).toBe(false);
        });
    });

    describe('Status and Error Handling', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should get comprehensive status information', () => {
            musicPlayer.play();

            const status = musicPlayer.getStatus();

            expect(status).toHaveProperty('isInitialized', true);
            expect(status).toHaveProperty('playbackState', 'playing');
            expect(status).toHaveProperty('currentTrack');
            expect(status).toHaveProperty('volume');
            expect(status).toHaveProperty('selectedTrackId');
        });

        it('should handle errors gracefully', () => {
            // Force an error by making createSource return null
            mockTrack.createSource = jest.fn(() => null);

            const result = musicPlayer.play();

            expect(result).toBe(false);
            expect(musicPlayer.getLastError()).not.toBeNull();
        });

        it('should track error count', () => {
            // Force multiple errors
            mockTrack.createSource = jest.fn(() => null);

            musicPlayer.play();
            musicPlayer.play();

            const status = musicPlayer.getStatus();
            expect(status.errorCount).toBeGreaterThan(0);
        });
    });

    describe('Game Event Handlers', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should handle game start event', async () => {
            jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);

            const result = await musicPlayer.onGameStart();

            expect(result).toBe(true);
            expect(musicPlayer.fadeIn).toHaveBeenCalled();
        });

        it('should handle game pause event', async () => {
            // Set state to playing so pause has an effect
            musicPlayer.playbackState = 'playing';
            jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);

            const result = await musicPlayer.onGamePause();

            expect(result).toBe(true);
            expect(musicPlayer.fadeOut).toHaveBeenCalledWith(0.5);
        });

        it('should handle game resume event', async () => {
            // Set state to paused so resume has an effect
            musicPlayer.playbackState = 'paused';
            jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);

            const result = await musicPlayer.onGameResume();

            expect(result).toBe(true);
            expect(musicPlayer.fadeIn).toHaveBeenCalledWith(0.5);
        });

        it('should handle game end event', async () => {
            // Set state to playing so end has an effect
            musicPlayer.playbackState = 'playing';
            jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);

            const result = await musicPlayer.onGameEnd();

            expect(result).toBe(true);
            expect(musicPlayer.fadeOut).toHaveBeenCalledWith(2.0);
        });

        it('should handle game restart event', async () => {
            jest.spyOn(musicPlayer, 'stop').mockReturnValue(true);
            jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);

            const result = await musicPlayer.onGameRestart();

            expect(result).toBe(true);
            expect(musicPlayer.stop).toHaveBeenCalled();
            expect(musicPlayer.fadeIn).toHaveBeenCalled();
        });

        it('should not handle events if not initialized', async () => {
            musicPlayer.isInitialized = false;

            const startResult = await musicPlayer.onGameStart();
            const pauseResult = await musicPlayer.onGamePause();
            const resumeResult = await musicPlayer.onGameResume();
            const endResult = await musicPlayer.onGameEnd();
            const restartResult = await musicPlayer.onGameRestart();

            expect(startResult).toBe(false);
            expect(pauseResult).toBe(false);
            expect(resumeResult).toBe(false);
            expect(endResult).toBe(false);
            expect(restartResult).toBe(false);
        });
    });

    describe('Sound Effect Event Handlers', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
            musicPlayer.play();
        });

        it('should handle victory sound ducking', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);

            const result = musicPlayer.onVictorySound();

            expect(result).toBe(true);
            expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('victory');
        });

        it('should handle defeat sound ducking', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);

            const result = musicPlayer.onDefeatSound();

            expect(result).toBe(true);
            expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('defeat');
        });

        it('should schedule ducking recovery', () => {
            jest.spyOn(global, 'setTimeout');

            musicPlayer.duck(0.3);
            musicPlayer._scheduleDuckingRecovery(1000);

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
        });

        it('should clear existing recovery timeout', () => {
            jest.spyOn(global, 'clearTimeout');

            musicPlayer.duck(0.3);
            musicPlayer._scheduleDuckingRecovery(1000);
            musicPlayer._scheduleDuckingRecovery(2000);

            expect(clearTimeout).toHaveBeenCalled();
        });
    });

    describe('System Status and Optimization', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should get comprehensive system status', () => {
            const systemStatus = musicPlayer.getSystemStatus();

            expect(systemStatus).toHaveProperty('isInitialized');
            expect(systemStatus).toHaveProperty('errorStatistics');
            expect(systemStatus).toHaveProperty('performanceMetrics');
            expect(systemStatus).toHaveProperty('memoryUsage');
            expect(systemStatus).toHaveProperty('bufferStatistics');
        });

        it('should perform system optimization', async () => {
            const optimizationResult = await musicPlayer.performOptimization();

            expect(optimizationResult).toHaveProperty('performed');
            expect(optimizationResult).toHaveProperty('skipped');
            expect(optimizationResult).toHaveProperty('errors');
            expect(Array.isArray(optimizationResult.performed)).toBe(true);
        });

        it('should handle optimization errors gracefully', async () => {
            // Mock buffer manager to throw error
            jest.spyOn(musicPlayer.bufferManager, 'optimizeLoadingStrategy').mockImplementation(
                () => {
                    throw new Error('Optimization failed');
                }
            );

            const result = await musicPlayer.performOptimization();

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toHaveProperty('action', 'buffer_optimization');
        });
    });

    describe('Advanced Fade Operations', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should calculate fade progress correctly', () => {
            musicPlayer.fadeState = {
                active: true,
                startTime: mockAudioContext.currentTime - 0.25,
                duration: 0.5,
            };

            const progress = musicPlayer._calculateFadeProgress();

            expect(progress).toBeGreaterThan(0);
            expect(progress).toBeLessThanOrEqual(1);
        });

        it('should return zero progress when fade is not active', () => {
            const progress = musicPlayer._calculateFadeProgress();

            expect(progress).toBe(0);
        });

        it('should handle fade state updates during volume changes', () => {
            musicPlayer.fadeState.active = true;
            musicPlayer.fadeState.targetVolume = 0.5;

            musicPlayer.setVolume(0.8);

            expect(musicPlayer.fadeState.targetVolume).toBe(0.8);
        });
    });

    describe('Error Recovery and Resilience', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });

        it('should enter error state after multiple failures', () => {
            // Force multiple errors
            for (let i = 0; i < 6; i++) {
                musicPlayer._handleError(new Error('Test error'), 'test');
            }

            expect(musicPlayer.getPlaybackState()).toBe('error');
        });

        it('should attempt retry on recoverable errors', async () => {
            jest.spyOn(musicPlayer, 'play');

            // Mock error handler to return retry action
            jest.spyOn(musicPlayer.errorHandler, 'handlePlaybackError').mockReturnValue({
                action: 'pause_and_retry',
                canRetry: true,
                retryDelay: 100,
            });

            musicPlayer._handleError(new Error('Recoverable error'), 'test');

            await new Promise((resolve) => setTimeout(resolve, 150));
            expect(musicPlayer.play).toHaveBeenCalled();
        });

        it('should stop playback on critical errors', () => {
            jest.spyOn(musicPlayer, 'stop');

            // Mock error handler to return stop action
            jest.spyOn(musicPlayer.errorHandler, 'handlePlaybackError').mockReturnValue({
                action: 'stop_playback',
            });

            musicPlayer._handleError(new Error('Critical error'), 'test');

            expect(musicPlayer.stop).toHaveBeenCalled();
        });
    });

    describe('Background Loading', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            await musicPlayer.initialize(mockAudioContext);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should start background loading for non-priority tracks', () => {
            // We can't spy on global setTimeout if using fake timers easily in same scope,
            // but we can verify behavior.
            const trackConfigs = [
                { id: 'track1', url: 'track1.mp3' },
                { id: 'track2', url: 'track2.mp3' },
            ];

            musicPlayer._startBackgroundLoading(trackConfigs);

            // Advance time to trigger
            jest.advanceTimersByTime(100);

            // We implicitly check that it runs without error (mocking progressiveLoad not to crash)
        });

        it('should handle background loading errors gracefully', async () => {
            // Mock loading optimizer to throw error
            jest.spyOn(musicPlayer.loadingOptimizer, 'progressiveLoad').mockRejectedValue(
                new Error('Background loading failed')
            );

            const trackConfigs = [{ id: 'track1', url: 'track1.mp3' }];
            musicPlayer._startBackgroundLoading(trackConfigs);

            // Advance timers to trigger callback
            await jest.advanceTimersByTimeAsync(150);

            expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
                'Background loading error:',
                expect.any(Error)
            );
        });
    });

    describe('Cleanup', () => {
        beforeEach(async () => {
            // await musicPlayer.initialize(mockAudioContext); // Not strictly needed if we mock props
        });

        it('should cleanup resources properly', () => {
            // Setup robust state for cleanup test
            musicPlayer.masterGainNode = { disconnect: jest.fn() };
            musicPlayer.audioContext = mockAudioContext;
            musicPlayer.isInitialized = true;
            musicPlayer.play = jest.fn(); // Mock play to avoid logic

            musicPlayer.cleanup();

            expect(musicPlayer.isInitialized).toBe(false);
            expect(musicPlayer.audioContext).toBeNull();
            expect(musicPlayer.masterGainNode).toBeNull();
            expect(musicPlayer.tracks.size).toBe(0);
        });

        it('should stop playback during cleanup', () => {
            musicPlayer.play();

            musicPlayer.cleanup();

            expect(musicPlayer.getPlaybackState()).toBe('stopped');
        });

        it('should cleanup all subsystems', () => {
            jest.spyOn(musicPlayer.performanceMonitor, 'cleanup');
            jest.spyOn(musicPlayer.bufferManager, 'cleanup');
            jest.spyOn(musicPlayer.loadingOptimizer, 'cleanup');
            jest.spyOn(musicPlayer.errorHandler, 'clearErrorLog');

            musicPlayer.cleanup();

            expect(musicPlayer.performanceMonitor.cleanup).toHaveBeenCalled();
            expect(musicPlayer.bufferManager.cleanup).toHaveBeenCalled();
            expect(musicPlayer.loadingOptimizer.cleanup).toHaveBeenCalled();
            expect(musicPlayer.errorHandler.clearErrorLog).toHaveBeenCalled();
        });

        it('should cleanup individual tracks', () => {
            const mockTrackCleanup = jest.fn();
            musicPlayer.tracks.forEach((track) => {
                track.cleanup = mockTrackCleanup;
            });

            musicPlayer.cleanup();

            expect(mockTrackCleanup).toHaveBeenCalled();
        });
    });
});
