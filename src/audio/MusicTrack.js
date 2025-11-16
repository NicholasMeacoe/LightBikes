/**
 * MusicTrack - Represents an individual music track with loading and metadata management
 * Handles audio file loading, buffering, and track-specific configuration
 */
class MusicTrack {
    constructor(id, url, metadata = {}) {
        this.id = id;
        this.url = url;
        this.fallbackUrl = metadata.fallbackUrl || null;
        this.metadata = {
            name: metadata.name || id,
            energyLevel: metadata.energyLevel || 'ambient',
            duration: metadata.duration || null,
            loop: metadata.loop !== false, // Default to true
            preload: metadata.preload !== false, // Default to true
            description: metadata.description || ''
        };
        
        // Loading state management
        this.loadingState = 'not_loaded'; // 'not_loaded', 'loading', 'loaded', 'error'
        this.audioBuffer = null;
        this.error = null;
        this.usingFallback = false; // Track if we're using fallback URL
        
        // Audio context reference (will be set by MusicPlayer)
        this.audioContext = null;
    }
    
    /**
     * Set the audio context for this track
     * @param {AudioContext} audioContext - Web Audio API context
     */
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
    }
    
    /**
     * Load the audio track asynchronously
     * @returns {Promise<void>} Resolves when track is loaded
     */
    async load() {
        if (this.loadingState === 'loaded') {
            return Promise.resolve();
        }
        
        if (this.loadingState === 'loading') {
            // Return existing loading promise if already in progress
            return this.loadingPromise;
        }
        
        // Handle "none" track (no music option)
        if (this.id === 'none' || !this.url) {
            this.loadingState = 'loaded';
            return Promise.resolve();
        }
        
        this.loadingState = 'loading';
        this.error = null;
        
        this.loadingPromise = this._performLoad();
        
        try {
            await this.loadingPromise;
            this.loadingState = 'loaded';
        } catch (error) {
            this.loadingState = 'error';
            this.error = error.message;
            throw error;
        } finally {
            this.loadingPromise = null;
        }
    }
    
    /**
     * Perform the actual audio loading with enhanced error handling and timeout
     * @returns {Promise<void>} Resolves when loading completes
     * @private
     */
    async _performLoad() {
        if (!this.audioContext) {
            throw new Error('Audio context not set for track loading');
        }
        
        const maxRetries = 3; // Increased retry attempts
        const baseRetryDelay = 1000; // Base delay in milliseconds
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Progressive timeout: longer timeout for later attempts
                const timeoutDuration = Math.min(10000 + (attempt * 5000), 30000); // 10s to 30s max
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
                
                try {
                    // Fetch the audio file with timeout and retry-friendly headers
                    const response = await fetch(this.url, {
                        signal: controller.signal,
                        cache: attempt > 0 ? 'reload' : 'default', // Bypass cache on retries
                        headers: {
                            'Accept': 'audio/*,*/*;q=0.9',
                            'Cache-Control': attempt > 0 ? 'no-cache' : 'default'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        // Provide more specific error information
                        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        if (response.status === 404) {
                            throw new Error(`Track file not found: ${errorMessage}`);
                        } else if (response.status === 403) {
                            throw new Error(`Access denied to track file: ${errorMessage}`);
                        } else if (response.status >= 500) {
                            throw new Error(`Server error loading track: ${errorMessage}`);
                        } else {
                            throw new Error(`Network error loading track: ${errorMessage}`);
                        }
                    }
                    
                    // Check content type if available
                    const contentType = response.headers.get('content-type');
                    if (contentType && !contentType.startsWith('audio/')) {
                        console.warn(`Unexpected content type for ${this.id}: ${contentType}`);
                    }
                    
                    // Get array buffer from response
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // Validate array buffer
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error(`Empty or invalid audio file received for track ${this.id}`);
                    }
                    
                    // Decode audio data with error handling
                    try {
                        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    } catch (decodeError) {
                        throw new Error(`Audio decode failed for track ${this.id}: ${decodeError.message}. File may be corrupted or in unsupported format.`);
                    }
                    
                    // Validate decoded audio buffer
                    if (!this.audioBuffer || this.audioBuffer.length === 0) {
                        throw new Error(`Decoded audio buffer is empty for track ${this.id}`);
                    }
                    
                    // Update duration metadata if not provided
                    if (!this.metadata.duration && this.audioBuffer) {
                        this.metadata.duration = this.audioBuffer.duration;
                    }
                    
                    // Success - exit retry loop
                    console.log(`Successfully loaded track ${this.id} (${this.audioBuffer.duration.toFixed(2)}s, ${this.audioBuffer.numberOfChannels} channels)`);
                    return;
                    
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
                
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain types of errors
                if (error.name === 'AbortError') {
                    throw new Error(`Loading timeout for track ${this.id} after ${Math.round(timeoutDuration/1000)} seconds`);
                }
                
                // Don't retry on permanent errors
                if (error.message.includes('not found') || 
                    error.message.includes('Access denied') ||
                    error.message.includes('decode failed')) {
                    throw error;
                }
                
                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    break;
                }
                
                // Exponential backoff with jitter
                const delay = baseRetryDelay * Math.pow(2, attempt) + Math.random() * 1000;
                console.warn(`Loading attempt ${attempt + 1} failed for track ${this.id}, retrying in ${Math.round(delay)}ms:`, error.message);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // All retries failed for primary URL, try fallback if available
        if (this.fallbackUrl && !this.usingFallback) {
            console.warn(`Primary URL failed for track ${this.id}, trying fallback: ${this.fallbackUrl}`);
            this.usingFallback = true;
            const originalUrl = this.url;
            this.url = this.fallbackUrl;
            
            try {
                // Reset state and try with fallback URL
                this.loadingState = 'loading';
                this.error = null;
                await this._performLoad();
                console.log(`Successfully loaded track ${this.id} using fallback URL`);
                return;
            } catch (fallbackError) {
                // Restore original URL for error reporting
                this.url = originalUrl;
                this.usingFallback = false;
                throw new Error(`Failed to load music track ${this.id} from both primary (${originalUrl}) and fallback (${this.fallbackUrl}) URLs: ${fallbackError.message}`);
            }
        }
        
        // All retries failed and no fallback available
        throw new Error(`Failed to load music track ${this.id} from ${this.url} after ${maxRetries + 1} attempts: ${lastError.message}`);
    }
    
    /**
     * Preload the track if preload is enabled
     * @returns {Promise<void>} Resolves when preloading completes or is skipped
     */
    async preload() {
        if (!this.metadata.preload) {
            return Promise.resolve();
        }
        
        return this.load();
    }
    
    /**
     * Check if the track is loaded and ready for playback
     * @returns {boolean} True if track is loaded
     */
    isLoaded() {
        return this.loadingState === 'loaded';
    }
    
    /**
     * Check if the track is currently loading
     * @returns {boolean} True if track is loading
     */
    isLoading() {
        return this.loadingState === 'loading';
    }
    
    /**
     * Check if the track failed to load
     * @returns {boolean} True if track failed to load
     */
    hasError() {
        return this.loadingState === 'error';
    }
    
    /**
     * Get the track ID
     * @returns {string} Track identifier
     */
    getId() {
        return this.id;
    }
    
    /**
     * Get the track display name
     * @returns {string} Human-readable track name
     */
    getName() {
        return this.metadata.name;
    }
    
    /**
     * Get the track energy level
     * @returns {string} Energy level ('ambient', 'upbeat', 'intense', or null for 'none')
     */
    getEnergyLevel() {
        return this.metadata.energyLevel;
    }
    
    /**
     * Get the track duration in seconds
     * @returns {number|null} Duration in seconds, or null if unknown
     */
    getDuration() {
        return this.metadata.duration;
    }
    
    /**
     * Check if the track should loop
     * @returns {boolean} True if track should loop
     */
    shouldLoop() {
        return this.metadata.loop;
    }
    
    /**
     * Get the audio buffer for playback
     * @returns {AudioBuffer|null} Audio buffer or null if not loaded
     */
    getAudioBuffer() {
        return this.audioBuffer;
    }
    
    /**
     * Create a new audio buffer source for playback
     * @returns {AudioBufferSourceNode|null} New audio source or null if not available
     */
    createSource() {
        if (!this.audioContext || !this.audioBuffer) {
            return null;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffer;
            source.loop = this.shouldLoop();
            
            return source;
        } catch (error) {
            console.warn(`Failed to create audio source for track ${this.id}:`, error);
            return null;
        }
    }
    
    /**
     * Get the current loading state
     * @returns {string} Loading state ('not_loaded', 'loading', 'loaded', 'error')
     */
    getLoadingState() {
        return this.loadingState;
    }
    
    /**
     * Get the error message if loading failed
     * @returns {string|null} Error message or null if no error
     */
    getError() {
        return this.error;
    }
    
    /**
     * Check if the track is using its fallback URL
     * @returns {boolean} True if using fallback URL
     */
    isUsingFallback() {
        return this.usingFallback;
    }
    
    /**
     * Get the currently active URL (primary or fallback)
     * @returns {string|null} Currently active URL
     */
    getActiveUrl() {
        return this.url;
    }
    
    /**
     * Get the fallback URL if available
     * @returns {string|null} Fallback URL or null if not available
     */
    getFallbackUrl() {
        return this.fallbackUrl;
    }
    
    /**
     * Get complete track metadata
     * @returns {Object} Track metadata object
     */
    getMetadata() {
        return {
            ...this.metadata,
            id: this.id,
            url: this.url,
            fallbackUrl: this.fallbackUrl,
            usingFallback: this.usingFallback,
            loadingState: this.loadingState,
            error: this.error
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.audioBuffer = null;
        this.audioContext = null;
        this.loadingState = 'not_loaded';
        this.error = null;
        this.usingFallback = false;
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicTrack };