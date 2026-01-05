/**
 * BrowserCompatibility Coverage Tests
 */
const { BrowserCompatibility } = require('../../src/utils/BrowserCompatibility.js');

// Mock Logger
jest.mock('../../src/utils/Logger.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('BrowserCompatibility Coverage', () => {
    let browserCompat;
    let originalUserAgent;
    let originalWebGLRenderingContext;

    beforeEach(() => {
        browserCompat = new BrowserCompatibility();
        originalUserAgent = global.navigator.userAgent;
        originalWebGLRenderingContext = window.WebGLRenderingContext;

        // Setup default mocks
        global.document.body.innerHTML = '';
        global.document.body.appendChild = jest.fn();
        global.document.body.classList.add = jest.fn();
    });

    afterEach(() => {
        // Restore globals
        Object.defineProperty(global.navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
        window.WebGLRenderingContext = originalWebGLRenderingContext;
        jest.clearAllMocks();
    });

    const setUserAgent = (userAgent) => {
        Object.defineProperty(global.navigator, 'userAgent', {
            value: userAgent,
            configurable: true,
        });
    };

    describe('Browser Detection', () => {
        it('should detect Chrome', () => {
            setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Chrome');
            expect(browserCompat.browserInfo.version).toBe('90');
            expect(browserCompat.browserInfo.isSupported).toBe(true);
        });

        it('should detect Edge', () => {
            setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Edg/90.0.818.62'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Edge');
            expect(browserCompat.browserInfo.version).toBe('90');
            expect(browserCompat.browserInfo.isSupported).toBe(true);
        });

        it('should detect Firefox', () => {
            setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Firefox');
            expect(browserCompat.browserInfo.version).toBe('88');
            expect(browserCompat.browserInfo.isSupported).toBe(true);
        });

        it('should detect Safari', () => {
            setUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Safari');
            expect(browserCompat.browserInfo.version).toBe('14');
            expect(browserCompat.browserInfo.isSupported).toBe(true);
        });

        it('should detect Opera', () => {
            setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 OPR/76.0.4017.123'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Opera');
            expect(browserCompat.browserInfo.version).toBe('76');
            expect(browserCompat.browserInfo.isSupported).toBe(true);
        });

        it('should detect unsupported older versions', () => {
            setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.4430.212 Safari/537.36'
            );
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Chrome');
            expect(browserCompat.browserInfo.isSupported).toBe(false);
            expect(browserCompat.warnings.length).toBeGreaterThan(0);
        });

        it('should handle unknown browsers', () => {
            setUserAgent('UnknownBrowser/1.0');
            browserCompat.detectBrowser();
            expect(browserCompat.browserInfo.name).toBe('Unknown');
            expect(browserCompat.browserInfo.isSupported).toBe(false);
        });
    });

    describe('WebGL Checks', () => {
        it('should show WebGL error logic', () => {
            browserCompat.showWebGLError();
            expect(global.document.body.appendChild).toHaveBeenCalled();
            const appendedElement = global.document.body.appendChild.mock.calls[0][0];
            expect(appendedElement.id).toBe('webgl-error');
            expect(appendedElement.innerHTML).toContain('WebGL Not Supported');
        });

        it('should check WebGL features successfully', () => {
            window.WebGLRenderingContext = jest.fn();
            const mockGL = {
                getExtension: jest.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 'renderer_id' }),
                getParameter: jest.fn().mockReturnValue('Mock Renderer'),
            };
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockGL),
            });

            browserCompat.checkWebGL();

            expect(mockGL.getExtension).toHaveBeenCalledWith('WEBGL_debug_renderer_info');
            expect(browserCompat.features.webgl).toBe(true);

            document.createElement = originalCreate;
        });

        it('should fail WebGL if context is missing', () => {
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockReturnValue({
                getContext: jest.fn().mockReturnValue(null), // Fail
            });

            const result = browserCompat.checkWebGL();
            expect(result).toBe(false);
            expect(browserCompat.features.webgl).toBe(false);

            document.createElement = originalCreate;
        });
    });

    describe('Storage and Audio', () => {
        it('should handle localStorage verification failure', () => {
            const originalGet = Storage.prototype.getItem;
            Storage.prototype.getItem = jest.fn().mockReturnValue('wrong');

            const result = browserCompat.checkLocalStorage();
            expect(result).toBe(false);
            expect(browserCompat.features.localStorage).toBe(false);

            Storage.prototype.getItem = originalGet;
        });

        it('should check WebAudio success', () => {
            window.AudioContext = jest.fn().mockImplementation(() => ({
                close: jest.fn(),
            }));
            const result = browserCompat.checkWebAudio();
            expect(result).toBe(true);
        });

        it('should check WebAudio failure', () => {
            const originalMsg = window.AudioContext;
            window.AudioContext = undefined;
            window.webkitAudioContext = undefined;

            const result = browserCompat.checkWebAudio();
            expect(result).toBe(false);
            expect(browserCompat.features.webAudio).toBe(false);

            window.AudioContext = originalMsg;
        });

        it('should check WebAudio instantiation failure', () => {
            window.AudioContext = jest.fn().mockImplementation(() => {
                throw new Error('Failed');
            });

            const result = browserCompat.checkWebAudio();
            expect(result).toBe(false);
        });
    });

    describe('ES6 Feature Checks Failure', () => {
        it('should report failure if Map/Set missing', () => {
            const originalMap = global.Map;
            global.Map = undefined;

            const result = browserCompat.checkES6Features();
            expect(result).toBe(false);
            expect(browserCompat.features.es6).toBe(false);

            global.Map = originalMap;
        });

        it('should report failure if Promise missing', () => {
            const originalPromise = global.Promise;
            global.Promise = undefined;

            const result = browserCompat.checkES6Features();
            expect(result).toBe(false);

            global.Promise = originalPromise;
        });
    });

    describe('Full System Check', () => {
        it('should perform full compatibility check successfully', () => {
            // Mock all dependencies for success
            const mockGL = {
                getExtension: jest.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 'renderer_id' }),
                getParameter: jest.fn().mockReturnValue('Mock Renderer'),
            };
            const mockCtx = {
                textBaseline: '',
                font: '',
                fillText: jest.fn(),
                getImageData: jest.fn().mockReturnValue({ data: [1, 0, 0, 0] }),
            };

            // Dynamic mock for create element
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockImplementation((tagName) => {
                if (tagName === 'canvas') {
                    return {
                        getContext: jest.fn().mockImplementation((type) => {
                            if (type === 'webgl' || type === 'experimental-webgl') return mockGL;
                            if (type === '2d') return mockCtx;
                            return null;
                        }),
                    };
                }
                return {};
            });

            window.WebGLRenderingContext = jest.fn();
            window.requestAnimationFrame = jest.fn();
            window.AudioContext = jest.fn().mockImplementation(() => ({
                close: jest.fn(),
            }));

            // Restore checkCompatibility if it was mocked (it's not mocked on the instance unless I did so in previous test, which I didn't - I mocked it on specific tests using jest.fn(), but strictly speaking 'browserCompat' is recreated in beforeEach, so it's fresh)

            const result = browserCompat.checkCompatibility();

            expect(result.isCompatible).toBe(true);
            expect(browserCompat.features.webgl).toBe(true);
            expect(browserCompat.features.localStorage).toBe(true);
            expect(browserCompat.features.es6).toBe(true);
            expect(browserCompat.features.webAudio).toBe(true);
            expect(browserCompat.features.requestAnimationFrame).toBe(true);
            expect(browserCompat.features.canvas).toBe(true);

            document.createElement = originalCreate;
        });

        it('should handle requestAnimationFrame missing', () => {
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = undefined;

            const result = browserCompat.checkRequestAnimationFrame();
            expect(result).toBe(false);
            expect(browserCompat.features.requestAnimationFrame).toBe(false);

            window.requestAnimationFrame = originalRAF;
        });

        it('should handle canvas context missing', () => {
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockReturnValue({
                getContext: jest.fn().mockReturnValue(null),
            });

            const result = browserCompat.checkCanvas();
            expect(result).toBe(false);
            expect(browserCompat.features.canvas).toBe(false);

            document.createElement = originalCreate;
        });

        it('should handle WebGL exception', () => {
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockImplementation(() => {
                throw new Error('Canvas Error');
            });

            const result = browserCompat.checkWebGL();
            expect(result).toBe(false);
            expect(browserCompat.errors.length).toBeGreaterThan(0);

            document.createElement = originalCreate;
        });
    });

    describe('Miscellaneous', () => {
        it('should get recommended browsers', () => {
            const browsers = browserCompat.getRecommendedBrowsers();
            expect(browsers.length).toBe(4);
            expect(browsers[0].name).toBe('Chrome');
        });

        it('should get summary', () => {
            const mockReport = {
                isCompatible: true,
                browserInfo: { name: 'Chrome', version: '90' },
                features: {},
                warnings: [],
                errors: [],
            };
            // Mock checkCompatibility
            browserCompat.checkCompatibility = jest.fn().mockReturnValue(mockReport);

            const summary = browserCompat.getSummary();
            expect(summary).toContain('compatible');
        });

        it('should get summary with issues', () => {
            const mockReport = {
                isCompatible: false,
                browserInfo: { name: 'Chrome', version: '80' },
                features: {},
                warnings: ['Old browser'],
                errors: ['No WebGL'],
            };
            browserCompat.checkCompatibility = jest.fn().mockReturnValue(mockReport);

            const summary = browserCompat.getSummary();
            expect(summary).toContain('Compatibility Issues Detected');
            expect(summary).toContain('Old browser');
            expect(summary).toContain('No WebGL');
        });

        it('should detect emoji support (true branch)', () => {
            const originalCreate = document.createElement;
            const mockCtx = {
                textBaseline: '',
                font: '',
                fillText: jest.fn(),
                getImageData: jest.fn().mockReturnValue({ data: [1, 0, 0, 0] }), // Non-zero means supported
            };
            document.createElement = jest.fn().mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockCtx),
            });

            const result = browserCompat.detectEmojiSupport();
            expect(result).toBe(true);

            document.createElement = originalCreate;
        });

        it('should detect emoji support (false branch via empty pixel)', () => {
            const originalCreate = document.createElement;
            const mockCtx = {
                textBaseline: '',
                font: '',
                fillText: jest.fn(),
                getImageData: jest.fn().mockReturnValue({ data: [0, 0, 0, 0] }), // Zero means unsupported
            };
            document.createElement = jest.fn().mockReturnValue({
                getContext: jest.fn().mockReturnValue(mockCtx),
            });

            const result = browserCompat.detectEmojiSupport();
            expect(result).toBe(false);

            document.createElement = originalCreate;
        });

        it('should handle detectEmojiSupport errors', () => {
            const originalCreate = document.createElement;
            document.createElement = jest.fn().mockImplementation(() => {
                throw new Error('Canvas Fail');
            });

            const result = browserCompat.detectEmojiSupport();
            expect(result).toBe(false);

            document.createElement = originalCreate;
        });

        it('should initialize icon display with fallback', () => {
            browserCompat.detectEmojiSupport = jest.fn().mockReturnValue(false);
            browserCompat.initializeIconDisplay();
            expect(document.body.classList.add).toHaveBeenCalledWith('no-emoji-support');
        });

        it('should initialize icon display with support', () => {
            browserCompat.detectEmojiSupport = jest.fn().mockReturnValue(true);
            browserCompat.initializeIconDisplay();
            expect(document.body.classList.add).not.toHaveBeenCalled();
        });

        it('should check Canvas errors', () => {
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn().mockReturnValue({}); // No getContext

            const result = browserCompat.checkCanvas();
            expect(result).toBe(false);

            document.createElement = originalCreateElement;
        });
    });
});
