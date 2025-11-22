/**
 * Tests for MusicTrack class
 * Verifies audio loading, metadata management, and track functionality
 */

const { MusicTrack } = require('@/audio/MusicTrack.js');

// Mock Web Audio API for testing
const mockAudioContext = {
    createBufferSource: jest.fn(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
    })),
    decodeAudioData: jest.fn()
};

// Mock fetch for testing
global.fetch = jest.fn();

describe('MusicTrack', () => {
    let musicTrack;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset fetch mock
        fetch.mockClear();
        
        // Reset audio context mock
        mockAudioContext.decodeAudioData.mockClear();
        mockAudioContext.createBufferSource.mockClear();
    });
    
    describe('constructor', () => {
        it('should create a track with basic properties', () => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
            
            expect(musicTrack.getId()).toBe('test-track');
            expect(musicTrack.url).toBe('test.mp3');
            expect(musicTrack.getLoadingState()).toBe('not_loaded');
            expect(musicTrack.isLoaded()).toBe(false);
        });
        
        it('should create a track with custom metadata', () => {
            const metadata = {
                name: 'Test Song',
                energyLevel: 'upbeat',
                duration: 120,
                loop: false,
                preload: false
            };
            
            musicTrack = new MusicTrack('test-track', 'test.mp3', metadata);
            
            expect(musicTrack.getName()).toBe('Test Song');
            expect(musicTrack.getEnergyLevel()).toBe('upbeat');
            expect(musicTrack.getDuration()).toBe(120);
            expect(musicTrack.shouldLoop()).toBe(false);
        });
        
        it('should use default metadata values', () => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
            
            expect(musicTrack.getName()).toBe('test-track');
            expect(musicTrack.getEnergyLevel()).toBe('ambient');
            expect(musicTrack.shouldLoop()).toBe(true);
            expect(musicTrack.metadata.preload).toBe(true);
        });
    });
    
    describe('audio context management', () => {
        beforeEach(() => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
        });
        
        it('should set audio context', () => {
            musicTrack.setAudioContext(mockAudioContext);
            expect(musicTrack.audioContext).toBe(mockAudioContext);
        });
        
        it('should create audio source when context is available', () => {
            const mockBuffer = { duration: 60 };
            musicTrack.setAudioContext(mockAudioContext);
            musicTrack.audioBuffer = mockBuffer;
            
            const source = musicTrack.createSource();
            
            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
            expect(source).toBeTruthy();
        });
        
        it('should return null when creating source without context', () => {
            const source = musicTrack.createSource();
            expect(source).toBeNull();
        });
    });
    
    describe('loading functionality', () => {
        beforeEach(() => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
            musicTrack.setAudioContext(mockAudioContext);
        });
        
        it('should handle "none" track without loading', async () => {
            const noneTrack = new MusicTrack('none', null);
            
            await noneTrack.load();
            
            expect(noneTrack.isLoaded()).toBe(true);
            expect(fetch).not.toHaveBeenCalled();
        });
        
        it('should return immediately if already loaded', async () => {
            musicTrack.loadingState = 'loaded';
            
            await musicTrack.load();
            
            expect(fetch).not.toHaveBeenCalled();
        });
        
        it('should handle successful loading', async () => {
            const mockArrayBuffer = new ArrayBuffer(1024);
            const mockAudioBuffer = { duration: 60, numberOfChannels: 2 };
            
            fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockArrayBuffer)
            });
            
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            await musicTrack.load();
            
            expect(fetch).toHaveBeenCalledWith('test.mp3', expect.objectContaining({
                signal: expect.any(Object)
            }));
            expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
            expect(musicTrack.isLoaded()).toBe(true);
            expect(musicTrack.getAudioBuffer()).toBe(mockAudioBuffer);
            expect(musicTrack.getDuration()).toBe(60);
        });
        
        it('should handle network errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            await expect(musicTrack.load()).rejects.toThrow();
            expect(musicTrack.hasError()).toBe(true);
            expect(musicTrack.getError()).toContain('HTTP 404');
        });
        
        it('should handle decode errors', async () => {
            const mockArrayBuffer = new ArrayBuffer(1024);
            
            fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockArrayBuffer)
            });
            
            mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Decode failed'));
            
            await expect(musicTrack.load()).rejects.toThrow();
            expect(musicTrack.hasError()).toBe(true);
        });
        
        it('should handle loading without audio context', async () => {
            musicTrack.audioContext = null;
            
            await expect(musicTrack.load()).rejects.toThrow('Audio context not set');
        });
    });
    
    describe('preload functionality', () => {
        it('should preload when preload is enabled', async () => {
            musicTrack = new MusicTrack('test-track', 'test.mp3', { preload: true });
            musicTrack.setAudioContext(mockAudioContext);
            
            const mockArrayBuffer = new ArrayBuffer(1024);
            const mockAudioBuffer = { duration: 60 };
            
            fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockArrayBuffer)
            });
            
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            await musicTrack.preload();
            
            expect(musicTrack.isLoaded()).toBe(true);
        });
        
        it('should skip preload when preload is disabled', async () => {
            musicTrack = new MusicTrack('test-track', 'test.mp3', { preload: false });
            
            await musicTrack.preload();
            
            expect(fetch).not.toHaveBeenCalled();
            expect(musicTrack.isLoaded()).toBe(false);
        });
    });
    
    describe('state management', () => {
        beforeEach(() => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
        });
        
        it('should track loading state correctly', () => {
            expect(musicTrack.getLoadingState()).toBe('not_loaded');
            expect(musicTrack.isLoaded()).toBe(false);
            expect(musicTrack.isLoading()).toBe(false);
            expect(musicTrack.hasError()).toBe(false);
        });
        
        it('should update state during loading', () => {
            musicTrack.loadingState = 'loading';
            
            expect(musicTrack.isLoading()).toBe(true);
            expect(musicTrack.isLoaded()).toBe(false);
        });
        
        it('should handle error state', () => {
            musicTrack.loadingState = 'error';
            musicTrack.error = 'Test error';
            
            expect(musicTrack.hasError()).toBe(true);
            expect(musicTrack.getError()).toBe('Test error');
        });
    });
    
    describe('metadata access', () => {
        beforeEach(() => {
            const metadata = {
                name: 'Test Song',
                energyLevel: 'intense',
                duration: 180,
                loop: false
            };
            musicTrack = new MusicTrack('test-track', 'test.mp3', metadata);
        });
        
        it('should provide access to all metadata', () => {
            const metadata = musicTrack.getMetadata();
            
            expect(metadata.id).toBe('test-track');
            expect(metadata.name).toBe('Test Song');
            expect(metadata.energyLevel).toBe('intense');
            expect(metadata.duration).toBe(180);
            expect(metadata.loop).toBe(false);
            expect(metadata.url).toBe('test.mp3');
            expect(metadata.loadingState).toBe('not_loaded');
        });
    });
    
    describe('cleanup', () => {
        beforeEach(() => {
            musicTrack = new MusicTrack('test-track', 'test.mp3');
            musicTrack.setAudioContext(mockAudioContext);
            musicTrack.audioBuffer = { duration: 60 };
            musicTrack.loadingState = 'loaded';
        });
        
        it('should clean up resources', () => {
            musicTrack.cleanup();
            
            expect(musicTrack.audioBuffer).toBeNull();
            expect(musicTrack.audioContext).toBeNull();
            expect(musicTrack.getLoadingState()).toBe('not_loaded');
            expect(musicTrack.getError()).toBeNull();
        });
    });
});