// tests/setup.js

// Mock Three.js environment
const mockThreeJS = {
    Scene: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
        background: null,
    })),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        render: jest.fn(),
        getSize: jest.fn(() => ({ width: 800, height: 600, x: 800, y: 600 })),
        getPixelRatio: jest.fn(() => 1),
        setPixelRatio: jest.fn(),
        getContext: jest.fn(),
        getDrawingBufferSize: jest.fn(() => ({ width: 800, height: 600 })),
        setDrawingBufferSize: jest.fn(),
        dispose: jest.fn(),
        domElement: {
            width: 800,
            height: 600,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
        info: {
            render: { calls: 10, frame: 0, triangles: 0, points: 0, lines: 0 },
            memory: { geometries: 5, textures: 3, programs: 2 },
        },
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
        position: { x: 0, y: 20, z: 20, clone: jest.fn() },
    })),
    BoxGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    SphereGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    OctahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    ConeGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    IcosahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    PlaneGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    TorusGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    CylinderGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    MeshLambertMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        emissive: options.emissive,
        emissiveIntensity: options.emissiveIntensity,
        transparent: options.transparent,
        opacity: options.opacity,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    MeshBasicMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity,
        dispose: jest.fn(),
    })),
    Mesh: jest.fn().mockImplementation(() => ({
        position: { x: 0, y: 0, z: 0 },
        material: null,
        userData: {},
    })),
    Color: jest.fn().mockImplementation((color) => ({
        setHex: jest.fn(),
        getHex: jest.fn().mockReturnValue(color),
    })),
    Vector3: jest.fn().mockImplementation(() => ({
        distanceTo: jest.fn().mockReturnValue(10),
        set: jest.fn(),
    })),
    Euler: jest.fn().mockImplementation(() => ({
        set: jest.fn(),
    })),
    Quaternion: jest.fn().mockImplementation(() => ({
        setFromEuler: jest.fn(),
    })),
    Matrix4: jest.fn().mockImplementation(() => ({
        makeScale: jest.fn(),
        compose: jest.fn(),
    })),
    InstancedMesh: jest.fn().mockImplementation((geometry, material, count) => ({
        geometry,
        material,
        count: 0,
        instanceMatrix: {
            needsUpdate: false,
        },
        setMatrixAt: jest.fn(),
    })),
    GridHelper: jest.fn().mockImplementation(() => ({
        material: {
            color: { setHex: jest.fn() },
            opacity: 0.3,
            transparent: true,
            emissive: { setHex: jest.fn() },
            emissiveIntensity: 0,
        },
    })),
    AmbientLight: jest.fn().mockImplementation(() => ({
        color: { setHex: jest.fn() },
        intensity: 0.6,
        isAmbientLight: true,
    })),
    DirectionalLight: jest.fn().mockImplementation(() => ({
        color: { setHex: jest.fn() },
        intensity: 0.8,
        position: { set: jest.fn() },
        isDirectionalLight: true,
    })),
    BufferGeometry: jest.fn().mockImplementation(() => ({
        setAttribute: jest.fn(),
        dispose: jest.fn(),
    })),
    Float32BufferAttribute: jest
        .fn()
        .mockImplementation((array, itemSize) => ({ array, itemSize, isBufferAttribute: true })),
    BufferAttribute: jest
        .fn()
        .mockImplementation((array, itemSize) => ({ array, itemSize, isBufferAttribute: true })),
    PointsMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        size: options.size,
        transparent: options.transparent,
        opacity: options.opacity,
        dispose: jest.fn(),
    })),
    Points: jest.fn().mockImplementation((geometry, material) => ({
        geometry,
        material,
        isPoints: true,
        type: 'Points',
        frustumCulled: false, // Default to false for mocks
    })),
    LineBasicMaterial: jest.fn().mockImplementation((options) => ({
        color: { setHex: jest.fn().mockImplementation((hex) => (options.color = hex)) },
        opacity: options.opacity,
        transparent: options.transparent,
        dispose: jest.fn(),
        linewidth: options.linewidth, // Add linewidth if used
    })),
    LineSegments: jest.fn().mockImplementation((geometry, material) => ({
        geometry,
        material,
        isLineSegments: true,
        type: 'LineSegments',
        frustumCulled: false, // Default to false for mocks
    })),
    EffectComposer: jest.fn().mockImplementation(() => ({
        addPass: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
        passes: [],
        renderToScreen: false,
    })),
    RenderPass: jest.fn().mockImplementation(() => ({
        render: jest.fn(),
        setSize: jest.fn(),
        dispose: jest.fn(),
    })),
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
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 16));
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
    matches: false, // Default to no match
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
});
window.matchMedia = jest.fn().mockImplementation(mockMatchMedia);

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
