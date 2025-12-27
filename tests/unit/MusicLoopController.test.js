/**
 * Tests for MusicLoopController
 * Verifies seamless looping functionality and gap detection
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

const { MusicLoopController } = require('@/audio/MusicLoopController.js');

describe('MusicLoopController', () => {
    let mockAudioContext;
    let mockTrack;
    let mockDestination;
    let mockAudioBuffer;
    let mockSource;
    let loopController;

    beforeEach(() => {
        // Mock audio buffer
        mockAudioBuffer = {
            duration: 120, // 2 minutes
            numberOfChannels: 2,
            sampleRate: 44100,
            getChannelData: jest.fn(() => new Float32Array(44100 * 120)), // 2 minutes of samples
        };

        // Mock audio source
        mockSource = {
            buffer: null,
            loop: false,
            connect: jest.fn(),
            disconnect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            onended: null,
        };

        // Mock gain node
        const mockGainNode = {
            gain: {
                value: 1.0,
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
            },
            connect: jest.fn(),
            disconnect: jest.fn(),
        };

        // Mock audio context
        mockAudioContext = {
            createGain: jest.fn(() => mockGainNode),
            createBufferSource: jest.fn(() => mockSource),
            currentTime: 0,
        };

        // Mock destination
        mockDestination = {
            connect: jest.fn(),
            disconnect: jest.fn(),
        };

        // Mock track
        mockTrack = {
            getId: () => 'test-track',
            isLoaded: () => true,
            getAudioBuffer: () => mockAudioBuffer,
            createSource: jest.fn(() => mockSource),
        };

        loopController = new MusicLoopController(mockAudioContext);
    });

    describe('initialization', () => {
        it('should create with default state', () => {
            expect(loopController.isActive()).toBe(false);
            expect(loopController.getLoopState()).toBe('stopped');
            expect(loopController.getLoopCount()).toBe(0);
        });

        it('should create gain node', () => {
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });
    });

    describe('loop starting', () => {
        it('should start loop with valid track', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            expect(loopController.isActive()).toBe(true);
            expect(loopController.getLoopState()).toBe('looping');
            expect(mockTrack.createSource).toHaveBeenCalled();
            expect(mockSource.start).toHaveBeenCalled();
        });

        it('should handle "none" track', async () => {
            const noneTrack = {
                getId: () => 'none',
                isLoaded: () => true,
            };

            await loopController.startLoop(noneTrack, mockDestination);

            expect(loopController.getLoopState()).toBe('stopped');
            expect(loopController.isActive()).toBe(false);
        });

        it('should throw error for unloaded track', async () => {
            mockTrack.isLoaded = () => false;

            await expect(loopController.startLoop(mockTrack, mockDestination)).rejects.toThrow(
                'Track must be loaded before starting loop'
            );
        });

        it('should throw error for track without audio buffer', async () => {
            mockTrack.getAudioBuffer = () => null;

            await expect(loopController.startLoop(mockTrack, mockDestination)).rejects.toThrow(
                'Audio buffer not available for looping'
            );
        });

        it('should stop existing loop before starting new one', async () => {
            // Start first loop
            await loopController.startLoop(mockTrack, mockDestination);
            expect(loopController.isActive()).toBe(true);

            // Start second loop
            await loopController.startLoop(mockTrack, mockDestination);
            expect(loopController.isActive()).toBe(true);
            expect(loopController.getLoopCount()).toBe(0); // Reset
        });
    });

    describe('loop stopping', () => {
        beforeEach(async () => {
            await loopController.startLoop(mockTrack, mockDestination);
        });

        it('should stop active loop', async () => {
            await loopController.stopLoop();

            expect(loopController.isActive()).toBe(false);
            expect(loopController.getLoopState()).toBe('stopped');
            expect(mockSource.stop).toHaveBeenCalled();
        });

        it('should stop with fade out', async () => {
            const fadeOutDuration = 0.5;

            await loopController.stopLoop(fadeOutDuration);

            expect(loopController.isActive()).toBe(false);
            expect(loopController.getLoopState()).toBe('stopped');
        });

        it('should handle stopping when not looping', async () => {
            await loopController.stopLoop();

            // Should not throw error when stopping again
            await expect(loopController.stopLoop()).resolves.toBeUndefined();
        });
    });

    describe('volume control', () => {
        it('should set volume', () => {
            loopController.setVolume(0.5);

            const gainNode = mockAudioContext.createGain();
            expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
        });

        it('should clamp volume to valid range', () => {
            loopController.setVolume(-0.5); // Below minimum
            loopController.setVolume(1.5); // Above maximum

            const gainNode = mockAudioContext.createGain();
            expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
            expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, 0);
        });

        it('should get current volume', () => {
            const volume = loopController.getVolume();
            expect(typeof volume).toBe('number');
        });
    });

    describe('loop timing analysis', () => {
        it('should analyze loop points for gaps', async () => {
            // Create buffer with silence at start and end
            const channelData = new Float32Array(44100 * 2); // 2 seconds
            channelData.fill(0.001, 1000, channelData.length - 1000); // Silence at edges
            mockAudioBuffer.getChannelData.mockReturnValue(channelData);

            await loopController.startLoop(mockTrack, mockDestination);

            const timing = loopController.getLoopTiming();
            expect(timing.startTime).toBeGreaterThan(0); // Should skip initial silence
            expect(timing.endTime).toBeLessThan(mockAudioBuffer.duration); // Should skip end silence
        });

        it('should detect potential clicks at loop point', async () => {
            // Create buffer with different start/end samples
            const channelData = new Float32Array(44100 * 2);
            channelData[0] = 0.5; // High start sample
            channelData[channelData.length - 1] = -0.5; // Low end sample
            mockAudioBuffer.getChannelData.mockReturnValue(channelData);

            await loopController.startLoop(mockTrack, mockDestination);

            const timing = loopController.getLoopTiming();
            expect(timing.crossfadeDuration).toBeGreaterThan(0);
        });
    });

    describe('loop state management', () => {
        it('should track loop count', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            expect(loopController.getLoopCount()).toBe(0);

            // Simulate source ended event
            if (mockSource.onended) {
                mockSource.onended();
            }
        });

        it('should provide loop timing information', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            const timing = loopController.getLoopTiming();
            expect(timing).toHaveProperty('startTime');
            expect(timing).toHaveProperty('endTime');
            expect(timing).toHaveProperty('duration');
            expect(timing).toHaveProperty('crossfadeDuration');
            expect(timing).toHaveProperty('loopCount');
        });
    });

    describe('loop restart', () => {
        it('should restart current loop', async () => {
            await loopController.startLoop(mockTrack, mockDestination);
            const initialCount = loopController.getLoopCount();

            await loopController.restartLoop(mockTrack, mockDestination);

            expect(loopController.isActive()).toBe(true);
            expect(loopController.getLoopCount()).toBe(0); // Reset count
        });
    });

    describe('source management', () => {
        it('should handle source ended event', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            // Simulate source ending
            if (mockSource.onended) {
                mockSource.onended();
            }

            expect(mockSource.disconnect).toHaveBeenCalled();
        });

        it('should create sources with correct configuration', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            expect(mockSource.loop).toBe(false); // Manual looping
            expect(mockSource.connect).toHaveBeenCalled();
            expect(mockSource.start).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle source creation failure', async () => {
            mockTrack.createSource = () => null;

            await expect(loopController.startLoop(mockTrack, mockDestination)).rejects.toThrow(
                'Failed to create audio source for looping'
            );
        });

        it('should handle source disconnect errors gracefully', async () => {
            mockSource.disconnect.mockImplementation(() => {
                throw new Error('Already disconnected');
            });

            await loopController.startLoop(mockTrack, mockDestination);

            // Should not throw when stopping
            await expect(loopController.stopLoop()).resolves.toBeUndefined();
        });
    });

    describe('cleanup', () => {
        it('should clean up all resources', async () => {
            await loopController.startLoop(mockTrack, mockDestination);

            loopController.cleanup();

            expect(loopController.isActive()).toBe(false);
            expect(loopController.getLoopState()).toBe('stopped');
        });
    });
});
