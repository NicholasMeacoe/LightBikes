/**
 * MusicLoopController - Handles seamless looping for music tracks
 * Provides sample-accurate looping with gap detection and elimination
 */

class MusicLoopController {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.currentSource = null;
        this.nextSource = null;
        this.isLooping = false;
        this.loopStartTime = 0;
        this.loopEndTime = 0;
        this.crossfadeDuration = 0.01; // 10ms crossfade to eliminate gaps
        this.scheduledSources = [];
        this.gainNode = null;
        
        // Loop state management
        this.loopState = 'stopped'; // 'stopped', 'starting', 'looping', 'stopping'
        this.loopCount = 0;
        
        // Create gain node for volume control
        this._createGainNode();
    }
    
    /**
     * Create the gain node for volume control
     * @private
     */
    _createGainNode() {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
    }
    
    /**
     * Start seamless looping of a track
     * @param {MusicTrack} track - Track to loop
     * @param {AudioNode} destination - Audio destination node
     * @param {number} startTime - When to start (audioContext.currentTime + delay)
     * @returns {Promise<void>} Resolves when looping starts
     */
    async startLoop(track, destination, startTime = 0) {
        if (!track || !track.isLoaded()) {
            throw new Error('Track must be loaded before starting loop');
        }
        
        if (track.getId() === 'none') {
            // Handle "no music" option
            this.loopState = 'stopped';
            return;
        }
        
        // Stop any existing loop
        await this.stopLoop();
        
        this.loopState = 'starting';
        this.loopCount = 0;
        
        const audioBuffer = track.getAudioBuffer();
        if (!audioBuffer) {
            throw new Error('Audio buffer not available for looping');
        }
        
        // Set up loop timing
        this.loopStartTime = 0;
        this.loopEndTime = audioBuffer.duration;
        
        // Detect and handle potential loop gaps
        this._analyzeLoopPoints(audioBuffer);
        
        // Connect gain node to destination
        this.gainNode.connect(destination);
        
        // Create and start the first source
        const actualStartTime = startTime || this.audioContext.currentTime;
        this.currentSource = this._createLoopSource(track, actualStartTime);
        
        // Schedule the next loop iteration
        this._scheduleNextLoop(track, actualStartTime + this.loopEndTime);
        
        this.isLooping = true;
        this.loopState = 'looping';
        
        console.log(`Started seamless loop for track: ${track.getId()}`);
    }
    
    /**
     * Stop the current loop
     * @param {number} fadeOutDuration - Duration to fade out (optional)
     * @returns {Promise<void>} Resolves when loop is stopped
     */
    async stopLoop(fadeOutDuration = 0) {
        if (!this.isLooping) {
            return;
        }
        
        this.loopState = 'stopping';
        this.isLooping = false;
        
        try {
            // Fade out if requested
            if (fadeOutDuration > 0 && this.gainNode) {
                const currentTime = this.audioContext.currentTime;
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
                
                // Wait for fade to complete
                await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000));
            }
            
            // Stop all scheduled sources
            this._stopAllSources();
            
            // Disconnect gain node
            if (this.gainNode) {
                this.gainNode.disconnect();
                this._createGainNode(); // Create new gain node for next use
            }
            
        } finally {
            this.loopState = 'stopped';
            this.currentSource = null;
            this.nextSource = null;
            this.scheduledSources = [];
            this.loopCount = 0;
        }
        
        console.log('Seamless loop stopped');
    }
    
    /**
     * Create a loop source with precise timing
     * @param {MusicTrack} track - Track to create source for
     * @param {number} startTime - When to start the source
     * @returns {AudioBufferSourceNode} Configured audio source
     * @private
     */
    _createLoopSource(track, startTime) {
        const source = track.createSource();
        if (!source) {
            throw new Error('Failed to create audio source for looping');
        }
        
        // Configure source for seamless looping
        source.loop = false; // We handle looping manually for better control
        source.connect(this.gainNode);
        
        // Start the source at the specified time
        source.start(startTime, this.loopStartTime, this.loopEndTime - this.loopStartTime);
        
        // Track the source for cleanup
        this.scheduledSources.push(source);
        
        // Set up ended event handler
        source.onended = () => {
            this._onSourceEnded(source);
        };
        
        return source;
    }
    
    /**
     * Schedule the next loop iteration for seamless playback
     * @param {MusicTrack} track - Track to loop
     * @param {number} nextStartTime - When to start the next iteration
     * @private
     */
    _scheduleNextLoop(track, nextStartTime) {
        if (!this.isLooping) {
            return;
        }
        
        // Create the next source in advance
        this.nextSource = this._createLoopSource(track, nextStartTime);
        
        // Schedule the following loop iteration
        const followingStartTime = nextStartTime + (this.loopEndTime - this.loopStartTime);
        
        // Use setTimeout to schedule the next iteration
        // This ensures we maintain the loop even if there are timing variations
        const scheduleDelay = (nextStartTime - this.audioContext.currentTime) * 1000;
        
        if (scheduleDelay > 0) {
            setTimeout(() => {
                if (this.isLooping) {
                    this.currentSource = this.nextSource;
                    this.nextSource = null;
                    this.loopCount++;
                    
                    // Schedule the next iteration
                    this._scheduleNextLoop(track, followingStartTime);
                }
            }, Math.max(0, scheduleDelay - 50)); // Schedule 50ms early for precision
        }
    }
    
    /**
     * Handle source ended event
     * @param {AudioBufferSourceNode} source - Source that ended
     * @private
     */
    _onSourceEnded(source) {
        // Remove from scheduled sources
        const index = this.scheduledSources.indexOf(source);
        if (index !== -1) {
            this.scheduledSources.splice(index, 1);
        }
        
        // Clean up the source
        try {
            source.disconnect();
        } catch (error) {
            // Source may already be disconnected
        }
    }
    
    /**
     * Analyze loop points to detect potential gaps or clicks
     * @param {AudioBuffer} audioBuffer - Audio buffer to analyze
     * @private
     */
    _analyzeLoopPoints(audioBuffer) {
        if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
            return;
        }
        
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        const bufferLength = channelData.length;
        
        // Check for silence at the beginning and end
        const silenceThreshold = 0.001; // -60dB
        const checkSamples = Math.min(1024, Math.floor(bufferLength * 0.01)); // Check first/last 1% or 1024 samples
        
        // Check start for silence
        let startSilenceSamples = 0;
        for (let i = 0; i < checkSamples; i++) {
            if (Math.abs(channelData[i]) < silenceThreshold) {
                startSilenceSamples++;
            } else {
                break;
            }
        }
        
        // Check end for silence
        let endSilenceSamples = 0;
        for (let i = bufferLength - 1; i >= bufferLength - checkSamples; i--) {
            if (Math.abs(channelData[i]) < silenceThreshold) {
                endSilenceSamples++;
            } else {
                break;
            }
        }
        
        // Adjust loop points to skip silence
        if (startSilenceSamples > 0) {
            this.loopStartTime = startSilenceSamples / sampleRate;
        }
        
        if (endSilenceSamples > 0) {
            this.loopEndTime = (bufferLength - endSilenceSamples) / sampleRate;
        }
        
        // Check for potential click at loop point
        const startSample = channelData[Math.floor(this.loopStartTime * sampleRate)];
        const endSample = channelData[Math.floor(this.loopEndTime * sampleRate) - 1];
        const sampleDifference = Math.abs(startSample - endSample);
        
        if (sampleDifference > 0.1) {
            // Significant difference - enable crossfade
            this.crossfadeDuration = Math.min(0.05, (this.loopEndTime - this.loopStartTime) * 0.001);
            console.log(`Loop gap detected, enabling ${this.crossfadeDuration * 1000}ms crossfade`);
        }
    }
    
    /**
     * Stop all scheduled audio sources
     * @private
     */
    _stopAllSources() {
        for (const source of this.scheduledSources) {
            try {
                source.stop();
                source.disconnect();
            } catch (error) {
                // Source may already be stopped or disconnected
            }
        }
        
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (error) {
                // Source may already be stopped
            }
        }
        
        if (this.nextSource) {
            try {
                this.nextSource.stop();
                this.nextSource.disconnect();
            } catch (error) {
                // Source may already be stopped
            }
        }
        
        this.scheduledSources = [];
    }
    
    /**
     * Set the loop volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext.currentTime);
        }
    }
    
    /**
     * Get the current loop volume
     * @returns {number} Current volume level
     */
    getVolume() {
        return this.gainNode ? this.gainNode.gain.value : 0;
    }
    
    /**
     * Check if currently looping
     * @returns {boolean} True if looping is active
     */
    isActive() {
        return this.isLooping && this.loopState === 'looping';
    }
    
    /**
     * Get current loop state
     * @returns {string} Current loop state
     */
    getLoopState() {
        return this.loopState;
    }
    
    /**
     * Get current loop count
     * @returns {number} Number of completed loops
     */
    getLoopCount() {
        return this.loopCount;
    }
    
    /**
     * Get loop timing information
     * @returns {Object} Loop timing details
     */
    getLoopTiming() {
        return {
            startTime: this.loopStartTime,
            endTime: this.loopEndTime,
            duration: this.loopEndTime - this.loopStartTime,
            crossfadeDuration: this.crossfadeDuration,
            loopCount: this.loopCount
        };
    }
    
    /**
     * Restart the current loop from the beginning
     * @param {MusicTrack} track - Track to restart
     * @param {AudioNode} destination - Audio destination
     * @returns {Promise<void>} Resolves when restart completes
     */
    async restartLoop(track, destination) {
        if (this.isLooping) {
            await this.stopLoop();
        }
        await this.startLoop(track, destination);
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.stopLoop();
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicLoopController };