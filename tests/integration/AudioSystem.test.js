describe('Audio System Integration', () => {
    let MusicPlayer;
    let MusicSettings;
    let musicPlayer;
    let mockAudioManager;
    let mockAudioContext;
    let logger;
    let MUSIC_TRACKS;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers({
            doNotFake: ['nextTick', 'setImmediate'],
        });

        // Mock Logger
        jest.doMock('../../src/utils/Logger', () => ({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
        }));

        // Mock MusicTrack with robust implementation
        jest.doMock('../../src/audio/MusicTrack', () => {
            return {
                MusicTrack: jest.fn().mockImplementation((id, url, config) => {
                    return {
                        getId: () => id,
                        getName: () => config.name,
                        getEnergyLevel: () => config.energyLevel,
                        getDuration: () => 60,
                        isLoaded: jest.fn().mockReturnValue(false),
                        getLoadingState: jest.fn().mockReturnValue('idle'),
                        setAudioContext: jest.fn(),
                        preload: jest.fn().mockResolvedValue(),
                        getAudioBuffer: jest
                            .fn()
                            .mockReturnValue({
                                length: 100,
                                duration: 1,
                                sampleRate: 44100,
                                numberOfChannels: 2,
                            }),
                        createSource: jest.fn().mockReturnValue({
                            connect: jest.fn(),
                            start: jest.fn(),
                            stop: jest.fn(),
                            gain: {
                                value: 1,
                                setValueAtTime: jest.fn(),
                                linearRampToValueAtTime: jest.fn(),
                                cancelScheduledValues: jest.fn(),
                            },
                            loop: false,
                            onended: null,
                        }),
                        shouldLoop: jest.fn().mockReturnValue(true),
                        cleanup: jest.fn(),
                    };
                }),
            };
        });

        // Setup Globals
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        };

        Object.defineProperty(global, 'navigator', {
            value: {
                userAgent: 'node',
                hardwareConcurrency: 4,
                connection: { effectiveType: '4g', saveData: false, addEventListener: jest.fn() },
            },
            writable: true,
        });

        Object.defineProperty(global, 'performance', {
            value: {
                now: jest.fn(() => Date.now()),
                memory: { jsHeapSizeLimit: 2e9, usedJSHeapSize: 1e8 },
            },
            writable: true,
        });

        // Mock AudioContext
        mockAudioContext = {
            createGain: jest.fn().mockReturnValue({
                gain: {
                    value: 1,
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn(),
                    cancelScheduledValues: jest.fn(),
                },
                connect: jest.fn(),
            }),
            decodeAudioData: jest.fn().mockResolvedValue({}),
            state: 'running',
            resume: jest.fn().mockResolvedValue(),
            currentTime: 0,
            destination: {},
        };

        mockAudioManager = {
            getAudioContext: () => mockAudioContext,
        };

        // Re-require modules to pick up mocks
        const PlayerModule = require('../../src/audio/MusicPlayer');
        MusicPlayer = PlayerModule.MusicPlayer;

        const SettingsModule = require('../../src/audio/MusicSettings');
        MusicSettings = SettingsModule.MusicSettings;

        const ConfigModule = require('../../src/audio/MusicConfig');
        MUSIC_TRACKS = ConfigModule.MUSIC_TRACKS;

        const LoggerModule = require('../../src/utils/Logger');
        logger = LoggerModule.logger;

        // Create player
        const settings = new MusicSettings();
        musicPlayer = new MusicPlayer(mockAudioManager, settings);
    });

    afterEach(() => {
        if (musicPlayer) {
            musicPlayer.stop();
        }
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('should initialize subsystems correctly', async () => {
        const initResult = await musicPlayer.initialize(mockAudioContext);

        if (!initResult) {
            console.log('Logger Warn calls:', logger.warn.mock.calls);
        }

        expect(initResult).toBe(true);
        expect(musicPlayer.bufferManager).toBeDefined();
        expect(musicPlayer.loadingOptimizer).toBeDefined();
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('MusicPlayer initialized')
        );
    });

    test('should optimize and preload priority track on initialization', async () => {
        const targetTrackId = Object.keys(MUSIC_TRACKS).find((id) => id !== 'none');
        musicPlayer.settings.setSelectedTrack(targetTrackId);

        await musicPlayer.initialize(mockAudioContext);

        const hasBuffer = musicPlayer.bufferManager.hasBuffer(targetTrackId);
        expect(hasBuffer).toBe(true);

        const track = musicPlayer.tracks.get(targetTrackId);
        expect(track.preload).toHaveBeenCalled();
    });

    test('should trigger background loading for other tracks', async () => {
        const allTrackIds = Object.keys(MUSIC_TRACKS).filter((id) => id !== 'none');
        if (allTrackIds.length < 2) return;

        const priorityId = allTrackIds[0];
        musicPlayer.settings.setSelectedTrack(priorityId);
        await musicPlayer.initialize(mockAudioContext);

        expect(musicPlayer.bufferManager.hasBuffer(priorityId)).toBe(true);

        jest.advanceTimersByTime(200);
        jest.advanceTimersByTime(10000);

        for (let i = 0; i < 20; i++) {
            await Promise.resolve();
        }

        const bufferCount = musicPlayer.bufferManager.getMemoryUsage().bufferCount;
        expect(bufferCount).toBeGreaterThan(1);
    });

    test('should handle playback state changes', async () => {
        await musicPlayer.initialize(mockAudioContext);

        const trackId = Object.keys(MUSIC_TRACKS).find((id) => id !== 'none');
        musicPlayer.setTrack(trackId);

        const track = musicPlayer.tracks.get(trackId);
        track.isLoaded.mockReturnValue(true);

        const playResult = musicPlayer.play();
        expect(playResult).toBe(true);
        expect(musicPlayer.getPlaybackState()).toBe('playing');

        musicPlayer.pause();
        expect(musicPlayer.getPlaybackState()).toBe('paused');

        musicPlayer.play();
        expect(musicPlayer.getPlaybackState()).toBe('playing');

        musicPlayer.stop();
        expect(musicPlayer.getPlaybackState()).toBe('stopped');
    });

    test('should recover from buffer cleanup during playback attempt', async () => {
        await musicPlayer.initialize(mockAudioContext);
        const trackId = Object.keys(MUSIC_TRACKS).find((id) => id !== 'none');
        musicPlayer.setTrack(trackId);

        const track = musicPlayer.tracks.get(trackId);
        track.isLoaded.mockReturnValue(false);

        const result = musicPlayer.play();
        expect(result).toBe(false);

        track.isLoaded.mockReturnValue(true);

        const resultSuccess = musicPlayer.play();
        expect(resultSuccess).toBe(true);
    });
});
