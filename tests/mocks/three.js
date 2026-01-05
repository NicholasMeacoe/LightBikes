/**
 * Comprehensive Three.js Mock System
 * Enhanced mocks for complete rendering pipeline testing
 */

/**
 * Create a mock Scene with enhanced functionality
 */
function createMockScene() {
    const children = [];
    return {
        add: jest.fn((obj) => {
            if (obj && !children.includes(obj)) {
                children.push(obj);
                obj.parent = this;
            }
        }),
        remove: jest.fn((obj) => {
            const index = children.indexOf(obj);
            if (index !== -1) {
                children.splice(index, 1);
                obj.parent = null;
            }
        }),
        children,
        traverse: jest.fn((callback) => {
            const traverse = (obj) => {
                callback(obj);
                if (obj.children) {
                    obj.children.forEach(traverse);
                }
            };
            traverse(this);
        }),
        getObjectByName: jest.fn((name) => {
            let found = null;
            this.traverse((obj) => {
                if (obj.name === name && !found) found = obj;
            });
            return found;
        }),
        background: null,
        fog: null,
        type: 'Scene',
        uuid: 'mock-scene-uuid',
        name: '',
        parent: null,
        visible: true,
        matrixAutoUpdate: true,
        matrix: createMockMatrix4(),
        matrixWorld: createMockMatrix4(),
        userData: {},
    };
}

/**
 * Create a mock Camera with enhanced functionality
 */
function createMockCamera(type = 'PerspectiveCamera') {
    const position = createMockVector3(0, 0, 0);
    const rotation = createMockEuler(0, 0, 0);

    return {
        type,
        position,
        rotation,
        lookAt: jest.fn((target) => {
            // Mock lookAt behavior
            if (target && typeof target === 'object') {
                // Simple mock calculation
                const direction = {
                    x: target.x - position.x,
                    y: target.y - position.y,
                    z: target.z - position.z,
                };
                // Update rotation based on direction (simplified)
                rotation.y = Math.atan2(direction.x, direction.z);
                rotation.x = Math.atan2(
                    -direction.y,
                    Math.sqrt(direction.x * direction.x + direction.z * direction.z)
                );
            }
        }),
        updateProjectionMatrix: jest.fn(),
        updateMatrix: jest.fn(),
        updateMatrixWorld: jest.fn(),
        aspect: 1,
        fov: 75,
        near: 0.1,
        far: 1000,
        zoom: 1,
        focus: 10,
        filmGauge: 35,
        filmOffset: 0,
        view: null,
        matrix: createMockMatrix4(),
        matrixWorld: createMockMatrix4(),
        matrixWorldInverse: createMockMatrix4(),
        projectionMatrix: createMockMatrix4(),
        projectionMatrixInverse: createMockMatrix4(),
        uuid: `mock-camera-${type}-uuid`,
        name: '',
        parent: null,
        children: [],
        up: createMockVector3(0, 1, 0),
        userData: {},
        layers: { mask: 1 },
        visible: true,
        castShadow: false,
        receiveShadow: false,
        frustumCulled: true,
        renderOrder: 0,
    };
}

/**
 * Create a mock WebGLRenderer with comprehensive functionality
 */
