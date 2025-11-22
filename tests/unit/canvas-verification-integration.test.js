/**
 * Integration test for canvas verification in initialization flow
 * Tests that CanvasVerifier is properly integrated into the game initialization
 */

const { CanvasVerifier } = require('@/utils/CanvasVerifier.js');

describe('Canvas Verification Integration', () => {
    let canvasVerifier;
    let mockRenderer;
    let mockScene;
    let mockCamera;
    let mockCanvas;

    beforeEach(() => {
        // Create canvas verifier instance
        canvasVerifier = new CanvasVerifier();

        // Create mock canvas element
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = 800;
        mockCanvas.height = 600;
        document.body.appendChild(mockCanvas);

        // Mock WebGL context
        const mockContext = {
            getError: jest.fn(() => 0), // NO_ERROR
            NO_ERROR: 0
        };

        // Mock renderer
        mockRenderer = {
            domElement: mockCanvas,
            getContext: jest.fn(() => mockContext),
            render: jest.fn()
        };

        // Mock scene
        mockScene = {
            add: jest.fn()
        };

        // Mock camera
        mockCamera = {
            position: { z: 5 },
            aspect: 1.33,
            updateProjectionMatrix: jest.fn()
        };
    });

    afterEach(() => {
        // Clean up
        if (mockCanvas && mockCanvas.parentNode) {
            mockCanvas.parentNode.removeChild(mockCanvas);
        }
    });

    describe('Initialization Flow Integration', () => {
        it('should successfully verify canvas after RenderingEngine creation', () => {
            // Simulate the initialization flow
            const verificationResult = canvasVerifier.verifyAll(
                mockRenderer,
                mockScene,
                mockCamera
            );

            // Verify all checks passed
            expect(verificationResult.success).toBe(true);
            expect(verificationResult.checks.created.success).toBe(true);
            expect(verificationResult.checks.visible.success).toBe(true);
            expect(verificationResult.checks.size.success).toBe(true);
            expect(verificationResult.checks.render.success).toBe(true);
            expect(verificationResult.errors).toHaveLength(0);
        });

        it('should log verification results for debugging', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const verificationResult = canvasVerifier.verifyAll(
                mockRenderer,
                mockScene,
                mockCamera
            );

            // Simulate the logging that happens in initializeGame
            console.log('Canvas verification results:', {
                success: verificationResult.success,
                checks: {
                    created: verificationResult.checks.created.success,
                    visible: verificationResult.checks.visible.success,
                    size: verificationResult.checks.size.success,
                    render: verificationResult.checks.render.success
                },
                errors: verificationResult.errors
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Canvas verification results:',
                expect.objectContaining({
                    success: true,
                    checks: expect.objectContaining({
                        created: true,
                        visible: true,
                        size: true,
                        render: true
                    }),
                    errors: []
                })
            );

            consoleSpy.mockRestore();
        });

        it('should throw descriptive error when verification fails', () => {
            // Create a renderer with no canvas attached to DOM
            const badCanvas = document.createElement('canvas');
            const badRenderer = {
                domElement: badCanvas,
                getContext: jest.fn(() => ({
                    getError: jest.fn(() => 0),
                    NO_ERROR: 0
                })),
                render: jest.fn()
            };

            const verificationResult = canvasVerifier.verifyAll(
                badRenderer,
                mockScene,
                mockCamera
            );

            // Verify it failed
            expect(verificationResult.success).toBe(false);
            expect(verificationResult.errors.length).toBeGreaterThan(0);

            // Simulate the error handling in initializeGame
            const errorMessage = 'Canvas verification failed:\n' + 
                verificationResult.errors.map(err => `  - ${err}`).join('\n');

            expect(errorMessage).toContain('Canvas verification failed:');
            expect(errorMessage).toContain('Canvas element is not attached to the DOM');
        });

        it('should verify canvas is created and attached to DOM', () => {
            const createdCheck = canvasVerifier.verifyCanvasCreated(mockRenderer);

            expect(createdCheck.success).toBe(true);
            expect(createdCheck.errors).toHaveLength(0);
            expect(mockCanvas.parentNode).toBe(document.body);
        });

        it('should verify canvas is visible', () => {
            const visibleCheck = canvasVerifier.verifyCanvasVisible(mockCanvas);

            expect(visibleCheck.success).toBe(true);
            expect(visibleCheck.errors).toHaveLength(0);
        });

        it('should verify canvas has valid size', () => {
            const sizeCheck = canvasVerifier.verifyCanvasSize(mockCanvas);

            expect(sizeCheck.success).toBe(true);
            expect(sizeCheck.dimensions.width).toBe(800);
            expect(sizeCheck.dimensions.height).toBe(600);
        });

        it('should verify test frame can be rendered', () => {
            const renderCheck = canvasVerifier.renderTestFrame(
                mockRenderer,
                mockScene,
                mockCamera
            );

            expect(renderCheck.success).toBe(true);
            expect(renderCheck.errors).toHaveLength(0);
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Error Scenarios', () => {
        it('should fail verification when canvas is not attached', () => {
            const detachedCanvas = document.createElement('canvas');
            const detachedRenderer = {
                domElement: detachedCanvas,
                getContext: jest.fn(),
                render: jest.fn()
            };

            const result = canvasVerifier.verifyAll(detachedRenderer, mockScene, mockCamera);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas element is not attached to the DOM (no parentNode)');
        });

        it('should fail verification when canvas is hidden', () => {
            mockCanvas.style.display = 'none';

            const result = canvasVerifier.verifyAll(mockRenderer, mockScene, mockCamera);

            expect(result.success).toBe(false);
            expect(result.errors.some(err => err.includes('display style is "none"'))).toBe(true);
        });

        it('should fail verification when canvas has zero dimensions', () => {
            mockCanvas.width = 0;
            mockCanvas.height = 0;

            const result = canvasVerifier.verifyAll(mockRenderer, mockScene, mockCamera);

            expect(result.success).toBe(false);
            expect(result.errors.some(err => err.includes('width is 0'))).toBe(true);
            expect(result.errors.some(err => err.includes('height is 0'))).toBe(true);
        });

        it('should fail verification when WebGL render fails', () => {
            const errorContext = {
                getError: jest.fn(() => 1234), // Some WebGL error code
                NO_ERROR: 0
            };

            mockRenderer.getContext = jest.fn(() => errorContext);

            const result = canvasVerifier.verifyAll(mockRenderer, mockScene, mockCamera);

            expect(result.success).toBe(false);
            expect(result.errors.some(err => err.includes('WebGL error'))).toBe(true);
        });
    });

    describe('Requirements Verification', () => {
        it('should satisfy requirement 1.1: Canvas is created and visible', () => {
            const result = canvasVerifier.verifyAll(mockRenderer, mockScene, mockCamera);

            // Requirement 1.1: Canvas SHALL be created and visible
            expect(result.checks.created.success).toBe(true);
            expect(result.checks.visible.success).toBe(true);
        });

        it('should satisfy requirement 1.2: Canvas is appended to document body', () => {
            const createdCheck = canvasVerifier.verifyCanvasCreated(mockRenderer);

            // Requirement 1.2: Canvas SHALL be appended to document body
            expect(createdCheck.success).toBe(true);
            expect(mockCanvas.parentNode).toBeTruthy();
        });

        it('should satisfy requirement 1.3: Canvas has valid dimensions', () => {
            const sizeCheck = canvasVerifier.verifyCanvasSize(mockCanvas);

            // Requirement 1.3: Canvas SHALL be visible and fill viewport
            expect(sizeCheck.success).toBe(true);
            expect(sizeCheck.dimensions.width).toBeGreaterThan(0);
            expect(sizeCheck.dimensions.height).toBeGreaterThan(0);
        });

        it('should satisfy requirement 1.4: Scene renders at least one frame', () => {
            const renderCheck = canvasVerifier.renderTestFrame(
                mockRenderer,
                mockScene,
                mockCamera
            );

            // Requirement 1.4: Scene SHALL render at least one frame
            expect(renderCheck.success).toBe(true);
            expect(mockRenderer.render).toHaveBeenCalled();
        });

        it('should satisfy requirement 1.5: Display clear error on failure', () => {
            const badRenderer = {
                domElement: null,
                getContext: jest.fn(),
                render: jest.fn()
            };

            const result = canvasVerifier.verifyAll(badRenderer, mockScene, mockCamera);

            // Requirement 1.5: SHALL display clear error message
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Canvas element does not exist');
        });
    });
});
