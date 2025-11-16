/**
 * AudioManager Tests
 * Tests for audio initialization, preloading, and error handling
 */

const { AudioManager } = require('./audio.js');

// Mock Web Audio API
const mockAudioContext = {
    state: 'running',
    resume: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
    decodeAudioData: jest.fn()
};

const mockAudioBuffer = {
    duration: 1.0,
    numberOfChannels: 2,
    sampleRate: 44100
};

// Mock HTML5 Audio
const mockAudio = {
    preload: '',
    src: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};

describe('AudioManager', () => {
    let audioManager;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Mock Web Audio API
        global.AudioContext = jest.fn(() => mockAudioContext);
        global.webkitAudioContext = jest.fn(() => mockAudioContext);
        
        // Mock HTML5 Audio
        global.Audio = jest.fn(() => mockAudio);
        
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
        
        // Mock console methods to avoid test output noise
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        
        audioManager = new AudioManager();
    });
    
    afterEach(() => {
        // Restore console methods
        console.log.mockRestore();
        console.warn.mockRestore();
    });
    
    describe('initialization', () => {
        it('should initialize audio context on first call', async () => {
            // Mock successful audio buffer decoding
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            // Mock successful fetch responses
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
            });
            
            const result = await audioManager.initialize();
            
            expect(result).toBe(true);
            expect(audioManager.isInitialized).toBe(true);
            expect(global.AudioContext).toHaveBeenCalled();
        });
        
        it('should return true if already initialized', async () => {
            audioManager.isInitialized = true;
            
            const result = await audioManager.initialize();
            
            expect(result).toBe(true);
            expect(global.AudioContext).not.toHaveBeenCalled();
        });
        
        it('should resume suspended audio context', async () => {
            mockAudioContext.state = 'suspended';
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
            });
            
            await audioManager.initialize();
            
            expect(mockAudioContext.resume).toHaveBeenCalled();
        });
        
        it('should fallback to HTML5 Audio when Web Audio API not supported', async () => {
            // Remove Web Audio API support
            delete global.AudioContext;
            delete global.webkitAudioContext;
            
            // Mock HTML5 Audio events
            mockAudio.addEventListener.mockImplementation((event, callback) => {
                if (event === 'canplaythrough') {
                    setTimeout(callback, 0);
                }
            });
            
            const result = await audioManager.initialize();
            
            expect(result).toBe(true);
            expect(audioManager.isInitialized).toBe(true);
            expect(global.Audio).toHaveBeenCalled();
        });
        
        it('should handle initialization errors gracefully', async () => {
            // Mock AudioContext constructor to throw error
            global.AudioContext = jest.fn(() => {
                throw new Error('AudioContext creation failed');
            });
            
            const result = await audioManager.initialize();
            
            expect(result).toBe(false);
            expect(audioManager.isInitialized).toBe(false);
        });
    });
    
    describe('sound preloading', () => {
        beforeEach(() => {
            // Set up successful audio context
            audioManager.audioContext = mockAudioContext;
        });
        
        it('should preload all sound files successfully', async () => {
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
            });
            
            const result = await audioManager.preloadSounds();
            
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledTimes(8); // 8 sound files (including powerup_collect, shrink_warning, shrink_execute)
            expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(8);
            
            // Check that all sounds are loaded
            const soundNames = ['turn', 'engine', 'explosion', 'victory', 'defeat', 'powerup_collect', 'shrink_warning', 'shrink_execute'];
            soundNames.forEach(soundName => {
                expect(audioManager.sounds[soundName]).toBeDefined();
                expect(audioManager.sounds[soundName].loaded).toBe(true);
                expect(audioManager.sounds[soundName].type).toBe('webaudio');
            });
        });
        
        it('should handle individual sound loading failures', async () => {
            // Mock some sounds to fail (both MP3 and OGG)
            global.fetch.mockImplementation((url) => {
                if (url.includes('turn.mp3') || url.includes('turn.ogg')) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                    ok: true,
                    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
                });
            });
            
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            const result = await audioManager.preloadSounds();
            
            expect(result).toBe(false); // Not all sounds loaded
            expect(audioManager.sounds.turn.type).toBe('failed');
            expect(audioManager.sounds.engine.loaded).toBe(true);
        });
        
        it('should try fallback format when primary format fails', async () => {
            // Mock primary format to fail, fallback to succeed
            global.fetch.mockImplementation((url) => {
                if (url.includes('.mp3')) {
                    return Promise.reject(new Error('MP3 not supported'));
                }
                if (url.includes('.ogg')) {
                    return Promise.resolve({
                        ok: true,
                        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
                    });
                }
                return Promise.reject(new Error('Unknown format'));
            });
            
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            const result = await audioManager.preloadSounds();
            
            expect(result).toBe(true);
            // Should have tried both MP3 and OGG for each sound
            expect(global.fetch).toHaveBeenCalledWith('sounds/turn.mp3');
            expect(global.fetch).toHaveBeenCalledWith('sounds/turn.ogg');
        });
        
        it('should handle HTTP errors during fetch', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            const result = await audioManager.preloadSounds();
            
            expect(result).toBe(false);
            // All sounds should be marked as failed
            const soundNames = ['turn', 'engine', 'explosion', 'victory', 'defeat'];
            soundNames.forEach(soundName => {
                expect(audioManager.sounds[soundName].type).toBe('failed');
                expect(audioManager.sounds[soundName].loaded).toBe(false);
            });
        });
        
        it('should handle audio decoding errors', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
            });
            
            mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Invalid audio data'));
            
            const result = await audioManager.preloadSounds();
            
            expect(result).toBe(false);
            expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
        });
    });
    
    describe('HTML5 Audio fallback', () => {
        beforeEach(() => {
            // Remove Web Audio API support
            delete global.AudioContext;
            delete global.webkitAudioContext;
        });
        
        it('should initialize with HTML5 Audio when Web Audio API unavailable', async () => {
            mockAudio.addEventListener.mockImplementation((event, callback) => {
                if (event === 'canplaythrough') {
                    setTimeout(callback, 0);
                }
            });
            
            const result = await audioManager.initializeHTMLAudio();
            
            expect(result).toBe(true);
            expect(global.Audio).toHaveBeenCalledTimes(8); // 8 sound files (including powerup_collect, shrink_warning, shrink_execute)
            
            // Check that all sounds are set up as HTML5 Audio
            const soundNames = ['turn', 'engine', 'explosion', 'victory', 'defeat', 'powerup_collect', 'shrink_warning', 'shrink_execute'];
            soundNames.forEach(soundName => {
                expect(audioManager.sounds[soundName]).toBeDefined();
                expect(audioManager.sounds[soundName].type).toBe('html5');
                expect(audioManager.sounds[soundName].element).toBeDefined();
            });
        });
        
        it('should handle HTML5 Audio loading errors', async () => {
            mockAudio.addEventListener.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(callback, 0);
                }
            });
            
            const result = await audioManager.initializeHTMLAudio();
            
            expect(result).toBe(true); // Still returns true, but sounds are marked as failed
        });
        
        it('should handle HTML5 Audio loading timeout', async () => {
            // Mock timeout scenario - call error callback after delay
            mockAudio.addEventListener.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(callback, 100); // Simulate error after short delay
                }
                // Don't call canplaythrough to simulate timeout/error
            });
            
            const result = await audioManager.initializeHTMLAudio();
            
            expect(result).toBe(true); // Still returns true, continues with other sounds
        });
    });
    
    describe('error handling', () => {
        it('should handle errors gracefully without crashing', () => {
            const error = new Error('Test error');
            
            // Should not throw
            expect(() => {
                audioManager.handleAudioError(error, 'test_sound');
            }).not.toThrow();
            
            expect(console.warn).toHaveBeenCalledWith('Audio error for test_sound:', error);
        });
        
        it('should mark failed sounds as unavailable', () => {
            audioManager.sounds.test_sound = { loaded: true };
            
            audioManager.handleAudioError(new Error('Test error'), 'test_sound');
            
            expect(audioManager.sounds.test_sound).toEqual({
                type: 'failed',
                buffer: null,
                loaded: false,
                error: 'Test error'
            });
        });
    });
    
    describe('browser compatibility', () => {
        it('should detect Web Audio API support correctly', () => {
            global.AudioContext = jest.fn();
            expect(audioManager.isWebAudioSupported()).toBe(true);
            
            delete global.AudioContext;
            global.webkitAudioContext = jest.fn();
            expect(audioManager.isWebAudioSupported()).toBe(true);
            
            delete global.webkitAudioContext;
            expect(audioManager.isWebAudioSupported()).toBe(false);
        });
    });
    
    describe('sound playback', () => {
        let mockBufferSource;
        let mockGainNode;
        
        beforeEach(() => {
            // Set up initialized audio manager
            audioManager.isInitialized = true;
            audioManager.audioContext = mockAudioContext;
            
            // Mock Web Audio API nodes
            mockBufferSource = {
                buffer: null,
                loop: false,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null
            };
            
            mockGainNode = {
                gain: {
                    value: 0,
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn()
                },
                connect: jest.fn()
            };
            
            mockAudioContext.createBufferSource = jest.fn(() => mockBufferSource);
            mockAudioContext.createGain = jest.fn(() => mockGainNode);
            mockAudioContext.destination = {};
            mockAudioContext.currentTime = 0;
            
            // Set up loaded sounds
            audioManager.sounds = {
                turn: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                engine: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                explosion: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                victory: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                defeat: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                shrink_warning: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                shrink_execute: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true }
            };
        });
        
        describe('turn sound', () => {
            it('should play turn sound when called', () => {
                audioManager.playTurnSound();
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockBufferSource.buffer).toBe(mockAudioBuffer);
                expect(mockBufferSource.start).toHaveBeenCalledWith(0);
                expect(mockGainNode.gain.value).toBe(0.3); // Turn sound volume
            });
            
            it('should prevent turn sound spam with cooldown', () => {
                // Play first turn sound
                audioManager.playTurnSound();
                expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
                
                // Try to play again immediately (should be blocked by cooldown)
                audioManager.playTurnSound();
                expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
                
                // Simulate time passing beyond cooldown
                audioManager.lastTurnTime = Date.now() - 200; // 200ms ago
                audioManager.playTurnSound();
                expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(2);
            });
            
            it('should not play when muted', () => {
                audioManager.isMuted = true;
                
                audioManager.playTurnSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should not play when not initialized', () => {
                audioManager.isInitialized = false;
                
                audioManager.playTurnSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should handle missing sound gracefully', () => {
                audioManager.sounds.turn = null;
                
                expect(() => {
                    audioManager.playTurnSound();
                }).not.toThrow();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
        });
        
        describe('engine sound', () => {
            it('should start engine sound with looping', () => {
                audioManager.startEngineSound();
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockBufferSource.buffer).toBe(mockAudioBuffer);
                expect(mockBufferSource.loop).toBe(true);
                expect(mockBufferSource.start).toHaveBeenCalledWith(0);
                expect(audioManager.currentEngine).toBe(mockBufferSource);
            });
            
            it('should implement fade-in effect for engine sound', () => {
                audioManager.startEngineSound();
                
                expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
                expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 0.2);
            });
            
            it('should not start engine if already playing', () => {
                audioManager.currentEngine = mockBufferSource;
                
                audioManager.startEngineSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should stop engine sound', () => {
                audioManager.currentEngine = mockBufferSource;
                audioManager.activeSounds = [mockBufferSource];
                
                audioManager.stopEngineSound();
                
                expect(mockBufferSource.stop).toHaveBeenCalled();
                expect(audioManager.currentEngine).toBeNull();
                expect(audioManager.activeSounds).toHaveLength(0);
            });
            
            it('should handle engine stop errors gracefully', () => {
                mockBufferSource.stop.mockImplementation(() => {
                    throw new Error('Stop failed');
                });
                audioManager.currentEngine = mockBufferSource;
                
                expect(() => {
                    audioManager.stopEngineSound();
                }).not.toThrow();
                
                expect(audioManager.currentEngine).toBeNull();
            });
        });
        
        describe('explosion sound', () => {
            it('should play explosion sound and stop engine', () => {
                audioManager.currentEngine = mockBufferSource;
                
                audioManager.playExplosionSound();
                
                expect(mockBufferSource.stop).toHaveBeenCalled(); // Engine stopped
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockGainNode.gain.value).toBe(0.8); // Explosion volume
            });
            
            it('should handle explosion when no engine is playing', () => {
                audioManager.currentEngine = null;
                
                expect(() => {
                    audioManager.playExplosionSound();
                }).not.toThrow();
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
            });
        });
        
        describe('victory and defeat sounds', () => {
            beforeEach(() => {
                jest.useFakeTimers();
            });
            
            afterEach(() => {
                jest.useRealTimers();
            });
            
            it('should play victory sound with delay', () => {
                audioManager.playVictorySound();
                
                // Should not play immediately
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
                
                // Fast-forward time
                jest.advanceTimersByTime(500);
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockGainNode.gain.value).toBe(0.6); // Victory volume
            });
            
            it('should play defeat sound with delay', () => {
                audioManager.playDefeatSound();
                
                // Should not play immediately
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
                
                // Fast-forward time
                jest.advanceTimersByTime(500);
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockGainNode.gain.value).toBe(0.4); // Defeat volume
            });
            
            it('should not play victory sound if muted during delay', () => {
                audioManager.playVictorySound();
                
                // Mute during delay
                audioManager.isMuted = true;
                jest.advanceTimersByTime(500);
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
        });
        
        describe('shrink sounds', () => {
            it('should play shrink warning sound', () => {
                audioManager.playShrinkWarningSound();
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockGainNode.gain.value).toBe(0.4); // Warning volume
            });
            
            it('should play shrink execute sound', () => {
                audioManager.playShrinkExecuteSound();
                
                expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
                expect(mockGainNode.gain.value).toBe(0.6); // Execute volume
            });
            
            it('should not play shrink warning when muted', () => {
                audioManager.isMuted = true;
                audioManager.playShrinkWarningSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should not play shrink execute when muted', () => {
                audioManager.isMuted = true;
                audioManager.playShrinkExecuteSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should handle missing shrink warning sound gracefully', () => {
                audioManager.sounds.shrink_warning = { loaded: false };
                
                expect(() => audioManager.playShrinkWarningSound()).not.toThrow();
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should handle missing shrink execute sound gracefully', () => {
                audioManager.sounds.shrink_execute = { loaded: false };
                
                expect(() => audioManager.playShrinkExecuteSound()).not.toThrow();
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
        });
        
        describe('HTML5 Audio playback', () => {
            let mockAudioElement;
            
            beforeEach(() => {
                mockAudioElement = {
                    cloneNode: jest.fn(),
                    play: jest.fn().mockResolvedValue(),
                    pause: jest.fn(),
                    volume: 0,
                    loop: false,
                    currentTime: 0,
                    onended: null
                };
                
                mockAudioElement.cloneNode.mockReturnValue(mockAudioElement);
                
                // Set up HTML5 Audio sounds
                audioManager.sounds = {
                    turn: { type: 'html5', element: mockAudioElement, loaded: true },
                    engine: { type: 'html5', element: mockAudioElement, loaded: true }
                };
            });
            
            it('should play HTML5 turn sound', () => {
                audioManager.playTurnSound();
                
                expect(mockAudioElement.cloneNode).toHaveBeenCalled();
                expect(mockAudioElement.play).toHaveBeenCalled();
                expect(mockAudioElement.volume).toBe(0.3);
            });
            
            it('should start HTML5 engine sound with looping', () => {
                audioManager.startEngineSound();
                
                expect(mockAudioElement.cloneNode).toHaveBeenCalled();
                expect(mockAudioElement.loop).toBe(true);
                expect(mockAudioElement.play).toHaveBeenCalled();
                expect(audioManager.currentEngine).toBe(mockAudioElement);
            });
            
            it('should stop HTML5 engine sound', () => {
                audioManager.currentEngine = mockAudioElement;
                
                audioManager.stopEngineSound();
                
                expect(mockAudioElement.pause).toHaveBeenCalled();
                expect(mockAudioElement.currentTime).toBe(0);
                expect(audioManager.currentEngine).toBeNull();
            });
            
            it('should handle HTML5 play promise rejection', () => {
                mockAudioElement.play.mockRejectedValue(new Error('Play failed'));
                
                expect(() => {
                    audioManager.playTurnSound();
                }).not.toThrow();
            });
        });
        
        describe('concurrent sound management', () => {
            it('should enforce maximum concurrent sound limit', () => {
                audioManager.maxConcurrentSounds = 2;
                
                // Play multiple sounds
                audioManager.playTurnSound();
                audioManager.playTurnSound();
                audioManager.playTurnSound();
                
                expect(audioManager.activeSounds.length).toBeLessThanOrEqual(2);
            });
            
            it('should clean up ended sounds from active list', () => {
                audioManager.playTurnSound();
                
                const source = audioManager.activeSounds[0];
                expect(audioManager.activeSounds).toContain(source);
                
                // Simulate sound ending
                if (source.onended) {
                    source.onended();
                }
                
                expect(audioManager.activeSounds).not.toContain(source);
            });
        });
        
        describe('error handling in playback', () => {
            it('should handle Web Audio API playback errors', () => {
                mockBufferSource.start.mockImplementation(() => {
                    throw new Error('Start failed');
                });
                
                expect(() => {
                    audioManager.playTurnSound();
                }).not.toThrow();
            });
            
            it('should handle gain node creation errors', () => {
                mockAudioContext.createGain.mockImplementation(() => {
                    throw new Error('Gain node creation failed');
                });
                
                expect(() => {
                    audioManager.playTurnSound();
                }).not.toThrow();
            });
        });
    });
    
    describe('mute functionality', () => {
        beforeEach(() => {
            // Set up initialized audio manager
            audioManager.isInitialized = true;
            audioManager.audioContext = mockAudioContext;
            
            // Mock Web Audio API nodes
            const mockBufferSource = {
                buffer: null,
                loop: false,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null
            };
            
            const mockGainNode = {
                gain: {
                    value: 0,
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn()
                },
                connect: jest.fn()
            };
            
            mockAudioContext.createBufferSource = jest.fn(() => mockBufferSource);
            mockAudioContext.createGain = jest.fn(() => mockGainNode);
            mockAudioContext.destination = {};
            mockAudioContext.currentTime = 0;
            
            // Set up loaded sounds
            audioManager.sounds = {
                turn: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                engine: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                explosion: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                victory: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true },
                defeat: { type: 'webaudio', buffer: mockAudioBuffer, loaded: true }
            };
        });
        
        describe('mute state management', () => {
            it('should get current mute state', () => {
                expect(audioManager.getMuted()).toBe(false);
                
                audioManager.isMuted = true;
                expect(audioManager.getMuted()).toBe(true);
            });
            
            it('should set mute state and save to localStorage', () => {
                audioManager.setMuted(true);
                
                expect(audioManager.isMuted).toBe(true);
                expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lightbikes_audio_muted', 'true');
            });
            
            it('should stop all audio when muted', () => {
                const mockEngineSource = { stop: jest.fn() };
                const mockActiveSound = { stop: jest.fn() };
                
                audioManager.currentEngine = mockEngineSource;
                audioManager.activeSounds = [mockActiveSound];
                
                audioManager.setMuted(true);
                
                expect(mockEngineSource.stop).toHaveBeenCalled();
                expect(mockActiveSound.stop).toHaveBeenCalled();
                expect(audioManager.currentEngine).toBeNull();
                expect(audioManager.activeSounds).toHaveLength(0);
            });
            
            it('should not stop all audio when unmuted', () => {
                const mockEngineSource = { stop: jest.fn() };
                audioManager.currentEngine = mockEngineSource;
                
                audioManager.setMuted(false);
                
                expect(mockEngineSource.stop).not.toHaveBeenCalled();
                expect(audioManager.currentEngine).toBe(mockEngineSource);
            });
        });
        
        describe('localStorage persistence', () => {
            it('should load mute state from localStorage on construction', () => {
                mockLocalStorage.getItem.mockReturnValue('true');
                
                const newAudioManager = new AudioManager();
                
                expect(mockLocalStorage.getItem).toHaveBeenCalledWith('lightbikes_audio_muted');
                expect(newAudioManager.isMuted).toBe(true);
            });
            
            it('should default to unmuted when no saved state exists', () => {
                mockLocalStorage.getItem.mockReturnValue(null);
                
                const newAudioManager = new AudioManager();
                
                expect(newAudioManager.isMuted).toBe(false);
            });
            
            it('should handle localStorage errors gracefully during load', () => {
                mockLocalStorage.getItem.mockImplementation(() => {
                    throw new Error('localStorage not available');
                });
                
                expect(() => {
                    new AudioManager();
                }).not.toThrow();
            });
            
            it('should handle localStorage errors gracefully during save', () => {
                mockLocalStorage.setItem.mockImplementation(() => {
                    throw new Error('localStorage not available');
                });
                
                expect(() => {
                    audioManager.setMuted(true);
                }).not.toThrow();
                
                expect(audioManager.isMuted).toBe(true); // State should still be updated
            });
            
            it('should handle invalid JSON in localStorage', () => {
                mockLocalStorage.getItem.mockReturnValue('invalid-json');
                
                expect(() => {
                    new AudioManager();
                }).not.toThrow();
            });
        });
        
        describe('stopAllAudio functionality', () => {
            it('should stop engine sound when stopping all audio', () => {
                const mockEngineSource = { stop: jest.fn() };
                audioManager.currentEngine = mockEngineSource;
                
                audioManager.stopAllAudio();
                
                expect(mockEngineSource.stop).toHaveBeenCalled();
                expect(audioManager.currentEngine).toBeNull();
            });
            
            it('should stop all active sounds when stopping all audio', () => {
                const mockSound1 = { stop: jest.fn() };
                const mockSound2 = { stop: jest.fn() };
                audioManager.activeSounds = [mockSound1, mockSound2];
                
                audioManager.stopAllAudio();
                
                expect(mockSound1.stop).toHaveBeenCalled();
                expect(mockSound2.stop).toHaveBeenCalled();
                expect(audioManager.activeSounds).toHaveLength(0);
            });
            
            it('should handle errors when stopping engine sound', () => {
                const mockEngineSource = { 
                    stop: jest.fn().mockImplementation(() => {
                        throw new Error('Stop failed');
                    })
                };
                audioManager.currentEngine = mockEngineSource;
                
                expect(() => {
                    audioManager.stopAllAudio();
                }).not.toThrow();
                
                expect(audioManager.currentEngine).toBeNull();
            });
            
            it('should handle errors when stopping active sounds', () => {
                const mockSound = { 
                    stop: jest.fn().mockImplementation(() => {
                        throw new Error('Stop failed');
                    })
                };
                audioManager.activeSounds = [mockSound];
                
                expect(() => {
                    audioManager.stopAllAudio();
                }).not.toThrow();
                
                expect(audioManager.activeSounds).toHaveLength(0);
            });
            
            it('should handle sounds without stop method', () => {
                const mockSound = {}; // No stop method
                audioManager.activeSounds = [mockSound];
                
                expect(() => {
                    audioManager.stopAllAudio();
                }).not.toThrow();
                
                expect(audioManager.activeSounds).toHaveLength(0);
            });
        });
        
        describe('muted playback prevention', () => {
            beforeEach(() => {
                audioManager.isMuted = true;
            });
            
            it('should not play turn sound when muted', () => {
                audioManager.playTurnSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should not start engine sound when muted', () => {
                audioManager.startEngineSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
                expect(audioManager.currentEngine).toBeNull();
            });
            
            it('should not play explosion sound when muted', () => {
                audioManager.playExplosionSound();
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
            });
            
            it('should not play victory sound when muted', () => {
                jest.useFakeTimers();
                
                audioManager.playVictorySound();
                jest.advanceTimersByTime(500);
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
                
                jest.useRealTimers();
            });
            
            it('should not play defeat sound when muted', () => {
                jest.useFakeTimers();
                
                audioManager.playDefeatSound();
                jest.advanceTimersByTime(500);
                
                expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
                
                jest.useRealTimers();
            });
        });
    });
});