/**
 * Tests for CameraEffectsManager
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);
    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

// Mock DeviceCapabilityDetector to return high-end capabilities by default
jest.mock('@/utils/DeviceCapabilityDetector.js', () => {
    return {
        DeviceCapabilityDetector: jest.fn().mockImplementation(() => ({
            detect: jest.fn().mockReturnValue({
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: false,
                gpuTier: 'high',
            }),
            capabilities: {
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: false,
                gpuTier: 'high',
            },
            getSummary: jest.fn().mockReturnValue('High-end Mock Device'),
        })),
    };
});

// Setup global THREE mock robustly
global.THREE = {
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }
        copy(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }
        clone() {
            return new global.THREE.Vector3(this.x, this.y, this.z);
        }
    },
};

describe('CameraEffectsManager', () => {
    let CameraEffectsManager;
    let cameraEffectsManager;
    let mockCamera, mockRenderer, mockGameState;

    beforeEach(() => {
        jest.resetModules();
        CameraEffectsManager = require('@/effects/CameraEffectsManager.js').CameraEffectsManager;

        mockCamera = {
            position: new global.THREE.Vector3(0, 20, 20),
        };

        mockRenderer = {
            render: jest.fn(),
            setSize: jest.fn(),
            domElement: document.createElement('canvas'),
        };

        mockGameState = {
            isPaused: false,
            gameStarted: true,
        };

        cameraEffectsManager = new CameraEffectsManager(mockCamera, mockRenderer, mockGameState);
        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        const result = cameraEffectsManager.initialize();
        expect(result).toBe(true);
        expect(cameraEffectsManager.initialized).toBe(true);
        expect(cameraEffectsManager.isEnabled()).toBe(true);
    });

    it('should enable and disable effects', () => {
        cameraEffectsManager.initialize();
        expect(cameraEffectsManager.isEnabled()).toBe(true);
        cameraEffectsManager.setEnabled(false);
        expect(cameraEffectsManager.isEnabled()).toBe(false);
    });

    it('should provide status information', () => {
        cameraEffectsManager.initialize();
        const status = cameraEffectsManager.getStatus();
        expect(status.initialized).toBe(true);
        expect(status.enabled).toBe(true);
    });
});
