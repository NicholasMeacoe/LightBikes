/**
 * Integration Tests for Music System
 * Tests the interaction between MusicPlayer, AudioManager, and game systems
 */

const { MusicPlayer } = require('./MusicPlayer.js');
const { MusicSettings } = require('./MusicSettings.js');
const { AudioManager } = require('./audio.js');

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

// Mock game state
const mockGameState = {
    gameRunning: false,
    gamePaused: false,
    gameOver: false,
    player: { x: 0, y: 0, direction: 'right' },
    ai: { x: 10, y: 10, direction: 'left' }
};

// Mock Game class
class MockGame {
    constructor() {
        this.state = { ...mockGameState };
        this.eventListeners = {};
    }
    
    getGameState() {
        return this.state;
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
    
    triggerEvent(event, data = {}) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    startGame() {
        this.state.gameRunning = true;
        this.state.gamePaused = false;
        this.state.gameOver = false;
        this.triggerEvent('gameStart');
    }
    
    pauseGame() {
        this.state.gamePaused = true;
        this.triggerEvent('gamePause');
    }
    
    resumeGame() {
        this.state.gamePaused = false;
        this.triggerEvent('gameResume');
    }
    
    endGame() {
        this.state.gameRunning = false;
        this.state.gameOver = true;
        this.triggerEvent('gameEnd');
    }
    
    restartGame() {
        this.state = { ...mockGameState };
        this.triggerEvent('gameRestart');
        this.startGame();
    }
}

describe('Music System Integration Tests', () => {
    let audioManager;
    let musicPlayer;
    let musicSettings;
    let mockGame;
    
    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Create mock game
        mockGame = new MockGame();
        
        // Create audio manager
        audioManager = new AudioManager();
        audioManager.audioContext = mockAudioContext;
        audioManager.isInitialized = true;
        
        // Create music settings
        musicSettings = new MusicSettings();
        
        // Create music player
        musicPlayer = new MusicPlayer(audioManager, musicSettings);
        await musicPlayer.initialize(mockAudioContext);
        
        // Set up integration
        audioManager.musicPlayer = musicPlayer;
        audioManager.musicSettings = musicSettings;
        audioManager.musicInitialized = true;
    });
    
    afterEach(() => {
        if (musicPlayer) {
            musicPlayer.cleanup();
        }
        if (audioManager) {
            audioManager.cleanup();
        }
    });
    
    describe('AudioManager Integration', () => {
        it('should integrate music player with audio manager', () => {
            expect(audioManager.getMusicPlayer()).toBe(musicPlayer);
            expect(audioManager.getMusicSettings()).toBe(musicSettings);
            expect(audioManager.isMusicAvailable()).toBe(true);
        });
        
        it('should start music through audio manager', () => {
            jest.spyOn(musicPlayer, 'play').mockReturnValue(true);
            
            const result = audioManager.startMusic();
            
            expect(result).toBe(true);
            expect(musicPlayer.play).toHaveBeenCalled();
        });
        
        it('should stop music through audio manager', () => {
            jest.spyOn(musicPlayer, 'stop').mockReturnValue(true);
            
            const result = audioManager.stopMusic();
            
            expect(result).toBe(true);
            expect(musicPlayer.stop).toHaveBeenCalled();
        });
        
        it('should handle music volume through audio manager', () => {
            jest.spyOn(musicPlayer, 'setVolume').mockReturnValue(true);
            jest.spyOn(musicPlayer, 'getVolume').mockReturnValue(0.8);
            
            const setResult = audioManager.setMusicVolume(0.8);
            const getResult = audioManager.getMusicVolume();
            
            expect(setResult).toBe(true);
            expect(getResult).toBe(0.8);
            expect(musicPlayer.setVolume).toHaveBeenCalledWith(0.8);
        });
        
        it('should handle track selection through audio manager', () => {
            jest.spyOn(musicPlayer, 'setTrack').mockReturnValue(true);
            jest.spyOn(musicPlayer, 'getAvailableTracks').mockReturnValue([
                { id: 'ambient-space', name: 'Ambient Space' }
            ]);
            
            const setResult = audioManager.setMusicTrack('ambient-space');
            const tracksResult = audioManager.getAvailableMusicTracks();
            
            expect(setResult).toBe(true);
            expect(tracksResult).toHaveLength(1);
            expect(musicPlayer.setTrack).toHaveBeenCalledWith('ambient-space');
        });
        
        it('should handle fade operations through audio manager', async () => {
            jest.spyOn(musicPlayer, 'fadeIn').mockResolvedValue(true);
            jest.spyOn(musicPlayer, 'fadeOut').mockResolvedValue(true);
            
            const fadeInResult = await audioManager.fadeMusicIn(0.5);
            const fadeOutResult = await audioManager.fadeMusicOut(1.0);
            
            expect(fadeInResult).toBe(true);
            expect(fadeOutResult).toBe(true);
            expect(musicPlayer.fadeIn).toHaveBeenCalledWith(0.5);
            expect(musicPlayer.fadeOut).toHaveBeenCalledWith(1.0);
        });
        
        it('should handle music ducking for sound effects', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);
            
            const result = audioManager.duckMusicForSoundEffect('explosion');
            
            expect(result).toBe(true);
            expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('explosion');
        });
    });
    
    describe('Game Lifecycle Integration', () => {
        beforeEach(() => {
            // Set up game event listeners
            mockGame.addEventListener('gameStart', () => audioManager.handleGameStart());
            mockGame.addEventListener('gamePause', () => audioManager.handleGamePause());
            mockGame.addEventListener('gameResume', () => audioManager.handleGameResume());
            mockGame.addEventListener('gameEnd', () => audioManager.handleGameEnd());
            mockGame.addEventListener('gameRestart', () => audioManager.handleGameRestart());
        });
        
        it('should start music when game starts', async () => {
            jest.spyOn(musicPlayer, 'onGameStart').mockResolvedValue(true);
            
            mockGame.startGame();
            
            expect(musicPlayer.onGameStart).toHaveBeenCalled();
        });
        
        it('should pause music when game pauses', async () => {
            jest.spyOn(musicPlayer, 'onGamePause').mockResolvedValue(true);
            
            mockGame.startGame();
            mockGame.pauseGame();
            
            expect(musicPlayer.onGamePause).toHaveBeenCalled();
        });
        
        it('should resume music when game resumes', async () => {
            jest.spyOn(musicPlayer, 'onGameResume').mockResolvedValue(true);
            
            mockGame.startGame();
            mockGame.pauseGame();
            mockGame.resumeGame();
            
            expect(musicPlayer.onGameResume).toHaveBeenCalled();
        });
        
        it('should stop music when game ends', async () => {
            jest.spyOn(musicPlayer, 'onGameEnd').mockResolvedValue(true);
            
            mockGame.startGame();
            mockGame.endGame();
            
            expect(musicPlayer.onGameEnd).toHaveBeenCalled();
        });
        
        it('should restart music when game restarts', async () => {
            jest.spyOn(musicPlayer, 'onGameRestart').mockResolvedValue(true);
            
            mockGame.startGame();
            mockGame.endGame();
            mockGame.restartGame();
            
            expect(musicPlayer.onGameRestart).toHaveBeenCalled();
        });
    });
    
    describe('Sound Effect Integration', () => {
        it('should duck music during explosion sounds', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);
            
            audioManager.playExplosionSound();
            
            expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('explosion');
        });
        
        it('should duck music during victory sounds', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);
            
            audioManager.playVictorySound();
            
            // Victory sound has a delay, so we need to wait
            setTimeout(() => {
                expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('victory');
            }, 600);
        });
        
        it('should duck music during defeat sounds', () => {
            jest.spyOn(musicPlayer, 'onSoundEffect').mockReturnValue(true);
            
            audioManager.playDefeatSound();
            
            // Defeat sound has a delay, so we need to wait
            setTimeout(() => {
                expect(musicPlayer.onSoundEffect).toHaveBeenCalledWith('defeat');
            }, 600);
        });
    });
    
    describe('Settings Persistence Integration', () => {
        it('should persist music settings across sessions', () => {
            const originalVolume = musicSettings.getMusicVolume();
            const originalTrack = musicSettings.getSelectedTrack();
            
            // Change settings
            musicSettings.setMusicVolume(0.9);
            musicSettings.setSelectedTrack('cyber-pulse');
            
            // Create new settings instance (simulates page reload)
            const newSettings = new MusicSettings();
            
            expect(newSettings.getMusicVolume()).toBe(0.9);
            expect(newSettings.getSelectedTrack()).toBe('cyber-pulse');
        });
        
        it('should apply settings changes immediately to music player', () => {
            jest.spyOn(musicPlayer, 'setVolume').mockReturnValue(true);
            jest.spyOn(musicPlayer, 'setTrack').mockReturnValue(true);
            
            musicSettings.setMusicVolume(0.6);
            musicPlayer.setVolume(musicSettings.getMusicVolume());
            
            musicSettings.setSelectedTrack('neon-rush');
            musicPlayer.setTrack(musicSettings.getSelectedTrack());
            
            expect(musicPlayer.setVolume).toHaveBeenCalledWith(0.6);
            expect(musicPlayer.setTrack).toHaveBeenCalledWith('neon-rush');
        });
    });
    
    describe('Error Handling Integration', () => {
        it('should handle music player errors gracefully', () => {
            jest.spyOn(musicPlayer, 'play').mockImplementation(() => {
                throw new Error('Playback failed');
            });
            
            const result = audioManager.startMusic();
            
            expect(result).toBe(false);
            // Should not throw error - graceful degradation
        });
        
        it('should continue game operation when music fails', () => {
            // Simulate music system failure
            audioManager.musicPlayer = null;
            audioManager.musicInitialized = false;
            
            // Game should still work
            expect(audioManager.isMusicAvailable()).toBe(false);
            expect(audioManager.startMusic()).toBe(false);
            expect(audioManager.stopMusic()).toBe(false);
            
            // Audio manager should still handle sound effects
            expect(() => audioManager.playExplosionSound()).not.toThrow();
        });
        
        it('should handle muted state correctly', () => {
            audioManager.setMuted(true);
            
            expect(audioManager.startMusic()).toBe(false);
            expect(audioManager.resumeMusic()).toBe(false);
            expect(audioManager.fadeMusicIn()).resolves.toBe(false);
        });
    });
    
    describe('Performance Integration', () => {
        it('should not impact game performance significantly', () => {
            const startTime = performance.now();
            
            // Simulate typical music operations
            musicPlayer.play();
            musicPlayer.setVolume(0.8);
            musicPlayer.duck(0.3);
            musicPlayer.unduck();
            musicPlayer.stop();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Music operations should complete quickly (under 10ms)
            expect(duration).toBeLessThan(10);
        });
        
        it('should clean up resources properly', () => {
            musicPlayer.play();
            
            const initialTrackCount = musicPlayer.tracks.size;
            expect(initialTrackCount).toBeGreaterThan(0);
            
            musicPlayer.cleanup();
            
            expect(musicPlayer.tracks.size).toBe(0);
            expect(musicPlayer.isInitialized).toBe(false);
            expect(musicPlayer.audioContext).toBeNull();
        });
    });
    
    describe('Cross-Browser Compatibility', () => {
        it('should handle missing Web Audio API gracefully', () => {
            const originalAudioContext = window.AudioContext;
            const originalWebkitAudioContext = window.webkitAudioContext;
            
            // Simulate browser without Web Audio API
            delete window.AudioContext;
            delete window.webkitAudioContext;
            
            const audioManagerNoWebAudio = new AudioManager();
            
            expect(() => audioManagerNoWebAudio.initialize()).not.toThrow();
            
            // Restore original values
            window.AudioContext = originalAudioContext;
            window.webkitAudioContext = originalWebkitAudioContext;
        });
        
        it('should handle autoplay policy restrictions', async () => {
            const mockRestrictedContext = {
                ...mockAudioContext,
                state: 'suspended',
                resume: jest.fn().mockRejectedValue(new Error('Autoplay blocked'))
            };
            
            const restrictedAudioManager = new AudioManager();
            restrictedAudioManager.audioContext = mockRestrictedContext;
            
            const result = await restrictedAudioManager.handleUserInteraction();
            
            expect(result).toBe(false);
            expect(mockRestrictedContext.resume).toHaveBeenCalled();
        });
    });
});