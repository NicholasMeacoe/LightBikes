/**
 * Tests for MusicCompatibility class
 * Verifies browser compatibility detection, autoplay handling, and mobile audio management
 */

const { MusicCompatibility } = require('./MusicCompatibility.js');

// Mock Web Audio API
const mockAudioContext = {
    state: 'running',
    resume: jest.fn().mockResolvedValue(undefined),
    createBuffer: jest.fn().mockReturnValue({}),
    createBufferSource: jest.fn().mockReturnValue({
        buffer: null,
        connect: jest.fn(),
        start: jest.fn()
    }),
    destination: {}
};

const mockAudio = {
    canPlayType: jest.fn()
};

// Mock global objects
Object.defineProperty(window, 'AudioContext', {
    value: jest.fn(() => mockAudioContext),
    configurable: true
});

Object.defineProperty(window, 'webkitAudioContext', {
    value: jest.fn(() => mockAudioContext),
    configurable: true
});

Object.defineProperty(window, 'Audio', {
    value: jest.fn(() => mockAudio),
    configurable: true
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    configurable: true
});

describe('MusicCompatibility', () => {
    let compatibility;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAudioContext.state = 'running';
        mockAudio.canPlayType.mockReturnValue('probably');
    });
    
    describe('constructor and initialization', () => {
        it('should initialize with Web Audio API support detection', () => {
            compatibility = new MusicCompatibility();
            
            expect(compatibility.isWebAudioAPISupported()).toBe(true);
        });
        
        it('should detect lack of Web Audio API support', () => {
            // Temporarily remove AudioContext
            const originalAudioContext = window.AudioContext;
            const originalWebkitAudioContext = window.webkitAudioContext;
            
            delete window.AudioContext;
            delete window.webkitAudioContext;
            
            compatibility = new MusicCompatibility();
            
            expect(compatibility.isWebAudioAPISupported()).toBe(false);
            
            // Restore
            window.AudioContext = originalAudioContext;
            window.webkitAudioContext = originalWebkitAudioContext;
        });
    });
    
    describe('Web Audio API support', () => {
        beforeEach(() => {
            compatibility = new MusicCompatibility();
        });
        
        it('should return true for supported browsers', () => {
            expect(compatibility.isWebAudioAPISupported()).toBe(true);
        });
        
        it('should create and return audio context', () => {
            const context = compatibility.getAudioContext();
            
            expect(context).toBe(mockAudioContext);
            expect(window.AudioContext).toHaveBeenCalled();
        });
        
        it('should reuse existing audio context', () => {
            const context1 = compatibility.getAudioContext();
            const context2 = compatibility.getAudioContext();
            
            expect(context1).toBe(context2);
            expect(window.AudioContext).toHaveBeenCalledTimes(1);
        });
        
        it('should handle audio context creation failure', () => {
            // Create a new compatibility instance with failing AudioContext
            window.AudioContext.mockImplementation(() => {
                throw new Error('AudioContext creation failed');
            });
            
            const failingCompatibility = new MusicCompatibility();
            const context = failingCompatibility.getAudioContext();
            
            expect(context).toBeNull();
            
            // Restore the mock for other tests
            window.AudioContext.mockImplementation(() => mockAudioContext);
        });
    });
    
    describe('autoplay detection', () => {
        it('should detect suspended audio context', () => {
            mockAudioContext.state = 'suspended';
            compatibility = new MusicCompatibility();
            
            const context = compatibility.getAudioContext();
            
            expect(compatibility.isUserInteractionRequired()).toBe(true);
        });
        
        it('should handle running audio context', () => {
            mockAudioContext.state = 'running';
            
            // Create fresh instance with running context
            const runningCompatibility = new MusicCompatibility();
            const context = runningCompatibility.getAudioContext();
            
            // Should not require interaction for running context initially
            expect(context).toBe(mockAudioContext);
        });
    });
    
    describe('audio context unlocking', () => {
        beforeEach(() => {
            compatibility = new MusicCompatibility();
        });
        
        it('should unlock suspended audio context', async () => {
            // Reset the mock state
            mockAudioContext.state = 'suspended';
            mockAudioContext.resume.mockClear();
            
            // Create fresh instance
            const suspendedCompatibility = new MusicCompatibility();
            const result = await suspendedCompatibility.unlockAudioContext();
            
            expect(result).toBe(true);
            expect(mockAudioContext.resume).toHaveBeenCalled();
            expect(suspendedCompatibility.isUserInteractionRequired()).toBe(false);
            expect(suspendedCompatibility.isMobileAudioUnlocked()).toBe(true);
        });
        
        it('should handle unlock failure', async () => {
            // Set context to suspended state and mock resume to fail
            mockAudioContext.state = 'suspended';
            mockAudioContext.resume.mockRejectedValueOnce(new Error('Resume failed'));
            
            const result = await compatibility.unlockAudioContext();
            
            expect(result).toBe(false);
        });
        
        it('should return false if no audio context available', async () => {
            // Make getAudioContext return null
            compatibility.isWebAudioSupported = false;
            
            const result = await compatibility.unlockAudioContext();
            
            expect(result).toBe(false);
        });
    });
    
    describe('mobile browser detection', () => {
        it('should detect mobile browsers', () => {
            const mobileUserAgents = [
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
                'Mozilla/5.0 (Linux; Android 10)',
                'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)'
            ];
            
            mobileUserAgents.forEach(userAgent => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: userAgent,
                    configurable: true
                });
                
                compatibility = new MusicCompatibility();
                expect(compatibility.isMobileBrowser()).toBe(true);
            });
        });
        
        it('should detect desktop browsers', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true
            });
            
            compatibility = new MusicCompatibility();
            expect(compatibility.isMobileBrowser()).toBe(false);
        });
        
        it('should detect iOS Safari specifically', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            compatibility = new MusicCompatibility();
            expect(compatibility.isIOSSafari()).toBe(true);
        });
    });
    
    describe('audio format support', () => {
        beforeEach(() => {
            compatibility = new MusicCompatibility();
        });
        
        it('should detect audio format support', () => {
            mockAudio.canPlayType.mockImplementation((type) => {
                const formats = {
                    'audio/mpeg': 'probably',
                    'audio/ogg': 'maybe',
                    'audio/wav': '',
                    'audio/mp4': 'probably'
                };
                return formats[type] || '';
            });
            
            const support = compatibility.getAudioFormatSupport();
            
            expect(support.mp3).toBe(true);
            expect(support.ogg).toBe(true);
            expect(support.wav).toBe(false);
            expect(support.m4a).toBe(true);
        });
        
        it('should return preferred audio format', () => {
            mockAudio.canPlayType.mockImplementation((type) => {
                return type === 'audio/mpeg' ? 'probably' : '';
            });
            
            const format = compatibility.getPreferredAudioFormat();
            
            expect(format).toBe('mp3');
        });
        
        it('should fallback to mp3 if no formats supported', () => {
            mockAudio.canPlayType.mockReturnValue('');
            
            const format = compatibility.getPreferredAudioFormat();
            
            expect(format).toBe('mp3');
        });
    });
    
    describe('user interaction handling', () => {
        beforeEach(() => {
            compatibility = new MusicCompatibility();
            
            // Mock document event listeners
            document.addEventListener = jest.fn();
            document.removeEventListener = jest.fn();
        });
        
        it('should call callback immediately if no interaction required', () => {
            compatibility.userInteractionRequired = false;
            const callback = jest.fn();
            
            compatibility.setupUserInteractionHandler(callback);
            
            expect(callback).toHaveBeenCalled();
            expect(document.addEventListener).not.toHaveBeenCalled();
        });
        
        it('should setup event listeners if interaction required', () => {
            compatibility.userInteractionRequired = true;
            const callback = jest.fn();
            
            compatibility.setupUserInteractionHandler(callback);
            
            expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { once: true });
            expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { once: true });
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), { once: true });
        });
    });
    
    describe('compatibility information', () => {
        beforeEach(() => {
            compatibility = new MusicCompatibility();
        });
        
        it('should provide comprehensive compatibility info', () => {
            const info = compatibility.getCompatibilityInfo();
            
            expect(info).toHaveProperty('webAudioSupported');
            expect(info).toHaveProperty('autoplayAllowed');
            expect(info).toHaveProperty('userInteractionRequired');
            expect(info).toHaveProperty('mobileAudioUnlocked');
            expect(info).toHaveProperty('isMobile');
            expect(info).toHaveProperty('isIOSSafari');
            expect(info).toHaveProperty('audioFormats');
            expect(info).toHaveProperty('preferredFormat');
        });
        
        it('should reflect current state in compatibility info', () => {
            compatibility.userInteractionRequired = false;
            compatibility.mobileAudioUnlocked = true;
            
            const info = compatibility.getCompatibilityInfo();
            
            expect(info.userInteractionRequired).toBe(false);
            expect(info.mobileAudioUnlocked).toBe(true);
        });
    });
    
    describe('mobile-specific behavior', () => {
        it('should require user interaction on mobile', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            compatibility = new MusicCompatibility();
            
            expect(compatibility.isUserInteractionRequired()).toBe(true);
            expect(compatibility.isAutoplayAllowed()).toBe(false);
            expect(compatibility.isMobileAudioUnlocked()).toBe(false);
        });
        
        it('should handle desktop differently from mobile', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true
            });
            
            compatibility = new MusicCompatibility();
            
            expect(compatibility.isMobileAudioUnlocked()).toBe(true); // Not applicable on desktop
        });
    });
    
    describe('error handling', () => {
        it('should handle missing Web Audio API gracefully', () => {
            compatibility = new MusicCompatibility();
            compatibility.isWebAudioSupported = false;
            
            const context = compatibility.getAudioContext();
            
            expect(context).toBeNull();
        });
        
        it('should handle audio context unlock errors', async () => {
            compatibility = new MusicCompatibility();
            
            // Mock createBuffer to throw error
            mockAudioContext.createBuffer.mockImplementation(() => {
                throw new Error('Buffer creation failed');
            });
            
            const result = await compatibility.unlockAudioContext();
            
            expect(result).toBe(false);
        });
    });
});