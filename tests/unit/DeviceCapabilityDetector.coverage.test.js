/**
 * DeviceCapabilityDetector Coverage Tests
 */
const { DeviceCapabilityDetector } = require('../../src/utils/DeviceCapabilityDetector.js');

// Mock Logger
jest.mock('../../src/utils/Logger.js', () => ({
    createLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
}));

describe('DeviceCapabilityDetector Coverage', () => {
    let detector;
    let originalUserAgent;
    let originalNavigator;
    let originalThree;
    let originalCreateElement;

    beforeEach(() => {
        // Reset mocks
        originalUserAgent = global.navigator.userAgent;
        originalNavigator = global.navigator;
        originalThree = global.window.THREE;
        originalCreateElement = global.document.createElement;

        // Mock createElement on existing document
        global.document.createElement = jest.fn().mockReturnValue({
            getContext: jest.fn().mockReturnValue(null),
            width: 0,
            height: 0,
        });

        global.window.THREE = undefined;

        detector = new DeviceCapabilityDetector();
    });

    afterEach(() => {
        Object.defineProperty(global.navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
        global.navigator = originalNavigator;
        global.window.THREE = originalThree;
        if (global.document) {
            global.document.createElement = originalCreateElement;
        }
        jest.clearAllMocks();
    });

    const setMockGL = (rendererString, vendorString, maxTextureSize = 4096) => {
        const mockGL = {
            getParameter: jest.fn().mockImplementation((param) => {
                if (param === 'RENDERER') return rendererString;
                if (param === 'VENDOR') return vendorString;
                if (param === 'MAX_TEXTURE_SIZE') return maxTextureSize;
                if (param === 'MAX_RENDERBUFFER_SIZE') return 4096;
                return 'mock_value';
            }),
            getExtension: jest.fn().mockReturnValue(true),
            RENDERER: 'RENDERER',
            VENDOR: 'VENDOR',
            MAX_TEXTURE_SIZE: 'MAX_TEXTURE_SIZE',
            MAX_RENDERBUFFER_SIZE: 'MAX_RENDERBUFFER_SIZE',
        };

        global.document.createElement = jest.fn().mockReturnValue({
            getContext: jest.fn().mockImplementation((type) => {
                if (type === 'webgl' || type === 'experimental-webgl') return mockGL;
                if (type === 'webgl2') return mockGL;
                return null;
            }),
            width: 0,
            height: 0,
        });

        return mockGL;
    };

    describe('GPU Tier Estimation', () => {
        it('should detect High Tier GPU (RTX)', () => {
            setMockGL('NVIDIA GeForce RTX 3080', 'NVIDIA Corporation');
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('high');
        });

        it('should detect High Tier GPU (AMD RX 6xxx)', () => {
            setMockGL('AMD Radeon RX 6800 XT', 'ATI Technologies Inc.');
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('high');
        });

        it('should detect Medium Tier GPU (Generic GTX)', () => {
            setMockGL('NVIDIA GeForce GTX 960', 'NVIDIA Corporation');
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('medium');
        });

        it('should detect Medium Tier GPU (Large Texture Size)', () => {
            setMockGL('Unknown GPU', 'Unknown Vendor', 8192); // High texture size -> medium default
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('medium');
        });

        it('should detect Low Tier GPU (Intel Integrated)', () => {
            // Use smaller texture size to avoid Medium tier override
            setMockGL('Intel(R) UHD Graphics 630', 'Intel', 2048);
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('low');
        });

        it('should detect Low Tier GPU (Small Texture Size)', () => {
            setMockGL('Unknown GPU', 'Unknown Vendor', 1024);
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('low');
        });

        it('should handle unknown GPU', () => {
            setMockGL('Unknown Renderer', 'Unknown Vendor', 2048); // Middle texture size, unknown names
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('unknown');
        });

        it('should handle missing renderer/vendor', () => {
            setMockGL(null, null);
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('unknown');
        });

        it('should handle GPU estimation error', () => {
            const mockGL = setMockGL('RTX 3080', 'NVIDIA');
            // Only throw when asking for RENDERER to ensure we reach estimateGPUTier
            mockGL.getParameter.mockImplementation((param) => {
                if (param === 'RENDERER') throw new Error('GL Error');
                return 4096; // Return valid for other calls
            });
            detector.detect();
            expect(detector.capabilities.gpuTier).toBe('unknown');
        });
    });

    describe('Device Characteristics', () => {
        it('should detect mobile device', () => {
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
                configurable: true,
            });
            detector.detect();
            expect(detector.capabilities.isMobile).toBe(true);
            expect(detector.capabilities.isLowEndDevice).toBe(true);
        });

        it('should detect low hardware concurrency', () => {
            Object.defineProperty(global.navigator, 'hardwareConcurrency', {
                value: 2,
                configurable: true,
            });
            detector.detect();
            expect(detector.capabilities.isLowEndDevice).toBe(true);
        });

        it('should detect low device memory', () => {
            Object.defineProperty(global.navigator, 'deviceMemory', {
                value: 2, // 2GB
                configurable: true,
            });
            detector.detect();
            expect(detector.capabilities.isLowEndDevice).toBe(true);
        });
    });

    describe('Post Processing Support', () => {
        it('should detect post processing support when THREE is present', () => {
            setMockGL('RTX 3080', 'NVIDIA');
            global.window.THREE = {
                EffectComposer: true,
                RenderPass: true,
                ShaderPass: true,
            };
            detector.detect();
            expect(detector.capabilities.postProcessingSupported).toBe(true);
        });

        it('should fail post processing if THREE is missing components', () => {
            setMockGL('RTX 3080', 'NVIDIA');
            global.window.THREE = {
                EffectComposer: true,
                // RenderPass missing
            };
            detector.detect();
            expect(detector.capabilities.postProcessingSupported).toBe(false);
        });
    });

    describe('Summary', () => {
        it('should return summary', () => {
            detector.detect();
            const summary = detector.getSummary();
            expect(summary).toHaveProperty('webgl');
            expect(summary).toHaveProperty('gpuTier');
        });
    });

    describe('Error Handling', () => {
        it('should handle WebGL context creation error', () => {
            const originalCreate = global.document.createElement;
            global.document.createElement = jest.fn().mockImplementation(() => {
                throw new Error('Canvas Fail');
            });
            detector.detectWebGLCapabilities();
            expect(detector.capabilities.webglSupported).toBe(false);
            global.document.createElement = originalCreate;
        });
    });
});
