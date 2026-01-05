/**
 * Rendering Test Helpers
 * Utilities for testing Three.js rendering components
 */

const {
    createMockScene,
    createMockCamera,
    createMockRenderer,
    createMockVector3,
    createMockColor,
    createMockMesh,
    createMockMaterial,
    createMockGeometry,
    createMockLight,
    createMockEffectComposer,
    createMockRenderPass,
    createMockUnrealBloomPass,
} = require('../mocks/three.js');

/**
 * Create a complete rendering test environment
 */
function createRenderingTestEnvironment(options = {}) {
    const scene = createMockScene();
    const camera = createMockCamera('PerspectiveCamera');
    const renderer = createMockRenderer();

    // Set up camera position
    camera.position.set(0, 20, 20);
    camera.lookAt(createMockVector3(0, 0, 0));

    // Set up renderer
    renderer.setSize(options.width || 800, options.height || 600);
    renderer.setClearColor(createMockColor(0, 0, 0));

    return {
        scene,
        camera,
        renderer,

        // Helper methods
        addMesh: (geometry, material, position) => {
            const mesh = createMockMesh(geometry, material);
            if (position) {
                mesh.position.copy(position);
            }
            scene.add(mesh);
            return mesh;
        },

        addLight: (type = 'PointLight', position, color, intensity) => {
            const light = createMockLight(type);
            if (position) light.position.copy(position);
            if (color) light.color.copy(color);
            if (intensity !== undefined) light.intensity = intensity;
            scene.add(light);
            return light;
        },

        render: () => {
            renderer.render(scene, camera);
        },

        dispose: () => {
            renderer.dispose();
            scene.children.forEach((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        },
    };
}

/**
 * Create a post-processing test environment
 */
function createPostProcessingTestEnvironment(options = {}) {
    const environment = createRenderingTestEnvironment(options);
    const composer = createMockEffectComposer(environment.renderer);

    // Add render pass
    const renderPass = createMockRenderPass(environment.scene, environment.camera);
    composer.addPass(renderPass);

    // Add bloom pass if requested
    if (options.bloom !== false) {
        const bloomPass = createMockUnrealBloomPass(
            createMockVector2(256, 256),
            options.bloomStrength || 1.0,
            options.bloomRadius || 0.4,
            options.bloomThreshold || 0.85
        );
        composer.addPass(bloomPass);
    }

    return {
        ...environment,
        composer,
        renderPass,

        // Override render method
        render: () => {
            composer.render();
        },

        // Add pass helper
        addPass: (pass) => {
            composer.addPass(pass);
            return pass;
        },

        // Enhanced dispose
        dispose: () => {
            composer.dispose();
            environment.dispose();
        },
    };
}

/**
 * Create a trail rendering test setup
 */
function createTrailRenderingTest(playerCount = 2) {
    const environment = createRenderingTestEnvironment();
    const trails = [];

    for (let i = 0; i < playerCount; i++) {
        const trail = {
            playerId: i,
            segments: [],
            material: createMockMaterial('MeshBasicMaterial'),

            addSegment: function (position, size = { x: 1, y: 0.2, z: 1 }) {
                const geometry = createMockGeometry('BoxGeometry');
                const mesh = createMockMesh(geometry, this.material);
                mesh.position.copy(position);
                mesh.scale.set(size.x, size.y, size.z);

                this.segments.push(mesh);
                environment.scene.add(mesh);
                return mesh;
            },

            clear: function () {
                this.segments.forEach((segment) => {
                    environment.scene.remove(segment);
                    segment.geometry.dispose();
                });
                this.segments = [];
            },

            setColor: function (color) {
                this.material.color.copy(color);
            },
        };

        trails.push(trail);
    }

    return {
        ...environment,
        trails,

        getTrail: (playerId) => trails[playerId],

        clearAllTrails: () => {
            trails.forEach((trail) => trail.clear());
        },

        dispose: () => {
            trails.forEach((trail) => {
                trail.clear();
                trail.material.dispose();
            });
            environment.dispose();
        },
    };
}

/**
 * Create a lighting test setup
 */
function createLightingTestSetup(options = {}) {
    const environment = createRenderingTestEnvironment(options);

    // Add ambient light
    const ambientLight = environment.addLight(
        'AmbientLight',
        null,
        createMockColor(0.4, 0.4, 0.4),
        0.6
    );

    // Add directional light
    const directionalLight = environment.addLight(
        'DirectionalLight',
        createMockVector3(10, 10, 5),
        createMockColor(1, 1, 1),
        1
    );
    directionalLight.castShadow = true;

    // Add point lights for players
    const playerLights = [];
    for (let i = 0; i < (options.playerCount || 2); i++) {
        const light = environment.addLight(
            'PointLight',
            createMockVector3(0, 2, 0),
            createMockColor(i === 0 ? 0 : 1, i === 0 ? 1 : 0, 0),
            0.8
        );
        playerLights.push(light);
    }

    return {
        ...environment,
        ambientLight,
        directionalLight,
        playerLights,

        setPlayerLightPosition: (playerId, position) => {
            if (playerLights[playerId]) {
                playerLights[playerId].position.copy(position);
            }
        },

        setPlayerLightColor: (playerId, color) => {
            if (playerLights[playerId]) {
                playerLights[playerId].color.copy(color);
            }
        },
    };
}

/**
 * Create a material testing helper
 */
function createMaterialTestHelper() {
    const materials = new Map();

    return {
        createTestMaterial: (type = 'MeshBasicMaterial', options = {}) => {
            const material = createMockMaterial(type);

            // Apply options
            if (options.color) material.color.copy(options.color);
            if (options.opacity !== undefined) material.opacity = options.opacity;
            if (options.transparent !== undefined) material.transparent = options.transparent;
            if (options.emissive) material.emissive.copy(options.emissive);
            if (options.emissiveIntensity !== undefined)
                material.emissiveIntensity = options.emissiveIntensity;

            const id = `material_${materials.size}`;
            materials.set(id, material);

            return { id, material };
        },

        getMaterial: (id) => materials.get(id),

        updateMaterial: (id, updates) => {
            const material = materials.get(id);
            if (material) {
                Object.assign(material, updates);
                material.needsUpdate = true;
            }
            return material;
        },

        disposeMaterial: (id) => {
            const material = materials.get(id);
            if (material) {
                material.dispose();
                materials.delete(id);
            }
        },

        disposeAll: () => {
            materials.forEach((material) => material.dispose());
            materials.clear();
        },

        getMaterialCount: () => materials.size,
        getAllMaterials: () => Array.from(materials.values()),
    };
}

/**
 * Create a geometry testing helper
 */
function createGeometryTestHelper() {
    const geometries = new Map();

    return {
        createTestGeometry: (type = 'BoxGeometry', ...args) => {
            const geometry = createMockGeometry(type);

            // Set up basic properties based on type
            if (type === 'BoxGeometry') {
                geometry.parameters = {
                    width: args[0] || 1,
                    height: args[1] || 1,
                    depth: args[2] || 1,
                };
            }

            const id = `geometry_${geometries.size}`;
            geometries.set(id, geometry);

            return { id, geometry };
        },

        getGeometry: (id) => geometries.get(id),

        disposeGeometry: (id) => {
            const geometry = geometries.get(id);
            if (geometry) {
                geometry.dispose();
                geometries.delete(id);
            }
        },

        disposeAll: () => {
            geometries.forEach((geometry) => geometry.dispose());
            geometries.clear();
        },

        getGeometryCount: () => geometries.size,
        getAllGeometries: () => Array.from(geometries.values()),
    };
}

/**
 * Create a performance testing helper
 */
function createPerformanceTestHelper() {
    let frameCount = 0;
    let startTime = performance.now();
    let lastFrameTime = startTime;

    return {
        startFrame: () => {
            lastFrameTime = performance.now();
        },

        endFrame: () => {
            const currentTime = performance.now();
            const frameTime = currentTime - lastFrameTime;
            frameCount++;

            return {
                frameTime,
                frameCount,
                averageFrameTime: (currentTime - startTime) / frameCount,
                fps: 1000 / frameTime,
            };
        },

        reset: () => {
            frameCount = 0;
            startTime = performance.now();
            lastFrameTime = startTime;
        },

        getStats: () => {
            const currentTime = performance.now();
            const totalTime = currentTime - startTime;

            return {
                frameCount,
                totalTime,
                averageFrameTime: totalTime / frameCount,
                averageFPS: (frameCount * 1000) / totalTime,
            };
        },
    };
}

/**
 * Assertion helpers for rendering tests
 */
const renderingAssertions = {
    expectSceneToContain: (scene, objectType, count) => {
        const objects = scene.children.filter((child) => child.type === objectType);
        return { objects, count };
    },

    expectMaterialProperties: (material, expectedProperties) => {
        Object.entries(expectedProperties).forEach(([key, value]) => {
            if (typeof value === 'object' && value.r !== undefined) {
                // Color comparison
                expect(material[key].r).toBeCloseTo(value.r, 2);
                expect(material[key].g).toBeCloseTo(value.g, 2);
                expect(material[key].b).toBeCloseTo(value.b, 2);
            } else {
                expect(material[key]).toBe(value);
            }
        });
    },

    expectRenderCalls: (renderer, expectedCalls) => {
        expect(renderer.render).toHaveBeenCalledTimes(expectedCalls);
    },

    expectCameraPosition: (camera, expectedPosition, tolerance = 0.01) => {
        expect(camera.position.x).toBeCloseTo(expectedPosition.x, tolerance);
        expect(camera.position.y).toBeCloseTo(expectedPosition.y, tolerance);
        expect(camera.position.z).toBeCloseTo(expectedPosition.z, tolerance);
    },
};

module.exports = {
    createRenderingTestEnvironment,
    createPostProcessingTestEnvironment,
    createTrailRenderingTest,
    createLightingTestSetup,
    createMaterialTestHelper,
    createGeometryTestHelper,
    createPerformanceTestHelper,
    renderingAssertions,
};
