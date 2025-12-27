/**
 * Mock factory for Web Audio API
 * Provides lightweight mocks for testing audio functionality
 */

/**
 * Create a mock AudioContext
 */
function createMockAudioContext() {
    return {
        state: 'running',
        sampleRate: 44100,
        currentTime: 0,
        destination: createMockAudioNode('destination'),
        listener: {
            positionX: { value: 0 },
            positionY: { value: 0 },
            positionZ: { value: 0 },
            forwardX: { value: 0 },
            forwardY: { value: 0 },
            forwardZ: { value: -1 },
            upX: { value: 0 },
            upY: { value: 1 },
            upZ: { value: 0 },
        },
        createBufferSource: jest.fn(() => createMockAudioBufferSourceNode()),
        createGain: jest.fn(() => createMockGainNode()),
        createPanner: jest.fn(() => createMockPannerNode()),
        createAnalyser: jest.fn(() => createMockAnalyserNode()),
        createBiquadFilter: jest.fn(() => createMockBiquadFilterNode()),
        createBuffer: jest.fn((channels, length, sampleRate) =>
            createMockAudioBuffer(channels, length, sampleRate)
        ),
        decodeAudioData: jest.fn((arrayBuffer) =>
            Promise.resolve(createMockAudioBuffer(2, 44100, 44100))
        ),
        suspend: jest.fn(() => Promise.resolve()),
        resume: jest.fn(() => Promise.resolve()),
        close: jest.fn(() => Promise.resolve()),
    };
}

/**
 * Create a mock AudioBuffer
 */
function createMockAudioBuffer(numberOfChannels = 2, length = 44100, sampleRate = 44100) {
    return {
        numberOfChannels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: jest.fn((channel) => new Float32Array(length)),
        copyFromChannel: jest.fn(),
        copyToChannel: jest.fn(),
    };
}

/**
 * Create a mock AudioNode
 */
function createMockAudioNode(type = 'AudioNode') {
    return {
        type,
        context: null,
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 2,
        channelCountMode: 'max',
        channelInterpretation: 'speakers',
        connect: jest.fn(),
        disconnect: jest.fn(),
    };
}

/**
 * Create a mock AudioBufferSourceNode
 */
function createMockAudioBufferSourceNode() {
    const node = createMockAudioNode('AudioBufferSourceNode');
    return {
        ...node,
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: { value: 1 },
        detune: { value: 0 },
        start: jest.fn(),
        stop: jest.fn(),
        onended: null,
    };
}

/**
 * Create a mock GainNode
 */
function createMockGainNode() {
    const node = createMockAudioNode('GainNode');
    return {
        ...node,
        gain: {
            value: 1,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            setTargetAtTime: jest.fn(),
        },
    };
}

/**
 * Create a mock PannerNode
 */
function createMockPannerNode() {
    const node = createMockAudioNode('PannerNode');
    return {
        ...node,
        panningModel: 'equalpower',
        distanceModel: 'inverse',
        refDistance: 1,
        maxDistance: 10000,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        positionX: { value: 0 },
        positionY: { value: 0 },
        positionZ: { value: 0 },
        orientationX: { value: 1 },
        orientationY: { value: 0 },
        orientationZ: { value: 0 },
        setPosition: jest.fn(),
        setOrientation: jest.fn(),
    };
}

/**
 * Create a mock AnalyserNode
 */
function createMockAnalyserNode() {
    const node = createMockAudioNode('AnalyserNode');
    return {
        ...node,
        fftSize: 2048,
        frequencyBinCount: 1024,
        minDecibels: -100,
        maxDecibels: -30,
        smoothingTimeConstant: 0.8,
        getByteFrequencyData: jest.fn(),
        getByteTimeDomainData: jest.fn(),
        getFloatFrequencyData: jest.fn(),
        getFloatTimeDomainData: jest.fn(),
    };
}

/**
 * Create a mock BiquadFilterNode
 */
function createMockBiquadFilterNode() {
    const node = createMockAudioNode('BiquadFilterNode');
    return {
        ...node,
        type: 'lowpass',
        frequency: { value: 350 },
        detune: { value: 0 },
        Q: { value: 1 },
        gain: { value: 0 },
        getFrequencyResponse: jest.fn(),
    };
}

/**
 * Create a mock MediaElementAudioSourceNode
 */
function createMockMediaElementAudioSourceNode(mediaElement) {
    const node = createMockAudioNode('MediaElementAudioSourceNode');
    return {
        ...node,
        mediaElement,
    };
}

/**
 * Create a mock HTMLAudioElement
 */
function createMockAudioElement() {
    return {
        src: '',
        volume: 1,
        muted: false,
        paused: true,
        currentTime: 0,
        duration: 0,
        loop: false,
        playbackRate: 1,
        play: jest.fn(() => Promise.resolve()),
        pause: jest.fn(),
        load: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    };
}

module.exports = {
    createMockAudioContext,
    createMockAudioBuffer,
    createMockAudioNode,
    createMockAudioBufferSourceNode,
    createMockGainNode,
    createMockPannerNode,
    createMockAnalyserNode,
    createMockBiquadFilterNode,
    createMockMediaElementAudioSourceNode,
    createMockAudioElement,
};
