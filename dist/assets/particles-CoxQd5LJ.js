var e = Object.defineProperty,
    t = Object.defineProperties,
    i = Object.getOwnPropertyDescriptors,
    r = Object.getOwnPropertySymbols,
    a = Object.prototype.hasOwnProperty,
    s = Object.prototype.propertyIsEnumerable,
    o = (t, i, r) =>
        i in t ? e(t, i, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (t[i] = r),
    l = (e, t) => {
        for (var i in t || (t = {})) a.call(t, i) && o(e, i, t[i]);
        if (r) for (var i of r(t)) s.call(t, i) && o(e, i, t[i]);
        return e;
    };
import { _ as n, a as c } from './audio-D35En-7M.js';
var h = { exports: {} };
h.exports = {
    Particle: class {
        constructor() {
            ((this.position = new THREE.Vector3()),
                (this.velocity = new THREE.Vector3()),
                (this.acceleration = new THREE.Vector3()),
                (this.color = new THREE.Color()),
                (this.size = 0.05),
                (this.originalSize = 0.05),
                (this.lifetime = 1),
                (this.age = 0),
                (this.active = !1),
                (this.type = 'trail'),
                (this.culled = !1),
                (this.lodLevel = 'high'));
        }
        reset() {
            (this.position.set(0, 0, 0),
                this.velocity.set(0, 0, 0),
                this.acceleration.set(0, 0, 0),
                this.color.setHex(16777215),
                (this.size = 0.05),
                (this.originalSize = 0.05),
                (this.lifetime = 1),
                (this.age = 0),
                (this.active = !1),
                (this.type = 'trail'),
                (this.culled = !1),
                (this.lodLevel = 'high'));
        }
        update(e) {
            this.active &&
                ((this.age += e),
                this.age >= this.lifetime
                    ? (this.active = !1)
                    : (this.velocity.add(this.acceleration.clone().multiplyScalar(e)),
                      this.position.add(this.velocity.clone().multiplyScalar(e))));
        }
        getAlpha() {
            return this.active ? Math.max(0, 1 - this.age / this.lifetime) : 0;
        }
    },
};
const m = (null == h.exports ? {} : h.exports).default || h.exports,
    p = Object.freeze(
        Object.defineProperty({ __proto__: null, default: m }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var u = { exports: {} };
const { logger: d } = n || c,
    { Particle: f } = m || p;
u.exports = {
    ParticlePool: class {
        constructor(e = 200) {
            ((this.maxParticles = e),
                (this.particles = []),
                (this.activeParticles = []),
                (this.inactiveParticles = []),
                (this.activeCount = 0),
                this.initializePool());
        }
        initializePool() {
            for (let e = 0; e < this.maxParticles; e++) {
                const e = new f();
                (this.particles.push(e), this.inactiveParticles.push(e));
            }
        }
        acquire() {
            if (0 === this.inactiveParticles.length) return null;
            const e = this.inactiveParticles.pop();
            return (
                e.reset(),
                (e.active = !0),
                this.activeParticles.push(e),
                this.activeCount++,
                e
            );
        }
        release(e) {
            if (!e) return;
            const t = this.activeParticles.indexOf(e);
            -1 !== t &&
                (this.activeParticles.splice(t, 1),
                this.activeCount--,
                (e.active = !1),
                e.reset(),
                this.inactiveParticles.push(e));
        }
        getActiveParticles() {
            return this.activeParticles.slice();
        }
        getActiveCount() {
            return this.activeCount;
        }
        getMaxParticles() {
            return this.maxParticles;
        }
        getAvailableCount() {
            return this.inactiveParticles.length;
        }
        hasAvailable() {
            return this.inactiveParticles.length > 0;
        }
        getUtilization() {
            return (this.activeCount / this.maxParticles) * 100;
        }
        releaseAll() {
            const e = [...this.activeParticles];
            for (const t of e) this.release(t);
        }
        updateParticles(e) {
            const t = [];
            (this.batchUpdateParticles(e, t), this.batchReleaseParticles(t));
        }
        batchUpdateParticles(e, t) {
            const i = this.activeParticles.length;
            for (let r = 0; r < i; r += 32) {
                const a = Math.min(r + 32, i);
                for (let i = r; i < a; i++) {
                    const r = this.activeParticles[i];
                    r && (r.update(e), r.active || t.push(r));
                }
            }
        }
        batchReleaseParticles(e) {
            if (0 !== e.length) {
                e.sort((e, t) => {
                    const i = this.activeParticles.indexOf(e);
                    return this.activeParticles.indexOf(t) - i;
                });
                for (const t of e) this.release(t);
            }
        }
        getStats() {
            return {
                maxParticles: this.maxParticles,
                activeCount: this.activeCount,
                availableCount: this.inactiveParticles.length,
                utilization: this.getUtilization(),
                totalParticles: this.particles.length,
            };
        }
        validateIntegrity() {
            const e = this.activeParticles.length + this.inactiveParticles.length;
            if (e !== this.maxParticles)
                return (
                    d.warn(
                        `Pool integrity error: Expected ${this.maxParticles} particles, found ${e}`
                    ),
                    !1
                );
            if (this.activeCount !== this.activeParticles.length)
                return (
                    d.warn(
                        `Pool integrity error: Active count mismatch - counter: ${this.activeCount}, array: ${this.activeParticles.length}`
                    ),
                    !1
                );
            const t = [...this.activeParticles, ...this.inactiveParticles];
            if (new Set(t).size !== t.length)
                return (d.warn('Pool integrity error: Duplicate particles detected'), !1);
            for (const i of this.activeParticles)
                if (!i.active)
                    return (d.warn('Pool integrity error: Inactive particle in active pool'), !1);
            for (const i of this.inactiveParticles)
                if (i.active)
                    return (d.warn('Pool integrity error: Active particle in inactive pool'), !1);
            return !0;
        }
        dispose() {
            ((this.particles.length = 0),
                (this.activeParticles.length = 0),
                (this.inactiveParticles.length = 0),
                (this.activeCount = 0));
        }
    },
};
const y = (null == u.exports ? {} : u.exports).default || u.exports,
    g = Object.freeze(
        Object.defineProperty({ __proto__: null, default: y }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var P = { exports: {} };
const { createLogger: v } = n || c,
    S = v('PerformanceMonitor');
P.exports = {
    PerformanceMonitor: class {
        constructor() {
            ((this.frameRateTarget = 60),
                (this.frameRateThreshold = 45),
                (this.frameRateHistory = []),
                (this.frameRateHistorySize = 60),
                (this.lastFrameTime =
                    'undefined' != typeof performance ? performance.now() : Date.now()),
                (this.frameStartTime = this.lastFrameTime),
                (this.frameCount = 0),
                (this.consecutivePoorFrames = 0),
                (this.consecutiveGoodFrames = 0),
                (this.poorFPSThreshold = 35),
                (this.goodFPSThreshold = 55),
                (this.aiCalculationTimeTarget = 2),
                (this.aiCalculationHistory = []),
                (this.aiCalculationHistorySize = 30),
                (this.collisionDetectionTimeTarget = 5),
                (this.collisionDetectionHistory = []),
                (this.collisionDetectionHistorySize = 30),
                (this.performanceMetrics = {
                    currentFPS: 60,
                    averageFPS: 60,
                    minFPS: 60,
                    maxFPS: 60,
                    aiCalculationTime: 0,
                    averageAICalculationTime: 0,
                    maxAICalculationTime: 0,
                    collisionDetectionTime: 0,
                    averageCollisionDetectionTime: 0,
                    maxCollisionDetectionTime: 0,
                    memoryUsage: {},
                    performanceWarnings: [],
                }),
                (this.lowFPSStartTime = null),
                (this.lowFPSDuration = 0),
                (this.lowFPSThreshold = 3e3),
                (this.memoryCheckInterval = 1e3),
                (this.lastMemoryCheck = 0),
                (this.reportingEnabled = !1),
                (this.reportingInterval = 5e3),
                (this.lastReport = 0),
                this.initializePerformanceObserver());
        }
        initializePerformanceObserver() {
            if ('undefined' != typeof PerformanceObserver)
                try {
                    ((this.performanceObserver = new PerformanceObserver((e) => {
                        e.getEntries().forEach((e) => {
                            'measure' === e.entryType && this.handlePerformanceMeasure(e);
                        });
                    })),
                        this.performanceObserver.observe({ entryTypes: ['measure'] }));
                } catch (e) {
                    S.debug('Performance Observer not available:', e.message);
                }
        }
        handlePerformanceMeasure(e) {
            switch (e.name) {
                case 'ai-calculation':
                    this.recordAICalculationTime(e.duration);
                    break;
                case 'collision-detection':
                    this.recordCollisionDetectionTime(e.duration);
            }
        }
        startFrameMonitoring() {
            this.frameStartTime =
                'undefined' != typeof performance ? performance.now() : Date.now();
        }
        endFrameMonitoring() {
            const e = 'undefined' != typeof performance ? performance.now() : Date.now(),
                t = 1e3 / (e - this.frameStartTime);
            (this.frameRateHistory.push(t),
                this.frameRateHistory.length > this.frameRateHistorySize &&
                    this.frameRateHistory.shift(),
                (this.performanceMetrics.currentFPS = t),
                (this.performanceMetrics.averageFPS = this.calculateAverageFPS()),
                (this.performanceMetrics.minFPS = Math.min(...this.frameRateHistory)),
                (this.performanceMetrics.maxFPS = Math.max(...this.frameRateHistory)),
                this.checkLowFPSCondition(t, e),
                t < this.poorFPSThreshold
                    ? (this.consecutivePoorFrames++, (this.consecutiveGoodFrames = 0))
                    : t > this.goodFPSThreshold
                      ? (this.consecutiveGoodFrames++, (this.consecutivePoorFrames = 0))
                      : ((this.consecutivePoorFrames = 0), (this.consecutiveGoodFrames = 0)),
                this.frameCount++,
                (this.lastFrameTime = e));
        }
        calculateAverageFPS() {
            if (0 === this.frameRateHistory.length) return 60;
            return this.frameRateHistory.reduce((e, t) => e + t, 0) / this.frameRateHistory.length;
        }
        checkLowFPSCondition(e, t) {
            e < this.frameRateThreshold
                ? (null === this.lowFPSStartTime && (this.lowFPSStartTime = t),
                  (this.lowFPSDuration = t - this.lowFPSStartTime))
                : ((this.lowFPSStartTime = null), (this.lowFPSDuration = 0));
        }
        isPerformanceDegradationDetected() {
            return this.lowFPSDuration >= this.lowFPSThreshold;
        }
        startAICalculation(e) {
            ('undefined' != typeof performance &&
                performance.mark &&
                performance.mark(`ai-calculation-start-${e}`),
                (this.aiCalculationStartTime =
                    'undefined' != typeof performance ? performance.now() : Date.now()));
        }
        endAICalculation(e) {
            const t =
                ('undefined' != typeof performance ? performance.now() : Date.now()) -
                this.aiCalculationStartTime;
            ('undefined' != typeof performance &&
                performance.mark &&
                performance.measure &&
                (performance.mark(`ai-calculation-end-${e}`),
                performance.measure(
                    'ai-calculation',
                    `ai-calculation-start-${e}`,
                    `ai-calculation-end-${e}`
                )),
                this.recordAICalculationTime(t));
        }
        recordAICalculationTime(e) {
            (this.aiCalculationHistory.push(e),
                this.aiCalculationHistory.length > this.aiCalculationHistorySize &&
                    this.aiCalculationHistory.shift(),
                (this.performanceMetrics.aiCalculationTime = e),
                (this.performanceMetrics.averageAICalculationTime =
                    this.calculateAverageAICalculationTime()),
                (this.performanceMetrics.maxAICalculationTime = Math.max(
                    ...this.aiCalculationHistory
                )),
                e > this.aiCalculationTimeTarget &&
                    this.addPerformanceWarning(
                        `AI calculation time exceeded target: ${e.toFixed(2)}ms > ${this.aiCalculationTimeTarget}ms`
                    ));
        }
        calculateAverageAICalculationTime() {
            if (0 === this.aiCalculationHistory.length) return 0;
            return (
                this.aiCalculationHistory.reduce((e, t) => e + t, 0) /
                this.aiCalculationHistory.length
            );
        }
        startCollisionDetection() {
            ('undefined' != typeof performance &&
                performance.mark &&
                performance.mark('collision-detection-start'),
                (this.collisionDetectionStartTime =
                    'undefined' != typeof performance ? performance.now() : Date.now()));
        }
        endCollisionDetection() {
            const e =
                ('undefined' != typeof performance ? performance.now() : Date.now()) -
                this.collisionDetectionStartTime;
            ('undefined' != typeof performance &&
                performance.mark &&
                performance.measure &&
                (performance.mark('collision-detection-end'),
                performance.measure(
                    'collision-detection',
                    'collision-detection-start',
                    'collision-detection-end'
                )),
                this.recordCollisionDetectionTime(e));
        }
        recordCollisionDetectionTime(e) {
            (this.collisionDetectionHistory.push(e),
                this.collisionDetectionHistory.length > this.collisionDetectionHistorySize &&
                    this.collisionDetectionHistory.shift(),
                (this.performanceMetrics.collisionDetectionTime = e),
                (this.performanceMetrics.averageCollisionDetectionTime =
                    this.calculateAverageCollisionDetectionTime()),
                (this.performanceMetrics.maxCollisionDetectionTime = Math.max(
                    ...this.collisionDetectionHistory
                )),
                e > this.collisionDetectionTimeTarget &&
                    this.addPerformanceWarning(
                        `Collision detection time exceeded target: ${e.toFixed(2)}ms > ${this.collisionDetectionTimeTarget}ms`
                    ));
        }
        calculateAverageCollisionDetectionTime() {
            if (0 === this.collisionDetectionHistory.length) return 0;
            return (
                this.collisionDetectionHistory.reduce((e, t) => e + t, 0) /
                this.collisionDetectionHistory.length
            );
        }
        monitorMemoryUsage() {
            const e = 'undefined' != typeof performance ? performance.now() : Date.now();
            if (!(e - this.lastMemoryCheck < this.memoryCheckInterval))
                if (
                    ((this.lastMemoryCheck = e),
                    'undefined' != typeof performance && performance.memory)
                ) {
                    const e = performance.memory;
                    this.performanceMetrics.memoryUsage = {
                        usedJSHeapSize: e.usedJSHeapSize,
                        totalJSHeapSize: e.totalJSHeapSize,
                        jsHeapSizeLimit: e.jsHeapSizeLimit,
                        usedMB: Math.round(e.usedJSHeapSize / 1024 / 1024),
                        totalMB: Math.round(e.totalJSHeapSize / 1024 / 1024),
                    };
                    const t = (e.usedJSHeapSize / e.jsHeapSizeLimit) * 100;
                    t > 80 && this.addPerformanceWarning(`High memory usage: ${t.toFixed(1)}%`);
                } else
                    this.performanceMetrics.memoryUsage = {
                        usedMB: 'N/A',
                        totalMB: 'N/A',
                        message: 'Memory API not available',
                    };
        }
        addPerformanceWarning(e) {
            const t = { timestamp: new Date().toISOString(), warning: e };
            (this.performanceMetrics.performanceWarnings.push(t),
                this.performanceMetrics.performanceWarnings.length > 10 &&
                    this.performanceMetrics.performanceWarnings.shift(),
                S.debug(`Performance Warning: ${e}`));
        }
        getPerformanceMetrics() {
            return (
                (e = l({}, this.performanceMetrics)),
                (r = {
                    frameCount: this.frameCount,
                    lowFPSDuration: this.lowFPSDuration,
                    isPerformanceDegraded: this.isPerformanceDegradationDetected(),
                    consecutivePoorFrames: this.consecutivePoorFrames,
                    consecutiveGoodFrames: this.consecutiveGoodFrames,
                }),
                t(e, i(r))
            );
            var e, r;
        }
        setReportingEnabled(e) {
            this.reportingEnabled = e;
        }
        generatePerformanceReport() {
            if (!this.reportingEnabled) return;
            const e = 'undefined' != typeof performance ? performance.now() : Date.now();
            if (e - this.lastReport < this.reportingInterval) return;
            this.lastReport = e;
            const t = this.getPerformanceMetrics();
            (S.info('=== Performance Report ==='),
                S.info(
                    `Frame Rate: ${t.currentFPS.toFixed(1)} FPS (avg: ${t.averageFPS.toFixed(1)}, min: ${t.minFPS.toFixed(1)}, max: ${t.maxFPS.toFixed(1)})`
                ),
                S.info(
                    `AI Calculation: ${t.aiCalculationTime.toFixed(2)}ms (avg: ${t.averageAICalculationTime.toFixed(2)}ms, max: ${t.maxAICalculationTime.toFixed(2)}ms)`
                ),
                S.info(
                    `Collision Detection: ${t.collisionDetectionTime.toFixed(2)}ms (avg: ${t.averageCollisionDetectionTime.toFixed(2)}ms, max: ${t.maxCollisionDetectionTime.toFixed(2)}ms)`
                ),
                t.memoryUsage &&
                    'object' == typeof t.memoryUsage &&
                    S.info(`Memory Usage: ${t.memoryUsage.usedMB}MB / ${t.memoryUsage.totalMB}MB`),
                t.performanceWarnings.length > 0 &&
                    (S.info('Recent Warnings:'),
                    t.performanceWarnings.slice(-3).forEach((e) => {
                        S.info(`  - ${e.warning}`);
                    })),
                S.info('========================'));
        }
        update() {
            (this.endFrameMonitoring(),
                this.monitorMemoryUsage(),
                this.generatePerformanceReport(),
                this.startFrameMonitoring());
        }
        reset() {
            ((this.frameRateHistory = []),
                (this.aiCalculationHistory = []),
                (this.collisionDetectionHistory = []),
                (this.frameCount = 0),
                (this.lowFPSStartTime = null),
                (this.lowFPSDuration = 0),
                (this.performanceMetrics.performanceWarnings = []),
                (this.lastFrameTime =
                    'undefined' != typeof performance ? performance.now() : Date.now()),
                (this.lastMemoryCheck = 0),
                (this.lastReport = 0));
        }
        getPerformanceSummary() {
            const e = this.getPerformanceMetrics();
            return {
                fps: Math.round(e.currentFPS),
                avgFPS: Math.round(e.averageFPS),
                aiTime: e.aiCalculationTime.toFixed(1),
                collisionTime: e.collisionDetectionTime.toFixed(1),
                memoryMB: e.memoryUsage && e.memoryUsage.usedMB ? e.memoryUsage.usedMB : 'N/A',
                warnings: e.performanceWarnings.length,
                degraded: e.isPerformanceDegraded,
            };
        }
    },
};
const b = (null == P.exports ? {} : P.exports).default || P.exports,
    M = Object.freeze(
        Object.defineProperty({ __proto__: null, default: b }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var x = { exports: {} };
const { logger: w } = n || c,
    { ParticlePool: C } = y || g,
    { Particle: E } = m || p,
    { PerformanceMonitor: T } = b || M;
x.exports = {
    ParticleSystem: class {
        constructor(e, t = {}) {
            var i, r, a;
            try {
                if (!e) throw new Error('Scene is required for ParticleSystem initialization');
                ((this.scene = e),
                    (this.settings = {
                        maxParticles: t.maxParticles || 200,
                        enabled: !1 !== t.enabled,
                        quality: t.quality || 'medium',
                        effects: {
                            trailSparks: !1 !== (null == (i = t.effects) ? void 0 : i.trailSparks),
                            explosions: !1 !== (null == (r = t.effects) ? void 0 : r.explosions),
                            collections: !1 !== (null == (a = t.effects) ? void 0 : a.collections),
                        },
                        adaptiveQuality: !1 !== t.adaptiveQuality,
                    }),
                    (this.errorCount = 0),
                    (this.errorHistory = []),
                    (this.autoUpdateEnabled = !0),
                    (this.shaderUpdatesEnabled = !0));
                try {
                    this.particlePool = new C(this.settings.maxParticles);
                } catch (s) {
                    throw (
                        w.error('ParticleSystem: Failed to initialize particle pool:', s),
                        new Error('Failed to initialize particle pool: ' + s.message)
                    );
                }
                ((this.particleGeometry = null),
                    (this.particleMaterial = null),
                    (this.particlePoints = null));
                try {
                    ((this.performanceMonitor = new T()),
                        (this.performanceMonitor.frameRateThreshold = 50));
                } catch (o) {
                    (w.warn('ParticleSystem: Failed to initialize performance monitor:', o),
                        (this.performanceMonitor = null),
                        (this.settings.adaptiveQuality = !1));
                }
                ((this.adaptiveQualityEnabled = !(
                    !this.settings.adaptiveQuality || !this.performanceMonitor
                )),
                    (this.originalQuality = this.settings.quality),
                    (this.originalMaxParticles = this.settings.maxParticles),
                    (this.qualityConfigs = {
                        high: {
                            maxParticles: 200,
                            trailSparkMultiplier: 2.5,
                            explosionParticles: 30,
                            collectionParticles: 20,
                        },
                        medium: {
                            maxParticles: 150,
                            trailSparkMultiplier: 1.5,
                            explosionParticles: 25,
                            collectionParticles: 15,
                        },
                        low: {
                            maxParticles: 100,
                            trailSparkMultiplier: 1,
                            explosionParticles: 20,
                            collectionParticles: 10,
                        },
                    }),
                    (this.degradationLevel = 0),
                    (this.lastDegradationCheck = Date.now()),
                    (this.degradationCheckInterval = 1e3),
                    (this.performanceRecoveryTime = 5e3),
                    (this.lastGoodPerformanceTime = Date.now()));
                try {
                    this.initializeRendering();
                } catch (l) {
                    throw (
                        w.error('ParticleSystem: Failed to initialize rendering:', l),
                        (this.settings.enabled = !1),
                        new Error('Failed to initialize particle rendering: ' + l.message)
                    );
                }
                ((this.lastUpdateTime = Date.now()),
                    (this.frameCount = 0),
                    (this.isPaused = !1),
                    (this.gameOverHandled = !1),
                    (this.lastFrameCount = -1),
                    (this.pauseStartTime = 0),
                    (this.culledParticleCount = 0),
                    (this.performanceMetrics = {}),
                    (this.memoryMetrics = {}),
                    (this.lastMemoryCheck = Date.now()),
                    (this.memoryCheckInterval = 5e3),
                    w.info('ParticleSystem: Initialized successfully'));
            } catch (n) {
                throw (
                    w.error('ParticleSystem: Critical initialization error:', n),
                    (this.settings = { enabled: !1 }),
                    (this.errorCount = 1),
                    this.recordError('initialization', n),
                    n
                );
            }
        }
        initializeRendering() {
            try {
                this.particleGeometry = new THREE.BufferGeometry();
                const a = new Float32Array(3 * this.settings.maxParticles),
                    s = new Float32Array(3 * this.settings.maxParticles),
                    o = new Float32Array(this.settings.maxParticles),
                    l = new Float32Array(this.settings.maxParticles);
                try {
                    (this.particleGeometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(a, 3)
                    ),
                        this.particleGeometry.setAttribute(
                            'color',
                            new THREE.BufferAttribute(s, 3)
                        ),
                        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(o, 1)),
                        this.particleGeometry.setAttribute(
                            'alpha',
                            new THREE.BufferAttribute(l, 1)
                        ));
                } catch (e) {
                    throw (
                        w.error('ParticleSystem: Failed to set buffer attributes:', e),
                        new Error('Failed to create buffer attributes: ' + e.message)
                    );
                }
                let n;
                try {
                    n = this.createParticleTexture();
                } catch (t) {
                    (w.warn(
                        'ParticleSystem: Failed to create particle texture, using fallback:',
                        t
                    ),
                        (n = { needsUpdate: !0 }));
                }
                try {
                    this.particleMaterial = new THREE.ShaderMaterial({
                        uniforms: { pointTexture: { value: n }, time: { value: 0 } },
                        vertexShader:
                            '\n                        attribute float size;\n                        attribute float alpha;\n                        uniform float time;\n                        varying float vAlpha;\n                        varying vec3 vColor;\n                        varying vec2 vUv;\n\n                        void main() {\n                            vAlpha = alpha;\n                            vColor = color;\n                            vUv = uv;\n                            \n                            // Transform position to view space\n                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n                            \n                            // Calculate point size with distance attenuation\n                            float distance = length(mvPosition.xyz);\n                            gl_PointSize = size * (300.0 / distance);\n                            \n                            // Ensure minimum and maximum point sizes\n                            gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);\n                            \n                            gl_Position = projectionMatrix * mvPosition;\n                        }\n                    ',
                        fragmentShader:
                            '\n                        uniform sampler2D pointTexture;\n                        uniform float time;\n                        varying float vAlpha;\n                        varying vec3 vColor;\n\n                        void main() {\n                            // Sample the particle texture\n                            vec4 textureColor = texture2D(pointTexture, gl_PointCoord);\n                            \n                            // Calculate distance from center for circular particles\n                            vec2 center = gl_PointCoord - vec2(0.5);\n                            float dist = length(center);\n                            \n                            // Create smooth circular falloff\n                            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);\n                            alpha *= textureColor.a * vAlpha;\n                            \n                            // Apply color with proper alpha blending\n                            gl_FragColor = vec4(vColor * alpha, alpha);\n                            \n                            // Discard fully transparent pixels for better performance\n                            if (gl_FragColor.a < 0.01) discard;\n                        }\n                    ',
                        blending: THREE.AdditiveBlending,
                        depthTest: !0,
                        depthWrite: !1,
                        transparent: !0,
                        vertexColors: !0,
                        side: THREE.DoubleSide,
                    });
                } catch (i) {
                    throw (
                        w.error('ParticleSystem: Failed to create shader material:', i),
                        new Error('Failed to create particle material: ' + i.message)
                    );
                }
                try {
                    ((this.particlePoints = new THREE.Points(
                        this.particleGeometry,
                        this.particleMaterial
                    )),
                        (this.particlePoints.renderOrder = 100),
                        (this.particlePoints.frustumCulled = !0),
                        this.scene.add(this.particlePoints));
                } catch (r) {
                    throw (
                        w.error('ParticleSystem: Failed to create Points object:', r),
                        new Error('Failed to create particle points: ' + r.message)
                    );
                }
                w.info('ParticleSystem: Rendering initialized successfully');
            } catch (a) {
                throw (
                    w.error('ParticleSystem: Failed to initialize rendering:', a),
                    this.cleanupRenderingResources(),
                    a
                );
            }
        }
        createParticleTexture() {
            try {
                const t = document.createElement('canvas');
                let i;
                ((t.width = 128), (t.height = 128));
                try {
                    i = t.getContext('2d');
                } catch (e) {
                    return (
                        w.warn('Canvas context not available, using fallback texture'),
                        { needsUpdate: !0 }
                    );
                }
                if (!i) return { needsUpdate: !0 };
                const r = 64,
                    a = 64,
                    s = 64,
                    o = i.createRadialGradient(r, a, 0, r, a, s);
                (o.addColorStop(0, 'rgba(255,255,255,1.0)'),
                    o.addColorStop(0.1, 'rgba(255,255,255,0.9)'),
                    o.addColorStop(0.3, 'rgba(255,255,255,0.7)'),
                    o.addColorStop(0.5, 'rgba(255,255,255,0.4)'),
                    o.addColorStop(0.7, 'rgba(255,255,255,0.2)'),
                    o.addColorStop(0.9, 'rgba(255,255,255,0.05)'),
                    o.addColorStop(1, 'rgba(255,255,255,0)'),
                    i.clearRect(0, 0, 128, 128),
                    (i.fillStyle = o),
                    i.fillRect(0, 0, 128, 128));
                const l = new THREE.Texture(t);
                return (
                    (l.needsUpdate = !0),
                    (l.wrapS = THREE.ClampToEdgeWrapping),
                    (l.wrapT = THREE.ClampToEdgeWrapping),
                    (l.minFilter = THREE.LinearFilter),
                    (l.magFilter = THREE.LinearFilter),
                    (l.format = THREE.RGBAFormat),
                    (l.generateMipmaps = !1),
                    l
                );
            } catch (t) {
                return (
                    w.warn('Failed to create particle texture, using fallback:', t),
                    { needsUpdate: !0 }
                );
            }
        }
        acquireParticle() {
            return this.particlePool.acquire();
        }
        releaseParticle(e) {
            this.particlePool.release(e);
        }
        update(e, t) {
            try {
                if (!this.settings.enabled) return;
                if (!this.validateUpdateParameters(e, t)) return;
                if (t.isPaused) return void (this.isPaused || this.handlePause());
                (this.isPaused && this.handleResume(),
                    0 === t.frameCount && this.lastFrameCount > 0 && this.handleGameRestart(),
                    (this.lastFrameCount = t.frameCount),
                    t.gameOver && !this.gameOverHandled
                        ? this.handleGameOver()
                        : t.gameOver || (this.gameOverHandled = !1),
                    this.frameCount++);
                const n = Date.now();
                try {
                    this.performanceMonitor.update();
                } catch (i) {
                    (w.warn('ParticleSystem: Performance monitoring error:', i),
                        this.handlePerformanceMonitoringError(i));
                }
                if (this.adaptiveQualityEnabled)
                    try {
                        this.checkPerformanceDegradation(n);
                    } catch (r) {
                        (w.warn('ParticleSystem: Performance degradation check error:', r),
                            this.handlePerformanceDegradationError(r));
                    }
                try {
                    this.particlePool.updateParticles(e);
                } catch (a) {
                    (w.warn('ParticleSystem: Particle pool update error:', a),
                        this.handleParticlePoolError(a));
                }
                try {
                    this.updateRenderingBuffers();
                } catch (s) {
                    (w.warn('ParticleSystem: Rendering buffer update error:', s),
                        this.handleRenderingError(s));
                }
                try {
                    this.particleMaterial &&
                        this.particleMaterial.uniforms &&
                        (this.particleMaterial.uniforms.time.value = 0.001 * n);
                } catch (o) {
                    (w.warn('ParticleSystem: Shader uniform update error:', o),
                        this.handleShaderError(o));
                }
                if (n - this.lastMemoryCheck >= this.memoryCheckInterval)
                    try {
                        (this.monitorMemoryUsage(), (this.lastMemoryCheck = n));
                    } catch (l) {
                        w.warn('ParticleSystem: Memory monitoring error:', l);
                    }
                this.lastUpdateTime = n;
            } catch (n) {
                (w.error('ParticleSystem: Critical update error:', n),
                    this.handleCriticalError(n, 'update'));
            }
        }
        updateRenderingBuffers() {
            try {
                if (!this.particleGeometry || !this.particleGeometry.attributes)
                    return void w.warn('ParticleSystem: Geometry not available for buffer update');
                const e = this.particleGeometry.attributes.position.array,
                    t = this.particleGeometry.attributes.color.array,
                    i = this.particleGeometry.attributes.size.array,
                    r = this.particleGeometry.attributes.alpha.array;
                if (!(e && t && i && r))
                    return void w.warn('ParticleSystem: Buffer arrays not available');
                this.batchUpdateBuffers(e, t, i, r);
            } catch (e) {
                throw (w.error('ParticleSystem: Critical error in updateRenderingBuffers:', e), e);
            }
        }
        batchUpdateBuffers(e, t, i, r) {
            try {
                let o;
                (e.fill(0), t.fill(0), i.fill(0), r.fill(0));
                try {
                    o = this.particlePool.getActiveParticles();
                } catch (a) {
                    return void w.warn('ParticleSystem: Failed to get active particles:', a);
                }
                const l = o.filter((e) => e && e.active && !e.culled);
                let n = 0;
                for (let a = 0; a < l.length && n < this.settings.maxParticles; a++) {
                    const o = l[a];
                    if (o && o.position && o.color)
                        try {
                            const a = 3 * n;
                            if (
                                ('number' != typeof o.position.x ||
                                    isNaN(o.position.x) ||
                                    ((e[a] = o.position.x),
                                    (e[a + 1] = o.position.y),
                                    (e[a + 2] = o.position.z)),
                                'number' != typeof o.color.r ||
                                    isNaN(o.color.r) ||
                                    ((t[a] = o.color.r),
                                    (t[a + 1] = o.color.g),
                                    (t[a + 2] = o.color.b)),
                                'number' != typeof o.size || isNaN(o.size) || (i[n] = o.size),
                                o.getAlpha && 'function' == typeof o.getAlpha)
                            ) {
                                const e = o.getAlpha();
                                'number' != typeof e || isNaN(e) || (r[n] = e);
                            }
                            n++;
                        } catch (s) {
                            w.warn(`ParticleSystem: Error processing particle ${a}:`, s);
                            continue;
                        }
                }
                (this.batchMarkAttributesForUpdate(n),
                    this.updatePerformanceMetrics(o.length, l.length, n));
            } catch (o) {
                throw (w.error('ParticleSystem: Critical error in batchUpdateBuffers:', o), o);
            }
        }
        batchMarkAttributesForUpdate(e) {
            try {
                const t = this.particleGeometry.attributes;
                ((t.position.needsUpdate = !0),
                    (t.color.needsUpdate = !0),
                    (t.size.needsUpdate = !0),
                    (t.alpha.needsUpdate = !0),
                    this.particleGeometry.setDrawRange(0, e));
            } catch (t) {
                throw (w.warn('ParticleSystem: Failed to mark attributes for update:', t), t);
            }
        }
        updatePerformanceMetrics(e, t, i) {
            (this.performanceMetrics || (this.performanceMetrics = {}),
                (this.performanceMetrics.totalParticles = e),
                (this.performanceMetrics.visibleParticles = t),
                (this.performanceMetrics.renderedParticles = i),
                (this.performanceMetrics.culledParticles = e - t),
                (this.performanceMetrics.cullRatio =
                    e > 0 ? this.performanceMetrics.culledParticles / e : 0),
                (this.performanceMetrics.lastUpdateTime = Date.now()));
        }
        emitTrailSparks(e, t, i, r = 1) {
            try {
                if (!this.settings.enabled || !this.settings.effects.trailSparks) return;
                if (!this.validateEmissionParameters(e, t, i)) return;
                const r = Math.sqrt(t.x * t.x + t.z * t.z);
                if (r < 0.01) return;
                const s = 0.8 * Math.max(0.1, Math.min(3, r / 0.1)),
                    o = this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium;
                let l = Math.floor(s * o.trailSparkMultiplier);
                l = Math.max(1, Math.min(4, l));
                for (let n = 0; n < l; n++)
                    try {
                        const a = this.acquireParticle();
                        if (!a) break;
                        ((a.type = 'trail'), (a.active = !0), (a.age = 0));
                        const s = 0.3;
                        a.position.set(
                            e.x - t.x * s + 0.15 * (Math.random() - 0.5),
                            e.y + 0.08 * Math.random(),
                            e.z - t.z * s + 0.15 * (Math.random() - 0.5)
                        );
                        const o = Math.max(0.3, 0.5 * r);
                        (a.velocity.set(
                            0.4 * (Math.random() - 0.5) - t.x * o,
                            0.25 * Math.random() + 0.05,
                            0.4 * (Math.random() - 0.5) - t.z * o
                        ),
                            a.acceleration.set(0, -0.15, 0),
                            a.color.setHex(i),
                            (a.size = 0.04 + 0.02 * Math.random()),
                            (a.originalSize = a.size),
                            (a.lifetime = 0.5 + 0.5 * Math.random()));
                    } catch (a) {
                        w.warn('ParticleSystem: Error creating trail spark particle:', a);
                        continue;
                    }
            } catch (s) {
                (w.error('ParticleSystem: Critical error in emitTrailSparks:', s),
                    this.handleCriticalError(s, 'emitTrailSparks'));
            }
        }
        createExplosion(e, t = 1) {
            try {
                if (!this.settings.enabled || !this.settings.effects.explosions) return;
                if (!this.validateExplosionParameters(e, t)) return;
                const r = this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium,
                    a = Math.floor(r.explosionParticles * t);
                for (let t = 0; t < a; t++)
                    try {
                        const t = this.acquireParticle();
                        if (!t) break;
                        ((t.type = 'explosion'),
                            t.position.set(
                                e.x + 0.1 * (Math.random() - 0.5),
                                e.y + 0.1 * Math.random(),
                                e.z + 0.1 * (Math.random() - 0.5)
                            ));
                        const i = Math.random() * Math.PI * 2,
                            r = (Math.random() - 0.5) * Math.PI * 0.5,
                            a = 2 + 2 * Math.random();
                        (t.velocity.set(
                            Math.cos(i) * Math.cos(r) * a,
                            Math.sin(r) * a * 0.5,
                            Math.sin(i) * Math.cos(r) * a
                        ),
                            t.acceleration.set(0, -0.5, 0));
                        const s = Math.random();
                        (s < 0.4
                            ? t.color.setHex(16729344)
                            : s < 0.7
                              ? t.color.setHex(16737792)
                              : t.color.setHex(16746496),
                            (t.size = 0.1 + 0.1 * Math.random()),
                            (t.originalSize = t.size),
                            (t.lifetime = 1.5 + 0.5 * Math.random()));
                    } catch (i) {
                        w.warn('ParticleSystem: Error creating explosion particle:', i);
                        continue;
                    }
            } catch (r) {
                (w.error('ParticleSystem: Critical error in createExplosion:', r),
                    this.handleCriticalError(r, 'createExplosion'));
            }
        }
        createCollectionEffect(e, t) {
            try {
                if (!this.settings.enabled || !this.settings.effects.collections) return;
                if (!this.validateCollectionParameters(e, t)) return;
                const r = (this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium)
                    .collectionParticles;
                let a;
                switch (t) {
                    case 'SPEED_BOOST':
                        a = 26367;
                        break;
                    case 'SHIELD':
                        a = 16766720;
                        break;
                    case 'TRAIL_ERASER':
                        a = 10040012;
                        break;
                    case 'GHOST_MODE':
                        a = 16777215;
                        break;
                    default:
                        a = 65535;
                }
                for (let t = 0; t < r; t++)
                    try {
                        const t = this.acquireParticle();
                        if (!t) break;
                        ((t.type = 'collection'),
                            t.position.set(
                                e.x + 0.2 * (Math.random() - 0.5),
                                e.y,
                                e.z + 0.2 * (Math.random() - 0.5)
                            ));
                        const i = Math.random() * Math.PI * 2,
                            r = 0.7,
                            s = 1 + 1.5 * Math.random();
                        (t.velocity.set(
                            Math.cos(i) * s * (1 - r),
                            s * r + 0.5 * Math.random(),
                            Math.sin(i) * s * (1 - r)
                        ),
                            t.acceleration.set(0, -0.3, 0),
                            t.color.setHex(a),
                            (t.size = 0.05 + 0.05 * Math.random()),
                            (t.originalSize = t.size),
                            (t.lifetime = 1));
                    } catch (i) {
                        w.warn('ParticleSystem: Error creating collection particle:', i);
                        continue;
                    }
            } catch (r) {
                (w.error('ParticleSystem: Critical error in createCollectionEffect:', r),
                    this.handleCriticalError(r, 'createCollectionEffect'));
            }
        }
        checkPerformanceDegradation(e) {
            if (e - this.lastDegradationCheck < this.degradationCheckInterval) return;
            this.lastDegradationCheck = e;
            const t = this.performanceMonitor.getPerformanceMetrics();
            t.averageFPS < this.performanceMonitor.frameRateThreshold
                ? (this.applyPerformanceDegradation(), (this.lastGoodPerformanceTime = e))
                : t.averageFPS >= 0.9 * this.performanceMonitor.frameRateTarget
                  ? e - this.lastGoodPerformanceTime >= this.performanceRecoveryTime &&
                    this.attemptPerformanceRecovery()
                  : (this.lastGoodPerformanceTime = e);
        }
        applyPerformanceDegradation() {
            if (!(this.degradationLevel >= 3))
                switch (
                    (this.degradationLevel++,
                    w.warn(
                        `ParticleSystem: Applying performance degradation level ${this.degradationLevel}`
                    ),
                    this.degradationLevel)
                ) {
                    case 1:
                        this.reduceParticleDensity(0.75);
                        break;
                    case 2:
                        ((this.settings.effects.trailSparks = !1),
                            this.setQualityLevel('low'),
                            w.info('ParticleSystem: Disabled trail sparks for performance'));
                        break;
                    case 3:
                        ((this.qualityConfigs.low.explosionParticles = 10),
                            (this.qualityConfigs.low.collectionParticles = 5),
                            w.info('ParticleSystem: Reduced explosion and collection particles'));
                }
        }
        reduceParticleDensity(e) {
            const t = Math.floor(this.originalMaxParticles * e);
            ((this.settings.maxParticles = Math.max(25, t)),
                this.particlePool && (this.particlePool.maxParticles = this.settings.maxParticles),
                Object.keys(this.qualityConfigs).forEach((t) => {
                    this.qualityConfigs[t].maxParticles = Math.floor(
                        this.qualityConfigs[t].maxParticles * e
                    );
                }),
                w.info(
                    `ParticleSystem: Reduced particle density to ${this.settings.maxParticles} particles`
                ));
        }
        attemptPerformanceRecovery() {
            if (0 !== this.degradationLevel) {
                switch (
                    (w.info(
                        `ParticleSystem: Attempting performance recovery from level ${this.degradationLevel}`
                    ),
                    this.degradationLevel)
                ) {
                    case 3:
                        ((this.qualityConfigs.low.explosionParticles = 20),
                            (this.qualityConfigs.low.collectionParticles = 10));
                        break;
                    case 2:
                        ((this.settings.effects.trailSparks = !0),
                            this.setQualityLevel(this.originalQuality));
                        break;
                    case 1:
                        this.restoreOriginalSettings();
                }
                (this.degradationLevel--, (this.lastGoodPerformanceTime = Date.now()));
            }
        }
        restoreOriginalSettings() {
            ((this.settings.maxParticles = this.originalMaxParticles),
                (this.settings.quality = this.originalQuality),
                (this.settings.effects.trailSparks = !0),
                (this.settings.effects.explosions = !0),
                (this.settings.effects.collections = !0),
                (this.qualityConfigs = {
                    high: {
                        maxParticles: 200,
                        trailSparkMultiplier: 2.5,
                        explosionParticles: 30,
                        collectionParticles: 20,
                    },
                    medium: {
                        maxParticles: 150,
                        trailSparkMultiplier: 1.5,
                        explosionParticles: 25,
                        collectionParticles: 15,
                    },
                    low: {
                        maxParticles: 100,
                        trailSparkMultiplier: 1,
                        explosionParticles: 20,
                        collectionParticles: 10,
                    },
                }),
                w.info('ParticleSystem: Restored original settings'));
        }
        setQualityLevel(e) {
            if (['low', 'medium', 'high'].includes(e)) {
                this.settings.quality = e;
                const t = this.qualityConfigs[e];
                t && 0 === this.degradationLevel && (this.settings.maxParticles = t.maxParticles);
            }
        }
        setAdaptiveQuality(e) {
            ((this.adaptiveQualityEnabled = e),
                e || (this.restoreOriginalSettings(), (this.degradationLevel = 0)));
        }
        getActiveParticleCount() {
            return this.particlePool.getActiveCount();
        }
        getPerformanceMetrics() {
            return this.performanceMonitor.getPerformanceMetrics();
        }
        getPerformanceStatus() {
            const e = this.performanceMonitor.getPerformanceMetrics();
            return {
                currentFPS: Math.round(e.currentFPS),
                averageFPS: Math.round(e.averageFPS),
                degradationLevel: this.degradationLevel,
                adaptiveQualityEnabled: this.adaptiveQualityEnabled,
                currentQuality: this.settings.quality,
                originalQuality: this.originalQuality,
                activeParticles: this.getActiveParticleCount(),
                maxParticles: this.settings.maxParticles,
                originalMaxParticles: this.originalMaxParticles,
                effectsEnabled: l({}, this.settings.effects),
                performanceWarnings: e.performanceWarnings.length,
            };
        }
        handlePause() {
            ((this.isPaused = !0),
                (this.pauseStartTime = Date.now()),
                (this.wasTrailSparksEnabled = this.settings.effects.trailSparks),
                (this.settings.effects.trailSparks = !1),
                w.info('ParticleSystem: Paused - stopped new particle emission'));
        }
        handleResume() {
            ((this.isPaused = !1),
                void 0 !== this.wasTrailSparksEnabled &&
                    ((this.settings.effects.trailSparks = this.wasTrailSparksEnabled),
                    (this.wasTrailSparksEnabled = void 0)),
                (this.lastUpdateTime = Date.now()),
                w.info('ParticleSystem: Resumed - restored particle emission'));
        }
        handleGameRestart() {
            (this.particlePool.releaseAll(),
                this.performanceMonitor.reset(),
                (this.degradationLevel = 0),
                (this.lastGoodPerformanceTime = Date.now()),
                (this.lastDegradationCheck = Date.now()),
                this.restoreOriginalSettings(),
                (this.frameCount = 0),
                (this.lastUpdateTime = Date.now()),
                (this.gameOverHandled = !1),
                (this.isPaused = !1),
                w.info('ParticleSystem: Game restarted - cleared all particles and reset state'));
        }
        handleGameOver() {
            ((this.gameOverHandled = !0),
                (this.wasTrailSparksEnabledGameOver = this.settings.effects.trailSparks),
                (this.settings.effects.trailSparks = !1),
                w.info(
                    'ParticleSystem: Game over - stopped new trail spark emission, allowing existing particles to fade'
                ));
        }
        pause() {
            w.info(
                'ParticleSystem: External pause called - will pause on next update with gameState.isPaused = true'
            );
        }
        resume() {
            w.info(
                'ParticleSystem: External resume called - will resume on next update with gameState.isPaused = false'
            );
        }
        reset() {
            (this.particlePool.releaseAll(),
                this.performanceMonitor.reset(),
                (this.degradationLevel = 0),
                (this.lastGoodPerformanceTime = Date.now()),
                (this.lastDegradationCheck = Date.now()),
                this.restoreOriginalSettings(),
                (this.frameCount = 0),
                (this.lastUpdateTime = Date.now()),
                (this.lastFrameCount = -1),
                (this.isPaused = !1),
                (this.gameOverHandled = !1),
                (this.pauseStartTime = 0),
                (this.wasTrailSparksEnabled = void 0),
                (this.wasTrailSparksEnabledGameOver = void 0),
                w.info(
                    'ParticleSystem: Reset complete - all particles cleared and state restored'
                ));
        }
        setEnabled(e) {
            ((this.settings.enabled = e), e || this.reset());
        }
        setEffectEnabled(e, t) {
            this.settings.effects.hasOwnProperty(e) && (this.settings.effects[e] = t);
        }
        getSettings() {
            return l({}, this.settings);
        }
        onContextRestore() {
            try {
                (this.particleMaterial &&
                    this.particleMaterial.uniforms.pointTexture &&
                    (this.particleMaterial.uniforms.pointTexture.value =
                        this.createParticleTexture()),
                    this.particleGeometry &&
                        Object.values(this.particleGeometry.attributes).forEach((e) => {
                            e.needsUpdate = !0;
                        }),
                    this.particleMaterial && (this.particleMaterial.needsUpdate = !0),
                    w.info('ParticleSystem: WebGL context restored successfully'));
            } catch (e) {
                w.error('ParticleSystem: Failed to restore WebGL context:', e);
            }
        }
        getRenderingStats() {
            const e = this.getMemoryUsage(),
                t = this.performanceMetrics || {};
            return {
                activeParticles: this.getActiveParticleCount(),
                maxParticles: this.settings.maxParticles,
                geometryVertices: this.particleGeometry
                    ? this.particleGeometry.attributes.position.count
                    : 0,
                drawCalls: this.particlePoints && this.particlePoints.visible ? 1 : 0,
                memoryUsage: e,
                performance: {
                    totalParticles: t.totalParticles || 0,
                    visibleParticles: t.visibleParticles || 0,
                    renderedParticles: t.renderedParticles || 0,
                    culledParticles: t.culledParticles || 0,
                    cullRatio: t.cullRatio || 0,
                    lodDistribution: this.getLODDistribution(),
                },
            };
        }
        getMemoryUsage() {
            const e = {
                bufferArrays: { positions: 0, colors: 0, sizes: 0, alphas: 0, total: 0 },
                particlePool: {
                    totalParticles: 0,
                    activeParticles: 0,
                    inactiveParticles: 0,
                    estimatedSize: 0,
                },
                textures: { particleTexture: 0 },
                total: 0,
            };
            try {
                if (this.particleGeometry && this.particleGeometry.attributes) {
                    const t = this.particleGeometry.attributes;
                    ((e.bufferArrays.positions = t.position ? t.position.array.byteLength : 0),
                        (e.bufferArrays.colors = t.color ? t.color.array.byteLength : 0),
                        (e.bufferArrays.sizes = t.size ? t.size.array.byteLength : 0),
                        (e.bufferArrays.alphas = t.alpha ? t.alpha.array.byteLength : 0),
                        (e.bufferArrays.total =
                            e.bufferArrays.positions +
                            e.bufferArrays.colors +
                            e.bufferArrays.sizes +
                            e.bufferArrays.alphas));
                }
                if (this.particlePool) {
                    const t = this.particlePool.getStats();
                    ((e.particlePool.totalParticles = t.totalParticles),
                        (e.particlePool.activeParticles = t.activeCount),
                        (e.particlePool.inactiveParticles = t.availableCount),
                        (e.particlePool.estimatedSize = 200 * t.totalParticles));
                }
                (this.particleMaterial &&
                    this.particleMaterial.uniforms.pointTexture &&
                    (e.textures.particleTexture = 65536),
                    (e.total =
                        e.bufferArrays.total +
                        e.particlePool.estimatedSize +
                        e.textures.particleTexture));
            } catch (t) {
                w.warn('ParticleSystem: Error calculating memory usage:', t);
            }
            return e;
        }
        getLODDistribution() {
            const e = { high: 0, medium: 0, low: 0, culled: 0 };
            try {
                if (this.particlePool) {
                    const t = this.particlePool.getActiveParticles();
                    for (const i of t) i.lodLevel && (e[i.lodLevel] = (e[i.lodLevel] || 0) + 1);
                }
            } catch (t) {
                w.warn('ParticleSystem: Error calculating LOD distribution:', t);
            }
            return e;
        }
        performMemoryCleanup(e = !1) {
            try {
                (w.info('ParticleSystem: Performing memory cleanup...'),
                    e && this.particlePool && this.particlePool.releaseAll(),
                    this.cleanupBufferArrays(),
                    this.cleanupTextureResources(),
                    e && 'undefined' != typeof window && window.gc && window.gc(),
                    w.info('ParticleSystem: Memory cleanup completed'));
            } catch (t) {
                w.error('ParticleSystem: Error during memory cleanup:', t);
            }
        }
        cleanupBufferArrays() {
            try {
                if (!this.particleGeometry || !this.particleGeometry.attributes) return;
                const e = this.settings.maxParticles,
                    t = this.particleGeometry.attributes,
                    i = t.position ? t.position.count : 0;
                if (i > 1.5 * e) {
                    w.info('ParticleSystem: Resizing oversized buffer arrays');
                    const t = new Float32Array(3 * e),
                        i = new Float32Array(3 * e),
                        r = new Float32Array(e),
                        a = new Float32Array(e);
                    (this.particleGeometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(t, 3)
                    ),
                        this.particleGeometry.setAttribute(
                            'color',
                            new THREE.BufferAttribute(i, 3)
                        ),
                        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(r, 1)),
                        this.particleGeometry.setAttribute(
                            'alpha',
                            new THREE.BufferAttribute(a, 1)
                        ));
                }
            } catch (e) {
                w.warn('ParticleSystem: Error cleaning up buffer arrays:', e);
            }
        }
        cleanupTextureResources() {
            try {
                if (this.particleMaterial && this.particleMaterial.uniforms.pointTexture) {
                    const e = this.particleMaterial.uniforms.pointTexture.value;
                    (e && e.image) ||
                        (w.info('ParticleSystem: Recreating corrupted particle texture'),
                        (this.particleMaterial.uniforms.pointTexture.value =
                            this.createParticleTexture()));
                }
            } catch (e) {
                w.warn('ParticleSystem: Error cleaning up texture resources:', e);
            }
        }
        monitorMemoryUsage() {
            try {
                const e = this.getMemoryUsage().total / 1048576,
                    t = 50;
                (e > 100
                    ? (w.warn(`ParticleSystem: Critical memory usage: ${e.toFixed(2)}MB`),
                      this.performMemoryCleanup(!0),
                      this.applyEmergencyMemoryReduction())
                    : e > t &&
                      (w.warn(`ParticleSystem: High memory usage: ${e.toFixed(2)}MB`),
                      this.performMemoryCleanup(!1)),
                    this.memoryMetrics || (this.memoryMetrics = {}),
                    (this.memoryMetrics.currentUsageMB = e),
                    (this.memoryMetrics.lastCheckTime = Date.now()),
                    (this.memoryMetrics.cleanupCount = this.memoryMetrics.cleanupCount || 0));
            } catch (e) {
                w.warn('ParticleSystem: Error monitoring memory usage:', e);
            }
        }
        applyEmergencyMemoryReduction() {
            w.info('ParticleSystem: Applying emergency memory reduction');
            try {
                const e = Math.max(25, Math.floor(0.1 * this.originalMaxParticles));
                ((this.settings.maxParticles = e),
                    this.particlePool &&
                        ((this.particlePool.maxParticles = e), this.particlePool.releaseAll()),
                    (this.settings.effects.trailSparks = !1),
                    (this.settings.effects.collections = !1),
                    this.setQualityLevel('low'),
                    this.cleanupBufferArrays(),
                    w.info(
                        `ParticleSystem: Emergency memory reduction applied - max particles: ${e}`
                    ));
            } catch (e) {
                w.error('ParticleSystem: Error applying emergency memory reduction:', e);
            }
        }
        optimizeRendering(e) {
            e &&
                this.particlePoints &&
                ((this.particlePoints.frustumCulled = !0),
                this.particleGeometry.boundingSphere &&
                    (this.particleGeometry.boundingSphere.radius = Math.max(
                        10,
                        0.1 * this.getActiveParticleCount()
                    )),
                this.cullOffScreenParticles(e),
                this.applyLevelOfDetail(e));
        }
        cullOffScreenParticles(e) {
            if (e && this.particlePool)
                try {
                    const t = new THREE.Frustum(),
                        i = new THREE.Matrix4().multiplyMatrices(
                            e.projectionMatrix,
                            e.matrixWorldInverse
                        );
                    t.setFromProjectionMatrix(i);
                    const r = this.particlePool.getActiveParticles();
                    for (const e of r) {
                        if (!e.active || !e.position) continue;
                        const i = new THREE.Sphere(e.position, e.size || 0.1);
                        t.intersectsSphere(i) ? (e.culled = !1) : (e.culled = !0);
                    }
                    this.culledParticleCount = r.filter((e) => e.culled).length;
                } catch (t) {
                    w.warn('ParticleSystem: Error during particle culling:', t);
                }
        }
        applyLevelOfDetail(e) {
            if (e && this.particlePool)
                try {
                    const t = e.position,
                        i = this.particlePool.getActiveParticles(),
                        r = { high: 15, medium: 30, low: 50 };
                    for (const e of i) {
                        if (!e.active || !e.position) continue;
                        const i = t.distanceTo(e.position);
                        i > r.low
                            ? ((e.culled = !0), (e.lodLevel = 'culled'))
                            : i > r.medium
                              ? ((e.culled = !1),
                                (e.lodLevel = 'low'),
                                (e.size = Math.max(0.02, 0.5 * (e.originalSize || e.size))))
                              : i > r.high
                                ? ((e.culled = !1),
                                  (e.lodLevel = 'medium'),
                                  (e.size = Math.max(0.03, 0.75 * (e.originalSize || e.size))))
                                : ((e.culled = !1),
                                  (e.lodLevel = 'high'),
                                  (e.size = e.originalSize || e.size));
                    }
                } catch (t) {
                    w.warn('ParticleSystem: Error during LOD application:', t);
                }
        }
        validateUpdateParameters(e, t) {
            return 'number' != typeof e || isNaN(e) || e < 0
                ? (w.warn('ParticleSystem: Invalid deltaTime:', e), !1)
                : !(!t || 'object' != typeof t) ||
                      (w.warn('ParticleSystem: Invalid gameState:', t), !1);
        }
        validateEmissionParameters(e, t, i) {
            return e &&
                'object' == typeof e &&
                'number' == typeof e.x &&
                'number' == typeof e.y &&
                'number' == typeof e.z
                ? t && 'object' == typeof t && 'number' == typeof t.x && 'number' == typeof t.z
                    ? ('number' == typeof i && !isNaN(i)) ||
                      (w.warn('ParticleSystem: Invalid color:', i), !1)
                    : (w.warn('ParticleSystem: Invalid velocity:', t), !1)
                : (w.warn('ParticleSystem: Invalid position:', e), !1);
        }
        validateExplosionParameters(e, t) {
            return e &&
                'object' == typeof e &&
                'number' == typeof e.x &&
                'number' == typeof e.y &&
                'number' == typeof e.z
                ? !('number' != typeof t || isNaN(t) || t < 0 || t > 1) ||
                      (w.warn('ParticleSystem: Invalid explosion intensity:', t), !1)
                : (w.warn('ParticleSystem: Invalid explosion position:', e), !1);
        }
        validateCollectionParameters(e, t) {
            return e &&
                'object' == typeof e &&
                'number' == typeof e.x &&
                'number' == typeof e.y &&
                'number' == typeof e.z
                ? 'string' == typeof t || (w.warn('ParticleSystem: Invalid powerUpType:', t), !1)
                : (w.warn('ParticleSystem: Invalid collection position:', e), !1);
        }
        handlePerformanceMonitoringError(e) {
            (w.warn('ParticleSystem: Performance monitoring disabled due to error:', e.message),
                (this.adaptiveQualityEnabled = !1),
                this.setQualityLevel('low'),
                this.recordError('performance_monitoring', e));
        }
        handlePerformanceDegradationError(e) {
            (w.warn('ParticleSystem: Performance degradation check failed:', e.message),
                this.applyEmergencyPerformanceReduction(),
                this.recordError('performance_degradation', e));
        }
        handleParticlePoolError(e) {
            w.warn('ParticleSystem: Particle pool error, attempting recovery:', e.message);
            try {
                (this.particlePool.releaseAll(),
                    w.info('ParticleSystem: Particle pool recovered by releasing all particles'));
            } catch (t) {
                (w.error('ParticleSystem: Failed to recover particle pool:', t),
                    this.initiateSystemReset('particle_pool_failure'));
            }
            this.recordError('particle_pool', e);
        }
        handleRenderingError(e) {
            w.warn('ParticleSystem: Rendering error, attempting recovery:', e.message);
            try {
                (this.reinitializeRenderingBuffers(),
                    w.info('ParticleSystem: Rendering recovered by reinitializing buffers'));
            } catch (t) {
                (w.error('ParticleSystem: Failed to recover rendering:', t),
                    this.initiateSystemReset('rendering_failure'));
            }
            this.recordError('rendering', e);
        }
        handleShaderError(e) {
            (w.warn('ParticleSystem: Shader error, disabling shader updates:', e.message),
                (this.shaderUpdatesEnabled = !1),
                this.recordError('shader', e));
        }
        handleCriticalError(e, t) {
            (w.error(`ParticleSystem: Critical error in ${t}:`, e),
                this.recordError('critical', e, t),
                (this.errorCount = (this.errorCount || 0) + 1),
                this.errorCount >= 3
                    ? (w.error('ParticleSystem: Too many critical errors, initiating system reset'),
                      this.initiateSystemReset('critical_error_threshold'))
                    : this.applyGracefulFallback(t));
        }
        applyEmergencyPerformanceReduction() {
            (w.info('ParticleSystem: Applying emergency performance reduction'),
                (this.settings.effects.trailSparks = !1),
                (this.settings.effects.collections = !1),
                this.setQualityLevel('low'),
                (this.settings.maxParticles = Math.max(
                    25,
                    Math.floor(0.25 * this.originalMaxParticles)
                )),
                this.particlePool && (this.particlePool.maxParticles = this.settings.maxParticles));
        }
        reinitializeRenderingBuffers() {
            if (!this.particleGeometry) return;
            const e = new Float32Array(3 * this.settings.maxParticles),
                t = new Float32Array(3 * this.settings.maxParticles),
                i = new Float32Array(this.settings.maxParticles),
                r = new Float32Array(this.settings.maxParticles);
            (this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(e, 3)),
                this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(t, 3)),
                this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(i, 1)),
                this.particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(r, 1)),
                w.info('ParticleSystem: Rendering buffers reinitialized'));
        }
        applyGracefulFallback(e) {
            switch ((w.info(`ParticleSystem: Applying graceful fallback for ${e}`), e)) {
                case 'update':
                    this.autoUpdateEnabled = !1;
                    break;
                case 'emitTrailSparks':
                    this.settings.effects.trailSparks = !1;
                    break;
                case 'createExplosion':
                    this.settings.effects.explosions = !1;
                    break;
                case 'createCollectionEffect':
                    this.settings.effects.collections = !1;
                    break;
                default:
                    this.setQualityLevel('low');
            }
        }
        initiateSystemReset(e) {
            w.warn(`ParticleSystem: Initiating system reset due to: ${e}`);
            try {
                (this.particlePool && this.particlePool.releaseAll(),
                    (this.errorCount = 0),
                    (this.settings.enabled = !0),
                    (this.settings.quality = 'low'),
                    (this.settings.maxParticles = 50),
                    (this.settings.effects = { trailSparks: !1, explosions: !0, collections: !1 }),
                    this.scene && this.initializeRendering(),
                    this.performanceMonitor && this.performanceMonitor.reset(),
                    (this.adaptiveQualityEnabled = !0),
                    (this.degradationLevel = 0),
                    w.info('ParticleSystem: System reset completed successfully'));
            } catch (t) {
                (w.error('ParticleSystem: Failed to reset system:', t),
                    (this.settings.enabled = !1),
                    w.error('ParticleSystem: Disabled particle system as last resort'));
            }
        }
        recordError(e, t, i = '') {
            this.errorHistory || (this.errorHistory = []);
            const r = {
                timestamp: Date.now(),
                type: e,
                message: t.message,
                stack: t.stack,
                context: i,
            };
            (this.errorHistory.push(r), this.errorHistory.length > 10 && this.errorHistory.shift());
        }
        getErrorHistory() {
            return this.errorHistory || [];
        }
        getSystemHealth() {
            return {
                enabled: this.settings.enabled,
                errorCount: this.errorCount || 0,
                recentErrors: this.getErrorHistory().length,
                adaptiveQualityEnabled: this.adaptiveQualityEnabled,
                degradationLevel: this.degradationLevel,
                autoUpdateEnabled: !1 !== this.autoUpdateEnabled,
                shaderUpdatesEnabled: !1 !== this.shaderUpdatesEnabled,
                activeParticles: this.getActiveParticleCount(),
                maxParticles: this.settings.maxParticles,
                effectsEnabled: l({}, this.settings.effects),
            };
        }
        cleanupRenderingResources() {
            try {
                this.particlePoints && this.scene && this.scene.remove(this.particlePoints);
            } catch (e) {
                w.warn('ParticleSystem: Error removing particle points from scene:', e);
            }
            try {
                this.particleGeometry && this.particleGeometry.dispose();
            } catch (e) {
                w.warn('ParticleSystem: Error disposing particle geometry:', e);
            }
            try {
                if (this.particleMaterial) {
                    if (
                        this.particleMaterial.uniforms &&
                        this.particleMaterial.uniforms.pointTexture
                    ) {
                        const e = this.particleMaterial.uniforms.pointTexture.value;
                        e && e.dispose && e.dispose();
                    }
                    this.particleMaterial.dispose();
                }
            } catch (e) {
                w.warn('ParticleSystem: Error disposing particle material:', e);
            }
            ((this.particlePoints = null),
                (this.particleGeometry = null),
                (this.particleMaterial = null),
                w.info('ParticleSystem: Rendering resources cleaned up'));
        }
        dispose() {
            if (
                (this.particlePoints && this.scene.remove(this.particlePoints),
                this.particleGeometry && this.particleGeometry.dispose(),
                this.particleMaterial)
            ) {
                if (this.particleMaterial.uniforms && this.particleMaterial.uniforms.pointTexture) {
                    const e = this.particleMaterial.uniforms.pointTexture.value;
                    e && e.dispose && e.dispose();
                }
                this.particleMaterial.dispose();
            }
            (this.particlePool && this.particlePool.dispose(),
                this.performanceMonitor && this.performanceMonitor.reset(),
                (this.particlePoints = null),
                (this.particleGeometry = null),
                (this.particleMaterial = null),
                (this.performanceMonitor = null),
                (this.scene = null));
        }
    },
    Particle: E,
};
const F = (null == x.exports ? {} : x.exports).default || x.exports,
    A = Object.freeze(
        Object.defineProperty({ __proto__: null, default: F }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
export { F as _, A as a, b, M as c };
//# sourceMappingURL=particles-CoxQd5LJ.js.map
