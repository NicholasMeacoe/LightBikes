/**
 * Audio buffer fixtures for testing
 * Provides sample audio buffer data for various scenarios
 */

/**
 * Create a mock audio buffer with specified parameters
 */
function createAudioBufferData(numberOfChannels = 2, length = 44100, sampleRate = 44100) {
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(new Float32Array(length));
    }

    return {
        numberOfChannels,
        length,
        sampleRate,
        duration: length / sampleRate,
        channels,
    };
}

/**
 * Create a silent audio buffer
 */
function createSilentBuffer(duration = 1.0, sampleRate = 44100) {
    const length = Math.floor(duration * sampleRate);
    return createAudioBufferData(2, length, sampleRate);
}

/**
 * Create a sine wave audio buffer
 */
function createSineWaveBuffer(frequency = 440, duration = 1.0, sampleRate = 44100) {
    const length = Math.floor(duration * sampleRate);
    const buffer = createAudioBufferData(2, length, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.channels[channel];
        for (let i = 0; i < length; i++) {
            channelData[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
        }
    }

    return buffer;
}

/**
 * Create a white noise audio buffer
 */
function createWhiteNoiseBuffer(duration = 1.0, sampleRate = 44100) {
    const length = Math.floor(duration * sampleRate);
    const buffer = createAudioBufferData(2, length, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.channels[channel];
        for (let i = 0; i < length; i++) {
            channelData[i] = Math.random() * 2 - 1;
        }
    }

    return buffer;
}

/**
 * Create a short beep sound buffer
 */
function createBeepBuffer(sampleRate = 44100) {
    return createSineWaveBuffer(800, 0.1, sampleRate);
}

/**
 * Create a music track metadata
 */
function createMusicTrackMetadata(id = 'track-1', name = 'Test Track', duration = 180) {
    return {
        id,
        name,
        duration,
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'Electronic',
        bpm: 120,
        key: 'C',
        mood: 'energetic',
        url: `/audio/music/${id}.mp3`,
        waveform: new Array(100).fill(0).map(() => Math.random()),
    };
}

/**
 * Create a sound effect metadata
 */
function createSoundEffectMetadata(id = 'sfx-1', name = 'Test SFX', duration = 0.5) {
    return {
        id,
        name,
        duration,
        category: 'game',
        volume: 1.0,
        url: `/audio/sfx/${id}.wav`,
    };
}

/**
 * Create a playlist
 */
function createPlaylist(trackCount = 5) {
    const tracks = [];
    for (let i = 0; i < trackCount; i++) {
        tracks.push(createMusicTrackMetadata(`track-${i + 1}`, `Track ${i + 1}`, 120 + i * 30));
    }

    return {
        id: 'playlist-1',
        name: 'Test Playlist',
        tracks,
        shuffle: false,
        repeat: false,
        currentTrackIndex: 0,
    };
}

/**
 * Create audio settings
 */
function createAudioSettings() {
    return {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.9,
        muted: false,
        spatialAudio: true,
        quality: 'high',
    };
}

/**
 * Create an audio context state
 */
function createAudioContextState() {
    return {
        state: 'running',
        sampleRate: 44100,
        currentTime: 0,
        baseLatency: 0.005,
        outputLatency: 0.01,
    };
}

/**
 * Create a spatial audio configuration
 */
function createSpatialAudioConfig() {
    return {
        enabled: true,
        listenerPosition: { x: 0, y: 0, z: 0 },
        listenerOrientation: {
            forward: { x: 0, y: 0, z: -1 },
            up: { x: 0, y: 1, z: 0 },
        },
        distanceModel: 'inverse',
        refDistance: 1,
        maxDistance: 10000,
        rolloffFactor: 1,
    };
}

/**
 * Create an audio analyser data
 */
function createAnalyserData(size = 1024) {
    return {
        frequencyData: new Uint8Array(size),
        timeDomainData: new Uint8Array(size),
        fftSize: size * 2,
        frequencyBinCount: size,
    };
}

/**
 * Create a music loading state
 */
function createMusicLoadingState(trackId = 'track-1', progress = 0.5) {
    return {
        trackId,
        loading: true,
        progress,
        loaded: false,
        error: null,
    };
}

/**
 * Create a music playback state
 */
function createMusicPlaybackState(trackId = 'track-1', currentTime = 30) {
    return {
        trackId,
        playing: true,
        paused: false,
        currentTime,
        duration: 180,
        volume: 0.7,
        loop: false,
    };
}

module.exports = {
    createAudioBufferData,
    createSilentBuffer,
    createSineWaveBuffer,
    createWhiteNoiseBuffer,
    createBeepBuffer,
    createMusicTrackMetadata,
    createSoundEffectMetadata,
    createPlaylist,
    createAudioSettings,
    createAudioContextState,
    createSpatialAudioConfig,
    createAnalyserData,
    createMusicLoadingState,
    createMusicPlaybackState,
};
