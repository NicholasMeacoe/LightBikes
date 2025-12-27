/**
 * Test Utilities Module
 * Provides reusable mock factories and test helpers for LightBikes test suite
 */

/**
 * Creates a properly configured localStorage mock with all required methods
 * @returns {Object} Mock localStorage object with jest.fn() methods
 */
function createLocalStorageMock() {
    const store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach((k) => delete store[k]);
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((index) => Object.keys(store)[index] || null),
        store,
    };
}

/**
 * Creates a controlled performance.now() mock with time progression helpers
 * @param {number} startTime - Initial time value (default: 0)
 * @returns {jest.Mock} Mock function with advance(), setTime(), and reset() methods
 */
function createPerformanceNowMock(startTime = 0) {
    let currentTime = startTime;
    const mock = jest.fn(() => currentTime);

    mock.advance = (ms) => {
        currentTime += ms;
    };
    mock.setTime = (time) => {
        currentTime = time;
    };
    mock.reset = () => {
        currentTime = startTime;
    };

    return mock;
}

/**
 * Creates a matchMedia mock for testing media queries
 * @param {boolean} matches - Whether the media query matches (default: false)
 * @returns {Function} Mock matchMedia function
 */
function createMatchMediaMock(matches = false) {
    return jest.fn((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
}

/**
 * Creates a logger mock with all standard logging methods
 * @returns {Object} Mock logger with warn, info, error, debug methods
 */
function createLoggerMock() {
    return {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
}

/**
 * Creates a DOM element mock with common methods
 * @returns {Object} Mock DOM element
 */
function createDOMElementMock() {
    return {
        remove: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
        },
        style: {},
        offsetParent: {},
        offsetWidth: 100,
        offsetHeight: 100,
    };
}

/**
 * Creates an emissive material system mock for rendering tests
 * @returns {Object} Mock material system with all methods
 */
function createEmissiveMaterialSystemMock() {
    const trailTemplates = new Map();
    return {
        updateBikeMaterial: jest.fn(),
        updateTrailMaterialTemplate: jest.fn(),
        getBikeMaterial: jest.fn(() => ({ color: 0xffffff })),
        getTrailMaterial: jest.fn(() => ({ color: 0xffffff })),
        getTrailColorTemplate: jest.fn((playerId) => trailTemplates.get(playerId)),
        dispose: jest.fn(),
        trailTemplates,
    };
}

/**
 * Creates a complete renderer mock with all required methods
 * @returns {Object} Mock renderer with all THREE.js WebGLRenderer methods
 */
function createRendererMock() {
    return {
        render: jest.fn(),
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        getSize: jest.fn(() => ({ width: 800, height: 600, x: 800, y: 600 })),
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
        dispose: jest.fn(),
        setPixelRatio: jest.fn(),
        getPixelRatio: jest.fn(() => 1),
        getContext: jest.fn(),
        getDrawingBufferSize: jest.fn(() => ({ width: 800, height: 600 })),
        setDrawingBufferSize: jest.fn(),
    };
}

/**
 * Creates a CameraEffectsManager mock with all required methods
 * @param {Object} options - Optional configuration
 * @returns {Object} Mock CameraEffectsManager instance
 */
function createCameraEffectsManagerMock(options = {}) {
    return {
        initialize: jest.fn(() => true),
        update: jest.fn(),
        destroy: jest.fn(),
        onCollision: jest.fn(),
        onNearMiss: jest.fn(),
        onSpeedChange: jest.fn(),
        setEnabled: jest.fn(),
        isEnabled: jest.fn(() => true),
        getSettings: jest.fn(() => ({
            shakeEnabled: true,
            motionBlurEnabled: true,
            quality: 'high',
        })),
        updateSettings: jest.fn(),
        updateGameState: jest.fn(),
        render: jest.fn(),
        initialized: options.initialized !== undefined ? options.initialized : true,
        enabled: options.enabled !== undefined ? options.enabled : true,
        shakeController: {
            setEnabled: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
        },
        motionBlurController: {
            setEnabled: jest.fn(),
            initialize: jest.fn(),
            updateBlurIntensity: jest.fn(),
            getCurrentQuality: jest.fn(() => 'high'),
            destroy: jest.fn(),
        },
        errorHandler: {
            initialize: jest.fn(() => true),
            handleRuntimeError: jest.fn(),
            executeRecoveryStrategy: jest.fn(() => true),
            destroy: jest.fn(),
        },
        degradationManager: {
            initialize: jest.fn(() => true),
            update: jest.fn(),
            shouldEnableEffects: jest.fn(() => true),
            shouldEnableShake: jest.fn(() => true),
            setDegradationLevel: jest.fn(),
            destroy: jest.fn(),
        },
        performanceMetrics: {
            lastFrameTime: 0,
            averageFrameTime: 16.67,
            frameCount: 0,
        },
    };
}

/**
 * Creates a CustomizationManager mock with all required methods
 * @param {Object} options - Optional configuration
 * @returns {Object} Mock CustomizationManager instance
 */
function createCustomizationManagerMock(options = {}) {
    const defaultState = {
        bikeColor: '#00FF00',
        trailColor: '#00FF00',
        trailStyle: 'solid',
        arenaTheme: 'classic-grid',
    };

    return {
        setBikeColor: jest.fn(() => true),
        setTrailColor: jest.fn(() => true),
        setTrailStyle: jest.fn(() => true),
        setArenaTheme: jest.fn(() => true),
        enablePreviewMode: jest.fn(),
        disablePreviewMode: jest.fn(),
        applyChanges: jest.fn(),
        resetToDefaults: jest.fn(),
        getCurrentState: jest.fn(() => ({ ...defaultState })),
        getColorPresets: jest.fn(() => ({
            red: '#FF0000',
            blue: '#0000FF',
            green: '#00FF00',
            yellow: '#FFFF00',
            purple: '#800080',
            orange: '#FFA500',
            cyan: '#00FFFF',
            white: '#FFFFFF',
        })),
        getTrailStyles: jest.fn(() => ({
            solid: { opacity: 0.8, segments: 'continuous', effects: [] },
            dashed: { opacity: 0.8, segments: 'alternating', effects: [] },
            glowing: { opacity: 0.9, segments: 'continuous', effects: ['emissive', 'bloom'] },
            rainbow: { opacity: 0.8, segments: 'continuous', effects: ['color-cycle'] },
        })),
        getArenaThemes: jest.fn(() => ['classic-grid', 'neon-city', 'space', 'tron-legacy']),
        currentState: { ...defaultState },
        previewMode: false,
        renderingEngine: options.renderingEngine || {
            emissiveMaterialSystem: createEmissiveMaterialSystemMock(),
            scene: { traverse: jest.fn() },
            renderer: createRendererMock(),
            trailStyleRenderer: {
                setTrailStyle: jest.fn(),
            },
        },
        performanceOptimizer: {
            optimize: jest.fn(),
            dispose: jest.fn(),
        },
    };
}

/**
 * Creates an enhanced DOM element mock with additional UI properties
 * @param {Object} options - Optional configuration
 * @returns {Object} Enhanced mock DOM element
 */
function createEnhancedDOMElementMock(options = {}) {
    const element = createDOMElementMock();

    // Add UI-specific properties
    element.id = options.id || '';
    element.className = options.className || '';
    element.textContent = options.textContent || '';
    element.innerHTML = options.innerHTML || '';
    element.value = options.value || '';
    element.type = options.type || '';
    element.checked = options.checked || false;
    element.disabled = options.disabled || false;
    element.style = {
        display: options.style?.display || '',
        visibility: options.style?.visibility || '',
        opacity: options.style?.opacity || '',
        ...options.style,
    };
    element.dataset = options.dataset || {};
    element.children = options.children || [];
    element.parentNode = options.parentNode || null;
    element.querySelector = jest.fn((selector) => null);
    element.querySelectorAll = jest.fn((selector) => []);
    element.getElementsByClassName = jest.fn((className) => []);
    element.getElementsByTagName = jest.fn((tagName) => []);
    element.closest = jest.fn((selector) => null);
    element.matches = jest.fn((selector) => false);
    element.focus = jest.fn();
    element.blur = jest.fn();
    element.click = jest.fn();
    element.scrollIntoView = jest.fn();

    return element;
}

/**
 * Creates a complete THREE.js mock with commonly used classes
 * @returns {Object} Enhanced THREE.js mock
 */
function createCompleteThreeJSMock() {
    const baseMock = global.THREE || {};

    return {
        ...baseMock,
        Scene:
            baseMock.Scene ||
            jest.fn().mockImplementation(() => ({
                add: jest.fn(),
                remove: jest.fn(),
                traverse: jest.fn(),
                background: null,
            })),
        WebGLRenderer:
            baseMock.WebGLRenderer || jest.fn().mockImplementation(() => createRendererMock()),
        PerspectiveCamera:
            baseMock.PerspectiveCamera ||
            jest.fn().mockImplementation(() => ({
                position: { x: 0, y: 20, z: 20, clone: jest.fn(() => ({ x: 0, y: 20, z: 20 })) },
                rotation: { x: 0, y: 0, z: 0 },
                lookAt: jest.fn(),
                updateProjectionMatrix: jest.fn(),
            })),
        EffectComposer:
            baseMock.EffectComposer ||
            jest.fn().mockImplementation(() => ({
                addPass: jest.fn(),
                render: jest.fn(),
                setSize: jest.fn(),
                dispose: jest.fn(),
                passes: [],
            })),
        RenderPass: baseMock.RenderPass || jest.fn(),
        UnrealBloomPass:
            baseMock.UnrealBloomPass ||
            jest.fn().mockImplementation(() => ({
                strength: 1.0,
                radius: 0.4,
                threshold: 0.85,
                resolution: { x: 800, y: 600 },
                renderToScreen: false,
            })),
        Vector2:
            baseMock.Vector2 || jest.fn().mockImplementation((x, y) => ({ x: x || 0, y: y || 0 })),
        Vector3:
            baseMock.Vector3 ||
            jest.fn().mockImplementation((x, y, z) => ({
                x: x || 0,
                y: y || 0,
                z: z || 0,
                clone: jest.fn(() => ({ x: x || 0, y: y || 0, z: z || 0 })),
                copy: jest.fn(),
                distanceTo: jest.fn(() => 10),
                set: jest.fn(),
            })),
        Color:
            baseMock.Color ||
            jest.fn().mockImplementation((color) => ({
                setHex: jest.fn(),
                getHex: jest.fn(() => (typeof color === 'number' ? color : 0xffffff)),
                multiplyScalar: jest.fn().mockReturnThis(),
            })),
    };
}

module.exports = {
    createLocalStorageMock,
    createPerformanceNowMock,
    createMatchMediaMock,
    createLoggerMock,
    createDOMElementMock,
    createEnhancedDOMElementMock,
    createEmissiveMaterialSystemMock,
    createRendererMock,
    createCameraEffectsManagerMock,
    createCustomizationManagerMock,
    createCompleteThreeJSMock,
};
