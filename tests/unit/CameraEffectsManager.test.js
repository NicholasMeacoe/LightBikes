/**
 * Tests for CameraEffectsManager
 * Focuses on core functional logic and integration points
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { CameraEffectsManager } = require('@/effects/CameraEffectsManager.js');

// Mock THREE.js objects for testing
const mockCamera = {
    position: {
        x: 0,
        y: 20,
        z: 20,
        clone: () => ({ x: 0, y: 20, z: 20 }),
        copy: (pos) => {
            mockCamera.position.x = pos.x;
            mockCamera.position.y = pos.y;
            mockCamera.position.z = pos.z;
        },
    },
};

const mockRenderer = {
    domElement: {},
    setSize: jest.fn(),
    render: jest.fn(),
};

const mockGameState = {
    isPaused: false,
    gameStarted: true,
};

describe('CameraEffectsManager', () => {
    let cameraEffectsManager;

    beforeEach(() => {
        cameraEffectsManager = new CameraEffectsManager(mockCamera, mockRenderer, mockGameState);
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize successfully with valid parameters', () => {
            const result = cameraEffectsManager.initialize();

            expect(result).toBe(true);
            expect(cameraEffectsManager.initialized).toBe(true);
            expect(cameraEffectsManager.originalCameraPosition).toEqual({ x: 0, y: 20, z: 20 });
        });

        it('should fail initialization without camera', () => {
            const manager = new CameraEffectsManager(null, mockRenderer, mockGameState);
            const result = manager.initialize();

            expect(result).toBe(false);
            expect(manager.initialized).toBe(false);
        });

        it('should fail initialization without renderer', () => {
            const manager = new CameraEffectsManager(mockCamera, null, mockGameState);
            const result = manager.initialize();

            expect(result).toBe(false);
            expect(manager.initialized).toBe(false);
        });
    });

    describe('event handling', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should handle collision events with valid parameters', () => {
            const entity = { id: 'player', x: 5, y: 0, z: 5 };
            const intensity = 0.8;

            // Should not throw error
            expect(() => {
                cameraEffectsManager.onCollision(entity, intensity);
            }).not.toThrow();
        });

        it('should handle near-miss events with valid parameters', () => {
            const entity = { id: 'ai_1', x: 3, y: 0, z: 3 };
            const distance = 1.2;

            // Should not throw error
            expect(() => {
                cameraEffectsManager.onNearMiss(entity, distance);
            }).not.toThrow();
        });

        it('should handle speed change events with valid parameters', () => {
            const entity = { id: 'player', x: 0, y: 0, z: 0 };
            const newSpeed = 2.5;

            // Should not throw error
            expect(() => {
                cameraEffectsManager.onSpeedChange(entity, newSpeed);
            }).not.toThrow();
        });

        it('should clamp collision intensity to valid range', () => {
            const entity = { id: 'player' };
            const mockHandler = jest.fn();

            cameraEffectsManager.addEventListener('collision', mockHandler);

            // Test intensity clamping
            cameraEffectsManager.onCollision(entity, 1.5); // Should clamp to 1.0
            expect(mockHandler).toHaveBeenCalledWith({ entity, intensity: 1.0 });

            cameraEffectsManager.onCollision(entity, -0.5); // Should clamp to 0.0
            expect(mockHandler).toHaveBeenCalledWith({ entity, intensity: 0.0 });
        });

        it('should ignore invalid near-miss distances', () => {
            const entity = { id: 'ai_1' };
            const mockHandler = jest.fn();

            cameraEffectsManager.addEventListener('nearMiss', mockHandler);

            // Test invalid distances
            cameraEffectsManager.onNearMiss(entity, -1.0); // Negative distance
            cameraEffectsManager.onNearMiss(entity, 5.0); // Too far

            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('should ignore invalid speed values', () => {
            const entity = { id: 'player' };
            const mockHandler = jest.fn();

            cameraEffectsManager.addEventListener('speedChange', mockHandler);

            // Test invalid speeds
            cameraEffectsManager.onSpeedChange(entity, -1.0); // Negative speed
            cameraEffectsManager.onSpeedChange(entity, 15.0); // Too fast

            expect(mockHandler).not.toHaveBeenCalled();
        });
    });

    describe('event listener management', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should register and notify event handlers', () => {
            const mockHandler = jest.fn();

            cameraEffectsManager.addEventListener('collision', mockHandler);

            const entity = { id: 'player' };
            cameraEffectsManager.onCollision(entity, 0.5);

            expect(mockHandler).toHaveBeenCalledWith({ entity, intensity: 0.5 });
        });

        it('should remove event handlers', () => {
            const mockHandler = jest.fn();

            cameraEffectsManager.addEventListener('collision', mockHandler);
            cameraEffectsManager.removeEventListener('collision', mockHandler);

            const entity = { id: 'player' };
            cameraEffectsManager.onCollision(entity, 0.5);

            expect(mockHandler).not.toHaveBeenCalled();
        });

        it('should handle multiple event handlers', () => {
            const mockHandler1 = jest.fn();
            const mockHandler2 = jest.fn();

            cameraEffectsManager.addEventListener('collision', mockHandler1);
            cameraEffectsManager.addEventListener('collision', mockHandler2);

            const entity = { id: 'player' };
            cameraEffectsManager.onCollision(entity, 0.5);

            expect(mockHandler1).toHaveBeenCalledWith({ entity, intensity: 0.5 });
            expect(mockHandler2).toHaveBeenCalledWith({ entity, intensity: 0.5 });
        });
    });

    describe('enable/disable functionality', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should enable and disable effects', () => {
            expect(cameraEffectsManager.isEnabled()).toBe(true);

            cameraEffectsManager.setEnabled(false);
            expect(cameraEffectsManager.isEnabled()).toBe(false);

            cameraEffectsManager.setEnabled(true);
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });

        it('should not process events when disabled', () => {
            const mockHandler = jest.fn();
            cameraEffectsManager.addEventListener('collision', mockHandler);

            cameraEffectsManager.setEnabled(false);

            const entity = { id: 'player' };
            cameraEffectsManager.onCollision(entity, 0.5);

            expect(mockHandler).not.toHaveBeenCalled();
        });
    });

    describe('update and performance tracking', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should update without errors', () => {
            expect(() => {
                cameraEffectsManager.update(0.016); // 60fps delta time
            }).not.toThrow();
        });

        it('should track performance metrics', () => {
            cameraEffectsManager.update(0.016);
            cameraEffectsManager.update(0.02);

            const metrics = cameraEffectsManager.getPerformanceMetrics();

            expect(metrics).toHaveProperty('currentFPS');
            expect(metrics).toHaveProperty('averageFrameTime');
            expect(metrics).toHaveProperty('frameCount');
            expect(metrics).toHaveProperty('isPerformanceGood');
            expect(typeof metrics.currentFPS).toBe('number');
            expect(metrics.frameCount).toBeGreaterThan(0);
        });

        it('should not update when disabled', () => {
            cameraEffectsManager.setEnabled(false);

            const initialFrameCount = cameraEffectsManager.performanceMetrics.frameCount;
            cameraEffectsManager.update(0.016);

            expect(cameraEffectsManager.performanceMetrics.frameCount).toBe(initialFrameCount);
        });
    });

    describe('pause and resume', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should pause and resume without errors', () => {
            expect(() => {
                cameraEffectsManager.pause();
                cameraEffectsManager.resume();
            }).not.toThrow();
        });
    });

    describe('camera position management', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should reset camera position when disabled', () => {
            // Modify camera position
            mockCamera.position.x = 10;
            mockCamera.position.y = 25;
            mockCamera.position.z = 30;

            cameraEffectsManager.setEnabled(false);

            // Camera position should be reset to original
            expect(mockCamera.position.x).toBe(0);
            expect(mockCamera.position.y).toBe(20);
            expect(mockCamera.position.z).toBe(20);
        });
    });

    describe('status and debugging', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should provide comprehensive status information', () => {
            const status = cameraEffectsManager.getStatus();

            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('hasCamera');
            expect(status).toHaveProperty('hasRenderer');
            expect(status).toHaveProperty('eventHandlerCounts');
            expect(status).toHaveProperty('performanceMetrics');
            expect(status).toHaveProperty('subsystems');

            expect(status.initialized).toBe(true);
            expect(status.enabled).toBe(true);
            expect(status.hasCamera).toBe(true);
            expect(status.hasRenderer).toBe(true);
        });
    });

    describe('cleanup and destruction', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should clean up resources on destroy', () => {
            const mockHandler = jest.fn();
            cameraEffectsManager.addEventListener('collision', mockHandler);

            cameraEffectsManager.destroy();

            expect(cameraEffectsManager.initialized).toBe(false);
            expect(cameraEffectsManager.enabled).toBe(false);
            expect(cameraEffectsManager.originalCameraPosition).toBe(null);

            // Event handlers should be cleared
            const entity = { id: 'player' };
            cameraEffectsManager.onCollision(entity, 0.5);
            expect(mockHandler).not.toHaveBeenCalled();
        });
    });
});
