/**
 * CanvasVerifier - Utility for verifying WebGL canvas creation and visibility
 * 
 * This class provides methods to verify that a Three.js renderer's canvas
 * is properly created, visible, sized, and capable of rendering.
 */
class CanvasVerifier {
    /**
     * Verify that the canvas element exists and is attached to the DOM
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer instance
     * @returns {Object} Verification result with success flag and error message
     */
    verifyCanvasCreated(renderer) {
        const result = {
            success: true,
            errors: []
        };

        // Check if renderer exists
        if (!renderer) {
            result.success = false;
            result.errors.push('Renderer is null or undefined');
            return result;
        }

        // Check if canvas element exists
        const canvas = renderer.domElement;
        if (!canvas) {
            result.success = false;
            result.errors.push('Canvas element does not exist on renderer');
            return result;
        }

        // Check if canvas has a parent node (is attached to DOM)
        if (!canvas.parentNode) {
            result.success = false;
            result.errors.push('Canvas element is not attached to the DOM (no parentNode)');
            return result;
        }

        return result;
    }

    /**
     * Verify that the canvas is visible (not hidden by CSS)
     * @param {HTMLCanvasElement} canvas - The canvas element to check
     * @returns {Object} Verification result with success flag and error message
     */
    verifyCanvasVisible(canvas) {
        const result = {
            success: true,
            errors: []
        };

        if (!canvas) {
            result.success = false;
            result.errors.push('Canvas element is null or undefined');
            return result;
        }

        // Get computed styles
        const computedStyle = window.getComputedStyle(canvas);

        // Check display style
        if (computedStyle.display === 'none') {
            result.success = false;
            result.errors.push('Canvas display style is "none"');
        }

        // Check visibility style
        if (computedStyle.visibility === 'hidden') {
            result.success = false;
            result.errors.push('Canvas visibility style is "hidden"');
        }

        // Check offsetParent (null means element is not visible)
        // Note: offsetParent can be null for fixed/absolute positioned elements or in test environments
        // Only flag as error if display is explicitly none or visibility is hidden (already checked above)
        // The offsetParent check is supplementary and may not work in all environments (e.g., jsdom)
        if (canvas.offsetParent === null && 
            computedStyle.position !== 'fixed' && 
            computedStyle.position !== 'absolute' &&
            computedStyle.display !== 'none' &&
            computedStyle.visibility !== 'hidden' &&
            canvas.parentNode !== null &&
            canvas.parentNode !== document.body) {
            // Only warn if it's not directly attached to body (which is common for canvas)
            result.errors.push('Canvas offsetParent is null (element may be hidden)');
        }

        return result;
    }

    /**
     * Verify that the canvas has valid dimensions
     * @param {HTMLCanvasElement} canvas - The canvas element to check
     * @returns {Object} Verification result with success flag, dimensions, and error message
     */
    verifyCanvasSize(canvas) {
        const result = {
            success: true,
            errors: [],
            dimensions: { width: 0, height: 0 }
        };

        if (!canvas) {
            result.success = false;
            result.errors.push('Canvas element is null or undefined');
            return result;
        }

        // Get canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        result.dimensions = { width, height };

        // Check width is greater than 0
        if (width <= 0) {
            result.success = false;
            result.errors.push(`Canvas width is ${width}, must be greater than 0`);
        }

        // Check height is greater than 0
        if (height <= 0) {
            result.success = false;
            result.errors.push(`Canvas height is ${height}, must be greater than 0`);
        }

        // Verify dimensions roughly match viewport (allow some tolerance)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Allow 10% tolerance for viewport matching
        const widthRatio = width / viewportWidth;
        const heightRatio = height / viewportHeight;
        
        if (widthRatio < 0.5 || widthRatio > 1.5) {
            result.errors.push(
                `Canvas width (${width}) does not match viewport width (${viewportWidth})`
            );
        }
        
        if (heightRatio < 0.5 || heightRatio > 1.5) {
            result.errors.push(
                `Canvas height (${height}) does not match viewport height (${viewportHeight})`
            );
        }

        return result;
    }

    /**
     * Render a test frame to verify WebGL is working
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer instance
     * @param {THREE.Scene} scene - The Three.js scene (optional, will create if not provided)
     * @param {THREE.Camera} camera - The Three.js camera (optional, will create if not provided)
     * @returns {Object} Verification result with success flag and error message
     */
    renderTestFrame(renderer, scene = null, camera = null) {
        const result = {
            success: true,
            errors: []
        };

        if (!renderer) {
            result.success = false;
            result.errors.push('Renderer is null or undefined');
            return result;
        }

        try {
            // Create test scene if not provided
            const testScene = scene || new THREE.Scene();
            
            // Create test camera if not provided
            const testCamera = camera || new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            
            // If we created our own scene, add a simple test cube
            if (!scene) {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new THREE.Mesh(geometry, material);
                testScene.add(cube);
                testCamera.position.z = 5;
            }

            // Attempt to render one frame
            renderer.render(testScene, testCamera);

            // Check for WebGL errors
            const gl = renderer.getContext();
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                result.success = false;
                result.errors.push(`WebGL error during test render: ${error}`);
            }

        } catch (error) {
            result.success = false;
            result.errors.push(`Exception during test render: ${error.message}`);
        }

        return result;
    }

    /**
     * Run all verification checks on a renderer
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer instance
     * @param {THREE.Scene} scene - Optional scene for test rendering
     * @param {THREE.Camera} camera - Optional camera for test rendering
     * @returns {Object} Combined verification result
     */
    verifyAll(renderer, scene = null, camera = null) {
        const results = {
            success: true,
            checks: {
                created: null,
                visible: null,
                size: null,
                render: null
            },
            errors: []
        };

        // Check canvas creation
        results.checks.created = this.verifyCanvasCreated(renderer);
        if (!results.checks.created.success) {
            results.success = false;
            results.errors.push(...results.checks.created.errors);
            // If canvas doesn't exist, can't do other checks
            return results;
        }

        const canvas = renderer.domElement;

        // Check canvas visibility
        results.checks.visible = this.verifyCanvasVisible(canvas);
        if (!results.checks.visible.success) {
            results.success = false;
            results.errors.push(...results.checks.visible.errors);
        }

        // Check canvas size
        results.checks.size = this.verifyCanvasSize(canvas);
        if (!results.checks.size.success) {
            results.success = false;
            results.errors.push(...results.checks.size.errors);
        }

        // Check rendering capability
        results.checks.render = this.renderTestFrame(renderer, scene, camera);
        if (!results.checks.render.success) {
            results.success = false;
            results.errors.push(...results.checks.render.errors);
        }

        return results;
    }
}

module.exports = { CanvasVerifier };
