/**
 * MusicPlayer Tests
 * Tests for the MusicPlayer class functionality including playback controls,
 * fade transitions, and audio ducking integration
 */

const { MusicPlayer } = require('@/audio/MusicPlayer.js');
const { MusicSettings } = require('@/audio/MusicSettings.js');
const { AudioManager } = require('@/audio/audio.js');

// Mock Web Audio API
const mockAudioContext = {
    createGain: jest.fn(() => ({
        gain: {
            value: 0.7,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            cancelScheduledValues: jest.fn()
        },
        connect: jest.fn(),
        disconnect: jest.fn()
    })),
    createBufferSource: jest.fn(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
    })),
    destination: {},
    currentTime: 0,
    state: 'running'
};

// Mock AudioManager
const mockAudioManager = {
    audioContext: mockAudioContext,
    isInitialized: true,
    isMuted: false
};

// Mock MusicTrack
const mockTrack = {
    getId: () => 'ambient-space',
    getName: () => 'Ambient Space',
    getEnergyLevel: () => 'ambient',
    getDuration: () => 120,
    isLoaded: () => true,
    getLoadingState: () => 'loaded',
    shouldLoop: () => true,
    createSource: jest.fn(() => mockAudioContext.createBufferSource()),
    setAudioContext: jest.fn(),
    preload: jest.fn().mockResolvedValue(),
    cleanup: jest.fn()
};

// Mock "none" track
const mockNoneTrack = {
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
    cleanup: jest.fn()
};

describe('MusicPlayer', () => {
    let musicPlayer;
    let mockSettings;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock settings
        mockSettings = new MusicSettings();
        jest.spyOn(mockSettings, 'getMusicVolume').mockReturnValue(0.7);
        jest.spyOn(mockSettings, 'getSelectedTrack').mockReturnValue('ambient-space');
        jest.spyOn(mockSettings, 'getFadeInDuration').mockReturnValue(0.5);
        jest.spyOn(mockSettings, 'getFadeOutDuration').mockReturnValue(0.5);
        jest.spyOn(mockSettings, 'getDuckingLevel').mockReturnValue(0.3);
        jest.spyOn(mockSettings, 'getDuckingDuration').mockReturnValue(0.2);
        jest.spyOn(mockSettings, 'setSelectedTrack').mockReturnValue(true);
        jest.spyOn(mockSettings, 'setMusicVolume').mockReturnValue(true);
        
        // Create music player
        musicPlayer = new MusicPlayer(mockAudioManager, mockSettings);
        
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
            const result = await musicPlayer.initialize(mockAudioContext);
            
            expect(result).toBe(true);
            expect(musicPlayer.isInitialized).toBe(true);
            expect(musicPlayer.audioContext).toBe(mockAudioContext);
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });
        
        it('should not reinitialize if already initialized', async () => {
            await musicPlayer.initialize(mockAudioContext);
            const createGainCallCount = mockAudioContext.createGain.mock.calls.length;
            
            const result = await musicPlayer.initialize(mockAudioContext);
            
            expect(result).toBe(true);
            expect(mockAudioContext.createGain).toHaveBeenCalledTimes(createGainCallCount);
        });
        
        it('should handle initialization errors gracefully', async () => {
            const errorContext = {
                ...mockAudioContext,
                createGain: jest.fn(() => { throw new Error('Audio context error'); })
            };
            
            const result = await musicPlayer.initialize(errorContext);
            
            expect(result).toBe(false);
            expect(musicPlayer.isInitialized).toBe(false);
        });
    });
    
    describe('Basic Playback Controls', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });
        
        it('should play selected track successfully', () => {
            const result = musicPlayer.play();
            
            expect(result).toBe(true);
            expect(musicPlayer.isPlaying()).toBe(true);
            expect(musicPlayer.getPlaybackState()).toBe('playing');
            expect(mockTrack.createSource).toHaveBeenCalled();
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
            musicPlayer.play();
            
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
            const mockGainNode = musicPlayer.masterGainNode;
            
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
            jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);
            
            const result = await musicPlayer.onGamePause();
            
            expect(result).toBe(true);
            expect(musicPlayer.fadeOut).toHaveBeenCalledWith(0.5);
        });
        
        it('should handle game resume event', async () => {
            jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);
            
            const result = await musicPlayer.onGameResume();
            
            expect(result).toBe(true);
            expect(musicPlayer.fadeIn).toHaveBeenCalledWith(0.5);
        });
        
        it('should handle game end event', async () => {
            jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);
            
            const result = await musicPlayer.onGameEnd();
            
            expect(result).toBe(true);
            expect(musicPlayer.fadeOut).toHaveBeenCalledWith(1.0);
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
            jest.spyOn(musicPlayer.bufferManager, 'optimizeLoadingStrategy').mockImplementation(() => {
                throw new Error('Optimization failed');
            });
            
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
                duration: 0.5
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
        
        it('should attempt retry on recoverable errors', (done) => {
            jest.spyOn(musicPlayer, 'play');
            
            // Mock error handler to return retry action
            jest.spyOn(musicPlayer.errorHandler, 'handlePlaybackError').mockReturnValue({
                action: 'pause_and_retry',
                canRetry: true,
                retryDelay: 100
            });
            
            musicPlayer._handleError(new Error('Recoverable error'), 'test');
            
            setTimeout(() => {
                expect(musicPlayer.play).toHaveBeenCalled();
                done();
            }, 150);
        });
        
        it('should stop playback on critical errors', () => {
            jest.spyOn(musicPlayer, 'stop');
            
            // Mock error handler to return stop action
            jest.spyOn(musicPlayer.errorHandler, 'handlePlaybackError').mockReturnValue({
                action: 'stop_playback'
            });
            
            musicPlayer._handleError(new Error('Critical error'), 'test');
            
            expect(musicPlayer.stop).toHaveBeenCalled();
        });
    });
    
    describe('Background Loading', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });
        
        it('should start background loading for non-priority tracks', () => {
            jest.spyOn(global, 'setTimeout');
            
            const trackConfigs = [
                { id: 'track1', url: 'track1.mp3' },
                { id: 'track2', url: 'track2.mp3' }
            ];
            
            musicPlayer._startBackgroundLoading(trackConfigs);
            
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
        });
        
        it('should handle background loading errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock loading optimizer to throw error
            jest.spyOn(musicPlayer.loadingOptimizer, 'progressiveLoad').mockRejectedValue(
                new Error('Background loading failed')
            );
            
            const trackConfigs = [{ id: 'track1', url: 'track1.mp3' }];
            musicPlayer._startBackgroundLoading(trackConfigs);
            
            // Wait for background loading to complete
            await new Promise(resolve => setTimeout(resolve, 150));
            
            expect(consoleSpy).toHaveBeenCalledWith('Background loading error:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('Cleanup', () => {
        beforeEach(async () => {
            await musicPlayer.initialize(mockAudioContext);
        });
        
        it('should cleanup resources properly', () => {
            musicPlayer.play();
            
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
            musicPlayer.tracks.forEach(track => {
                track.cleanup = mockTrackCleanup;
            });
            
            musicPlayer.cleanup();
            
            expect(mockTrackCleanup).toHaveBeenCalled();
        });
    });
});