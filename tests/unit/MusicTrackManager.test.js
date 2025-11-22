/**
 * Tests for MusicTrackManager
 * Verifies track management, preloading, and error handling functionality
 */

const { MusicTrackManager } = require('@/audio/MusicTrackManager.js');
const { MusicTrack } = require('@/audio/MusicTrack.js');

// Mock dependencies
jest.mock('./MusicTrack.js');
jest.mock('./MusicConfig.js', () => ({
    MUSIC_TRACKS: {
        'ambient-space': {
            id: 'ambient-space',
            name: 'Ambient Space',
            url: 'sounds/music/ambient-space.mp3',
            energyLevel: 'ambient',
            loop: true,
            preload: true
        },
        'cyber-pulse': {
            id: 'cyber-pulse',
            name: 'Cyber Pulse',
            url: 'sounds/music/cyber-pulse.mp3',
            energyLevel: 'upbeat',
            loop: true,
            preload: true
        },
        'none': {
            id: 'none',
            name: 'No Music',
            url: null,
            energyLevel: null,
            loop: false,
            preload: false
        }
    },
    MUSIC_SYSTEM_CONFIG: {
        LOADING_TIMEOUT: 10000,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000
    },
    ERROR_TYPES: {
        LOADING_FAILED: 'loading_failed',
        NETWORK_ERROR: 'network_error'
    }
}));

