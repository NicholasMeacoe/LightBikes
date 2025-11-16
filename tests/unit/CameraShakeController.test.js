const { CameraShakeController } = require('./CameraShakeController.js');
const { ShakeInstance } = require('./ShakeInstance.js');

// Mock Three.js camera
const createMockCamera = () => ({
    position: { x: 0, y: 10, z: 20 }
});

describe('CameraShakeController', () => {
    let controller;
    let mockCamera;

    beforeEach(() => {
        mockCamera = createMockCamera();
        controller = new CameraShakeController(mockCamera);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(controller.isEnabled()).toBe(true);
            expect(controller.getIntensityMultiplier()).toBe(1.0);
            expect(controller.getIntensitySetting()).toBe('medium');
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should store original camera position', () => {
            expect(controller.originalPosition).toEqual({ x: 0, y: 10, z: 20 });
        });

        it('should work without camera', () => {
            const controllerWithoutCamera = new CameraShakeController(null);
            expect(controllerWithoutCamera.originalPosition).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('intensity settings', () => {
        it('should set valid intensity settings', () => {
            controller.setIntensitySetting('low');
            expect(controller.getIntensitySetting()).toBe('low');

            controller.setIntensitySetting('HIGH');
            expect(controller.getIntensitySetting()).toBe('high');
        });

        it('should ignore invalid intensity settings', () => {
            const originalSetting = controller.getIntensitySetting();
            controller.setIntensitySetting('invalid');
            expect(controller.getIntensitySetting()).toBe(originalSetting);
        });

        it('should clear shakes when set to off', () => {
            controller.triggerCollisionShake();
            expect(controller.getActiveShakeCount()).toBe(1);

            controller.setIntensitySetting('off');
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should return available intensity settings', () => {
            const settings = controller.getAvailableIntensitySettings();
            expect(settings).toContain('off');
            expect(settings).toContain('low');
            expect(settings).toContain('medium');
            expect(settings).toContain('high');
        });
    });

    describe('collision shake', () => {
        it('should trigger collision shake with default values', () => {
            controller.triggerCollisionShake();
            expect(controller.getActiveShakeCount()).toBe(1);

            const shakeInfo = controller.getActiveShakesInfo()[0];
            expect(shakeInfo.type).toBe('collision');
            expect(shakeInfo.intensity).toBeGreaterThan(0);
        });

        it('should respect intensity bounds for collision shake', () => {
            controller.triggerCollisionShake(0.3); // Below minimum
            controller.triggerCollisionShake(1.5); // Above maximum
            
            expect(controller.getActiveShakeCount()).toBe(2);
            // Both should be clamped to valid range
        });

        it('should not trigger when disabled', () => {
            controller.setEnabled(false);
            controller.triggerCollisionShake();
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should not trigger when intensity setting is off', () => {
            controller.setIntensitySetting('off');
            controller.triggerCollisionShake();
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should scale intensity based on user setting', () => {
            controller.setIntensitySetting('low');
            controller.triggerCollisionShake();
            const lowIntensity = controller.getActiveShakesInfo()[0].intensity;

            controller.clearAllShakes();
            controller.setIntensitySetting('high');
            controller.triggerCollisionShake();
            const highIntensity = controller.getActiveShakesInfo()[0].intensity;

            expect(highIntensity).toBeGreaterThan(lowIntensity);
        });
    });

    describe('near-miss shake', () => {
        it('should trigger near-miss shake with distance scaling', () => {
            controller.triggerNearMissShake(0.2); // Close distance
            const closeShake = controller.getActiveShakesInfo()[0];

            controller.clearAllShakes();
            controller.triggerNearMissShake(0.8); // Far distance
            const farShake = controller.getActiveShakesInfo()[0];

            expect(closeShake.intensity).toBeGreaterThan(farShake.intensity);
        });

        it('should clamp distance values', () => {
            controller.triggerNearMissShake(0.05); // Below minimum
            controller.triggerNearMissShake(1.5); // Above maximum
            
            expect(controller.getActiveShakeCount()).toBe(2);
        });

        it('should not trigger when disabled', () => {
            controller.setEnabled(false);
            controller.triggerNearMissShake();
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should not trigger when intensity setting is off', () => {
            controller.setIntensitySetting('off');
            controller.triggerNearMissShake();
            expect(controller.getActiveShakeCount()).toBe(0);
        });
    });

    describe('shake management', () => {
        it('should support multiple simultaneous shakes', () => {
            controller.triggerCollisionShake();
            controller.triggerNearMissShake();
            expect(controller.getActiveShakeCount()).toBe(2);
        });

        it('should clean up completed shakes', () => {
            // Create a very short shake
            controller.triggerCollisionShake(0.5, 0.001);
            expect(controller.getActiveShakeCount()).toBe(1);

            // Update with enough time to complete the shake
            controller.update(0.002);
            expect(controller.getActiveShakeCount()).toBe(0);
        });

        it('should clear all shakes', () => {
            controller.triggerCollisionShake();
            controller.triggerNearMissShake();
            expect(controller.getActiveShakeCount()).toBe(2);

            controller.clearAllShakes();
            expect(controller.getActiveShakeCount()).toBe(0);
        });
    });

    describe('camera position updates', () => {
        it('should apply shake offset to camera position', () => {
            const originalPos = { ...mockCamera.position };
            
            controller.triggerCollisionShake();
            controller.update(0.016); // One frame

            // Camera position should be different from original
            const positionChanged = 
                mockCamera.position.x !== originalPos.x ||
                mockCamera.position.y !== originalPos.y ||
                mockCamera.position.z !== originalPos.z;
            
            expect(positionChanged).toBe(true);
        });

        it('should reset camera position when disabled', () => {
            controller.triggerCollisionShake();
            controller.update(0.016);
            
            controller.setEnabled(false);
            
            expect(mockCamera.position.x).toBe(controller.originalPosition.x);
            expect(mockCamera.position.y).toBe(controller.originalPosition.y);
            expect(mockCamera.position.z).toBe(controller.originalPosition.z);
        });

        it('should update original position', () => {
            const newPosition = { x: 5, y: 15, z: 25 };
            controller.updateOriginalPosition(newPosition);
            
            expect(controller.originalPosition).toEqual(newPosition);
        });
    });

    describe('configuration', () => {
        it('should get shake configuration', () => {
            const config = controller.getShakeConfig();
            
            expect(config.collision).toBeDefined();
            expect(config.nearMiss).toBeDefined();
            expect(config.intensitySettings).toBeDefined();
            expect(config.currentSetting).toBe('medium');
        });

        it('should update shake configuration', () => {
            controller.updateShakeConfig('collision', { duration: 2.0 });
            const config = controller.getShakeConfig();
            
            expect(config.collision.defaultDuration).toBe(2.0);
        });

        it('should get effective intensity multiplier', () => {
            controller.setIntensitySetting('low');
            const multiplier = controller.getEffectiveIntensityMultiplier();
            
            expect(multiplier).toBe(0.5); // low setting * 1.0 base multiplier
        });
    });

    describe('update cycle', () => {
        it('should update active shakes', () => {
            controller.triggerCollisionShake();
            const initialInfo = controller.getActiveShakesInfo()[0];
            
            controller.update(0.1);
            const updatedInfo = controller.getActiveShakesInfo()[0];
            
            expect(updatedInfo.remaining).toBeLessThan(initialInfo.remaining);
        });

        it('should handle update without camera', () => {
            const controllerWithoutCamera = new CameraShakeController(null);
            controllerWithoutCamera.triggerCollisionShake();
            
            expect(() => {
                controllerWithoutCamera.update(0.016);
            }).not.toThrow();
        });

        it('should not update when disabled', () => {
            controller.triggerCollisionShake();
            controller.setEnabled(false);
            
            const offset = controller.getCurrentOffset();
            expect(offset.x).toBe(0);
            expect(offset.y).toBe(0);
            expect(offset.z).toBe(0);
        });
    });
});