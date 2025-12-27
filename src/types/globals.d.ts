/**
 * Global Type Declarations
 * Declares global types for JavaScript type checking
 */

// THREE.js global namespace with common types
declare namespace THREE {
    class WebGLRenderer {
        constructor(parameters?: any);
        render(scene: any, camera: any): void;
        setSize(width: number, height: number): void;
        dispose(): void;
        [key: string]: any;
    }
    class Scene {
        constructor();
        add(...object: any[]): void;
        remove(...object: any[]): void;
        [key: string]: any;
    }
    class Camera {
        position: Vector3;
        rotation: any;
        [key: string]: any;
    }
    class PerspectiveCamera extends Camera {
        constructor(fov?: number, aspect?: number, near?: number, far?: number);
        [key: string]: any;
    }
    class Vector3 {
        constructor(x?: number, y?: number, z?: number);
        x: number;
        y: number;
        z: number;
        [key: string]: any;
    }
    class Material {
        [key: string]: any;
    }
    class MeshBasicMaterial extends Material {
        constructor(parameters?: any);
        [key: string]: any;
    }
    class MeshLambertMaterial extends Material {
        constructor(parameters?: any);
        [key: string]: any;
    }
    class LineBasicMaterial extends Material {
        constructor(parameters?: any);
        [key: string]: any;
    }
    class Geometry {
        [key: string]: any;
    }
    class BufferGeometry extends Geometry {
        [key: string]: any;
    }
    class OctahedronGeometry extends BufferGeometry {
        constructor(radius?: number, detail?: number);
        [key: string]: any;
    }
    class ConeGeometry extends BufferGeometry {
        constructor(radius?: number, height?: number, radialSegments?: number);
        [key: string]: any;
    }
    class IcosahedronGeometry extends BufferGeometry {
        constructor(radius?: number, detail?: number);
        [key: string]: any;
    }
    class BoxGeometry extends BufferGeometry {
        constructor(width?: number, height?: number, depth?: number);
        [key: string]: any;
    }
    class SphereGeometry extends BufferGeometry {
        constructor(radius?: number, widthSegments?: number, heightSegments?: number);
        [key: string]: any;
    }
    class Texture {
        constructor(canvas?: any);
        [key: string]: any;
    }
    class Mesh {
        constructor(geometry?: any, material?: any);
        [key: string]: any;
    }
    class BufferAttribute {
        constructor(array: any, itemSize: number);
        [key: string]: any;
    }
    class Color {
        constructor(r?: any, g?: any, b?: any);
        [key: string]: any;
    }
    class Matrix4 {
        constructor();
        [key: string]: any;
    }
    class Vector2 {
        constructor(x?: number, y?: number);
        x: number;
        y: number;
        [key: string]: any;
    }
    class AmbientLight {
        constructor(color?: any, intensity?: number);
        [key: string]: any;
    }
    class DirectionalLight {
        constructor(color?: any, intensity?: number);
        position: Vector3;
        [key: string]: any;
    }
    class EffectComposer {
        constructor(renderer?: any);
        [key: string]: any;
    }
    class RenderPass {
        constructor(scene?: any, camera?: any);
        [key: string]: any;
    }
    class ShaderPass {
        constructor(shader?: any);
        [key: string]: any;
    }
    class GridHelper {
        constructor(size?: number, divisions?: number, color1?: any, color2?: any);
        [key: string]: any;
    }
    class BoxHelper {
        constructor(object?: any, color?: any);
        [key: string]: any;
    }
    class PointsMaterial extends Material {
        constructor(parameters?: any);
        [key: string]: any;
    }
    class Points {
        constructor(geometry?: any, material?: any);
        [key: string]: any;
    }
    class Float32BufferAttribute extends BufferAttribute {
        constructor(array: any, itemSize: number);
        [key: string]: any;
    }
    class LineSegments {
        constructor(geometry?: any, material?: any);
        [key: string]: any;
    }
    class Euler {
        constructor(x?: number, y?: number, z?: number, order?: string);
        [key: string]: any;
    }
    class Quaternion {
        constructor(x?: number, y?: number, z?: number, w?: number);
        [key: string]: any;
    }
    class InstancedMesh {
        constructor(geometry?: any, material?: any, count?: number);
        [key: string]: any;
    }
    class DataTexture extends Texture {
        constructor(data?: any, width?: number, height?: number, format?: any, type?: any);
        [key: string]: any;
    }
    class ShaderMaterial extends Material {
        constructor(parameters?: any);
        [key: string]: any;
    }
    class Frustum {
        constructor();
        [key: string]: any;
    }
    class Sphere {
        constructor(center?: any, radius?: number);
        [key: string]: any;
    }
    class UnrealBloomPass {
        constructor(resolution?: any, strength?: number, radius?: number, threshold?: number);
        [key: string]: any;
    }
    // THREE.js constants
    const ClampToEdgeWrapping: number;
    const LinearFilter: number;
    const RGBAFormat: number;
    const AdditiveBlending: number;
    const DoubleSide: number;
    // Add other THREE.js classes as needed
}

// Make THREE available globally
declare const THREE: typeof THREE & {
    [key: string]: any;
};

// Window extensions for custom properties
interface Window {
    audioManager?: any;
    scoreDisplayInstance?: any;
    glowEffectManager?: any;
    webkitAudioContext?: typeof AudioContext;
    glowSettingsUI?: any;
    renderingEngine?: any;
    glowDebug?: any;
    difficultyManager?: any;
    powerUpManager?: any;
    statusIndicator?: any;
    modeSelector?: any;
    survivalTimer?: any;
    leaderboardSystem?: any;
    achievementSystem?: any;
    showModeSelector?: any;
    performanceMonitor?: any;
    performanceDegradationManager?: any;
    cameraEffectsManager?: any;
    musicSettingsUI?: any;
    getMusicPlayer?: () => any;
    getMusicSettings?: () => any;
    isMusicAvailable?: () => boolean;
}

// Navigator extensions for device capabilities
interface Navigator {
    deviceMemory?: number;
}

// Performance extensions for memory monitoring
interface Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

// WebGL RenderingContext extensions
interface RenderingContext {
    getParameter(pname: any): any;
    getExtension(name: string): any;
    MAX_TEXTURE_SIZE?: number;
    MAX_RENDERBUFFER_SIZE?: number;
    VERSION?: number;
    VENDOR?: number;
    RENDERER?: number;
    SHADING_LANGUAGE_VERSION?: number;
}

interface WebGLRenderingContext extends RenderingContext {
    MAX_TEXTURE_SIZE: number;
    MAX_RENDERBUFFER_SIZE: number;
}

// Custom Error extensions
interface Error {
    actionableSteps?: string[];
    recoverable?: boolean;
}

// Global type aliases for commonly used but undefined types
declare type LocalScoring = any;
declare type ActiveEffect = any;
declare type CameraEffectsManager = any;
declare type MotionBlurController = any;
declare type CameraShakeController = any;