describe('MusicTrackManager', () => {
    let mockAudioContext;
    let trackManager;
    let mockTracks;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock audio context
        mockAudioContext = {
            createGain: jest.fn(() => ({
                gain: { value: 1.0 },
                connect: jest.fn(),
                disconnect: jest.fn()
            })),
            createBufferSource: jest.fn(),
            currentTime: 0
        };

        // Mock track instances
        mockTracks = {
            'ambient-space': {
                getId: () => 'ambient-space',
                getName: () => 'Ambient Space',
                getEnergyLevel: () => 'ambient',
                getDuration: () => 120,
                isLoaded: jest.fn(() => false),
                isLoading: jest.fn(() => false),
                hasError: jest.fn(() => false),
                getLoadingState: jest.fn(() => 'not_loaded'),
                getError: jest.fn(() => null),
                setAudioContext: jest.fn(),
                load: jest.fn(() => Promise.resolve()),
                preload: jest.fn(() => Promise.resolve()),
                cleanup: jest.fn(),
                metadata: { preload: true }
            },
            'cyber-pulse': {
                getId: () => 'cyber-pulse',
                getName: () => 'Cyber Pulse',
                getEnergyLevel: () => 'upbeat',
                getDuration: () => 180,
                isLoaded: jest.fn(() => false),
                isLoading: jest.fn(() => false),
                hasError: jest.fn(() => false),
                getLoadingState: jest.fn(() => 'not_loaded'),
                getError: jest.fn(() => null),
                setAudioContext: jest.fn(),
                load: jest.fn(() => Promise.resolve()),
                preload: jest.fn(() => Promise.resolve()),
                cleanup: jest.fn(),
                metadata: { preload: true }
            },
            'none': {
                getId: () => 'none',
                getName: () => 'No Music',
                getEnergyLevel: () => null,
                getDuration: () => null,
                isLoaded: jest.fn(() => true),
                isLoading: jest.fn(() => false),
                hasError: jest.fn(() => false),
                getLoadingState: jest.fn(() => 'loaded'),
                getError: jest.fn(() => null),
                setAudioContext: jest.fn(),
                load: jest.fn(() => Promise.resolve()),
                preload: jest.fn(() => Promise.resolve()),
                cleanup: jest.fn(),
                metadata: { preload: false }
            }
        };

        // Mock MusicTrack constructor
        MusicTrack.mockImplementation((id, url, metadata) => {
            return mockTracks[id] || {
                getId: () => id,
                setAudioContext: jest.fn(),
                load: jest.fn(() => Promise.resolve()),
                preload: jest.fn(() => Promise.resolve()),
                cleanup: jest.fn(),
                metadata: metadata || {}
            };
        });

        trackManager = new MusicTrackManager(mockAudioContext);
    });

    describe('initialization', () => {
        it('should initialize with all configured tracks', () => {
            expect(trackManager.getTrackIds()).toEqual(['ambient-space', 'cyber-pulse', 'none']);
            expect(trackManager.getAllTracks()).toHaveLength(3);
        });

        it('should set audio context for all tracks', () => {
            expect(mockTracks['ambient-space'].setAudioContext).toHaveBeenCalledWith(mockAudioContext);
            expect(mockTracks['cyber-pulse'].setAudioContext).toHaveBeenCalledWith(mockAudioContext);
            expect(mockTracks['none'].setAudioContext).toHaveBeenCalledWith(mockAudioContext);
        });
    });

    describe('track access', () => {
        it('should get track by ID', () => {
            const track = trackManager.getTrack('ambient-space');
            expect(track).toBe(mockTracks['ambient-space']);
        });

        it('should return null for non-existent track', () => {
            const track = trackManager.getTrack('non-existent');
            expect(track).toBeNull();
        });

        it('should check if track exists', () => {
            expect(trackManager.hasTrack('ambient-space')).toBe(true);
            expect(trackManager.hasTrack('non-existent')).toBe(false);
        });

        it('should get tracks by energy level', () => {
            const ambientTracks = trackManager.getTracksByEnergyLevel('ambient');
            expect(ambientTracks).toHaveLength(1);
            expect(ambientTracks[0].getId()).toBe('ambient-space');
        });
    });

    describe('track loading', () => {
        it('should load a specific track', async () => {
            await trackManager.loadTrack('ambient-space');
            expect(mockTracks['ambient-space'].load).toHaveBeenCalled();
        });

        it('should throw error for non-existent track', async () => {
            await expect(trackManager.loadTrack('non-existent')).rejects.toThrow('Track not found: non-existent');
        });

        it('should handle loading errors', async () => {
            const error = new Error('Loading failed');
            mockTracks['ambient-space'].load.mockRejectedValue(error);

            await expect(trackManager.loadTrack('ambient-space')).rejects.toThrow('Loading failed');
        });
    });

    describe('preloading', () => {
        it('should preload all preloadable tracks', async () => {
            const result = await trackManager.preloadTracks();
            
            expect(mockTracks['ambient-space'].preload).toHaveBeenCalled();
            expect(mockTracks['cyber-pulse'].preload).toHaveBeenCalled();
            expect(mockTracks['none'].preload).not.toHaveBeenCalled(); // preload: false
            
            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(0);
        });

        it('should preload specific tracks', async () => {
            const result = await trackManager.preloadTracks(['ambient-space']);
            
            expect(mockTracks['ambient-space'].preload).toHaveBeenCalled();
            expect(mockTracks['cyber-pulse'].preload).not.toHaveBeenCalled();
            
            expect(result.total).toBe(1);
        });

        it('should handle preload failures gracefully', async () => {
            const error = new Error('Preload failed');
            mockTracks['ambient-space'].preload.mockRejectedValue(error);
            
            const result = await trackManager.preloadTracks();
            
            expect(result.successful).toBe(2); // Both succeed because failures are handled gracefully
            expect(result.failed).toBe(0); // Failures are caught and handled
        });

        it('should not start new preload if already in progress', async () => {
            const firstPreload = trackManager.preloadTracks();
            const secondPreload = trackManager.preloadTracks();
            
            const result1 = await firstPreload;
            const result2 = await secondPreload;
            
            // Both should return results (second returns existing promises)
            expect(result1.total).toBeGreaterThan(0);
            expect(Array.isArray(result2)).toBe(true); // Second call returns Promise.allSettled results
        });
    });

    describe('track status', () => {
        it('should check if track is loaded', () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(true);
            expect(trackManager.isTrackLoaded('ambient-space')).toBe(true);
            expect(trackManager.isTrackLoaded('non-existent')).toBe(false);
        });

        it('should check if track is loading', () => {
            mockTracks['ambient-space'].isLoading.mockReturnValue(true);
            expect(trackManager.isTrackLoading('ambient-space')).toBe(true);
        });

        it('should check if track has error', () => {
            mockTracks['ambient-space'].hasError.mockReturnValue(true);
            expect(trackManager.hasTrackError('ambient-space')).toBe(true);
        });

        it('should get loading status for all tracks', () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(true);
            mockTracks['cyber-pulse'].hasError.mockReturnValue(true);
            mockTracks['cyber-pulse'].getError.mockReturnValue('Network error');
            
            const status = trackManager.getLoadingStatus();
            
            expect(status['ambient-space'].loaded).toBe(true);
            expect(status['cyber-pulse'].error).toBe(true);
            expect(status['cyber-pulse'].errorMessage).toBe('Network error');
        });
    });

    describe('track metadata', () => {
        it('should get track metadata for UI', () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(true);
            mockTracks['cyber-pulse'].hasError.mockReturnValue(true);
            
            const metadata = trackManager.getTrackMetadata();
            
            expect(metadata).toHaveLength(3);
            expect(metadata[0]).toMatchObject({
                id: 'ambient-space',
                name: 'Ambient Space',
                energyLevel: 'ambient',
                loaded: true
            });
            expect(metadata[1]).toMatchObject({
                id: 'cyber-pulse',
                error: true
            });
        });
    });

    describe('ensure track loaded', () => {
        it('should load track if not loaded', async () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(false);
            mockTracks['ambient-space'].isLoading.mockReturnValue(false);
            
            const track = await trackManager.ensureTrackLoaded('ambient-space');
            
            expect(mockTracks['ambient-space'].load).toHaveBeenCalled();
            expect(track).toBe(mockTracks['ambient-space']);
        });

        it('should wait for loading track', async () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(false);
            mockTracks['ambient-space'].isLoading.mockReturnValue(true);
            
            const track = await trackManager.ensureTrackLoaded('ambient-space');
            
            expect(mockTracks['ambient-space'].load).toHaveBeenCalled();
            expect(track).toBe(mockTracks['ambient-space']);
        });

        it('should return loaded track immediately', async () => {
            mockTracks['ambient-space'].isLoaded.mockReturnValue(true);
            
            const track = await trackManager.ensureTrackLoaded('ambient-space');
            
            expect(mockTracks['ambient-space'].load).not.toHaveBeenCalled();
            expect(track).toBe(mockTracks['ambient-space']);
        });

        it('should handle "none" track', async () => {
            const track = await trackManager.ensureTrackLoaded('none');
            expect(track).toBe(mockTracks['none']);
        });

        it('should throw error for failed track', async () => {
            mockTracks['ambient-space'].hasError.mockReturnValue(true);
            mockTracks['ambient-space'].getError.mockReturnValue('Load failed');
            
            await expect(trackManager.ensureTrackLoaded('ambient-space')).rejects.toThrow('Track ambient-space failed to load: Load failed');
        });
    });

    describe('retry functionality', () => {
        it('should retry failed tracks', async () => {
            mockTracks['ambient-space'].hasError.mockReturnValue(true);
            mockTracks['cyber-pulse'].hasError.mockReturnValue(true);
            
            const result = await trackManager.retryFailedTracks();
            
            expect(mockTracks['ambient-space'].cleanup).toHaveBeenCalled();
            expect(mockTracks['ambient-space'].setAudioContext).toHaveBeenCalledWith(mockAudioContext);
            expect(mockTracks['ambient-space'].load).toHaveBeenCalled();
            
            expect(result.total).toBe(2);
        });

        it('should retry specific tracks', async () => {
            const result = await trackManager.retryFailedTracks(['ambient-space']);
            
            expect(mockTracks['ambient-space'].cleanup).toHaveBeenCalled();
            expect(mockTracks['ambient-space'].load).toHaveBeenCalled();
            expect(mockTracks['cyber-pulse'].load).not.toHaveBeenCalled();
            
            expect(result.total).toBe(1);
        });

        it('should handle no failed tracks', async () => {
            const result = await trackManager.retryFailedTracks();
            
            expect(result.total).toBe(0);
            expect(result.successful).toBe(0);
            expect(result.failed).toBe(0);
        });
    });

    describe('cleanup', () => {
        it('should clean up all resources', () => {
            trackManager.cleanup();
            
            expect(mockTracks['ambient-space'].cleanup).toHaveBeenCalled();
            expect(mockTracks['cyber-pulse'].cleanup).toHaveBeenCalled();
            expect(mockTracks['none'].cleanup).toHaveBeenCalled();
        });
    });

    describe('audio context update', () => {
        it('should update audio context for all tracks', () => {
            const newAudioContext = { createGain: jest.fn() };
            
            trackManager.updateAudioContext(newAudioContext);
            
            expect(mockTracks['ambient-space'].setAudioContext).toHaveBeenCalledWith(newAudioContext);
            expect(mockTracks['cyber-pulse'].setAudioContext).toHaveBeenCalledWith(newAudioContext);
            expect(mockTracks['none'].setAudioContext).toHaveBeenCalledWith(newAudioContext);
        });
    });
});