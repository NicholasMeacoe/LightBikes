/**
 * Global test setup file
 * Runs before all tests to set up common mocks and utilities
 */

// ============================================================================
// THREE.js Mocks
// ============================================================================

global.THREE = {
    // Geometries
    BoxGeometry: jest.fn().mockImplementation(() => ({})),
    CylinderGeometry: jest.fn().mockImplementation(() => ({})),
    SphereGeometry: jest.fn().mockImplementation(() => ({})),
    OctahedronGeometry: jest.fn().mockImplementation(() => ({})),
    TorusGeometry: jest.fn().mockImplementation(() => ({})),
    PlaneGeometry: jest.fn().mockImplementation(() => ({})),
    CircleGeometry: jest.fn().mockImplementation(() => ({})),
    ConeGeometry: jest.fn().mockImplementation(() => ({})),

    // Materials
    MeshLambertMaterial: jest.fn().mockImplementation((params) => ({ ...params, type: 'MeshLambertMaterial' })),
    MeshBasicMaterial: jest.fn().mockImplementation((params) => ({ ...params, type: 'MeshBasicMaterial' })),
    MeshPhongMaterial: jest.fn().mockImplementation((params) => ({ ...params, type: 'MeshPhongMaterial' })),
    MeshStandardMaterial: jest.fn().mockImplementation((params) => ({ ...params, type: 'MeshStandardMaterial' })),
    LineBasicMaterial: jest.fn().mockImplementation((params) => ({ ...params, type: 'LineBasicMaterial' })),

    // Core objects
    Mesh: jest.fn().mockImplementation((geometry, material) => ({
        geometry,
        material,
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        scale: { x: 1, y: 1, z: 1, set: jest.fn() },
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn()
    })),

    Scene: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        children: [],
        traverse: jest.fn()
    })),

    Camera: jest.fn().mockImplementation(() => ({
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn()
    })),

    PerspectiveCamera: jest.fn().mockImplementation(() => ({
        position: { x: 0, y: 0, z: 0, set: jest.fn() },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
        aspect: 1,
        fov: 75
    })),

    WebGLRenderer: jest.fn().mockImplementation(() => ({
        setSize: jest.fn(),
        render: jest.fn(),
        domElement: document.createElement('canvas'),
        setPixelRatio: jest.fn(),
        setClearColor: jest.fn()
    })),

    // Lights
    AmbientLight: jest.fn().mockImplementation(() => ({ intensity: 1 })),
    DirectionalLight: jest.fn().mockImplementation(() => ({
        intensity: 1,
        position: { x: 0, y: 0, z: 0, set: jest.fn() }
    })),
    PointLight: jest.fn().mockImplementation(() => ({
        intensity: 1,
        position: { x: 0, y: 0, z: 0, set: jest.fn() }
    })),

    // Utilities
    Color: jest.fn().mockImplementation((color) => ({
        setHex: jest.fn(),
        setRGB: jest.fn(),
        r: 0, g: 0, b: 0
    })),

    Vector2: jest.fn().mockImplementation((x, y) => ({ x: x || 0, y: y || 0 })),
    Vector3: jest.fn().mockImplementation((x, y, z) => ({
        x: x || 0,
        y: y || 0,
        z: z || 0,
        set: jest.fn(),
        add: jest.fn(),
        sub: jest.fn(),
        normalize: jest.fn()
    })),

    // Post-processing
    EffectComposer: jest.fn().mockImplementation(() => ({
        render: jest.fn(),
        addPass: jest.fn(),
        setSize: jest.fn()
    })),

    RenderPass: jest.fn().mockImplementation(() => ({})),
    UnrealBloomPass: jest.fn().mockImplementation(() => ({
        strength: 1,
        radius: 0,
        threshold: 0
    })),

    ShaderPass: jest.fn().mockImplementation(() => ({}))
};

// ============================================================================
// Web Audio API Mocks
// ============================================================================

global.AudioContext = jest.fn().mockImplementation(() => ({
    createGain: jest.fn(() => ({
        gain: {
            value: 0.7,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            cancelScheduledValues: jest.fn()
        },
        connect: jest.fn(),
        disconnect: jest.fn()
    })),
    createBufferSource: jest.fn(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
    })),
    decodeAudioData: jest.fn((arrayBuffer) => {
        return Promise.resolve({
            duration: 120.5,
            length: 5292000,
            numberOfChannels: 2,
            sampleRate: 44100,
            getChannelData: jest.fn(() => new Float32Array(1024))
        });
    }),
    createAnalyser: jest.fn(() => ({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: jest.fn(),
        getByteTimeDomainData: jest.fn(),
        connect: jest.fn()
    })),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: jest.fn().mockResolvedValue(),
    suspend: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue()
}));

global.webkitAudioContext = global.AudioContext;

// ============================================================================
// Fetch API Mock
// ============================================================================

global.fetch = jest.fn((url) => {
    const mockArrayBuffer = new ArrayBuffer(1024);
    return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
            get: (header) => {
                if (header === 'content-type') return 'audio/mpeg';
                return null;
            }
        },
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    });
});

// ============================================================================
// AbortController Mock
// ============================================================================

