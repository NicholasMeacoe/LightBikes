const { createLogger } = require('./Logger.js');
const logger = createLogger('DeviceCapabilityDetector');

/**
 * DeviceCapabilityDetector - Handles hardware capability detection
 *
 * Extracts WebGL capabilities, GPU tier estimation, and device characteristics
 * to determine the optimal performance settings for the application.
 */
class DeviceCapabilityDetector {
    constructor() {
        this.capabilities = {
            webglSupported: false,
            webgl2Supported: false,
            postProcessingSupported: false,
            floatTextureSupport: false,
            depthTextureSupport: false,
            maxTextureSize: 0,
            maxRenderBufferSize: 0,
            devicePixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            isMobile: false,
            isLowEndDevice: false,
            gpuTier: 'unknown', // 'high', 'medium', 'low', 'unknown'
        };
    }

    /**
     * Detect all device capabilities
     * @returns {Object} Detected capabilities
     */
    detect() {
        this.detectWebGLCapabilities();
        this.detectDeviceCharacteristics();
        return this.capabilities;
    }

    /**
     * Detect WebGL capabilities and extensions
     */
    detectWebGLCapabilities() {
        try {
            if (typeof document === 'undefined') return;

            const canvas = document.createElement('canvas');

            // Test WebGL 1.0
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.capabilities.webglSupported = !!gl;

            if (gl) {
                /** @type {any} */
                const glAny = gl;
                // Get basic parameters
                this.capabilities.maxTextureSize = glAny.getParameter(glAny.MAX_TEXTURE_SIZE);
                this.capabilities.maxRenderBufferSize = glAny.getParameter(
                    glAny.MAX_RENDERBUFFER_SIZE
                );

                // Test extensions
                this.capabilities.floatTextureSupport = !!(
                    glAny.getExtension('OES_texture_float') ||
                    glAny.getExtension('OES_texture_half_float')
                );
                this.capabilities.depthTextureSupport = !!glAny.getExtension('WEBGL_depth_texture');

                // Test WebGL 2.0
                const gl2 = canvas.getContext('webgl2');
                this.capabilities.webgl2Supported = !!gl2;

                // Test post-processing support
                this.capabilities.postProcessingSupported = !!(
                    typeof window !== 'undefined' &&
                    window.THREE &&
                    window.THREE.EffectComposer &&
                    window.THREE.RenderPass &&
                    window.THREE.ShaderPass
                );

                // Estimate GPU tier based on capabilities
                this.estimateGPUTier(/** @type {any} */ (gl));
            }

            // Clean up test canvas
            canvas.width = 1;
            canvas.height = 1;
        } catch (error) {
            logger.warn('WebGL capability detection failed', { error: error.message });
            this.capabilities.webglSupported = false;
        }
    }

    /**
     * Estimate GPU performance tier
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    estimateGPUTier(gl) {
        try {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);

            // Handle null values gracefully
            if (!renderer || !vendor) {
                this.capabilities.gpuTier = 'unknown';
                return;
            }

            // Simple heuristic based on common GPU patterns
            const rendererLower = renderer.toLowerCase();
            const vendorLower = vendor.toLowerCase();

            // High-end indicators
            if (
                rendererLower.includes('rtx') ||
                rendererLower.includes('gtx 1060') ||
                rendererLower.includes('gtx 1070') ||
                rendererLower.includes('gtx 1080') ||
                rendererLower.includes('rx 580') ||
                rendererLower.includes('rx 6') ||
                rendererLower.includes('rx 7')
            ) {
                this.capabilities.gpuTier = 'high';
            }
            // Medium-end indicators
            else if (
                rendererLower.includes('gtx') ||
                rendererLower.includes('rx ') ||
                rendererLower.includes('radeon') ||
                rendererLower.includes('geforce') ||
                this.capabilities.maxTextureSize >= 4096
            ) {
                this.capabilities.gpuTier = 'medium';
            }
            // Low-end indicators
            else if (
                rendererLower.includes('intel') ||
                rendererLower.includes('integrated') ||
                this.capabilities.maxTextureSize < 2048
            ) {
                this.capabilities.gpuTier = 'low';
            }

            logger.debug(
                `GPU detected: ${renderer} (${vendor}) - Tier: ${this.capabilities.gpuTier}`
            );
        } catch (error) {
            logger.warn('GPU tier estimation failed', { error: error.message });
            this.capabilities.gpuTier = 'unknown';
        }
    }

    /**
     * Detect device characteristics
     */
    detectDeviceCharacteristics() {
        if (typeof navigator === 'undefined') return;

        // Mobile detection
        this.capabilities.isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

        // Low-end device detection
        this.capabilities.isLowEndDevice =
            this.capabilities.isMobile ||
            this.capabilities.gpuTier === 'low' ||
            this.capabilities.maxTextureSize < 2048 ||
            (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
            (navigator.deviceMemory && navigator.deviceMemory < 4);

        logger.debug(
            `Device characteristics: Mobile: ${this.capabilities.isMobile}, Low-end: ${this.capabilities.isLowEndDevice}`
        );
    }

    /**
     * Get capabilities summary
     * @returns {Object} Capabilities summary
     */
    getSummary() {
        return {
            webgl: this.capabilities.webglSupported,
            webgl2: this.capabilities.webgl2Supported,
            postProcessing: this.capabilities.postProcessingSupported,
            maxTextureSize: this.capabilities.maxTextureSize,
            gpuTier: this.capabilities.gpuTier,
            isMobile: this.capabilities.isMobile,
            isLowEndDevice: this.capabilities.isLowEndDevice,
        };
    }
}

module.exports = { DeviceCapabilityDetector };
