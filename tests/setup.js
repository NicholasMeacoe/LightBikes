// tests/setup.js

// Mock Three.js environment
const mockThreeJS = {
    Scene: function () {
        return {
            add: jest.fn(),
            remove: jest.fn(),
            traverse: jest.fn(),
            background: null,
            children: [],
        };
    },
    WebGLRenderer: function () {
        const domElement = document.createElement('canvas');
        domElement.width = 800;
        domElement.height = 600;
        return {
            setSize: jest.fn(),
            setClearColor: jest.fn(),
            render: jest.fn(),
            getSize: jest.fn(() => ({ width: 800, height: 600 })),
            getPixelRatio: jest.fn(() => 1),
            setPixelRatio: jest.fn(),
            getContext: jest.fn(),
            dispose: jest.fn(),
            domElement: domElement,
            info: {
                render: { calls: 0, frame: 0, triangles: 0, points: 0, lines: 0 },
                memory: { geometries: 0, textures: 0, programs: 0 },
            },
        };
    },
    PerspectiveCamera: function () {
        return {
            position: {
                x: 0,
                y: 20,
                z: 20,
                set: function (x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                    return this;
                },
                copy: function (v) {
                    this.x = v.x;
                    this.y = v.y;
                    this.z = v.z;
                    return this;
                },
                clone: function () {
                    return { ...this };
                },
            },
            lookAt: jest.fn(),
            updateProjectionMatrix: jest.fn(),
        };
    },
    BoxGeometry: function () {
        return { dispose: jest.fn() };
    },
    SphereGeometry: function () {
        return { dispose: jest.fn() };
    },
    OctahedronGeometry: function () {
        return { dispose: jest.fn() };
    },
    ConeGeometry: function () {
        return { dispose: jest.fn() };
    },
    IcosahedronGeometry: function () {
        return { dispose: jest.fn() };
    },
    PlaneGeometry: function () {
        return { dispose: jest.fn() };
    },
    TorusGeometry: function () {
        return { dispose: jest.fn() };
    },
    CylinderGeometry: function () {
        return { dispose: jest.fn() };
    },
    MeshLambertMaterial: function (options = {}) {
        return {
            color: options.color,
            emissive: options.emissive,
            emissiveIntensity: options.emissiveIntensity || 0,
            transparent: options.transparent,
            opacity: options.opacity || 1,
            dispose: jest.fn(),
            needsUpdate: false,
        };
    },
    MeshBasicMaterial: function (options = {}) {
        return {
            color: options.color,
            transparent: options.transparent,
            opacity: options.opacity || 1,
            dispose: jest.fn(),
        };
    },
    LineBasicMaterial: function (options = {}) {
        return {
            color: { setHex: jest.fn().mockImplementation((hex) => (options.color = hex)) },
            opacity: options.opacity || 1,
            transparent: options.transparent,
            dispose: jest.fn(),
            linewidth: options.linewidth,
        };
    },
    PointsMaterial: function (options = {}) {
        return {
            color: options.color,
            size: options.size,
            transparent: options.transparent,
            opacity: options.opacity || 1,
            dispose: jest.fn(),
        };
    },
    AmbientLight: function (color, intensity) {
        return {
            color: { setHex: jest.fn() },
            intensity: intensity || 1,
            isAmbientLight: true,
            dispose: jest.fn(),
        };
    },
    DirectionalLight: function (color, intensity) {
        return {
            color: { setHex: jest.fn() },
            intensity: intensity || 1,
            position: { set: jest.fn() },
            isDirectionalLight: true,
            dispose: jest.fn(),
        };
    },
    BoxHelper: function (object) {
        return {
            material: {},
            dispose: jest.fn(),
            update: jest.fn(),
            isBoxHelper: true,
        };
    },
    Mesh: function (geometry, material) {
        return {
            geometry,
            material,
            position: {
                x: 0,
                y: 0,
                z: 0,
                set: function (nx, ny, nz) {
                    this.x = nx;
                    this.y = ny;
                    this.z = nz;
                    return this;
                },
                copy: function (v) {
                    this.x = v.x;
                    this.y = v.y;
                    this.z = v.z;
                    return this;
                },
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0,
                set: jest.fn(),
            },
            scale: {
                x: 1,
                y: 1,
                z: 1,
                set: jest.fn(),
            },
            visible: true,
            userData: {},
            add: jest.fn(),
            remove: jest.fn(),
            dispose: function () {
                if (this.geometry) this.geometry.dispose();
                if (this.material) this.material.dispose();
            },
        };
    },
    Group: function () {
        return {
            add: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn(),
            children: [],
            position: { x: 0, y: 0, z: 0, set: jest.fn() },
            rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        };
    },
    Color: function (color) {
        return {
            setHex: jest.fn(),
            getHex: jest.fn().mockReturnValue(color),
            r: 1,
            g: 1,
            b: 1,
        };
    },
    Vector3: function (x = 0, y = 0, z = 0) {
        return {
            x,
            y,
            z,
            distanceTo: jest.fn().mockReturnValue(10),
            set: function (nx, ny, nz) {
                this.x = nx;
                this.y = ny;
                this.z = nz;
                return this;
            },
            copy: function (v) {
                this.x = v.x;
                this.y = v.y;
                this.z = v.z;
                return this;
            },
            clone: function () {
                return { ...this };
            },
            add: jest.fn().mockReturnThis(),
            sub: jest.fn().mockReturnThis(),
            multiplyScalar: jest.fn().mockReturnThis(),
            normalize: jest.fn().mockReturnThis(),
            length: jest.fn().mockReturnValue(0),
        };
    },
    Euler: function () {
        return {
            set: jest.fn(),
        };
    },
    Quaternion: function () {
        return {
            setFromEuler: jest.fn(),
        };
    },
    Matrix4: function () {
        return {
            makeScale: jest.fn().mockReturnThis(),
            compose: jest.fn().mockReturnThis(),
            makeTranslation: jest.fn().mockReturnThis(),
            makeRotationY: jest.fn().mockReturnThis(),
            identity: jest.fn().mockReturnThis(),
            multiply: jest.fn().mockReturnThis(),
        };
    },
    InstancedMesh: function (geometry, material, count) {
        return {
            geometry,
            material,
            count: count || 0,
            instanceMatrix: {
                needsUpdate: false,
            },
            setMatrixAt: jest.fn(),
            setColorAt: jest.fn(),
            dispose: jest.fn(),
            visible: true,
            position: { x: 0, y: 0, z: 0, set: jest.fn() },
        };
    },
    GridHelper: function (size, divisions) {
        return {
            material: {
                color: { setHex: jest.fn() },
                opacity: 0.3,
                transparent: true,
                emissive: { setHex: jest.fn() },
                emissiveIntensity: 0,
            },
            isGridHelper: true,
            dispose: jest.fn(),
        };
    },
    BufferGeometry: function () {
        return {
            setAttribute: jest.fn(),
            dispose: jest.fn(),
            setAttribute: jest.fn(),
            computeBoundingSphere: jest.fn(),
        };
    },
    Points: function (geometry, material) {
        return {
            geometry,
            material,
            isPoints: true,
            position: { x: 0, y: 0, z: 0, set: jest.fn() },
        };
    },
    LineSegments: function (geometry, material) {
        return {
            geometry,
            material,
            isLineSegments: true,
            position: { x: 0, y: 0, z: 0, set: jest.fn() },
        };
    },
    EffectComposer: function () {
        return {
            addPass: jest.fn(),
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        };
    },
    RenderPass: function () {
        return {
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
        };
    },
    UnrealBloomPass: jest.fn().mockImplementation(() => ({
        strength: 1.0,
        radius: 0.4,
        threshold: 0.85,
        resolution: { x: 800, y: 600 },
        renderToScreen: false,
        setSize: jest.fn(),
        dispose: jest.fn(),
    })),
    Vector2: jest.fn().mockImplementation((x, y) => ({ x: x || 0, y: y || 0 })),
    BoxHelper: jest.fn().mockImplementation(() => ({
        material: {},
        dispose: jest.fn(),
    })),
};

