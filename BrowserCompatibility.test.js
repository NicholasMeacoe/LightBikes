/**
 * Tests for BrowserCompatibility.js
 */

const { BrowserCompatibility } = require('./BrowserCompatibility.js');

describe('BrowserCompatibility', () => {
    let compatibility;
    
    beforeEach(() => {
        compatibility = new BrowserCompatibility();
        
        // Mock console methods to avoid cluttering test output
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    describe('checkCompatibility', () => {
        it('should return a compatibility report', () => {
            const report = compatibility.checkCompatibility();
            
            expect(report).toBeDefined();
            expect(report).toHaveProperty('isCompatible');
            expect(report).toHaveProperty('features');
            expect(report).toHaveProperty('browserInfo');
            expect(report).toHaveProperty('warnings');
            expect(report).toHaveProperty('errors');
        });
        
        it('should check all required features', () => {
            const report = compatibility.checkCompatibility();
            
            expect(report.features).toHaveProperty('webgl');
            expect(report.features).toHaveProperty('localStorage');
            expect(report.features).toHaveProperty('es6');
            expect(report.features).toHaveProperty('webAudio');
            expect(report.features).toHaveProperty('requestAnimationFrame');
            expect(report.features).toHaveProperty('canvas');
        });
        
        it('should detect browser information', () => {
            const report = compatibility.checkCompatibility();
            
            expect(report.browserInfo).toHaveProperty('name');
            expect(report.browserInfo).toHaveProperty('version');
            expect(report.browserInfo).toHaveProperty('isSupported');
        });
    });
    
    describe('checkWebGL', () => {
        it('should detect WebGL support', () => {
            const result = compatibility.checkWebGL();
            
            // In jsdom environment, WebGL may not be available
            expect(typeof result).toBe('boolean');
            expect(compatibility.features.webgl).toBe(result);
        });
        
        it('should handle WebGL check errors gracefully', () => {
            // Mock canvas creation to throw error
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => {
                throw new Error('Canvas creation failed');
            });
            
            const result = compatibility.checkWebGL();
            
            expect(result).toBe(false);
            expect(compatibility.errors.length).toBeGreaterThan(0);
            
            // Restore
            document.createElement = originalCreateElement;
        });
    });
    
    describe('checkLocalStorage', () => {
        it('should detect localStorage support', () => {
            const result = compatibility.checkLocalStorage();
            
            expect(typeof result).toBe('boolean');
            expect(compatibility.features.localStorage).toBe(result);
        });
        
        it('should verify localStorage read/write operations', () => {
            const result = compatibility.checkLocalStorage();
            
            if (result) {
                // If localStorage is supported, verify it works
                const testKey = '__lightbikes_storage_test__';
                expect(localStorage.getItem(testKey)).toBeNull();
            }
        });
        
        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw error
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = jest.fn(() => {
                throw new Error('localStorage not available');
            });
            
            const result = compatibility.checkLocalStorage();
            
            expect(result).toBe(false);
            expect(compatibility.warnings.length).toBeGreaterThan(0);
            
            // Restore
            Storage.prototype.setItem = originalSetItem;
        });
    });
    
    describe('checkES6Features', () => {
        it('should detect ES6 support', () => {
            const result = compatibility.checkES6Features();
            
            // In modern test environment, ES6 should be supported
            expect(result).toBe(true);
            expect(compatibility.features.es6).toBe(true);
        });
        
        it('should check for Promise support', () => {
            const originalPromise = global.Promise;
            delete global.Promise;
            
            const result = compatibility.checkES6Features();
            
            expect(result).toBe(false);
            
            // Restore
            global.Promise = originalPromise;
        });
    });
    
    describe('checkWebAudio', () => {
        it('should detect Web Audio API support', () => {
            const result = compatibility.checkWebAudio();
            
            expect(typeof result).toBe('boolean');
            expect(compatibility.features.webAudio).toBe(result);
        });
        
        it('should handle missing AudioContext gracefully', () => {
            const originalAudioContext = global.AudioContext;
            const originalWebkitAudioContext = global.webkitAudioContext;
            
            delete global.AudioContext;
            delete global.webkitAudioContext;
            
            const result = compatibility.checkWebAudio();
            
            expect(result).toBe(false);
            expect(compatibility.warnings.length).toBeGreaterThan(0);
            
            // Restore
            global.AudioContext = originalAudioContext;
            global.webkitAudioContext = originalWebkitAudioContext;
        });
    });
    
    describe('checkRequestAnimationFrame', () => {
        it('should detect requestAnimationFrame support', () => {
            const result = compatibility.checkRequestAnimationFrame();
            
            expect(typeof result).toBe('boolean');
            expect(compatibility.features.requestAnimationFrame).toBe(result);
        });
        
        it('should handle missing requestAnimationFrame', () => {
            const originalRAF = global.requestAnimationFrame;
            delete global.requestAnimationFrame;
            
            const result = compatibility.checkRequestAnimationFrame();
            
            expect(result).toBe(false);
            expect(compatibility.errors.length).toBeGreaterThan(0);
            
            // Restore
            global.requestAnimationFrame = originalRAF;
        });
    });
    
    describe('checkCanvas', () => {
        it('should detect Canvas API support', () => {
            const result = compatibility.checkCanvas();
            
            expect(typeof result).toBe('boolean');
            expect(compatibility.features.canvas).toBe(result);
        });
    });
    
    describe('detectBrowser', () => {
        it('should detect Chrome browser', () => {
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
                configurable: true
            });
            
            compatibility.detectBrowser();
            
            expect(compatibility.browserInfo.name).toBe('Chrome');
            expect(compatibility.browserInfo.version).toBe('95');
            expect(compatibility.browserInfo.isSupported).toBe(true);
            
            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });
        
        it('should detect Firefox browser', () => {
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
                configurable: true
            });
            
            compatibility.detectBrowser();
            
            expect(compatibility.browserInfo.name).toBe('Firefox');
            expect(compatibility.browserInfo.version).toBe('90');
            expect(compatibility.browserInfo.isSupported).toBe(true);
            
            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });
        
        it('should detect unsupported browser versions', () => {
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
                configurable: true
            });
            
            compatibility.detectBrowser();
            
            expect(compatibility.browserInfo.name).toBe('Chrome');
            expect(compatibility.browserInfo.version).toBe('80');
            expect(compatibility.browserInfo.isSupported).toBe(false);
            expect(compatibility.warnings.length).toBeGreaterThan(0);
            
            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });
    });
    
    describe('getSummary', () => {
        it('should return a human-readable summary', () => {
            const summary = compatibility.getSummary();
            
            expect(typeof summary).toBe('string');
            expect(summary.length).toBeGreaterThan(0);
        });
        
        it('should include browser information in summary', () => {
            const summary = compatibility.getSummary();
            
            expect(summary).toContain('Browser:');
        });
    });
    
    describe('getRecommendedBrowsers', () => {
        it('should return list of recommended browsers', () => {
            const browsers = compatibility.getRecommendedBrowsers();
            
            expect(Array.isArray(browsers)).toBe(true);
            expect(browsers.length).toBeGreaterThan(0);
        });
        
        it('should include browser details', () => {
            const browsers = compatibility.getRecommendedBrowsers();
            
            browsers.forEach(browser => {
                expect(browser).toHaveProperty('name');
                expect(browser).toHaveProperty('version');
                expect(browser).toHaveProperty('url');
            });
        });
    });
    
    describe('integration', () => {
        it('should mark as compatible when all features are supported', () => {
            // In a modern test environment, most features should be supported
            const report = compatibility.checkCompatibility();
            
            // Check that the report structure is correct
            expect(report).toHaveProperty('isCompatible');
            expect(typeof report.isCompatible).toBe('boolean');
            
            // If all critical features are supported, should be compatible
            const criticalFeatures = ['webgl', 'localStorage', 'es6', 'requestAnimationFrame', 'canvas'];
            const allCriticalSupported = criticalFeatures.every(feature => report.features[feature]);
            
            expect(report.isCompatible).toBe(allCriticalSupported);
        });
        
        it('should mark as incompatible when critical features are missing', () => {
            // Mock WebGL check to fail
            compatibility.checkWebGL = jest.fn(() => {
                compatibility.features.webgl = false;
                compatibility.errors.push('WebGL not supported');
                return false;
            });
            
            const report = compatibility.checkCompatibility();
            
            expect(report.isCompatible).toBe(false);
            expect(report.errors.length).toBeGreaterThan(0);
        });
    });
});
