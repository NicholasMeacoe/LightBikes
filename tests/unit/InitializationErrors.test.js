const { DOMNotReadyError, CanvasCreationError, ModeSelectorError } = require('@/utils/InitializationErrors.js');

describe('InitializationErrors', () => {
    describe('DOMNotReadyError', () => {
        it('should create error with default message', () => {
            const error = new DOMNotReadyError();
            
            expect(error.message).toBe('DOM is not ready for initialization');
            expect(error.name).toBe('DOMNotReadyError');
        });

        it('should create error with custom message', () => {
            const error = new DOMNotReadyError('Custom DOM error');
            
            expect(error.message).toBe('Custom DOM error');
            expect(error.name).toBe('DOMNotReadyError');
        });

        it('should be marked as recoverable', () => {
            const error = new DOMNotReadyError();
            
            expect(error.recoverable).toBe(true);
        });

        it('should have actionable steps', () => {
            const error = new DOMNotReadyError();
            
            expect(error.actionableSteps).toBeDefined();
            expect(Array.isArray(error.actionableSteps)).toBe(true);
            expect(error.actionableSteps.length).toBeGreaterThan(0);
        });

        it('should include retry in actionable steps', () => {
            const error = new DOMNotReadyError();
            
            const hasRetryStep = error.actionableSteps.some(step => 
                step.toLowerCase().includes('retry')
            );
            expect(hasRetryStep).toBe(true);
        });

        it('should be instance of Error', () => {
            const error = new DOMNotReadyError();
            
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('CanvasCreationError', () => {
        it('should create error with default message', () => {
            const error = new CanvasCreationError();
            
            expect(error.message).toBe('Failed to create or verify game canvas');
            expect(error.name).toBe('CanvasCreationError');
        });

        it('should create error with custom message', () => {
            const error = new CanvasCreationError('Custom canvas error');
            
            expect(error.message).toBe('Custom canvas error');
            expect(error.name).toBe('CanvasCreationError');
        });

        it('should accept details parameter', () => {
            const details = { width: 0, height: 0 };
            const error = new CanvasCreationError('Canvas error', details);
            
            expect(error.details).toEqual(details);
        });

        it('should be marked as not recoverable', () => {
            const error = new CanvasCreationError();
            
            expect(error.recoverable).toBe(false);
        });

        it('should have actionable steps', () => {
            const error = new CanvasCreationError();
            
            expect(error.actionableSteps).toBeDefined();
            expect(Array.isArray(error.actionableSteps)).toBe(true);
            expect(error.actionableSteps.length).toBeGreaterThan(0);
        });

        it('should include browser update in actionable steps', () => {
            const error = new CanvasCreationError();
            
            const hasBrowserUpdate = error.actionableSteps.some(step => 
                step.toLowerCase().includes('browser') && step.toLowerCase().includes('update')
            );
            expect(hasBrowserUpdate).toBe(true);
        });

        it('should include WebGL reference in actionable steps', () => {
            const error = new CanvasCreationError();
            
            const hasWebGLRef = error.actionableSteps.some(step => 
                step.toLowerCase().includes('webgl')
            );
            expect(hasWebGLRef).toBe(true);
        });

        it('should be instance of Error', () => {
            const error = new CanvasCreationError();
            
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('ModeSelectorError', () => {
        it('should create error with default message', () => {
            const error = new ModeSelectorError();
            
            expect(error.message).toBe('Mode selector failed to display');
            expect(error.name).toBe('ModeSelectorError');
        });

        it('should create error with custom message', () => {
            const error = new ModeSelectorError('Custom mode selector error');
            
            expect(error.message).toBe('Custom mode selector error');
            expect(error.name).toBe('ModeSelectorError');
        });

        it('should accept details parameter', () => {
            const details = { element: null, visible: false };
            const error = new ModeSelectorError('Mode selector error', details);
            
            expect(error.details).toEqual(details);
        });

        it('should be marked as recoverable', () => {
            const error = new ModeSelectorError();
            
            expect(error.recoverable).toBe(true);
        });

        it('should have actionable steps', () => {
            const error = new ModeSelectorError();
            
            expect(error.actionableSteps).toBeDefined();
            expect(Array.isArray(error.actionableSteps)).toBe(true);
            expect(error.actionableSteps.length).toBeGreaterThan(0);
        });

        it('should include fallback mention in actionable steps', () => {
            const error = new ModeSelectorError();
            
            const hasFallback = error.actionableSteps.some(step => 
                step.toLowerCase().includes('fallback')
            );
            expect(hasFallback).toBe(true);
        });

        it('should include JavaScript check in actionable steps', () => {
            const error = new ModeSelectorError();
            
            const hasJSCheck = error.actionableSteps.some(step => 
                step.toLowerCase().includes('javascript')
            );
            expect(hasJSCheck).toBe(true);
        });

        it('should be instance of Error', () => {
            const error = new ModeSelectorError();
            
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('Error inheritance', () => {
        it('should all inherit from Error', () => {
            const domError = new DOMNotReadyError();
            const canvasError = new CanvasCreationError();
            const modeSelectorError = new ModeSelectorError();
            
            expect(domError instanceof Error).toBe(true);
            expect(canvasError instanceof Error).toBe(true);
            expect(modeSelectorError instanceof Error).toBe(true);
        });

        it('should have proper error names', () => {
            const domError = new DOMNotReadyError();
            const canvasError = new CanvasCreationError();
            const modeSelectorError = new ModeSelectorError();
            
            expect(domError.name).toBe('DOMNotReadyError');
            expect(canvasError.name).toBe('CanvasCreationError');
            expect(modeSelectorError.name).toBe('ModeSelectorError');
        });

        it('should have stack traces', () => {
            const domError = new DOMNotReadyError();
            const canvasError = new CanvasCreationError();
            const modeSelectorError = new ModeSelectorError();
            
            expect(domError.stack).toBeDefined();
            expect(canvasError.stack).toBeDefined();
            expect(modeSelectorError.stack).toBeDefined();
        });
    });
});
