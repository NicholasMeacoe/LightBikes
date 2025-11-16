const { InitializationState } = require('./InitializationState.js');

describe('InitializationState', () => {
    let state;
    let mockPerformanceNow;

    beforeEach(() => {
        state = new InitializationState();
        mockPerformanceNow = jest.spyOn(performance, 'now');
        mockPerformanceNow.mockReturnValue(1000);
    });

    afterEach(() => {
        mockPerformanceNow.mockRestore();
    });

    describe('constructor', () => {
        it('should initialize with all steps incomplete', () => {
            expect(state.steps.domReady).toBe(false);
            expect(state.steps.errorHandlingInit).toBe(false);
            expect(state.steps.compatibilityCheck).toBe(false);
            expect(state.steps.webglCheck).toBe(false);
            expect(state.steps.gameCreation).toBe(false);
            expect(state.steps.rendererInit).toBe(false);
            expect(state.steps.canvasVerification).toBe(false);
            expect(state.steps.controlsSetup).toBe(false);
            expect(state.steps.systemsInit).toBe(false);
            expect(state.steps.modeSelectorReady).toBe(false);
            expect(state.steps.gameStarted).toBe(false);
        });

        it('should initialize with empty errors array', () => {
            expect(state.errors).toEqual([]);
        });

        it('should initialize with null timestamps', () => {
            expect(state.startTime).toBeNull();
            expect(state.endTime).toBeNull();
        });

        it('should initialize with null currentStep', () => {
            expect(state.currentStep).toBeNull();
        });
    });

    describe('start', () => {
        it('should set startTime', () => {
            state.start();
            
            expect(state.startTime).toBe(1000);
        });

        it('should log start message', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            state.start();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[InitializationState] Initialization started'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('completeStep', () => {
        it('should mark step as complete', () => {
            state.completeStep('domReady');
            
            expect(state.steps.domReady).toBe(true);
        });

        it('should update currentStep', () => {
            state.completeStep('domReady');
            
            expect(state.currentStep).toBe('domReady');
        });

        it('should log step completion', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            state.completeStep('domReady');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[InitializationState] Step completed: domReady'
            );
            
            consoleSpy.mockRestore();
        });

        it('should warn for unknown step', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            state.completeStep('unknownStep');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'Unknown initialization step: unknownStep'
            );
            
            consoleSpy.mockRestore();
        });

        it('should not update currentStep for unknown step', () => {
            state.completeStep('unknownStep');
            
            expect(state.currentStep).toBeNull();
        });
    });

    describe('recordError', () => {
        it('should add error to errors array', () => {
            const error = new Error('Test error');
            state.start();
            
            state.recordError('domReady', error);
            
            expect(state.errors.length).toBe(1);
        });

        it('should record error details', () => {
            const error = new Error('Test error');
            error.name = 'TestError';
            state.start();
            
            state.recordError('domReady', error);
            
            expect(state.errors[0]).toMatchObject({
                step: 'domReady',
                error: 'Test error',
                name: 'TestError'
            });
        });

        it('should record recoverable flag', () => {
            const error = new Error('Test error');
            error.recoverable = true;
            state.start();
            
            state.recordError('domReady', error);
            
            expect(state.errors[0].recoverable).toBe(true);
        });

        it('should default recoverable to false', () => {
            const error = new Error('Test error');
            state.start();
            
            state.recordError('domReady', error);
            
            expect(state.errors[0].recoverable).toBe(false);
        });

        it('should record timestamp', () => {
            const error = new Error('Test error');
            state.start();
            mockPerformanceNow.mockReturnValue(1500);
            
            state.recordError('domReady', error);
            
            expect(state.errors[0].timestamp).toBe(500);
        });

        it('should log error', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const error = new Error('Test error');
            state.start();
            
            state.recordError('domReady', error);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[InitializationState] Error in domReady: Test error'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('complete', () => {
        it('should set endTime', () => {
            state.start();
            mockPerformanceNow.mockReturnValue(2000);
            
            state.complete();
            
            expect(state.endTime).toBe(2000);
        });

        it('should mark gameStarted as true', () => {
            state.start();
            
            state.complete();
            
            expect(state.steps.gameStarted).toBe(true);
        });

        it('should log completion with duration', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            state.start();
            mockPerformanceNow.mockReturnValue(2000);
            
            state.complete();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[InitializationState] Initialization completed in 1000ms'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('getDuration', () => {
        it('should return 0 if not started', () => {
            expect(state.getDuration()).toBe(0);
        });

        it('should calculate duration from start to now', () => {
            state.start();
            mockPerformanceNow.mockReturnValue(1500);
            
            expect(state.getDuration()).toBe(500);
        });

        it('should calculate duration from start to end', () => {
            state.start();
            mockPerformanceNow.mockReturnValue(2000);
            state.complete();
            
            expect(state.getDuration()).toBe(1000);
        });

        it('should round duration', () => {
            state.start();
            mockPerformanceNow.mockReturnValue(1500.7);
            
            expect(state.getDuration()).toBe(501);
        });
    });

    describe('isStepComplete', () => {
        it('should return false for incomplete step', () => {
            expect(state.isStepComplete('domReady')).toBe(false);
        });

        it('should return true for complete step', () => {
            state.completeStep('domReady');
            
            expect(state.isStepComplete('domReady')).toBe(true);
        });
    });

    describe('getCompletedSteps', () => {
        it('should return empty array initially', () => {
            expect(state.getCompletedSteps()).toEqual([]);
        });

        it('should return completed steps', () => {
            state.completeStep('domReady');
            state.completeStep('errorHandlingInit');
            
            const completed = state.getCompletedSteps();
            expect(completed).toContain('domReady');
            expect(completed).toContain('errorHandlingInit');
            expect(completed.length).toBe(2);
        });
    });

    describe('getIncompleteSteps', () => {
        it('should return all steps initially', () => {
            const incomplete = state.getIncompleteSteps();
            
            expect(incomplete.length).toBe(11);
        });

        it('should exclude completed steps', () => {
            state.completeStep('domReady');
            state.completeStep('errorHandlingInit');
            
            const incomplete = state.getIncompleteSteps();
            expect(incomplete).not.toContain('domReady');
            expect(incomplete).not.toContain('errorHandlingInit');
            expect(incomplete.length).toBe(9);
        });
    });

    describe('getState', () => {
        it('should return state summary', () => {
            state.start();
            state.completeStep('domReady');
            
            const summary = state.getState();
            
            expect(summary).toHaveProperty('steps');
            expect(summary).toHaveProperty('currentStep');
            expect(summary).toHaveProperty('errors');
            expect(summary).toHaveProperty('duration');
            expect(summary).toHaveProperty('isComplete');
            expect(summary).toHaveProperty('completedCount');
            expect(summary).toHaveProperty('totalSteps');
        });

        it('should include current step', () => {
            state.completeStep('domReady');
            
            const summary = state.getState();
            expect(summary.currentStep).toBe('domReady');
        });

        it('should include completed count', () => {
            state.completeStep('domReady');
            state.completeStep('errorHandlingInit');
            
            const summary = state.getState();
            expect(summary.completedCount).toBe(2);
        });

        it('should include total steps', () => {
            const summary = state.getState();
            expect(summary.totalSteps).toBe(11);
        });

        it('should indicate completion status', () => {
            const summary1 = state.getState();
            expect(summary1.isComplete).toBe(false);
            
            state.complete();
            
            const summary2 = state.getState();
            expect(summary2.isComplete).toBe(true);
        });
    });

    describe('getRecoveryRecommendation', () => {
        it('should not recommend recovery if no errors', () => {
            const recommendation = state.getRecoveryRecommendation();
            
            expect(recommendation.shouldRecover).toBe(false);
            expect(recommendation.reason).toBe('No errors recorded');
        });

        it('should not recommend recovery for non-recoverable errors', () => {
            const error = new Error('Fatal error');
            error.recoverable = false;
            state.recordError('webglCheck', error);
            
            const recommendation = state.getRecoveryRecommendation();
            
            expect(recommendation.shouldRecover).toBe(false);
            expect(recommendation.reason).toBe('Error is not recoverable');
        });

        it('should recommend retry for early initialization errors', () => {
            const error = new Error('DOM error');
            error.recoverable = true;
            state.recordError('domReady', error);
            
            const recommendation = state.getRecoveryRecommendation();
            
            expect(recommendation.shouldRecover).toBe(true);
            expect(recommendation.strategy).toBe('retry');
            expect(recommendation.step).toBe('domReady');
        });

        it('should recommend fallback for mode selector errors', () => {
            const error = new Error('Mode selector error');
            error.recoverable = true;
            state.recordError('modeSelectorReady', error);
            
            const recommendation = state.getRecoveryRecommendation();
            
            expect(recommendation.shouldRecover).toBe(true);
            expect(recommendation.strategy).toBe('fallback');
            expect(recommendation.step).toBe('modeSelectorReady');
        });

        it('should recommend retry for other recoverable errors', () => {
            const error = new Error('Recoverable error');
            error.recoverable = true;
            state.recordError('systemsInit', error);
            
            const recommendation = state.getRecoveryRecommendation();
            
            expect(recommendation.shouldRecover).toBe(true);
            expect(recommendation.strategy).toBe('retry');
        });
    });

    describe('reset', () => {
        it('should reset all steps to incomplete', () => {
            state.completeStep('domReady');
            state.completeStep('errorHandlingInit');
            
            state.reset();
            
            expect(state.steps.domReady).toBe(false);
            expect(state.steps.errorHandlingInit).toBe(false);
        });

        it('should clear errors array', () => {
            const error = new Error('Test error');
            state.recordError('domReady', error);
            
            state.reset();
            
            expect(state.errors).toEqual([]);
        });

        it('should reset timestamps', () => {
            state.start();
            state.complete();
            
            state.reset();
            
            expect(state.startTime).toBeNull();
            expect(state.endTime).toBeNull();
        });

        it('should reset currentStep', () => {
            state.completeStep('domReady');
            
            state.reset();
            
            expect(state.currentStep).toBeNull();
        });

        it('should log reset', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            state.reset();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[InitializationState] State reset for retry'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('integration', () => {
        it('should track complete initialization flow', () => {
            state.start();
            state.completeStep('domReady');
            state.completeStep('errorHandlingInit');
            state.completeStep('compatibilityCheck');
            state.completeStep('webglCheck');
            state.completeStep('gameCreation');
            state.completeStep('rendererInit');
            state.completeStep('canvasVerification');
            state.completeStep('controlsSetup');
            state.completeStep('systemsInit');
            state.completeStep('modeSelectorReady');
            state.complete();
            
            const summary = state.getState();
            expect(summary.isComplete).toBe(true);
            expect(summary.completedCount).toBe(11);
        });

        it('should track errors during initialization', () => {
            state.start();
            state.completeStep('domReady');
            
            const error = new Error('Test error');
            error.recoverable = true;
            state.recordError('webglCheck', error);
            
            const summary = state.getState();
            expect(summary.errors.length).toBe(1);
            expect(summary.completedCount).toBe(1);
        });
    });
});
