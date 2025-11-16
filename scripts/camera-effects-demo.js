/**
 * Demonstration script showing CameraEffectsManager integration
 * This script shows how the CameraEffectsManager integrates with the existing LightBikes architecture
 */

const { CameraEffectsManager } = require('./CameraEffectsManager.js');

// Mock camera and renderer for demonstration
const mockCamera = {
    position: {
        x: 0, y: 20, z: 20,
        clone: () => ({ x: 0, y: 20, z: 20 }),
        copy: function(pos) {
            this.x = pos.x;
            this.y = pos.y;
            this.z = pos.z;
        }
    }
};

const mockRenderer = {
    domElement: {},
    setSize: () => {},
    render: () => {}
};

const mockGameState = {
    isPaused: false,
    gameStarted: true
};

console.log('=== CameraEffectsManager Integration Demo ===\n');

// 1. Initialize the camera effects manager
console.log('1. Initializing CameraEffectsManager...');
const cameraEffectsManager = new CameraEffectsManager(mockCamera, mockRenderer, mockGameState);
const initResult = cameraEffectsManager.initialize();
console.log(`   Initialization result: ${initResult}`);
console.log(`   Status: ${JSON.stringify(cameraEffectsManager.getStatus(), null, 2)}\n`);

// 2. Demonstrate event handling
console.log('2. Testing event handling...');

// Add event listeners to demonstrate the event system
cameraEffectsManager.addEventListener('collision', (eventData) => {
    console.log(`   Collision event received: entity=${eventData.entity.id}, intensity=${eventData.intensity}`);
});

cameraEffectsManager.addEventListener('nearMiss', (eventData) => {
    console.log(`   Near-miss event received: entity=${eventData.entity.id}, distance=${eventData.distance}`);
});

cameraEffectsManager.addEventListener('speedChange', (eventData) => {
    console.log(`   Speed change event received: entity=${eventData.entity.id}, speed=${eventData.newSpeed}`);
});

// Trigger events
const playerEntity = { id: 'player', x: 0, y: 0, z: 0 };
const aiEntity = { id: 'ai_1', x: 5, y: 0, z: 5 };

cameraEffectsManager.onCollision(playerEntity, 0.8);
cameraEffectsManager.onNearMiss(aiEntity, 1.2);
cameraEffectsManager.onSpeedChange(playerEntity, 2.5);
console.log();

// 3. Demonstrate update loop integration
console.log('3. Testing update loop integration...');
console.log('   Simulating game loop updates...');
for (let i = 0; i < 5; i++) {
    const deltaTime = 0.016 + (Math.random() * 0.008); // Simulate variable frame time
    cameraEffectsManager.update(deltaTime);
    
    if (i === 2) {
        console.log('   Pausing effects...');
        cameraEffectsManager.pause();
    }
    if (i === 3) {
        console.log('   Resuming effects...');
        cameraEffectsManager.resume();
    }
}

const metrics = cameraEffectsManager.getPerformanceMetrics();
console.log(`   Performance metrics: FPS=${metrics.currentFPS.toFixed(1)}, Frame count=${metrics.frameCount}`);
console.log();

// 4. Demonstrate enable/disable functionality
console.log('4. Testing enable/disable functionality...');
console.log(`   Currently enabled: ${cameraEffectsManager.isEnabled()}`);

cameraEffectsManager.setEnabled(false);
console.log(`   After disabling: ${cameraEffectsManager.isEnabled()}`);
console.log(`   Camera position reset to: x=${mockCamera.position.x}, y=${mockCamera.position.y}, z=${mockCamera.position.z}`);

cameraEffectsManager.setEnabled(true);
console.log(`   After re-enabling: ${cameraEffectsManager.isEnabled()}`);
console.log();

// 5. Demonstrate error handling
console.log('5. Testing error handling...');
console.log('   Testing with invalid parameters...');
cameraEffectsManager.onCollision(null, 0.5); // Invalid entity
cameraEffectsManager.onNearMiss(aiEntity, -1.0); // Invalid distance
cameraEffectsManager.onSpeedChange(playerEntity, 'invalid'); // Invalid speed
console.log('   All invalid parameters handled gracefully (no errors thrown)');
console.log();

// 6. Show final status
console.log('6. Final system status:');
const finalStatus = cameraEffectsManager.getStatus();
console.log(`   Initialized: ${finalStatus.initialized}`);
console.log(`   Enabled: ${finalStatus.enabled}`);
console.log(`   Has camera: ${finalStatus.hasCamera}`);
console.log(`   Has renderer: ${finalStatus.hasRenderer}`);
console.log(`   Event handlers: ${JSON.stringify(finalStatus.eventHandlerCounts)}`);
console.log(`   Performance good: ${finalStatus.performanceMetrics.isPerformanceGood}`);
console.log();

// 7. Cleanup
console.log('7. Cleaning up...');
cameraEffectsManager.destroy();
console.log(`   After cleanup - Initialized: ${cameraEffectsManager.initialized}, Enabled: ${cameraEffectsManager.enabled}`);

console.log('\n=== Demo Complete ===');
console.log('CameraEffectsManager is ready for integration with camera shake and motion blur systems!');