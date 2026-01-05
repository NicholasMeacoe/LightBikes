/**
 * Enhanced Web Audio API Mock System
 * Comprehensive mocks for complete audio testing
 */

/**
 * Create a mock AudioContext with enhanced functionality
 */
function createMockAudioContext() {
    let currentTime = 0;
    const timeAdvance = () => {
        currentTime += 0.001;
    }; // Simulate time progression

    return {
        state: 'running',
        sampleRate: 44100,
        get currentTime() {
            return currentTime;
        },
        baseLatency: 0.005,
        outputLatency: 0.01,
        destination: createMockAudioNode('destination'),
        listener: {
            positionX: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            positionY: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            positionZ: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            forwardX: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            forwardY: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            forwardZ: { value: -1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            upX: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            upY: { value: 1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            upZ: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
            setPosition: jest.fn(),
            setOrientation: jest.fn(),
        },

        // Node creation methods
        createBufferSource: jest.fn(() => createMockAudioBufferSourceNode()),
        createGain: jest.fn(() => createMockGainNode()),
        createPanner: jest.fn(() => createMockPannerNode()),
        createAnalyser: jest.fn(() => createMockAnalyserNode()),
        createBiquadFilter: jest.fn(() => createMockBiquadFilterNode()),
        createConvolver: jest.fn(() => createMockConvolverNode()),
        createDelay: jest.fn((maxDelayTime = 1) => createMockDelayNode(maxDelayTime)),
        createDynamicsCompressor: jest.fn(() => createMockDynamicsCompressorNode()),
        createOscillator: jest.fn(() => createMockOscillatorNode()),
        createWaveShaper: jest.fn(() => createMockWaveShaperNode()),
        createChannelSplitter: jest.fn((numberOfOutputs = 6) =>
            createMockChannelSplitterNode(numberOfOutputs)
        ),
        createChannelMerger: jest.fn((numberOfInputs = 6) =>
            createMockChannelMergerNode(numberOfInputs)
        ),
        createStereoPanner: jest.fn(() => createMockStereoPannerNode()),
        createMediaElementSource: jest.fn((mediaElement) =>
            createMockMediaElementAudioSourceNode(mediaElement)
        ),
        createMediaStreamSource: jest.fn((mediaStream) =>
            createMockMediaStreamAudioSourceNode(mediaStream)
        ),

        // Buffer methods
        createBuffer: jest.fn((channels, length, sampleRate) =>
            createMockAudioBuffer(channels, length, sampleRate)
        ),
        decodeAudioData: jest.fn((arrayBuffer, successCallback, errorCallback) => {
            const buffer = createMockAudioBuffer(2, 44100, 44100);
            const promise = Promise.resolve(buffer);
            if (successCallback) {
                promise.then(successCallback);
            }
            return promise;
        }),

        // State control
        suspend: jest.fn(() => {
            this.state = 'suspended';
            return Promise.resolve();
        }),
        resume: jest.fn(() => {
            this.state = 'running';
            return Promise.resolve();
        }),
        close: jest.fn(() => {
            this.state = 'closed';
            return Promise.resolve();
        }),

        // Event handling
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onstatechange: null,

        // Mock utilities
        _advanceTime: timeAdvance,
        _setCurrentTime: (time) => {
            currentTime = time;
        },
        _mockType: 'AudioContext',
    };
}

/**
 * Create a mock AudioBuffer with enhanced functionality
 */
function createMockAudioBuffer(numberOfChannels = 2, length = 44100, sampleRate = 44100) {
    const channelData = {};
    for (let i = 0; i < numberOfChannels; i++) {
        channelData[i] = new Float32Array(length);
    }

    return {
        numberOfChannels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: jest.fn((channel) => {
            if (channel >= 0 && channel < numberOfChannels) {
                return channelData[channel];
            }
            throw new Error(`Index ${channel} is out of range`);
        }),
        copyFromChannel: jest.fn((destination, channelNumber, startInChannel = 0) => {
            const source = channelData[channelNumber];
            if (source) {
                destination.set(source.subarray(startInChannel));
            }
        }),
        copyToChannel: jest.fn((source, channelNumber, startInChannel = 0) => {
            const destination = channelData[channelNumber];
            if (destination) {
                destination.set(source, startInChannel);
            }
        }),
        _mockType: 'AudioBuffer',
        _channelData: channelData,
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

/**
 * Create additional audio node types
 */
function createMockConvolverNode() {
    const node = createMockAudioNode('ConvolverNode');
    return {
        ...node,
        buffer: null,
        normalize: true,
    };
}

function createMockDelayNode(maxDelayTime = 1) {
    const node = createMockAudioNode('DelayNode');
    return {
        ...node,
        delayTime: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
        },
        maxDelayTime,
    };
}

function createMockDynamicsCompressorNode() {
    const node = createMockAudioNode('DynamicsCompressorNode');
    return {
        ...node,
        threshold: { value: -24 },
        knee: { value: 30 },
        ratio: { value: 12 },
        attack: { value: 0.003 },
        release: { value: 0.25 },
        reduction: 0,
    };
}

function createMockOscillatorNode() {
    const node = createMockAudioNode('OscillatorNode');
    return {
        ...node,
        type: 'sine',
        frequency: {
            value: 440,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
        },
        detune: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
        },
        start: jest.fn(),
        stop: jest.fn(),
        setPeriodicWave: jest.fn(),
        onended: null,
    };
}

function createMockWaveShaperNode() {
    const node = createMockAudioNode('WaveShaperNode');
    return {
        ...node,
        curve: null,
        oversample: 'none',
    };
}

function createMockChannelSplitterNode(numberOfOutputs = 6) {
    const node = createMockAudioNode('ChannelSplitterNode');
    return {
        ...node,
        numberOfOutputs,
    };
}

function createMockChannelMergerNode(numberOfInputs = 6) {
    const node = createMockAudioNode('ChannelMergerNode');
    return {
        ...node,
        numberOfInputs,
    };
}

function createMockStereoPannerNode() {
    const node = createMockAudioNode('StereoPannerNode');
    return {
        ...node,
        pan: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
        },
    };
}

function createMockMediaStreamAudioSourceNode(mediaStream) {
    const node = createMockAudioNode('MediaStreamAudioSourceNode');
    return {
        ...node,
        mediaStream,
    };
}

/**
 * Create a mock PeriodicWave
 */
function createMockPeriodicWave() {
    return {
        _mockType: 'PeriodicWave',
    };
}

/**
 * Create a mock AudioWorkletNode
 */
function createMockAudioWorkletNode(context, name, options = {}) {
    const node = createMockAudioNode('AudioWorkletNode');
    return {
        ...node,
        parameters: new Map(),
        port: {
            postMessage: jest.fn(),
            onmessage: null,
            onmessageerror: null,
            start: jest.fn(),
            close: jest.fn(),
        },
        onprocessorerror: null,
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
    createMockConvolverNode,
    createMockDelayNode,
    createMockDynamicsCompressorNode,
    createMockOscillatorNode,
    createMockWaveShaperNode,
    createMockChannelSplitterNode,
    createMockChannelMergerNode,
    createMockStereoPannerNode,
    createMockMediaElementAudioSourceNode,
    createMockMediaStreamAudioSourceNode,
    createMockPeriodicWave,
    createMockAudioWorkletNode,
    createMockAudioElement,
};