function createMockRenderer() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    return {
        domElement: canvas,
        render: jest.fn(),
        setSize: jest.fn((width, height, updateStyle = true) => {
            canvas.width = width;
            canvas.height = height;
            if (updateStyle) {
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            }
        }),
        getSize: jest.fn((target) => {
            const result = target || { width: 0, height: 0 };
            result.width = canvas.width;
            result.height = canvas.height;
            return result;
        }),
        setPixelRatio: jest.fn(),
        getPixelRatio: jest.fn(() => window.devicePixelRatio || 1),
        setClearColor: jest.fn(),
        getClearColor: jest.fn(() => createMockColor(0, 0, 0)),
        setClearAlpha: jest.fn(),
        getClearAlpha: jest.fn(() => 1),
        clear: jest.fn(),
        clearColor: jest.fn(),
        clearDepth: jest.fn(),
        clearStencil: jest.fn(),
        dispose: jest.fn(),
        forceContextLoss: jest.fn(),
        forceContextRestore: jest.fn(),
        getContext: jest.fn(() => ({
            canvas,
            drawingBufferWidth: canvas.width,
            drawingBufferHeight: canvas.height,
        })),
        getContextAttributes: jest.fn(() => ({
            alpha: true,
            antialias: true,
            depth: true,
            stencil: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
        })),
        shadowMap: {
            enabled: false,
            type: null,
            autoUpdate: true,
            needsUpdate: false,
        },
        outputEncoding: null,
        toneMapping: null,
        toneMappingExposure: 1,
        info: {
            memory: {
                geometries: 0,
                textures: 0,
            },
            render: {
                frame: 0,
                calls: 0,
                triangles: 0,
                points: 0,
                lines: 0,
            },
            programs: null,
        },
        capabilities: {
            isWebGL2: false,
            precision: 'highp',
            logarithmicDepthBuffer: false,
            maxTextures: 16,
            maxVertexTextures: 0,
            maxTextureSize: 2048,
            maxCubemapSize: 1024,
            maxAttributes: 16,
            maxVertexUniforms: 1024,
            maxVaryings: 8,
            maxFragmentUniforms: 1024,
            vertexTextures: false,
            floatFragmentTextures: false,
            floatVertexTextures: false,
        },
        extensions: {
            get: jest.fn(() => null),
        },
        state: {
            buffers: {
                color: { setClear: jest.fn() },
                depth: { setClear: jest.fn() },
                stencil: { setClear: jest.fn() },
            },
        },
        autoClear: true,
        autoClearColor: true,
        autoClearDepth: true,
        autoClearStencil: true,
        sortObjects: true,
        clippingPlanes: [],
        localClippingEnabled: false,
        gammaFactor: 2.0,
        physicallyCorrectLights: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
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
 * Create a mock Vector3 with full functionality
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
        copy: jest.fn(function (v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }),
        add: jest.fn(function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }),
        addScalar: jest.fn(function (s) {
            this.x += s;
            this.y += s;
            this.z += s;
            return this;
        }),
        sub: jest.fn(function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }),
        multiply: jest.fn(function (v) {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            return this;
        }),
        multiplyScalar: jest.fn(function (s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        }),
        divide: jest.fn(function (v) {
            this.x /= v.x;
            this.y /= v.y;
            this.z /= v.z;
            return this;
        }),
        divideScalar: jest.fn(function (s) {
            return this.multiplyScalar(1 / s);
        }),
        normalize: jest.fn(function () {
            const length = this.length();
            if (length !== 0) {
                this.divideScalar(length);
            }
            return this;
        }),
        length: jest.fn(function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }),
        lengthSq: jest.fn(function () {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }),
        distanceTo: jest.fn(function (v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }),
        distanceToSquared: jest.fn(function (v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return dx * dx + dy * dy + dz * dz;
        }),
        dot: jest.fn(function (v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }),
        cross: jest.fn(function (v) {
            const x = this.y * v.z - this.z * v.y;
            const y = this.z * v.x - this.x * v.z;
            const z = this.x * v.y - this.y * v.x;
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }),
        clone: jest.fn(function () {
            return createMockVector3(this.x, this.y, this.z);
        }),
        equals: jest.fn(function (v) {
            return this.x === v.x && this.y === v.y && this.z === v.z;
        }),
        fromArray: jest.fn(function (array, offset = 0) {
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            return this;
        }),
        toArray: jest.fn(function (array = [], offset = 0) {
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            return array;
        }),
        lerp: jest.fn(function (v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            return this;
        }),
        applyMatrix4: jest.fn(function (m) {
            // Simplified matrix application
            const x = this.x,
                y = this.y,
                z = this.z;
            const e = m.elements;
            this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
            this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
            this.z = e[2] * x + e[6] * y + e[10] * z + e[14];
            return this;
        }),
        isVector3: true,
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

/**
 * Create a mock Matrix4
 */
function createMockMatrix4() {
    const elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    return {
        elements,
        set: jest.fn(),
        identity: jest.fn(function () {
            this.elements.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            return this;
        }),
        copy: jest.fn(),
        multiply: jest.fn(),
        multiplyMatrices: jest.fn(),
        makeTranslation: jest.fn(),
        makeRotationX: jest.fn(),
        makeRotationY: jest.fn(),
        makeRotationZ: jest.fn(),
        makeScale: jest.fn(),
        compose: jest.fn(),
        decompose: jest.fn(),
        lookAt: jest.fn(),
        clone: jest.fn(() => createMockMatrix4()),
        isMatrix4: true,
    };
}

/**
 * Create a mock Euler
 */
function createMockEuler(x = 0, y = 0, z = 0, order = 'XYZ') {
    return {
        x,
        y,
        z,
        order,
        set: jest.fn(function (nx, ny, nz, norder) {
            this.x = nx;
            this.y = ny;
            this.z = nz;
            this.order = norder || this.order;
            return this;
        }),
        copy: jest.fn(),
        setFromRotationMatrix: jest.fn(),
        setFromQuaternion: jest.fn(),
        clone: jest.fn(() => createMockEuler(x, y, z, order)),
        equals: jest.fn(),
        fromArray: jest.fn(),
        toArray: jest.fn(),
        isEuler: true,
    };
}

/**
 * Create a mock Quaternion
 */
function createMockQuaternion(x = 0, y = 0, z = 0, w = 1) {
    return {
        x,
        y,
        z,
        w,
        set: jest.fn(),
        copy: jest.fn(),
        setFromEuler: jest.fn(),
        setFromAxisAngle: jest.fn(),
        multiply: jest.fn(),
        slerp: jest.fn(),
        normalize: jest.fn(),
        clone: jest.fn(() => createMockQuaternion(x, y, z, w)),
        isQuaternion: true,
    };
}

/**
 * Create a mock EffectComposer for post-processing
 */
function createMockEffectComposer(renderer, renderTarget) {
    return {
        renderer,
        renderTarget1: renderTarget,
        renderTarget2: renderTarget,
        writeBuffer: renderTarget,
        readBuffer: renderTarget,
        passes: [],
        copyPass: null,
        clock: { getDelta: jest.fn(() => 0.016) },
        addPass: jest.fn(function (pass) {
            this.passes.push(pass);
        }),
        insertPass: jest.fn(),
        removePass: jest.fn(),
        render: jest.fn(),
        reset: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
    };
}

/**
 * Create a mock RenderPass
 */
function createMockRenderPass(scene, camera, overrideMaterial, clearColor, clearAlpha) {
    return {
        scene,
        camera,
        overrideMaterial,
        clearColor,
        clearAlpha,
        clear: true,
        clearDepth: true,
        needsSwap: true,
        enabled: true,
        renderToScreen: false,
        render: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
    };
}

/**
 * Create a mock UnrealBloomPass
 */
function createMockUnrealBloomPass(resolution, strength, radius, threshold) {
    return {
        resolution: resolution || createMockVector2(256, 256),
        strength: strength || 1.0,
        radius: radius || 0.4,
        threshold: threshold || 0.85,
        clearColor: createMockColor(0, 0, 0),
        renderTargetsHorizontal: [],
        renderTargetsVertical: [],
        nMips: 5,
        renderTargetBright: null,
        highPassUniforms: {},
        materialHighPassFilter: null,
        separableBlurMaterials: [],
        compositeMaterial: null,
        bloomFactors: [1.0, 0.8, 0.6, 0.4, 0.2],
        bloomRadius: 0.4,
        bloomStrength: 1.0,
        bloomThreshold: 0.85,
        enabled: true,
        needsSwap: true,
        renderToScreen: false,
        render: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
    };
}

/**
 * Create a mock Vector2
 */
function createMockVector2(x = 0, y = 0) {
    return {
        x,
        y,
        set: jest.fn(function (nx, ny) {
            this.x = nx;
            this.y = ny;
            return this;
        }),
        copy: jest.fn(),
        add: jest.fn(),
        sub: jest.fn(),
        multiply: jest.fn(),
        multiplyScalar: jest.fn(),
        divide: jest.fn(),
        divideScalar: jest.fn(),
        length: jest.fn(() => Math.sqrt(x * x + y * y)),
        normalize: jest.fn(),
        distanceTo: jest.fn(),
        clone: jest.fn(() => createMockVector2(x, y)),
        equals: jest.fn(),
        isVector2: true,
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
    createMockVector2,
    createMockColor,
    createMockTexture,
    createMockGroup,
    createMockRaycaster,
    createMockMatrix4,
    createMockEuler,
    createMockQuaternion,
    createMockEffectComposer,
    createMockRenderPass,
    createMockUnrealBloomPass,
};
