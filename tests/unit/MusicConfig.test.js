const {
    MUSIC_TRACKS,
    ENERGY_LEVELS,
    PLAYBACK_STATES,
    ERROR_TYPES,
    AUDIO_MIME_TYPES,
    MUSIC_SYSTEM_CONFIG,
    DUCKING_TRIGGERS,
    MusicConfigUtils,
} = require('../../src/audio/MusicConfig');

describe('MusicConfig', () => {
    describe('Constants Structure', () => {
        test('MUSIC_TRACKS should have required properties', () => {
            Object.values(MUSIC_TRACKS).forEach((track) => {
                expect(track).toHaveProperty('id');
                expect(track).toHaveProperty('name');
                expect(track).toHaveProperty('energyLevel');
                expect(track).toHaveProperty('loop');
                expect(track).toHaveProperty('preload');
            });
            expect(MUSIC_TRACKS['none']).toBeDefined();
        });

        test('ENERGY_LEVELS should be defined', () => {
            expect(ENERGY_LEVELS).toHaveProperty('AMBIENT');
            expect(ENERGY_LEVELS).toHaveProperty('UPBEAT');
            expect(ENERGY_LEVELS).toHaveProperty('INTENSE');
        });

        test('PLAYBACK_STATES should be defined', () => {
            expect(Object.keys(PLAYBACK_STATES).length).toBeGreaterThan(0);
            expect(PLAYBACK_STATES.PLAYING).toBe('playing');
        });

        test('MUSIC_SYSTEM_CONFIG should have defaults', () => {
            expect(MUSIC_SYSTEM_CONFIG.defaultVolume).toBeDefined();
            expect(MUSIC_SYSTEM_CONFIG.AUDIO_BUFFER_CLEANUP_INTERVAL).toBeDefined();
        });
    });

    describe('MusicConfigUtils', () => {
        test('isValidTrackId', () => {
            expect(MusicConfigUtils.isValidTrackId('cyber-pulse')).toBe(true);
            expect(MusicConfigUtils.isValidTrackId('invalid-track')).toBe(false);
            expect(MusicConfigUtils.isValidTrackId(null)).toBe(false);
        });

        test('getDuckingConfig', () => {
            expect(MusicConfigUtils.getDuckingConfig('explosion')).toBeDefined();
            expect(MusicConfigUtils.getDuckingConfig('unknown')).toBeNull();
        });

        test('getAvailableTrackIds', () => {
            const ids = MusicConfigUtils.getAvailableTrackIds();
            expect(ids).toContain('cyber-pulse');
            expect(ids).toContain('none');
        });

        test('getTrackConfig', () => {
            const config = MusicConfigUtils.getTrackConfig('cyber-pulse');
            expect(config.name).toBe('Cyber Pulse');
            expect(MusicConfigUtils.getTrackConfig('invalid')).toBeNull();
        });

        test('getTrackUrl', () => {
            expect(MusicConfigUtils.getTrackUrl('cyber-pulse')).toContain(
                'sounds/music/cyber-pulse.mp3'
            );
            // Assuming fallbackUrl is defined for cyber-pulse
            const track = MUSIC_TRACKS['cyber-pulse'];
            if (track.fallbackUrl) {
                expect(MusicConfigUtils.getTrackUrl('cyber-pulse', true)).toBe(track.fallbackUrl);
            }
            expect(MusicConfigUtils.getTrackUrl('invalid')).toBeNull();
        });

        test('hasFallback', () => {
            // Check specific knowledge of config
            if (MUSIC_TRACKS['cyber-pulse'].fallbackUrl) {
                expect(MusicConfigUtils.hasFallback('cyber-pulse')).toBe(true);
            }
            expect(MusicConfigUtils.hasFallback('none')).toBe(false); // none usually has null fallback
        });

        test('getDefaultConfig', () => {
            const defaults = MusicConfigUtils.getDefaultConfig();
            expect(defaults).toEqual(MUSIC_SYSTEM_CONFIG);
            // Ensure it's a copy
            defaults.newProp = true;
            expect(MUSIC_SYSTEM_CONFIG).not.toHaveProperty('newProp');
        });
    });
});
