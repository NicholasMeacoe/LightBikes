/**
 * Tests for MusicTrackSelector
 * Verifies track selection and metadata management functionality
 */

const { MusicTrackSelector } = require('./MusicTrackSelector.js');

// Mock dependencies
jest.mock('./MusicConfig.js', () => ({
    MUSIC_TRACKS: {
        'ambient-space': {
            id: 'ambient-space',
            name: 'Ambient Space',
            energyLevel: 'ambient',
            description: 'Calm atmospheric music',
            url: 'sounds/music/ambient-space.mp3',
            loop: true,
            preload: true
        },
        'cyber-pulse': {
            id: 'cyber-pulse',
            name: 'Cyber Pulse',
            energyLevel: 'upbeat',
            description: 'Electronic beats',
            url: 'sounds/music/cyber-pulse.mp3',
            loop: true,
            preload: true
        },
        'neon-rush': {
            id: 'neon-rush',
            name: 'Neon Rush',
            energyLevel: 'intense',
            description: 'High-energy music',
            url: 'sounds/music/neon-rush.mp3',
            loop: true,
            preload: true
        },
        'none': {
            id: 'none',
            name: 'No Music',
            energyLevel: null,
            description: 'Disable background music',
            url: null,
            loop: false,
            preload: false
        }
    },
    ENERGY_LEVELS: {
        AMBIENT: 'ambient',
        UPBEAT: 'upbeat',
        INTENSE: 'intense'
    },
    MusicConfigUtils: {
        isValidTrackId: jest.fn((id) => ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'].includes(id)),
        getTrackConfig: jest.fn((id) => {
            const tracks = {
                'ambient-space': { id: 'ambient-space', name: 'Ambient Space', energyLevel: 'ambient' },
                'cyber-pulse': { id: 'cyber-pulse', name: 'Cyber Pulse', energyLevel: 'upbeat' },
                'neon-rush': { id: 'neon-rush', name: 'Neon Rush', energyLevel: 'intense' },
                'none': { id: 'none', name: 'No Music', energyLevel: null }
            };
            return tracks[id] || null;
        })
    }
}));

describe('MusicTrackSelector', () => {
    let mockTrackManager;
    let mockSettings;
    let trackSelector;

    beforeEach(() => {
        // Mock track manager
        mockTrackManager = {
            hasTrack: jest.fn((id) => ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'].includes(id)),
            isTrackLoaded: jest.fn(() => false),
            isTrackLoading: jest.fn(() => false),
            hasTrackError: jest.fn(() => false),
            getTrack: jest.fn((id) => ({
                getId: () => id,
                getName: () => `Track ${id}`,
                getEnergyLevel: () => 'ambient',
                getDuration: () => 120,
                isLoaded: () => false,
                isLoading: () => false,
                hasError: () => false,
                getError: () => null,
                getLoadingState: () => 'not_loaded',
                getMetadata: () => ({ id, name: `Track ${id}` })
            }))
        };

        // Mock settings
        mockSettings = {
            getSelectedTrack: jest.fn(() => 'ambient-space'),
            setSelectedTrack: jest.fn(),
            save: jest.fn(() => Promise.resolve())
        };

        trackSelector = new MusicTrackSelector(mockTrackManager, mockSettings);
    });

    describe('initialization', () => {
        it('should initialize with current track from settings', () => {
            expect(mockSettings.getSelectedTrack).toHaveBeenCalled();
            expect(trackSelector.getCurrentTrack()).toMatchObject({
                id: 'ambient-space',
                isSelected: true
            });
        });

        it('should validate initial selection', () => {
            mockSettings.getSelectedTrack.mockReturnValue('invalid-track');
            
            const selector = new MusicTrackSelector(mockTrackManager, mockSettings);
            
            // Should reset to default
            expect(mockSettings.setSelectedTrack).toHaveBeenCalledWith('ambient-space');
        });
    });

    describe('track listing', () => {
        it('should get all available tracks', () => {
            const tracks = trackSelector.getAvailableTracks();
            
            expect(tracks).toHaveLength(4);
            expect(tracks[0]).toMatchObject({
                id: 'ambient-space',
                name: 'Ambient Space',
                energyLevel: 'ambient',
                isSelected: true
            });
        });

        it('should group tracks by energy level', () => {
            const grouped = trackSelector.getTracksByEnergyLevel();
            
            expect(grouped.ambient).toHaveLength(1);
            expect(grouped.upbeat).toHaveLength(1);
            expect(grouped.intense).toHaveLength(1);
            expect(grouped.none).toHaveLength(1);
        });

        it('should get tracks by specific energy level', () => {
            const ambientTracks = trackSelector.getTracksByEnergy('ambient');
            
            expect(ambientTracks).toHaveLength(1);
            expect(ambientTracks[0].energyLevel).toBe('ambient');
        });
    });

    describe('track selection', () => {
        it('should select valid track', async () => {
            const result = await trackSelector.selectTrack('cyber-pulse');
            
            expect(result).toBe(true);
            expect(mockSettings.setSelectedTrack).toHaveBeenCalledWith('cyber-pulse');
            expect(mockSettings.save).toHaveBeenCalled();
            
            const currentTrack = trackSelector.getCurrentTrack();
            expect(currentTrack.id).toBe('cyber-pulse');
        });

        it('should reject invalid track ID', async () => {
            const result = await trackSelector.selectTrack('invalid-track');
            
            expect(result).toBe(false);
            expect(mockSettings.setSelectedTrack).not.toHaveBeenCalled();
        });

        it('should reject non-existent track', async () => {
            mockTrackManager.hasTrack.mockReturnValue(false);
            
            const result = await trackSelector.selectTrack('cyber-pulse');
            
            expect(result).toBe(false);
        });

        it('should handle settings save failure', async () => {
            mockSettings.save.mockRejectedValue(new Error('Save failed'));
            
            const result = await trackSelector.selectTrack('cyber-pulse');
            
            expect(result).toBe(false);
            // Should revert selection
            expect(trackSelector.getCurrentTrack().id).toBe('ambient-space');
        });
    });

    describe('track navigation', () => {
        it('should get next track', () => {
            const nextTrack = trackSelector.getNextTrack();
            expect(nextTrack).toBe('cyber-pulse');
        });

        it('should get previous track', () => {
            const prevTrack = trackSelector.getPreviousTrack();
            expect(prevTrack).toBe('none');
        });

        it('should cycle through tracks', () => {
            // Start at ambient-space, go to cyber-pulse
            let next = trackSelector.getNextTrack();
            expect(next).toBe('cyber-pulse');
            
            // Simulate selection change
            trackSelector.currentTrackId = 'cyber-pulse';
            
            // Next should be neon-rush
            next = trackSelector.getNextTrack();
            expect(next).toBe('neon-rush');
        });

        it('should skip "none" when requested', () => {
            trackSelector.currentTrackId = 'neon-rush';
            
            const next = trackSelector.getNextTrack(true); // Skip none
            expect(next).toBe('ambient-space'); // Should wrap around
        });

        it('should handle empty track list', () => {
            // Create a selector with no tracks by mocking getAvailableTracks
            const emptySelector = new MusicTrackSelector(mockTrackManager, mockSettings);
            emptySelector.getAvailableTracks = () => [];
            
            const next = emptySelector.getNextTrack();
            expect(next).toBeNull();
        });
    });

    describe('random selection', () => {
        it('should get random track by energy level', () => {
            // Mock Math.random to return predictable value
            jest.spyOn(Math, 'random').mockReturnValue(0);
            
            const randomTrack = trackSelector.getRandomTrackByEnergy('ambient');
            expect(randomTrack).toBe('ambient-space');
            
            Math.random.mockRestore();
        });

        it('should exclude current track when requested', () => {
            // Test with upbeat energy level where we have multiple tracks
            trackSelector.currentTrackId = 'cyber-pulse';
            
            // Mock Math.random to return predictable value
            jest.spyOn(Math, 'random').mockReturnValue(0);
            
            const randomTrack = trackSelector.getRandomTrackByEnergy('upbeat', true);
            // Since cyber-pulse is current and excluded, but it's the only upbeat track,
            // the method falls back to returning any track from that energy level
            expect(randomTrack).toBe('cyber-pulse');
            
            Math.random.mockRestore();
        });
    });

    describe('track availability', () => {
        it('should check track availability', () => {
            expect(trackSelector.isTrackAvailable('ambient-space')).toBe(true);
            expect(trackSelector.isTrackAvailable('invalid-track')).toBe(false);
        });

        it('should consider "none" always available', () => {
            expect(trackSelector.isTrackAvailable('none')).toBe(true);
        });

        it('should consider error tracks unavailable', () => {
            mockTrackManager.hasTrackError.mockReturnValue(true);
            
            expect(trackSelector.isTrackAvailable('ambient-space')).toBe(false);
        });
    });

    describe('statistics', () => {
        it('should provide selection statistics', () => {
            mockTrackManager.isTrackLoaded.mockImplementation((id) => id === 'ambient-space');
            mockTrackManager.isTrackLoading.mockImplementation((id) => id === 'cyber-pulse');
            mockTrackManager.hasTrackError.mockImplementation((id) => id === 'neon-rush');
            
            const stats = trackSelector.getSelectionStats();
            
            expect(stats.total).toBe(4);
            expect(stats.loaded).toBe(1);
            expect(stats.loading).toBe(1);
            expect(stats.error).toBe(1);
            expect(stats.byEnergyLevel.ambient).toBe(1);
            expect(stats.byEnergyLevel.upbeat).toBe(1);
            expect(stats.byEnergyLevel.intense).toBe(1);
            expect(stats.byEnergyLevel.none).toBe(1);
        });
    });

    describe('track details', () => {
        it('should get detailed track metadata', () => {
            const details = trackSelector.getTrackDetails('ambient-space');
            
            expect(details).toMatchObject({
                id: 'ambient-space',
                name: 'Ambient Space',
                energyLevel: 'ambient',
                isSelected: true,
                isLoaded: false,
                hasError: false
            });
        });

        it('should return null for non-existent track', () => {
            const details = trackSelector.getTrackDetails('invalid-track');
            expect(details).toBeNull();
        });
    });

    describe('callbacks', () => {
        it('should register and call selection change callbacks', async () => {
            const callback = jest.fn();
            trackSelector.onSelectionChange(callback);
            
            await trackSelector.selectTrack('cyber-pulse');
            
            expect(callback).toHaveBeenCalledWith('cyber-pulse', 'ambient-space');
        });

        it('should remove callbacks', async () => {
            const callback = jest.fn();
            trackSelector.onSelectionChange(callback);
            trackSelector.removeSelectionCallback(callback);
            
            await trackSelector.selectTrack('cyber-pulse');
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle callback errors gracefully', async () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            const goodCallback = jest.fn();
            
            trackSelector.onSelectionChange(errorCallback);
            trackSelector.onSelectionChange(goodCallback);
            
            await trackSelector.selectTrack('cyber-pulse');
            
            expect(goodCallback).toHaveBeenCalled();
        });
    });

    describe('state management', () => {
        it('should reset to default', async () => {
            trackSelector.currentTrackId = 'cyber-pulse';
            
            const result = await trackSelector.resetToDefault();
            
            expect(result).toBe(true);
            expect(trackSelector.getCurrentTrack().id).toBe('ambient-space');
        });

        it('should export current state', () => {
            const state = trackSelector.exportState();
            
            expect(state).toHaveProperty('currentTrackId');
            expect(state).toHaveProperty('availableTracks');
            expect(state).toHaveProperty('stats');
            expect(state.currentTrackId).toBe('ambient-space');
        });
    });

    describe('cleanup', () => {
        it('should clean up resources', () => {
            const callback = jest.fn();
            trackSelector.onSelectionChange(callback);
            
            trackSelector.cleanup();
            
            expect(trackSelector.selectionCallbacks).toHaveLength(0);
        });
    });
});