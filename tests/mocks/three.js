/**
 * Mock factory for Three.js objects
 * Provides lightweight mocks for testing without full Three.js dependency
 */

/**
 * Create a mock Scene
 */
function createMockScene() {
    return {
        add: jest.fn(),
        remove: jest.fn(),
        children: [],
        traverse: jest.fn(),
        getObjectByName: jest.fn(),
        background: null,
        fog: null,
    };
}

/**
 * Create a mock Camera
 */
function createMockCamera(type = 'PerspectiveCamera') {
    return {
        type,
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
        aspect: 1,
        fov: 75,
        near: 0.1,
        far: 1000,
    };
}

/**
 * Create a mock WebGLRenderer
 */
function createMockRenderer() {
    const canvas = document.createElement('canvas');
    return {
        domElement: canvas,
        render: jest.fn(),
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        setClearColor: jest.fn(),
        dispose: jest.fn(),
        shadowMap: { enabled: false, type: null },
        outputEncoding: null,
        toneMapping: null,
    };
}

/**
 * Create a mock Mesh
 */
function createMockMesh(geometry = null, material = null) {
    return {
        geometry: geometry || createMockGeometry(),
        material: material || createMockMaterial(),
        position: { x: 0, y: 0, z: 0, set: jest.fn(), copy: jest.fn() },
        rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        scale: { x: 1, y: 1, z: 1, set: jest.fn() },
        visible: true,
        castShadow: false,
        receiveShadow: false,
        userData: {},
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
    };
}

/**
 * Create a mock Material
 */
function createMockMaterial(type = 'MeshBasicMaterial') {
    return {
        type,
        color: { r: 1, g: 1, b: 1, set: jest.fn(), setHex: jest.fn() },
        opacity: 1,
        transparent: false,
        wireframe: false,
        side: 0,
        dispose: jest.fn(),
        needsUpdate: false,
        emissive: { r: 0, g: 0, b: 0, set: jest.fn() },
        emissiveIntensity: 1,
    };
}

/**
 * Create a mock Geometry
 */
function createMockGeometry(type = 'BoxGeometry') {
    return {
        type,
        dispose: jest.fn(),
        computeBoundingBox: jest.fn(),
        computeBoundingSphere: jest.fn(),
        attributes: {},
        index: null,
    };
}

/**
 * Create a mock Light
 */
function createMockLight(type = 'PointLight') {
    return {
        type,
        color: { r: 1, g: 1, b: 1, set: jest.fn(), setHex: jest.fn() },
        intensity: 1,
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        castShadow: false,
        shadow: {
            mapSize: { width: 512, height: 512 },
            camera: createMockCamera('OrthographicCamera'),
        },
    };
}

/**
 * Create a mock Vector3
 */
function createMockVector3(x = 0, y = 0, z = 0) {
    return {
        x,
        y,
        z,
        set: jest.fn(function (nx, ny, nz) {
            this.x = nx;
            this.y = ny;
            this.z = nz;
            return this;
        }),
        copy: jest.fn(),
        add: jest.fn(),
        sub: jest.fn(),
        multiply: jest.fn(),
        multiplyScalar: jest.fn(),
        normalize: jest.fn(),
        length: jest.fn(() => Math.sqrt(x * x + y * y + z * z)),
        distanceTo: jest.fn(),
        clone: jest.fn(function () {
            return createMockVector3(this.x, this.y, this.z);
        }),
    };
}

/**
 * Create a mock Color
 */
function createMockColor(r = 1, g = 1, b = 1) {
    return {
        r,
        g,
        b,
        set: jest.fn(),
        setHex: jest.fn(),
        setRGB: jest.fn(),
        getHex: jest.fn(() => ((r * 255) << 16) + ((g * 255) << 8) + b * 255),
        clone: jest.fn(function () {
            return createMockColor(this.r, this.g, this.b);
        }),
    };
}

/**
 * Create a mock Texture
 */
function createMockTexture() {
    return {
        image: null,
        needsUpdate: false,
        dispose: jest.fn(),
        wrapS: 1000,
        wrapT: 1000,
        minFilter: 1006,
        magFilter: 1006,
    };
}

/**
 * Create a mock Group
 */
function createMockGroup() {
    return {
        type: 'Group',
        children: [],
        add: jest.fn(function (obj) {
            this.children.push(obj);
        }),
        remove: jest.fn(function (obj) {
            const index = this.children.indexOf(obj);
            if (index !== -1) this.children.splice(index, 1);
        }),
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        scale: { x: 1, y: 1, z: 1, set: jest.fn() },
        traverse: jest.fn(),
    };
}

/**
 * Create a mock Raycaster
 */
function createMockRaycaster() {
    return {
        set: jest.fn(),
        setFromCamera: jest.fn(),
        intersectObjects: jest.fn(() => []),
        ray: {
            origin: createMockVector3(),
            direction: createMockVector3(),
        },
    };
}

module.exports = {
    createMockScene,
    createMockCamera,
    createMockRenderer,
    createMockMesh,
    createMockMaterial,
    createMockGeometry,
    createMockLight,
    createMockVector3,
    createMockColor,
    createMockTexture,
    createMockGroup,
    createMockRaycaster,
};
