/**
 * InitializationState - Tracks game initialization progress and state
 */

class InitializationState {
    constructor() {
        this.steps = {
            domReady: false,
            errorHandlingInit: false,
            compatibilityCheck: false,
            webglCheck: false,
            gameCreation: false,
            rendererInit: false,
            canvasVerification: false,
            controlsSetup: false,
            systemsInit: false,
            modeSelectorReady: false,
            gameStarted: false
        };
        
        this.errors = [];
        this.startTime = null;
        this.endTime = null;
        this.currentStep = null;
    }

    /**
     * Mark initialization as started
     */
    start() {
        this.startTime = performance.now();
        this.log('Initialization started');
    }

    /**
     * Mark a step as complete
     * @param {string} step - Step name
     */
    completeStep(step) {
        if (this.steps.hasOwnProperty(step)) {
            this.steps[step] = true;
            this.currentStep = step;
            this.log(`Step completed: ${step}`);
        } else {
            console.warn(`Unknown initialization step: ${step}`);
        }
    }

    /**
     * Record an error during initialization
     * @param {string} step - Step where error occurred
     * @param {Error} error - Error object
     */
    recordError(step, error) {
        const errorRecord = {
            step,
            error: error.message,
            name: error.name,
            recoverable: error.recoverable || false,
            timestamp: performance.now() - (this.startTime || 0)
        };
        
        this.errors.push(errorRecord);
        this.log(`Error in ${step}: ${error.message}`);
    }

    /**
     * Mark initialization as complete
     */
    complete() {
        this.endTime = performance.now();
        this.steps.gameStarted = true;
        this.log(`Initialization completed in ${this.getDuration()}ms`);
    }

    /**
     * Get initialization duration
     * @returns {number} Duration in milliseconds
     */
    getDuration() {
        if (!this.startTime) return 0;
        const end = this.endTime || performance.now();
        return Math.round(end - this.startTime);
    }

    /**
     * Check if a specific step is complete
     * @param {string} step - Step name
     * @returns {boolean} True if step is complete
     */
    isStepComplete(step) {
        return this.steps[step] === true;
    }

    /**
     * Get all completed steps
     * @returns {Array<string>} Array of completed step names
     */
    getCompletedSteps() {
        return Object.keys(this.steps).filter(step => this.steps[step]);
    }

    /**
     * Get all incomplete steps
     * @returns {Array<string>} Array of incomplete step names
     */
    getIncompleteSteps() {
        return Object.keys(this.steps).filter(step => !this.steps[step]);
    }

    /**
     * Get current state summary
     * @returns {Object} State summary
     */
    getState() {
        return {
            steps: { ...this.steps },
            currentStep: this.currentStep,
            errors: [...this.errors],
            duration: this.getDuration(),
            isComplete: this.steps.gameStarted,
            completedCount: this.getCompletedSteps().length,
            totalSteps: Object.keys(this.steps).length
        };
    }

    /**
     * Determine if recovery should be attempted based on state
     * @returns {Object} Recovery recommendation
     */
    getRecoveryRecommendation() {
        const lastError = this.errors[this.errors.length - 1];
        
        if (!lastError) {
            return { shouldRecover: false, reason: 'No errors recorded' };
        }

        // Check if error is recoverable
        if (!lastError.recoverable) {
            return { 
                shouldRecover: false, 
                reason: 'Error is not recoverable',
                step: lastError.step
            };
        }

        // Check if we're early in initialization (DOM/compatibility issues)
        const earlySteps = ['domReady', 'errorHandlingInit', 'compatibilityCheck'];
        if (earlySteps.includes(lastError.step)) {
            return {
                shouldRecover: true,
                reason: 'Early initialization error, retry recommended',
                step: lastError.step,
                strategy: 'retry'
            };
        }

        // Check if mode selector failed
        if (lastError.step === 'modeSelectorReady') {
            return {
                shouldRecover: true,
                reason: 'Mode selector error, fallback available',
                step: lastError.step,
                strategy: 'fallback'
            };
        }

        return {
            shouldRecover: true,
            reason: 'Recoverable error detected',
            step: lastError.step,
            strategy: 'retry'
        };
    }

    /**
     * Reset state for retry
     */
    reset() {
        Object.keys(this.steps).forEach(step => {
            this.steps[step] = false;
        });
        this.errors = [];
        this.startTime = null;
        this.endTime = null;
        this.currentStep = null;
        this.log('State reset for retry');
    }

    /**
     * Log state change
     * @param {string} message - Log message
     * @private
     */
    log(message) {
        console.log(`[InitializationState] ${message}`);
    }
}

module.exports = { InitializationState };