global.AbortController = class AbortController {
    constructor() {
        this.signal = { aborted: false };
    }
    abort() {
        this.signal.aborted = true;
    }
};

// ============================================================================
// Performance API Mock
// ============================================================================

if (!global.performance) {
    global.performance = {};
}

// Ensure all performance properties are set
Object.assign(global.performance, {
    now: global.performance.now || jest.fn(() => Date.now()),
    mark: global.performance.mark || jest.fn(),
    measure: global.performance.measure || jest.fn(),
    getEntriesByType: global.performance.getEntriesByType || jest.fn(() => []),
    clearMarks: global.performance.clearMarks || jest.fn(),
    clearMeasures: global.performance.clearMeasures || jest.fn(),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
    }
});

// ============================================================================
// LocalStorage Mock
// ============================================================================

const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
};

global.localStorage = localStorageMock;
global.sessionStorage = { ...localStorageMock };

// ============================================================================
// Window & Navigator Mocks
// ============================================================================

if (typeof window !== 'undefined') {
    window.matchMedia = jest.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }));

    window.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
    window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
}

if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
    });
}

// ============================================================================
// WebGL Context Mock
// ============================================================================

HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
        return {
            canvas: document.createElement('canvas'),
            getParameter: jest.fn((param) => {
                // WebGL constants
                if (param === 0x1F00) return 'WebGL Vendor'; // VENDOR
                if (param === 0x1F01) return 'WebGL Renderer'; // RENDERER
                if (param === 0x1F02) return 'WebGL 2.0'; // VERSION
                if (param === 0x0D33) return 16384; // MAX_TEXTURE_SIZE
                if (param === 0x84E8) return 16384; // MAX_RENDERBUFFER_SIZE
                return null;
            }),
            getSupportedExtensions: jest.fn(() => ['OES_texture_float', 'WEBGL_lose_context']),
            getExtension: jest.fn((name) => {
                if (name === 'WEBGL_lose_context') {
                    return {
                        loseContext: jest.fn(),
                        restoreContext: jest.fn()
                    };
                }
                return {};
            }),
            viewport: jest.fn(),
            clearColor: jest.fn(),
            clear: jest.fn(),
            enable: jest.fn(),
            disable: jest.fn(),
            blendFunc: jest.fn(),
            createShader: jest.fn(() => ({})),
            shaderSource: jest.fn(),
            compileShader: jest.fn(),
            createProgram: jest.fn(() => ({})),
            attachShader: jest.fn(),
            linkProgram: jest.fn(),
            useProgram: jest.fn(),
            createBuffer: jest.fn(() => ({})),
            bindBuffer: jest.fn(),
            bufferData: jest.fn(),
            drawArrays: jest.fn(),
            drawElements: jest.fn()
        };
    }
    if (contextType === '2d') {
        return {
            canvas: document.createElement('canvas'),
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest.fn(),
            putImageData: jest.fn(),
            createImageData: jest.fn(),
            setTransform: jest.fn(),
            drawImage: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            fillText: jest.fn(),
            measureText: jest.fn(() => ({ width: 0 })),
            beginPath: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn()
        };
    }
    return null;
});

// ============================================================================
// Console Suppression (optional - uncomment to reduce noise)
// ============================================================================

// Suppress console methods during tests to reduce noise
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn()
// };

// ============================================================================
// Custom Matchers
// ============================================================================

expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false
            };
        }
    }
});

// ============================================================================
// DOM Element Factory
// ============================================================================

/**
 * Create a mock DOM element with all common methods and properties
 * @param {string} tag - HTML tag name
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} Mocked DOM element
 */
global.createMockDOMElement = (tag = 'div', options = {}) => {
    const element = document.createElement(tag);

    // Ensure style object exists
    if (!element.style) {
        element.style = {};
    }

    // Add classList methods
    element.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn(),
        contains: jest.fn(() => false),
        value: options.className || ''
    };

    // Add event methods
    element.addEventListener = jest.fn();
    element.removeEventListener = jest.fn();
    element.dispatchEvent = jest.fn();

    // Add DOM traversal methods
    element.contains = jest.fn(() => false);
    element.querySelector = jest.fn(() => null);
    element.querySelectorAll = jest.fn(() => []);
    element.appendChild = jest.fn();
    element.removeChild = jest.fn();
    element.remove = jest.fn();

    // Add attribute methods
    element.getAttribute = jest.fn((attr) => element[attr] || null);
    element.setAttribute = jest.fn((attr, value) => { element[attr] = value; });
    element.removeAttribute = jest.fn((attr) => { delete element[attr]; });
    element.hasAttribute = jest.fn((attr) => attr in element);

    // Set optional properties
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.textContent) element.textContent = options.textContent;

    // Add dataset
    element.dataset = options.dataset || {};

    return element;
};

// ============================================================================
// Test Utilities
// ============================================================================

global.testUtils = {
    /**
     * Wait for a condition to be true
     */
    waitFor: async (condition, timeout = 1000) => {
        const startTime = Date.now();
        while (!condition()) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for condition');
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    },

    /**
     * Create a mock DOM element with common methods (alias)
     */
    createMockElement: (tag = 'div', options = {}) => {
        return global.createMockDOMElement(tag, options);
    }
};
