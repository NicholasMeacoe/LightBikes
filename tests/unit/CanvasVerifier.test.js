const { CanvasVerifier } = require('@/utils/CanvasVerifier.js');

describe('CanvasVerifier', () => {
    let verifier;
    let mockRenderer;
    let mockCanvas;

    beforeEach(() => {
        verifier = new CanvasVerifier();
        
        // Create mock canvas element
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = 800;
        mockCanvas.height = 600;
        
        // Mock window dimensions
        global.innerWidth = 1024;
        global.innerHeight = 768;
        
        // Create mock renderer
        mockRenderer = {
            domElement: mockCanvas,
            render: jest.fn(),
            getContext: jest.fn(() => ({
                getError: jest.fn(() => 0), // NO_ERROR
                NO_ERROR: 0
            }))
        };
    });

    describe('verifyCanvasCreated', () => {
        it('should return success when canvas exists and has parentNode', () => {
            document.body.appendChild(mockCanvas);
            
            const result = verifier.verifyCanvasCreated(mockRenderer);
            
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            
            document.body.removeChild(mockCanvas);
        });

        it('should fail when renderer is null', () => {
            const result = verifier.verifyCanvasCreated(null);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Renderer is null or undefined');
        });

        it('should fail when renderer has no domElement', () => {
            const badRenderer = {};
            
            const result = verifier.verifyCanvasCreated(badRenderer);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas element does not exist on renderer');
        });

        it('should fail when canvas has no parentNode', () => {
            const result = verifier.verifyCanvasCreated(mockRenderer);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas element is not attached to the DOM (no parentNode)');
        });
    });

    describe('verifyCanvasVisible', () => {
        beforeEach(() => {
            document.body.appendChild(mockCanvas);
        });

        afterEach(() => {
            if (mockCanvas.parentNode) {
                document.body.removeChild(mockCanvas);
            }
        });

        it('should return success when canvas is visible', () => {
            const result = verifier.verifyCanvasVisible(mockCanvas);
            
            if (!result.success) {
                console.log('Visibility check failed:', result.errors);
            }
            
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail when canvas is null', () => {
            const result = verifier.verifyCanvasVisible(null);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas element is null or undefined');
        });

        it('should fail when canvas display is none', () => {
            mockCanvas.style.display = 'none';
            
            const result = verifier.verifyCanvasVisible(mockCanvas);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas display style is "none"');
        });

        it('should fail when canvas visibility is hidden', () => {
            mockCanvas.style.visibility = 'hidden';
            
            const result = verifier.verifyCanvasVisible(mockCanvas);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas visibility style is "hidden"');
        });

        it('should handle fixed position elements correctly', () => {
            mockCanvas.style.position = 'fixed';
            // offsetParent is null for fixed elements, but that's OK
            
            const result = verifier.verifyCanvasVisible(mockCanvas);
            
            expect(result.success).toBe(true);
        });
    });

    describe('verifyCanvasSize', () => {
        it('should return success when canvas has valid dimensions', () => {
            const result = verifier.verifyCanvasSize(mockCanvas);
            
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.dimensions).toEqual({ width: 800, height: 600 });
        });

        it('should fail when canvas is null', () => {
            const result = verifier.verifyCanvasSize(null);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas element is null or undefined');
        });

        it('should fail when canvas width is 0', () => {
            mockCanvas.width = 0;
            
            const result = verifier.verifyCanvasSize(mockCanvas);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas width is 0, must be greater than 0');
        });

        it('should fail when canvas height is 0', () => {
            mockCanvas.height = 0;
            
            const result = verifier.verifyCanvasSize(mockCanvas);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canvas height is 0, must be greater than 0');
        });

        it('should warn when canvas dimensions do not match viewport', () => {
            mockCanvas.width = 100; // Much smaller than viewport
            mockCanvas.height = 100;
            
            const result = verifier.verifyCanvasSize(mockCanvas);
            
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('does not match viewport'))).toBe(true);
        });

        it('should accept dimensions within tolerance of viewport', () => {
            mockCanvas.width = 1024;
            mockCanvas.height = 768;
            
            const result = verifier.verifyCanvasSize(mockCanvas);
            
            expect(result.success).toBe(true);
        });
    });

    describe('renderTestFrame', () => {
        let mockScene;
        let mockCamera;

        beforeEach(() => {
            // Mock THREE.js objects
            global.THREE = {
                Scene: jest.fn(() => ({
                    add: jest.fn()
                })),
                PerspectiveCamera: jest.fn(() => ({
                    position: { z: 0 }
                })),
                BoxGeometry: jest.fn(() => ({})),
                MeshBasicMaterial: jest.fn(() => ({})),
                Mesh: jest.fn(() => ({}))
            };

            mockScene = { add: jest.fn() };
            mockCamera = { position: { z: 0 } };
        });

        afterEach(() => {
            delete global.THREE;
        });

        it('should return success when test frame renders successfully', () => {
            const result = verifier.renderTestFrame(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should fail when renderer is null', () => {
            const result = verifier.renderTestFrame(null);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Renderer is null or undefined');
        });

        it('should create test scene and camera if not provided', () => {
            const result = verifier.renderTestFrame(mockRenderer);
            
            expect(result.success).toBe(true);
            expect(mockRenderer.render).toHaveBeenCalled();
            expect(global.THREE.Scene).toHaveBeenCalled();
            expect(global.THREE.PerspectiveCamera).toHaveBeenCalled();
        });

        it('should fail when WebGL error occurs', () => {
            mockRenderer.getContext = jest.fn(() => ({
                getError: jest.fn(() => 1234), // Some error code
                NO_ERROR: 0
            }));
            
            const result = verifier.renderTestFrame(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('WebGL error during test render: 1234');
        });

        it('should fail when render throws exception', () => {
            mockRenderer.render = jest.fn(() => {
                throw new Error('Render failed');
            });
            
            const result = verifier.renderTestFrame(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Exception during test render: Render failed');
        });
    });

    describe('verifyAll', () => {
        let mockScene;
        let mockCamera;

        beforeEach(() => {
            document.body.appendChild(mockCanvas);
            
            global.THREE = {
                Scene: jest.fn(() => ({
                    add: jest.fn()
                })),
                PerspectiveCamera: jest.fn(() => ({
                    position: { z: 0 }
                })),
                BoxGeometry: jest.fn(() => ({})),
                MeshBasicMaterial: jest.fn(() => ({})),
                Mesh: jest.fn(() => ({}))
            };

            mockScene = { add: jest.fn() };
            mockCamera = { position: { z: 0 } };
        });

        afterEach(() => {
            if (mockCanvas.parentNode) {
                document.body.removeChild(mockCanvas);
            }
            delete global.THREE;
        });

        it('should return success when all checks pass', () => {
            const result = verifier.verifyAll(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.checks.created.success).toBe(true);
            expect(result.checks.visible.success).toBe(true);
            expect(result.checks.size.success).toBe(true);
            expect(result.checks.render.success).toBe(true);
        });

        it('should fail and stop early if canvas not created', () => {
            const badRenderer = {};
            
            const result = verifier.verifyAll(badRenderer);
            
            expect(result.success).toBe(false);
            expect(result.checks.created.success).toBe(false);
            expect(result.checks.visible).toBeNull();
            expect(result.checks.size).toBeNull();
            expect(result.checks.render).toBeNull();
        });

        it('should continue checking even if visibility fails', () => {
            mockCanvas.style.display = 'none';
            
            const result = verifier.verifyAll(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(false);
            expect(result.checks.created.success).toBe(true);
            expect(result.checks.visible.success).toBe(false);
            expect(result.checks.size.success).toBe(true);
            expect(result.checks.render.success).toBe(true);
        });

        it('should aggregate all errors', () => {
            mockCanvas.style.display = 'none';
            mockCanvas.width = 0;
            
            const result = verifier.verifyAll(mockRenderer, mockScene, mockCamera);
            
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors.some(e => e.includes('display'))).toBe(true);
            expect(result.errors.some(e => e.includes('width'))).toBe(true);
        });
    });
});
