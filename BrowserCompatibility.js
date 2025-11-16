/**
 * BrowserCompatibility.js
 * Comprehensive browser feature detection and compatibility checking
 */

class BrowserCompatibility {
    constructor() {
        this.features = {
            webgl: false,
            localStorage: false,
            es6: false,
            webAudio: false,
            requestAnimationFrame: false,
            canvas: false
        };
        
        this.browserInfo = {
            name: 'Unknown',
            version: 'Unknown',
            isSupported: false
        };
        
        this.warnings = [];
        this.errors = [];
    }

    /**
     * Check all browser features and compatibility
     * @returns {Object} Compatibility report
     */
    checkCompatibility() {
        this.detectBrowser();
        this.checkWebGL();
        this.checkLocalStorage();
        this.checkES6Features();
        this.checkWebAudio();
        this.checkRequestAnimationFrame();
        this.checkCanvas();
        
        // Determine overall compatibility
        const criticalFeatures = ['webgl', 'localStorage', 'es6', 'requestAnimationFrame', 'canvas'];
        const allCriticalSupported = criticalFeatures.every(feature => this.features[feature]);
        
        return {
            isCompatible: allCriticalSupported,
            features: { ...this.features },
            browserInfo: { ...this.browserInfo },
            warnings: [...this.warnings],
            errors: [...this.errors]
        };
    }

