/**
 * Custom error types for game initialization
 */

/**
 * Error thrown when DOM is not ready for initialization
 */
class DOMNotReadyError extends Error {
    constructor(message = 'DOM is not ready for initialization') {
        super(message);
        this.name = 'DOMNotReadyError';
        this.recoverable = true;
        this.actionableSteps = [
            'Wait a moment and the game will retry automatically',
            'If the problem persists, refresh the page',
            'Check your internet connection'
        ];
    }
}

/**
 * Error thrown when canvas creation or verification fails
 */
class CanvasCreationError extends Error {
    constructor(message = 'Failed to create or verify game canvas', details = null) {
        super(message);
        this.name = 'CanvasCreationError';
        this.recoverable = false;
        this.details = details;
        this.actionableSteps = [
            'Update your browser to the latest version',
            'Enable hardware acceleration in browser settings',
            'Try a different browser (Chrome, Firefox, or Edge)',
            'Check if WebGL is supported: visit https://get.webgl.org/'
        ];
    }
}

/**
 * Error thrown when mode selector fails to display
 */
class ModeSelectorError extends Error {
    constructor(message = 'Mode selector failed to display', details = null) {
        super(message);
        this.name = 'ModeSelectorError';
        this.recoverable = true;
        this.details = details;
        this.actionableSteps = [
            'The game will attempt to use a fallback mode selector',
            'Refresh the page if the mode selector does not appear',
            'Disable browser extensions that might interfere with the page',
            'Check if JavaScript is enabled in your browser'
        ];
    }
}

module.exports = {
    DOMNotReadyError,
    CanvasCreationError,
    ModeSelectorError
};