global.THREE = mockThreeJS;
global.performance = { now: jest.fn().mockReturnValue(1000) };
let rafIdCounter = 0;
global.requestAnimationFrame = function (callback) {
    const id = ++rafIdCounter;
    setTimeout(() => {
        if (typeof callback === 'function') {
            callback(performance.now());
        }
    }, 16);
    return id;
};
global.cancelAnimationFrame = function (id) {
    // Basic mock implementation
};
global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);

// Mock HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextId) => {
    if (contextId === '2d') {
        return {
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
            putImageData: jest.fn(),
            createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
            setTransform: jest.fn(),
            drawImage: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
            arc: jest.fn(),
            createRadialGradient: jest.fn(() => ({
                addColorStop: jest.fn(),
            })),
        };
    }
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {
            getExtension: jest.fn(),
            getParameter: jest.fn(() => 'Mock WebGL'),
            createShader: jest.fn(),
            shaderSource: jest.fn(),
            compileShader: jest.fn(),
            getShaderParameter: jest.fn(() => true),
            getShaderInfoLog: jest.fn(() => ''),
            createProgram: jest.fn(),
            attachShader: jest.fn(),
            linkProgram: jest.fn(),
            getProgramParameter: jest.fn(() => true),
            getProgramInfoLog: jest.fn(() => ''),
            useProgram: jest.fn(),
            getAttribLocation: jest.fn(),
            getUniformLocation: jest.fn(),
            enableVertexAttribArray: jest.fn(),
            vertexAttribPointer: jest.fn(),
            uniformMatrix4fv: jest.fn(),
            uniform1f: jest.fn(),
            uniform3f: jest.fn(),
            drawArrays: jest.fn(),
            createBuffer: jest.fn(),
            bindBuffer: jest.fn(),
            bufferData: jest.fn(),
            clearColor: jest.fn(),
            clear: jest.fn(),
            viewport: jest.fn(),
            canvas: { width: 800, height: 600 },
        };
    }
    return null;
});

// Helper function to create mock DOM elements
global.createMockDOMElement = (tagName, options = {}) => {
    const element = {
        tagName: tagName.toUpperCase(),
        id: options.id || '',
        className: options.className || '',
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
            toggle: jest.fn(),
        },
        style: {},
        dataset: options.dataset || {},
        value: options.value || '',
        textContent: options.textContent || '',
        innerHTML: options.innerHTML || '',
        children: [],
        parentNode: null,
        appendChild: jest.fn(function (child) {
            this.children.push(child);
            child.parentNode = this;
            return child;
        }),
        removeChild: jest.fn(function (child) {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                child.parentNode = null;
            }
            return child;
        }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        setAttribute: jest.fn((name, value) => {
            element[name] = value;
        }),
        getAttribute: jest.fn((name) => element[name]),
        hasAttribute: jest.fn((name) => element[name] !== undefined),
        removeAttribute: jest.fn((name) => {
            delete element[name];
        }),
        click: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        dispatchEvent: jest.fn(),
    };
    return element;
};

// Use JSDOM's native localStorage
// Mock specific methods in individual tests if needed using jest.spyOn()

// Mock window.matchMedia
const mockMatchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated but still used in some code
    removeListener: jest.fn(), // Deprecated but still used in some code
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
});

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: function (query) {
            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            };
        },
    });
}
global.matchMedia = window.matchMedia;

// Don't override document - use JSDOM's native document
// Mock specific methods in individual tests if needed using jest.spyOn()

// Mock AudioContext for music tests
const mockAudioContext = {
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
            value: 1,
            linearRampToValueAtTime: jest.fn(),
            setValueAtTime: jest.fn(),
        },
    })),
    createBufferSource: jest.fn(() => ({
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        loop: false,
        onended: null,
    })),
    decodeAudioData: jest.fn(),
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: jest.fn(() => Promise.resolve()),
};
global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

// Mock fetch for audio file loading
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
            get: jest.fn().mockReturnValue('audio/mpeg'),
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
);