    /**
     * Detect browser name and version
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        // Chrome
        if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
            this.browserInfo.name = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            if (match) {
                this.browserInfo.version = match[1];
                this.browserInfo.isSupported = parseInt(match[1]) >= 90;
            }
        }
        // Edge (Chromium)
        else if (userAgent.indexOf('Edg') > -1) {
            this.browserInfo.name = 'Edge';
            const match = userAgent.match(/Edg\/(\d+)/);
            if (match) {
                this.browserInfo.version = match[1];
                this.browserInfo.isSupported = parseInt(match[1]) >= 90;
            }
        }
        // Firefox
        else if (userAgent.indexOf('Firefox') > -1) {
            this.browserInfo.name = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            if (match) {
                this.browserInfo.version = match[1];
                this.browserInfo.isSupported = parseInt(match[1]) >= 88;
            }
        }
        // Safari
        else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
            this.browserInfo.name = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            if (match) {
                this.browserInfo.version = match[1];
                this.browserInfo.isSupported = parseInt(match[1]) >= 14;
            }
        }
        // Opera
        else if (userAgent.indexOf('OPR') > -1 || userAgent.indexOf('Opera') > -1) {
            this.browserInfo.name = 'Opera';
            const match = userAgent.match(/(?:OPR|Opera)\/(\d+)/);
            if (match) {
                this.browserInfo.version = match[1];
                this.browserInfo.isSupported = parseInt(match[1]) >= 76;
            }
        }
        
        if (!this.browserInfo.isSupported) {
            this.warnings.push(`${this.browserInfo.name} ${this.browserInfo.version} may not be fully supported. Recommended: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+`);
        }
    }

    /**
     * Check WebGL support
     * @returns {boolean} True if WebGL is supported
     */
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl || !window.WebGLRenderingContext) {
                this.features.webgl = false;
                this.errors.push('WebGL is not supported in this browser');
                return false;
            }
            
            // Check for WebGL extensions that might be needed
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('WebGL Renderer:', renderer);
            }
            
            this.features.webgl = true;
            return true;
        } catch (e) {
            this.features.webgl = false;
            this.errors.push(`WebGL check failed: ${e.message}`);
            return false;
        }
    }

    /**
     * Check localStorage support
     * @returns {boolean} True if localStorage is supported
     */
    checkLocalStorage() {
        try {
            const testKey = '__lightbikes_storage_test__';
            const testValue = 'test';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (retrieved !== testValue) {
                throw new Error('localStorage read/write verification failed');
            }
            
            this.features.localStorage = true;
            return true;
        } catch (e) {
            this.features.localStorage = false;
            this.warnings.push('localStorage is not available. Game settings will not persist between sessions.');
            return false;
        }
    }

    /**
     * Check ES6 features support
     * @returns {boolean} True if required ES6 features are supported
     */
    checkES6Features() {
        try {
            // Check for arrow functions
            eval('() => {}');
            
            // Check for const/let
            eval('const x = 1; let y = 2;');
            
            // Check for classes
            eval('class Test {}');
            
            // Check for template literals
            eval('`template`');
            
            // Check for destructuring
            eval('const {a} = {a: 1};');
            
            // Check for spread operator
            eval('const arr = [...[1, 2]];');
            
            // Check for Promise
            if (typeof Promise === 'undefined') {
                throw new Error('Promise not supported');
            }
            
            // Check for Map and Set
            if (typeof Map === 'undefined' || typeof Set === 'undefined') {
                throw new Error('Map/Set not supported');
            }
            
            this.features.es6 = true;
            return true;
        } catch (e) {
            this.features.es6 = false;
            this.errors.push('Required JavaScript ES6 features are not supported');
            return false;
        }
    }

    /**
     * Check Web Audio API support
     * @returns {boolean} True if Web Audio is supported
     */
    checkWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                this.features.webAudio = false;
                this.warnings.push('Web Audio API is not supported. Audio features will be limited.');
                return false;
            }
            
            // Try to create an audio context
            const context = new AudioContext();
            context.close();
            
            this.features.webAudio = true;
            return true;
        } catch (e) {
            this.features.webAudio = false;
            this.warnings.push('Web Audio API is not available. Audio features will be limited.');
            return false;
        }
    }

    /**
     * Check requestAnimationFrame support
     * @returns {boolean} True if requestAnimationFrame is supported
     */
    checkRequestAnimationFrame() {
        if (typeof window.requestAnimationFrame === 'undefined') {
            this.features.requestAnimationFrame = false;
            this.errors.push('requestAnimationFrame is not supported');
            return false;
        }
        
        this.features.requestAnimationFrame = true;
        return true;
    }

    /**
     * Check Canvas API support
     * @returns {boolean} True if Canvas is supported
     */
    checkCanvas() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                this.features.canvas = false;
                this.errors.push('Canvas 2D context is not supported');
                return false;
            }
            
            this.features.canvas = true;
            return true;
        } catch (e) {
            this.features.canvas = false;
            this.errors.push('Canvas API is not supported');
            return false;
        }
    }

    /**
     * Get a summary of compatibility issues
     * @returns {string} Human-readable summary
     */
    getSummary() {
        const report = this.checkCompatibility();
        
        if (report.isCompatible) {
            return `✓ Your browser (${report.browserInfo.name} ${report.browserInfo.version}) is compatible with LightBikes.`;
        }
        
        let summary = `⚠ Compatibility Issues Detected:\n\n`;
        summary += `Browser: ${report.browserInfo.name} ${report.browserInfo.version}\n\n`;
        
        if (report.errors.length > 0) {
            summary += `Critical Issues:\n`;
            report.errors.forEach(error => {
                summary += `  • ${error}\n`;
            });
            summary += '\n';
        }
        
        if (report.warnings.length > 0) {
            summary += `Warnings:\n`;
            report.warnings.forEach(warning => {
                summary += `  • ${warning}\n`;
            });
        }
        
        return summary;
    }

    /**
     * Get recommended browsers list
     * @returns {Array} List of recommended browsers
     */
    getRecommendedBrowsers() {
        return [
            { name: 'Chrome', version: '90+', url: 'https://www.google.com/chrome/' },
            { name: 'Firefox', version: '88+', url: 'https://www.mozilla.org/firefox/' },
            { name: 'Safari', version: '14+', url: 'https://www.apple.com/safari/' },
            { name: 'Edge', version: '90+', url: 'https://www.microsoft.com/edge' }
        ];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowserCompatibility };
}
