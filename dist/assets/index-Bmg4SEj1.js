var __defProp = Object.defineProperty,
    __defProps = Object.defineProperties,
    __getOwnPropDescs = Object.getOwnPropertyDescriptors,
    __getOwnPropSymbols = Object.getOwnPropertySymbols,
    __hasOwnProp = Object.prototype.hasOwnProperty,
    __propIsEnum = Object.prototype.propertyIsEnumerable,
    __defNormalProp = (e, t, i) =>
        t in e
            ? __defProp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: i })
            : (e[t] = i),
    __spreadValues = (e, t) => {
        for (var i in t || (t = {})) __hasOwnProp.call(t, i) && __defNormalProp(e, i, t[i]);
        if (__getOwnPropSymbols)
            for (var i of __getOwnPropSymbols(t))
                __propIsEnum.call(t, i) && __defNormalProp(e, i, t[i]);
        return e;
    },
    __spreadProps = (e, t) => __defProps(e, __getOwnPropDescs(t)),
    __publicField = (e, t, i) => __defNormalProp(e, 'symbol' != typeof t ? t + '' : t, i),
    __async = (e, t, i) =>
        new Promise((r, n) => {
            var s = (e) => {
                    try {
                        o(i.next(e));
                    } catch (t) {
                        n(t);
                    }
                },
                a = (e) => {
                    try {
                        o(i.throw(e));
                    } catch (t) {
                        n(t);
                    }
                },
                o = (e) => (e.done ? r(e.value) : Promise.resolve(e.value).then(s, a));
            o((i = i.apply(e, t)).next());
        }),
    _a;
import {
    _ as __CJS__export_default__$1a,
    a as __CJS__import__50__,
    b as __CJS__export_default__$1d,
    c as __CJS__import__10__,
} from './audio-D35En-7M.js';
import {
    _ as __CJS__export_default__$1b,
    a as __CJS__import__22__,
    b as __CJS__export_default__$1c,
    c as __CJS__import__20__,
} from './particles-CoxQd5LJ.js';
!(function () {
    const e = document.createElement('link').relList;
    if (!(e && e.supports && e.supports('modulepreload'))) {
        for (const e of document.querySelectorAll('link[rel="modulepreload"]')) t(e);
        new MutationObserver((e) => {
            for (const i of e)
                if ('childList' === i.type)
                    for (const e of i.addedNodes)
                        'LINK' === e.tagName && 'modulepreload' === e.rel && t(e);
        }).observe(document, { childList: !0, subtree: !0 });
    }
    function t(e) {
        if (e.ep) return;
        e.ep = !0;
        const t = (function (e) {
            const t = {};
            return (
                e.integrity && (t.integrity = e.integrity),
                e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
                'use-credentials' === e.crossOrigin
                    ? (t.credentials = 'include')
                    : 'anonymous' === e.crossOrigin
                      ? (t.credentials = 'omit')
                      : (t.credentials = 'same-origin'),
                t
            );
        })(e);
        fetch(e.href, t);
    }
})();
var module$1a = { exports: {} };
const { Logger: Logger$f } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$y = Logger$f.create('ScorePersistence');
let ScorePersistence$1 =
    ((_a = class {
        static getStorage() {
            return 'undefined' != typeof window ? window.localStorage : global.localStorage;
        }
        static saveHighScore(e) {
            if (!this.isStorageAvailable())
                return (
                    logger$y.warn('localStorage not available, high score will not persist'),
                    !1
                );
            if (!this.isValidScore(e)) return (logger$y.error(`Invalid score value: ${e}`), !1);
            try {
                return (this.getStorage().setItem(this.HIGH_SCORE_KEY, e.toString()), !0);
            } catch (t) {
                return (logger$y.error('Failed to save high score to localStorage:', t), !1);
            }
        }
        static loadHighScore() {
            if (!this.isStorageAvailable())
                return (logger$y.warn('localStorage not available, using default high score'), 0);
            try {
                const e = this.getStorage().getItem(this.HIGH_SCORE_KEY);
                if (null === e) return 0;
                const t = parseInt(e, 10);
                return this.isValidScore(t)
                    ? t
                    : (logger$y.warn('Invalid high score in storage, resetting to 0'),
                      this.saveHighScore(0),
                      0);
            } catch (e) {
                return (logger$y.error('Failed to load high score from localStorage:', e), 0);
            }
        }
        static isStorageAvailable() {
            const e = this.getStorage();
            if (!e) return !1;
            try {
                const t = '__lightbikes_storage_test__';
                return (e.setItem(t, 'test'), e.removeItem(t), !0);
            } catch (t) {
                return !1;
            }
        }
        static isValidScore(e) {
            return (
                'number' == typeof e &&
                !isNaN(e) &&
                isFinite(e) &&
                e >= 0 &&
                e <= this.MAX_SCORE_VALUE &&
                Number.isInteger(e)
            );
        }
        static clearHighScore() {
            if (!this.isStorageAvailable()) return !1;
            try {
                return (this.getStorage().removeItem(this.HIGH_SCORE_KEY), !0);
            } catch (e) {
                return (logger$y.error('Failed to clear high score from localStorage:', e), !1);
            }
        }
    }),
    __publicField(_a, 'HIGH_SCORE_KEY', 'lightbikes_high_score'),
    __publicField(_a, 'MAX_SCORE_VALUE', 999999),
    _a);
module$1a.exports = { ScorePersistence: ScorePersistence$1 };
const __CJS__export_default__$19 =
        (null == module$1a.exports ? {} : module$1a.exports).default || module$1a.exports,
    __CJS__import__0__$6 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$19 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$19 = { exports: {} };
const { ScorePersistence: ScorePersistence } = __CJS__export_default__$19 || __CJS__import__0__$6;
let ScoreManager$1 = class {
    constructor() {
        ((this.playerScore = 0),
            (this.aiScore = 0),
            (this.highScore = ScorePersistence.loadHighScore()));
    }
    incrementPlayerScore() {
        (this.playerScore++, this.updateHighScore());
    }
    incrementAIScore() {
        this.aiScore++;
    }
    resetCurrentScores() {
        ((this.playerScore = 0), (this.aiScore = 0));
    }
    updateHighScore() {
        return (
            this.playerScore > this.highScore &&
            ((this.highScore = this.playerScore),
            ScorePersistence.saveHighScore(this.highScore),
            !0)
        );
    }
    isNewHighScore() {
        return this.playerScore === this.highScore && this.playerScore > 0;
    }
    setHighScore(e) {
        'number' == typeof e && e >= 0 && (this.highScore = e);
    }
    getScoreState() {
        return {
            playerScore: this.playerScore,
            aiScore: this.aiScore,
            highScore: this.highScore,
            isNewHighScore: this.isNewHighScore(),
            roundsPlayed: this.playerScore + this.aiScore,
        };
    }
};
module$19.exports = { ScoreManager: ScoreManager$1 };
const __CJS__export_default__$18 =
        (null == module$19.exports ? {} : module$19.exports).default || module$19.exports,
    __CJS__import__0__$5 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$18 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$18 = { exports: {} };
const GameModes$a = {
        CLASSIC: 'classic',
        TIME_TRIAL: 'time_trial',
        ARENA_SHRINK: 'arena_shrink',
        LOCAL_MULTIPLAYER: 'local_multiplayer',
    },
    TimerState = { startTime: null, pausedDuration: 0, isPaused: !1, isRunning: !1 };
module$18.exports = { GameModes: GameModes$a, TimerState: TimerState };
const __CJS__export_default__$17 =
        (null == module$18.exports ? {} : module$18.exports).default || module$18.exports,
    __CJS__import__19__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$17 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$17 = { exports: {} };
let SurvivalTimer$3 = class {
    constructor() {
        ((this.startTime = null),
            (this.pausedTime = 0),
            (this.totalPausedDuration = 0),
            (this.isPaused = !1),
            (this.isRunning = !1));
    }
    start() {
        this.isRunning ||
            ((this.startTime = performance.now()),
            (this.pausedTime = 0),
            (this.totalPausedDuration = 0),
            (this.isPaused = !1),
            (this.isRunning = !0));
    }
    pause() {
        this.isRunning &&
            !this.isPaused &&
            ((this.pausedTime = performance.now()), (this.isPaused = !0));
    }
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        const e = performance.now() - this.pausedTime;
        ((this.totalPausedDuration += e), (this.isPaused = !1), (this.pausedTime = 0));
    }
    stop() {
        this.isRunning && ((this.isRunning = !1), (this.isPaused = !1));
    }
    getElapsedTime() {
        if (!this.isRunning) return 0;
        const e = performance.now();
        let t = e - this.startTime - this.totalPausedDuration;
        return (this.isPaused && (t -= e - this.pausedTime), Math.max(0, t));
    }
    formatTime(e) {
        if ('number' != typeof e || e < 0 || !isFinite(e)) return '00:00.00';
        const t = Math.min(e, 5999990) / 1e3,
            i = t % 60;
        return `${Math.floor(t / 60)
            .toString()
            .padStart(2, '0')}:${i.toFixed(2).padStart(5, '0')}`;
    }
    getCurrentFormattedTime() {
        return this.formatTime(this.getElapsedTime());
    }
    reset() {
        ((this.startTime = null),
            (this.pausedTime = 0),
            (this.totalPausedDuration = 0),
            (this.isPaused = !1),
            (this.isRunning = !1));
    }
    getState() {
        return {
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            totalPausedDuration: this.totalPausedDuration,
            isPaused: this.isPaused,
            isRunning: this.isRunning,
            elapsedTime: this.getElapsedTime(),
        };
    }
};
module$17.exports = { SurvivalTimer: SurvivalTimer$3 };
const __CJS__export_default__$16 =
        (null == module$17.exports ? {} : module$17.exports).default || module$17.exports,
    __CJS__import__15__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$16 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$16 = { exports: {} };
let ArenaShrinker$1 = class {
    constructor(e = 30, t = 10, i = 5e3, r = 1) {
        ((this.initialSize = e),
            (this.currentSize = e),
            (this.minSize = t),
            (this.shrinkInterval = i),
            (this.shrinkAmount = r),
            (this.warningDuration = 2e3),
            (this.gracePeriod = 500),
            (this.isActive = !0),
            (this.gameStartTime = 0),
            (this.lastShrinkTime = 0),
            (this.warningActive = !1),
            (this.warningStartTime = 0),
            (this.gracePeriodActive = !1),
            (this.gracePeriodStartTime = 0),
            (this.shrinkCount = 0),
            (this.isAtMinimum = !1),
            (this.survivalStartTime = 0),
            (this.survivalEndTime = 0),
            (this.isTrackingSurvival = !1),
            (this.arenaSizeHistory = []),
            (this.shrinkTimestamps = []),
            (this.onWarningCallback = null),
            (this.onShrinkCallback = null),
            (this.onFinalArenaCallback = null));
    }
    initialize(e) {
        ((this.gameStartTime = e),
            (this.lastShrinkTime = e),
            (this.isActive = !0),
            (this.warningActive = !1),
            (this.gracePeriodActive = !1),
            (this.shrinkCount = 0),
            (this.isAtMinimum = !1),
            (this.currentSize = this.initialSize),
            (this.survivalStartTime = e),
            (this.survivalEndTime = 0),
            (this.isTrackingSurvival = !0),
            (this.arenaSizeHistory = [{ size: this.initialSize, timestamp: e }]),
            (this.shrinkTimestamps = []));
    }
    update(e) {
        if (!this.isActive || this.isAtMinimum) return;
        const t = e - this.lastShrinkTime,
            i = this.shrinkInterval - t;
        if (
            (!this.warningActive && i <= this.warningDuration && this.activateWarning(e),
            t >= this.shrinkInterval && this.executeShrink(e),
            this.gracePeriodActive)
        ) {
            e - this.gracePeriodStartTime >= this.gracePeriod && (this.gracePeriodActive = !1);
        }
    }
    activateWarning(e) {
        ((this.warningActive = !0),
            (this.warningStartTime = e),
            this.onWarningCallback && this.onWarningCallback());
    }
    executeShrink(e) {
        const t = Math.max(this.currentSize - 2 * this.shrinkAmount, this.minSize);
        (this.arenaSizeHistory.push({ size: t, timestamp: e }),
            this.shrinkTimestamps.push(e),
            t <= this.minSize
                ? ((this.currentSize = this.minSize),
                  (this.isAtMinimum = !0),
                  (this.isActive = !1),
                  this.onFinalArenaCallback && this.onFinalArenaCallback())
                : (this.currentSize = t),
            (this.lastShrinkTime = e),
            (this.warningActive = !1),
            this.shrinkCount++,
            (this.gracePeriodActive = !0),
            (this.gracePeriodStartTime = e),
            this.onShrinkCallback && this.onShrinkCallback());
    }
    getCurrentBounds() {
        const e = this.currentSize / 2;
        return { minX: -e, maxX: e, minZ: -e, maxZ: e, size: this.currentSize };
    }
    getNextBounds() {
        if (this.isAtMinimum) return this.getCurrentBounds();
        const e = Math.max(this.currentSize - 2 * this.shrinkAmount, this.minSize),
            t = e / 2;
        return { minX: -t, maxX: t, minZ: -t, maxZ: t, size: e };
    }
    isWarningActive() {
        return this.warningActive;
    }
    isGracePeriodActive() {
        return this.gracePeriodActive;
    }
    getTimeUntilShrink(e) {
        if (!this.isActive || this.isAtMinimum) return 0;
        const t = e - this.lastShrinkTime;
        return Math.max(0, this.shrinkInterval - t);
    }
    getCountdownSeconds(e) {
        const t = this.getTimeUntilShrink(e);
        return Math.ceil(t / 1e3);
    }
    getCurrentSize() {
        return this.currentSize;
    }
    getShrinkCount() {
        return this.shrinkCount;
    }
    isAtMinimumSize() {
        return this.isAtMinimum;
    }
    isWithinBounds(e) {
        const t = this.getCurrentBounds();
        return e.x >= t.minX && e.x <= t.maxX && e.z >= t.minZ && e.z <= t.maxZ;
    }
    setOnWarning(e) {
        this.onWarningCallback = e;
    }
    setOnShrink(e) {
        this.onShrinkCallback = e;
    }
    setOnFinalArena(e) {
        this.onFinalArenaCallback = e;
    }
    stopSurvivalTracking(e) {
        this.isTrackingSurvival && ((this.survivalEndTime = e), (this.isTrackingSurvival = !1));
    }
    getSurvivalTime(e = null) {
        if (!this.survivalStartTime) return 0;
        const t = this.isTrackingSurvival ? e || Date.now() : this.survivalEndTime;
        return Math.max(0, t - this.survivalStartTime);
    }
    getFormattedSurvivalTime(e = null) {
        const t = this.getSurvivalTime(e) / 1e3,
            i = t % 60;
        return `${Math.floor(t / 60)
            .toString()
            .padStart(2, '0')}:${i.toFixed(2).padStart(5, '0')}`;
    }
    getArenaSizeAtShrink(e) {
        return e < 0 || e >= this.arenaSizeHistory.length ? null : this.arenaSizeHistory[e].size;
    }
    getShrinkTimestamp(e) {
        return e < 0 || e >= this.shrinkTimestamps.length ? null : this.shrinkTimestamps[e];
    }
    getArenaSizeHistory() {
        return [...this.arenaSizeHistory];
    }
    getShrinkTimestamps() {
        return [...this.shrinkTimestamps];
    }
    getSurvivalStatistics(e = null) {
        return {
            survivalTime: this.getSurvivalTime(e),
            formattedSurvivalTime: this.getFormattedSurvivalTime(e),
            shrinksSurvived: this.shrinkCount,
            finalArenaSize: this.currentSize,
            isAtMinimumArena: this.isAtMinimum,
            arenaSizeHistory: this.getArenaSizeHistory(),
            shrinkTimestamps: this.getShrinkTimestamps(),
            averageTimePerShrink:
                this.shrinkCount > 0 ? this.getSurvivalTime(e) / this.shrinkCount : 0,
        };
    }
    reset() {
        ((this.currentSize = this.initialSize),
            (this.isActive = !0),
            (this.gameStartTime = 0),
            (this.lastShrinkTime = 0),
            (this.warningActive = !1),
            (this.warningStartTime = 0),
            (this.gracePeriodActive = !1),
            (this.gracePeriodStartTime = 0),
            (this.shrinkCount = 0),
            (this.isAtMinimum = !1),
            (this.survivalStartTime = 0),
            (this.survivalEndTime = 0),
            (this.isTrackingSurvival = !1),
            (this.arenaSizeHistory = []),
            (this.shrinkTimestamps = []));
    }
    getArenaState(e) {
        return {
            currentSize: this.currentSize,
            minSize: this.minSize,
            shrinkCount: this.shrinkCount,
            isActive: this.isActive,
            isAtMinimum: this.isAtMinimum,
            warningActive: this.warningActive,
            gracePeriodActive: this.gracePeriodActive,
            timeUntilShrink: this.getTimeUntilShrink(e),
            countdownSeconds: this.getCountdownSeconds(e),
            currentBounds: this.getCurrentBounds(),
            nextBounds: this.getNextBounds(),
            survivalTime: this.getSurvivalTime(e),
            formattedSurvivalTime: this.getFormattedSurvivalTime(e),
            isTrackingSurvival: this.isTrackingSurvival,
            arenaSizeHistory: this.getArenaSizeHistory(),
            shrinkTimestamps: this.getShrinkTimestamps(),
            survivalStatistics: this.getSurvivalStatistics(e),
        };
    }
};
module$16.exports = { ArenaShrinker: ArenaShrinker$1 };
const __CJS__export_default__$15 =
        (null == module$16.exports ? {} : module$16.exports).default || module$16.exports,
    __CJS__import__3__$4 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$15 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$15 = { exports: {} };
const { createLogger: createLogger$7 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$x = createLogger$7('AIController');
let AIController$3 = class {
    constructor(e, t) {
        ((this.config = e),
            (this.bounds = t),
            (this.opponents = []),
            (this.powerUpManager = null),
            (this.personalities = e.personalities || ['aggressive', 'defensive', 'erratic']),
            (this.colors = e.colors || ['red', 'blue', 'yellow', 'purple']));
    }
    initialize() {
        this.opponents = [];
        const e = this.validateAICount(this.config.aiCount);
        for (let t = 0; t < e; t++) {
            const i = this.calculateStartingPosition(t, e),
                r = this.assignPersonality(t),
                n = this.assignColor(t),
                s = {
                    id: `ai_${t + 1}`,
                    x: i.x,
                    y: i.y,
                    z: i.z,
                    direction: i.direction,
                    trail: [],
                    personality: r,
                    color: n,
                    alive: !0,
                    previousPosition: __spreadValues({}, i),
                };
            this.opponents.push(s);
        }
        logger$x.info(`Initialized ${this.opponents.length} AI opponents`);
    }
    validateAICount(e) {
        return 'number' != typeof e || e < 1 || e > 4 ? 1 : Math.floor(e);
    }
    calculateStartingPosition(e, t) {
        const i = this.bounds,
            r = i - 1;
        if (1 === t) return { x: 0, y: 0, z: -10, direction: { x: 1, y: 0, z: 0 } };
        const n = (e / t) * 2 * Math.PI,
            s = Math.round(i / 2 + (r / 2) * Math.cos(n)),
            a = Math.round(i / 2 + (r / 2) * Math.sin(n)),
            o = n + Math.PI,
            l = { x: Math.round(Math.cos(o)), y: 0, z: Math.round(Math.sin(o)) };
        return (
            Math.abs(l.x) > Math.abs(l.z)
                ? ((l.x = l.x > 0 ? 1 : -1), (l.z = 0))
                : ((l.x = 0), (l.z = l.z > 0 ? 1 : -1)),
            { x: s, y: 0, z: a, direction: l }
        );
    }
    assignPersonality(e) {
        return this.personalities[e % this.personalities.length];
    }
    assignColor(e) {
        return this.colors[e % this.colors.length];
    }
    update(e) {
        this.opponents.forEach((t) => {
            if (t.alive) {
                const i = this.powerUpManager ? this.powerUpManager.getSpeedMultiplier('ai') : 1;
                ((t.x += t.direction.x * e * i),
                    (t.z += t.direction.z * e * i),
                    t.trail.push({ x: t.x, y: t.y, z: t.z }));
            }
        });
    }
    addAI(e = {}) {
        if (this.opponents.length >= 4) return !1;
        const t = this.opponents.length,
            i = this.calculateStartingPosition(t, this.opponents.length + 1),
            r = e.personality || this.assignPersonality(t),
            n = e.color || this.assignColor(t),
            s = {
                id: e.id || `ai_${t + 1}`,
                x: e.x || i.x,
                y: e.y || i.y,
                z: e.z || i.z,
                direction: e.direction || i.direction,
                trail: [],
                personality: r,
                color: n,
                alive: !0,
                previousPosition: { x: e.x || i.x, y: e.y || i.y, z: e.z || i.z },
            };
        return (this.opponents.push(s), !0);
    }
    removeAI(e) {
        const t = this.opponents.findIndex((t) => t.id === e);
        return -1 !== t && (this.opponents.splice(t, 1), !0);
    }
    getAliveEntities() {
        return this.opponents
            .filter((e) => e.alive)
            .map((e) => ({
                id: e.id,
                type: 'ai',
                x: e.x,
                y: e.y,
                z: e.z,
                direction: e.direction,
                trail: e.trail,
                personality: e.personality,
                color: e.color,
                alive: e.alive,
            }));
    }
    getOpponents() {
        return this.opponents;
    }
    setPowerUpManager(e) {
        this.powerUpManager = e;
    }
    reset() {
        this.initialize();
    }
};
module$15.exports = { AIController: AIController$3 };
const __CJS__export_default__$14 =
        (null == module$15.exports ? {} : module$15.exports).default || module$15.exports,
    __CJS__import__4__$2 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$14 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$14 = { exports: {} };
const { ScoreManager: ScoreManager } = __CJS__export_default__$18 || __CJS__import__0__$5,
    { GameModes: GameModes$9 } = __CJS__export_default__$17 || __CJS__import__19__,
    { SurvivalTimer: SurvivalTimer$2 } = __CJS__export_default__$16 || __CJS__import__15__,
    { ArenaShrinker: ArenaShrinker } = __CJS__export_default__$15 || __CJS__import__3__$4,
    { AIController: AIController$2 } = __CJS__export_default__$14 || __CJS__import__4__$2;
let Game$3 = class {
    constructor(e = GameModes$9.CLASSIC, t = {}) {
        ((this.bounds = 30),
            (this.isPaused = !1),
            (this.gameSpeed = 0.1),
            (this.scoreManager = new ScoreManager()),
            (this.powerUpManager = null),
            (this.cameraEffectsManager = null),
            (this.gameMode = e),
            (this.gameConfig = {
                aiCount: this.validateAICount(t.aiCount || 1),
                maxEntities: 5,
                personalities: ['aggressive', 'defensive', 'erratic'],
                colors: ['red', 'blue', 'yellow', 'purple'],
            }),
            (this.aiController = new AIController$2(this.gameConfig, this.bounds)),
            this.gameMode === GameModes$9.TIME_TRIAL
                ? ((this.survivalTimer = new SurvivalTimer$2()), (this.arenaShrinker = null))
                : this.gameMode === GameModes$9.ARENA_SHRINK
                  ? ((this.survivalTimer = new SurvivalTimer$2()),
                    (this.arenaShrinker = new ArenaShrinker()))
                  : ((this.survivalTimer = null), (this.arenaShrinker = null)),
            this.init());
    }
    setGameSpeed(e) {
        'number' == typeof e && e > 0 && (this.gameSpeed = e);
    }
    validateAICount(e) {
        return 'number' != typeof e || e < 1 || e > 4 ? 1 : Math.floor(e);
    }
    addAI(e = {}) {
        const t = this.aiController.addAI(e);
        return (t && (this.gameConfig.aiCount = this.aiController.getOpponents().length), t);
    }
    removeAI(e) {
        const t = this.aiController.removeAI(e);
        return (t && (this.gameConfig.aiCount = this.aiController.getOpponents().length), t);
    }
    getAliveEntities() {
        const e = [];
        this.gameOver ||
            e.push({
                id: 'player',
                type: 'player',
                x: this.player.x,
                y: this.player.y,
                z: this.player.z,
                direction: this.playerDirection,
                trail: this.playerTrail,
                alive: !0,
            });
        const t = this.aiController.getAliveEntities();
        return (e.push(...t), e);
    }
    getBounds() {
        if (this.gameMode === GameModes$9.ARENA_SHRINK && this.arenaShrinker)
            return this.arenaShrinker.getCurrentBounds();
        {
            const e = this.bounds / 2;
            return { minX: -e, maxX: e, minZ: -e, maxZ: e, size: this.bounds };
        }
    }
    hasDynamicBounds() {
        return this.gameMode === GameModes$9.ARENA_SHRINK && null !== this.arenaShrinker;
    }
    getNextBounds() {
        return this.gameMode === GameModes$9.ARENA_SHRINK && this.arenaShrinker
            ? this.arenaShrinker.getNextBounds()
            : null;
    }
    isBoundaryWarningActive() {
        return (
            !(this.gameMode !== GameModes$9.ARENA_SHRINK || !this.arenaShrinker) &&
            this.arenaShrinker.isWarningActive()
        );
    }
    isGracePeriodActive() {
        return (
            !(this.gameMode !== GameModes$9.ARENA_SHRINK || !this.arenaShrinker) &&
            this.arenaShrinker.isGracePeriodActive()
        );
    }
    getGameState() {
        const e = __spreadValues(
            {
                bounds: this.bounds,
                player: this.player,
                playerDirection: this.playerDirection,
                playerTrail: this.playerTrail,
                isPaused: this.isPaused,
                frameCount: this.frameCount,
                gameStarted: this.gameStarted,
                gameOver: this.gameOver,
                gameSpeed: this.gameSpeed,
                gameMode: this.gameMode,
                gameConfig: this.gameConfig,
            },
            this.scoreManager.getScoreState()
        );
        if (
            (this.gameMode === GameModes$9.CLASSIC || this.gameMode === GameModes$9.ARENA_SHRINK
                ? ((e.aiOpponents = this.aiOpponents),
                  (e.ai = this.aiOpponents.length > 0 ? this.aiOpponents[0] : null),
                  (e.aiDirection =
                      this.aiOpponents.length > 0 ? this.aiOpponents[0].direction : null),
                  (e.aiTrail = this.aiOpponents.length > 0 ? this.aiOpponents[0].trail : []))
                : ((e.aiOpponents = []), (e.ai = null), (e.aiDirection = null), (e.aiTrail = [])),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                this.arenaShrinker &&
                (e.dynamicBounds = this.arenaShrinker.getCurrentBounds()),
            this.gameMode === GameModes$9.TIME_TRIAL &&
                this.survivalTimer &&
                ((e.survivalTime = this.survivalTimer.getElapsedTime()),
                (e.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime()),
                (e.timerRunning = this.survivalTimer.isRunning)),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                (this.survivalTimer &&
                    ((e.survivalTime = this.survivalTimer.getElapsedTime()),
                    (e.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime()),
                    (e.timerRunning = this.survivalTimer.isRunning)),
                this.arenaShrinker))
        ) {
            const t = Date.now();
            ((e.arenaState = this.arenaShrinker.getArenaState(t)),
                (e.dynamicBounds = this.arenaShrinker.getCurrentBounds()));
        }
        return e;
    }
    init() {
        ((this.gameOver = !1),
            (this.frameCount = 0),
            (this.isPaused = !1),
            (this.gameStarted = !1),
            (this.player = { x: 0, y: 0, z: 0 }),
            (this.playerDirection = { x: 1, y: 0, z: 0 }),
            (this.playerTrail = []),
            (this.playerPreviousPosition = { x: 0, y: 0, z: 0 }),
            (this.previousPlayerSpeed = this.gameSpeed),
            (this.aiOpponents = []),
            this.gameMode === GameModes$9.CLASSIC || this.gameMode === GameModes$9.ARENA_SHRINK
                ? (this.aiController.initialize(),
                  (this.aiOpponents = this.aiController.getOpponents()),
                  this.aiOpponents.length > 0
                      ? ((this.ai = this.aiOpponents[0]),
                        (this.aiDirection = this.aiOpponents[0].direction),
                        (this.aiTrail = this.aiOpponents[0].trail),
                        (this.aiPreviousPosition = this.aiOpponents[0].previousPosition))
                      : ((this.ai = null),
                        (this.aiDirection = null),
                        (this.aiTrail = []),
                        (this.aiPreviousPosition = null)))
                : ((this.ai = null),
                  (this.aiDirection = null),
                  (this.aiTrail = []),
                  (this.aiPreviousPosition = null)),
            this.gameMode === GameModes$9.TIME_TRIAL &&
                this.survivalTimer &&
                this.survivalTimer.reset(),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                this.arenaShrinker &&
                this.arenaShrinker.reset(),
            this.cameraEffectsManager &&
                this.cameraEffectsManager.isEnabled() &&
                this.cameraEffectsManager.reset());
    }
    update() {
        if (this.gameOver || this.isPaused) return;
        (this.gameStarted ||
            ((this.gameStarted = !0),
            this.gameMode === GameModes$9.TIME_TRIAL &&
                this.survivalTimer &&
                this.survivalTimer.start(),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                (this.survivalTimer && this.survivalTimer.start(),
                this.arenaShrinker && this.arenaShrinker.initialize(Date.now()))),
            this.frameCount++,
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                this.arenaShrinker &&
                this.arenaShrinker.update(Date.now()));
        const e = this.powerUpManager ? this.powerUpManager.getSpeedMultiplier('player') : 1,
            t = this.gameSpeed * e;
        (this.previousPlayerSpeed || (this.previousPlayerSpeed = this.gameSpeed),
            (this.player.x += this.playerDirection.x * t),
            (this.player.z += this.playerDirection.z * t),
            this.cameraEffectsManager &&
                Math.abs(t - this.previousPlayerSpeed) > 0.01 &&
                this.cameraEffectsManager.onSpeedChange(this.player, t),
            (this.previousPlayerSpeed = t),
            this.playerTrail.push(__spreadValues({}, this.player)),
            (this.gameMode === GameModes$9.CLASSIC || this.gameMode === GameModes$9.ARENA_SHRINK) &&
                this.aiOpponents.length > 0 &&
                (this.aiController.update(this.gameSpeed),
                this.aiOpponents.length > 0 &&
                    ((this.ai = this.aiOpponents[0]),
                    (this.aiDirection = this.aiOpponents[0].direction),
                    (this.aiTrail = this.aiOpponents[0].trail))));
    }
    changePlayerDirection(e) {
        if (!e || 'string' != typeof e) return;
        let t = !1;
        switch ((__spreadValues({}, this.playerDirection), e)) {
            case 'ArrowUp':
                0 === this.playerDirection.z &&
                    ((this.playerDirection = { x: 0, y: 0, z: -1 }), (t = !0));
                break;
            case 'ArrowDown':
                0 === this.playerDirection.z &&
                    ((this.playerDirection = { x: 0, y: 0, z: 1 }), (t = !0));
                break;
            case 'ArrowLeft':
                0 === this.playerDirection.x &&
                    ((this.playerDirection = { x: -1, y: 0, z: 0 }), (t = !0));
                break;
            case 'ArrowRight':
                0 === this.playerDirection.x &&
                    ((this.playerDirection = { x: 1, y: 0, z: 0 }), (t = !0));
        }
        return t;
    }
    pause() {
        return (
            !this.gameOver &&
            (this.isPaused ||
                ((this.isPaused = !0),
                this.cameraEffectsManager &&
                    this.cameraEffectsManager.isEnabled() &&
                    this.cameraEffectsManager.pause(),
                this.gameMode === GameModes$9.TIME_TRIAL &&
                    this.survivalTimer &&
                    this.survivalTimer.pause(),
                this.gameMode === GameModes$9.ARENA_SHRINK &&
                    this.survivalTimer &&
                    this.survivalTimer.pause()),
            !0)
        );
    }
    resume() {
        return (
            !!this.isPaused &&
            !this.gameOver &&
            ((this.isPaused = !1),
            this.cameraEffectsManager &&
                this.cameraEffectsManager.isEnabled() &&
                this.cameraEffectsManager.resume(),
            this.gameMode === GameModes$9.TIME_TRIAL &&
                this.survivalTimer &&
                this.survivalTimer.resume(),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                this.survivalTimer &&
                this.survivalTimer.resume(),
            !0)
        );
    }
    togglePause() {
        return !this.gameOver && (this.isPaused ? this.resume() : this.pause());
    }
    handleRoundEnd(e) {
        if (!e) return;
        const { playerCollided: t, aiCollided: i } = e;
        (this.gameMode === GameModes$9.TIME_TRIAL && this.stopSurvivalTimer(),
            this.gameMode === GameModes$9.ARENA_SHRINK &&
                (this.stopSurvivalTimer(),
                this.arenaShrinker && this.arenaShrinker.stopSurvivalTracking(Date.now())),
            this.gameMode === GameModes$9.CLASSIC &&
                (t && !i
                    ? this.scoreManager.incrementAIScore()
                    : i && !t && this.scoreManager.incrementPlayerScore()));
    }
    restart() {
        (this.scoreManager.resetCurrentScores(), this.init());
    }
    startSurvivalTimer() {
        (this.gameMode !== GameModes$9.TIME_TRIAL && this.gameMode !== GameModes$9.ARENA_SHRINK) ||
            !this.survivalTimer ||
            this.survivalTimer.start();
    }
    stopSurvivalTimer() {
        (this.gameMode !== GameModes$9.TIME_TRIAL && this.gameMode !== GameModes$9.ARENA_SHRINK) ||
            !this.survivalTimer ||
            this.survivalTimer.stop();
    }
    getSurvivalTime() {
        return (this.gameMode !== GameModes$9.TIME_TRIAL &&
            this.gameMode !== GameModes$9.ARENA_SHRINK) ||
            !this.survivalTimer
            ? 0
            : this.survivalTimer.getElapsedTime();
    }
    getFormattedSurvivalTime() {
        return (this.gameMode !== GameModes$9.TIME_TRIAL &&
            this.gameMode !== GameModes$9.ARENA_SHRINK) ||
            !this.survivalTimer
            ? '00:00.00'
            : this.survivalTimer.getCurrentFormattedTime();
    }
    isTimeTrialMode() {
        return this.gameMode === GameModes$9.TIME_TRIAL;
    }
    isArenaShrinkMode() {
        return this.gameMode === GameModes$9.ARENA_SHRINK;
    }
    setTimeTrialMode(e) {
        const t = e ? GameModes$9.TIME_TRIAL : GameModes$9.CLASSIC;
        this.setGameMode(t);
    }
    setGameMode(e) {
        this.gameMode !== e &&
            ((this.gameMode = e),
            e === GameModes$9.TIME_TRIAL
                ? (this.survivalTimer || (this.survivalTimer = new SurvivalTimer$2()),
                  (this.arenaShrinker = null))
                : e === GameModes$9.ARENA_SHRINK
                  ? (this.survivalTimer || (this.survivalTimer = new SurvivalTimer$2()),
                    this.arenaShrinker || (this.arenaShrinker = new ArenaShrinker()))
                  : ((this.survivalTimer = null), (this.arenaShrinker = null)),
            this.init());
    }
    setPowerUpManager(e) {
        ((this.powerUpManager = e), this.aiController && this.aiController.setPowerUpManager(e));
    }
    setCameraEffectsManager(e) {
        this.cameraEffectsManager = e;
    }
    setOnShrinkWarning(e) {
        this.gameMode === GameModes$9.ARENA_SHRINK &&
            this.arenaShrinker &&
            this.arenaShrinker.setOnWarning(e);
    }
    setOnShrink(e) {
        this.gameMode === GameModes$9.ARENA_SHRINK &&
            this.arenaShrinker &&
            this.arenaShrinker.setOnShrink(e);
    }
    setOnFinalArena(e) {
        this.gameMode === GameModes$9.ARENA_SHRINK &&
            this.arenaShrinker &&
            this.arenaShrinker.setOnFinalArena(e);
    }
    getArenaShrinker() {
        return this.arenaShrinker;
    }
    getArenaShrinkSurvivalStats() {
        return this.gameMode === GameModes$9.ARENA_SHRINK && this.arenaShrinker
            ? this.arenaShrinker.getSurvivalStatistics()
            : null;
    }
    getArenaSizeHistory() {
        return this.gameMode === GameModes$9.ARENA_SHRINK && this.arenaShrinker
            ? this.arenaShrinker.getArenaSizeHistory()
            : null;
    }
    getShrinksSurvived() {
        return this.gameMode === GameModes$9.ARENA_SHRINK && this.arenaShrinker
            ? this.arenaShrinker.getShrinkCount()
            : 0;
    }
};
module$14.exports = { Game: Game$3 };
const __CJS__export_default__$13 =
        (null == module$14.exports ? {} : module$14.exports).default || module$14.exports,
    __CJS__import__0__$4 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$13 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$13 = { exports: {} };
let PlayerEntity$1 = class {
    constructor(e, t, i, r = null) {
        ((this.id = e),
            (this.color = t),
            (this.type = e.startsWith('P') ? 'human' : 'ai'),
            (this.position = __spreadValues({}, i)),
            (this.direction = { x: 1, y: 0, z: 0 }),
            (this.previousPosition = __spreadValues({}, i)),
            (this.trail = []),
            (this.isAlive = !0),
            (this.frameCount = 0),
            (this.controlScheme = r),
            (this.gameSpeed = 0.1),
            (this.speedMultiplier = 1),
            this.initializeStartingDirection(i));
    }
    initializeStartingDirection(e) {
        const t = 0 - e.x,
            i = 0 - e.z;
        Math.abs(t) > Math.abs(i)
            ? (this.direction = { x: t > 0 ? 1 : -1, y: 0, z: 0 })
            : (this.direction = { x: 0, y: 0, z: i > 0 ? 1 : -1 });
    }
    reset(e = null) {
        (e
            ? ((this.position = __spreadValues({}, e)),
              (this.previousPosition = __spreadValues({}, e)),
              this.initializeStartingDirection(e))
            : (this.previousPosition = __spreadValues({}, this.position)),
            (this.trail = []),
            (this.isAlive = !0),
            (this.frameCount = 0),
            (this.speedMultiplier = 1));
    }
    update(e = 0.1, t = 1) {
        if (!this.isAlive) return;
        ((this.gameSpeed = e),
            (this.speedMultiplier = t),
            this.frameCount++,
            (this.previousPosition = __spreadValues({}, this.position)));
        const i = e * t;
        ((this.position.x += this.direction.x * i),
            (this.position.z += this.direction.z * i),
            this.trail.push(__spreadValues({}, this.position)));
    }
    changeDirection(e) {
        if (!this.isAlive) return !1;
        if (
            (0 !== this.direction.x && this.direction.x === -e.x) ||
            (0 !== this.direction.z && this.direction.z === -e.z)
        )
            return !1;
        return (
            (this.direction.x !== e.x || this.direction.z !== e.z) &&
            ((this.direction = __spreadValues({}, e)), !0)
        );
    }
    crash() {
        this.isAlive = !1;
    }
    getState() {
        return {
            id: this.id,
            type: this.type,
            color: this.color,
            position: __spreadValues({}, this.position),
            direction: __spreadValues({}, this.direction),
            previousPosition: __spreadValues({}, this.previousPosition),
            trail: [...this.trail],
            isAlive: this.isAlive,
            frameCount: this.frameCount,
            controlScheme: this.controlScheme,
            gameSpeed: this.gameSpeed,
            speedMultiplier: this.speedMultiplier,
        };
    }
    getPosition() {
        return __spreadValues({}, this.position);
    }
    getTrail() {
        return [...this.trail];
    }
    isHuman() {
        return 'human' === this.type;
    }
    isAI() {
        return 'ai' === this.type;
    }
    getDisplayName() {
        return this.isHuman() ? this.id : `AI ${this.id.split('_')[1]}`;
    }
    setSpeedMultiplier(e) {
        this.speedMultiplier = Math.max(0.1, e);
    }
    getEffectiveSpeed() {
        return this.gameSpeed * this.speedMultiplier;
    }
    canChangeDirection() {
        return this.isAlive;
    }
    getTrailLength() {
        return this.trail.length;
    }
    clearTrail() {
        this.trail = [];
    }
};
module$13.exports = { PlayerEntity: PlayerEntity$1 };
const __CJS__export_default__$12 =
        (null == module$13.exports ? {} : module$13.exports).default || module$13.exports,
    __CJS__import__1__$6 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$12 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$12 = { exports: {} };
let LocalScoring$1 = class {
    constructor() {
        ((this.player1Wins = 0),
            (this.player2Wins = 0),
            (this.currentRound = 1),
            (this.totalRounds = 0),
            (this.roundHistory = []));
    }
    incrementScore(e) {
        ('P1' === e ? this.player1Wins++ : 'P2' === e && this.player2Wins++,
            this.totalRounds++,
            this.roundHistory.push(e));
    }
    handleTieGame() {
        (this.totalRounds++, this.roundHistory.push('TIE'));
    }
    getScore(e) {
        return 'P1' === e ? this.player1Wins : 'P2' === e ? this.player2Wins : 0;
    }
    getScoreDisplay() {
        return `${this.player1Wins} - ${this.player2Wins}`;
    }
    getScoreDetails() {
        return {
            player1Wins: this.player1Wins,
            player2Wins: this.player2Wins,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            roundHistory: [...this.roundHistory],
        };
    }
    resetScores() {
        ((this.player1Wins = 0),
            (this.player2Wins = 0),
            (this.currentRound = 1),
            (this.totalRounds = 0),
            (this.roundHistory = []));
    }
    nextRound() {
        this.currentRound++;
    }
    getLeader() {
        return this.player1Wins > this.player2Wins
            ? 'P1'
            : this.player2Wins > this.player1Wins
              ? 'P2'
              : null;
    }
    hasLeader() {
        return this.player1Wins !== this.player2Wins;
    }
    getWinPercentage(e) {
        if (0 === this.totalRounds) return 0;
        const t = this.getScore(e);
        return Math.round((t / this.totalRounds) * 100);
    }
    getLastRoundWinner() {
        return 0 === this.roundHistory.length
            ? null
            : this.roundHistory[this.roundHistory.length - 1];
    }
    exportState() {
        return {
            player1Wins: this.player1Wins,
            player2Wins: this.player2Wins,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            roundHistory: [...this.roundHistory],
        };
    }
    importState(e) {
        e &&
            ((this.player1Wins = e.player1Wins || 0),
            (this.player2Wins = e.player2Wins || 0),
            (this.currentRound = e.currentRound || 1),
            (this.totalRounds = e.totalRounds || 0),
            (this.roundHistory = e.roundHistory || []));
    }
};
module$12.exports = { LocalScoring: LocalScoring$1 };
const __CJS__export_default__$11 =
        (null == module$12.exports ? {} : module$12.exports).default || module$12.exports,
    __CJS__import__3__$3 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$11 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$11 = { exports: {} };
const { Game: Game$2 } = __CJS__export_default__$13 || __CJS__import__0__$4,
    { PlayerEntity: PlayerEntity } = __CJS__export_default__$12 || __CJS__import__1__$6,
    { GameModes: GameModes$8 } = __CJS__export_default__$17 || __CJS__import__19__,
    { LocalScoring: LocalScoring } = __CJS__export_default__$11 || __CJS__import__3__$3;
let MultiplayerGame$2 = class extends Game$2 {
    constructor(e = {}) {
        (super(GameModes$8.CLASSIC, e),
            (this.gameMode = 'local-multiplayer'),
            (this.controlSchemes = {
                player1: {
                    up: 'ArrowUp',
                    down: 'ArrowDown',
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                },
                player2: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
            }),
            (this.localScoring = new LocalScoring()),
            (this.player1 = null),
            (this.player2 = null),
            (this.lastRoundWinner = null),
            this.initializeMultiplayer());
    }
    initializeMultiplayer() {
        ((this.player1 = new PlayerEntity(
            'P1',
            'green',
            { x: -10, y: 0, z: 0 },
            this.controlSchemes.player1
        )),
            (this.player2 = new PlayerEntity(
                'P2',
                'blue',
                { x: 10, y: 0, z: 0 },
                this.controlSchemes.player2
            )),
            (this.player1.direction = { x: 1, y: 0, z: 0 }),
            (this.player2.direction = { x: -1, y: 0, z: 0 }));
    }
    init() {
        if (
            ((this.gameOver = !1),
            (this.frameCount = 0),
            (this.isPaused = !1),
            (this.gameStarted = !1),
            this.controlSchemes)
        )
            if (this.player1 && this.player2) {
                const e = { x: -10, y: 0, z: 0 },
                    t = { x: 10, y: 0, z: 0 };
                (this.player1.reset(e),
                    this.player2.reset(t),
                    (this.player1.direction = { x: 1, y: 0, z: 0 }),
                    (this.player2.direction = { x: -1, y: 0, z: 0 }));
            } else this.initializeMultiplayer();
        ((this.player = null),
            (this.playerDirection = null),
            (this.playerTrail = []),
            (this.ai = null),
            (this.aiDirection = null),
            (this.aiTrail = []),
            (this.aiOpponents = []),
            this.cameraEffectsManager &&
                this.cameraEffectsManager.isEnabled() &&
                this.cameraEffectsManager.reset(),
            this.gameMode === GameModes$8.TIME_TRIAL &&
                this.survivalTimer &&
                this.survivalTimer.reset(),
            this.gameMode === GameModes$8.ARENA_SHRINK &&
                this.arenaShrinker &&
                this.arenaShrinker.reset());
    }
    update() {
        if (this.gameOver || this.isPaused) return;
        (this.gameStarted ||
            ((this.gameStarted = !0),
            this.gameMode === GameModes$8.TIME_TRIAL &&
                this.survivalTimer &&
                this.survivalTimer.start(),
            this.gameMode === GameModes$8.ARENA_SHRINK &&
                (this.survivalTimer && this.survivalTimer.start(),
                this.arenaShrinker && this.arenaShrinker.initialize(Date.now()))),
            this.frameCount++,
            this.gameMode === GameModes$8.ARENA_SHRINK &&
                this.arenaShrinker &&
                this.arenaShrinker.update(Date.now()));
        const e = this.powerUpManager ? this.powerUpManager.getSpeedMultiplier('player1') : 1,
            t = this.powerUpManager ? this.powerUpManager.getSpeedMultiplier('player2') : 1;
        if (
            this.player1 &&
            this.player1.isAlive &&
            (this.player1.update(this.gameSpeed, e), this.cameraEffectsManager)
        ) {
            const e = this.player1.getEffectiveSpeed();
            this.cameraEffectsManager.onSpeedChange(this.player1.getPosition(), e);
        }
        if (
            this.player2 &&
            this.player2.isAlive &&
            (this.player2.update(this.gameSpeed, t), this.cameraEffectsManager)
        ) {
            const e = this.player2.getEffectiveSpeed();
            this.cameraEffectsManager.onSpeedChange(this.player2.getPosition(), e);
        }
    }
    getPlayerDirection(e) {
        const t = 'P1' === e ? this.player1 : this.player2;
        return t ? t.direction : null;
    }
    changePlayerDirection(e, t, ...i) {
        const r = 'P1' === e ? this.player1 : this.player2;
        if (!r || !r.canChangeDirection()) return !1;
        const n = 'P1' === e ? this.controlSchemes.player1 : this.controlSchemes.player2;
        let s = null;
        return (
            t === n.up
                ? (s = { x: 0, y: 0, z: -1 })
                : t === n.down
                  ? (s = { x: 0, y: 0, z: 1 })
                  : t === n.left
                    ? (s = { x: -1, y: 0, z: 0 })
                    : t === n.right && (s = { x: 1, y: 0, z: 0 }),
            !!s && r.changeDirection(s)
        );
    }
    getGameState() {
        const e = __spreadValues(
            {
                bounds: this.bounds,
                isPaused: this.isPaused,
                frameCount: this.frameCount,
                gameStarted: this.gameStarted,
                gameOver: this.gameOver,
                gameSpeed: this.gameSpeed,
                gameMode: this.gameMode,
                localScoring: this.localScoring.getScoreDetails(),
            },
            this.scoreManager.getScoreState()
        );
        return (
            this.player1 && (e.player1 = this.player1.getState()),
            this.player2 && (e.player2 = this.player2.getState()),
            (e.players = []),
            this.player1 && e.players.push(this.player1.getState()),
            this.player2 && e.players.push(this.player2.getState()),
            (e.player = null),
            (e.playerDirection = null),
            (e.playerTrail = []),
            (e.ai = null),
            (e.aiDirection = null),
            (e.aiTrail = []),
            (e.aiOpponents = []),
            this.gameMode === GameModes$8.ARENA_SHRINK &&
                this.arenaShrinker &&
                ((e.dynamicBounds = this.arenaShrinker.getCurrentBounds()),
                (e.arenaState = this.arenaShrinker.getArenaState(Date.now()))),
            (this.gameMode !== GameModes$8.TIME_TRIAL &&
                this.gameMode !== GameModes$8.ARENA_SHRINK) ||
                !this.survivalTimer ||
                ((e.survivalTime = this.survivalTimer.getElapsedTime()),
                (e.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime()),
                (e.timerRunning = this.survivalTimer.isRunning)),
            e
        );
    }
    handleRoundEnd(e) {
        if (!e) return;
        const { player1Collided: t, player2Collided: i } = e;
        (this.gameMode === GameModes$8.TIME_TRIAL && this.stopSurvivalTimer(),
            this.gameMode === GameModes$8.ARENA_SHRINK &&
                (this.stopSurvivalTimer(),
                this.arenaShrinker && this.arenaShrinker.stopSurvivalTracking(Date.now())));
        let r = null;
        (t && !i
            ? (this.localScoring.incrementScore('P2'), (r = 'P2'))
            : i && !t
              ? (this.localScoring.incrementScore('P1'), (r = 'P1'))
              : (this.localScoring.handleTieGame(), (r = null)),
            this.localScoring.nextRound(),
            (this.lastRoundWinner = r));
    }
    restart() {
        ((this.lastRoundWinner = null), this.init());
    }
    resetScores() {
        (this.localScoring.resetScores(),
            this.scoreManager.resetCurrentScores(),
            (this.lastRoundWinner = null),
            this.init());
    }
    getLastRoundWinner() {
        return this.lastRoundWinner;
    }
    getLocalScoring() {
        return this.localScoring.getScoreDetails();
    }
    getAlivePlayers() {
        const e = [];
        return (
            this.player1 && this.player1.isAlive && e.push(this.player1),
            this.player2 && this.player2.isAlive && e.push(this.player2),
            e
        );
    }
    shouldEndGame() {
        return (this.player1 && !this.player1.isAlive) || (this.player2 && !this.player2.isAlive);
    }
    getRoundWinner() {
        const e = this.player1 && this.player1.isAlive,
            t = this.player2 && this.player2.isAlive;
        return e && !t ? 'P1' : t && !e ? 'P2' : null;
    }
    getOverallWinner() {
        return this.localScoring.getLeader();
    }
    isMultiplayer() {
        return !0;
    }
    getPlayer(e) {
        return 'P1' === e ? this.player1 : 'P2' === e ? this.player2 : null;
    }
    getPlayers() {
        const e = [];
        return (this.player1 && e.push(this.player1), this.player2 && e.push(this.player2), e);
    }
};
module$11.exports = { MultiplayerGame: MultiplayerGame$2 };
const __CJS__export_default__$10 =
        (null == module$11.exports ? {} : module$11.exports).default || module$11.exports,
    __CJS__import__1__$5 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$10 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$10 = { exports: {} };
let AIController$1 = class {
        constructor(e = 'defensive') {
            ((this.aiState = 'DEFENSIVE'),
                (this.aiStateCooldown = 0),
                (this.personality = e),
                (this.erraticTurnCounter = 0),
                (this.erraticTurnInterval = this.getRandomTurnInterval()));
        }
        calculateAIDirection(e, t = {}) {
            if (!(e && e.ai && e.player && e.aiDirection))
                return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
            if (e.isPaused) return { newDirection: e.aiDirection, newState: this.aiState };
            switch (this.personality) {
                case 'aggressive':
                    return this.aggressiveBehavior(e, t);
                case 'defensive':
                default:
                    return this.defensiveBehavior(e, t);
                case 'erratic':
                    return this.erraticBehavior(e, t);
            }
        }
        runDefensiveCheck(e) {
            if (!e || !e.ai || !e.aiDirection) return { forward: 0, left: 0, right: 0 };
            if (e.isPaused)
                return this.lastWhiskerDistances || { forward: 20, left: 20, right: 20 };
            const { ai: t, aiDirection: i, bounds: r = 30 } = e,
                n = this.getCurrentBoundaries(e),
                s = {
                    forward: { x: i.x, z: i.z },
                    left: { x: i.z, z: -i.x },
                    right: { x: -i.z, z: i.x },
                },
                a = this.adaptWhiskerLength(n, e.dynamicBounds),
                o = this.getAllObstacleTrails(t.id || 'ai', e),
                l = { forward: a, left: a, right: a };
            for (const [c, d] of Object.entries(s))
                for (let e = 1; e <= a; e++) {
                    const i = t.x + d.x * e * 0.1,
                        r = t.z + d.z * e * 0.1;
                    let s = !1;
                    if ((this.isOutsideBounds(i, r, n) && (s = !0), !s))
                        for (const e of o)
                            if (
                                e &&
                                'number' == typeof e.x &&
                                'number' == typeof e.z &&
                                Math.abs(i - e.x) < 0.15 &&
                                Math.abs(r - e.z) < 0.15
                            ) {
                                s = !0;
                                break;
                            }
                    if (s) {
                        l[c] = e;
                        break;
                    }
                }
            return ((this.lastWhiskerDistances = l), l);
        }
        getAllObstacleTrails(e, t) {
            const i = [];
            if (
                (t.playerTrail && i.push(...t.playerTrail),
                t.aiOpponents &&
                    t.aiOpponents.forEach((t) => {
                        if (t.id !== e && t.alive && t.trail) {
                            const e = 10,
                                r =
                                    t.trail.length > e
                                        ? t.trail.slice(0, t.trail.length - e)
                                        : t.trail;
                            i.push(...r);
                        }
                    }),
                t.aiOpponents)
            ) {
                const r = t.aiOpponents.find((t) => t.id === e);
                r &&
                    r.trail &&
                    r.trail.length > 10 &&
                    i.push(...r.trail.slice(0, r.trail.length - 10));
            }
            return (
                t.aiTrail &&
                    t.aiTrail.length > 10 &&
                    i.push(...t.aiTrail.slice(0, t.aiTrail.length - 10)),
                i
            );
        }
        getCurrentBoundaries(e) {
            if (e.dynamicBounds) return e.dynamicBounds;
            const t = e.bounds || 30;
            return { minX: -t, maxX: t, minZ: -t, maxZ: t, size: 2 * t };
        }
        isOutsideBounds(e, t, i) {
            return e <= i.minX || e >= i.maxX || t <= i.minZ || t >= i.maxZ;
        }
        adaptWhiskerLength(e, t) {
            if (!t) return 20;
            const i = e.size || e.maxX - e.minX,
                r = Math.max(0.4, i / 30);
            return Math.max(8, Math.floor(20 * r));
        }
        adaptTurnThresholdForArenaSize(e, t) {
            if (!e.dynamicBounds) return t;
            const i = this.getCurrentBoundaries(e),
                r = i.size || i.maxX - i.minX,
                n = Math.max(0.5, r / 30);
            return Math.max(3, Math.floor(t * n));
        }
        aggressiveBehavior(e, t = {}) {
            const i = t.turnThreshold || 8,
                r = t.randomTurnChance || 0.01,
                { ai: n, player: s, aiDirection: a } = e,
                o = this.runDefensiveCheck(e),
                l = this.adaptTurnThresholdForArenaSize(e, i);
            let c = a;
            if (o.forward < l) c = o.left > o.right ? { x: a.z, z: -a.x } : { x: -a.z, z: a.x };
            else {
                const e = this.calculatePlayerDirection(n, s);
                this.canSafelyTurnToward(e, o, l)
                    ? (c = e)
                    : Math.random() < r &&
                      (c = Math.random() > 0.5 ? { x: a.z, z: -a.x } : { x: -a.z, z: a.x });
            }
            return { newDirection: c, newState: 'AGGRESSIVE' };
        }
        defensiveBehavior(e, t = {}) {
            const i = t.turnThreshold || 10,
                r = t.randomTurnChance || 0.02,
                { aiDirection: n } = e,
                s = this.runDefensiveCheck(e);
            let a = n;
            const o = this.adaptTurnThresholdForArenaSize(e, i);
            return (
                s.forward < o
                    ? (a = s.left > s.right ? { x: n.z, z: -n.x } : { x: -n.z, z: n.x })
                    : Math.random() < r &&
                      (a = Math.random() > 0.5 ? { x: n.z, z: -n.x } : { x: -n.z, z: n.x }),
                { newDirection: a, newState: 'DEFENSIVE' }
            );
        }
        erraticBehavior(e, t = {}) {
            const i = t.turnThreshold || 10,
                r = t.randomTurnChance || 0.02,
                { aiDirection: n } = e,
                s = this.runDefensiveCheck(e),
                a = this.adaptTurnThresholdForArenaSize(e, i);
            let o = n;
            return (
                this.erraticTurnCounter++,
                s.forward < a
                    ? ((o = s.left > s.right ? { x: n.z, z: -n.x } : { x: -n.z, z: n.x }),
                      (this.erraticTurnCounter = 0),
                      (this.erraticTurnInterval = this.getRandomTurnInterval()))
                    : this.erraticTurnCounter >= this.erraticTurnInterval
                      ? ((o = Math.random() > 0.5 ? { x: n.z, z: -n.x } : { x: -n.z, z: n.x }),
                        (this.erraticTurnCounter = 0),
                        (this.erraticTurnInterval = this.getRandomTurnInterval()))
                      : Math.random() < r &&
                        (o = Math.random() > 0.5 ? { x: n.z, z: -n.x } : { x: -n.z, z: n.x }),
                { newDirection: o, newState: 'ERRATIC' }
            );
        }
        calculatePlayerDirection(e, t) {
            const i = t.x - e.x,
                r = t.z - e.z;
            return Math.abs(i) > Math.abs(r)
                ? i > 0
                    ? { x: 1, z: 0 }
                    : { x: -1, z: 0 }
                : r > 0
                  ? { x: 0, z: 1 }
                  : { x: 0, z: -1 };
        }
        canSafelyTurnToward(e, t, i) {
            return t.forward >= i && t.left >= i / 2 && t.right >= i / 2;
        }
        getRandomTurnInterval() {
            return Math.floor(21 * Math.random()) + 20;
        }
    },
    AICoordinator$2 = class {
        constructor() {
            ((this.recentDecisions = new Map()),
                (this.decisionHistory = []),
                (this.maxHistorySize = 10),
                (this.staggeredTiming = !1),
                (this.frameOffset = 0));
        }
        coordinateAIDecisions(e, t, i = {}) {
            const r = [],
                n = new Map();
            for (let s = 0; s < e.length; s++) {
                const a = e[s];
                if (!a.alive || !a.controller) continue;
                if (this.staggeredTiming && this.shouldSkipFrame(s)) {
                    const e = this.getLastDecision(a.id);
                    r.push({
                        entityId: a.id,
                        newDirection: e || a.direction,
                        newState: a.controller.aiState,
                        skipped: !0,
                    });
                    continue;
                }
                const o = this.createEntityGameState(a, t),
                    l = a.controller.calculateAIDirection(o, i);
                r.push({
                    entityId: a.id,
                    newDirection: l.newDirection,
                    newState: l.newState,
                    skipped: !1,
                });
                const c = this.getDirectionKey(l.newDirection);
                (n.has(c) || n.set(c, []), n.get(c).push(s));
            }
            return (this.resolveDecisionConflicts(r, e, t, i), this.updateDecisionHistory(r), r);
        }
        resolveDecisionConflicts(e, t, i, r) {
            const n = new Map();
            (e.forEach((e, i) => {
                if (e.skipped) return;
                const r = this.getDirectionKey(e.newDirection);
                (n.has(r) || n.set(r, []), n.get(r).push({ decision: e, index: i, entity: t[i] }));
            }),
                n.forEach((e, t) => {
                    e.length > 1 && this.resolveGroupConflict(e, i, r);
                }));
        }
        resolveGroupConflict(e, t, i) {
            const r = { aggressive: 3, defensive: 2, erratic: 1 };
            e.sort((e, t) => {
                const i = r[e.entity.controller.personality] || 0;
                return (r[t.entity.controller.personality] || 0) - i;
            });
            for (let n = 1; n < e.length; n++) {
                const { decision: r, entity: s } = e[n],
                    a = this.findAlternativeDirection(s, r.newDirection, t, i);
                r.newDirection = a;
            }
        }
        findAlternativeDirection(e, t, i, r) {
            const n = e.direction,
                s = [
                    { x: n.z, z: -n.x },
                    { x: -n.z, z: n.x },
                ].filter((e) => !this.directionsEqual(e, t));
            if (0 === s.length) return n;
            const a = this.createEntityGameState(e, i),
                o = e.controller.runDefensiveCheck(a);
            if (1 === s.length) return s[0];
            const l = { x: n.z, z: -n.x },
                c = { x: -n.z, z: n.x };
            return this.directionsEqual(s[0], l)
                ? o.left >= o.right
                    ? l
                    : c
                : o.right >= o.left
                  ? c
                  : l;
        }
        createEntityGameState(e, t) {
            return __spreadProps(__spreadValues({}, t), {
                ai: e,
                aiDirection: e.direction,
                aiTrail: e.trail,
                playerTrail: t.playerTrail || [],
                aiOpponents: t.aiOpponents || [],
            });
        }
        getOtherAITrails(e, t) {
            const i = [];
            return (
                t.forEach((t) => {
                    t.id !== e && t.alive && t.trail && i.push(...t.trail);
                }),
                i
            );
        }
        shouldSkipFrame(e) {
            return !!this.staggeredTiming && (this.frameOffset + e) % 2 == 1;
        }
        updateFrameOffset() {
            this.frameOffset = (this.frameOffset + 1) % 2;
        }
        getLastDecision(e) {
            return this.recentDecisions.get(e) || null;
        }
        updateDecisionHistory(e) {
            (e.forEach((e) => {
                this.recentDecisions.set(e.entityId, e.newDirection);
            }),
                this.decisionHistory.push({
                    frame: Date.now(),
                    decisions: e.map((e) => ({
                        entityId: e.entityId,
                        direction: this.getDirectionKey(e.newDirection),
                    })),
                }),
                this.decisionHistory.length > this.maxHistorySize && this.decisionHistory.shift());
        }
        getDirectionKey(e) {
            return `${e.x},${e.z}`;
        }
        directionsEqual(e, t) {
            return e.x === t.x && e.z === t.z;
        }
        setStaggeredTiming(e) {
            this.staggeredTiming = e;
        }
        getCoordinationStats() {
            return {
                recentConflicts: this.decisionHistory.slice(-5).reduce((e, t) => {
                    const i = t.decisions.map((e) => e.direction),
                        r = new Set(i);
                    return e + (i.length - r.size);
                }, 0),
                historySize: this.decisionHistory.length,
                staggeredTiming: this.staggeredTiming,
                trackedEntities: this.recentDecisions.size,
            };
        }
    };
module$10.exports = { AIController: AIController$1, AICoordinator: AICoordinator$2 };
const __CJS__export_default__$$ =
        (null == module$10.exports ? {} : module$10.exports).default || module$10.exports,
    __CJS__import__2__$4 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$$ },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$$ = { exports: {} };
let CollisionDetectionEngine$3 = class {
    constructor() {
        ((this.logger = (__CJS__export_default__$1a || __CJS__import__50__).createLogger(
            'CollisionDetectionEngine'
        )),
            (this.powerUpManager = null),
            (this.cameraEffectsManager = null));
    }
    setPowerUpManager(e) {
        this.powerUpManager = e;
    }
    setCameraEffectsManager(e) {
        this.cameraEffectsManager = e;
    }
    checkCollisions(e, t = null) {
        if (e.frameCount < 10) return { playerCollided: !1, aiCollided: !1, winner: null };
        if (e.isPaused) return { playerCollided: !1, aiCollided: !1, winner: null };
        if (e.aiOpponents && e.aiOpponents.length > 0) return this.checkAllCollisions(e, t);
        const { player: i, ai: r, playerTrail: n, aiTrail: s, bounds: a } = e,
            o = t ? t.getBounds() : null,
            l = !!t && t.isGracePeriodActive(),
            c = this.isCollidedWithPowerUps('player', i, n, s, a, o, l),
            d = this.isCollidedWithPowerUps('ai', r, s, n, a, o, l);
        let h = null;
        return (
            c && !d ? (h = 'ai') : d && !c ? (h = 'player') : c && d && (h = 'tie'),
            { playerCollided: c, aiCollided: d, winner: h }
        );
    }
    checkAllCollisions(e, t = null) {
        const { player: i, playerTrail: r, aiOpponents: n, bounds: s } = e,
            a = [],
            o = t ? t.getBounds() : null,
            l = !!t && t.isGracePeriodActive(),
            c = [...r];
        n.forEach((e) => {
            e.alive && e.trail && c.push(...e.trail);
        });
        (this.checkEntityCollision('player', i, r, this.getOtherTrails('player', e), s, o, l) &&
            a.push('player'),
            n.forEach((t) => {
                if (!t.alive) return;
                this.checkEntityCollision(
                    t.id,
                    t,
                    t.trail,
                    this.getOtherTrails(t.id, e),
                    s,
                    o,
                    l
                ) && a.push(t.id);
            }));
        let d = null;
        const h = this.getSurvivingEntities(e, a);
        return (
            1 === h.length ? (d = h[0]) : 0 === h.length && (d = 'tie'),
            {
                playerCollided: a.includes('player'),
                aiCollided: a.some((e) => e.startsWith('ai_')),
                crashedEntities: a,
                survivingEntities: h,
                winner: d,
            }
        );
    }
    checkEntityCollision(e, t, i, r, n, s = null, a = !1) {
        return this.isCollidedWithPowerUps(e, t, i, r, n, s, a);
    }
    getOtherTrails(e, t) {
        const i = [];
        return (
            'player' !== e && t.playerTrail && i.push(...t.playerTrail),
            t.aiOpponents &&
                t.aiOpponents.forEach((t) => {
                    t.id !== e && t.alive && t.trail && i.push(...t.trail);
                }),
            i
        );
    }
    getSurvivingEntities(e, t) {
        const i = [];
        return (
            t.includes('player') || i.push('player'),
            e.aiOpponents &&
                e.aiOpponents.forEach((e) => {
                    e.alive && !t.includes(e.id) && i.push(e.id);
                }),
            i
        );
    }
    isCollidedWithPowerUps(e, t, i, r, n, s = null, a = !1) {
        const o = !!this.powerUpManager && this.powerUpManager.hasShieldProtection(e),
            l = !!this.powerUpManager && this.powerUpManager.isInGhostMode(e),
            c = this.checkBoundaryCollision(t, n, s);
        if ((c || this.checkBoundaryNearMiss(t, n, s, e), c))
            return s && this.handleBoundaryEdgeCase(t, s, a)
                ? (this.logger.debug(
                      `Edge case handling for ${e} - player on boundary during grace period`
                  ),
                  !1)
                : s && a
                  ? (this.logger.debug(`Grace period active for ${e} - boundary collision ignored`),
                    !1)
                  : !o ||
                    (this.powerUpManager.consumeShield(e),
                    this.logger.debug(`Shield consumed for ${e} - boundary collision prevented`),
                    !1);
        if (l) this.logger.debug(`${e} in Ghost Mode - trail collisions ignored`);
        else {
            if (i.length > 5)
                for (let r = 0; r < i.length - 5; r++) {
                    const a = i[r];
                    if (a && 'number' == typeof a.x && 'number' == typeof a.z) {
                        if (s && !this.isWithinBounds(a, n, s)) continue;
                        const i = Math.sqrt(Math.pow(t.x - a.x, 2) + Math.pow(t.z - a.z, 2));
                        if (i < 0.1)
                            return (
                                !o ||
                                (this.powerUpManager.consumeShield(e),
                                this.logger.debug(
                                    `Shield consumed for ${e} - self-trail collision prevented`
                                ),
                                !1)
                            );
                        i <= 1 && this.triggerNearMiss(t, i, e);
                    }
                }
            for (const i of r)
                if (i && 'number' == typeof i.x && 'number' == typeof i.z) {
                    if (s && !this.isWithinBounds(i, n, s)) continue;
                    const r = Math.sqrt(Math.pow(t.x - i.x, 2) + Math.pow(t.z - i.z, 2));
                    if (r < 0.1)
                        return (
                            !o ||
                            (this.powerUpManager.consumeShield(e),
                            this.logger.debug(
                                `Shield consumed for ${e} - opponent trail collision prevented`
                            ),
                            !1)
                        );
                    r <= 1 && this.triggerNearMiss(t, r, e);
                }
        }
        return !1;
    }
    checkBoundaryCollision(e, t, i = null) {
        return i
            ? e.x <= i.minX || e.x >= i.maxX || e.z <= i.minZ || e.z >= i.maxZ
            : e.x <= -t || e.x >= t || e.z <= -t || e.z >= t;
    }
    isWithinBounds(e, t, i = null) {
        return !this.checkBoundaryCollision(e, t, i);
    }
    validateCollisionAccuracy(e, t, i, r = null) {
        const n = {
            bikeWithinBounds: this.isWithinBounds(e, i, r),
            validTrailSegments: 0,
            invalidTrailSegments: 0,
            collisionTolerance: 0.1,
        };
        for (const s of t)
            s &&
                'number' == typeof s.x &&
                'number' == typeof s.z &&
                (this.isWithinBounds(s, i, r) ? n.validTrailSegments++ : n.invalidTrailSegments++);
        return n;
    }
    handleBoundaryEdgeCase(e, t, i) {
        if (!t) return !1;
        const r = 0.1;
        return (
            (Math.abs(e.x - t.minX) < r ||
                Math.abs(e.x - t.maxX) < r ||
                Math.abs(e.z - t.minZ) < r ||
                Math.abs(e.z - t.maxZ) < r) &&
            i
        );
    }
    checkBoundaryNearMiss(e, t, i = null, r) {
        if (!this.cameraEffectsManager || !this.cameraEffectsManager.isEnabled()) return;
        let n = 1 / 0;
        if (i) {
            const t = [
                Math.abs(e.x - i.minX),
                Math.abs(e.x - i.maxX),
                Math.abs(e.z - i.minZ),
                Math.abs(e.z - i.maxZ),
            ];
            n = Math.min(...t);
        } else {
            const i = [
                Math.abs(e.x - -t),
                Math.abs(e.x - t),
                Math.abs(e.z - -t),
                Math.abs(e.z - t),
            ];
            n = Math.min(...i);
        }
        n <= 1 && this.triggerNearMiss(e, n, r);
    }
    triggerNearMiss(e, t, i) {
        this.cameraEffectsManager &&
            this.cameraEffectsManager.isEnabled() &&
            'player' === i &&
            this.cameraEffectsManager.onNearMiss(e, t);
    }
    isCollided(e, t, i, r) {
        if (this.checkBoundaryCollision(e, r)) return !0;
        const n = 0.1;
        if (t.length > 5)
            for (let s = 0; s < t.length - 5; s++) {
                const i = t[s];
                if (
                    i &&
                    'number' == typeof i.x &&
                    'number' == typeof i.z &&
                    Math.abs(e.x - i.x) < n &&
                    Math.abs(e.z - i.z) < n
                )
                    return !0;
            }
        for (const s of i)
            if (
                s &&
                'number' == typeof s.x &&
                'number' == typeof s.z &&
                Math.abs(e.x - s.x) < n &&
                Math.abs(e.z - s.z) < n
            )
                return !0;
        return !1;
    }
};
module$$.exports = { CollisionDetectionEngine: CollisionDetectionEngine$3 };
const __CJS__export_default__$_ =
        (null == module$$.exports ? {} : module$$.exports).default || module$$.exports,
    __CJS__import__3__$2 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$_ },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$_ = { exports: {} };
const { CollisionDetectionEngine: CollisionDetectionEngine$2 } =
        __CJS__export_default__$_ || __CJS__import__3__$2,
    { Logger: Logger$e } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$w = Logger$e.create('PlayerCollisionHandler');
let PlayerCollisionHandler$2 = class extends CollisionDetectionEngine$2 {
    constructor() {
        (super(), (this.collisionTolerance = 0.1), (this.excludeRecentSegments = 5));
    }
    checkMultiplayerCollisions(e, t = null) {
        if (e.frameCount < 10)
            return { player1Collided: !1, player2Collided: !1, winner: null, collisionType: null };
        if (e.isPaused)
            return { player1Collided: !1, player2Collided: !1, winner: null, collisionType: null };
        const { player1: i, player2: r, bounds: n } = e;
        if (!i || !r)
            return {
                player1Collided: !1,
                player2Collided: !1,
                winner: null,
                collisionType: 'invalid_state',
            };
        const s = t && 'function' == typeof t.getBounds ? t.getBounds() : null,
            a = !(!t || 'function' != typeof t.isGracePeriodActive) && t.isGracePeriodActive(),
            o = this.checkPlayerCollision('P1', i.position, i.trail, r.trail, n, s, a),
            l = this.checkPlayerCollision('P2', r.position, r.trail, i.trail, n, s, a),
            c = this.checkDirectPlayerCollision(i.position, r.position);
        return this.determineMultiplayerWinner(o, l, c);
    }
    checkPlayerCollision(e, t, i, r, n, s = null, a = !1) {
        return !a && this.isCollidedWithPowerUps(e, t, i, r, n, s, a);
    }
    checkDirectPlayerCollision(e, t) {
        return Math.sqrt(Math.pow(e.x - t.x, 2) + Math.pow(e.z - t.z, 2)) < this.collisionTolerance;
    }
    determineMultiplayerWinner(e, t, i) {
        let r = null,
            n = null;
        return (
            i
                ? ((r = 'tie'), (n = 'direct_collision'))
                : e && t
                  ? ((r = 'tie'), (n = 'simultaneous_crash'))
                  : e && !t
                    ? ((r = 'P2'), (n = 'player1_crash'))
                    : t && !e
                      ? ((r = 'P1'), (n = 'player2_crash'))
                      : (n = 'no_collision'),
            {
                player1Collided: e,
                player2Collided: t,
                winner: r,
                collisionType: n,
                directCollision: i,
            }
        );
    }
    checkPlayerNearMiss(e, t, i = 'P1') {
        const r = Math.sqrt(Math.pow(e.x - t.x, 2) + Math.pow(e.z - t.z, 2));
        if (r > this.collisionTolerance && r <= 1) {
            const n = 'P1' === i ? e : t;
            this.triggerNearMiss(n, r, i);
        }
    }
    validateCollisionTiming(e, t) {
        return { isTie: !0, timeDifference: 0, winner: null };
    }
    getCollisionStats(e) {
        if (!e.player1 || !e.player2) return { valid: !1, reason: 'missing_players' };
        return {
            valid: !0,
            player1: this.validateCollisionAccuracy(
                e.player1.position,
                e.player1.trail,
                e.bounds,
                e.dynamicBounds
            ),
            player2: this.validateCollisionAccuracy(
                e.player2.position,
                e.player2.trail,
                e.bounds,
                e.dynamicBounds
            ),
            playerDistance: Math.sqrt(
                Math.pow(e.player1.position.x - e.player2.position.x, 2) +
                    Math.pow(e.player1.position.z - e.player2.position.z, 2)
            ),
            collisionTolerance: this.collisionTolerance,
            excludeRecentSegments: this.excludeRecentSegments,
            frameCount: e.frameCount,
            gracePeriodActive: e.frameCount < 10,
        };
    }
    handleMultiplayerPowerUpCollision(e, t) {
        if (!this.powerUpManager) return !1;
        const i = this.powerUpManager.hasShieldProtection(e);
        return !this.powerUpManager.isInGhostMode(e) ||
            ('trail_collision' !== t && 'direct_collision' !== t)
            ? !!i &&
                  (this.powerUpManager.consumeShield(e),
                  logger$w.debug(`Shield consumed for ${e} - ${t} prevented`),
                  !0)
            : (logger$w.debug(`${e} in Ghost Mode - ${t} ignored`), !0);
    }
};
module$_.exports = { PlayerCollisionHandler: PlayerCollisionHandler$2 };
const __CJS__export_default__$Z =
        (null == module$_.exports ? {} : module$_.exports).default || module$_.exports,
    __CJS__import__4__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$Z },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$Z = { exports: {} };
let DualControlScheme$3 = class {
    constructor() {
        ((this.player1Controls = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
        }),
            (this.player2Controls = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }),
            (this.activeKeys = new Set()),
            (this.player1State = {
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0,
            }),
            (this.player2State = {
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0,
            }),
            (this.directionMappings = {
                ArrowUp: { x: 0, y: 0, z: -1 },
                ArrowDown: { x: 0, y: 0, z: 1 },
                ArrowLeft: { x: -1, y: 0, z: 0 },
                ArrowRight: { x: 1, y: 0, z: 0 },
                KeyW: { x: 0, y: 0, z: -1 },
                KeyS: { x: 0, y: 0, z: 1 },
                KeyA: { x: -1, y: 0, z: 0 },
                KeyD: { x: 1, y: 0, z: 0 },
            }));
    }
    handleKeyDown(e) {
        const t = e.code || e.key,
            i = Date.now();
        this.activeKeys.add(t);
        const r = this.getPlayerIdForKey(t);
        if (!r) return { playerId: null, directionChanged: !1, key: t };
        const n = this.directionMappings[t];
        if (!n) return { playerId: r, directionChanged: !1, key: t };
        const s = 'P1' === r ? this.player1State : this.player2State;
        return (
            (s.pendingDirection = n),
            (s.lastInputTime = i),
            { playerId: r, directionChanged: !0, key: t, newDirection: n, timestamp: i }
        );
    }
    handleKeyUp(e) {
        const t = e.code || e.key;
        this.activeKeys.delete(t);
    }
    getPlayerIdForKey(e) {
        return Object.values(this.player1Controls).includes(e)
            ? 'P1'
            : Object.values(this.player2Controls).includes(e)
              ? 'P2'
              : null;
    }
    getPlayerDirections() {
        return {
            player1: this.player1State.activeDirection,
            player2: this.player2State.activeDirection,
        };
    }
    validateDirectionChange(e, t, i) {
        if (!t || !i) return !0;
        return !(t.x === -i.x && t.y === -i.y && t.z === -i.z);
    }
    preventConflicts() {
        const e = {
                player1: { hasInput: !1, direction: null },
                player2: { hasInput: !1, direction: null },
                simultaneousInput: !1,
            },
            t = null !== this.player1State.pendingDirection,
            i = null !== this.player2State.pendingDirection;
        return (
            (e.simultaneousInput = t && i),
            t &&
                ((e.player1.hasInput = !0),
                (e.player1.direction = this.player1State.pendingDirection),
                (this.player1State.activeDirection = this.player1State.pendingDirection),
                (this.player1State.pendingDirection = null)),
            i &&
                ((e.player2.hasInput = !0),
                (e.player2.direction = this.player2State.pendingDirection),
                (this.player2State.activeDirection = this.player2State.pendingDirection),
                (this.player2State.pendingDirection = null)),
            e
        );
    }
    isKeyPressed(e) {
        return this.activeKeys.has(e);
    }
    getActiveKeys() {
        return new Set(this.activeKeys);
    }
    reset() {
        (this.activeKeys.clear(),
            (this.player1State = {
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0,
            }),
            (this.player2State = {
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0,
            }));
    }
    getInputState() {
        return {
            activeKeys: Array.from(this.activeKeys),
            player1State: __spreadValues({}, this.player1State),
            player2State: __spreadValues({}, this.player2State),
            simultaneousInput:
                null !== this.player1State.pendingDirection &&
                null !== this.player2State.pendingDirection,
        };
    }
};
module$Z.exports = { DualControlScheme: DualControlScheme$3 };
const __CJS__export_default__$Y =
        (null == module$Z.exports ? {} : module$Z.exports).default || module$Z.exports,
    __CJS__import__6__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$Y },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$Y = { exports: {} };
const { DualControlScheme: DualControlScheme$2 } = __CJS__export_default__$Y || __CJS__import__6__,
    { logger: logger$v } = __CJS__export_default__$1a || __CJS__import__50__;
let PlayerController$2 = class {
    constructor(e) {
        ((this.game = e), (this.dualControlScheme = null), (this.isMultiplayerMode = !1));
    }
    init() {
        ((this.handleKeyDown = (e) => {
            if ('p' === e.key || 'Escape' === e.key) {
                e.preventDefault();
                return void (
                    this.game.togglePause() ||
                    logger$v.debug('Pause operation not available in current game state')
                );
            }
            this.isMultiplayerMode && this.dualControlScheme
                ? this.handleMultiplayerInput(e)
                : this.handleSinglePlayerInput(e);
        }),
            (this.handleKeyUp = (e) => {
                this.isMultiplayerMode &&
                    this.dualControlScheme &&
                    this.dualControlScheme.handleKeyUp(e);
            }),
            document.addEventListener('keydown', this.handleKeyDown),
            document.addEventListener('keyup', this.handleKeyUp),
            this.setupUIEventListeners());
    }
    cleanup() {
        (this.handleKeyDown && document.removeEventListener('keydown', this.handleKeyDown),
            this.handleKeyUp && document.removeEventListener('keyup', this.handleKeyUp));
    }
    handleSinglePlayerInput(e) {
        this.game.changePlayerDirection(e.key) &&
            window.audioManager &&
            window.audioManager.playTurnSound();
    }
    handleMultiplayerInput(e) {
        const t = this.dualControlScheme.handleKeyDown(e);
        if (t.playerId && t.directionChanged) {
            const e = this.game.getPlayerDirection(t.playerId);
            if (this.dualControlScheme.validateDirectionChange(t.playerId, e, t.newDirection)) {
                this.game.changePlayerDirection(t.playerId, t.key) &&
                    window.audioManager &&
                    window.audioManager.playTurnSound();
            }
        }
    }
    enableMultiplayerMode() {
        ((this.isMultiplayerMode = !0), (this.dualControlScheme = new DualControlScheme$2()));
    }
    disableMultiplayerMode() {
        ((this.isMultiplayerMode = !1),
            this.dualControlScheme &&
                (this.dualControlScheme.reset(), (this.dualControlScheme = null)));
    }
    getDualControlScheme() {
        return this.dualControlScheme;
    }
    isInMultiplayerMode() {
        return this.isMultiplayerMode;
    }
    setupUIEventListeners() {
        setTimeout(() => {
            const e = document.getElementById('resumeButton');
            e &&
                (e.addEventListener('click', (e) => {
                    (e.preventDefault(), e.stopPropagation());
                    this.game.resume() ||
                        logger$v.debug('Resume operation not available in current game state');
                }),
                e.addEventListener('touchstart', (e) => {
                    (e.preventDefault(), e.stopPropagation());
                    this.game.resume() ||
                        logger$v.debug('Resume operation not available in current game state');
                }));
        }, 0);
    }
};
module$Y.exports = { PlayerController: PlayerController$2 };
const __CJS__export_default__$X =
        (null == module$Y.exports ? {} : module$Y.exports).default || module$Y.exports,
    __CJS__import__5__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$X },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$X = { exports: {} };
class ThemeEngine {
    constructor(e, t, i = null) {
        ((this.scene = e),
            (this.renderer = t),
            (this.currentTheme = 'classic-grid'),
            (this.performanceOptimizer = i),
            (this.themeConfigs = {
                'classic-grid': {
                    name: 'Classic Grid',
                    grid: { color: 65535, opacity: 0.3 },
                    background: { type: 'gradient', colors: [51, 102] },
                    lighting: {
                        ambient: { color: 16777215, intensity: 0.6 },
                        directional: { color: 16777215, intensity: 0.8 },
                    },
                },
                'neon-city': {
                    name: 'Neon City',
                    grid: { color: 16716947, opacity: 0.5, glow: !0 },
                    background: { type: 'gradient', colors: [1703987, 3342438] },
                    lighting: {
                        ambient: { color: 16716947, intensity: 0.4 },
                        directional: { color: 16738740, intensity: 0.6 },
                    },
                },
                space: {
                    name: 'Space',
                    grid: { color: 6710886, opacity: 0.2 },
                    background: { type: 'starfield', colors: [0, 17] },
                    lighting: {
                        ambient: { color: 4474111, intensity: 0.3 },
                        directional: { color: 6711039, intensity: 0.5 },
                    },
                },
                'tron-legacy': {
                    name: 'Tron Legacy',
                    grid: { color: 16753920, opacity: 0.4, glow: !0 },
                    background: { type: 'circuit', colors: [0, 4386] },
                    lighting: {
                        ambient: { color: 16753920, intensity: 0.4 },
                        directional: { color: 16758861, intensity: 0.6 },
                    },
                },
            }),
            (this.themeElements = {
                gridHelper: null,
                boxHelper: null,
                ambientLight: null,
                directionalLight: null,
                backgroundElements: [],
            }));
    }
    loadTheme(e) {
        if (!this.isValidTheme(e)) return !1;
        const t = this.themeConfigs[e];
        try {
            return (
                this.cleanupCurrentTheme(),
                this.updateGridMaterial(t),
                this.updateBackground(t),
                this.updateLighting(t),
                (this.currentTheme = e),
                !0
            );
        } catch (i) {
            return ('classic-grid' !== e && this.loadTheme('classic-grid'), !1);
        }
    }
    isValidTheme(e) {
        return this.themeConfigs.hasOwnProperty(e);
    }
    getAvailableThemes() {
        return Object.keys(this.themeConfigs);
    }
    getThemeConfig(e) {
        return this.themeConfigs[e] || null;
    }
    generateThemePreview(e) {
        const t = this.getThemeConfig(e);
        return t
            ? {
                  name: t.name,
                  gridColor: `#${t.grid.color.toString(16).padStart(6, '0')}`,
                  backgroundColor: `#${t.background.colors[0].toString(16).padStart(6, '0')}`,
                  lightingColor: `#${t.lighting.ambient.color.toString(16).padStart(6, '0')}`,
                  hasGlow: t.grid.glow || !1,
              }
            : null;
    }
    updateGridMaterial(e) {
        const t = [];
        (this.scene &&
            'function' == typeof this.scene.traverse &&
            this.scene.traverse((e) => {
                (e.isGridHelper || e.isBoxHelper) && t.push(e);
            }),
            t.length > 0
                ? t.forEach((t) => {
                      t.material &&
                          (t.material.color &&
                              'function' == typeof t.material.color.setHex &&
                              t.material.color.setHex(e.grid.color),
                          (t.material.opacity = e.grid.opacity),
                          (t.material.transparent = e.grid.opacity < 1),
                          e.grid.glow
                              ? (t.material.emissive &&
                                    'function' == typeof t.material.emissive.setHex &&
                                    t.material.emissive.setHex(e.grid.color),
                                (t.material.emissiveIntensity = 0.2))
                              : (t.material.emissive &&
                                    'function' == typeof t.material.emissive.setHex &&
                                    t.material.emissive.setHex(0),
                                (t.material.emissiveIntensity = 0)));
                  })
                : this.createGridElements(e));
    }
    createGridElements(e) {
        const t = new THREE.GridHelper(60, 60);
        (t.material &&
            (t.material.color &&
                'function' == typeof t.material.color.setHex &&
                t.material.color.setHex(e.grid.color),
            (t.material.opacity = e.grid.opacity),
            (t.material.transparent = !0),
            e.grid.glow &&
                (t.material.emissive &&
                    'function' == typeof t.material.emissive.setHex &&
                    t.material.emissive.setHex(e.grid.color),
                (t.material.emissiveIntensity = 0.2))),
            this.scene && 'function' == typeof this.scene.add && this.scene.add(t),
            (this.themeElements.gridHelper = t));
        const i = this.performanceOptimizer
                ? this.performanceOptimizer.getSharedGeometry('bike')
                : new THREE.BoxGeometry(60, 1, 60),
            r = this.performanceOptimizer
                ? this.performanceOptimizer.getOrCreateThemeMaterial(this.currentTheme, 'grid', {
                      color: e.grid.color,
                      opacity: e.grid.opacity,
                      transparent: !0,
                  })
                : new THREE.LineBasicMaterial({
                      color: e.grid.color,
                      opacity: e.grid.opacity,
                      transparent: !0,
                  }),
            n = new THREE.BoxHelper(new THREE.Mesh(i));
        ((n.material = r),
            this.scene && 'function' == typeof this.scene.add && this.scene.add(n),
            (this.themeElements.boxHelper = n));
    }
    updateBackground(e) {
        const t = e.background;
        switch (t.type) {
            case 'gradient':
                this.createGradientBackground(t.colors);
                break;
            case 'starfield':
                this.createStarfieldBackground(t.colors);
                break;
            case 'circuit':
                this.createCircuitBackground(t.colors);
                break;
            default:
                this.createSolidBackground(t.colors[0]);
        }
    }
    createGradientBackground(e) {
        const t = new THREE.Color(e[0]);
        this.scene.background = t;
    }
    createStarfieldBackground(e) {
        const t = new THREE.BufferGeometry(),
            i = new Float32Array(3e3);
        for (let s = 0; s < 3e3; s += 3)
            ((i[s] = 2e3 * (Math.random() - 0.5)),
                (i[s + 1] = 2e3 * (Math.random() - 0.5)),
                (i[s + 2] = 2e3 * (Math.random() - 0.5)));
        t.setAttribute('position', new THREE.BufferAttribute(i, 3));
        const r = new THREE.PointsMaterial({
                color: 16777215,
                size: 2,
                transparent: !0,
                opacity: 0.8,
            }),
            n = new THREE.Points(t, r);
        (this.scene && 'function' == typeof this.scene.add && this.scene.add(n),
            this.themeElements.backgroundElements.push(n),
            (this.scene.background = new THREE.Color(e[0])));
    }
    createCircuitBackground(e) {
        const t = new THREE.BufferGeometry(),
            i = [];
        for (let s = 0; s < 50; s++) {
            const e = 100 * (Math.random() - 0.5),
                t = 100 * (Math.random() - 0.5),
                r = e + 20 * (Math.random() - 0.5),
                n = t + 20 * (Math.random() - 0.5);
            (i.push(e, -5, t), i.push(r, -5, n));
        }
        t.setAttribute('position', new THREE.Float32BufferAttribute(i, 3));
        const r = new THREE.LineBasicMaterial({ color: 13158, opacity: 0.3, transparent: !0 }),
            n = new THREE.LineSegments(t, r);
        (this.scene && 'function' == typeof this.scene.add && this.scene.add(n),
            this.themeElements.backgroundElements.push(n),
            (this.scene.background = new THREE.Color(e[0])));
    }
    createSolidBackground(e) {
        this.scene.background = new THREE.Color(e);
    }
    updateLighting(e) {
        const t = e.lighting;
        let i = null,
            r = null;
        (this.scene &&
            'function' == typeof this.scene.traverse &&
            this.scene.traverse((e) => {
                e.isAmbientLight ? (i = e) : e.isDirectionalLight && (r = e);
            }),
            i
                ? (i.color &&
                      'function' == typeof i.color.setHex &&
                      i.color.setHex(t.ambient.color),
                  (i.intensity = t.ambient.intensity))
                : ((i = new THREE.AmbientLight(t.ambient.color, t.ambient.intensity)),
                  this.scene && 'function' == typeof this.scene.add && this.scene.add(i)),
            (this.themeElements.ambientLight = i),
            r
                ? (r.color &&
                      'function' == typeof r.color.setHex &&
                      r.color.setHex(t.directional.color),
                  (r.intensity = t.directional.intensity))
                : ((r = new THREE.DirectionalLight(t.directional.color, t.directional.intensity)),
                  r.position && 'function' == typeof r.position.set && r.position.set(10, 20, 10),
                  this.scene && 'function' == typeof this.scene.add && this.scene.add(r)),
            (this.themeElements.directionalLight = r));
    }
    cleanupCurrentTheme() {
        (this.themeElements.backgroundElements.forEach((e) => {
            (this.scene && 'function' == typeof this.scene.remove && this.scene.remove(e),
                e.geometry && e.geometry.dispose(),
                e.material && e.material.dispose());
        }),
            (this.themeElements.backgroundElements = []));
    }
    getCurrentTheme() {
        return this.currentTheme;
    }
    resetToDefault() {
        this.loadTheme('classic-grid');
    }
}
module$X.exports = { ThemeEngine: ThemeEngine };
const __CJS__export_default__$W =
        (null == module$X.exports ? {} : module$X.exports).default || module$X.exports,
    __CJS__import__2__$3 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$W },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$W = { exports: {} };
class EmissiveMaterialSystem {
    constructor() {
        ((this.materials = new Map()),
            (this.pulseState = {
                time: 0,
                intensity: 1,
                paused: !1,
                period: 2.5,
                minIntensity: 0.8,
                maxIntensity: 1,
            }),
            (this.baseIntensities = { bike: 0.8, trail: 0.6 }),
            (this.globalIntensityMultiplier = 1),
            (this.disposedMaterials = new Set()));
    }
    createBikeMaterial(e, t) {
        this.disposeMaterial(e);
        const i = new THREE.MeshLambertMaterial({
            color: t,
            emissive: t,
            emissiveIntensity: this.baseIntensities.bike * this.globalIntensityMultiplier,
            transparent: !1,
        });
        return (
            this.materials.set(e, {
                material: i,
                type: 'bike',
                baseIntensity: this.baseIntensities.bike,
                color: t,
            }),
            i
        );
    }
    createTrailMaterial(e, t) {
        this.disposeMaterial(e);
        const i = new THREE.MeshBasicMaterial({
            color: t,
            emissive: t,
            emissiveIntensity: this.baseIntensities.trail * this.globalIntensityMultiplier,
            transparent: !0,
            opacity: 0.8,
        });
        return (
            this.materials.set(e, {
                material: i,
                type: 'trail',
                baseIntensity: this.baseIntensities.trail,
                color: t,
            }),
            i
        );
    }
    updatePulseAnimation(e) {
        if (this.pulseState.paused) return;
        this.pulseState.time += e;
        const t = (this.pulseState.time % this.pulseState.period) / this.pulseState.period,
            i = this.pulseState.maxIntensity - this.pulseState.minIntensity;
        ((this.pulseState.intensity =
            this.pulseState.minIntensity + i * (0.5 * Math.sin(t * Math.PI * 2) + 0.5)),
            this.materials.forEach((e, t) => {
                if (!this.disposedMaterials.has(t)) {
                    const t =
                        e.baseIntensity *
                        this.globalIntensityMultiplier *
                        this.pulseState.intensity;
                    e.material.emissiveIntensity = t;
                }
            }));
    }
    pausePulse() {
        this.pulseState.paused = !0;
    }
    resumePulse() {
        this.pulseState.paused = !1;
    }
    setGlobalIntensityMultiplier(e) {
        ((this.globalIntensityMultiplier = Math.max(0, e)),
            this.materials.forEach((e, t) => {
                if (!this.disposedMaterials.has(t)) {
                    const t =
                        e.baseIntensity *
                        this.globalIntensityMultiplier *
                        this.pulseState.intensity;
                    e.material.emissiveIntensity = t;
                }
            }));
    }
    getMaterial(e) {
        const t = this.materials.get(e);
        return t ? t.material : null;
    }
    disposeMaterial(e) {
        const t = this.materials.get(e);
        t &&
            (t.material && t.material.dispose && t.material.dispose(),
            this.materials.delete(e),
            this.disposedMaterials.add(e));
    }
    getPulseState() {
        return {
            time: this.pulseState.time,
            intensity: this.pulseState.intensity,
            paused: this.pulseState.paused,
            cycleProgress: (this.pulseState.time % this.pulseState.period) / this.pulseState.period,
        };
    }
    resetPulseTimer() {
        ((this.pulseState.time = 0), (this.pulseState.intensity = 1));
    }
    getMaterialCounts() {
        const e = { bike: 0, trail: 0, total: 0 };
        return (
            this.materials.forEach((t, i) => {
                this.disposedMaterials.has(i) || (e[t.type]++, e.total++);
            }),
            e
        );
    }
    updateMaterialColor(e, t) {
        const i = this.materials.get(e);
        i &&
            !this.disposedMaterials.has(e) &&
            (i.material.color.setHex(t), i.material.emissive.setHex(t), (i.color = t));
    }
    updateBikeMaterial(e, t) {
        this.updateMaterialColor(e, t);
    }
    updateTrailMaterialTemplate(e, t) {
        (this.trailTemplates || (this.trailTemplates = new Map()), this.trailTemplates.set(e, t));
    }
    getTrailColorTemplate(e) {
        return this.trailTemplates && this.trailTemplates.has(e)
            ? this.trailTemplates.get(e)
            : 65280;
    }
    dispose() {
        (this.materials.forEach((e, t) => {
            e.material && e.material.dispose && e.material.dispose();
        }),
            this.materials.clear(),
            this.disposedMaterials.clear(),
            (this.pulseState.time = 0),
            (this.pulseState.intensity = 1),
            (this.pulseState.paused = !1));
    }
    getStatus() {
        const e = this.getMaterialCounts();
        return {
            materialCount: e.total,
            bikeMaterials: e.bike,
            trailMaterials: e.trail,
            pulseIntensity: this.pulseState.intensity,
            pulsePaused: this.pulseState.paused,
            globalMultiplier: this.globalIntensityMultiplier,
            disposedCount: this.disposedMaterials.size,
        };
    }
}
module$W.exports = { EmissiveMaterialSystem: EmissiveMaterialSystem };
const __CJS__export_default__$V =
        (null == module$W.exports ? {} : module$W.exports).default || module$W.exports,
    __CJS__import__5__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$V },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$V = { exports: {} };
const { logger: logger$u } = __CJS__export_default__$1a || __CJS__import__50__;
class TrailStyleRenderer {
    constructor(e, t, i = null) {
        ((this.scene = e),
            (this.emissiveMaterialSystem = t),
            (this.performanceOptimizer = i),
            (this.styleConfigs = {
                solid: { opacity: 0.8, segments: 'continuous', effects: [], renderAllSegments: !0 },
                dashed: {
                    opacity: 0.8,
                    segments: 'alternating',
                    effects: [],
                    renderAllSegments: !1,
                    dashPattern: 2,
                },
                glowing: {
                    opacity: 0.9,
                    segments: 'continuous',
                    effects: ['emissive', 'bloom'],
                    renderAllSegments: !0,
                    emissiveIntensity: 0.5,
                },
                rainbow: {
                    opacity: 0.8,
                    segments: 'continuous',
                    effects: ['color-cycle'],
                    renderAllSegments: !0,
                    colorCycleSpeed: 0.5,
                },
            }),
            (this.playerTrailStyles = new Map()),
            (this.rainbowTime = 0),
            (this.rainbowColors = [
                16711680, 16744448, 16776960, 8453888, 65280, 65408, 65535, 33023, 255, 8388863,
                16711935, 16711808,
            ]));
    }
    setTrailStyle(e, t) {
        return this.styleConfigs[t]
            ? (this.playerTrailStyles.set(e, t), !0)
            : (logger$u.warn(`Invalid trail style: ${t}`), !1);
    }
    getTrailStyle(e) {
        return this.playerTrailStyles.get(e) || 'solid';
    }
    createStyledTrailSegment(e, t, i, r) {
        const n = this.getTrailStyle(r),
            s = this.styleConfigs[n];
        if (!this.shouldRenderSegment(i.length, s)) return null;
        const a = this.performanceOptimizer
                ? this.performanceOptimizer.getSharedGeometry('trailSegment')
                : new THREE.BoxGeometry(0.1, 0.5, 0.5),
            o = this.calculateSegmentColor(t, n, i.length),
            l = this.createStyledMaterial(o, s, r, i.length),
            c = new THREE.Mesh(a, l);
        ((c.position.x = e.x), (c.position.z = e.z), (c.position.y = e.y || 0));
        const d = `trail_${r}_${e.x}_${e.z}_${Date.now()}`;
        return (
            (c.userData = {
                materialId: d,
                playerId: r,
                style: n,
                segmentIndex: i.length,
                baseColor: t,
            }),
            this.scene.add(c),
            c
        );
    }
    shouldRenderSegment(e, t) {
        return (
            !!t.renderAllSegments ||
            'alternating' !== t.segments ||
            !t.dashPattern ||
            e % t.dashPattern === 0
        );
    }
    calculateSegmentColor(e, t, i) {
        return 'rainbow' === t ? this.calculateRainbowColor(i) : e;
    }
    calculateRainbowColor(e) {
        const t = this.styleConfigs.rainbow,
            i = Math.floor((e * t.colorCycleSpeed) % this.rainbowColors.length);
        return this.rainbowColors[i];
    }
    createStyledMaterial(e, t, i, r) {
        const n = `trail_${i}_${r}_${Date.now()}`,
            s = this.getTrailStyle(i);
        if (this.performanceOptimizer)
            return this.performanceOptimizer.getOrCreateTrailMaterial(e, s, {
                opacity: t.opacity,
                emissiveIntensity: t.emissiveIntensity,
                transparent: !0,
            });
        if (t.effects.includes('emissive') || t.effects.includes('bloom')) {
            const i = this.emissiveMaterialSystem.createTrailMaterial(n, e);
            return (
                void 0 !== t.emissiveIntensity && (i.emissiveIntensity = t.emissiveIntensity),
                (i.transparent = !0),
                (i.opacity = t.opacity),
                i
            );
        }
        return new THREE.MeshLambertMaterial({ color: e, transparent: !0, opacity: t.opacity });
    }
    updateRainbowTrails(e) {
        ((this.rainbowTime += e),
            this.scene.traverse((e) => {
                if (e.userData && 'rainbow' === e.userData.style) {
                    const t = e.userData.segmentIndex,
                        i = this.calculateRainbowColor(t + 10 * this.rainbowTime);
                    e.material.color.setHex(i);
                }
            }));
    }
    updateTrailEffects(e) {
        this.updateRainbowTrails(e);
    }
    clearPlayerTrails(e) {
        const t = [];
        (this.scene.traverse((i) => {
            i.userData && i.userData.playerId === e && t.push(i);
        }),
            t.forEach((e) => {
                (this.scene.remove(e),
                    e.material &&
                        (e.userData.materialId && this.emissiveMaterialSystem
                            ? this.emissiveMaterialSystem.disposeMaterial(e.userData.materialId)
                            : e.material.dispose()),
                    e.geometry && e.geometry.dispose());
            }));
    }
    clearAllTrails() {
        const e = [];
        (this.scene.traverse((t) => {
            t.userData &&
                t.userData.materialId &&
                t.userData.materialId.startsWith('trail_') &&
                e.push(t);
        }),
            e.forEach((e) => {
                (this.scene.remove(e),
                    e.material &&
                        (e.userData.materialId && this.emissiveMaterialSystem
                            ? this.emissiveMaterialSystem.disposeMaterial(e.userData.materialId)
                            : e.material.dispose()),
                    e.geometry && e.geometry.dispose());
            }));
    }
    getAvailableStyles() {
        return Object.keys(this.styleConfigs);
    }
    getStyleConfig(e) {
        return this.styleConfigs[e] || null;
    }
    isValidStyle(e) {
        return this.styleConfigs.hasOwnProperty(e);
    }
}
module$V.exports = { TrailStyleRenderer: TrailStyleRenderer };
const __CJS__export_default__$U =
        (null == module$V.exports ? {} : module$V.exports).default || module$V.exports,
    __CJS__import__2__$2 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$U },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$U = { exports: {} };
let SplitScreenCamera$2 = class {
    constructor(e, t = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 }) {
        ((this.camera = e),
            (this.players = []),
            (this.arenaBounds = t),
            (this.minZoom = 20),
            (this.maxZoom = 50),
            (this.baseHeight = 20),
            (this.baseDistance = 15),
            (this.smoothingFactor = 0.1),
            (this.targetPosition = { x: 0, y: this.baseHeight, z: this.baseDistance }),
            (this.targetLookAt = { x: 0, y: 0, z: 0 }),
            (this.maxPlayerDistance = 30),
            (this.boundaryPadding = 5),
            (this.originalPosition = e.position.clone()));
    }
    setPlayers(e) {
        this.players = e.filter((e) => e && e.isAlive);
    }
    update(e = { x: 0, y: 0, z: 0 }, t = null) {
        0 !== this.players.length &&
            (t && t.currentBounds && this.handleArenaShrinking(t.currentBounds),
            1 === this.players.length
                ? (this.updateSinglePlayerCamera(this.players[0], e),
                  this.handlePlayerElimination())
                : 2 === this.players.length
                  ? (this.updateSplitScreenCamera(this.players[0], this.players[1], e),
                    this.handleOppositeCornerCase(),
                    this.handlePlayersCloseProximity())
                  : this.updateMultiPlayerCamera(this.players, e),
            this.handleRapidMovement(),
            this.handleCameraBoundaryCollision(),
            this.applySmoothMovement(e));
    }
    updateSinglePlayerCamera(e, t) {
        const i = this.getPlayerPosition(e);
        ((this.targetPosition = { x: i.x, y: this.baseHeight, z: i.z + this.baseDistance }),
            (this.targetLookAt = { x: i.x, y: 0, z: i.z }));
    }
    updateSplitScreenCamera(e, t, i) {
        const r = this.getPlayerPosition(e),
            n = this.getPlayerPosition(t),
            s = this.calculateCenterPoint(r, n),
            a = this.calculateDistance(r, n),
            o = this.calculateOptimalZoom(a),
            l = this.calculateCameraOffset(a);
        ((this.targetPosition = { x: s.x, y: o, z: s.z + l }),
            (this.targetLookAt = { x: s.x, y: 0, z: s.z }),
            this.handleBoundaryConstraints());
    }
    updateMultiPlayerCamera(e, t) {
        const i = this.calculateCenterOfMass(e),
            r = this.calculatePlayerBoundingBox(e),
            n = Math.max(r.maxX - r.minX, r.maxZ - r.minZ),
            s = this.calculateOptimalZoom(n),
            a = this.calculateCameraOffset(n);
        ((this.targetPosition = { x: i.x, y: s, z: i.z + a }),
            (this.targetLookAt = { x: i.x, y: 0, z: i.z }),
            this.handleBoundaryConstraints());
    }
    calculateCenterPoint(e, t) {
        return { x: (e.x + t.x) / 2, z: (e.z + t.z) / 2 };
    }
    calculateDistance(e, t) {
        return Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.z - e.z, 2));
    }
    calculateOptimalZoom(e) {
        const t = Math.min(e / this.maxPlayerDistance, 1),
            i = this.maxZoom - this.minZoom;
        return this.minZoom + t * i;
    }
    calculateCameraOffset(e) {
        const t = 0.3 * e;
        return this.baseDistance + t;
    }
    calculateCenterOfMass(e) {
        let t = 0,
            i = 0;
        for (const r of e) {
            const e = this.getPlayerPosition(r);
            ((t += e.x), (i += e.z));
        }
        return { x: t / e.length, z: i / e.length };
    }
    calculatePlayerBoundingBox(e) {
        let t = 1 / 0,
            i = -1 / 0,
            r = 1 / 0,
            n = -1 / 0;
        for (const s of e) {
            const e = this.getPlayerPosition(s);
            ((t = Math.min(t, e.x)),
                (i = Math.max(i, e.x)),
                (r = Math.min(r, e.z)),
                (n = Math.max(n, e.z)));
        }
        return { minX: t, maxX: i, minZ: r, maxZ: n };
    }
    handleBoundaryConstraints() {
        const e = this.boundaryPadding;
        ((this.targetPosition.x = Math.max(
            this.arenaBounds.minX - e,
            Math.min(this.arenaBounds.maxX + e, this.targetPosition.x)
        )),
            (this.targetLookAt.x = Math.max(
                this.arenaBounds.minX,
                Math.min(this.arenaBounds.maxX, this.targetLookAt.x)
            )),
            (this.targetLookAt.z = Math.max(
                this.arenaBounds.minZ,
                Math.min(this.arenaBounds.maxZ, this.targetLookAt.z)
            )),
            (this.targetPosition.y = Math.max(
                this.minZoom,
                Math.min(this.maxZoom, this.targetPosition.y)
            )));
    }
    applySmoothMovement(e) {
        ((this.camera.position.x +=
            (this.targetPosition.x - this.camera.position.x) * this.smoothingFactor),
            (this.camera.position.y +=
                (this.targetPosition.y - this.camera.position.y) * this.smoothingFactor),
            (this.camera.position.z +=
                (this.targetPosition.z - this.camera.position.z) * this.smoothingFactor),
            (this.camera.position.x += e.x),
            (this.camera.position.y += e.y),
            (this.camera.position.z += e.z));
        const t = this.getCurrentLookAt(),
            i = {
                x: t.x + (this.targetLookAt.x - t.x) * this.smoothingFactor,
                y: t.y + (this.targetLookAt.y - t.y) * this.smoothingFactor,
                z: t.z + (this.targetLookAt.z - t.z) * this.smoothingFactor,
            };
        this.camera.lookAt(i.x, i.y, i.z);
    }
    getCurrentLookAt() {
        return { x: this.camera.position.x, y: 0, z: this.camera.position.z - this.baseDistance };
    }
    getPlayerPosition(e) {
        return e.position ? { x: e.position.x, z: e.position.z } : { x: e.x || 0, z: e.z || 0 };
    }
    handleRapidMovement(e = 2) {
        const t = this.camera.position,
            i = this.targetPosition.x - t.x,
            r = this.targetPosition.y - t.y,
            n = this.targetPosition.z - t.z,
            s = Math.sqrt(i * i + r * r + n * n);
        if (s > e) {
            const a = e / s;
            ((this.targetPosition.x = t.x + i * a),
                (this.targetPosition.y = t.y + r * a),
                (this.targetPosition.z = t.z + n * a));
        }
    }
    handleOppositeCornerCase() {
        if (this.players.length < 2) return;
        const e = this.getPlayerPosition(this.players[0]),
            t = this.getPlayerPosition(this.players[1]);
        if (
            ((Math.abs(e.x - this.arenaBounds.minX) < 3 &&
                Math.abs(t.x - this.arenaBounds.maxX) < 3) ||
                (Math.abs(e.x - this.arenaBounds.maxX) < 3 &&
                    Math.abs(t.x - this.arenaBounds.minX) < 3)) &&
            ((Math.abs(e.z - this.arenaBounds.minZ) < 3 &&
                Math.abs(t.z - this.arenaBounds.maxZ) < 3) ||
                (Math.abs(e.z - this.arenaBounds.maxZ) < 3 &&
                    Math.abs(t.z - this.arenaBounds.minZ) < 3))
        ) {
            this.targetPosition.y = this.maxZoom;
            const e = {
                x: (this.arenaBounds.minX + this.arenaBounds.maxX) / 2,
                z: (this.arenaBounds.minZ + this.arenaBounds.maxZ) / 2,
            };
            ((this.targetPosition.x = e.x),
                (this.targetLookAt.x = e.x),
                (this.targetLookAt.z = e.z));
        }
    }
    handlePlayerElimination() {
        if (1 === this.players.length) {
            const e = this.players[0],
                t = this.getPlayerPosition(e),
                i = this.baseHeight,
                r = this.baseDistance,
                n = 0.5 * this.smoothingFactor;
            ((this.targetPosition = { x: t.x, y: i, z: t.z + r }),
                (this.targetLookAt = { x: t.x, y: 0, z: t.z }),
                this.applySmoothMovementWithFactor(n));
        }
    }
    handlePlayersCloseProximity() {
        if (this.players.length < 2) return;
        const e = this.getPlayerPosition(this.players[0]),
            t = this.getPlayerPosition(this.players[1]);
        if (this.calculateDistance(e, t) < 3) {
            this.targetPosition.y = Math.max(this.targetPosition.y, this.minZoom + 5);
            const e = 0.8 * this.baseDistance;
            this.targetPosition.z = this.targetLookAt.z + e;
        }
    }
    handleArenaShrinking(e) {
        if (!e) return;
        this.setArenaBounds(e);
        const t = e.maxX - e.minX,
            i = e.maxZ - e.minZ,
            r = Math.min(t, i) / 30;
        ((this.minZoom = Math.max(15, this.baseHeight * r)),
            (this.maxZoom = Math.max(this.minZoom + 10, 50 * r)),
            (this.maxPlayerDistance = Math.max(10, 30 * r)),
            (this.boundaryPadding = Math.max(2, 5 * r)));
    }
    handleCameraBoundaryCollision() {
        const e = 0.75 * this.targetPosition.y,
            t = this.targetPosition.x - e,
            i = this.targetPosition.x + e,
            r = this.targetLookAt.z - e,
            n = this.targetLookAt.z + e;
        (t < this.arenaBounds.minX && (this.targetPosition.x = this.arenaBounds.minX + e),
            i > this.arenaBounds.maxX && (this.targetPosition.x = this.arenaBounds.maxX - e),
            r < this.arenaBounds.minZ &&
                ((this.targetLookAt.z = this.arenaBounds.minZ + e),
                (this.targetPosition.z = this.targetLookAt.z + this.baseDistance)),
            n > this.arenaBounds.maxZ &&
                ((this.targetLookAt.z = this.arenaBounds.maxZ - e),
                (this.targetPosition.z = this.targetLookAt.z + this.baseDistance)));
    }
    applySmoothMovementWithFactor(e, t = { x: 0, y: 0, z: 0 }) {
        ((this.camera.position.x += (this.targetPosition.x - this.camera.position.x) * e),
            (this.camera.position.y += (this.targetPosition.y - this.camera.position.y) * e),
            (this.camera.position.z += (this.targetPosition.z - this.camera.position.z) * e),
            (this.camera.position.x += t.x),
            (this.camera.position.y += t.y),
            (this.camera.position.z += t.z));
        const i = this.getCurrentLookAt(),
            r = {
                x: i.x + (this.targetLookAt.x - i.x) * e,
                y: i.y + (this.targetLookAt.y - i.y) * e,
                z: i.z + (this.targetLookAt.z - i.z) * e,
            };
        this.camera.lookAt(r.x, r.y, r.z);
    }
    setArenaBounds(e) {
        this.arenaBounds = e;
    }
    setConfiguration(e) {
        (void 0 !== e.minZoom && (this.minZoom = e.minZoom),
            void 0 !== e.maxZoom && (this.maxZoom = e.maxZoom),
            void 0 !== e.baseHeight && (this.baseHeight = e.baseHeight),
            void 0 !== e.baseDistance && (this.baseDistance = e.baseDistance),
            void 0 !== e.smoothingFactor && (this.smoothingFactor = e.smoothingFactor),
            void 0 !== e.maxPlayerDistance && (this.maxPlayerDistance = e.maxPlayerDistance),
            void 0 !== e.boundaryPadding && (this.boundaryPadding = e.boundaryPadding));
    }
    reset() {
        ((this.camera.position.x = this.originalPosition.x),
            (this.camera.position.y = this.originalPosition.y),
            (this.camera.position.z = this.originalPosition.z),
            this.camera.lookAt(0, 0, 0),
            (this.targetPosition = { x: 0, y: this.baseHeight, z: this.baseDistance }),
            (this.targetLookAt = { x: 0, y: 0, z: 0 }));
    }
    getStatus() {
        return {
            playersTracked: this.players.length,
            currentPosition: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z,
            },
            targetPosition: this.targetPosition,
            targetLookAt: this.targetLookAt,
            configuration: {
                minZoom: this.minZoom,
                maxZoom: this.maxZoom,
                smoothingFactor: this.smoothingFactor,
                maxPlayerDistance: this.maxPlayerDistance,
            },
        };
    }
    forceUpdate() {
        (this.camera.position.set(
            this.targetPosition.x,
            this.targetPosition.y,
            this.targetPosition.z
        ),
            this.camera.lookAt(this.targetLookAt.x, this.targetLookAt.y, this.targetLookAt.z));
    }
    ensureBothPlayersVisible() {
        if (this.players.length < 2) return !0;
        const e = this.getPlayerPosition(this.players[0]),
            t = this.getPlayerPosition(this.players[1]),
            i = 1.5 * this.camera.position.y,
            r = 1.5 * this.camera.position.y,
            n = this.camera.position.x,
            s = this.camera.position.z - this.baseDistance,
            a = n - i / 2,
            o = n + i / 2,
            l = s - r / 2,
            c = s + r / 2,
            d = e.x >= a && e.x <= o && e.z >= l && e.z <= c,
            h = t.x >= a && t.x <= o && t.z >= l && t.z <= c;
        return d && h;
    }
};
module$U.exports = { SplitScreenCamera: SplitScreenCamera$2 };
const __CJS__export_default__$T =
        (null == module$U.exports ? {} : module$U.exports).default || module$U.exports,
    __CJS__import__8__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$T },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$T = { exports: {} };
let RenderingEngine$2 = class {
    constructor(e) {
        ((this.scene = new THREE.Scene()),
            (this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1e3
            )),
            this.camera.position.set(0, 20, 20),
            (this.renderer = new THREE.WebGLRenderer({ antialias: !0, alpha: !1 })),
            this.renderer.setClearColor(51, 1),
            this.renderer.setSize(window.innerWidth, window.innerHeight),
            document.body.appendChild(this.renderer.domElement),
            (this.originalCameraPosition = this.camera.position.clone()),
            (this.cameraEffectsManager = null));
        const { ThemeEngine: t } = __CJS__export_default__$W || __CJS__import__2__$3;
        this.themeEngine = new t(this.scene, this.renderer);
        const { EmissiveMaterialSystem: i } = __CJS__export_default__$V || __CJS__import__5__;
        this.emissiveMaterialSystem = new i();
        const { TrailStyleRenderer: r } = __CJS__export_default__$U || __CJS__import__2__$2;
        ((this.trailStyleRenderer = new r(this.scene, this.emissiveMaterialSystem)),
            this.themeEngine.loadTheme('classic-grid'),
            (this.playerEntities = new Map()),
            (this.playerTrails = new Map()),
            (this.playerLabels = new Map()),
            (this.player = null),
            (this.playerTrail = []),
            (this.aiEntities = new Map()),
            (this.aiTrails = new Map()),
            (this.ai = null),
            (this.aiTrail = []),
            (this.playerTrail = []),
            (this.boundaryVisualization = {
                currentBoundaries: null,
                futureBoundaries: null,
                warningFlash: { active: !1, intensity: 0, flashRate: 4, lastFlashTime: 0 },
                shrinkAnimation: {
                    active: !1,
                    progress: 0,
                    duration: 500,
                    startTime: 0,
                    startBounds: null,
                    targetBounds: null,
                },
            }),
            (this.powerUpObjects = new Map()),
            (this.powerUpAnimations = new Map()),
            (this.instancedMeshes = new Map()),
            (this.instanceMatrices = new Map()),
            (this.instanceCounts = new Map()),
            (this.maxInstancesPerType = 3),
            (this.collectionParticles = []),
            (this.particleGeometry = new THREE.SphereGeometry(0.05, 8, 8)),
            (this.particleMaterials = {
                speed: new THREE.MeshBasicMaterial({ color: 26367, transparent: !0 }),
                shield: new THREE.MeshBasicMaterial({ color: 16766720, transparent: !0 }),
                eraser: new THREE.MeshBasicMaterial({ color: 10040012, transparent: !0 }),
                ghost: new THREE.MeshBasicMaterial({ color: 16777215, transparent: !0 }),
            }),
            this.initializeInstancedMeshes(),
            (this.particleSystem = null),
            (this.particleSystemEnabled = !0),
            (this.splitScreenCamera = null));
    }
    setCameraEffectsManager(e) {
        this.cameraEffectsManager = e;
    }
    draw(e) {
        this.handleGlowPauseState(e);
        const t = this.calculateDeltaTime();
        (this.emissiveMaterialSystem.updatePulseAnimation(t),
            this.trailStyleRenderer.updateTrailEffects(t),
            this.updatePlayerEntities(e),
            this.cleanupCrashedAIs(e),
            this.updateAIEntities(e),
            this.updatePlayerTrails(e),
            this.updateAITrails(e),
            this.updatePowerUpAnimations(),
            this.updateParticleEffects(),
            this.updateCollectionNotifications(),
            this.updateIntegratedParticleSystem(e),
            e.arenaState && this.updateBoundaryVisualization(e.arenaState),
            this.updateCameraForPlayers(e),
            this.cameraEffectsManager &&
            this.cameraEffectsManager.isEnabled() &&
            this.cameraEffectsManager.hasPostProcessing()
                ? this.cameraEffectsManager.render(this.scene, this.camera)
                : this.renderer.render(this.scene, this.camera));
    }
    calculateDeltaTime() {
        const e = Date.now();
        if (!this.lastFrameTime) return ((this.lastFrameTime = e), 0.016);
        const t = (e - this.lastFrameTime) / 1e3;
        return ((this.lastFrameTime = e), Math.min(t, 0.1));
    }
    handleGlowPauseState(e) {
        if (!this.emissiveMaterialSystem) return;
        const t = e.isPaused || !1;
        (void 0 === this.lastPauseState && (this.lastPauseState = t),
            t && !this.lastPauseState
                ? this.emissiveMaterialSystem.pausePulse()
                : !t && this.lastPauseState && this.emissiveMaterialSystem.resumePulse(),
            (this.lastPauseState = t));
    }
    updateAIEntities(e) {
        if (e.aiOpponents && e.aiOpponents.length > 0) {
            e.aiOpponents.forEach((e) => {
                if (e.alive) {
                    let t = this.aiEntities.get(e.id);
                    if (!t) {
                        const i = new THREE.BoxGeometry(1, 1, 1),
                            r = this.getColorHex(e.color),
                            n = this.emissiveMaterialSystem.createBikeMaterial(e.id, r);
                        ((t = new THREE.Mesh(i, n)),
                            this.scene.add(t),
                            this.aiEntities.set(e.id, t),
                            this.aiTrails.has(e.id) || this.aiTrails.set(e.id, []));
                    }
                    ((t.position.x = e.x), (t.position.z = e.z), (t.visible = !0));
                } else {
                    const t = this.aiEntities.get(e.id);
                    t && (t.visible = !1);
                }
            });
            const t = e.aiOpponents[0];
            t &&
                t.alive &&
                ((this.ai = this.aiEntities.get(t.id)),
                (this.aiTrail = this.aiTrails.get(t.id) || []));
        } else
            (this.aiEntities.forEach((e) => {
                e.visible = !1;
            }),
                (this.ai = null),
                (this.aiTrail = []));
        if (e.ai && !e.aiOpponents) {
            if (!this.ai) {
                const e = new THREE.BoxGeometry(1, 1, 1),
                    t = this.emissiveMaterialSystem.createBikeMaterial('legacy_ai', 16711680);
                ((this.ai = new THREE.Mesh(e, t)), this.scene.add(this.ai));
            }
            ((this.ai.position.x = e.ai.x), (this.ai.position.z = e.ai.z), (this.ai.visible = !0));
        }
    }
    updateAITrails(e) {
        if (
            (e.aiOpponents &&
                e.aiOpponents.length > 0 &&
                e.aiOpponents.forEach((e) => {
                    if (e.alive && e.trail) {
                        const t = this.aiTrails.get(e.id) || [];
                        if (t.length < e.trail.length) {
                            const i = e.trail[e.trail.length - 1],
                                r = this.getColorHex(e.color);
                            (this.createTrailSegment(i, r, t, e.id), this.aiTrails.set(e.id, t));
                        }
                    }
                }),
            e.ai && e.aiTrail && this.aiTrail.length < e.aiTrail.length)
        ) {
            const t = e.aiTrail[e.aiTrail.length - 1];
            this.createTrailSegment(t, 16711680, this.aiTrail, 'legacy_ai');
        }
    }
    getColorHex(e) {
        return (
            {
                red: 16711680,
                blue: 255,
                yellow: 16776960,
                purple: 8388736,
                cyan: 65535,
                green: 65280,
                orange: 16737792,
                white: 16777215,
            }[e] || 16711680
        );
    }
    getPlayerColor(e) {
        return { P1: 65280, P2: 255, player: 65280, player1: 65280, player2: 255 }[e] || 65280;
    }
    updatePlayerEntities(e) {
        if (e.player1 && e.player2)
            (this.updatePlayerEntity('P1', e.player1),
                this.updatePlayerEntity('P2', e.player2),
                (this.player = this.playerEntities.get('P1')),
                (this.playerTrail = this.playerTrails.get('P1') || []));
        else if (e.players && e.players.length > 0) {
            e.players.forEach((e) => {
                e.id && e.isAlive && this.updatePlayerEntity(e.id, e);
            });
            const t = e.players[0];
            t &&
                ((this.player = this.playerEntities.get(t.id)),
                (this.playerTrail = this.playerTrails.get(t.id) || []));
        } else
            e.player &&
                (this.updatePlayerEntity('player', e.player),
                (this.player = this.playerEntities.get('player')),
                (this.playerTrail = this.playerTrails.get('player') || []));
    }
    updatePlayerEntity(e, t) {
        var i, r;
        if (!t.isAlive) {
            const t = this.playerEntities.get(e);
            t && (t.visible = !1);
            const i = this.playerLabels.get(e);
            return void (i && (i.visible = !1));
        }
        let n = this.playerEntities.get(e),
            s = this.playerLabels.get(e);
        if (!n) {
            const t = new THREE.BoxGeometry(1, 1, 1),
                i = this.getPlayerColor(e),
                r = this.emissiveMaterialSystem.createBikeMaterial(e, i);
            ((n = new THREE.Mesh(t, r)),
                this.scene.add(n),
                this.playerEntities.set(e, n),
                this.playerTrails.has(e) || this.playerTrails.set(e, []));
        }
        (s ||
            ('P1' !== e && 'P2' !== e) ||
            ((s = this.createPlayerLabel(e)), this.playerLabels.set(e, s)),
            (n.position.x = t.x || (null == (i = t.position) ? void 0 : i.x) || 0),
            (n.position.z = t.z || (null == (r = t.position) ? void 0 : r.z) || 0),
            (n.visible = !0),
            s &&
                ((s.position.x = n.position.x),
                (s.position.z = n.position.z),
                (s.position.y = 2),
                (s.visible = !0)));
    }
    createPlayerLabel(e) {
        const t = new THREE.BoxGeometry(0.3, 0.3, 0.3),
            i = this.getPlayerColor(e),
            r = new THREE.MeshBasicMaterial({ color: i, transparent: !0, opacity: 0.8 }),
            n = new THREE.Mesh(t, r);
        return ((n.position.y = 2), this.scene.add(n), n);
    }
    updatePlayerTrails(e) {
        if (e.player1 && e.player2)
            (this.updatePlayerTrail('P1', e.player1), this.updatePlayerTrail('P2', e.player2));
        else if (e.players && e.players.length > 0)
            e.players.forEach((e) => {
                e.id && e.isAlive && this.updatePlayerTrail(e.id, e);
            });
        else if (e.player && e.playerTrail) {
            const t = this.playerTrails.get('player') || [];
            if (t.length < e.playerTrail.length) {
                const i = e.playerTrail[e.playerTrail.length - 1];
                (this.createTrailSegment(i, 65280, t, 'player'),
                    this.playerTrails.set('player', t));
            }
        }
    }
    updatePlayerTrail(e, t) {
        if (!t.isAlive || !t.trail) return;
        const i = this.playerTrails.get(e) || [];
        if (i.length < t.trail.length) {
            const r = t.trail[t.trail.length - 1],
                n = this.getPlayerColor(e);
            (this.createTrailSegment(r, n, i, e), this.playerTrails.set(e, i));
        }
    }
    createTrailSegment(e, t, i, r = null) {
        let n = t;
        r &&
            this.emissiveMaterialSystem.getTrailColorTemplate &&
            (n = this.emissiveMaterialSystem.getTrailColorTemplate(r));
        const s = this.trailStyleRenderer.createStyledTrailSegment(e, n, i, r);
        s && i.push(s);
    }
    updateCamera(e) {
        const t = { x: e.x, y: 20, z: e.z + 15 };
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            const e = this.cameraEffectsManager.getCameraOffset();
            ((this.camera.position.x = t.x + e.x),
                (this.camera.position.y = t.y + e.y),
                (this.camera.position.z = t.z + e.z));
        } else
            ((this.camera.position.x = t.x),
                (this.camera.position.y = t.y),
                (this.camera.position.z = t.z));
        this.camera.lookAt(e);
    }
    updateCameraForPlayers(e) {
        if (!this.splitScreenCamera) {
            const { SplitScreenCamera: e } = __CJS__export_default__$T || __CJS__import__8__;
            this.splitScreenCamera = new e(this.camera);
        }
        const t = [];
        (e.player1 && e.player2
            ? (e.player1.isAlive && t.push(e.player1), e.player2.isAlive && t.push(e.player2))
            : e.players && e.players.length > 0
              ? t.push(...e.players.filter((e) => e.isAlive))
              : e.player && t.push(e.player),
            this.splitScreenCamera.setPlayers(t));
        const i =
            this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()
                ? this.cameraEffectsManager.getCameraOffset()
                : { x: 0, y: 0, z: 0 };
        (this.splitScreenCamera.update(i, e.arenaState),
            0 === t.length && this.player && this.updateCamera(this.player.position));
    }
    clearTrails() {
        (this.trailStyleRenderer.clearAllTrails(),
            this.clearAllPlayers(),
            this.clearAllAIs(),
            this.clearBoundaryVisualization(),
            this.resetParticleSystem(),
            this.cameraEffectsManager &&
                this.cameraEffectsManager.isEnabled() &&
                this.cameraEffectsManager.reset(),
            this.splitScreenCamera && this.splitScreenCamera.reset());
    }
    initializeInstancedMeshes() {
        const e = {
            SPEED_BOOST: {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 26367,
                    emissive: 26367,
                    emissiveIntensity: 0.3,
                }),
            },
            SHIELD: {
                geometry: new THREE.SphereGeometry(0.6, 16, 16),
                material: new THREE.MeshLambertMaterial({
                    color: 16766720,
                    emissive: 16766720,
                    emissiveIntensity: 0.3,
                }),
            },
            TRAIL_ERASER: {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 10040012,
                    emissive: 10040012,
                    emissiveIntensity: 0.3,
                }),
            },
            GHOST_MODE: {
                geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8),
                material: new THREE.MeshLambertMaterial({
                    color: 16777215,
                    transparent: !0,
                    opacity: 0.7,
                }),
            },
        };
        for (const [t, i] of Object.entries(e)) {
            const e = new THREE.InstancedMesh(i.geometry, i.material, this.maxInstancesPerType),
                r = new THREE.Matrix4();
            r.makeScale(0, 0, 0);
            for (let t = 0; t < this.maxInstancesPerType; t++) e.setMatrixAt(t, r);
            ((e.instanceMatrix.needsUpdate = !0),
                (e.count = 0),
                this.scene.add(e),
                this.instancedMeshes.set(t, e),
                this.instanceCounts.set(t, 0),
                this.instanceMatrices.set(t, new Float32Array(16 * this.maxInstancesPerType)));
        }
    }
    registerPowerUps(e) {
        const t = new Map();
        for (const r of e) (t.has(r.type) || t.set(r.type, []), t.get(r.type).push(r));
        const i = new Set(e.map((e) => e.id));
        for (const [r, n] of this.powerUpObjects) i.has(r) || this.removePowerUp(r);
        for (const [r, n] of t)
            if (n.length > 1 && this.instancedMeshes.has(r)) this.updateInstancedPowerUps(r, n);
            else for (const e of n) this.powerUpObjects.has(e.id) || this.createPowerUpObject(e);
        for (const [r, n] of this.instancedMeshes)
            t.has(r) || ((n.count = 0), this.instanceCounts.set(r, 0));
    }
    createPowerUpObject(e) {
        const { type: t, position: i, appearance: r } = e;
        let n, s, a;
        switch (r.shape) {
            case 'cube':
            case 'diamond':
                n = new THREE.BoxGeometry(r.size.x, r.size.y, r.size.z);
                break;
            case 'sphere':
                n = new THREE.SphereGeometry(r.size.radius, 16, 16);
                break;
            default:
                n = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        }
        ((s = r.glow
            ? new THREE.MeshLambertMaterial({
                  color: r.color,
                  emissive: r.color,
                  emissiveIntensity: 0.3,
                  transparent: void 0 !== r.opacity,
                  opacity: r.opacity || 1,
              })
            : new THREE.MeshLambertMaterial({
                  color: r.color,
                  transparent: void 0 !== r.opacity,
                  opacity: r.opacity || 1,
              })),
            (a = new THREE.Mesh(n, s)),
            a.position.set(i.x, i.y, i.z),
            'diamond' === r.shape && a.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4),
            this.scene.add(a),
            this.powerUpObjects.set(e.id, a),
            this.initializePowerUpAnimation(e.id, t, a));
    }
    initializePowerUpAnimation(e, t, i) {
        const r = {
            type: t,
            mesh: i,
            startTime: Date.now(),
            rotationSpeed: { x: 0, y: 0, z: 0 },
            floatAmplitude: 0,
            floatSpeed: 0,
            originalY: i.position.y,
            opacityRange: { min: 1, max: 1 },
            opacitySpeed: 0,
        };
        switch (t) {
            case 'SPEED_BOOST':
                r.rotationSpeed.y = 0.02;
                break;
            case 'SHIELD':
                ((r.floatAmplitude = 0.1), (r.floatSpeed = 0.003));
                break;
            case 'TRAIL_ERASER':
                ((r.rotationSpeed.x = 0.015),
                    (r.rotationSpeed.y = 0.02),
                    (r.rotationSpeed.z = 0.01));
                break;
            case 'GHOST_MODE':
                ((r.opacityRange = { min: 0.4, max: 0.9 }), (r.opacitySpeed = 0.004));
        }
        this.powerUpAnimations.set(e, r);
    }
    updatePowerUpAnimations() {
        const e = Date.now();
        for (const [t, i] of this.powerUpAnimations) {
            const {
                    mesh: t,
                    startTime: r,
                    rotationSpeed: n,
                    floatAmplitude: s,
                    floatSpeed: a,
                    originalY: o,
                    opacityRange: l,
                    opacitySpeed: c,
                } = i,
                d = e - r;
            if (
                (0 !== n.x && (t.rotation.x += n.x),
                0 !== n.y && (t.rotation.y += n.y),
                0 !== n.z && (t.rotation.z += n.z),
                s > 0 && (t.position.y = o + Math.sin(d * a) * s),
                l.min !== l.max)
            ) {
                const e = (l.min + l.max) / 2,
                    i = (l.max - l.min) / 2,
                    r = e + Math.sin(d * c) * i;
                t.material.opacity = r;
            }
        }
    }
    removePowerUp(e) {
        const t = this.powerUpObjects.get(e);
        (t &&
            (this.scene.remove(t),
            t.geometry && t.geometry.dispose(),
            t.material && t.material.dispose(),
            this.powerUpObjects.delete(e)),
            this.powerUpAnimations.delete(e));
    }
    updateInstancedPowerUps(e, t) {
        const i = this.instancedMeshes.get(e);
        if (!i) return;
        const r = new THREE.Matrix4(),
            n = new THREE.Vector3(),
            s = new THREE.Euler(),
            a = new THREE.Vector3(1, 1, 1);
        for (let l = 0; l < t.length && l < this.maxInstancesPerType; l++) {
            const o = t[l];
            n.set(o.position.x, o.position.y, o.position.z);
            const c = 0.001 * Date.now();
            switch (e) {
                case 'SPEED_BOOST':
                    s.set(0, 2 * c, 0);
                    break;
                case 'TRAIL_ERASER':
                    s.set(1.5 * c, 2 * c, c);
                    break;
                case 'GHOST_MODE':
                    s.set(0, 1.5 * c, 0);
                    break;
                default:
                    s.set(0, 0, 0);
            }
            ('TRAIL_ERASER' === e && ((s.x += Math.PI / 4), (s.z += Math.PI / 4)),
                r.compose(n, new THREE.Quaternion().setFromEuler(s), a),
                i.setMatrixAt(l, r),
                this.powerUpObjects.has(o.id) && this.removePowerUp(o.id));
        }
        const o = new THREE.Matrix4().makeScale(0, 0, 0);
        for (let l = t.length; l < this.maxInstancesPerType; l++) i.setMatrixAt(l, o);
        ((i.count = Math.min(t.length, this.maxInstancesPerType)),
            (i.instanceMatrix.needsUpdate = !0),
            this.instanceCounts.set(e, i.count));
    }
    clearPowerUps() {
        for (const [e] of this.powerUpObjects) this.removePowerUp(e);
        for (const [e, t] of this.instancedMeshes) {
            ((t.count = 0), this.instanceCounts.set(e, 0));
            const i = new THREE.Matrix4().makeScale(0, 0, 0);
            for (let e = 0; e < this.maxInstancesPerType; e++) t.setMatrixAt(e, i);
            t.instanceMatrix.needsUpdate = !0;
        }
    }
    createCollectionParticles(e, t) {
        const i = [];
        let r;
        switch (t) {
            case 'SPEED_BOOST':
            default:
                r = this.particleMaterials.speed;
                break;
            case 'SHIELD':
                r = this.particleMaterials.shield;
                break;
            case 'TRAIL_ERASER':
                r = this.particleMaterials.eraser;
                break;
            case 'GHOST_MODE':
                r = this.particleMaterials.ghost;
        }
        for (let n = 0; n < 8; n++) {
            const t = new THREE.Mesh(this.particleGeometry, r.clone());
            t.position.set(e.x, e.y, e.z);
            const s = (n / 8) * Math.PI * 2,
                a = 0.1 + 0.1 * Math.random();
            ((t.userData = {
                velocity: { x: Math.cos(s) * a, y: 0.05 + 0.1 * Math.random(), z: Math.sin(s) * a },
                life: 1,
                decay: 0.02 + 0.01 * Math.random(),
            }),
                this.scene.add(t),
                i.push(t));
        }
        this.collectionParticles.push(...i);
    }
    updateParticleEffects() {
        const e = [];
        for (let t = 0; t < this.collectionParticles.length; t++) {
            const i = this.collectionParticles[t],
                r = i.userData;
            ((i.position.x += r.velocity.x),
                (i.position.y += r.velocity.y),
                (i.position.z += r.velocity.z),
                (r.velocity.y -= 0.002),
                (r.life -= r.decay),
                (i.material.opacity = r.life),
                r.life <= 0 && e.push(t));
        }
        for (let t = e.length - 1; t >= 0; t--) {
            const i = e[t],
                r = this.collectionParticles[i];
            (this.scene.remove(r),
                r.material && r.material.dispose(),
                this.collectionParticles.splice(i, 1));
        }
    }
    displayCollectionNotification(e, t) {
        const i = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let r,
            n = '';
        switch (e) {
            case 'SPEED_BOOST':
                ((r = new THREE.MeshBasicMaterial({ color: 26367, transparent: !0, opacity: 0.8 })),
                    (n = 'Speed Boost!'));
                break;
            case 'SHIELD':
                ((r = new THREE.MeshBasicMaterial({
                    color: 16766720,
                    transparent: !0,
                    opacity: 0.8,
                })),
                    (n = 'Shield!'));
                break;
            case 'TRAIL_ERASER':
                ((r = new THREE.MeshBasicMaterial({
                    color: 10040012,
                    transparent: !0,
                    opacity: 0.8,
                })),
                    (n = 'Trail Eraser!'));
                break;
            case 'GHOST_MODE':
                ((r = new THREE.MeshBasicMaterial({
                    color: 16777215,
                    transparent: !0,
                    opacity: 0.8,
                })),
                    (n = 'Ghost Mode!'));
                break;
            default:
                ((r = new THREE.MeshBasicMaterial({
                    color: 16777215,
                    transparent: !0,
                    opacity: 0.8,
                })),
                    (n = 'Power-Up!'));
        }
        const s = new THREE.Mesh(i, r);
        (s.position.set(t.x, t.y + 2, t.z),
            (s.userData = {
                startTime: Date.now(),
                duration: 2e3,
                startY: t.y + 2,
                isNotification: !0,
            }),
            this.scene.add(s),
            this.collectionParticles.push(s));
    }
    updateCollectionNotifications() {
        const e = Date.now();
        for (const t of this.collectionParticles)
            if (t.userData && t.userData.isNotification) {
                const i = (e - t.userData.startTime) / t.userData.duration;
                i >= 1
                    ? (t.userData.life = 0)
                    : ((t.position.y = t.userData.startY + 3 * i),
                      (t.material.opacity = 0.8 * (1 - i)));
            }
    }
    createCurrentBoundaryVisualization(e) {
        this.boundaryVisualization.currentBoundaries &&
            (this.scene.remove(this.boundaryVisualization.currentBoundaries),
            this.boundaryVisualization.currentBoundaries.geometry &&
                this.boundaryVisualization.currentBoundaries.geometry.dispose(),
            this.boundaryVisualization.currentBoundaries.material &&
                this.boundaryVisualization.currentBoundaries.material.dispose());
        const t = new THREE.BufferGeometry(),
            i = [];
        (i.push(e.minX, 0, e.minZ, e.maxX, 0, e.minZ),
            i.push(e.minX, 0, e.maxZ, e.maxX, 0, e.maxZ),
            i.push(e.minX, 0, e.minZ, e.minX, 0, e.maxZ),
            i.push(e.maxX, 0, e.minZ, e.maxX, 0, e.maxZ));
        (i.push(e.minX, 0, e.minZ, e.minX, 2, e.minZ),
            i.push(e.maxX, 0, e.minZ, e.maxX, 2, e.minZ),
            i.push(e.minX, 0, e.maxZ, e.minX, 2, e.maxZ),
            i.push(e.maxX, 0, e.maxZ, e.maxX, 2, e.maxZ),
            i.push(e.minX, 2, e.minZ, e.maxX, 2, e.minZ),
            i.push(e.minX, 2, e.maxZ, e.maxX, 2, e.maxZ),
            i.push(e.minX, 2, e.minZ, e.minX, 2, e.maxZ),
            i.push(e.maxX, 2, e.minZ, e.maxX, 2, e.maxZ),
            t.setAttribute('position', new THREE.Float32BufferAttribute(i, 3)));
        const r = new THREE.LineBasicMaterial({
                color: 65535,
                linewidth: 3,
                transparent: !0,
                opacity: 1,
            }),
            n = new THREE.LineSegments(t, r);
        (this.scene.add(n), (this.boundaryVisualization.currentBoundaries = n));
    }
    createFutureBoundaryVisualization(e) {
        this.boundaryVisualization.futureBoundaries &&
            (this.scene.remove(this.boundaryVisualization.futureBoundaries),
            this.boundaryVisualization.futureBoundaries.geometry &&
                this.boundaryVisualization.futureBoundaries.geometry.dispose(),
            this.boundaryVisualization.futureBoundaries.material &&
                this.boundaryVisualization.futureBoundaries.material.dispose());
        const t = new THREE.BufferGeometry(),
            i = [];
        (i.push(e.minX, 0, e.minZ, e.maxX, 0, e.minZ),
            i.push(e.minX, 0, e.maxZ, e.maxX, 0, e.maxZ),
            i.push(e.minX, 0, e.minZ, e.minX, 0, e.maxZ),
            i.push(e.maxX, 0, e.minZ, e.maxX, 0, e.maxZ));
        const r = 1.5;
        (i.push(e.minX, 0, e.minZ, e.minX, r, e.minZ),
            i.push(e.maxX, 0, e.minZ, e.maxX, r, e.minZ),
            i.push(e.minX, 0, e.maxZ, e.minX, r, e.maxZ),
            i.push(e.maxX, 0, e.maxZ, e.maxX, r, e.maxZ),
            i.push(e.minX, r, e.minZ, e.maxX, r, e.minZ),
            i.push(e.minX, r, e.maxZ, e.maxX, r, e.maxZ),
            i.push(e.minX, r, e.minZ, e.minX, r, e.maxZ),
            i.push(e.maxX, r, e.minZ, e.maxX, r, e.maxZ),
            t.setAttribute('position', new THREE.Float32BufferAttribute(i, 3)));
        const n = new THREE.LineBasicMaterial({
                color: 16737792,
                linewidth: 2,
                transparent: !0,
                opacity: 0.3,
            }),
            s = new THREE.LineSegments(t, n);
        (this.scene.add(s), (this.boundaryVisualization.futureBoundaries = s));
    }
    updateBoundaryVisualization(e) {
        if (!e) return;
        const t = Date.now();
        (this.createCurrentBoundaryVisualization(e.currentBounds),
            e.warningActive
                ? (this.createFutureBoundaryVisualization(e.nextBounds),
                  this.boundaryVisualization.warningFlash.active ||
                      ((this.boundaryVisualization.warningFlash.active = !0),
                      (this.boundaryVisualization.warningFlash.lastFlashTime = t)))
                : (this.boundaryVisualization.futureBoundaries &&
                      (this.scene.remove(this.boundaryVisualization.futureBoundaries),
                      (this.boundaryVisualization.futureBoundaries = null)),
                  (this.boundaryVisualization.warningFlash.active = !1)),
            this.updateWarningFlash(t),
            this.updateShrinkAnimation(t));
    }
    updateWarningFlash(e) {
        const t = this.boundaryVisualization.warningFlash;
        if (!t.active || !this.boundaryVisualization.currentBoundaries) return;
        const i = 1e3 / t.flashRate,
            r = ((e - t.lastFlashTime) % i) / i,
            n = 0.5 * Math.sin(r * Math.PI * 2) + 0.5,
            s = new THREE.Color(1, 0.2 * n, 0.2 * n);
        ((this.boundaryVisualization.currentBoundaries.material.color = s),
            (this.boundaryVisualization.currentBoundaries.material.opacity = 0.8 + 0.2 * n));
    }
    startShrinkAnimation(e, t) {
        const i = this.boundaryVisualization.shrinkAnimation;
        ((i.active = !0),
            (i.progress = 0),
            (i.startTime = Date.now()),
            (i.startBounds = __spreadValues({}, e)),
            (i.targetBounds = __spreadValues({}, t)));
    }
    updateShrinkAnimation(e) {
        const t = this.boundaryVisualization.shrinkAnimation;
        if (!t.active) return;
        const i = e - t.startTime;
        if (((t.progress = Math.min(i / t.duration, 1)), t.progress >= 1))
            return void (t.active = !1);
        const r = t.progress,
            n = {
                minX: t.startBounds.minX + (t.targetBounds.minX - t.startBounds.minX) * r,
                maxX: t.startBounds.maxX + (t.targetBounds.maxX - t.startBounds.maxX) * r,
                minZ: t.startBounds.minZ + (t.targetBounds.minZ - t.startBounds.minZ) * r,
                maxZ: t.startBounds.maxZ + (t.targetBounds.maxZ - t.startBounds.maxZ) * r,
            };
        if (
            (this.createCurrentBoundaryVisualization(n),
            this.boundaryVisualization.currentBoundaries)
        ) {
            const e = 0.5 * Math.sin(t.progress * Math.PI * 8) + 0.5,
                i = new THREE.Color(1, 0.3 * e, 0.3 * e);
            this.boundaryVisualization.currentBoundaries.material.color = i;
        }
    }
    removeCrashedAI(e) {
        const t = this.aiEntities.get(e);
        t &&
            (this.scene.remove(t),
            t.geometry && t.geometry.dispose(),
            t.material && t.material.dispose(),
            this.aiEntities.delete(e));
        const i = this.aiTrails.get(e);
        if (i) {
            for (const e of i)
                (this.scene.remove(e),
                    e.userData &&
                        e.userData.materialId &&
                        this.emissiveMaterialSystem.disposeMaterial(e.userData.materialId),
                    e.geometry && e.geometry.dispose());
            this.aiTrails.delete(e);
        }
        if (this.ai === t) {
            const e = Array.from(this.aiEntities.values())[0];
            this.ai = e || null;
            const t = Array.from(this.aiTrails.values())[0];
            this.aiTrail = t || [];
        }
    }
    cleanupCrashedAIs(e) {
        if (!e.aiOpponents) return;
        const t = new Set(e.aiOpponents.map((e) => e.id)),
            i = [];
        (this.aiEntities.forEach((e, r) => {
            t.has(r) || i.push(r);
        }),
            i.forEach((e) => {
                this.removeCrashedAI(e);
            }));
    }
    clearAllAIs() {
        (this.aiEntities.forEach((e, t) => {
            (this.scene.remove(e),
                e.geometry && e.geometry.dispose(),
                e.material && e.material.dispose());
        }),
            this.aiEntities.clear(),
            this.aiTrails.forEach((e, t) => {
                for (const i of e)
                    (this.scene.remove(i),
                        i.userData &&
                            i.userData.materialId &&
                            this.emissiveMaterialSystem.disposeMaterial(i.userData.materialId),
                        i.geometry && i.geometry.dispose());
            }),
            this.aiTrails.clear(),
            this.ai &&
                this.ai.parent &&
                (this.scene.remove(this.ai),
                this.ai.geometry && this.ai.geometry.dispose(),
                this.ai.material && this.ai.material.dispose()),
            (this.ai = null),
            (this.aiTrail = []));
    }
    clearAllPlayers() {
        (this.playerEntities.forEach((e, t) => {
            (this.scene.remove(e),
                e.geometry && e.geometry.dispose(),
                e.material && e.material.dispose());
        }),
            this.playerEntities.clear(),
            this.playerLabels.forEach((e, t) => {
                (this.scene.remove(e),
                    e.geometry && e.geometry.dispose(),
                    e.material && e.material.dispose());
            }),
            this.playerLabels.clear(),
            this.playerTrails.forEach((e, t) => {
                for (const i of e)
                    (this.scene.remove(i),
                        i.userData &&
                            i.userData.materialId &&
                            this.emissiveMaterialSystem.disposeMaterial(i.userData.materialId),
                        i.geometry && i.geometry.dispose());
            }),
            this.playerTrails.clear(),
            this.player &&
                this.player.parent &&
                (this.scene.remove(this.player),
                this.player.geometry && this.player.geometry.dispose(),
                this.player.material && this.player.material.dispose()),
            (this.player = null),
            (this.playerTrail = []));
    }
    clearBoundaryVisualization() {
        (this.boundaryVisualization.currentBoundaries &&
            (this.scene.remove(this.boundaryVisualization.currentBoundaries),
            this.boundaryVisualization.currentBoundaries.geometry &&
                this.boundaryVisualization.currentBoundaries.geometry.dispose(),
            this.boundaryVisualization.currentBoundaries.material &&
                this.boundaryVisualization.currentBoundaries.material.dispose(),
            (this.boundaryVisualization.currentBoundaries = null)),
            this.boundaryVisualization.futureBoundaries &&
                (this.scene.remove(this.boundaryVisualization.futureBoundaries),
                this.boundaryVisualization.futureBoundaries.geometry &&
                    this.boundaryVisualization.futureBoundaries.geometry.dispose(),
                this.boundaryVisualization.futureBoundaries.material &&
                    this.boundaryVisualization.futureBoundaries.material.dispose(),
                (this.boundaryVisualization.futureBoundaries = null)),
            (this.boundaryVisualization.warningFlash.active = !1),
            (this.boundaryVisualization.shrinkAnimation.active = !1));
    }
    initializeParticleSystem(e, t = {}) {
        var i, r, n;
        if (e)
            try {
                ((this.particleSystem = new e(this.scene, {
                    maxParticles: t.maxParticles || 200,
                    enabled: !1 !== t.enabled,
                    quality: t.quality || 'medium',
                    effects: {
                        trailSparks: !1 !== (null == (i = t.effects) ? void 0 : i.trailSparks),
                        explosions: !1 !== (null == (r = t.effects) ? void 0 : r.explosions),
                        collections: !1 !== (null == (n = t.effects) ? void 0 : n.collections),
                    },
                })),
                    (this.particleSystemEnabled = !0));
            } catch (s) {
                ((this.particleSystem = null), (this.particleSystemEnabled = !1));
            }
    }
    updateIntegratedParticleSystem(e) {
        if (this.particleSystem && this.particleSystemEnabled)
            try {
                const t = Date.now(),
                    i = this.lastParticleUpdate ? (t - this.lastParticleUpdate) / 1e3 : 0.016;
                ((this.lastParticleUpdate = t),
                    this.particleSystem.update(i, e),
                    this.emitTrailSparksForEntities(e));
            } catch (t) {
                this.particleSystemEnabled = !1;
            }
    }
    emitTrailSparksForEntities(e) {
        if (!this.particleSystem || !e) return;
        const t = e.gameSpeed || 0.1;
        if (e.player && e.playerDirection) {
            const i = e.powerUpManager ? e.powerUpManager.getSpeedMultiplier('player') : 1,
                r = t * i,
                n = { x: e.playerDirection.x * r, y: 0, z: e.playerDirection.z * r };
            (Math.abs(n.x) > 0.01 || Math.abs(n.z) > 0.01) &&
                this.particleSystem.emitTrailSparks(e.player, n, 65280, r);
        }
        if (
            (e.aiOpponents &&
                e.aiOpponents.forEach((i) => {
                    if (i.alive && i.direction) {
                        const r = e.powerUpManager ? e.powerUpManager.getSpeedMultiplier('ai') : 1,
                            n = t * r,
                            s = { x: i.direction.x * n, y: 0, z: i.direction.z * n };
                        if (Math.abs(s.x) > 0.01 || Math.abs(s.z) > 0.01) {
                            const e = this.getColorHex(i.color);
                            this.particleSystem.emitTrailSparks(i, s, e, n);
                        }
                    }
                }),
            e.ai && e.aiDirection && !e.aiOpponents)
        ) {
            const i = e.powerUpManager ? e.powerUpManager.getSpeedMultiplier('ai') : 1,
                r = t * i,
                n = { x: e.aiDirection.x * r, y: 0, z: e.aiDirection.z * r };
            (Math.abs(n.x) > 0.01 || Math.abs(n.z) > 0.01) &&
                this.particleSystem.emitTrailSparks(e.ai, n, 16711680, r);
        }
    }
    createExplosionEffect(e, t = 1) {
        this.particleSystem &&
            this.particleSystemEnabled &&
            this.particleSystem.createExplosion(e, t);
    }
    createCollectionEffect(e, t) {
        this.particleSystem &&
            this.particleSystemEnabled &&
            this.particleSystem.createCollectionEffect(e, t);
    }
    getParticleSystem() {
        return this.particleSystem;
    }
    reinitializeParticleSystem(e = {}) {
        this.particleSystem && (this.particleSystem.dispose(), (this.particleSystem = null));
        const { ParticleSystem: t } = __CJS__export_default__$1b || __CJS__import__22__;
        this.initializeParticleSystem(t, e);
    }
    setParticleSystemEnabled(e) {
        ((this.particleSystemEnabled = e),
            this.particleSystem && this.particleSystem.setEnabled(e));
    }
    setParticleQuality(e) {
        this.particleSystem && this.particleSystem.setQualityLevel(e);
    }
    pauseParticleSystem() {
        this.particleSystem && this.particleSystem.pause();
    }
    resumeParticleSystem() {
        this.particleSystem && this.particleSystem.resume();
    }
    resetParticleSystem() {
        this.particleSystem && this.particleSystem.reset();
    }
    pauseGlowEffects() {
        this.emissiveMaterialSystem && this.emissiveMaterialSystem.pausePulse();
    }
    resumeGlowEffects() {
        this.emissiveMaterialSystem && this.emissiveMaterialSystem.resumePulse();
    }
    setGlowIntensity(e) {
        this.emissiveMaterialSystem && this.emissiveMaterialSystem.setGlobalIntensityMultiplier(e);
    }
    getGlowEffectStatus() {
        return this.emissiveMaterialSystem ? this.emissiveMaterialSystem.getStatus() : null;
    }
    setArenaTheme(e) {
        return !!this.themeEngine && this.themeEngine.loadTheme(e);
    }
    getAvailableThemes() {
        return this.themeEngine ? this.themeEngine.getAvailableThemes() : [];
    }
    getCurrentTheme() {
        return this.themeEngine ? this.themeEngine.getCurrentTheme() : 'classic-grid';
    }
    generateThemePreview(e) {
        return this.themeEngine ? this.themeEngine.generateThemePreview(e) : null;
    }
    getThemeConfig(e) {
        return this.themeEngine ? this.themeEngine.getThemeConfig(e) : null;
    }
    resetThemeToDefault() {
        this.themeEngine && this.themeEngine.resetToDefault();
    }
    getThemeEngine() {
        return this.themeEngine;
    }
    isWebGLAvailable() {
        try {
            const e = document.createElement('canvas'),
                t = e.getContext('webgl') || e.getContext('experimental-webgl');
            return !!t && !(!window.WebGLRenderingContext || !t);
        } catch (e) {
            return !1;
        }
    }
    showWebGLError() {
        const e = document.createElement('div');
        ((e.id = 'webgl-error'),
            (e.style.cssText =
                '\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background: rgba(255, 0, 0, 0.9);\n            color: white;\n            padding: 30px;\n            border-radius: 10px;\n            font-family: Arial, sans-serif;\n            text-align: center;\n            z-index: 10000;\n            max-width: 500px;\n            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);\n        '),
            (e.innerHTML =
                '\n            <h2 style="margin: 0 0 15px 0; font-size: 2em;">WebGL Not Supported</h2>\n            <p style="margin: 0 0 15px 0; font-size: 1.1em;">\n                Your browser does not support WebGL, which is required for this game.\n            </p>\n            <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">\n                Please try using a modern browser like:\n            </p>\n            <ul style="list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 0.9em;">\n                <li>• Chrome 90+</li>\n                <li>• Firefox 88+</li>\n                <li>• Safari 14+</li>\n                <li>• Edge 90+</li>\n            </ul>\n            <p style="margin: 0; font-size: 0.8em; color: #ffcccc;">\n                If you\'re using a supported browser, WebGL may be disabled in your settings.\n            </p>\n        '),
            document.body.appendChild(e));
    }
};
module$T.exports = { RenderingEngine: RenderingEngine$2 };
const __CJS__export_default__$S =
        (null == module$T.exports ? {} : module$T.exports).default || module$T.exports,
    __CJS__import__7__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$S },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$S = { exports: {} };
let ScoreDisplay$2 = class {
    constructor(e) {
        ((this.renderer = e),
            (this.scoreElements = {}),
            (this.isInitialized = !1),
            this.createScoreElements());
    }
    createScoreElements() {
        ((this.scoreElements.playerScore = document.createElement('div')),
            (this.scoreElements.playerScore.id = 'playerScore'),
            (this.scoreElements.playerScore.className = 'score-display player-score'),
            document.body.appendChild(this.scoreElements.playerScore),
            (this.scoreElements.aiScore = document.createElement('div')),
            (this.scoreElements.aiScore.id = 'aiScore'),
            (this.scoreElements.aiScore.className = 'score-display ai-score'),
            document.body.appendChild(this.scoreElements.aiScore),
            (this.scoreElements.highScore = document.createElement('div')),
            (this.scoreElements.highScore.id = 'highScore'),
            (this.scoreElements.highScore.className = 'score-display high-score'),
            (this.scoreElements.highScore.style.display = 'none'),
            document.body.appendChild(this.scoreElements.highScore),
            (this.scoreElements.newHighScore = document.createElement('div')),
            (this.scoreElements.newHighScore.id = 'newHighScore'),
            (this.scoreElements.newHighScore.className = 'score-display new-high-score'),
            (this.scoreElements.newHighScore.style.display = 'none'),
            document.body.appendChild(this.scoreElements.newHighScore),
            this.addScoreStyles(),
            this.positionScoreElements(),
            (this.isInitialized = !0));
    }
    addScoreStyles() {
        if (document.getElementById('scoreDisplayStyles')) return;
        const e = document.createElement('style');
        ((e.id = 'scoreDisplayStyles'),
            (e.textContent =
                "\n            /* Base score display styles */\n            .score-display {\n                position: absolute;\n                font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace;\n                font-weight: bold;\n                z-index: 100;\n                pointer-events: none;\n                user-select: none;\n                text-rendering: optimizeLegibility;\n                -webkit-font-smoothing: antialiased;\n                -moz-osx-font-smoothing: grayscale;\n            }\n\n            /* Player score styling - high contrast green */\n            .player-score {\n                top: 20px;\n                left: 20px;\n                color: #00ff41;\n                font-size: 2em;\n                text-shadow: \n                    0 0 5px rgba(0, 255, 65, 0.8),\n                    0 0 10px rgba(0, 255, 65, 0.6),\n                    0 0 15px rgba(0, 255, 65, 0.4),\n                    2px 2px 0px rgba(0, 0, 0, 0.8);\n                background: rgba(0, 0, 0, 0.3);\n                padding: 8px 12px;\n                border-radius: 4px;\n                border: 1px solid rgba(0, 255, 65, 0.3);\n            }\n\n            /* AI score styling - high contrast red */\n            .ai-score {\n                top: 20px;\n                right: 20px;\n                color: #ff0040;\n                font-size: 2em;\n                text-shadow: \n                    0 0 5px rgba(255, 0, 64, 0.8),\n                    0 0 10px rgba(255, 0, 64, 0.6),\n                    0 0 15px rgba(255, 0, 64, 0.4),\n                    2px 2px 0px rgba(0, 0, 0, 0.8);\n                background: rgba(0, 0, 0, 0.3);\n                padding: 8px 12px;\n                border-radius: 4px;\n                border: 1px solid rgba(255, 0, 64, 0.3);\n            }\n\n            /* High score styling - distinct golden appearance */\n            .high-score {\n                top: 70%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                color: #ffd700;\n                font-size: 1.8em;\n                text-shadow: \n                    0 0 8px rgba(255, 215, 0, 0.9),\n                    0 0 16px rgba(255, 215, 0, 0.6),\n                    0 0 24px rgba(255, 215, 0, 0.3),\n                    2px 2px 0px rgba(0, 0, 0, 0.9);\n                background: rgba(0, 0, 0, 0.5);\n                padding: 12px 20px;\n                border-radius: 8px;\n                border: 2px solid rgba(255, 215, 0, 0.5);\n                backdrop-filter: blur(2px);\n            }\n\n            /* New high score message - animated and prominent */\n            .new-high-score {\n                top: 75%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                color: #ffff00;\n                font-size: 2.2em;\n                text-shadow: \n                    0 0 10px rgba(255, 255, 0, 1),\n                    0 0 20px rgba(255, 255, 0, 0.8),\n                    0 0 30px rgba(255, 255, 0, 0.6),\n                    3px 3px 0px rgba(0, 0, 0, 0.9);\n                background: rgba(0, 0, 0, 0.6);\n                padding: 15px 25px;\n                border-radius: 10px;\n                border: 3px solid rgba(255, 255, 0, 0.7);\n                animation: pulse 1.5s ease-in-out infinite;\n                backdrop-filter: blur(3px);\n            }\n\n            /* Pulse animation for new high score */\n            @keyframes pulse {\n                0% { \n                    opacity: 1; \n                    transform: translate(-50%, -50%) scale(1);\n                    box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);\n                }\n                50% { \n                    opacity: 0.8; \n                    transform: translate(-50%, -50%) scale(1.05);\n                    box-shadow: 0 0 30px rgba(255, 255, 0, 0.8);\n                }\n                100% { \n                    opacity: 1; \n                    transform: translate(-50%, -50%) scale(1);\n                    box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);\n                }\n            }\n\n            /* Mobile responsive styles */\n            @media (max-width: 768px) {\n                .player-score, .ai-score {\n                    font-size: 1.5em;\n                    top: 10px;\n                    padding: 6px 10px;\n                }\n                \n                .player-score {\n                    left: 10px;\n                }\n                \n                .ai-score {\n                    right: 10px;\n                }\n                \n                .high-score {\n                    font-size: 1.4em;\n                    padding: 10px 16px;\n                }\n                \n                .new-high-score {\n                    font-size: 1.8em;\n                    padding: 12px 20px;\n                }\n            }\n\n            /* Extra small screens */\n            @media (max-width: 480px) {\n                .player-score, .ai-score {\n                    font-size: 1.2em;\n                    top: 5px;\n                    padding: 4px 8px;\n                }\n                \n                .player-score {\n                    left: 5px;\n                }\n                \n                .ai-score {\n                    right: 5px;\n                }\n                \n                .high-score {\n                    font-size: 1.2em;\n                    padding: 8px 12px;\n                    top: 65%;\n                }\n                \n                .new-high-score {\n                    font-size: 1.5em;\n                    padding: 10px 16px;\n                    top: 72%;\n                }\n            }\n\n            /* High contrast mode support */\n            @media (prefers-contrast: high) {\n                .player-score {\n                    background: rgba(0, 0, 0, 0.8);\n                    border: 2px solid #00ff41;\n                }\n                \n                .ai-score {\n                    background: rgba(0, 0, 0, 0.8);\n                    border: 2px solid #ff0040;\n                }\n                \n                .high-score {\n                    background: rgba(0, 0, 0, 0.9);\n                    border: 3px solid #ffd700;\n                }\n                \n                .new-high-score {\n                    background: rgba(0, 0, 0, 0.9);\n                    border: 4px solid #ffff00;\n                }\n            }\n\n            /* Reduced motion support */\n            @media (prefers-reduced-motion: reduce) {\n                .new-high-score {\n                    animation: none;\n                }\n            }\n\n            /* Touch device optimizations */\n            @media (hover: none) and (pointer: coarse) {\n                .score-display {\n                    /* Ensure scores don't interfere with touch controls */\n                    pointer-events: none;\n                }\n                \n                /* Adjust positioning to avoid touch control areas */\n                .player-score {\n                    top: 15px;\n                    left: 15px;\n                }\n                \n                .ai-score {\n                    top: 15px;\n                    right: 15px;\n                }\n            }\n        "),
            document.head.appendChild(e));
    }
    updateGameplayScores(e, t) {
        (this.isInitialized || this.createScoreElements(),
            (this.scoreElements.playerScore.textContent = `Player: ${e}`),
            (this.scoreElements.playerScore.style.display = 'block'),
            (this.scoreElements.aiScore.textContent = `AI: ${t}`),
            (this.scoreElements.aiScore.style.display = 'block'),
            (this.scoreElements.highScore.style.display = 'none'),
            (this.scoreElements.newHighScore.style.display = 'none'),
            this.positionScoreElements());
    }
    showGameOverScores(e, t, i, r) {
        (this.isInitialized || this.createScoreElements(),
            (this.scoreElements.playerScore.textContent = `Player: ${e}`),
            (this.scoreElements.playerScore.style.display = 'block'),
            (this.scoreElements.aiScore.textContent = `AI: ${t}`),
            (this.scoreElements.aiScore.style.display = 'block'),
            (this.scoreElements.highScore.textContent = `High Score: ${i}`),
            (this.scoreElements.highScore.style.display = 'block'),
            r
                ? ((this.scoreElements.newHighScore.textContent = 'New High Score!'),
                  (this.scoreElements.newHighScore.style.display = 'block'))
                : (this.scoreElements.newHighScore.style.display = 'none'),
            this.positionScoreElements());
    }
    hideScores() {
        this.isInitialized &&
            Object.values(this.scoreElements).forEach((e) => {
                e && e.style && (e.style.display = 'none');
            });
    }
    positionScoreElements() {
        if (!this.isInitialized) return;
        const e = document.getElementById('controls');
        if (e && window.innerWidth < 768) {
            const t = e.getBoundingClientRect(),
                i = window.innerHeight;
            t.top < 0.3 * i && (this.scoreElements.aiScore.style.top = '60px');
        }
        (window.innerWidth < 320 &&
            ((this.scoreElements.playerScore.style.fontSize = '1em'),
            (this.scoreElements.aiScore.style.fontSize = '1em')),
            window.innerHeight < 400 &&
                ((this.scoreElements.highScore.style.top = '60%'),
                (this.scoreElements.newHighScore.style.top = '68%')));
    }
    destroy() {
        Object.values(this.scoreElements).forEach((e) => {
            e && e.parentNode && e.parentNode.removeChild(e);
        });
        const e = document.getElementById('scoreDisplayStyles');
        (e && e.parentNode && e.parentNode.removeChild(e),
            (this.scoreElements = {}),
            (this.isInitialized = !1));
    }
};
(window.addEventListener('resize', () => {
    const e = window.scoreDisplayInstance;
    e && e.positionScoreElements && e.positionScoreElements();
    const t = window.glowEffectManager;
    t && t.handleResize && t.handleResize(window.innerWidth, window.innerHeight);
}),
    (module$S.exports = { ScoreDisplay: ScoreDisplay$2 }));
const __CJS__export_default__$R =
        (null == module$S.exports ? {} : module$S.exports).default || module$S.exports,
    __CJS__import__9__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$R },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$R = { exports: {} };
const { Logger: Logger$d } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$t = Logger$d.create('DifficultyManager'),
    DIFFICULTY_CONFIGS = {
        easy: {
            turnThreshold: 15,
            randomTurnChance: 0.05,
            gameSpeed: 0.08,
            description: 'Slower AI, more predictable behavior',
        },
        medium: {
            turnThreshold: 10,
            randomTurnChance: 0.02,
            gameSpeed: 0.1,
            description: 'Balanced gameplay experience',
        },
        hard: {
            turnThreshold: 8,
            randomTurnChance: 0.01,
            gameSpeed: 0.12,
            description: 'Faster AI, more challenging gameplay',
        },
    };
let DifficultyManager$2 = class {
    constructor(e, t) {
        ((this.game = e),
            (this.aiController = t),
            (this.currentDifficulty = 'medium'),
            (this.storageKey = 'lightbikes_difficulty'),
            this.validateAllConfigurations() ||
                logger$t.warn('Difficulty system initialized with invalid configurations'),
            e &&
                'object' != typeof e &&
                logger$t.warn('Invalid game parameter provided to DifficultyManager'),
            t &&
                'object' != typeof t &&
                logger$t.warn('Invalid aiController parameter provided to DifficultyManager'),
            this.loadFromStorage(),
            this.applyToGame(),
            this.applyToAI());
    }
    setDifficulty(e) {
        ('string' != typeof e
            ? (logger$t.warn(`Invalid difficulty type: ${typeof e}, expected string. Using medium`),
              (e = 'medium'))
            : (e = e.trim().toLowerCase()),
            DIFFICULTY_CONFIGS[e] ||
                (logger$t.warn(
                    `Invalid difficulty level: "${e}", using medium. Valid options: ${Object.keys(DIFFICULTY_CONFIGS).join(', ')}`
                ),
                (e = 'medium')));
        const t = DIFFICULTY_CONFIGS[e];
        (this._validateDifficultyConfig(t, e) ||
            (logger$t.warn(`Invalid configuration for difficulty "${e}", falling back to medium`),
            (e = 'medium')),
            (this.currentDifficulty = e));
        try {
            (this.applyToGame(), this.applyToAI());
        } catch (i) {
            logger$t.warn(`Error applying difficulty settings for "${e}":`, i);
        }
        this.saveToStorage();
    }
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }
    getDifficultyConfig(e = null) {
        let t = e || this.currentDifficulty;
        null !== e &&
            ('string' != typeof e
                ? (logger$t.warn(
                      `Invalid difficulty type in getDifficultyConfig: ${typeof e}, using current difficulty`
                  ),
                  (t = this.currentDifficulty))
                : (t = e.trim().toLowerCase()));
        const i = DIFFICULTY_CONFIGS[t];
        return i
            ? this._validateDifficultyConfig(i, t)
                ? i
                : (logger$t.warn(`Invalid configuration structure for "${t}", using medium`),
                  DIFFICULTY_CONFIGS.medium)
            : (logger$t.warn(`Configuration not found for difficulty "${t}", using medium`),
              DIFFICULTY_CONFIGS.medium);
    }
    applyToGame() {
        if (this.game)
            if ('function' == typeof this.game.setGameSpeed)
                try {
                    const e = this.getDifficultyConfig();
                    'number' != typeof e.gameSpeed || e.gameSpeed <= 0 || e.gameSpeed > 1
                        ? (logger$t.warn(
                              `Invalid game speed value: ${e.gameSpeed}, using default 0.1`
                          ),
                          this.game.setGameSpeed(0.1))
                        : this.game.setGameSpeed(e.gameSpeed);
                } catch (e) {
                    logger$t.warn('Error applying game speed settings:', e);
                    try {
                        this.game.setGameSpeed(0.1);
                    } catch (t) {
                        logger$t.warn('Failed to set fallback game speed:', t);
                    }
                }
            else
                logger$t.warn(
                    'Game instance missing setGameSpeed method, cannot apply speed settings'
                );
        else logger$t.warn('Game instance not available, cannot apply difficulty settings');
    }
    applyToAI() {
        if (this.aiController)
            try {
                const e = this.getDifficultyConfig();
                (('number' != typeof e.turnThreshold || e.turnThreshold <= 0) &&
                    (logger$t.warn(
                        `Invalid turnThreshold value: ${e.turnThreshold}, using default 10`
                    ),
                    (e.turnThreshold = 10)),
                    ('number' != typeof e.randomTurnChance ||
                        e.randomTurnChance < 0 ||
                        e.randomTurnChance > 1) &&
                        (logger$t.warn(
                            `Invalid randomTurnChance value: ${e.randomTurnChance}, using default 0.02`
                        ),
                        (e.randomTurnChance = 0.02)),
                    (this.aiController.difficultyConfig = e));
            } catch (e) {
                logger$t.warn('Error applying AI difficulty settings:', e);
                try {
                    this.aiController.difficultyConfig = {
                        turnThreshold: 10,
                        randomTurnChance: 0.02,
                        gameSpeed: 0.1,
                        description: 'Default fallback configuration',
                    };
                } catch (t) {
                    logger$t.warn('Failed to set fallback AI configuration:', t);
                }
            }
        else logger$t.warn('AI controller not available, cannot apply difficulty settings');
    }
    saveToStorage() {
        try {
            if ('undefined' == typeof Storage || !window.localStorage)
                return void logger$t.warn(
                    'localStorage not available, cannot save difficulty setting'
                );
            if (!this.currentDifficulty || !DIFFICULTY_CONFIGS[this.currentDifficulty])
                return void logger$t.warn(
                    `Invalid current difficulty "${this.currentDifficulty}", cannot save`
                );
            const t = {
                    selectedDifficulty: this.currentDifficulty,
                    timestamp: Date.now(),
                    version: '1.0',
                },
                i = JSON.stringify(t);
            try {
                localStorage.setItem(this.storageKey, i);
            } catch (e) {
                if ('QuotaExceededError' !== e.name && 'NS_ERROR_DOM_QUOTA_REACHED' !== e.name)
                    throw e;
                logger$t.warn('localStorage quota exceeded, cannot save difficulty setting');
            }
        } catch (t) {
            logger$t.warn('Failed to save difficulty setting:', t);
        }
    }
    loadFromStorage() {
        try {
            if ('undefined' == typeof Storage || !window.localStorage)
                return void logger$t.warn('localStorage not available, using default difficulty');
            const t = localStorage.getItem(this.storageKey);
            if (!t) return;
            let i;
            try {
                i = JSON.parse(t);
            } catch (e) {
                return (
                    logger$t.warn('Failed to parse stored difficulty data, using default:', e),
                    void this._clearCorruptedStorage()
                );
            }
            if (!i || 'object' != typeof i)
                return (
                    logger$t.warn('Invalid stored difficulty data structure, using default'),
                    void this._clearCorruptedStorage()
                );
            i.selectedDifficulty &&
            'string' == typeof i.selectedDifficulty &&
            DIFFICULTY_CONFIGS[i.selectedDifficulty.toLowerCase()]
                ? (this.currentDifficulty = i.selectedDifficulty.toLowerCase())
                : (logger$t.warn(
                      `Invalid stored difficulty "${i.selectedDifficulty}", using default`
                  ),
                  this._clearCorruptedStorage());
        } catch (t) {
            logger$t.warn('Failed to load difficulty setting:', t);
        }
    }
    getAllDifficulties() {
        try {
            return JSON.parse(JSON.stringify(DIFFICULTY_CONFIGS));
        } catch (e) {
            return (
                logger$t.warn('Error creating difficulty configurations copy:', e),
                {
                    easy: {
                        turnThreshold: 15,
                        randomTurnChance: 0.05,
                        gameSpeed: 0.08,
                        description: 'Easy mode',
                    },
                    medium: {
                        turnThreshold: 10,
                        randomTurnChance: 0.02,
                        gameSpeed: 0.1,
                        description: 'Medium mode',
                    },
                    hard: {
                        turnThreshold: 8,
                        randomTurnChance: 0.01,
                        gameSpeed: 0.12,
                        description: 'Hard mode',
                    },
                }
            );
        }
    }
    _validateDifficultyConfig(e, t) {
        if (!e || 'object' != typeof e)
            return (logger$t.warn(`Configuration for "${t}" is not an object`), !1);
        const i = ['turnThreshold', 'randomTurnChance', 'gameSpeed', 'description'];
        for (const r of i)
            if (!(r in e))
                return (
                    logger$t.warn(`Configuration for "${t}" missing required property: ${r}`),
                    !1
                );
        return 'number' != typeof e.turnThreshold || e.turnThreshold <= 0
            ? (logger$t.warn(`Invalid turnThreshold for "${t}": ${e.turnThreshold}`), !1)
            : 'number' != typeof e.randomTurnChance ||
                e.randomTurnChance < 0 ||
                e.randomTurnChance > 1
              ? (logger$t.warn(`Invalid randomTurnChance for "${t}": ${e.randomTurnChance}`), !1)
              : 'number' != typeof e.gameSpeed || e.gameSpeed <= 0 || e.gameSpeed > 1
                ? (logger$t.warn(`Invalid gameSpeed for "${t}": ${e.gameSpeed}`), !1)
                : ('string' == typeof e.description && 0 !== e.description.trim().length) ||
                  (logger$t.warn(`Invalid description for "${t}": ${e.description}`), !1);
    }
    _clearCorruptedStorage() {
        try {
            'undefined' != typeof Storage &&
                window.localStorage &&
                localStorage.removeItem(this.storageKey);
        } catch (e) {
            logger$t.warn('Failed to clear corrupted storage:', e);
        }
    }
    validateAllConfigurations() {
        const e = Object.keys(DIFFICULTY_CONFIGS);
        let t = !0;
        for (const i of e) this._validateDifficultyConfig(DIFFICULTY_CONFIGS[i], i) || (t = !1);
        return (
            t ||
                logger$t.warn(
                    'Some difficulty configurations are invalid. Game may not function correctly.'
                ),
            t
        );
    }
};
module$R.exports = {
    DifficultyManager: DifficultyManager$2,
    DIFFICULTY_CONFIGS: DIFFICULTY_CONFIGS,
};
const __CJS__export_default__$Q =
        (null == module$R.exports ? {} : module$R.exports).default || module$R.exports,
    __CJS__import__11__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$Q },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$Q = { exports: {} };
const { Logger: Logger$c } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$s = new Logger$c('PowerUpManager');
class PowerUpObjectPool {
    constructor() {
        ((this.pool = []), (this.maxPoolSize = 10));
    }
    acquire(e, t, i) {
        let r;
        return (
            this.pool.length > 0
                ? ((r = this.pool.pop()),
                  (r.id = e),
                  (r.type = t),
                  (r.position = __spreadValues({}, i)),
                  (r.appearance = __spreadValues({}, POWER_UP_TYPES[t].appearance)),
                  (r.spawnTime = Date.now()),
                  (r.maxLifetime = SPAWN_CONFIG.powerUpLifetime),
                  (r.collected = !1))
                : (r = new PowerUpEntity(e, t, i)),
            r
        );
    }
    release(e) {
        this.pool.length < this.maxPoolSize &&
            ((e.id = null),
            (e.type = null),
            (e.position = null),
            (e.appearance = null),
            (e.collected = !1),
            this.pool.push(e));
    }
    clear() {
        this.pool.length = 0;
    }
}
class SpatialGrid {
    constructor(e, t) {
        ((this.arenaSize = e),
            (this.gridSize = t),
            (this.cellSize = e / t),
            (this.grid = new Map()),
            (this.entityPositions = new Map()));
    }
    getCellKey(e, t) {
        return `${Math.floor((e + this.arenaSize / 2) / this.cellSize)},${Math.floor((t + this.arenaSize / 2) / this.cellSize)}`;
    }
    addEntity(e, t, i) {
        const r = this.getCellKey(t, i);
        (this.grid.has(r) || this.grid.set(r, new Set()),
            this.grid.get(r).add(e),
            this.entityPositions.set(e, { x: t, z: i, cellKey: r }));
    }
    removeEntity(e) {
        const t = this.entityPositions.get(e);
        if (t) {
            const i = this.grid.get(t.cellKey);
            (i && (i.delete(e), 0 === i.size && this.grid.delete(t.cellKey)),
                this.entityPositions.delete(e));
        }
    }
    getNearbyEntities(e, t, i) {
        const r = new Set(),
            n = Math.ceil(i / this.cellSize),
            s = Math.floor((e + this.arenaSize / 2) / this.cellSize),
            a = Math.floor((t + this.arenaSize / 2) / this.cellSize);
        for (let o = -n; o <= n; o++)
            for (let e = -n; e <= n; e++) {
                const t = `${s + o},${a + e}`,
                    i = this.grid.get(t);
                if (i) for (const e of i) r.add(e);
            }
        return r;
    }
    updateEntity(e, t, i) {
        (this.removeEntity(e), this.addEntity(e, t, i));
    }
    clear() {
        (this.grid.clear(), this.entityPositions.clear());
    }
}
const POWER_UP_TYPES = {
        SPEED_BOOST: {
            type: 'speed',
            appearance: { shape: 'cube', color: 26367, glow: !0, size: { x: 0.8, y: 0.8, z: 0.8 } },
            effect: { multiplier: 2, duration: 3e3 },
            spawnWeight: 25,
        },
        SHIELD: {
            type: 'shield',
            appearance: { shape: 'sphere', color: 16766720, glow: !0, size: { radius: 0.6 } },
            effect: { protection: 1, duration: -1 },
            spawnWeight: 20,
        },
        TRAIL_ERASER: {
            type: 'eraser',
            appearance: {
                shape: 'diamond',
                color: 10040012,
                glow: !0,
                size: { x: 0.8, y: 0.8, z: 0.8 },
            },
            effect: { segments: 10, duration: 0 },
            spawnWeight: 30,
        },
        GHOST_MODE: {
            type: 'ghost',
            appearance: {
                shape: 'cube',
                color: 16777215,
                opacity: 0.7,
                size: { x: 0.8, y: 0.8, z: 0.8 },
            },
            effect: { phaseThrough: !0, duration: 3e3 },
            spawnWeight: 25,
        },
    },
    SPAWN_CONFIG = {
        maxActivePowerUps: 3,
        spawnInterval: { min: 15e3, max: 2e4 },
        minDistanceFromBoundary: 5,
        minDistanceFromPlayers: 3,
        minDistanceFromTrails: 1,
        powerUpLifetime: 3e4,
        collectionRadius: 0.5,
    };
class PowerUpEntity {
    constructor(e, t, i) {
        ((this.id = e),
            (this.type = t),
            (this.position = __spreadValues({}, i)),
            (this.appearance = __spreadValues({}, POWER_UP_TYPES[t].appearance)),
            (this.spawnTime = Date.now()),
            (this.maxLifetime = SPAWN_CONFIG.powerUpLifetime),
            (this.collected = !1));
    }
    isExpired() {
        return Date.now() - this.spawnTime > this.maxLifetime;
    }
    getTypeConfig() {
        return POWER_UP_TYPES[this.type];
    }
}
class ActiveEffect {
    constructor(e, t, i, r, n = {}) {
        ((this.playerId = e),
            (this.type = t),
            (this.startTime = i),
            (this.duration = r),
            (this.data = __spreadValues({}, n)));
    }
    isExpired() {
        return -1 !== this.duration && Date.now() - this.startTime > this.duration;
    }
    getRemainingTime() {
        if (-1 === this.duration) return -1;
        const e = Date.now() - this.startTime;
        return Math.max(0, this.duration - e);
    }
}
let PowerUpManager$2 = class {
    constructor(e, t, i, r = null) {
        ((this.game = e),
            (this.renderer = t),
            (this.collisionDetector = i),
            (this.audioManager = r),
            (this.activePowerUps = new Map()),
            (this.nextPowerUpId = 1),
            (this.activeEffects = new Map()),
            (this.lastSpawnTime = 0),
            (this.nextSpawnDelay = this.calculateNextSpawnDelay()),
            (this.lastSpawnedTypes = []),
            (this.maxRecentTypes = 2),
            (this.objectPool = new PowerUpObjectPool()),
            (this.spatialGrid = new SpatialGrid(60, 8)),
            (this.lastCollectionCheck = 0),
            (this.collectionCheckInterval = 16),
            (this.cleanupCounter = 0),
            (this.cleanupInterval = 300),
            this.activeEffects.set('player', []),
            this.activeEffects.set('ai', []),
            (this.enabled = !0));
    }
    calculateNextSpawnDelay() {
        const { min: e, max: t } = SPAWN_CONFIG.spawnInterval;
        return e + Math.random() * (t - e);
    }
    static getPowerUpTypes() {
        return POWER_UP_TYPES;
    }
    static getSpawnConfig() {
        return SPAWN_CONFIG;
    }
    getActivePowerUps() {
        return Array.from(this.activePowerUps.values());
    }
    getActiveEffects(e) {
        return this.activeEffects.get(e) || [];
    }
    getAllActiveEffects() {
        const e = {};
        for (const [t, i] of this.activeEffects) e[t] = [...i];
        return e;
    }
    update(e) {
        const t = Date.now();
        (this.updateSpawning(t),
            this.removeExpiredPowerUps(),
            this.removeExpiredEffects(),
            this.cleanupCounter++,
            this.cleanupCounter >= this.cleanupInterval &&
                (this.performPeriodicCleanup(), (this.cleanupCounter = 0)),
            this.updateRenderer());
    }
    performPeriodicCleanup() {
        if (this.objectPool.pool.length > this.objectPool.maxPoolSize) {
            const e = this.objectPool.pool.length - this.objectPool.maxPoolSize;
            this.objectPool.pool.splice(0, e);
        }
        for (const [e, t] of this.spatialGrid.grid) 0 === t.size && this.spatialGrid.grid.delete(e);
        logger$s.debug(
            'Performed periodic cleanup - object pool size:',
            this.objectPool.pool.length
        );
    }
    updateSpawning(e) {
        const t = e - this.lastSpawnTime >= this.nextSpawnDelay,
            i = this.activePowerUps.size < SPAWN_CONFIG.maxActivePowerUps;
        t &&
            i &&
            (this.attemptSpawn(),
            (this.lastSpawnTime = e),
            (this.nextSpawnDelay = this.calculateNextSpawnDelay()));
    }
    attemptSpawn() {
        const e = this.game.getGameState();
        for (let t = 0; t < 10; t++) {
            const t = this.generateRandomPosition(e.bounds);
            if (this.isValidSpawnPosition(t, e)) {
                const e = this.selectRandomPowerUpType();
                return (this.spawnPowerUp(e, t), !0);
            }
        }
        return (logger$s.debug('Could not find valid spawn position after 10 attempts'), !1);
    }
    generateRandomPosition(e) {
        const t = -e + SPAWN_CONFIG.minDistanceFromBoundary,
            i = e - SPAWN_CONFIG.minDistanceFromBoundary;
        return { x: t + Math.random() * (i - t), y: 0, z: t + Math.random() * (i - t) };
    }
    isValidSpawnPosition(e, t) {
        const i = this.calculateDistance(e, t.player),
            r = this.calculateDistance(e, t.ai);
        if (i < SPAWN_CONFIG.minDistanceFromPlayers || r < SPAWN_CONFIG.minDistanceFromPlayers)
            return !1;
        if (this.isTooCloseToTrails(e, t.playerTrail) || this.isTooCloseToTrails(e, t.aiTrail))
            return !1;
        for (const n of this.activePowerUps.values()) {
            if (this.calculateDistance(e, n.position) < SPAWN_CONFIG.minDistanceFromPlayers)
                return !1;
        }
        return !0;
    }
    isTooCloseToTrails(e, t) {
        const i = SPAWN_CONFIG.minDistanceFromTrails;
        for (const r of t)
            if (r && 'number' == typeof r.x && 'number' == typeof r.z) {
                if (this.calculateDistance(e, r) < i) return !0;
            }
        return !1;
    }
    calculateDistance(e, t) {
        const i = e.x - t.x,
            r = (e.y || 0) - (t.y || 0),
            n = e.z - t.z;
        return Math.sqrt(i * i + r * r + n * n);
    }
    selectRandomPowerUpType() {
        const e = Object.keys(POWER_UP_TYPES);
        let t = e.filter((e) => !this.lastSpawnedTypes.includes(e));
        0 === t.length && (t = e);
        const i = t.map((e) => POWER_UP_TYPES[e].spawnWeight),
            r = i.reduce((e, t) => e + t, 0);
        let n = Math.random() * r;
        for (let a = 0; a < t.length; a++)
            if (((n -= i[a]), n <= 0)) {
                const e = t[a];
                return (
                    this.lastSpawnedTypes.push(e),
                    this.lastSpawnedTypes.length > this.maxRecentTypes &&
                        this.lastSpawnedTypes.shift(),
                    e
                );
            }
        const s = t[0];
        return (
            this.lastSpawnedTypes.push(s),
            this.lastSpawnedTypes.length > this.maxRecentTypes && this.lastSpawnedTypes.shift(),
            s
        );
    }
    spawnPowerUp(e, t) {
        const i = 'powerup_' + this.nextPowerUpId++,
            r = this.objectPool.acquire(i, e, t);
        return (
            this.activePowerUps.set(i, r),
            this.spatialGrid.addEntity(i, t.x, t.z),
            logger$s.debug(`Spawned ${e} power-up at`, t),
            r
        );
    }
    removeExpiredPowerUps() {
        const e = [];
        for (const [t, i] of this.activePowerUps) i.isExpired() && e.push(t);
        for (const t of e) {
            const e = this.activePowerUps.get(t);
            e &&
                (this.spatialGrid.removeEntity(t),
                this.objectPool.release(e),
                this.activePowerUps.delete(t),
                logger$s.debug(`Removed expired power-up: ${t}`));
        }
    }
    removeExpiredEffects() {
        for (const [e, t] of this.activeEffects) {
            const i = [];
            for (const r of t)
                r.isExpired()
                    ? this.handleEffectExpiration(e, r)
                    : 'SHIELD' === r.type && r.data.consumed
                      ? logger$s.debug(`Removing consumed shield for ${e}`)
                      : i.push(r);
            this.activeEffects.set(e, i);
        }
    }
    handleEffectExpiration(e, t) {
        switch (t.type) {
            case 'SPEED_BOOST':
                logger$s.debug(`Speed boost expired for ${e}`);
                break;
            case 'GHOST_MODE':
                logger$s.debug(`Ghost mode expired for ${e}`);
                break;
            case 'SHIELD':
                logger$s.debug(`Shield expired for ${e}`);
                break;
            default:
                logger$s.debug(`Effect ${t.type} expired for ${e}`);
        }
    }
    checkCollections(e) {
        const t = [],
            i = Date.now();
        if (e.isPaused || e.gameOver) return t;
        if (i - this.lastCollectionCheck < this.collectionCheckInterval) return t;
        this.lastCollectionCheck = i;
        const r = this.checkPlayerCollectionsOptimized('player', e.player);
        t.push(...r);
        const n = this.checkPlayerCollectionsOptimized('ai', e.ai);
        t.push(...n);
        for (const s of t) this.processCollection(s);
        return t;
    }
    checkPlayerCollectionsOptimized(e, t) {
        const i = [];
        if (!t || 'number' != typeof t.x || 'number' != typeof t.z) return i;
        const r = this.spatialGrid.getNearbyEntities(t.x, t.z, 2 * SPAWN_CONFIG.collectionRadius);
        for (const n of r) {
            const r = this.activePowerUps.get(n);
            if (!r || r.collected) continue;
            const s = t.x - r.position.x,
                a = t.z - r.position.z,
                o = s * s + a * a;
            o <= SPAWN_CONFIG.collectionRadius * SPAWN_CONFIG.collectionRadius &&
                ((r.collected = !0),
                i.push({
                    playerId: e,
                    powerUpId: n,
                    powerUpType: r.type,
                    position: __spreadValues({}, r.position),
                    collectionTime: Date.now(),
                }),
                logger$s.debug(
                    `Player ${e} collected ${r.type} power-up at distance ${Math.sqrt(o).toFixed(2)}`
                ));
        }
        return i;
    }
    checkPlayerCollections(e, t) {
        const i = [];
        if (!t || 'number' != typeof t.x || 'number' != typeof t.z) return i;
        for (const [r, n] of this.activePowerUps) {
            if (n.collected) continue;
            const s = this.calculateDistance(t, n.position);
            s <= SPAWN_CONFIG.collectionRadius &&
                ((n.collected = !0),
                i.push({
                    playerId: e,
                    powerUpId: r,
                    powerUpType: n.type,
                    position: __spreadValues({}, n.position),
                    collectionTime: Date.now(),
                }),
                logger$s.debug(
                    `Player ${e} collected ${n.type} power-up at distance ${s.toFixed(2)}`
                ));
        }
        return i;
    }
    processCollection(e) {
        const { playerId: t, powerUpId: i, powerUpType: r } = e;
        if (this.applyEffect(t, r)) (this.removePowerUp(i), this.triggerCollectionFeedback(e));
        else {
            const e = this.activePowerUps.get(i);
            e && (e.collected = !1);
        }
    }
    triggerCollectionFeedback(e) {
        (logger$s.debug(`Collection feedback triggered for ${e.powerUpType} by ${e.playerId}`),
            this.audioManager &&
                'function' == typeof this.audioManager.playPowerUpCollectionSound &&
                this.audioManager.playPowerUpCollectionSound(),
            this.renderer &&
                'function' == typeof this.renderer.createCollectionEffect &&
                this.renderer.createCollectionEffect(e.position, e.powerUpType),
            this.renderer &&
                'function' == typeof this.renderer.displayCollectionNotification &&
                this.renderer.displayCollectionNotification(e.powerUpType, e.position));
    }
    applyEffect(e, t, i = {}) {
        const r = POWER_UP_TYPES[t];
        if (!r) return (logger$s.warn(`Unknown power-up type: ${t}`), !1);
        const n = Date.now();
        this.handleEffectStacking(e, t);
        let s = !1;
        switch (t) {
            case 'SPEED_BOOST':
                s = this.applySpeedBoostEffect(e, n, r);
                break;
            case 'SHIELD':
                s = this.applyShieldEffect(e, n, r);
                break;
            case 'TRAIL_ERASER':
                s = this.applyTrailEraserEffect(e, n, r);
                break;
            case 'GHOST_MODE':
                s = this.applyGhostModeEffect(e, n, r);
                break;
            default:
                return (logger$s.warn(`Unhandled power-up type: ${t}`), !1);
        }
        return (s && logger$s.debug(`Applied ${t} effect to ${e}`), s);
    }
    handleEffectStacking(e, t) {
        const i = this.activeEffects.get(e) || [];
        if ('SPEED_BOOST' === t || 'GHOST_MODE' === t) {
            const r = i.filter((e) => e.type !== t);
            this.activeEffects.set(e, r);
        }
    }
    applySpeedBoostEffect(e, t, i) {
        const r = new ActiveEffect(e, 'SPEED_BOOST', t, i.effect.duration, {
                multiplier: i.effect.multiplier,
                originalSpeed: null,
            }),
            n = this.activeEffects.get(e) || [];
        return (n.push(r), this.activeEffects.set(e, n), !0);
    }
    applyShieldEffect(e, t, i) {
        const r = new ActiveEffect(e, 'SHIELD', t, i.effect.duration, {
                protection: i.effect.protection,
                consumed: !1,
            }),
            n = this.activeEffects.get(e) || [];
        return (n.push(r), this.activeEffects.set(e, n), !0);
    }
    applyTrailEraserEffect(e, t, i) {
        const r = this.game.getGameState();
        let n;
        if ('player' === e) n = r.playerTrail;
        else {
            if ('ai' !== e) return (logger$s.warn(`Unknown player ID for trail eraser: ${e}`), !1);
            n = r.aiTrail;
        }
        const s = Math.min(i.effect.segments, n.length);
        return (
            s > 0 && (n.splice(-s, s), logger$s.debug(`Removed ${s} trail segments for ${e}`)),
            !0
        );
    }
    applyGhostModeEffect(e, t, i) {
        const r = new ActiveEffect(e, 'GHOST_MODE', t, i.effect.duration, {
                phaseThrough: i.effect.phaseThrough,
                originalOpacity: null,
            }),
            n = this.activeEffects.get(e) || [];
        return (n.push(r), this.activeEffects.set(e, n), !0);
    }
    hasActiveEffect(e, t) {
        return (this.activeEffects.get(e) || []).some((e) => e.type === t && !e.isExpired());
    }
    getActiveEffectsOfType(e, t) {
        return (this.activeEffects.get(e) || []).filter((e) => e.type === t && !e.isExpired());
    }
    consumeShield(e) {
        const t = this.activeEffects.get(e) || [],
            i = t.findIndex((e) => 'SHIELD' === e.type && !e.isExpired() && !e.data.consumed);
        return (
            -1 !== i && ((t[i].data.consumed = !0), logger$s.debug(`Shield consumed for ${e}`), !0)
        );
    }
    getSpeedMultiplier(e) {
        const t = this.getActiveEffectsOfType(e, 'SPEED_BOOST');
        if (t.length > 0) {
            return t[t.length - 1].data.multiplier;
        }
        return 1;
    }
    isInGhostMode(e) {
        return this.hasActiveEffect(e, 'GHOST_MODE');
    }
    hasShieldProtection(e) {
        return this.getActiveEffectsOfType(e, 'SHIELD').some((e) => !e.data.consumed);
    }
    removePowerUp(e) {
        const t = this.activePowerUps.get(e);
        return (
            !!t &&
            (this.spatialGrid.removeEntity(e),
            this.objectPool.release(t),
            this.activePowerUps.delete(e),
            logger$s.debug(`Removed collected power-up: ${e}`),
            !0)
        );
    }
    getPowerUpsForRendering() {
        return Array.from(this.activePowerUps.values())
            .filter((e) => !e.collected)
            .map((e) => ({
                id: e.id,
                type: e.type,
                position: e.position,
                appearance: e.appearance,
            }));
    }
    updateRenderer() {
        if (this.renderer && 'function' == typeof this.renderer.registerPowerUps) {
            const e = this.getPowerUpsForRendering();
            this.renderer.registerPowerUps(e);
        }
    }
    handlePause() {}
    handleResume() {}
    getDebugInfo() {
        return {
            activePowerUps: this.activePowerUps.size,
            maxPowerUps: SPAWN_CONFIG.maxActivePowerUps,
            nextSpawnIn: Math.max(0, this.nextSpawnDelay - (Date.now() - this.lastSpawnTime)),
            activeEffects: Object.fromEntries(
                Array.from(this.activeEffects.entries()).map(([e, t]) => [
                    e,
                    t.map((e) => ({ type: e.type, remaining: e.getRemainingTime() })),
                ])
            ),
        };
    }
    reset() {
        for (const [e, t] of this.activePowerUps) this.objectPool.release(t);
        this.activePowerUps.clear();
        for (const e of this.activeEffects.keys()) this.activeEffects.set(e, []);
        (this.spatialGrid.clear(),
            this.renderer &&
                'function' == typeof this.renderer.clearPowerUps &&
                this.renderer.clearPowerUps(),
            (this.lastSpawnTime = 0),
            (this.nextSpawnDelay = this.calculateNextSpawnDelay()),
            (this.nextPowerUpId = 1),
            (this.lastSpawnedTypes = []),
            (this.lastCollectionCheck = 0),
            (this.cleanupCounter = 0),
            logger$s.debug('PowerUpManager reset completed - all power-ups and effects cleared'));
    }
};
module$Q.exports = {
    PowerUpManager: PowerUpManager$2,
    PowerUpEntity: PowerUpEntity,
    ActiveEffect: ActiveEffect,
    POWER_UP_TYPES: POWER_UP_TYPES,
    SPAWN_CONFIG: SPAWN_CONFIG,
};
const __CJS__export_default__$P =
        (null == module$Q.exports ? {} : module$Q.exports).default || module$Q.exports,
    __CJS__import__12__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$P },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$P = { exports: {} };
const { logger: logger$r } = __CJS__export_default__$1a || __CJS__import__50__;
let StatusIndicator$2 = class {
    constructor() {
        ((this.container = null),
            (this.activeIndicators = new Map()),
            (this.initialized = !1),
            (this.powerUpUIConfig = {
                SPEED_BOOST: { icon: '⚡', color: '#0066ff', name: 'Speed Boost', showTimer: !0 },
                SHIELD: { icon: '🛡️', color: '#ffd700', name: 'Shield', showTimer: !1 },
                TRAIL_ERASER: { icon: '🗑️', color: '#9932cc', name: 'Trail Eraser', showTimer: !1 },
                GHOST_MODE: { icon: '👻', color: '#ffffff', name: 'Ghost Mode', showTimer: !0 },
            }));
    }
    initialize() {
        this.initialized || (this.createContainer(), this.addStyles(), (this.initialized = !0));
    }
    createContainer() {
        ((this.container = document.createElement('div')),
            (this.container.id = 'powerUpStatusIndicator'),
            (this.container.className = 'status-indicator-container'),
            document.body.appendChild(this.container));
    }
    addStyles() {
        const e = document.createElement('style');
        ((e.textContent =
            '\n            .status-indicator-container {\n                position: absolute;\n                top: 120px;\n                right: 20px;\n                background-color: rgba(0, 0, 0, 0.8);\n                border: 2px solid rgba(255, 255, 255, 0.3);\n                border-radius: 10px;\n                padding: 10px;\n                min-width: 200px;\n                max-width: 250px;\n                z-index: 90;\n                font-family: Arial, sans-serif;\n                display: none; /* Hidden when no active effects */\n            }\n\n            .status-indicator-container.visible {\n                display: block;\n            }\n\n            .status-indicator-header {\n                color: white;\n                font-size: 0.9em;\n                font-weight: bold;\n                text-align: center;\n                margin-bottom: 8px;\n                text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);\n                border-bottom: 1px solid rgba(255, 255, 255, 0.2);\n                padding-bottom: 5px;\n            }\n\n            .status-indicator-item {\n                display: flex;\n                align-items: center;\n                justify-content: space-between;\n                padding: 6px 8px;\n                margin-bottom: 4px;\n                background-color: rgba(255, 255, 255, 0.1);\n                border-radius: 5px;\n                border-left: 3px solid;\n                transition: all 0.3s ease;\n            }\n\n            .status-indicator-item:last-child {\n                margin-bottom: 0;\n            }\n\n            .status-indicator-item.timed {\n                border-left-color: #00ffff;\n            }\n\n            .status-indicator-item.permanent {\n                border-left-color: #ffd700;\n            }\n\n            .status-indicator-item.expiring {\n                animation: pulse-warning 1s infinite;\n            }\n\n            @keyframes pulse-warning {\n                0%, 100% { background-color: rgba(255, 255, 255, 0.1); }\n                50% { background-color: rgba(255, 100, 100, 0.3); }\n            }\n\n            .status-indicator-left {\n                display: flex;\n                align-items: center;\n                gap: 8px;\n            }\n\n            .status-indicator-icon {\n                font-size: 1.2em;\n                width: 24px;\n                text-align: center;\n            }\n\n            .status-indicator-name {\n                color: white;\n                font-size: 0.85em;\n                font-weight: 500;\n            }\n\n            .status-indicator-timer {\n                color: #00ffff;\n                font-size: 0.8em;\n                font-weight: bold;\n                min-width: 35px;\n                text-align: right;\n                font-family: monospace;\n            }\n\n            .status-indicator-permanent {\n                color: #ffd700;\n                font-size: 0.7em;\n                font-weight: bold;\n                text-transform: uppercase;\n            }\n\n            /* Responsive adjustments */\n            @media (max-width: 768px) {\n                .status-indicator-container {\n                    top: 100px;\n                    right: 10px;\n                    min-width: 180px;\n                    max-width: 200px;\n                }\n                \n                .status-indicator-name {\n                    font-size: 0.8em;\n                }\n                \n                .status-indicator-timer {\n                    font-size: 0.75em;\n                }\n            }\n        '),
            document.head.appendChild(e));
    }
    updateStatus(e) {
        this.initialized || this.initialize();
        const t = e.player || [];
        (this.clearIndicators(),
            0 !== t.length
                ? (this.showContainer(),
                  this.addHeader(),
                  t.forEach((e) => {
                      this.addEffectIndicator(e);
                  }))
                : this.hideContainer());
    }
    clearIndicators() {
        (this.container && (this.container.innerHTML = ''), this.activeIndicators.clear());
    }
    showContainer() {
        this.container && this.container.classList.add('visible');
    }
    hideContainer() {
        this.container && this.container.classList.remove('visible');
    }
    addHeader() {
        const e = document.createElement('div');
        ((e.className = 'status-indicator-header'),
            (e.textContent = 'Active Power-Ups'),
            this.container.appendChild(e));
    }
    addEffectIndicator(e) {
        const t = this.powerUpUIConfig[e.type];
        if (!t) return void logger$r.warn(`No UI config found for effect type: ${e.type}`);
        const i = document.createElement('div');
        ((i.className = 'status-indicator-item'),
            t.showTimer ? i.classList.add('timed') : i.classList.add('permanent'));
        const r = document.createElement('div');
        r.className = 'status-indicator-left';
        const n = document.createElement('span');
        ((n.className = 'status-indicator-icon'),
            (n.textContent = t.icon),
            (n.style.color = t.color));
        const s = document.createElement('span');
        ((s.className = 'status-indicator-name'),
            (s.textContent = t.name),
            r.appendChild(n),
            r.appendChild(s));
        const a = document.createElement('div');
        (t.showTimer && -1 !== e.duration
            ? ((a.className = 'status-indicator-timer'), this.updateTimer(a, e))
            : ((a.className = 'status-indicator-permanent'),
              'SHIELD' === e.type ? (a.textContent = 'ACTIVE') : (a.textContent = 'USED')),
            i.appendChild(r),
            i.appendChild(a));
        const o = `${e.type}_${e.startTime}`;
        (this.activeIndicators.set(o, { element: i, timerElement: a, effect: e, config: t }),
            this.container.appendChild(i));
    }
    updateTimer(e, t) {
        const i = t.getRemainingTime();
        if (i <= 0) return void (e.textContent = '0s');
        const r = Math.ceil(i / 1e3);
        ((e.textContent = `${r}s`),
            r <= 2 && e.parentElement
                ? e.parentElement.classList.add('expiring')
                : e.parentElement && e.parentElement.classList.remove('expiring'));
    }
    updateTimers() {
        if (this.initialized && 0 !== this.activeIndicators.size)
            for (const [e, t] of this.activeIndicators)
                t.config.showTimer &&
                    -1 !== t.effect.duration &&
                    this.updateTimer(t.timerElement, t.effect);
    }
    handleEffectRemoved(e, t) {
        const i = `${e}_${t}`,
            r = this.activeIndicators.get(i);
        r &&
            ((r.element.style.transition = 'opacity 0.3s ease-out'),
            (r.element.style.opacity = '0'),
            setTimeout(() => {
                (r.element.parentNode && r.element.parentNode.removeChild(r.element),
                    this.activeIndicators.delete(i),
                    0 === this.activeIndicators.size && this.hideContainer());
            }, 300));
    }
    reset() {
        (this.clearIndicators(), this.hideContainer());
    }
    getDebugInfo() {
        return {
            initialized: this.initialized,
            visible: !!this.container && this.container.classList.contains('visible'),
            activeIndicators: this.activeIndicators.size,
            containerExists: !!this.container,
        };
    }
};
module$P.exports = { StatusIndicator: StatusIndicator$2 };
const __CJS__export_default__$O =
        (null == module$P.exports ? {} : module$P.exports).default || module$P.exports,
    __CJS__import__13__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$O },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$O = { exports: {} };
const { GameModes: GameModes$7 } = __CJS__export_default__$17 || __CJS__import__19__,
    { logger: logger$q } = __CJS__export_default__$1a || __CJS__import__50__;
let ModeSelector$2 = class {
    constructor(e) {
        ((this.game = e),
            (this.storageKey = 'lightbikes_selected_mode'),
            (this.selectedMode = this.loadSelectedMode()),
            (this.isVisible = !1),
            (this.onModeSelected = null));
    }
    loadSelectedMode() {
        try {
            const e = localStorage.getItem(this.storageKey);
            if (e && Object.values(GameModes$7).includes(e)) return e;
        } catch (e) {
            logger$q.warn('Failed to load selected mode from localStorage:', e);
        }
        return GameModes$7.CLASSIC;
    }
    saveSelectedMode(e) {
        try {
            localStorage.setItem(this.storageKey, e);
        } catch (t) {
            logger$q.warn('Failed to save selected mode to localStorage:', t);
        }
    }
    show() {
        this.isVisible ||
            (this.createModeSelectionUI(),
            (this.isVisible = !0),
            this.verifyVisibility(),
            this.blockUIControls());
    }
    verifyVisibility() {
        const e = document.getElementById('mode-selector');
        e
            ? null === e.offsetParent &&
              (logger$q.warn('ModeSelector: Element not visible, applying fallback styles'),
              this.forceVisibility(e))
            : logger$q.warn('ModeSelector: Element not found after creation');
    }
    forceVisibility(e) {
        ((e.style.display = 'block'),
            (e.style.visibility = 'visible'),
            (e.style.position = 'fixed'),
            (e.style.top = '50%'),
            (e.style.left = '50%'),
            (e.style.transform = 'translate(-50%, -50%)'),
            (e.style.zIndex = '10000'),
            logger$q.info('ModeSelector: Forced visibility with inline styles'));
    }
    blockUIControls() {
        const e = document.getElementById('aiCountSelector');
        e && ((e.style.pointerEvents = 'none'), (e.style.opacity = '0.5'));
        const t = document.getElementById('difficultySelector');
        t && ((t.style.pointerEvents = 'none'), (t.style.opacity = '0.5'));
    }
    unblockUIControls() {
        const e = document.getElementById('aiCountSelector');
        e && ((e.style.pointerEvents = 'auto'), (e.style.opacity = '1'));
        const t = document.getElementById('difficultySelector');
        t && ((t.style.pointerEvents = 'auto'), (t.style.opacity = '1'));
    }
    hide() {
        if (!this.isVisible) return;
        const e = document.getElementById('mode-selector');
        (e && e.remove(), (this.isVisible = !1));
    }
    createModeSelectionUI() {
        const e = document.getElementById('mode-selector');
        e && e.remove();
        const t = document.createElement('div');
        ((t.id = 'mode-selector'), (t.className = 'mode-selector-container'));
        const i = document.createElement('h2');
        ((i.textContent = 'Select Game Mode'),
            (i.className = 'mode-selector-title'),
            t.appendChild(i));
        const r = document.createElement('div');
        r.className = 'mode-options-container';
        const n = this.createModeOption(
            GameModes$7.CLASSIC,
            'Classic',
            'Compete against AI opponent'
        );
        r.appendChild(n);
        const s = this.createModeOption(
            GameModes$7.TIME_TRIAL,
            'Time Trial',
            'Survive as long as possible solo'
        );
        r.appendChild(s);
        const a = this.createModeOption(
            GameModes$7.ARENA_SHRINK,
            'Arena Shrink',
            'Battle AI as arena shrinks over time'
        );
        r.appendChild(a);
        const o = this.createModeOption(
            GameModes$7.LOCAL_MULTIPLAYER,
            'Local 2-Player',
            'Compete against a friend on same device'
        );
        (r.appendChild(o), t.appendChild(r));
        const l = document.createElement('button');
        ((l.textContent = 'Start Game'),
            (l.className = 'mode-start-button'),
            (l.onclick = () => this.startSelectedMode()),
            t.appendChild(l),
            this.addModeSelectionStyles(),
            document.body.appendChild(t));
    }
    createModeOption(e, t, i) {
        const r = document.createElement('div');
        ((r.className = 'mode-option'),
            (r.dataset.mode = e),
            e === this.selectedMode && r.classList.add('selected'));
        const n = document.createElement('h3');
        ((n.textContent = t), (n.className = 'mode-option-title'));
        const s = document.createElement('p');
        return (
            (s.textContent = i),
            (s.className = 'mode-option-description'),
            r.appendChild(n),
            r.appendChild(s),
            (r.onclick = () => this.selectMode(e)),
            r
        );
    }
    selectMode(e) {
        Object.values(GameModes$7).includes(e)
            ? ((this.selectedMode = e), this.saveSelectedMode(e), this.updateModeSelection())
            : logger$q.warn('Invalid game mode:', e);
    }
    updateModeSelection() {
        document.querySelectorAll('.mode-option').forEach((e) => {
            e.dataset.mode === this.selectedMode
                ? e.classList.add('selected')
                : e.classList.remove('selected');
        });
    }
    startSelectedMode() {
        (this.unblockUIControls(),
            this.onModeSelected && this.onModeSelected(this.selectedMode),
            this.hide());
    }
    getSelectedMode() {
        return this.selectedMode;
    }
    setOnModeSelected(e) {
        this.onModeSelected = e;
    }
    addModeSelectionStyles() {
        if (document.getElementById('mode-selector-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'mode-selector-styles'),
            (e.textContent =
                '\n            .mode-selector-container {\n                position: fixed;\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                background: rgba(0, 0, 0, 0.9);\n                border: 2px solid #00ffff;\n                border-radius: 10px;\n                padding: 30px;\n                z-index: 1000;\n                text-align: center;\n                min-width: 600px;\n                max-width: 800px;\n                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);\n            }\n\n            .mode-selector-title {\n                color: #00ffff;\n                margin: 0 0 20px 0;\n                font-size: 24px;\n                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);\n            }\n\n            .mode-options-container {\n                display: flex;\n                gap: 15px;\n                margin-bottom: 30px;\n                justify-content: center;\n                flex-wrap: wrap;\n            }\n\n            .mode-option {\n                background: rgba(0, 50, 50, 0.8);\n                border: 2px solid #004444;\n                border-radius: 8px;\n                padding: 20px;\n                cursor: pointer;\n                transition: all 0.3s ease;\n                min-width: 140px;\n                flex: 1;\n                max-width: 180px;\n            }\n\n            .mode-option:hover {\n                border-color: #00aaaa;\n                background: rgba(0, 80, 80, 0.8);\n            }\n\n            .mode-option.selected {\n                border-color: #00ffff;\n                background: rgba(0, 100, 100, 0.8);\n                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);\n            }\n\n            .mode-option-title {\n                color: #ffffff;\n                margin: 0 0 10px 0;\n                font-size: 18px;\n            }\n\n            .mode-option-description {\n                color: #cccccc;\n                margin: 0;\n                font-size: 14px;\n                line-height: 1.4;\n            }\n\n            .mode-start-button {\n                background: linear-gradient(45deg, #00ffff, #0088ff);\n                border: none;\n                border-radius: 5px;\n                color: #000000;\n                font-size: 18px;\n                font-weight: bold;\n                padding: 12px 30px;\n                cursor: pointer;\n                transition: all 0.3s ease;\n                text-transform: uppercase;\n            }\n\n            .mode-start-button:hover {\n                background: linear-gradient(45deg, #00cccc, #0066cc);\n                transform: translateY(-2px);\n                box-shadow: 0 4px 15px rgba(0, 255, 255, 0.4);\n            }\n\n            @media (max-width: 600px) {\n                .mode-selector-container {\n                    min-width: 300px;\n                    padding: 20px;\n                }\n\n                .mode-options-container {\n                    flex-direction: column;\n                    gap: 15px;\n                }\n\n                .mode-option {\n                    min-width: auto;\n                }\n            }\n        '),
            document.head.appendChild(e));
    }
    isShowing() {
        return this.isVisible;
    }
    destroy() {
        this.hide();
        const e = document.getElementById('mode-selector-styles');
        e && e.remove();
    }
};
module$O.exports = { ModeSelector: ModeSelector$2 };
const __CJS__export_default__$N =
        (null == module$O.exports ? {} : module$O.exports).default || module$O.exports,
    __CJS__import__14__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$N },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$N = { exports: {} };
let CountdownTimer$2 = class {
    constructor() {
        ((this.isRunning = !1),
            (this.currentCount = 0),
            (this.countdownElement = null),
            (this.onCountdownComplete = null),
            (this.timeoutId = null),
            (this.sequence = [
                { text: '3', duration: 1e3 },
                { text: '2', duration: 1e3 },
                { text: '1', duration: 1e3 },
                { text: 'GO!', duration: 500 },
            ]));
    }
    start(e) {
        this.isRunning ||
            ((this.onCountdownComplete = e),
            (this.isRunning = !0),
            (this.currentCount = 0),
            this.createCountdownUI(),
            this.showNextCount());
    }
    stop() {
        this.isRunning &&
            ((this.isRunning = !1),
            this.clearTimeout(),
            this.hideCountdownUI(),
            (this.currentCount = 0));
    }
    createCountdownUI() {
        (this.hideCountdownUI(),
            (this.countdownElement = document.createElement('div')),
            (this.countdownElement.id = 'countdown-display'),
            (this.countdownElement.className = 'countdown-container'),
            this.addCountdownStyles(),
            document.body.appendChild(this.countdownElement));
    }
    showNextCount() {
        if (!this.isRunning || this.currentCount >= this.sequence.length)
            return void this.completeCountdown();
        const e = this.sequence[this.currentCount];
        (this.countdownElement &&
            ((this.countdownElement.textContent = e.text),
            (this.countdownElement.className = 'countdown-container countdown-show')),
            (this.timeoutId = setTimeout(() => {
                (this.currentCount++, this.showNextCount());
            }, e.duration)));
    }
    completeCountdown() {
        ((this.isRunning = !1),
            this.hideCountdownUI(),
            this.onCountdownComplete && this.onCountdownComplete());
    }
    hideCountdownUI() {
        this.countdownElement && (this.countdownElement.remove(), (this.countdownElement = null));
    }
    clearTimeout() {
        this.timeoutId && (clearTimeout(this.timeoutId), (this.timeoutId = null));
    }
    addCountdownStyles() {
        if (document.getElementById('countdown-timer-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'countdown-timer-styles'),
            (e.textContent =
                "\n            .countdown-container {\n                position: fixed;\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                z-index: 2000;\n                font-size: 120px;\n                font-weight: bold;\n                color: #00ffff;\n                text-shadow: \n                    0 0 20px rgba(0, 255, 255, 0.8),\n                    0 0 40px rgba(0, 255, 255, 0.6),\n                    0 0 60px rgba(0, 255, 255, 0.4);\n                text-align: center;\n                pointer-events: none;\n                opacity: 0;\n                transition: opacity 0.2s ease-in-out;\n                font-family: 'Arial', sans-serif;\n                user-select: none;\n            }\n\n            .countdown-container.countdown-show {\n                opacity: 1;\n            }\n\n            @media (max-width: 768px) {\n                .countdown-container {\n                    font-size: 80px;\n                }\n            }\n\n            @media (max-width: 480px) {\n                .countdown-container {\n                    font-size: 60px;\n                }\n            }\n        "),
            document.head.appendChild(e));
    }
    isActive() {
        return this.isRunning;
    }
    getState() {
        return {
            isRunning: this.isRunning,
            currentCount: this.currentCount,
            hasElement: !!this.countdownElement,
            hasTimeout: !!this.timeoutId,
        };
    }
    destroy() {
        this.stop();
        const e = document.getElementById('countdown-timer-styles');
        e && e.remove();
    }
};
module$N.exports = { CountdownTimer: CountdownTimer$2 };
const __CJS__export_default__$M =
        (null == module$N.exports ? {} : module$N.exports).default || module$N.exports,
    __CJS__import__16__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$M },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$M = { exports: {} };
const { Logger: Logger$b } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$p = new Logger$b('LeaderboardSystem');
let LeaderboardSystem$2 = class {
    constructor() {
        ((this.storageKey = 'lightbikes_time_trial_scores'),
            (this.maxEntries = 10),
            (this.scores = this.loadScores()));
    }
    loadScores() {
        try {
            if (!this.isLocalStorageAvailable()) return [];
            const e = localStorage.getItem(this.storageKey);
            if (!e) return [];
            const t = JSON.parse(e);
            if (!Array.isArray(t)) return (this.clearScores(), []);
            const i = t.filter((e) => this.isValidScore(e)).slice(0, this.maxEntries);
            return (
                i.sort((e, t) => t.timeMs - e.timeMs),
                i.length !== t.length && this.saveScores(i),
                i
            );
        } catch (e) {
            return (logger$p.warn('Error loading leaderboard scores:', e), this.clearScores(), []);
        }
    }
    saveScores(e) {
        try {
            if (!this.isLocalStorageAvailable()) return !1;
            const t = JSON.stringify(e);
            return (localStorage.setItem(this.storageKey, t), !0);
        } catch (t) {
            if ('QuotaExceededError' === t.name) {
                const t = e.slice(0, Math.max(1, this.maxEntries - 2));
                try {
                    return (localStorage.setItem(this.storageKey, JSON.stringify(t)), !0);
                } catch (i) {
                    return (logger$p.warn('Failed to save leaderboard even after cleanup:', i), !1);
                }
            }
            return (logger$p.warn('Error saving leaderboard scores:', t), !1);
        }
    }
    addScore(e) {
        if (!this.isValidTimeMs(e)) return { success: !1, reason: 'Invalid time value' };
        const t = { timeMs: e, timestamp: Date.now(), formattedTime: this.formatTime(e) };
        if (!this.isNewRecord(e))
            return {
                success: !1,
                reason: 'Time does not qualify for top 10',
                time: t.formattedTime,
            };
        const i = this.findInsertPosition(e);
        (this.scores.splice(i, 0, t),
            this.scores.length > this.maxEntries &&
                (this.scores = this.scores.slice(0, this.maxEntries)));
        return {
            success: this.saveScores(this.scores),
            ranking: i + 1,
            time: t.formattedTime,
            isNewBest: 0 === i,
        };
    }
    isNewRecord(e) {
        if (!this.isValidTimeMs(e)) return !1;
        if (this.scores.length < this.maxEntries) return !0;
        return e > this.scores[this.scores.length - 1].timeMs;
    }
    findInsertPosition(e) {
        for (let t = 0; t < this.scores.length; t++) if (e > this.scores[t].timeMs) return t;
        return this.scores.length;
    }
    getTopScores() {
        return [...this.scores];
    }
    clearScores() {
        this.scores = [];
        try {
            this.isLocalStorageAvailable() && localStorage.removeItem(this.storageKey);
        } catch (e) {
            logger$p.warn('Error clearing leaderboard scores:', e);
        }
    }
    formatTime(e) {
        if (!this.isValidTimeMs(e)) return '00:00.00';
        const t = Math.floor(e / 1e3),
            i = Math.floor(t / 60),
            r = t % 60,
            n = Math.floor((e % 1e3) / 10);
        return `${i.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}.${n.toString().padStart(2, '0')}`;
    }
    isLocalStorageAvailable() {
        try {
            const e = '__localStorage_test__';
            return (localStorage.setItem(e, e), localStorage.removeItem(e), !0);
        } catch (e) {
            return !1;
        }
    }
    isValidScore(e) {
        return (
            !(!e || 'object' != typeof e || null === e) &&
            'number' == typeof e.timeMs &&
            e.timeMs > 0 &&
            e.timeMs < 6e6 &&
            'number' == typeof e.timestamp &&
            'string' == typeof e.formattedTime
        );
    }
    isValidTimeMs(e) {
        return 'number' == typeof e && e > 0 && e < 6e6 && !isNaN(e) && isFinite(e);
    }
    getStats() {
        if (0 === this.scores.length) return { totalScores: 0, bestTime: null, averageTime: null };
        const e = this.scores.reduce((e, t) => e + t.timeMs, 0) / this.scores.length;
        return {
            totalScores: this.scores.length,
            bestTime: this.formatTime(this.scores[0].timeMs),
            averageTime: this.formatTime(e),
        };
    }
};
module$M.exports = { LeaderboardSystem: LeaderboardSystem$2 };
const __CJS__export_default__$L =
        (null == module$M.exports ? {} : module$M.exports).default || module$M.exports,
    __CJS__import__17__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$L },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$L = { exports: {} };
const { Logger: Logger$a } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$o = new Logger$a('AchievementSystem');
let AchievementSystem$2 = class {
    constructor() {
        ((this.storageKey = 'lightbikes_achievements'),
            (this.milestones = [
                { seconds: 30, message: 'First Steps!', description: 'Survived 30 seconds' },
                { seconds: 60, message: 'Getting Warmed Up!', description: 'Survived 1 minute' },
                { seconds: 120, message: 'Steady Progress!', description: 'Survived 2 minutes' },
                { seconds: 300, message: 'Master of Survival!', description: 'Survived 5 minutes' },
                { seconds: 600, message: 'Legendary Pilot!', description: 'Survived 10 minutes' },
            ]),
            (this.unlockedAchievements = this.loadProgress()),
            (this.sessionAchievements = new Set()));
    }
    loadProgress() {
        try {
            if (!this.isLocalStorageAvailable()) return new Set();
            const e = localStorage.getItem(this.storageKey);
            if (!e) return new Set();
            const t = JSON.parse(e);
            if (!Array.isArray(t)) return (this.clearProgress(), new Set());
            const i = t.filter(
                (e) => 'number' == typeof e && this.milestones.some((t) => t.seconds === e)
            );
            return new Set(i);
        } catch (e) {
            return (
                logger$o.warn('Error loading achievement progress:', e),
                this.clearProgress(),
                new Set()
            );
        }
    }
    saveProgress() {
        try {
            if (!this.isLocalStorageAvailable()) return !1;
            const e = Array.from(this.unlockedAchievements);
            return (localStorage.setItem(this.storageKey, JSON.stringify(e)), !0);
        } catch (e) {
            return (logger$o.warn('Error saving achievement progress:', e), !1);
        }
    }
    checkMilestone(e) {
        if ('number' != typeof e || e < 0 || !isFinite(e)) return [];
        const t = [];
        for (const i of this.milestones)
            e >= i.seconds &&
                !this.unlockedAchievements.has(i.seconds) &&
                !this.sessionAchievements.has(i.seconds) &&
                (this.unlockedAchievements.add(i.seconds),
                this.sessionAchievements.add(i.seconds),
                t.push({
                    seconds: i.seconds,
                    message: i.message,
                    description: i.description,
                    timeAchieved: e,
                }));
        return (t.length > 0 && this.saveProgress(), t);
    }
    getAllMilestones() {
        return this.milestones.map((e) => ({
            seconds: e.seconds,
            message: e.message,
            description: e.description,
            unlocked: this.unlockedAchievements.has(e.seconds),
            formattedTime: this.formatTime(1e3 * e.seconds),
        }));
    }
    getUnlockedAchievements() {
        return this.milestones
            .filter((e) => this.unlockedAchievements.has(e.seconds))
            .map((e) => ({
                seconds: e.seconds,
                message: e.message,
                description: e.description,
                formattedTime: this.formatTime(1e3 * e.seconds),
            }));
    }
    getNextMilestone() {
        for (const e of this.milestones)
            if (!this.unlockedAchievements.has(e.seconds))
                return {
                    seconds: e.seconds,
                    message: e.message,
                    description: e.description,
                    formattedTime: this.formatTime(1e3 * e.seconds),
                };
        return null;
    }
    getProgress() {
        const e = this.milestones.length,
            t = this.unlockedAchievements.size;
        return {
            totalMilestones: e,
            unlockedCount: t,
            progressPercentage: Math.round((t / e) * 100),
            allUnlocked: t === e,
        };
    }
    resetSession() {
        this.sessionAchievements.clear();
    }
    clearProgress() {
        (this.unlockedAchievements.clear(), this.sessionAchievements.clear());
        try {
            this.isLocalStorageAvailable() && localStorage.removeItem(this.storageKey);
        } catch (e) {
            logger$o.warn('Error clearing achievement progress:', e);
        }
    }
    isMilestoneUnlocked(e) {
        return this.unlockedAchievements.has(e);
    }
    formatTime(e) {
        if ('number' != typeof e || e < 0 || !isFinite(e)) return '00:00';
        const t = Math.floor(e / 1e3),
            i = t % 60;
        return `${Math.floor(t / 60)
            .toString()
            .padStart(2, '0')}:${i.toString().padStart(2, '0')}`;
    }
    isLocalStorageAvailable() {
        try {
            const e = '__localStorage_test__';
            return (localStorage.setItem(e, e), localStorage.removeItem(e), !0);
        } catch (e) {
            return !1;
        }
    }
    getDebugInfo() {
        return {
            totalMilestones: this.milestones.length,
            unlockedCount: this.unlockedAchievements.size,
            sessionAchievements: Array.from(this.sessionAchievements),
            storageAvailable: this.isLocalStorageAvailable(),
            nextMilestone: this.getNextMilestone(),
        };
    }
};
module$L.exports = { AchievementSystem: AchievementSystem$2 };
const __CJS__export_default__$K =
        (null == module$L.exports ? {} : module$L.exports).default || module$L.exports,
    __CJS__import__18__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$K },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$K = { exports: {} };
const { createLogger: createLogger$6 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$n = createLogger$6('DeviceCapabilityDetector');
let DeviceCapabilityDetector$1 = class {
    constructor() {
        this.capabilities = {
            webglSupported: !1,
            webgl2Supported: !1,
            postProcessingSupported: !1,
            floatTextureSupport: !1,
            depthTextureSupport: !1,
            maxTextureSize: 0,
            maxRenderBufferSize: 0,
            devicePixelRatio: ('undefined' != typeof window && window.devicePixelRatio) || 1,
            isMobile: !1,
            isLowEndDevice: !1,
            gpuTier: 'unknown',
        };
    }
    detect() {
        return (
            this.detectWebGLCapabilities(),
            this.detectDeviceCharacteristics(),
            this.capabilities
        );
    }
    detectWebGLCapabilities() {
        try {
            if ('undefined' == typeof document) return;
            const e = document.createElement('canvas'),
                t = e.getContext('webgl') || e.getContext('experimental-webgl');
            if (((this.capabilities.webglSupported = !!t), t)) {
                const i = t;
                ((this.capabilities.maxTextureSize = i.getParameter(i.MAX_TEXTURE_SIZE)),
                    (this.capabilities.maxRenderBufferSize = i.getParameter(
                        i.MAX_RENDERBUFFER_SIZE
                    )),
                    (this.capabilities.floatTextureSupport = !(
                        !i.getExtension('OES_texture_float') &&
                        !i.getExtension('OES_texture_half_float')
                    )),
                    (this.capabilities.depthTextureSupport =
                        !!i.getExtension('WEBGL_depth_texture')));
                const r = e.getContext('webgl2');
                ((this.capabilities.webgl2Supported = !!r),
                    (this.capabilities.postProcessingSupported = !!(
                        'undefined' != typeof window &&
                        window.THREE &&
                        window.THREE.EffectComposer &&
                        window.THREE.RenderPass &&
                        window.THREE.ShaderPass
                    )),
                    this.estimateGPUTier(t));
            }
            ((e.width = 1), (e.height = 1));
        } catch (e) {
            (logger$n.warn('WebGL capability detection failed', { error: e.message }),
                (this.capabilities.webglSupported = !1));
        }
    }
    estimateGPUTier(e) {
        try {
            const t = e.getParameter(e.RENDERER),
                i = e.getParameter(e.VENDOR);
            if (!t || !i) return void (this.capabilities.gpuTier = 'unknown');
            const r = t.toLowerCase();
            i.toLowerCase();
            (r.includes('rtx') ||
            r.includes('gtx 1060') ||
            r.includes('gtx 1070') ||
            r.includes('gtx 1080') ||
            r.includes('rx 580') ||
            r.includes('rx 6') ||
            r.includes('rx 7')
                ? (this.capabilities.gpuTier = 'high')
                : r.includes('gtx') ||
                    r.includes('rx ') ||
                    r.includes('radeon') ||
                    r.includes('geforce') ||
                    this.capabilities.maxTextureSize >= 4096
                  ? (this.capabilities.gpuTier = 'medium')
                  : (r.includes('intel') ||
                        r.includes('integrated') ||
                        this.capabilities.maxTextureSize < 2048) &&
                    (this.capabilities.gpuTier = 'low'),
                logger$n.debug(`GPU detected: ${t} (${i}) - Tier: ${this.capabilities.gpuTier}`));
        } catch (t) {
            (logger$n.warn('GPU tier estimation failed', { error: t.message }),
                (this.capabilities.gpuTier = 'unknown'));
        }
    }
    detectDeviceCharacteristics() {
        'undefined' != typeof navigator &&
            ((this.capabilities.isMobile =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                )),
            (this.capabilities.isLowEndDevice =
                this.capabilities.isMobile ||
                'low' === this.capabilities.gpuTier ||
                this.capabilities.maxTextureSize < 2048 ||
                (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
                (navigator.deviceMemory && navigator.deviceMemory < 4)),
            logger$n.debug(
                `Device characteristics: Mobile: ${this.capabilities.isMobile}, Low-end: ${this.capabilities.isLowEndDevice}`
            ));
    }
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
};
module$K.exports = { DeviceCapabilityDetector: DeviceCapabilityDetector$1 };
const __CJS__export_default__$J =
        (null == module$K.exports ? {} : module$K.exports).default || module$K.exports,
    __CJS__import__1__$4 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$J },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$J = { exports: {} };
const { createLogger: createLogger$5 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$m = createLogger$5('PerformanceDegradation'),
    { DeviceCapabilityDetector: DeviceCapabilityDetector } =
        __CJS__export_default__$J || __CJS__import__1__$4,
    { PerformanceMonitor: PerformanceMonitor$2 } =
        __CJS__export_default__$1c || __CJS__import__20__;
let PerformanceDegradationManager$4 = class {
    constructor(e = null, t = null) {
        ((this.cameraEffectsManager = null),
            (this.motionBlurController = null),
            (this.shakeController = null));
        let i = null,
            r = null;
        (!t ||
            ('PerformanceMonitor' !== t.constructor.name && 'function' != typeof t.update) ||
            (r = t),
            !e ||
            ('DeviceCapabilityDetector' !== e.constructor.name && 'function' != typeof e.detect)
                ? !e ||
                  ('PerformanceMonitor' !== e.constructor.name && 'function' != typeof e.update) ||
                  (r = e)
                : (i = e),
            (this.detector = i || new DeviceCapabilityDetector()),
            (this.externalMonitor = !!r),
            (this.monitor = r || new PerformanceMonitor$2()),
            (this.capabilities = this.detector.capabilities),
            (this.degradationState = {
                currentLevel: 0,
                maxLevel: 3,
                effectsEnabled: !0,
                motionBlurEnabled: !0,
                shakeEnabled: !0,
                qualityLevel: 'medium',
                levels: [
                    {
                        name: 'full',
                        motionBlur: !0,
                        shake: !0,
                        quality: 'high',
                        description: 'All effects enabled at high quality',
                    },
                    {
                        name: 'reduced_quality',
                        motionBlur: !0,
                        shake: !0,
                        quality: 'medium',
                        description: 'Effects enabled at medium quality',
                    },
                    {
                        name: 'shake_only',
                        motionBlur: !1,
                        shake: !0,
                        quality: 'low',
                        description: 'Camera shake only, motion blur disabled',
                    },
                    {
                        name: 'disabled',
                        motionBlur: !1,
                        shake: !1,
                        quality: 'low',
                        description: 'All camera effects disabled',
                    },
                ],
            }),
            (this.errorState = {
                webglErrors: 0,
                postProcessingErrors: 0,
                memoryErrors: 0,
                lastError: null,
                errorCooldown: 5e3,
                lastErrorTime: 0,
                maxErrors: 3,
            }),
            (this.notifications = { shown: new Set(), queue: [], maxQueueSize: 5 }),
            (this.initialized = !1),
            (this.enabled = !0),
            (this.onDegradation = null),
            (this.onRecovery = null),
            (this.lastQualityAdjustment = 0),
            (this.qualityAdjustmentCooldown = 3e3));
    }
    setOnDegradation(e) {
        this.onDegradation = e;
    }
    setOnRecovery(e) {
        this.onRecovery = e;
    }
    initialize(e, t = null, i = null) {
        try {
            return (
                (this.cameraEffectsManager = e),
                (this.motionBlurController = t),
                (this.shakeController = i),
                (this.capabilities = this.detector.detect()),
                this.setInitialDegradationLevel(),
                this.monitor.reset(),
                (this.initialized = !0),
                logger$m.info('Initialized successfully'),
                logger$m.debug('Device capabilities', this.detector.getSummary()),
                !0
            );
        } catch (r) {
            return (
                logger$m.error('Initialization failed', r),
                this.handleError('initialization', r),
                !1
            );
        }
    }
    setInitialDegradationLevel() {
        let e = 0;
        (this.capabilities.webglSupported
            ? this.capabilities.postProcessingSupported
                ? (this.capabilities.isLowEndDevice || 'low' === this.capabilities.gpuTier) &&
                  (e = 1)
                : (e = 2)
            : (e = 3),
            this.setDegradationLevel(e),
            e > 0 &&
                this.queueNotification(
                    'performance',
                    `Camera effects adjusted for your device: ${this.degradationState.levels[e].description}`
                ));
    }
    update(e) {
        if (this.initialized && this.enabled)
            try {
                (this.externalMonitor || this.monitor.update(e),
                    this.checkPerformanceAdjustment(),
                    this.processNotificationQueue());
            } catch (t) {
                (logger$m.error('Update error:', t), this.handleError('update', t));
            }
    }
    checkPerformanceAdjustment() {
        const e = Date.now();
        if (e - this.lastQualityAdjustment < this.qualityAdjustmentCooldown) return;
        const t = this.monitor.getPerformanceMetrics();
        if (t.frameCount < 60) return;
        let i = this.degradationState.currentLevel;
        (t.consecutivePoorFrames > 30
            ? this.degradationState.currentLevel < this.degradationState.maxLevel &&
              ((i = this.degradationState.currentLevel + 1),
              logger$m.info(`Performance degradation triggered. FPS: ${t.currentFPS.toFixed(1)}`))
            : t.consecutiveGoodFrames > 120 &&
              this.degradationState.currentLevel > 0 &&
              ((i = this.degradationState.currentLevel - 1),
              logger$m.info(`Performance improvement detected. FPS: ${t.currentFPS.toFixed(1)}`)),
            i !== this.degradationState.currentLevel &&
                (this.setDegradationLevel(i), (this.lastQualityAdjustment = e)));
    }
    setDegradationLevel(e) {
        if (e < 0 || e > this.degradationState.maxLevel)
            return void logger$m.warn(`Invalid degradation level: ${e}`);
        const t = this.degradationState.currentLevel;
        this.degradationState.currentLevel = e;
        const i = this.degradationState.levels[e];
        ((this.degradationState.effectsEnabled = i.motionBlur || i.shake),
            (this.degradationState.motionBlurEnabled = i.motionBlur),
            (this.degradationState.shakeEnabled = i.shake),
            (this.degradationState.qualityLevel = i.quality),
            this.applyDegradationSettings(),
            e !== t &&
                (logger$m.info(`Degradation level changed from ${t} to ${e}: ${i.description}`),
                e > t
                    ? (e > 0 &&
                          this.queueNotification(
                              'degradation',
                              `Camera effects reduced to maintain performance: ${i.description}`
                          ),
                      this.onDegradation && this.onDegradation('degrade', { level: e, config: i }))
                    : e < t &&
                      (this.queueNotification(
                          'improvement',
                          `Camera effects restored: ${i.description}`
                      ),
                      this.onRecovery && this.onRecovery('recover', { level: e, config: i }))));
    }
    applyDegradationSettings() {
        try {
            (this.cameraEffectsManager &&
                this.cameraEffectsManager.setEnabled(this.degradationState.effectsEnabled),
                this.motionBlurController &&
                    (this.motionBlurController.setEnabled(this.degradationState.motionBlurEnabled),
                    this.motionBlurController.setQuality(this.degradationState.qualityLevel)),
                this.shakeController &&
                    this.shakeController.setEnabled(this.degradationState.shakeEnabled));
        } catch (e) {
            (logger$m.error('Error applying degradation settings', e),
                this.handleError('degradation', e));
        }
    }
    triggerMemoryCleanup() {
        try {
            ('undefined' != typeof window && window.gc && window.gc(),
                this.motionBlurController &&
                    'function' == typeof this.motionBlurController.resetPerformanceMetrics &&
                    this.motionBlurController.resetPerformanceMetrics(),
                this.monitor.cleanup(),
                logger$m.info('Memory cleanup triggered'));
        } catch (e) {
            (logger$m.error('Memory cleanup failed', e), this.handleError('memory', e));
        }
    }
    handleError(e, t) {
        const i = Date.now();
        if (i - this.errorState.lastErrorTime < this.errorState.errorCooldown) return;
        switch (
            ((this.errorState.lastError = { context: e, error: t, timestamp: i }),
            (this.errorState.lastErrorTime = i),
            e)
        ) {
            case 'webgl':
                this.errorState.webglErrors++;
                break;
            case 'postprocessing':
                this.errorState.postProcessingErrors++;
                break;
            case 'memory':
                this.errorState.memoryErrors++;
        }
        this.errorState.webglErrors +
            this.errorState.postProcessingErrors +
            this.errorState.memoryErrors >=
            this.errorState.maxErrors &&
            (logger$m.warn('Maximum errors reached, entering fallback mode'),
            this.setDegradationLevel(this.degradationState.maxLevel),
            this.queueNotification('error', 'Camera effects disabled due to technical issues'));
    }
    queueNotification(e, t) {
        const i = `${e}:${t}`;
        this.notifications.shown.has(i) ||
            (this.notifications.queue.length < this.notifications.maxQueueSize &&
                this.notifications.queue.push({
                    type: e,
                    message: t,
                    id: i,
                    timestamp: Date.now(),
                }));
    }
    processNotificationQueue() {
        if (0 === this.notifications.queue.length) return;
        const e = this.notifications.queue.shift();
        (this.showNotification(e), this.notifications.shown.add(e.id));
    }
    showNotification(e) {
        (logger$m.info(`Camera Effects: ${e.message}`),
            'undefined' != typeof window &&
                window.dispatchEvent(new CustomEvent('cameraEffectsNotification', { detail: e })));
    }
    shouldEnableEffects() {
        return (
            this.initialized &&
            this.enabled &&
            this.degradationState.effectsEnabled &&
            this.capabilities.webglSupported
        );
    }
    shouldEnableMotionBlur() {
        return (
            this.shouldEnableEffects() &&
            this.degradationState.motionBlurEnabled &&
            this.capabilities.postProcessingSupported
        );
    }
    shouldEnableShake() {
        return this.shouldEnableEffects() && this.degradationState.shakeEnabled;
    }
    getPerformanceMetrics() {
        return this.monitor.getPerformanceMetrics();
    }
    getCapabilitiesSummary() {
        return this.detector.getSummary();
    }
    getDegradationState() {
        return {
            level: this.degradationState.currentLevel,
            description:
                this.degradationState.levels[this.degradationState.currentLevel].description,
            effectsEnabled: this.degradationState.effectsEnabled,
            motionBlurEnabled: this.degradationState.motionBlurEnabled,
            shakeEnabled: this.degradationState.shakeEnabled,
            qualityLevel: this.degradationState.qualityLevel,
        };
    }
    resetPerformanceMetrics() {
        this.monitor.reset();
    }
};
module$J.exports = { PerformanceDegradationManager: PerformanceDegradationManager$4 };
const __CJS__export_default__$I =
        (null == module$J.exports ? {} : module$J.exports).default || module$J.exports,
    __CJS__import__21__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$I },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$I = { exports: {} };
let ParticleSettings$1 = class {
    constructor() {
        ((this.defaultSettings = {
            enabled: !0,
            quality: 'medium',
            effects: { trailSparks: !0, explosions: !0, collections: !0 },
            performance: { maxParticles: 200, adaptiveQuality: !0, targetFPS: 60 },
            advanced: { particleDensity: 1, emissionRateMultiplier: 1, lifetimeMultiplier: 1 },
        }),
            (this.currentSettings = {}),
            (this.validationRules = {
                enabled: (e) => 'boolean' == typeof e,
                quality: (e) => ['low', 'medium', 'high'].includes(e),
                'effects.trailSparks': (e) => 'boolean' == typeof e,
                'effects.explosions': (e) => 'boolean' == typeof e,
                'effects.collections': (e) => 'boolean' == typeof e,
                'performance.maxParticles': (e) => Number.isInteger(e) && e >= 25 && e <= 500,
                'performance.adaptiveQuality': (e) => 'boolean' == typeof e,
                'performance.targetFPS': (e) => Number.isInteger(e) && e >= 30 && e <= 120,
                'advanced.particleDensity': (e) => 'number' == typeof e && e >= 0.1 && e <= 3,
                'advanced.emissionRateMultiplier': (e) =>
                    'number' == typeof e && e >= 0.1 && e <= 5,
                'advanced.lifetimeMultiplier': (e) => 'number' == typeof e && e >= 0.1 && e <= 3,
            }),
            (this.qualityPresets = {
                low: {
                    quality: 'low',
                    performance: { maxParticles: 100, adaptiveQuality: !0, targetFPS: 60 },
                    advanced: {
                        particleDensity: 0.7,
                        emissionRateMultiplier: 0.8,
                        lifetimeMultiplier: 0.9,
                    },
                },
                medium: {
                    quality: 'medium',
                    performance: { maxParticles: 200, adaptiveQuality: !0, targetFPS: 60 },
                    advanced: {
                        particleDensity: 1,
                        emissionRateMultiplier: 1,
                        lifetimeMultiplier: 1,
                    },
                },
                high: {
                    quality: 'high',
                    performance: { maxParticles: 300, adaptiveQuality: !1, targetFPS: 60 },
                    advanced: {
                        particleDensity: 1.3,
                        emissionRateMultiplier: 1.2,
                        lifetimeMultiplier: 1.1,
                    },
                },
            }),
            (this.storageKey = 'lightbikes_particle_settings'),
            (this.changeListeners = []),
            this.loadSettings());
    }
    loadSettings() {
        try {
            const e = localStorage.getItem(this.storageKey);
            if (e) {
                const t = JSON.parse(e);
                ((this.currentSettings = this.mergeSettings(this.defaultSettings, t)),
                    this.validateAndFixSettings());
            } else this.currentSettings = this.deepClone(this.defaultSettings);
        } catch (e) {
            this.currentSettings = this.deepClone(this.defaultSettings);
        }
    }
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
        } catch (e) {}
    }
    getSettings() {
        return this.deepClone(this.currentSettings);
    }
    setSetting(e, t) {
        return (
            !!this.validateSetting(e, t) &&
            (this.setNestedProperty(this.currentSettings, e, t),
            this.saveSettings(),
            this.notifyChange(e, t),
            !0)
        );
    }
    updateSettings(e) {
        const t = this.deepClone(this.currentSettings);
        let i = !0;
        try {
            ((this.currentSettings = this.mergeSettings(this.currentSettings, e)),
                this.validateAndFixSettings() || (i = !1),
                this.saveSettings(),
                this.notifyChange('bulk', this.currentSettings));
        } catch (r) {
            ((this.currentSettings = t), (i = !1));
        }
        return i;
    }
    applyQualityPreset(e) {
        if (!this.qualityPresets[e]) return !1;
        const t = this.qualityPresets[e];
        return this.updateSettings(t);
    }
    resetToDefaults() {
        ((this.currentSettings = this.deepClone(this.defaultSettings)),
            this.saveSettings(),
            this.notifyChange('reset', this.currentSettings));
    }
    setEnabled(e) {
        return this.setSetting('enabled', e);
    }
    setQuality(e) {
        return !!this.setSetting('quality', e) && this.applyQualityPreset(e);
    }
    setEffectEnabled(e, t) {
        return this.setSetting(`effects.${e}`, t);
    }
    setParticleDensity(e) {
        return this.setSetting('advanced.particleDensity', e);
    }
    setMaxParticles(e) {
        return this.setSetting('performance.maxParticles', e);
    }
    setAdaptiveQuality(e) {
        return this.setSetting('performance.adaptiveQuality', e);
    }
    getParticleSystemSettings() {
        const e = this.getSettings(),
            t = Math.floor(e.performance.maxParticles * e.advanced.particleDensity);
        return {
            enabled: e.enabled,
            quality: e.quality,
            maxParticles: Math.max(25, Math.min(500, t)),
            effects: __spreadValues({}, e.effects),
            adaptiveQuality: e.performance.adaptiveQuality,
            targetFPS: e.performance.targetFPS,
            emissionRateMultiplier: e.advanced.emissionRateMultiplier,
            lifetimeMultiplier: e.advanced.lifetimeMultiplier,
        };
    }
    addChangeListener(e) {
        'function' == typeof e && this.changeListeners.push(e);
    }
    removeChangeListener(e) {
        const t = this.changeListeners.indexOf(e);
        -1 !== t && this.changeListeners.splice(t, 1);
    }
    getAvailablePresets() {
        return Object.keys(this.qualityPresets);
    }
    getCurrentPreset() {
        for (const [e, t] of Object.entries(this.qualityPresets))
            if (this.settingsMatchPreset(t)) return e;
        return null;
    }
    exportSettings() {
        return JSON.stringify(this.currentSettings, null, 2);
    }
    importSettings(e) {
        try {
            const t = JSON.parse(e);
            return this.updateSettings(t);
        } catch (t) {
            return !1;
        }
    }
    validateSetting(e, t) {
        const i = this.validationRules[e];
        return !i || i(t);
    }
    validateAndFixSettings() {
        let e = !0;
        for (const [t, i] of Object.entries(this.validationRules)) {
            const r = this.getNestedProperty(this.currentSettings, t);
            if (void 0 !== r && !i(r)) {
                const i = this.getNestedProperty(this.defaultSettings, t);
                (this.setNestedProperty(this.currentSettings, t, i), (e = !1));
            }
        }
        return e;
    }
    settingsMatchPreset(e) {
        const t = this.currentSettings.quality,
            i = this.currentSettings.performance,
            r = this.currentSettings.advanced;
        return (
            t === e.quality &&
            i.maxParticles === e.performance.maxParticles &&
            i.adaptiveQuality === e.performance.adaptiveQuality &&
            Math.abs(r.particleDensity - e.advanced.particleDensity) < 0.01 &&
            Math.abs(r.emissionRateMultiplier - e.advanced.emissionRateMultiplier) < 0.01 &&
            Math.abs(r.lifetimeMultiplier - e.advanced.lifetimeMultiplier) < 0.01
        );
    }
    notifyChange(e, t) {
        this.changeListeners.forEach((i) => {
            try {
                i(e, t);
            } catch (r) {}
        });
    }
    deepClone(e) {
        if (null === e || 'object' != typeof e) return e;
        if (e instanceof Date) return new Date(e.getTime());
        if (e instanceof Array) return e.map((e) => this.deepClone(e));
        const t = {};
        for (const i in e) e.hasOwnProperty(i) && (t[i] = this.deepClone(e[i]));
        return t;
    }
    mergeSettings(e, t) {
        const i = this.deepClone(e);
        for (const r in t)
            t.hasOwnProperty(r) &&
                (t[r] && 'object' == typeof t[r] && !Array.isArray(t[r])
                    ? (i[r] = this.mergeSettings(i[r] || {}, t[r]))
                    : (i[r] = t[r]));
        return i;
    }
    getNestedProperty(e, t) {
        return t.split('.').reduce((e, t) => (e && void 0 !== e[t] ? e[t] : void 0), e);
    }
    setNestedProperty(e, t, i) {
        const r = t.split('.'),
            n = r.pop();
        r.reduce((e, t) => ((e[t] && 'object' == typeof e[t]) || (e[t] = {}), e[t]), e)[n] = i;
    }
};
module$I.exports = { ParticleSettings: ParticleSettings$1 };
const __CJS__export_default__$H =
        (null == module$I.exports ? {} : module$I.exports).default || module$I.exports,
    __CJS__import__0__$3 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$H },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$H = { exports: {} };
const { ParticleSettings: ParticleSettings } = __CJS__export_default__$H || __CJS__import__0__$3,
    { logger: logger$l } = __CJS__export_default__$1a || __CJS__import__50__;
let ParticleSettingsUI$2 = class {
    constructor() {
        ((this.particleSettings = new ParticleSettings()),
            (this.isVisible = !1),
            (this.elements = {}),
            (this.togglePanel = this.togglePanel.bind(this)),
            (this.closePanel = this.closePanel.bind(this)),
            (this.resetSettings = this.resetSettings.bind(this)),
            (this.handleSettingChange = this.handleSettingChange.bind(this)),
            'loading' === document.readyState
                ? document.addEventListener('DOMContentLoaded', () => this.initialize())
                : this.initialize());
    }
    initialize() {
        (this.cacheElements(),
            this.bindEvents(),
            this.updateUI(),
            this.particleSettings.addChangeListener(this.handleSettingChange));
    }
    cacheElements() {
        this.elements = {
            settingsButton: document.getElementById('particleSettingsButton'),
            settingsPanel: document.getElementById('particleSettingsPanel'),
            closeButton: document.getElementById('closeParticleSettings'),
            resetButton: document.getElementById('resetParticleSettings'),
            enabledToggle: document.getElementById('particleEnabledToggle'),
            qualityButtons: document.querySelectorAll('.quality-btn'),
            trailSparksToggle: document.getElementById('trailSparksToggle'),
            explosionsToggle: document.getElementById('explosionsToggle'),
            collectionsToggle: document.getElementById('collectionsToggle'),
            densitySlider: document.getElementById('particleDensitySlider'),
            densityValue: document.getElementById('particleDensityValue'),
            maxParticlesSlider: document.getElementById('maxParticlesSlider'),
            maxParticlesValue: document.getElementById('maxParticlesValue'),
            adaptiveQualityToggle: document.getElementById('adaptiveQualityToggle'),
        };
    }
    bindEvents() {
        (this.elements.settingsButton &&
            this.elements.settingsButton.addEventListener('click', this.togglePanel),
            this.elements.closeButton &&
                this.elements.closeButton.addEventListener('click', this.closePanel),
            this.elements.resetButton &&
                this.elements.resetButton.addEventListener('click', this.resetSettings),
            this.elements.enabledToggle &&
                this.elements.enabledToggle.addEventListener('click', () => {
                    const e = !this.elements.enabledToggle.classList.contains('active');
                    this.particleSettings.setEnabled(e);
                }),
            this.elements.qualityButtons.forEach((e) => {
                e.addEventListener('click', () => {
                    const t = e.dataset.quality;
                    this.particleSettings.setQuality(t);
                });
            }),
            this.elements.trailSparksToggle &&
                this.elements.trailSparksToggle.addEventListener('click', () => {
                    const e = !this.elements.trailSparksToggle.classList.contains('active');
                    this.particleSettings.setEffectEnabled('trailSparks', e);
                }),
            this.elements.explosionsToggle &&
                this.elements.explosionsToggle.addEventListener('click', () => {
                    const e = !this.elements.explosionsToggle.classList.contains('active');
                    this.particleSettings.setEffectEnabled('explosions', e);
                }),
            this.elements.collectionsToggle &&
                this.elements.collectionsToggle.addEventListener('click', () => {
                    const e = !this.elements.collectionsToggle.classList.contains('active');
                    this.particleSettings.setEffectEnabled('collections', e);
                }),
            this.elements.densitySlider &&
                this.elements.densitySlider.addEventListener('input', (e) => {
                    const t = parseFloat(e.target.value);
                    (this.particleSettings.setParticleDensity(t), this.updateDensityDisplay(t));
                }),
            this.elements.maxParticlesSlider &&
                this.elements.maxParticlesSlider.addEventListener('input', (e) => {
                    const t = parseInt(e.target.value);
                    (this.particleSettings.setMaxParticles(t), this.updateMaxParticlesDisplay(t));
                }),
            this.elements.adaptiveQualityToggle &&
                this.elements.adaptiveQualityToggle.addEventListener('click', () => {
                    const e = !this.elements.adaptiveQualityToggle.classList.contains('active');
                    this.particleSettings.setAdaptiveQuality(e);
                }),
            document.addEventListener('click', (e) => {
                !this.isVisible ||
                    this.elements.settingsPanel.contains(e.target) ||
                    this.elements.settingsButton.contains(e.target) ||
                    this.closePanel();
            }),
            document.addEventListener('keydown', (e) => {
                'Escape' === e.key && this.isVisible && this.closePanel();
            }));
    }
    togglePanel() {
        this.isVisible ? this.closePanel() : this.showPanel();
    }
    showPanel() {
        this.elements.settingsPanel &&
            ((this.elements.settingsPanel.style.display = 'block'),
            this.elements.settingsButton.classList.add('active'),
            (this.isVisible = !0),
            this.updateUI());
    }
    closePanel() {
        this.elements.settingsPanel &&
            ((this.elements.settingsPanel.style.display = 'none'),
            this.elements.settingsButton.classList.remove('active'),
            (this.isVisible = !1));
    }
    resetSettings() {
        confirm('Reset all particle settings to defaults?') &&
            this.particleSettings.resetToDefaults();
    }
    handleSettingChange(e, t) {
        (this.updateUI(), this.notifyExternalListeners(e, t));
    }
    updateUI() {
        const e = this.particleSettings.getSettings();
        (this.updateToggle(this.elements.enabledToggle, e.enabled),
            this.updateQualityButtons(e.quality),
            this.updateToggle(this.elements.trailSparksToggle, e.effects.trailSparks),
            this.updateToggle(this.elements.explosionsToggle, e.effects.explosions),
            this.updateToggle(this.elements.collectionsToggle, e.effects.collections),
            this.updateDensitySlider(e.advanced.particleDensity),
            this.updateMaxParticlesSlider(e.performance.maxParticles),
            this.updateToggle(this.elements.adaptiveQualityToggle, e.performance.adaptiveQuality),
            this.elements.settingsButton &&
                this.elements.settingsButton.style &&
                (e.enabled
                    ? ((this.elements.settingsButton.style.opacity = '1.0'),
                      (this.elements.settingsButton.title = 'Particle Settings'))
                    : ((this.elements.settingsButton.style.opacity = '0.6'),
                      (this.elements.settingsButton.title = 'Particle Settings (Disabled)'))));
    }
    updateToggle(e, t) {
        e && (t ? e.classList.add('active') : e.classList.remove('active'));
    }
    updateQualityButtons(e) {
        this.elements.qualityButtons.forEach((t) => {
            t.dataset.quality === e ? t.classList.add('active') : t.classList.remove('active');
        });
    }
    updateDensitySlider(e) {
        (this.elements.densitySlider && (this.elements.densitySlider.value = e),
            this.updateDensityDisplay(e));
    }
    updateDensityDisplay(e) {
        this.elements.densityValue &&
            (this.elements.densityValue.textContent = Math.round(100 * e) + '%');
    }
    updateMaxParticlesSlider(e) {
        (this.elements.maxParticlesSlider && (this.elements.maxParticlesSlider.value = e),
            this.updateMaxParticlesDisplay(e));
    }
    updateMaxParticlesDisplay(e) {
        this.elements.maxParticlesValue &&
            (this.elements.maxParticlesValue.textContent = e.toString());
    }
    getParticleSystemSettings() {
        return this.particleSettings.getParticleSystemSettings();
    }
    getParticleSettings() {
        return this.particleSettings;
    }
    addExternalListener(e) {
        (this.externalListeners || (this.externalListeners = []), this.externalListeners.push(e));
    }
    removeExternalListener(e) {
        if (this.externalListeners) {
            const t = this.externalListeners.indexOf(e);
            -1 !== t && this.externalListeners.splice(t, 1);
        }
    }
    notifyExternalListeners(e, t) {
        this.externalListeners &&
            this.externalListeners.forEach((i) => {
                try {
                    i(e, t);
                } catch (r) {
                    logger$l.error('ParticleSettingsUI: Error in external listener:', r);
                }
            });
    }
    updatePerformanceStatus(e) {
        this.elements.settingsButton &&
            e &&
            (e.degradationLevel > 0
                ? ((this.elements.settingsButton.style.borderColor = '#ff8c00'),
                  (this.elements.settingsButton.title = `Particle Settings (Performance Mode: Level ${e.degradationLevel})`))
                : ((this.elements.settingsButton.style.borderColor = 'white'),
                  (this.elements.settingsButton.title = 'Particle Settings')));
    }
    exportSettings() {
        return this.particleSettings.exportSettings();
    }
    importSettings(e) {
        return this.particleSettings.importSettings(e);
    }
    dispose() {
        (this.elements.settingsButton &&
            this.elements.settingsButton.removeEventListener('click', this.togglePanel),
            this.particleSettings.removeChangeListener(this.handleSettingChange),
            (this.elements = {}),
            (this.externalListeners = []));
    }
};
module$H.exports = { ParticleSettingsUI: ParticleSettingsUI$2 };
const __CJS__export_default__$G =
        (null == module$H.exports ? {} : module$H.exports).default || module$H.exports,
    __CJS__import__23__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$G },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$G = { exports: {} };
const { logger: logger$k } = __CJS__export_default__$1a || __CJS__import__50__;
class PostProcessingPipeline {
    constructor(e, t, i) {
        ((this.renderer = e),
            (this.scene = t),
            (this.camera = i),
            (this.composer = null),
            (this.renderPass = null),
            (this.bloomPass = null),
            (this.initialized = !1),
            (this.currentQuality = 'high'),
            (this.bloomConfig = { strength: 1, radius: 0.4, threshold: 0.85 }),
            (this.qualitySettings = {
                high: { resolution: 1, radius: 0.4, strength: 1, threshold: 0.85 },
                medium: { resolution: 0.75, radius: 0.3, strength: 0.8, threshold: 0.9 },
                low: { resolution: 0.5, radius: 0.2, strength: 0.6, threshold: 0.95 },
                minimal: { resolution: 0.25, radius: 0.1, strength: 0.4, threshold: 1 },
            }));
    }
    initialize() {
        try {
            if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass)
                throw new Error('Required Three.js post-processing classes not available');
            return (
                (this.composer = new THREE.EffectComposer(this.renderer)),
                this.composer.setSize(window.innerWidth, window.innerHeight),
                (this.renderPass = new THREE.RenderPass(this.scene, this.camera)),
                this.composer.addPass(this.renderPass),
                (this.bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    this.bloomConfig.strength,
                    this.bloomConfig.radius,
                    this.bloomConfig.threshold
                )),
                (this.bloomPass.renderToScreen = !0),
                this.composer.addPass(this.bloomPass),
                (this.initialized = !0),
                logger$k.info(
                    'PostProcessingPipeline: Successfully initialized with bloom effects'
                ),
                !0
            );
        } catch (e) {
            return (
                logger$k.error('PostProcessingPipeline: Failed to initialize:', e),
                (this.initialized = !1),
                !1
            );
        }
    }
    setBloomStrength(e) {
        if (!this.bloomPass)
            return void logger$k.warn('PostProcessingPipeline: Bloom pass not initialized');
        const t = Math.max(0, Math.min(2, e));
        ((this.bloomPass.strength = t),
            (this.bloomConfig.strength = t),
            logger$k.info(`PostProcessingPipeline: Bloom strength set to ${t}`));
    }
    configureBloomParameters(e = {}) {
        if (this.bloomPass) {
            if (void 0 !== e.threshold) {
                const t = Math.max(0, Math.min(1, e.threshold));
                ((this.bloomPass.threshold = t), (this.bloomConfig.threshold = t));
            }
            if (void 0 !== e.radius) {
                const t = Math.max(0, Math.min(1, e.radius));
                ((this.bloomPass.radius = t), (this.bloomConfig.radius = t));
            }
            logger$k.info('PostProcessingPipeline: Bloom parameters updated:', this.bloomConfig);
        } else logger$k.warn('PostProcessingPipeline: Bloom pass not initialized');
    }
    setQuality(e) {
        if (!this.qualitySettings[e])
            return void logger$k.warn(`PostProcessingPipeline: Invalid quality level: ${e}`);
        this.currentQuality = e;
        const t = this.qualitySettings[e];
        if (this.bloomPass && this.composer) {
            const i = this.renderer.getSize(new THREE.Vector2()),
                r = Math.floor(i.x * t.resolution),
                n = Math.floor(i.y * t.resolution);
            ((this.bloomPass.resolution = new THREE.Vector2(r, n)),
                (this.bloomPass.radius = t.radius),
                (this.bloomPass.threshold = t.threshold),
                (this.bloomPass.strength = this.bloomConfig.strength * t.strength),
                logger$k.info(`PostProcessingPipeline: Quality set to ${e} (${r}x${n})`));
        }
    }
    render() {
        if (this.initialized && this.composer)
            try {
                this.composer.render();
            } catch (e) {
                (logger$k.error('PostProcessingPipeline: Error during render:', e),
                    this.renderer.render(this.scene, this.camera));
            }
        else this.renderer.render(this.scene, this.camera);
    }
    resize(e, t) {
        if (this.initialized)
            try {
                if ((this.composer && this.composer.setSize(e, t), this.bloomPass)) {
                    const i = this.qualitySettings[this.currentQuality],
                        r = Math.floor(e * i.resolution),
                        n = Math.floor(t * i.resolution);
                    ((this.bloomPass.resolution = new THREE.Vector2(r, n)),
                        logger$k.info(
                            `PostProcessingPipeline: Resized to ${e}x${t}, bloom: ${r}x${n}`
                        ));
                }
            } catch (i) {
                logger$k.error('PostProcessingPipeline: Error during resize:', i);
            }
    }
    setEnabled(e) {
        this.initialized &&
            ((this.enabled = e),
            logger$k.info('PostProcessingPipeline: ' + (e ? 'Enabled' : 'Disabled')));
    }
    getBloomConfig() {
        return __spreadValues({}, this.bloomConfig);
    }
    getCurrentQuality() {
        return this.currentQuality;
    }
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: !1 !== this.enabled,
            quality: this.currentQuality,
            bloomStrength: this.bloomConfig.strength,
            bloomThreshold: this.bloomConfig.threshold,
            bloomRadius: this.bloomConfig.radius,
        };
    }
    dispose() {
        try {
            (this.composer &&
                (this.composer.passes.forEach((e) => {
                    e.dispose && e.dispose();
                }),
                this.composer.dispose(),
                (this.composer = null)),
                (this.renderPass = null),
                (this.bloomPass = null),
                (this.initialized = !1),
                logger$k.info('PostProcessingPipeline: Resources disposed'));
        } catch (e) {
            logger$k.error('PostProcessingPipeline: Error during disposal:', e);
        }
    }
    reset() {
        this.initialized &&
            ((this.bloomConfig = { strength: 1, radius: 0.4, threshold: 0.85 }),
            this.bloomPass &&
                ((this.bloomPass.strength = this.bloomConfig.strength),
                (this.bloomPass.radius = this.bloomConfig.radius),
                (this.bloomPass.threshold = this.bloomConfig.threshold)),
            this.setQuality('high'),
            logger$k.info('PostProcessingPipeline: Reset to default settings'));
    }
}
module$G.exports = { PostProcessingPipeline: PostProcessingPipeline };
const __CJS__export_default__$F =
        (null == module$G.exports ? {} : module$G.exports).default || module$G.exports,
    __CJS__import__1__$3 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$F },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$F = { exports: {} };
const { logger: logger$j } = __CJS__export_default__$1a || __CJS__import__50__;
class PerformanceScaler {
    constructor() {
        ((this.targetFPS = 60),
            (this.minFPS = 50),
            (this.frameRateHistory = []),
            (this.frameRateHistorySize = 30),
            (this.lastFrameTime =
                'undefined' != typeof performance ? performance.now() : Date.now()),
            (this.qualityLevels = {
                high: {
                    bloomResolution: 1,
                    bloomStrength: 1.5,
                    emissiveIntensity: 0.8,
                    pulseEnabled: !0,
                    description: 'Full quality glow effects',
                },
                medium: {
                    bloomResolution: 0.75,
                    bloomStrength: 1,
                    emissiveIntensity: 0.6,
                    pulseEnabled: !0,
                    description: 'Reduced bloom resolution',
                },
                low: {
                    bloomResolution: 0.5,
                    bloomStrength: 0.7,
                    emissiveIntensity: 0.4,
                    pulseEnabled: !1,
                    description: 'Low quality glow effects',
                },
                minimal: {
                    bloomResolution: 0.25,
                    bloomStrength: 0.3,
                    emissiveIntensity: 0.2,
                    pulseEnabled: !1,
                    description: 'Minimal glow effects',
                },
                disabled: {
                    bloomResolution: 0,
                    bloomStrength: 0,
                    emissiveIntensity: 0,
                    pulseEnabled: !1,
                    description: 'Glow effects disabled',
                },
            }),
            (this.currentQuality = 'high'),
            (this.scalingEnabled = !0),
            (this.lowFPSStartTime = null),
            (this.lowFPSDuration = 0),
            (this.scalingTriggerDelay = 2e3),
            (this.goodFPSStartTime = null),
            (this.goodFPSDuration = 0),
            (this.recoveryDelay = 5e3),
            (this.onQualityChangeCallback = null),
            (this.onPerformanceWarningCallback = null),
            (this.scalingHistory = []),
            (this.maxScalingHistory = 10),
            (this.dynamicAdjustments = {}),
            (this.adaptiveScaling = !0),
            (this.performanceBuffer = 0.1),
            (this.recoveryAttempts = 0),
            (this.maxRecoveryAttempts = 3),
            (this.recoveryBackoffMultiplier = 1.5),
            (this.baseRecoveryDelay = 5e3),
            (this.fallbackEnabled = !0),
            (this.fallbackTriggered = !1),
            (this.criticalFPSThreshold = 30));
    }
    setOnQualityChange(e) {
        this.onQualityChangeCallback = e;
    }
    setOnPerformanceWarning(e) {
        this.onPerformanceWarningCallback = e;
    }
    monitorPerformance(e) {
        if (!this.scalingEnabled) return;
        const t = 'undefined' != typeof performance ? performance.now() : Date.now(),
            i = null != e ? e : t - this.lastFrameTime;
        let r;
        ((r = i <= 0 ? 60 : 1e3 / i),
            this.frameRateHistory.push(r),
            this.frameRateHistory.length > this.frameRateHistorySize &&
                this.frameRateHistory.shift(),
            this.checkPerformanceConditions(r, t),
            (this.lastFrameTime = t));
    }
    checkPerformanceConditions(e, t) {
        const i = this.getAverageFPS();
        if (this.fallbackEnabled && i < this.criticalFPSThreshold && !this.fallbackTriggered)
            this.triggerFallback();
        else if (i < this.minFPS)
            (null === this.lowFPSStartTime && (this.lowFPSStartTime = t),
                (this.lowFPSDuration = t - this.lowFPSStartTime),
                (this.goodFPSStartTime = null),
                (this.goodFPSDuration = 0),
                this.lowFPSDuration >= this.scalingTriggerDelay && this.scaleQualityDown());
        else if (i >= 0.95 * this.targetFPS) {
            (null === this.goodFPSStartTime && (this.goodFPSStartTime = t),
                (this.goodFPSDuration = t - this.goodFPSStartTime),
                (this.lowFPSStartTime = null),
                (this.lowFPSDuration = 0));
            const e =
                this.baseRecoveryDelay *
                Math.pow(this.recoveryBackoffMultiplier, this.recoveryAttempts);
            this.goodFPSDuration >= e &&
                'high' !== this.currentQuality &&
                this.attemptQualityRecovery();
        } else
            ((this.lowFPSStartTime = null),
                (this.lowFPSDuration = 0),
                (this.goodFPSStartTime = null),
                (this.goodFPSDuration = 0));
    }
    scaleQualityDown() {
        const e = ['high', 'medium', 'low', 'minimal', 'disabled'],
            t = e.indexOf(this.currentQuality);
        if (t < e.length - 1) {
            const i = e[t + 1];
            this.scaleQuality(i, 'automatic_downscale') &&
                this.onPerformanceWarningCallback &&
                this.onPerformanceWarningCallback({
                    type: 'low_fps',
                    averageFPS: this.getAverageFPS(),
                    action: 'quality_reduced',
                    newQuality: i,
                });
        }
        ((this.lowFPSStartTime = null), (this.lowFPSDuration = 0));
    }
    scaleQualityUp() {
        const e = ['disabled', 'minimal', 'low', 'medium', 'high'],
            t = e.indexOf(this.currentQuality);
        if (t < e.length - 1) {
            const i = e[t + 1];
            this.scaleQuality(i, 'automatic_upscale');
        }
        ((this.goodFPSStartTime = null), (this.goodFPSDuration = 0));
    }
    scaleQuality(e, t = 'manual') {
        if (!this.qualityLevels[e]) return (logger$j.warn(`Invalid quality level: ${e}`), !1);
        if (this.currentQuality === e) return !1;
        const i = this.currentQuality;
        this.getQualitySettings();
        const r = this.qualityLevels[e],
            n = this.calculateDynamicAdjustments(r, t);
        ((this.currentQuality = e),
            (this.dynamicAdjustments = n),
            this.recordScalingEvent(i, e, t));
        const s = this.getQualitySettings();
        return (
            this.onQualityChangeCallback && this.onQualityChangeCallback(e, s, t),
            logger$j.info(`Glow effect quality scaled: ${i} → ${e} (${t})`),
            Object.keys(n).length > 0 && logger$j.info('Dynamic adjustments applied:', n),
            !0
        );
    }
    setQuality(e, t = 'manual') {
        return this.scaleQuality(e, t);
    }
    calculateDynamicAdjustments(e, t) {
        if (!this.adaptiveScaling) return {};
        const i = {},
            r = this.getAverageFPS() / this.targetFPS;
        if ('automatic_downscale' === t && r < 0.8)
            ((i.bloomResolution = Math.max(0.1, 0.7 * e.bloomResolution)),
                (i.bloomStrength = Math.max(0.1, 0.8 * e.bloomStrength)),
                (i.emissiveIntensity = Math.max(0.1, 0.9 * e.emissiveIntensity)));
        else if ('automatic_upscale' === t && r > 1.1) {
            const t = Math.min(1.2, r - this.performanceBuffer);
            ((i.bloomResolution = Math.min(1, e.bloomResolution * t)),
                (i.bloomStrength = Math.min(2, e.bloomStrength * t)));
        }
        if (this.recoveryAttempts > 0) {
            const e = 1 - 0.1 * this.recoveryAttempts;
            (i.bloomResolution && (i.bloomResolution *= e),
                i.bloomStrength && (i.bloomStrength *= e));
        }
        return i;
    }
    getQualitySettings() {
        const e = __spreadValues({}, this.qualityLevels[this.currentQuality]);
        return this.dynamicAdjustments && Object.keys(this.dynamicAdjustments).length > 0
            ? __spreadValues(__spreadValues({}, e), this.dynamicAdjustments)
            : e;
    }
    getAvailableQualities() {
        return Object.keys(this.qualityLevels).map((e) =>
            __spreadValues({ key: e }, this.qualityLevels[e])
        );
    }
    getAverageFPS() {
        if (0 === this.frameRateHistory.length) return 60;
        return this.frameRateHistory.reduce((e, t) => e + t, 0) / this.frameRateHistory.length;
    }
    getPerformanceMetrics() {
        return {
            currentFPS:
                this.frameRateHistory.length > 0
                    ? this.frameRateHistory[this.frameRateHistory.length - 1]
                    : 60,
            averageFPS: this.getAverageFPS(),
            minFPS: this.frameRateHistory.length > 0 ? Math.min(...this.frameRateHistory) : 60,
            maxFPS: this.frameRateHistory.length > 0 ? Math.max(...this.frameRateHistory) : 60,
            currentQuality: this.currentQuality,
            qualitySettings: this.getQualitySettings(),
            scalingEnabled: this.scalingEnabled,
            lowFPSDuration: this.lowFPSDuration,
            goodFPSDuration: this.goodFPSDuration,
        };
    }
    recordScalingEvent(e, t, i) {
        const r = {
            timestamp: Date.now(),
            from: e,
            to: t,
            reason: i,
            averageFPS: this.getAverageFPS(),
            frameRateHistory: [...this.frameRateHistory],
        };
        (this.scalingHistory.push(r),
            this.scalingHistory.length > this.maxScalingHistory && this.scalingHistory.shift());
    }
    setScalingEnabled(e) {
        ((this.scalingEnabled = e),
            e ||
                ((this.lowFPSStartTime = null),
                (this.lowFPSDuration = 0),
                (this.goodFPSStartTime = null),
                (this.goodFPSDuration = 0)));
    }
    isScalingEnabled() {
        return this.scalingEnabled;
    }
    getScalingHistory() {
        return [...this.scalingHistory];
    }
    getRecoveryStatus() {
        return {
            recoveryAttempts: this.recoveryAttempts,
            maxRecoveryAttempts: this.maxRecoveryAttempts,
            fallbackTriggered: this.fallbackTriggered,
            adaptiveScaling: this.adaptiveScaling,
            dynamicAdjustments: __spreadValues({}, this.dynamicAdjustments),
            nextRecoveryDelay:
                this.baseRecoveryDelay *
                Math.pow(this.recoveryBackoffMultiplier, this.recoveryAttempts),
        };
    }
    getPerformanceAnalysis() {
        const e = this.getPerformanceMetrics(),
            t = this.getRecoveryStatus();
        return __spreadProps(__spreadValues(__spreadValues({}, e), t), {
            performanceGrade: this.calculatePerformanceGrade(e.averageFPS),
            recommendedQuality: this.getRecommendedQuality(e.averageFPS),
            scalingEffectiveness: this.calculateScalingEffectiveness(),
        });
    }
    calculatePerformanceGrade(e) {
        return e >= 0.95 * this.targetFPS
            ? 'A'
            : e >= 0.85 * this.targetFPS
              ? 'B'
              : e >= 0.75 * this.targetFPS
                ? 'C'
                : e >= 0.6 * this.targetFPS
                  ? 'D'
                  : 'F';
    }
    getRecommendedQuality(e) {
        return e < this.criticalFPSThreshold
            ? 'disabled'
            : e < 0.8 * this.minFPS
              ? 'minimal'
              : e < this.minFPS
                ? 'low'
                : e < 0.9 * this.targetFPS
                  ? 'medium'
                  : 'high';
    }
    calculateScalingEffectiveness() {
        if (0 === this.scalingHistory.length) return 1;
        let e = 0,
            t = this.scalingHistory.length;
        return (
            this.scalingHistory.forEach((t) => {
                ('automatic_downscale' !== t.reason && 'automatic_upscale' !== t.reason) || e++;
            }),
            e / t
        );
    }
    reset() {
        ((this.frameRateHistory = []),
            (this.lowFPSStartTime = null),
            (this.lowFPSDuration = 0),
            (this.goodFPSStartTime = null),
            (this.goodFPSDuration = 0),
            (this.scalingHistory = []),
            (this.dynamicAdjustments = {}),
            (this.recoveryAttempts = 0),
            (this.fallbackTriggered = !1),
            (this.lastFrameTime =
                'undefined' != typeof performance ? performance.now() : Date.now()));
    }
    update(e) {
        this.monitorPerformance(e);
    }
    getPerformanceStatus() {
        const e = this.getPerformanceMetrics(),
            t = this.getRecoveryStatus();
        return {
            fps: Math.round(e.currentFPS),
            avgFPS: Math.round(e.averageFPS),
            quality: this.currentQuality,
            qualityDescription: this.qualityLevels[this.currentQuality].description,
            scalingEnabled: this.scalingEnabled,
            adaptiveScaling: this.adaptiveScaling,
            performanceIssue: e.averageFPS < this.minFPS,
            criticalPerformance: e.averageFPS < this.criticalFPSThreshold,
            scalingEvents: this.scalingHistory.length,
            recoveryAttempts: t.recoveryAttempts,
            fallbackTriggered: t.fallbackTriggered,
            hasDynamicAdjustments: Object.keys(this.dynamicAdjustments).length > 0,
            performanceGrade: this.calculatePerformanceGrade(e.averageFPS),
        };
    }
    attemptQualityRecovery() {
        this.recoveryAttempts >= this.maxRecoveryAttempts
            ? logger$j.info('Maximum recovery attempts reached, maintaining current quality')
            : (this.recoveryAttempts++,
              logger$j.info(
                  `Attempting quality recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`
              ),
              this.scaleQualityUp(),
              (this.goodFPSStartTime = null),
              (this.goodFPSDuration = 0));
    }
    triggerFallback() {
        this.fallbackTriggered ||
            ((this.fallbackTriggered = !0),
            logger$j.warn('Critical performance detected, disabling glow effects completely'),
            this.scaleQuality('disabled', 'fallback'),
            this.onPerformanceWarningCallback &&
                this.onPerformanceWarningCallback({
                    type: 'critical_performance',
                    averageFPS: this.getAverageFPS(),
                    action: 'effects_disabled',
                    newQuality: 'disabled',
                }));
    }
    resetFallback() {
        ((this.fallbackTriggered = !1),
            (this.recoveryAttempts = 0),
            logger$j.info('Fallback state reset, recovery attempts cleared'));
    }
    setAdaptiveScaling(e) {
        ((this.adaptiveScaling = e), e || (this.dynamicAdjustments = {}));
    }
    isAdaptiveScalingEnabled() {
        return this.adaptiveScaling;
    }
    forceQuality(e) {
        const t = this.scalingEnabled;
        ((this.scalingEnabled = !1), (this.dynamicAdjustments = {}));
        const i = this.setQuality(e, 'forced');
        return (
            setTimeout(() => {
                this.scalingEnabled = t;
            }, 1e4),
            i
        );
    }
}
module$F.exports = { PerformanceScaler: PerformanceScaler };
const __CJS__export_default__$E =
        (null == module$F.exports ? {} : module$F.exports).default || module$F.exports,
    __CJS__import__3__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$E },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$E = { exports: {} };
const { Logger: Logger$9 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$i = new Logger$9('GlowSettings');
class GlowSettings {
    constructor() {
        ((this.intensityLevels = {
            OFF: { emissive: 0, bloom: 0, label: 'Off' },
            LOW: { emissive: 0.3, bloom: 0.5, label: 'Low' },
            MEDIUM: { emissive: 0.6, bloom: 1, label: 'Medium' },
            HIGH: { emissive: 0.8, bloom: 1.5, label: 'High' },
        }),
            (this.defaults = { intensity: 'MEDIUM', version: 1 }),
            (this.settings = __spreadValues({}, this.defaults)),
            (this.storageKey = 'lightbikes_glow_settings'),
            this.loadSettings());
    }
    getIntensity() {
        return this.settings.intensity;
    }
    setIntensity(e) {
        return this.isValidIntensity(e)
            ? ((this.settings.intensity = e), this.saveSettings(), !0)
            : (logger$i.warn(`Invalid glow intensity level: ${e}`), !1);
    }
    getIntensityConfig() {
        return this.intensityLevels[this.settings.intensity];
    }
    getAvailableLevels() {
        return this.intensityLevels;
    }
    isValidIntensity(e) {
        return !(
            !e ||
            'string' != typeof e ||
            '' === e.trim() ||
            !this.intensityLevels.hasOwnProperty(e)
        );
    }
    loadSettings() {
        try {
            const e = localStorage.getItem(this.storageKey);
            if (!e) return;
            const t = JSON.parse(e);
            if (this.validateSettings(t)) {
                const e = this.migrateSettings(t);
                this.settings = __spreadValues(__spreadValues({}, this.defaults), e);
            } else
                (logger$i.warn('Invalid stored glow settings, using defaults'),
                    (this.settings = __spreadValues({}, this.defaults)));
        } catch (e) {
            (logger$i.error('Error loading glow settings:', e),
                (this.settings = __spreadValues({}, this.defaults)));
        }
    }
    saveSettings() {
        try {
            const e = __spreadProps(__spreadValues({}, this.settings), {
                version: this.defaults.version,
            });
            localStorage.setItem(this.storageKey, JSON.stringify(e));
        } catch (e) {
            logger$i.error('Error saving glow settings:', e);
        }
    }
    validateSettings(e) {
        return (
            !(!e || 'object' != typeof e) && !(e.intensity && !this.isValidIntensity(e.intensity))
        );
    }
    migrateSettings(e) {
        const t = __spreadValues({}, e);
        return ((e.version || 0) < 1 && (t.version = 1), t);
    }
    resetToDefaults() {
        ((this.settings = __spreadValues({}, this.defaults)), this.saveSettings());
    }
    getSettings() {
        return __spreadValues({}, this.settings);
    }
    isEnabled() {
        return 'OFF' !== this.settings.intensity;
    }
    getEmissiveIntensity() {
        return this.intensityLevels[this.settings.intensity].emissive;
    }
    getBloomStrength() {
        return this.intensityLevels[this.settings.intensity].bloom;
    }
    getIntensityLabel() {
        return this.intensityLevels[this.settings.intensity].label;
    }
}
module$E.exports = { GlowSettings: GlowSettings };
const __CJS__export_default__$D =
        (null == module$E.exports ? {} : module$E.exports).default || module$E.exports,
    __CJS__import__4__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$D },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$D = { exports: {} };
const { logger: logger$h } = __CJS__export_default__$1a || __CJS__import__50__;
let GlowEffectManager$2 = class {
    constructor(e, t, i) {
        ((this.renderer = e),
            (this.scene = t),
            (this.camera = i),
            (this.postProcessing = null),
            (this.materialSystem = null),
            (this.performanceScaler = null),
            (this.settings = null),
            (this.initialized = !1),
            (this.enabled = !0),
            (this.currentIntensity = 'MEDIUM'),
            (this.fallbackMode = !1),
            (this.forceQualityMode = null),
            (this.lastFrameTime = 0),
            (this.frameCount = 0),
            (this.isPaused = !1),
            (this.lastQuality = null),
            (this.memoryStats = null),
            (this.memoryMonitorInterval = null),
            this.initializeLogging());
    }
    initialize() {
        try {
            if (!this.checkWebGLSupport())
                return (
                    logger$h.warn(
                        'GlowEffectManager: WebGL support insufficient, enabling fallback mode'
                    ),
                    this.initializeFallbackRendering(),
                    (this.enabled = !1),
                    (this.fallbackMode = !0),
                    !0
                );
            const { PostProcessingPipeline: e } = __CJS__export_default__$F || __CJS__import__1__$3,
                { EmissiveMaterialSystem: t } = __CJS__export_default__$V || __CJS__import__5__,
                { PerformanceScaler: i } = __CJS__export_default__$E || __CJS__import__3__$1,
                { GlowSettings: r } = __CJS__export_default__$D || __CJS__import__4__;
            return (
                (this.postProcessing = new e(this.renderer, this.scene, this.camera)),
                (this.materialSystem = new t()),
                (this.performanceScaler = new i()),
                (this.settings = new r()),
                this.forceQualityMode &&
                    (this.performanceScaler.setQuality(this.forceQualityMode),
                    logger$h.info(
                        `GlowEffectManager: Using forced quality mode: ${this.forceQualityMode}`
                    )),
                this.postProcessing.initialize()
                    ? (this.postProcessing.configureBloomParameters({
                          threshold: 0.85,
                          radius: 0.4,
                      }),
                      this.loadSettings(),
                      this.applyIntensitySettings(),
                      this.checkParticleCompatibility(),
                      this.startMemoryMonitoring(),
                      (this.initialized = !0),
                      logger$h.info('GlowEffectManager: Successfully initialized'),
                      !0)
                    : (logger$h.warn(
                          'GlowEffectManager: Post-processing failed, falling back to compatibility mode'
                      ),
                      this.initializeFallbackRendering(),
                      (this.enabled = !1),
                      (this.fallbackMode = !0),
                      !0)
            );
        } catch (e) {
            (logger$h.error('GlowEffectManager: Failed to initialize:', e),
                logger$h.info('GlowEffectManager: Attempting fallback mode'));
            try {
                return (
                    this.initializeFallbackRendering(),
                    (this.enabled = !1),
                    (this.fallbackMode = !0),
                    !0
                );
            } catch (t) {
                return (
                    logger$h.error('GlowEffectManager: Fallback initialization also failed:', t),
                    (this.enabled = !1),
                    (this.fallbackMode = !1),
                    !1
                );
            }
        }
    }
    update(e, t) {
        if (this.enabled && this.initialized)
            try {
                if (!this.validateUpdateInputs(e, t)) return;
                if (this.materialSystem)
                    try {
                        this.materialSystem.updatePulseAnimation(e);
                    } catch (i) {
                        this.logError('update', 'Error updating pulse animation', {
                            deltaTime: e,
                            error: i.message,
                        });
                    }
                if (this.performanceScaler)
                    try {
                        this.performanceScaler.monitorPerformance(e);
                        const t = this.performanceScaler.currentQuality;
                        t !== this.lastQuality &&
                            (this.applyQualityScaling(t), (this.lastQuality = t));
                    } catch (i) {
                        this.logError('update', 'Error in performance scaling', {
                            deltaTime: e,
                            error: i.message,
                        });
                    }
                try {
                    this.handlePauseStateChange(t);
                } catch (i) {
                    this.logError('update', 'Error handling pause state change', {
                        gameState: t,
                        error: i.message,
                    });
                }
            } catch (i) {
                this.logError('update', 'Unexpected error during update', {
                    deltaTime: e,
                    gameState: t,
                    error: i.message,
                });
            }
    }
    validateUpdateInputs(e, t) {
        return 'number' != typeof e || e < 0 || e > 1
            ? (this.logWarning('validateUpdateInputs', 'Invalid deltaTime', { deltaTime: e }), !1)
            : !(!t || 'object' != typeof t) ||
                  (this.logWarning('validateUpdateInputs', 'Invalid gameState', { gameState: t }),
                  !1);
    }
    handlePauseStateChange(e) {
        e.isPaused && !this.isPaused
            ? (this.materialSystem && this.materialSystem.pausePulse(),
              (this.isPaused = !0),
              this.logInfo('handlePauseStateChange', 'Glow effects paused'))
            : !e.isPaused &&
              this.isPaused &&
              (this.materialSystem && this.materialSystem.resumePulse(),
              (this.isPaused = !1),
              this.logInfo('handlePauseStateChange', 'Glow effects resumed'));
    }
    render() {
        if (!this.fallbackMode && this.enabled && this.initialized)
            try {
                this.postProcessing.render();
            } catch (e) {
                if (
                    (this.logError('render', 'Error during post-processing render', {
                        error: e.message,
                    }),
                    this.handleRenderingFailure(e, 'post-processing'))
                )
                    try {
                        this.fallbackMode
                            ? this.renderer.render(this.scene, this.camera)
                            : this.postProcessing.render();
                    } catch (t) {
                        (this.logError('render', 'Error during retry after recovery', {
                            error: t.message,
                        }),
                            this.renderer.render(this.scene, this.camera));
                    }
                else this.renderer.render(this.scene, this.camera);
            }
        else
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (e) {
                this.logError('render', 'Error in fallback rendering', { error: e.message });
            }
    }
    setIntensity(e) {
        try {
            if (!this.validateIntensityLevel(e))
                return (
                    this.logError('setIntensity', `Invalid intensity level: ${e}`, { level: e }),
                    !1
                );
            if (!this.enabled || !this.initialized)
                return (
                    this.logWarning('setIntensity', 'Glow system not enabled or initialized', {
                        enabled: this.enabled,
                        initialized: this.initialized,
                    }),
                    !1
                );
            const i = this.currentIntensity;
            if (((this.currentIntensity = e), !this.applyIntensitySettings()))
                return (
                    (this.currentIntensity = i),
                    this.logError(
                        'setIntensity',
                        'Failed to apply intensity settings, rolled back',
                        { attempted: e, rolledBackTo: i }
                    ),
                    !1
                );
            try {
                this.settings.setIntensity(e);
            } catch (t) {
                this.logWarning('setIntensity', 'Failed to save intensity setting', {
                    level: e,
                    error: t.message,
                });
            }
            return (this.logInfo('setIntensity', `Intensity changed from ${i} to ${e}`), !0);
        } catch (t) {
            return (
                this.logError('setIntensity', 'Unexpected error during intensity change', {
                    level: e,
                    error: t.message,
                }),
                !1
            );
        }
    }
    validateIntensityLevel(e) {
        return 'string' == typeof e && ['OFF', 'LOW', 'MEDIUM', 'HIGH'].includes(e.toUpperCase());
    }
    validateConfiguration(e) {
        const t = { isValid: !0, errors: [], warnings: [] };
        return e && 'object' == typeof e
            ? (void 0 !== e.bloom &&
                  ('number' != typeof e.bloom || e.bloom < 0 || e.bloom > 2) &&
                  (t.errors.push('Bloom strength must be a number between 0 and 2'),
                  (t.isValid = !1)),
              void 0 !== e.emissive &&
                  ('number' != typeof e.emissive || e.emissive < 0 || e.emissive > 1) &&
                  (t.errors.push('Emissive intensity must be a number between 0 and 1'),
                  (t.isValid = !1)),
              void 0 !== e.threshold &&
                  ('number' != typeof e.threshold || e.threshold < 0 || e.threshold > 1) &&
                  (t.errors.push('Bloom threshold must be a number between 0 and 1'),
                  (t.isValid = !1)),
              void 0 !== e.radius &&
                  ('number' != typeof e.radius || e.radius < 0 || e.radius > 1) &&
                  (t.errors.push('Bloom radius must be a number between 0 and 1'),
                  (t.isValid = !1)),
              t)
            : ((t.isValid = !1), t.errors.push('Configuration must be an object'), t);
    }
    createBikeMaterial(e, t) {
        return this.fallbackMode && this.fallbackMaterials
            ? this.fallbackMaterials.createBikeMaterial(e, t)
            : this.enabled && this.initialized
              ? this.materialSystem.createBikeMaterial(e, t)
              : new THREE.MeshLambertMaterial({ color: t });
    }
    createTrailMaterial(e, t) {
        return this.fallbackMode && this.fallbackMaterials
            ? this.fallbackMaterials.createTrailMaterial(e, t)
            : this.enabled && this.initialized
              ? this.materialSystem.createTrailMaterial(e, t)
              : new THREE.MeshBasicMaterial({ color: t, transparent: !0, opacity: 0.5 });
    }
    handleResize(e, t) {
        (this.postProcessing && this.postProcessing.resize(e, t),
            window.glowSettingsUI && window.glowSettingsUI.handleResize());
    }
    checkParticleCompatibility() {
        var e, t;
        try {
            return (
                !(null == (t = null == (e = window.renderingEngine) ? void 0 : e.getParticleSystem)
                    ? void 0
                    : t.call(e)) ||
                (logger$h.info(
                    'GlowEffectManager: Particle system detected, ensuring compatibility'
                ),
                !0)
            );
        } catch (i) {
            return (
                logger$h.warn('GlowEffectManager: Error checking particle compatibility:', i),
                !0
            );
        }
    }
    handleGameRestart() {
        if (this.enabled && this.initialized)
            try {
                this.materialSystem && this.materialSystem.dispose();
                const { EmissiveMaterialSystem: e } =
                    __CJS__export_default__$V || __CJS__import__5__;
                ((this.materialSystem = new e()),
                    (this.isPaused = !1),
                    logger$h.info('GlowEffectManager: Game restart handled'));
            } catch (e) {
                logger$h.error('GlowEffectManager: Error handling game restart:', e);
            }
    }
    handleGameModeSwitch(e, t) {
        if (this.enabled && this.initialized)
            try {
                (this.handleGameRestart(),
                    'TIME_TRIAL' === e
                        ? logger$h.info('GlowEffectManager: Switched to Time Trial mode')
                        : 'ARENA_SHRINK' === e
                          ? logger$h.info('GlowEffectManager: Switched to Arena Shrink mode')
                          : logger$h.info('GlowEffectManager: Switched to Classic mode'));
            } catch (i) {
                logger$h.error('GlowEffectManager: Error handling game mode switch:', i);
            }
    }
    forcePause() {
        this.materialSystem && (this.materialSystem.pausePulse(), (this.isPaused = !0));
    }
    forceResume() {
        this.materialSystem && (this.materialSystem.resumePulse(), (this.isPaused = !1));
    }
    dispose() {
        logger$h.info('GlowEffectManager: Starting resource cleanup');
        try {
            (this.postProcessing && (this.postProcessing.dispose(), (this.postProcessing = null)),
                this.materialSystem &&
                    (this.materialSystem.dispose(), (this.materialSystem = null)),
                this.performanceScaler && (this.performanceScaler = null),
                this.settings && (this.settings = null),
                this.fallbackMaterials && (this.fallbackMaterials = null));
            const e = document.getElementById('glow-compatibility-notification');
            (e && e.parentElement && e.parentElement.removeChild(e),
                this.memoryMonitorInterval &&
                    (clearInterval(this.memoryMonitorInterval),
                    (this.memoryMonitorInterval = null)),
                (this.initialized = !1),
                (this.enabled = !1),
                (this.fallbackMode = !1),
                (this.forceQualityMode = null),
                (this.isPaused = !1),
                (this.lastQuality = null),
                logger$h.info('GlowEffectManager: Resource cleanup completed'));
        } catch (e) {
            logger$h.error('GlowEffectManager: Error during disposal:', e);
        }
    }
    startMemoryMonitoring() {
        this.shouldMonitorMemory() &&
            (logger$h.info('GlowEffectManager: Starting memory monitoring'),
            (this.memoryStats = {
                initialMemory: this.getMemoryUsage(),
                peakMemory: 0,
                samples: [],
                leakWarningThreshold: 52428800,
                lastGCTime: Date.now(),
            }),
            (this.memoryMonitorInterval = setInterval(() => {
                this.checkMemoryUsage();
            }, 3e4)));
    }
    shouldMonitorMemory() {
        return (
            'localhost' === window.location.hostname ||
            window.location.search.includes('debug=true') ||
            'true' === localStorage.getItem('lightbikes_debug_memory')
        );
    }
    getMemoryUsage() {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
    }
    checkMemoryUsage() {
        const e = this.getMemoryUsage();
        if (0 === e) return;
        (this.memoryStats.samples.push({ timestamp: Date.now(), memory: e }),
            this.memoryStats.samples.length > 20 && this.memoryStats.samples.shift(),
            e > this.memoryStats.peakMemory && (this.memoryStats.peakMemory = e));
        const t = e - this.memoryStats.initialMemory;
        (t > this.memoryStats.leakWarningThreshold &&
            (logger$h.warn(
                `GlowEffectManager: Potential memory leak detected. Memory increased by ${Math.round(t / 1024 / 1024)}MB`
            ),
            this.handleMemoryLeak()),
            this.memoryStats.samples.length % 10 == 0 &&
                logger$h.info(
                    `GlowEffectManager: Memory usage: ${Math.round(e / 1024 / 1024)}MB (peak: ${Math.round(this.memoryStats.peakMemory / 1024 / 1024)}MB)`
                ));
    }
    handleMemoryLeak() {
        logger$h.warn('GlowEffectManager: Attempting to recover from memory leak');
        try {
            (window.gc &&
                (window.gc(), logger$h.info('GlowEffectManager: Forced garbage collection')),
                this.performanceScaler &&
                    (this.performanceScaler.setQuality('minimal'),
                    this.applyQualityScaling('minimal')),
                this.materialSystem && this.materialSystem.dispose(),
                setTimeout(() => {
                    ((this.memoryStats.initialMemory = this.getMemoryUsage()),
                        logger$h.info('GlowEffectManager: Memory baseline reset after cleanup'));
                }, 5e3));
        } catch (e) {
            logger$h.error('GlowEffectManager: Error during memory leak recovery:', e);
        }
    }
    getMemoryStats() {
        if (!this.memoryStats) return null;
        const e = this.getMemoryUsage();
        return {
            current: Math.round(e / 1024 / 1024),
            peak: Math.round(this.memoryStats.peakMemory / 1024 / 1024),
            increase: Math.round((e - this.memoryStats.initialMemory) / 1024 / 1024),
            samples: this.memoryStats.samples.length,
        };
    }
    initializeLogging() {
        ((this.debugMode = this.isDebugMode()),
            (this.logHistory = []),
            (this.maxLogHistory = 100),
            this.debugMode &&
                (logger$h.info('GlowEffectManager: Debug mode enabled'),
                (window.glowDebug = {
                    getStatus: () => this.getStatus(),
                    getMemoryStats: () => this.getMemoryStats(),
                    getLogs: () => this.getLogHistory(),
                    clearLogs: () => this.clearLogHistory(),
                    setIntensity: (e) => this.setIntensity(e),
                    forceGC: () => this.handleMemoryLeak(),
                    dumpState: () => this.dumpDebugState(),
                })));
    }
    isDebugMode() {
        return (
            'localhost' === window.location.hostname ||
            window.location.search.includes('debug=true') ||
            'true' === localStorage.getItem('lightbikes_debug_glow')
        );
    }
    logError(e, t, i = {}) {
        const r = {
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            method: e,
            message: t,
            context: i,
        };
        (this.addToLogHistory(r), logger$h.error(`GlowEffectManager.${e}: ${t}`, i));
    }
    logWarning(e, t, i = {}) {
        const r = {
            level: 'WARNING',
            timestamp: new Date().toISOString(),
            method: e,
            message: t,
            context: i,
        };
        (this.addToLogHistory(r), logger$h.warn(`GlowEffectManager.${e}: ${t}`, i));
    }
    logInfo(e, t, i = {}) {
        const r = {
            level: 'INFO',
            timestamp: new Date().toISOString(),
            method: e,
            message: t,
            context: i,
        };
        (this.addToLogHistory(r),
            this.debugMode && logger$h.info(`GlowEffectManager.${e}: ${t}`, i));
    }
    addToLogHistory(e) {
        (this.logHistory || (this.logHistory = []),
            this.logHistory.push(e),
            this.logHistory.length > this.maxLogHistory && this.logHistory.shift());
    }
    getLogHistory() {
        return this.logHistory || [];
    }
    clearLogHistory() {
        ((this.logHistory = []), logger$h.info('GlowEffectManager: Log history cleared'));
    }
    dumpDebugState() {
        const e = {
            timestamp: new Date().toISOString(),
            system: {
                enabled: this.enabled,
                initialized: this.initialized,
                fallbackMode: this.fallbackMode,
                forceQualityMode: this.forceQualityMode,
                currentIntensity: this.currentIntensity,
                isPaused: this.isPaused,
            },
            postProcessing: this.postProcessing ? this.postProcessing.getStatus() : null,
            performance: this.performanceScaler
                ? {
                      currentQuality: this.performanceScaler.currentQuality,
                      scalingEnabled: this.performanceScaler.scalingEnabled,
                  }
                : null,
            memory: this.getMemoryStats(),
            materials: this.materialSystem
                ? {
                      materialCount: this.materialSystem.materials.size,
                      pulseState: this.materialSystem.pulseState,
                  }
                : null,
            logs: this.getLogHistory().slice(-10),
            webgl: this.getWebGLInfo(),
        };
        return (logger$h.info('GlowEffectManager Debug State:', e), e);
    }
    getWebGLInfo() {
        try {
            const e = document.createElement('canvas'),
                t =
                    e.getContext('webgl2') ||
                    e.getContext('webgl') ||
                    e.getContext('experimental-webgl');
            return t
                ? {
                      supported: !0,
                      version: t.getParameter(t.VERSION),
                      vendor: t.getParameter(t.VENDOR),
                      renderer: t.getParameter(t.RENDERER),
                      maxTextureSize: t.getParameter(t.MAX_TEXTURE_SIZE),
                      maxRenderbufferSize: t.getParameter(t.MAX_RENDERBUFFER_SIZE),
                      extensions: t.getSupportedExtensions(),
                  }
                : { supported: !1 };
        } catch (e) {
            return { supported: !1, error: e.message };
        }
    }
    handleRenderingFailure(e, t = 'unknown') {
        this.logError('handleRenderingFailure', `Rendering failure in ${t}`, {
            error: e.message,
            stack: e.stack,
        });
        try {
            return this.attemptQualityReduction()
                ? (this.logInfo('handleRenderingFailure', 'Recovered by reducing quality'), !0)
                : this.attemptPostProcessingDisable()
                  ? (this.logInfo(
                        'handleRenderingFailure',
                        'Recovered by disabling post-processing'
                    ),
                    !0)
                  : this.attemptFallbackMode()
                    ? (this.logInfo(
                          'handleRenderingFailure',
                          'Recovered by switching to fallback mode'
                      ),
                      !0)
                    : (this.logError('handleRenderingFailure', 'All recovery attempts failed'), !1);
        } catch (i) {
            return (
                this.logError('handleRenderingFailure', 'Error during recovery attempt', {
                    originalError: e.message,
                    recoveryError: i.message,
                }),
                !1
            );
        }
    }
    attemptQualityReduction() {
        return (
            !(!this.performanceScaler || 'disabled' === this.performanceScaler.currentQuality) &&
            (this.performanceScaler.scaleQualityDown(),
            this.applyQualityScaling(this.performanceScaler.currentQuality),
            !0)
        );
    }
    attemptPostProcessingDisable() {
        return !(!this.postProcessing || !this.enabled) && (this.postProcessing.setEnabled(!1), !0);
    }
    attemptFallbackMode() {
        return (
            !this.fallbackMode &&
            (this.initializeFallbackRendering(), (this.enabled = !1), (this.fallbackMode = !0), !0)
        );
    }
    checkWebGLSupport() {
        try {
            const e = document.createElement('canvas'),
                t =
                    e.getContext('webgl2') ||
                    e.getContext('webgl') ||
                    e.getContext('experimental-webgl');
            if (!t)
                return (
                    this.showCompatibilityNotification(
                        'WebGL not supported',
                        'Your browser does not support WebGL. Glow effects will be disabled.'
                    ),
                    !1
                );
            const i = ['OES_texture_float', 'OES_texture_half_float'],
                r = t.getSupportedExtensions() || [],
                n = i.filter((e) => !r.includes(e) && !t.getExtension(e));
            n.length > 0 &&
                (logger$h.warn('GlowEffectManager: Missing WebGL extensions:', n),
                this.showCompatibilityNotification(
                    'Limited WebGL support',
                    'Some advanced glow effects may not work properly on this device.'
                ));
            const s = t.getParameter(t.MAX_TEXTURE_SIZE),
                a = t.getParameter(t.MAX_RENDERBUFFER_SIZE);
            (s < 1024 || a < 1024) &&
                (logger$h.warn('GlowEffectManager: Limited texture/renderbuffer size'),
                this.showCompatibilityNotification(
                    'Limited graphics capabilities',
                    'Glow effects will use reduced quality on this device.'
                ),
                (this.forceQualityMode = 'low'));
            const o = t.getParameter(t.RENDERER);
            return (
                this.isMobileGPU(o) &&
                    (logger$h.info(
                        'GlowEffectManager: Mobile GPU detected, using optimized settings'
                    ),
                    (this.forceQualityMode = 'medium')),
                !0
            );
        } catch (e) {
            return (
                logger$h.error('GlowEffectManager: WebGL compatibility check failed:', e),
                this.showCompatibilityNotification(
                    'Graphics initialization failed',
                    'Unable to initialize graphics system. Glow effects will be disabled.'
                ),
                !1
            );
        }
    }
    isMobileGPU(e) {
        const t = e.toLowerCase();
        return [
            'adreno',
            'mali',
            'powervr',
            'videocore',
            'tegra',
            'apple',
            'qualcomm',
            'arm',
            'imagination',
        ].some((e) => t.includes(e));
    }
    showCompatibilityNotification(e, t) {
        if ('undefined' != typeof document && document.body)
            try {
                let i = document.getElementById('glow-compatibility-notification');
                (i ||
                    ((i = document.createElement('div')),
                    (i.id = 'glow-compatibility-notification'),
                    (i.style.cssText =
                        '\n                    position: fixed;\n                    top: 20px;\n                    right: 20px;\n                    background: rgba(255, 165, 0, 0.9);\n                    color: white;\n                    padding: 15px;\n                    border-radius: 5px;\n                    font-family: Arial, sans-serif;\n                    font-size: 14px;\n                    max-width: 300px;\n                    z-index: 10000;\n                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);\n                    border-left: 4px solid #ff8c00;\n                '),
                    document.body.appendChild(i)),
                    (i.innerHTML = `\n                <div style="font-weight: bold; margin-bottom: 5px;">${e}</div>\n                <div>${t}</div>\n                <button onclick="this.parentElement.style.display='none'" \n                        style="margin-top: 10px; padding: 5px 10px; background: #ff8c00; \n                               color: white; border: none; border-radius: 3px; cursor: pointer;">\n                    OK\n                </button>\n            `),
                    setTimeout(() => {
                        i && i.parentElement && (i.style.display = 'none');
                    }, 1e4));
            } catch (i) {
                (logger$h.warn(`GlowEffectManager Compatibility: ${e} - ${t}`),
                    logger$h.warn('Failed to show compatibility notification:', i.message));
            }
        else logger$h.warn(`GlowEffectManager Compatibility: ${e} - ${t}`);
    }
    initializeFallbackRendering() {
        (logger$h.info('GlowEffectManager: Initializing fallback rendering mode'),
            (this.fallbackMaterials = {
                createBikeMaterial: (e, t) =>
                    new THREE.MeshLambertMaterial({
                        color: t,
                        emissive: new THREE.Color(t).multiplyScalar(0.1),
                    }),
                createTrailMaterial: (e, t) =>
                    new THREE.MeshBasicMaterial({
                        color: t,
                        transparent: !0,
                        opacity: 0.6,
                        emissive: new THREE.Color(t).multiplyScalar(0.05),
                    }),
            }),
            this.showCompatibilityNotification(
                'Compatibility Mode',
                'Running in compatibility mode with simplified graphics.'
            ));
    }
    loadSettings() {
        const e = this.settings.getIntensity();
        e && (this.currentIntensity = e);
    }
    applyIntensitySettings() {
        try {
            const t = this.getIntensityConfig(this.currentIntensity),
                i = this.validateConfiguration(t);
            if (!i.isValid)
                return (
                    this.logError('applyIntensitySettings', 'Invalid configuration', {
                        config: t,
                        errors: i.errors,
                    }),
                    !1
                );
            let r = !0;
            if (this.postProcessing)
                try {
                    this.postProcessing.setBloomStrength(t.bloom);
                    const e = this.getBloomParameters(this.currentIntensity);
                    this.postProcessing.configureBloomParameters(e);
                } catch (e) {
                    (this.logError(
                        'applyIntensitySettings',
                        'Failed to apply post-processing settings',
                        { config: t, error: e.message }
                    ),
                        (r = !1));
                }
            if (this.materialSystem)
                try {
                    this.materialSystem.setGlobalIntensityMultiplier(t.emissive);
                } catch (e) {
                    (this.logError('applyIntensitySettings', 'Failed to apply material settings', {
                        config: t,
                        error: e.message,
                    }),
                        (r = !1));
                }
            return (
                r &&
                    this.logInfo(
                        'applyIntensitySettings',
                        `Applied ${this.currentIntensity} intensity settings`,
                        t
                    ),
                r
            );
        } catch (e) {
            return (
                this.logError('applyIntensitySettings', 'Unexpected error applying settings', {
                    intensity: this.currentIntensity,
                    error: e.message,
                }),
                !1
            );
        }
    }
    getIntensityConfig(e) {
        const t = {
            OFF: { emissive: 0, bloom: 0 },
            LOW: { emissive: 0.3, bloom: 0.5 },
            MEDIUM: { emissive: 0.6, bloom: 1 },
            HIGH: { emissive: 0.8, bloom: 1.5 },
        };
        return t[e] || t.MEDIUM;
    }
    getBloomParameters(e) {
        const t = {
            OFF: { threshold: 1, radius: 0.1 },
            LOW: { threshold: 0.95, radius: 0.2 },
            MEDIUM: { threshold: 0.85, radius: 0.4 },
            HIGH: { threshold: 0.75, radius: 0.6 },
        };
        return t[e] || t.MEDIUM;
    }
    applyQualityScaling(e) {
        this.postProcessing && this.postProcessing.setQuality(e);
    }
    getStatus() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            intensity: this.currentIntensity,
            quality: this.performanceScaler ? this.performanceScaler.currentQuality : 'high',
        };
    }
};
module$D.exports = { GlowEffectManager: GlowEffectManager$2 };
const __CJS__export_default__$C =
        (null == module$D.exports ? {} : module$D.exports).default || module$D.exports,
    __CJS__import__24__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$C },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$C = { exports: {} };
const { createLogger: createLogger$4 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$g = createLogger$4('ErrorRecoveryStrategies');
let ErrorRecoveryStrategies$1 = class {
    constructor() {
        ((this.cameraEffectsManager = null),
            (this.degradationManager = null),
            (this.motionBlurController = null),
            (this.shakeController = null),
            (this.strategies = {
                webgl: [
                    'reduceQuality',
                    'disableMotionBlur',
                    'disablePostProcessing',
                    'fallbackRendering',
                ],
                postProcessing: [
                    'recreateComposer',
                    'simplifyShaders',
                    'disableMotionBlur',
                    'fallbackRendering',
                ],
                memory: [
                    'clearCaches',
                    'reduceQuality',
                    'forceGarbageCollection',
                    'disableEffects',
                ],
                shader: [
                    'recompileShaders',
                    'useSimpleShaders',
                    'disableMotionBlur',
                    'fallbackRendering',
                ],
            }));
    }
    initialize(e) {
        ((this.cameraEffectsManager = e.cameraEffectsManager),
            (this.degradationManager = e.degradationManager),
            (this.motionBlurController = e.motionBlurController),
            (this.shakeController = e.shakeController));
    }
    getStrategiesForType(e) {
        return this.strategies[e] || [];
    }
    executeStrategy(e) {
        switch (e) {
            case 'reduceQuality':
                return this.reduceQuality();
            case 'disableMotionBlur':
                return this.disableMotionBlur('Recovery strategy');
            case 'disablePostProcessing':
                return this.disablePostProcessing();
            case 'fallbackRendering':
                return this.enterFallbackMode('Recovery strategy');
            case 'recreateComposer':
                return this.recreateComposer();
            case 'simplifyShaders':
                return this.simplifyShaders();
            case 'clearCaches':
                return this.clearCaches();
            case 'forceGarbageCollection':
                return this.forceGarbageCollection();
            case 'recompileShaders':
                return this.recompileShaders();
            case 'useSimpleShaders':
                return this.useSimpleShaders();
            case 'disableEffects':
                return this.disableAllEffects('Recovery strategy');
            default:
                return (logger$g.warn(`Unknown recovery strategy: ${e}`), !1);
        }
    }
    reduceQuality() {
        try {
            if (this.degradationManager) {
                const e = this.degradationManager.getDegradationState(),
                    t = e ? e.level : void 0;
                if (t < 2) return (this.degradationManager.setDegradationLevel(t + 1), !0);
            }
            if (this.motionBlurController) {
                const e = this.motionBlurController.getCurrentQuality();
                if ('high' === e) return (this.motionBlurController.setQuality('medium'), !0);
                if ('medium' === e) return (this.motionBlurController.setQuality('low'), !0);
            }
            return !1;
        } catch (e) {
            return (logger$g.error('Failed to reduce quality', e), !1);
        }
    }
    disableMotionBlur(e) {
        try {
            return (
                !!this.motionBlurController &&
                (this.motionBlurController.setEnabled(!1),
                logger$g.info(`Motion blur disabled: ${e}`),
                !0)
            );
        } catch (t) {
            return (logger$g.error('Failed to disable motion blur', t), !1);
        }
    }
    disablePostProcessing() {
        try {
            return (
                !!this.motionBlurController &&
                (this.motionBlurController.setEnabled(!1),
                logger$g.info('Post-processing disabled for recovery'),
                !0)
            );
        } catch (e) {
            return (logger$g.error('Failed to disable post-processing', e), !1);
        }
    }
    enterFallbackMode(e) {
        try {
            return (
                this.motionBlurController && this.motionBlurController.setEnabled(!1),
                this.degradationManager && this.degradationManager.setDegradationLevel(2),
                logger$g.info(`Entered fallback mode: ${e}`),
                !0
            );
        } catch (t) {
            return (logger$g.error('Failed to enter fallback mode', t), !1);
        }
    }
    disableAllEffects(e) {
        try {
            return (
                this.cameraEffectsManager && this.cameraEffectsManager.setEnabled(!1),
                this.degradationManager && this.degradationManager.setDegradationLevel(3),
                logger$g.info(`All camera effects disabled: ${e}`),
                !0
            );
        } catch (t) {
            return (logger$g.error('Failed to disable all effects', t), !1);
        }
    }
    recreateComposer() {
        try {
            return (
                !(
                    !this.motionBlurController ||
                    'function' != typeof this.motionBlurController.initialize
                ) && this.motionBlurController.initialize()
            );
        } catch (e) {
            return (logger$g.error('Failed to recreate composer', e), !1);
        }
    }
    simplifyShaders() {
        try {
            return !!this.motionBlurController && (this.motionBlurController.setQuality('low'), !0);
        } catch (e) {
            return (logger$g.error('Failed to simplify shaders', e), !1);
        }
    }
    clearCaches() {
        try {
            return (
                this.motionBlurController &&
                    'function' == typeof this.motionBlurController.resetPerformanceMetrics &&
                    this.motionBlurController.resetPerformanceMetrics(),
                this.degradationManager &&
                    'function' == typeof this.degradationManager.resetPerformanceMetrics &&
                    this.degradationManager.resetPerformanceMetrics(),
                !0
            );
        } catch (e) {
            return (logger$g.error('Failed to clear caches', e), !1);
        }
    }
    forceGarbageCollection() {
        try {
            return (
                !('undefined' == typeof window || !window.gc) &&
                (window.gc(), logger$g.info('Forced garbage collection'), !0)
            );
        } catch (e) {
            return (logger$g.error('Failed to force garbage collection', e), !1);
        }
    }
    recompileShaders() {
        return this.recreateComposer();
    }
    useSimpleShaders() {
        return this.simplifyShaders();
    }
};
module$C.exports = { ErrorRecoveryStrategies: ErrorRecoveryStrategies$1 };
const __CJS__export_default__$B =
        (null == module$C.exports ? {} : module$C.exports).default || module$C.exports,
    __CJS__import__1__$2 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$B },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$B = { exports: {} };
const { createLogger: createLogger$3 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$f = createLogger$3('CameraEffectsErrorHandler'),
    { ErrorRecoveryStrategies: ErrorRecoveryStrategies } =
        __CJS__export_default__$B || __CJS__import__1__$2,
    { PerformanceDegradationManager: PerformanceDegradationManager$3 } =
        __CJS__export_default__$I || __CJS__import__21__;
let CameraEffectsErrorHandler$1 = class {
    constructor() {
        ((this.cameraEffectsManager = null),
            (this.degradationManager = null),
            (this.motionBlurController = null),
            (this.shakeController = null),
            (this.recoveryStrategies = new ErrorRecoveryStrategies()),
            (this.errorLog = []),
            (this.maxLogEntries = 100),
            (this.errorCounters = {
                webgl: 0,
                postProcessing: 0,
                shader: 0,
                memory: 0,
                initialization: 0,
                runtime: 0,
                recovery: 0,
            }),
            (this.errorThresholds = { warning: 1, degradation: 3, fallback: 5, disable: 10 }),
            (this.recoveryAttempts = {
                total: 0,
                successful: 0,
                failed: 0,
                lastAttempt: 0,
                cooldownPeriod: 5e3,
                maxAttempts: 3,
            }),
            (this.notifications = {
                shown: new Set(),
                queue: [],
                maxQueueSize: 5,
                suppressDuplicates: !0,
                notificationCooldown: 1e4,
            }),
            (this.debugInfo = {
                browserInfo: this.collectBrowserInfo(),
                systemInfo: this.collectSystemInfo(),
                webglInfo: null,
                performanceInfo: null,
                lastErrorContext: null,
            }),
            (this.loggingConfig = {
                enabled: !0,
                logLevel: 'info',
                includeStackTrace: !0,
                includeTimestamp: !0,
                includeContext: !0,
            }),
            (this.initialized = !1),
            (this.fallbackMode = !1),
            (this.effectsDisabled = !1),
            (this.handleWebGLContextLost = this.handleWebGLContextLost.bind(this)),
            (this.handleWebGLContextRestored = this.handleWebGLContextRestored.bind(this)),
            (this.handleUnhandledError = this.handleUnhandledError.bind(this)));
    }
    initialize(e, t = null, i = null, r = null) {
        try {
            return (
                (this.cameraEffectsManager = e),
                (this.degradationManager = t),
                (this.motionBlurController = i),
                (this.shakeController = r),
                this.recoveryStrategies.initialize({
                    cameraEffectsManager: e,
                    degradationManager: t,
                    motionBlurController: i,
                    shakeController: r,
                }),
                this.setupGlobalErrorHandlers(),
                this.collectWebGLInfo(),
                this.log('info', 'CameraEffectsErrorHandler initialized', {
                    browserInfo: this.debugInfo.browserInfo,
                    systemInfo: this.debugInfo.systemInfo,
                }),
                (this.initialized = !0),
                !0
            );
        } catch (n) {
            return (logger$f.error('Initialization failed', n), !1);
        }
    }
    setupGlobalErrorHandlers() {
        'undefined' != typeof window &&
            (window.addEventListener('webglcontextlost', this.handleWebGLContextLost, !1),
            window.addEventListener('webglcontextrestored', this.handleWebGLContextRestored, !1),
            window.addEventListener('error', this.handleUnhandledError, !1),
            window.addEventListener('unhandledrejection', this.handleUnhandledError, !1));
    }
    handleWebGLContextLost(e) {
        const t = e;
        (t.preventDefault(),
            this.log('error', 'WebGL context lost', {
                reason: t.statusMessage || 'Unknown',
                timestamp: Date.now(),
            }),
            this.handleWebGLError(new Error('WebGL context lost'), 'Context lost event'),
            this.queueNotification(
                'error',
                'Graphics context lost. Camera effects temporarily disabled.'
            ));
    }
    handleWebGLContextRestored(e) {
        (this.log('info', 'WebGL context restored', { timestamp: Date.now() }),
            this.attemptRecovery('webgl'),
            this.queueNotification(
                'info',
                'Graphics context restored. Attempting to re-enable camera effects.'
            ));
    }
    handleUnhandledError(e) {
        const t = e,
            i = t.error || t.reason;
        i &&
            i.message &&
            (i.message.includes('WebGL') ||
                i.message.includes('THREE') ||
                i.message.includes('shader') ||
                i.message.includes('texture') ||
                i.message.includes('framebuffer')) &&
            (this.log('error', 'Unhandled error affecting camera effects', {
                message: i.message,
                stack: i.stack,
                filename: t.filename,
                lineno: t.lineno,
                colno: t.colno,
            }),
            this.handleRuntimeError(i, 'Unhandled error'));
    }
    handleWebGLError(e, t = 'Unknown WebGL error', i = {}) {
        this.errorCounters.webgl++;
        const r = {
            type: 'webgl',
            error: e,
            context: t,
            timestamp: Date.now(),
            counter: this.errorCounters.webgl,
            additionalInfo: i,
            webglInfo: this.debugInfo.webglInfo,
        };
        (this.addToErrorLog(r),
            this.log('error', `WebGL Error: ${t}`, {
                message: e.message,
                stack: e.stack,
                additionalInfo: i,
                errorCount: this.errorCounters.webgl,
            }),
            this.errorCounters.webgl >= this.errorThresholds.disable
                ? this.disableAllEffects('Too many WebGL errors')
                : this.errorCounters.webgl >= this.errorThresholds.fallback
                  ? this.enterFallbackMode('WebGL errors')
                  : this.errorCounters.webgl >= this.errorThresholds.degradation
                    ? this.triggerDegradation('WebGL errors')
                    : this.errorCounters.webgl >= this.errorThresholds.warning &&
                      this.queueNotification(
                          'warning',
                          'Graphics issues detected. Camera effects may be reduced.'
                      ),
            this.canAttemptRecovery() && this.attemptRecovery('webgl'));
    }
    handlePostProcessingError(e, t = 'Post-processing error', i = {}) {
        this.errorCounters.postProcessing++;
        const r = {
            type: 'postProcessing',
            error: e,
            context: t,
            timestamp: Date.now(),
            counter: this.errorCounters.postProcessing,
            additionalInfo: i,
        };
        (this.addToErrorLog(r),
            this.log('error', `Post-processing Error: ${t}`, {
                message: e.message,
                stack: e.stack,
                additionalInfo: i,
                errorCount: this.errorCounters.postProcessing,
            }),
            this.errorCounters.postProcessing >= this.errorThresholds.degradation
                ? this.disableMotionBlur('Post-processing errors')
                : this.errorCounters.postProcessing >= this.errorThresholds.warning &&
                  this.queueNotification('warning', 'Motion blur effects may be unstable.'),
            this.canAttemptRecovery() && this.attemptRecovery('postProcessing'));
    }
    handleShaderError(e, t = 'Shader error', i = {}) {
        this.errorCounters.shader++;
        const r = {
            type: 'shader',
            error: e,
            context: t,
            timestamp: Date.now(),
            counter: this.errorCounters.shader,
            shaderInfo: i,
        };
        (this.addToErrorLog(r),
            this.log('error', `Shader Error: ${t}`, {
                message: e.message,
                shaderInfo: i,
                errorCount: this.errorCounters.shader,
            }),
            this.errorCounters.shader >= this.errorThresholds.degradation &&
                this.disableMotionBlur('Shader compilation errors'),
            this.canAttemptRecovery() && this.attemptRecovery('shader'));
    }
    handleMemoryError(e, t = 'Memory error', i = {}) {
        this.errorCounters.memory++;
        const r = {
            type: 'memory',
            error: e,
            context: t,
            timestamp: Date.now(),
            counter: this.errorCounters.memory,
            memoryInfo: i,
        };
        (this.addToErrorLog(r),
            this.log('error', `Memory Error: ${t}`, {
                message: e.message,
                memoryInfo: i,
                errorCount: this.errorCounters.memory,
            }),
            this.errorCounters.memory >= this.errorThresholds.degradation &&
                this.triggerDegradation('Memory pressure'),
            this.attemptRecovery('memory'));
    }
    handleRuntimeError(e, t = 'Runtime error') {
        this.errorCounters.runtime++;
        const i = {
            type: 'runtime',
            error: e,
            context: t,
            timestamp: Date.now(),
            counter: this.errorCounters.runtime,
        };
        (this.addToErrorLog(i),
            this.log('error', `Runtime Error: ${t}`, {
                message: e.message,
                stack: e.stack,
                errorCount: this.errorCounters.runtime,
            }),
            this.errorCounters.runtime >= this.errorThresholds.fallback &&
                this.enterFallbackMode('Runtime instability'));
    }
    attemptRecovery(e) {
        if (!this.canAttemptRecovery()) return !1;
        (this.recoveryAttempts.total++, (this.recoveryAttempts.lastAttempt = Date.now()));
        const t = this.recoveryStrategies.getStrategiesForType(e);
        this.log('info', `Attempting recovery for ${e} error`, {
            attempt: this.recoveryAttempts.total,
            strategies: t,
        });
        let i = !1;
        for (const n of t)
            try {
                if (this.recoveryStrategies.executeStrategy(n)) {
                    ((i = !0),
                        'fallbackRendering' === n &&
                            ((this.fallbackMode = !0),
                            this.queueNotification(
                                'warning',
                                'Camera effects running in compatibility mode.'
                            )));
                    break;
                }
            } catch (r) {
                this.log('warn', `Recovery strategy ${n} failed`, { error: r.message });
            }
        return (
            i
                ? (this.recoveryAttempts.successful++,
                  this.log('info', 'Recovery successful using strategy', {
                      errorType: e,
                      attempt: this.recoveryAttempts.total,
                  }),
                  this.queueNotification('info', 'Camera effects recovered successfully.'))
                : (this.recoveryAttempts.failed++,
                  this.log('error', `Recovery failed for ${e}`, {
                      attempt: this.recoveryAttempts.total,
                      strategiesTried: t,
                  })),
            i
        );
    }
    disableAllEffects(e) {
        return this.recoveryStrategies.disableAllEffects(e);
    }
    enterFallbackMode(e) {
        return (
            (this.fallbackMode = !0),
            this.queueNotification('warning', 'Camera effects running in compatibility mode.'),
            this.recoveryStrategies.enterFallbackMode(e)
        );
    }
    disableMotionBlur(e) {
        return this.recoveryStrategies.disableMotionBlur(e);
    }
    triggerDegradation(e) {
        if (this.degradationManager) {
            const t = this.degradationManager.getDegradationState().level;
            t < 2 &&
                (this.degradationManager.setDegradationLevel(t + 1),
                this.log('info', `Triggered degradation: ${e}`));
        }
    }
    canAttemptRecovery() {
        const e = Date.now();
        return (
            this.recoveryAttempts.total < this.recoveryAttempts.maxAttempts &&
            e - this.recoveryAttempts.lastAttempt > this.recoveryAttempts.cooldownPeriod
        );
    }
    queueNotification(e, t) {
        const i = `${e}:${t}`;
        if (this.notifications.suppressDuplicates) {
            if (this.notifications.queue.some((e) => e.id === i) || this.notifications.shown.has(i))
                return;
        }
        this.notifications.queue.length < this.notifications.maxQueueSize &&
            this.notifications.queue.push({ type: e, message: t, id: i, timestamp: Date.now() });
    }
    processNotificationQueue() {
        for (; this.notifications.queue.length > 0; ) {
            const e = this.notifications.queue.shift();
            (this.showNotification(e), this.notifications.shown.add(e.id));
        }
    }
    showNotification(e) {
        const t = 'error' === e.type ? 'error' : 'warning' === e.type ? 'warn' : 'info';
        (logger$f[t]
            ? logger$f[t](`Camera Effects: ${e.message}`)
            : logger$f.info(`Camera Effects: ${e.message}`),
            'undefined' != typeof window &&
                window.dispatchEvent(new CustomEvent('cameraEffectsError', { detail: e })));
    }
    addToErrorLog(e) {
        (this.errorLog.push(e),
            this.errorLog.length > this.maxLogEntries && this.errorLog.shift(),
            (this.debugInfo.lastErrorContext = {
                type: e.type,
                context: e.context,
                timestamp: e.timestamp,
                message: e.error.message,
            }));
    }
    log(e, t, i = {}) {
        if (!this.loggingConfig.enabled) return;
        (this.loggingConfig.includeTimestamp && new Date().toISOString(),
            this.loggingConfig.includeContext);
        const r = logger$f[e] || logger$f.info;
        this.loggingConfig.includeContext && Object.keys(i).length > 0 ? r(t, i) : r(t);
    }
    collectBrowserInfo() {
        const e = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                connection: null,
            },
            t = navigator;
        return (
            t.connection &&
                (e.connection = {
                    effectiveType: t.connection.effectiveType,
                    saveData: t.connection.saveData,
                    rtt: t.connection.rtt,
                    downlink: t.connection.downlink,
                }),
            e
        );
    }
    collectSystemInfo() {
        return {
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
            },
            performance: {
                memory: performance.memory
                    ? {
                          usedJSHeapSize: performance.memory.usedJSHeapSize,
                          totalJSHeapSize: performance.memory.totalJSHeapSize,
                          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                      }
                    : null,
                timing: performance.timing
                    ? {
                          navigationStart: performance.timing.navigationStart,
                          loadEventEnd: performance.timing.loadEventEnd,
                      }
                    : null,
            },
        };
    }
    collectWebGLInfo() {
        try {
            const e = document.createElement('canvas'),
                t = e.getContext('webgl') || e.getContext('experimental-webgl');
            if (t) {
                const e = t,
                    i = e.getExtension('WEBGL_debug_renderer_info');
                this.debugInfo.webglInfo = {
                    renderer: e.getParameter(e.RENDERER),
                    vendor: e.getParameter(e.VENDOR),
                    version: e.getParameter(e.VERSION),
                    shadingLanguageVersion: e.getParameter(e.SHADING_LANGUAGE_VERSION),
                    maxTextureSize: e.getParameter(e.MAX_TEXTURE_SIZE),
                    maxRenderBufferSize: e.getParameter(e.MAX_RENDERBUFFER_SIZE),
                    maxViewportDims: e.getParameter(e.MAX_VIEWPORT_DIMS),
                    extensions: e.getSupportedExtensions(),
                    unmaskedRenderer: i ? e.getParameter(i.UNMASKED_RENDERER_WEBGL) : void 0,
                    unmaskedVendor: i ? e.getParameter(i.UNMASKED_VENDOR_WEBGL) : void 0,
                };
            }
        } catch (e) {
            this.log('warn', 'Failed to collect WebGL info', { error: e.message });
        }
    }
    getErrorStatistics() {
        return {
            counters: __spreadValues({}, this.errorCounters),
            totalErrors: Object.values(this.errorCounters).reduce((e, t) => e + t, 0),
            recoveryAttempts: __spreadValues({}, this.recoveryAttempts),
            recoverySuccessRate:
                this.recoveryAttempts.total > 0
                    ? (this.recoveryAttempts.successful / this.recoveryAttempts.total) * 100
                    : 0,
            recentErrors: this.errorLog.slice(-10),
            fallbackMode: this.fallbackMode,
            effectsDisabled: this.effectsDisabled,
        };
    }
    getDebugInfo() {
        return __spreadProps(__spreadValues({}, this.debugInfo), {
            errorStatistics: this.getErrorStatistics(),
            loggingConfig: __spreadValues({}, this.loggingConfig),
        });
    }
    hasRecoverableErrors() {
        const e = Object.values(this.errorCounters).reduce((e, t) => e + t, 0);
        return e > 0 && e < this.errorThresholds.disable && !this.effectsDisabled;
    }
    resetErrorCounters() {
        (Object.keys(this.errorCounters).forEach((e) => {
            this.errorCounters[e] = 0;
        }),
            (this.recoveryAttempts.total = 0),
            (this.recoveryAttempts.successful = 0),
            (this.recoveryAttempts.failed = 0),
            this.log('info', 'Error counters reset'));
    }
    getStatus() {
        return {
            initialized: this.initialized,
            fallbackMode: this.fallbackMode,
            effectsDisabled: this.effectsDisabled,
            errorStatistics: this.getErrorStatistics(),
            canAttemptRecovery: this.canAttemptRecovery(),
            notificationQueueSize: this.notifications.queue.length,
        };
    }
    destroy() {
        try {
            ('undefined' != typeof window &&
                (window.removeEventListener('webglcontextlost', this.handleWebGLContextLost),
                window.removeEventListener('webglcontextrestored', this.handleWebGLContextRestored),
                window.removeEventListener('error', this.handleUnhandledError),
                window.removeEventListener('unhandledrejection', this.handleUnhandledError)),
                (this.cameraEffectsManager = null),
                (this.degradationManager = null),
                (this.motionBlurController = null),
                (this.shakeController = null),
                (this.errorLog = []),
                (this.notifications.queue = []),
                this.notifications.shown.clear(),
                (this.initialized = !1),
                this.log('info', 'CameraEffectsErrorHandler destroyed'));
        } catch (e) {
            logger$f.error('Error during destruction', e);
        }
    }
};
module$B.exports = { CameraEffectsErrorHandler: CameraEffectsErrorHandler$1 };
const __CJS__export_default__$A =
        (null == module$B.exports ? {} : module$B.exports).default || module$B.exports,
    __CJS__import__1__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$A },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$A = { exports: {} };
let ShakeInstance$1 = class {
    constructor(e, t, i = 'collision') {
        ((this.intensity = Math.max(0, Math.min(2, e))),
            (this.duration = Math.max(0, t)),
            (this.type = i),
            (this.elapsed = 0),
            (this.offset = { x: 0, y: 0, z: 0 }),
            (this.isActive = !0),
            (this.decayFunction = this.createDecayFunction(i)));
    }
    createDecayFunction(e) {
        switch (e) {
            case 'collision':
                return (e) => Math.pow(1 - e, 2.5);
            case 'nearMiss':
                return (e) => Math.sin((1 - e) * Math.PI * 0.5);
            default:
                return (e) => Math.pow(1 - e, 2);
        }
    }
    update(e) {
        if (!this.isActive) return !1;
        if (this.duration <= 0)
            return ((this.isActive = !1), (this.offset = { x: 0, y: 0, z: 0 }), !1);
        this.elapsed += e;
        const t = Math.min(this.elapsed / this.duration, 1);
        if (t >= 1) return ((this.isActive = !1), (this.offset = { x: 0, y: 0, z: 0 }), !1);
        const i = this.intensity * this.decayFunction(t);
        return (this.generateOffset(i), !0);
    }
    generateOffset(e) {
        if (e <= 0) return void (this.offset = { x: 0, y: 0, z: 0 });
        const t = this.elapsed;
        ((this.offset.x =
            e * (0.6 * Math.sin(8 * t) + 0.3 * Math.sin(12 * t) + 0.1 * Math.sin(6 * t))),
            (this.offset.y =
                e *
                (0.5 * Math.cos(8 * t * 1.1) +
                    0.3 * Math.cos(12 * t * 0.9) +
                    0.2 * Math.cos(6 * t * 1.2))),
            (this.offset.z =
                e *
                (0.4 * Math.sin(8 * t * 0.8) +
                    0.2 * Math.cos(12 * t * 1.3) +
                    0.1 * Math.sin(6 * t * 0.7))));
    }
    getOffset() {
        return __spreadValues({}, this.offset);
    }
    getCurrentIntensity() {
        if (!this.isActive || this.duration <= 0) return 0;
        const e = Math.min(this.elapsed / this.duration, 1);
        return this.intensity * this.decayFunction(e);
    }
    isComplete() {
        return !this.isActive;
    }
    getType() {
        return this.type;
    }
    getRemainingDuration() {
        return Math.max(0, this.duration - this.elapsed);
    }
};
module$A.exports = { ShakeInstance: ShakeInstance$1 };
const __CJS__export_default__$z =
        (null == module$A.exports ? {} : module$A.exports).default || module$A.exports,
    __CJS__import__0__$2 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$z },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$z = { exports: {} };
const { ShakeInstance: ShakeInstance } = __CJS__export_default__$z || __CJS__import__0__$2,
    { createLogger: createLogger$2 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$e = createLogger$2('CameraShakeController');
let CameraShakeController$1 = class {
    constructor(e) {
        ((this.camera = e),
            (this.originalPosition = e
                ? { x: e.position.x, y: e.position.y, z: e.position.z }
                : { x: 0, y: 0, z: 0 }),
            (this.shakeOffset = { x: 0, y: 0, z: 0 }),
            (this.activeShakes = []),
            (this.intensityMultiplier = 1),
            (this.enabled = !0),
            (this.shakeConfig = {
                collision: {
                    minIntensity: 0.5,
                    maxIntensity: 1,
                    defaultIntensity: 0.75,
                    defaultDuration: 1,
                },
                nearMiss: {
                    minIntensity: 0.1,
                    maxIntensity: 0.2,
                    defaultIntensity: 0.15,
                    defaultDuration: 0.3,
                },
            }),
            (this.intensitySettings = { off: 0, low: 0.5, medium: 1, high: 1.5 }),
            (this.currentIntensitySetting = 'medium'));
    }
    triggerCollisionShake(e = null, t = null) {
        if (!this.enabled || 'off' === this.currentIntensitySetting) return;
        const i = this.shakeConfig.collision;
        let r =
            null !== e ? Math.max(i.minIntensity, Math.min(i.maxIntensity, e)) : i.defaultIntensity;
        const n = this.intensitySettings[this.currentIntensitySetting];
        let s = 1;
        'undefined' != typeof window && window.innerWidth < 768 && (s = 0.7);
        const a = r * n * this.intensityMultiplier * s,
            o = null !== t ? t : i.defaultDuration,
            l = new ShakeInstance(a, o, 'collision');
        (this.activeShakes.push(l), this.cleanupCompletedShakes());
    }
    triggerNearMissShake(e = 1, t = null) {
        if (!this.enabled || 'off' === this.currentIntensitySetting) return;
        const i = this.shakeConfig.nearMiss,
            r = 1 - (Math.max(0.1, Math.min(1, e)) - 0.1) / 0.9,
            n =
                (i.minIntensity + r * (i.maxIntensity - i.minIntensity)) *
                this.intensitySettings[this.currentIntensitySetting] *
                this.intensityMultiplier,
            s = null !== t ? t : i.defaultDuration,
            a = new ShakeInstance(n, s, 'nearMiss');
        (this.activeShakes.push(a), this.cleanupCompletedShakes());
    }
    update(e) {
        this.enabled && this.camera
            ? ((this.activeShakes = this.activeShakes.filter((t) => t.update(e))),
              this.calculateCombinedOffset(),
              this.applyShakeOffset())
            : (this.shakeOffset = { x: 0, y: 0, z: 0 });
    }
    calculateCombinedOffset() {
        if (((this.shakeOffset = { x: 0, y: 0, z: 0 }), 0 === this.activeShakes.length)) return;
        for (const e of this.activeShakes) {
            const t = e.getOffset();
            ((this.shakeOffset.x += t.x), (this.shakeOffset.y += t.y), (this.shakeOffset.z += t.z));
        }
        ((this.shakeOffset.x *= 0.8), (this.shakeOffset.y *= 0.8), (this.shakeOffset.z *= 0.8));
    }
    applyShakeOffset() {
        this.camera &&
            ((this.camera.position.x = this.originalPosition.x + this.shakeOffset.x),
            (this.camera.position.y = this.originalPosition.y + this.shakeOffset.y),
            (this.camera.position.z = this.originalPosition.z + this.shakeOffset.z));
    }
    cleanupCompletedShakes() {
        this.activeShakes = this.activeShakes.filter((e) => !e.isComplete());
    }
    setIntensityMultiplier(e) {
        this.intensityMultiplier = Math.max(0, Math.min(2, e));
    }
    getIntensityMultiplier() {
        return this.intensityMultiplier;
    }
    setEnabled(e) {
        ((this.enabled = e),
            e ||
                ((this.activeShakes = []),
                (this.shakeOffset = { x: 0, y: 0, z: 0 }),
                this.camera &&
                    ((this.camera.position.x = this.originalPosition.x),
                    (this.camera.position.y = this.originalPosition.y),
                    (this.camera.position.z = this.originalPosition.z))));
    }
    isEnabled() {
        return this.enabled;
    }
    updateOriginalPosition(e) {
        this.originalPosition = __spreadValues({}, e);
    }
    getActiveShakeCount() {
        return this.activeShakes.length;
    }
    getCurrentOffset() {
        return __spreadValues({}, this.shakeOffset);
    }
    clearAllShakes() {
        ((this.activeShakes = []),
            (this.shakeOffset = { x: 0, y: 0, z: 0 }),
            this.camera &&
                ((this.camera.position.x = this.originalPosition.x),
                (this.camera.position.y = this.originalPosition.y),
                (this.camera.position.z = this.originalPosition.z)));
    }
    setIntensitySetting(e) {
        const t = Object.keys(this.intensitySettings);
        t.includes(e.toLowerCase())
            ? ((this.currentIntensitySetting = e.toLowerCase()),
              'off' === this.currentIntensitySetting && this.clearAllShakes())
            : logger$e.warn(`Invalid intensity setting: ${e}. Valid options: ${t.join(', ')}`);
    }
    getIntensitySetting() {
        return this.currentIntensitySetting;
    }
    getAvailableIntensitySettings() {
        return Object.keys(this.intensitySettings);
    }
    getEffectiveIntensityMultiplier(e = null) {
        const t = e || this.currentIntensitySetting;
        return (this.intensitySettings[t] || 1) * this.intensityMultiplier;
    }
    getShakeConfig() {
        return {
            collision: __spreadValues({}, this.shakeConfig.collision),
            nearMiss: __spreadValues({}, this.shakeConfig.nearMiss),
            intensitySettings: __spreadValues({}, this.intensitySettings),
            currentSetting: this.currentIntensitySetting,
        };
    }
    updateShakeConfig(e, t) {
        this.shakeConfig[e] &&
            (void 0 !== t.duration &&
                (this.shakeConfig[e].defaultDuration = Math.max(0, t.duration)),
            void 0 !== t.defaultIntensity &&
                (this.shakeConfig[e].defaultIntensity = Math.max(0, t.defaultIntensity)),
            void 0 !== t.minIntensity &&
                (this.shakeConfig[e].minIntensity = Math.max(0, t.minIntensity)),
            void 0 !== t.maxIntensity &&
                (this.shakeConfig[e].maxIntensity = Math.max(0, t.maxIntensity)));
    }
    getActiveShakesInfo() {
        return this.activeShakes.map((e) => ({
            type: e.getType(),
            intensity: e.getCurrentIntensity(),
            remaining: e.getRemainingDuration(),
            offset: e.getOffset(),
        }));
    }
};
module$z.exports = { CameraShakeController: CameraShakeController$1 };
const __CJS__export_default__$y =
        (null == module$z.exports ? {} : module$z.exports).default || module$z.exports,
    __CJS__import__2__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$y },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$y = { exports: {} };
const { createLogger: createLogger$1 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$d = createLogger$1('MotionBlurController');
let MotionBlurController$1 = class {
    constructor(e) {
        ((this.renderer = e),
            (this.composer = null),
            (this.renderPass = null),
            (this.motionBlurPass = null),
            (this.initialized = !1),
            (this.enabled = !0),
            (this.currentQuality = 'medium'),
            (this.blurConfig = {
                intensity: 0,
                maxIntensity: 0.8,
                speedThreshold: 1.5,
                samples: 32,
                velocityFactor: 0.5,
            }),
            (this.qualitySettings = {
                high: { resolution: 1, samples: 32, velocityFactor: 0.5, maxIntensity: 0.8 },
                medium: { resolution: 0.75, samples: 16, velocityFactor: 0.4, maxIntensity: 0.6 },
                low: { resolution: 0.5, samples: 8, velocityFactor: 0.3, maxIntensity: 0.4 },
            }),
            (this.performanceMetrics = {
                lastFrameTime: 0,
                averageFrameTime: 16.67,
                frameCount: 0,
                autoScalingEnabled: !0,
                performanceHistory: [],
                maxHistoryLength: 120,
                lastQualityAdjustment: 0,
                qualityAdjustmentCooldown: 2e3,
            }),
            (this.capabilities = {
                webglSupported: !0,
                postProcessingSupported: !0,
                motionBlurSupported: !0,
                maxTextureSize: 0,
                maxRenderBufferSize: 0,
                floatTextureSupport: !1,
                depthTextureSupport: !1,
                devicePixelRatio: window.devicePixelRatio || 1,
            }),
            (this.speedTracker = null),
            (this.fallbackMode = !1));
    }
    initialize(e = null) {
        this.errorHandler = e;
        try {
            if (!this.detectWebGLCapabilities()) {
                const e = new Error('WebGL capabilities insufficient for motion blur');
                return (
                    this.errorHandler &&
                        this.errorHandler.handleWebGLError(e, 'WebGL capability detection failed'),
                    logger$d.warn('WebGL capabilities insufficient, using fallback'),
                    (this.fallbackMode = !0),
                    !0
                );
            }
            if (!this.checkPostProcessingSupport()) {
                const e = new Error('Post-processing classes not available');
                return (
                    this.errorHandler &&
                        this.errorHandler.handlePostProcessingError(
                            e,
                            'Post-processing support check failed'
                        ),
                    logger$d.warn('Post-processing not supported, using fallback'),
                    (this.fallbackMode = !0),
                    !0
                );
            }
            if (
                ((this.composer = new THREE.EffectComposer(this.renderer)),
                this.composer.setSize(window.innerWidth, window.innerHeight),
                (this.renderPass = new THREE.RenderPass()),
                this.composer.addPass(this.renderPass),
                (this.motionBlurPass = this.createMotionBlurPass()),
                !this.motionBlurPass)
            ) {
                const e = new Error('Motion blur pass creation failed');
                return (
                    this.errorHandler &&
                        this.errorHandler.handlePostProcessingError(e, 'Motion blur pass creation'),
                    logger$d.warn('Motion blur pass creation failed, using fallback'),
                    (this.fallbackMode = !0),
                    !0
                );
            }
            return (
                (this.motionBlurPass.renderToScreen = !0),
                this.composer.addPass(this.motionBlurPass),
                this.setQuality(this.currentQuality),
                (this.initialized = !0),
                logger$d.info('Successfully initialized with motion blur effects'),
                !0
            );
        } catch (t) {
            return (
                logger$d.error('Failed to initialize', t),
                this.errorHandler &&
                    this.errorHandler.handlePostProcessingError(
                        t,
                        'MotionBlurController initialization'
                    ),
                (this.fallbackMode = !0),
                (this.initialized = !1),
                !1
            );
        }
    }
    detectWebGLCapabilities() {
        try {
            const e = document.createElement('canvas'),
                t = e.getContext('webgl') || e.getContext('experimental-webgl');
            if (!t)
                return (
                    (this.capabilities.webglSupported = !1),
                    logger$d.warn('WebGL not supported'),
                    !1
                );
            const i = t;
            ((this.capabilities.maxTextureSize = i.getParameter(i.MAX_TEXTURE_SIZE)),
                (this.capabilities.maxRenderBufferSize = i.getParameter(i.MAX_RENDERBUFFER_SIZE)));
            const r =
                    i.getExtension('OES_texture_float') || i.getExtension('OES_texture_half_float'),
                n = i.getExtension('WEBGL_depth_texture');
            if (
                ((this.capabilities.floatTextureSupport = !!r),
                (this.capabilities.depthTextureSupport = !!n),
                r ||
                    (logger$d.warn('Float texture extension not available, using fallback'),
                    (this.capabilities.floatTextureSupport = !1)),
                n ||
                    (logger$d.warn('Depth texture extension not available'),
                    (this.capabilities.depthTextureSupport = !1)),
                this.capabilities.maxTextureSize < 2048)
            )
                return (
                    logger$d.warn('Insufficient texture size support'),
                    (this.capabilities.webglSupported = !1),
                    !1
                );
            return (
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                ) &&
                    (logger$d.info('Mobile device detected, adjusting performance settings'),
                    (this.capabilities.isMobile = !0),
                    this.setQuality('low'),
                    (this.performanceMetrics.autoScalingEnabled = !0)),
                this.capabilities.devicePixelRatio > 2 &&
                    (logger$d.info(
                        `High DPI display detected (${this.capabilities.devicePixelRatio}x)`
                    ),
                    (this.capabilities.devicePixelRatio = Math.min(
                        this.capabilities.devicePixelRatio,
                        2
                    ))),
                (this.capabilities.webglSupported = !0),
                !0
            );
        } catch (e) {
            return (
                logger$d.error('WebGL capability detection failed', e),
                (this.capabilities.webglSupported = !1),
                !1
            );
        }
    }
    checkPostProcessingSupport() {
        try {
            return THREE.EffectComposer && THREE.RenderPass
                ? THREE.ShaderPass
                    ? ((this.capabilities.postProcessingSupported = !0),
                      (this.capabilities.motionBlurSupported = !0),
                      !0)
                    : (logger$d.warn('ShaderPass not available'),
                      (this.capabilities.motionBlurSupported = !1),
                      !1)
                : ((this.capabilities.postProcessingSupported = !1), !1);
        } catch (e) {
            return (
                logger$d.error('Post-processing support check failed', e),
                (this.capabilities.postProcessingSupported = !1),
                !1
            );
        }
    }
    createMotionBlurPass() {
        try {
            const e = {
                uniforms: {
                    tDiffuse: { value: null },
                    velocityFactor: { value: this.blurConfig.velocityFactor },
                    intensity: { value: this.blurConfig.intensity },
                    samples: { value: this.blurConfig.samples },
                },
                vertexShader:
                    '\n                    varying vec2 vUv;\n                    void main() {\n                        vUv = uv;\n                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n                    }\n                ',
                fragmentShader:
                    '\n                    uniform sampler2D tDiffuse;\n                    uniform float velocityFactor;\n                    uniform float intensity;\n                    uniform float samples;\n                    varying vec2 vUv;\n                    \n                    void main() {\n                        vec4 color = texture2D(tDiffuse, vUv);\n                        \n                        if (intensity > 0.0) {\n                            vec4 blurredColor = vec4(0.0);\n                            float sampleCount = max(1.0, samples * intensity);\n                            \n                            // Simple radial blur effect\n                            vec2 center = vec2(0.5, 0.5);\n                            vec2 direction = normalize(vUv - center);\n                            float distance = length(vUv - center);\n                            \n                            for (float i = 0.0; i < 32.0; i++) {\n                                if (i >= sampleCount) break;\n                                \n                                float offset = (i / sampleCount) * intensity * velocityFactor * 0.02;\n                                vec2 sampleUv = vUv - direction * offset;\n                                blurredColor += texture2D(tDiffuse, sampleUv);\n                            }\n                            \n                            blurredColor /= sampleCount;\n                            color = mix(color, blurredColor, intensity);\n                        }\n                        \n                        gl_FragColor = color;\n                    }\n                ',
            };
            return new THREE.ShaderPass(e);
        } catch (e) {
            return (logger$d.error('Failed to create motion blur pass', e), null);
        }
    }
    updateBlurIntensity(e) {
        if (!this.fallbackMode && this.enabled)
            try {
                const t = Math.max(0, e - this.blurConfig.speedThreshold),
                    i = Math.min(
                        (t / 3) * this.blurConfig.maxIntensity,
                        this.blurConfig.maxIntensity
                    ),
                    r = 0.1;
                ((this.blurConfig.intensity =
                    this.blurConfig.intensity + (i - this.blurConfig.intensity) * r),
                    this.motionBlurPass &&
                        this.motionBlurPass.uniforms &&
                        ((this.motionBlurPass.uniforms.intensity.value = this.blurConfig.intensity),
                        (this.motionBlurPass.uniforms.velocityFactor.value =
                            this.blurConfig.velocityFactor)),
                    this.blurConfig.intensity > 0.01 &&
                        logger$d.debug(
                            `Speed: ${e.toFixed(2)}, Intensity: ${this.blurConfig.intensity.toFixed(3)}`
                        ));
            } catch (t) {
                logger$d.error('Error updating blur intensity', t);
            }
    }
    setQuality(e) {
        if (!this.qualitySettings[e]) return void logger$d.warn(`Invalid quality level: ${e}`);
        this.currentQuality = e;
        const t = this.qualitySettings[e];
        if (
            ((this.blurConfig.samples = t.samples),
            (this.blurConfig.velocityFactor = t.velocityFactor),
            (this.blurConfig.maxIntensity = t.maxIntensity),
            this.motionBlurPass && this.composer)
        ) {
            const i = this.renderer.getSize(new THREE.Vector2()),
                r = Math.floor(i.x * t.resolution),
                n = Math.floor(i.y * t.resolution);
            (this.resizeComposer(r, n),
                this.motionBlurPass.uniforms &&
                    ((this.motionBlurPass.uniforms.samples.value = t.samples),
                    (this.motionBlurPass.uniforms.velocityFactor.value = t.velocityFactor)),
                logger$d.info(`Quality set to ${e} (${r}x${n})`));
        }
    }
    resizeComposer(e, t) {
        this.composer && this.composer.setSize(e, t);
    }
    getCurrentQuality() {
        return this.currentQuality;
    }
    setEnabled(e) {
        ((this.enabled = Boolean(e)),
            this.enabled ||
                ((this.blurConfig.intensity = 0),
                this.motionBlurPass &&
                    this.motionBlurPass.uniforms &&
                    (this.motionBlurPass.uniforms.intensity.value = 0)),
            logger$d.info('' + (this.enabled ? 'Enabled' : 'Disabled')));
    }
    render(e, t) {
        if (!this.fallbackMode && this.initialized && this.composer)
            try {
                (this.renderPass && ((this.renderPass.scene = e), (this.renderPass.camera = t)),
                    this.updatePerformanceMetrics(),
                    this.composer.render(),
                    this.performanceMetrics.autoScalingEnabled && this.autoScaleQuality());
            } catch (i) {
                (logger$d.error('Error during render', i),
                    this.errorHandler &&
                        this.errorHandler.handlePostProcessingError(i, 'Motion blur render'),
                    this.renderer.render(e, t),
                    (this.fallbackMode = !0));
            }
        else this.renderer.render(e, t);
    }
    updatePerformanceMetrics() {
        const e = performance.now();
        if (this.performanceMetrics.lastFrameTime > 0) {
            const t = e - this.performanceMetrics.lastFrameTime;
            ((this.performanceMetrics.averageFrameTime =
                0.9 * this.performanceMetrics.averageFrameTime + 0.1 * t),
                this.performanceMetrics.performanceHistory.push({
                    frameTime: t,
                    timestamp: e,
                    fps: 1e3 / t,
                }),
                this.performanceMetrics.performanceHistory.length >
                    this.performanceMetrics.maxHistoryLength &&
                    this.performanceMetrics.performanceHistory.shift());
        }
        ((this.performanceMetrics.lastFrameTime = e), this.performanceMetrics.frameCount++);
    }
    autoScaleQuality() {
        if (!this.performanceMetrics.autoScalingEnabled) return;
        const e = performance.now();
        if (
            (this.performanceMetrics.averageFrameTime,
            this.performanceMetrics.frameCount < 60 ||
                e - this.performanceMetrics.lastQualityAdjustment <
                    this.performanceMetrics.qualityAdjustmentCooldown)
        )
            return;
        const t = this.performanceMetrics.performanceHistory.slice(-30);
        if (t.length < 30) return;
        const i = t.reduce((e, t) => e + t.fps, 0) / t.length,
            r = Math.min(...t.map((e) => e.fps)),
            n = Math.max(...t.map((e) => e.fps)) - r;
        let s = this.currentQuality;
        if (i < 20)
            return (
                logger$d.warn('Performance critically low, disabling motion blur'),
                void this.setEnabled(!1)
            );
        (r < 25
            ? (s = 'low')
            : i < 35 || n > 20
              ? 'high' === this.currentQuality
                  ? (s = 'medium')
                  : 'medium' === this.currentQuality && (s = 'low')
              : r > 55 &&
                n < 10 &&
                ('low' === this.currentQuality && i > 45
                    ? (s = 'medium')
                    : 'medium' === this.currentQuality && i > 65 && (s = 'high')),
            s !== this.currentQuality &&
                (logger$d.info(`Auto-scaling quality from ${this.currentQuality} to ${s}`),
                logger$d.debug(
                    `Performance: Avg FPS: ${i.toFixed(1)}, Min: ${r.toFixed(1)}, Variability: ${n.toFixed(1)}`
                ),
                this.setQuality(s),
                (this.performanceMetrics.lastQualityAdjustment = e)));
    }
    resize(e, t) {
        if (!this.fallbackMode && this.initialized)
            try {
                if (this.composer) {
                    const i = this.qualitySettings[this.currentQuality],
                        r = Math.floor(e * i.resolution),
                        n = Math.floor(t * i.resolution);
                    (this.resizeComposer(r, n),
                        logger$d.debug(`Resized to ${e}x${t}, blur: ${r}x${n}`));
                }
            } catch (i) {
                logger$d.error('Error during resize', i);
            }
    }
    setSpeedTracker(e) {
        ((this.speedTracker = e), logger$d.info('Speed tracker integrated'));
    }
    getBlurConfig() {
        return __spreadValues({}, this.blurConfig);
    }
    getCurrentQuality() {
        return this.currentQuality;
    }
    getPerformanceMetrics() {
        const e = this.performanceMetrics.performanceHistory.slice(-30),
            t = e.length > 0 ? e.reduce((e, t) => e + t.fps, 0) / e.length : 0,
            i = e.length > 0 ? Math.min(...e.map((e) => e.fps)) : 0;
        return __spreadProps(__spreadValues({}, this.performanceMetrics), {
            currentFPS: 1e3 / this.performanceMetrics.averageFrameTime,
            averageRecentFPS: t,
            minRecentFPS: i,
            isPerformanceGood: this.performanceMetrics.averageFrameTime < 20,
            isPerformanceStable: !(e.length > 0) || Math.max(...e.map((e) => e.fps)) - i < 15,
        });
    }
    setAutoScalingEnabled(e) {
        ((this.performanceMetrics.autoScalingEnabled = Boolean(e)),
            logger$d.info(
                'Auto-scaling ' +
                    (this.performanceMetrics.autoScalingEnabled ? 'enabled' : 'disabled')
            ));
    }
    forceQuality(e) {
        (this.setQuality(e),
            this.setAutoScalingEnabled(!1),
            logger$d.info(`Forced quality to ${e}, auto-scaling disabled`));
    }
    resetPerformanceMetrics() {
        ((this.performanceMetrics.frameCount = 0),
            (this.performanceMetrics.performanceHistory = []),
            (this.performanceMetrics.lastFrameTime = 0),
            (this.performanceMetrics.averageFrameTime = 16.67),
            (this.performanceMetrics.lastQualityAdjustment = 0),
            logger$d.debug('Performance metrics reset'));
    }
    getPerformanceAnalysis() {
        const e = this.performanceMetrics.performanceHistory;
        if (0 === e.length) return { available: !1, message: 'Insufficient performance data' };
        const t = e.slice(-60),
            i = t.map((e) => e.fps),
            r = i.reduce((e, t) => e + t, 0) / i.length,
            n = Math.min(...i),
            s = Math.max(...i),
            a = i.sort((e, t) => e - t)[Math.floor(i.length / 2)],
            o = t.map((e) => e.frameTime).sort((e, t) => e - t),
            l = o[Math.floor(0.95 * o.length)],
            c = o[Math.floor(0.99 * o.length)];
        return {
            available: !0,
            sampleCount: t.length,
            fps: { average: r, minimum: n, maximum: s, median: a, variability: s - n },
            frameTime: { average: 1e3 / r, p95: l, p99: c },
            performance: {
                isGood: r > 50,
                isStable: s - n < 15,
                recommendedQuality: this.getRecommendedQuality(r, n, s - n),
            },
            recommendation: this.getRecommendedQuality(r, n, s - n),
            capabilities: this.capabilities,
        };
    }
    getRecommendedQuality(e, t, i) {
        return t < 25 || e < 30
            ? 'low'
            : t < 40 || e < 45 || i > 20
              ? 'medium'
              : t > 50 && e > 60 && i < 10
                ? 'high'
                : 'medium';
    }
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            fallbackMode: this.fallbackMode,
            quality: this.currentQuality,
            blurIntensity: this.blurConfig.intensity,
            capabilities: __spreadValues({}, this.capabilities),
            performanceMetrics: this.getPerformanceMetrics(),
        };
    }
    pause() {
        this.initialized &&
            ((this.blurConfig.intensity = 0),
            this.motionBlurPass &&
                this.motionBlurPass.uniforms &&
                (this.motionBlurPass.uniforms.intensity.value = 0),
            logger$d.debug('Paused'));
    }
    resume() {
        this.initialized &&
            ((this.performanceMetrics.lastFrameTime = performance.now()),
            logger$d.debug('Resumed'));
    }
    destroy() {
        try {
            (this.composer &&
                (this.composer.passes.forEach((e) => {
                    e.dispose && e.dispose();
                }),
                this.composer.dispose(),
                (this.composer = null)),
                (this.renderPass = null),
                (this.motionBlurPass = null),
                (this.speedTracker = null),
                (this.initialized = !1),
                logger$d.info('Resources disposed'));
        } catch (e) {
            logger$d.error('Error during disposal', e);
        }
    }
};
module$y.exports = { MotionBlurController: MotionBlurController$1 };
const __CJS__export_default__$x =
        (null == module$y.exports ? {} : module$y.exports).default || module$y.exports,
    __CJS__import__3__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$x },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$x = { exports: {} };
const { PerformanceDegradationManager: PerformanceDegradationManager$2 } =
        __CJS__export_default__$I || __CJS__import__21__,
    { CameraEffectsErrorHandler: CameraEffectsErrorHandler } =
        __CJS__export_default__$A || __CJS__import__1__$1,
    { CameraShakeController: CameraShakeController } =
        __CJS__export_default__$y || __CJS__import__2__$1,
    { MotionBlurController: MotionBlurController } =
        __CJS__export_default__$x || __CJS__import__3__,
    { createLogger: createLogger } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$c = createLogger('CameraEffectsManager');
let CameraEffectsManager$2 = class {
    constructor(e, t, i) {
        ((this.camera = e),
            (this.renderer = t),
            (this.gameState = i),
            (this.shakeController = new CameraShakeController(e)),
            (this.motionBlurController = new MotionBlurController(t)),
            (this.configManager = null),
            (this.degradationManager = new PerformanceDegradationManager$2()),
            (this.errorHandler = new CameraEffectsErrorHandler()),
            (this.enabled = !0),
            (this.initialized = !1),
            (this.lastUpdateTime = 0),
            (this.eventHandlers = { collision: [], nearMiss: [], speedChange: [] }),
            (this.originalCameraPosition = null),
            (this.originalUpdateCamera = null),
            (this.performanceMetrics = {
                lastFrameTime: 0,
                averageFrameTime: 16.67,
                frameCount: 0,
            }),
            (this.effectPool = { shakeInstances: [], maxPoolSize: 10 }),
            (this.settings = {}));
    }
    initialize() {
        try {
            return this.camera && this.renderer
                ? (this.errorHandler.initialize(
                      this,
                      this.degradationManager,
                      this.motionBlurController,
                      this.shakeController
                  ) ||
                      logger$c.warn(
                          'Error handler initialization failed, continuing without error handling'
                      ),
                  this.motionBlurController &&
                      (this.motionBlurController.initialize(this.errorHandler),
                      this.gameState &&
                          this.gameState.speedTracker &&
                          this.motionBlurController.setSpeedTracker(this.gameState.speedTracker)),
                  this.degradationManager.initialize(
                      this,
                      this.motionBlurController,
                      this.shakeController
                  ) ||
                      logger$c.warn(
                          'Degradation manager initialization failed, continuing with basic functionality'
                      ),
                  (this.originalCameraPosition = this.camera.position.clone()),
                  (this.lastUpdateTime = performance.now()),
                  (this.performanceMetrics.lastFrameTime = this.lastUpdateTime),
                  (this.initialized = !0),
                  logger$c.info(
                      'Successfully initialized with error handling and performance monitoring'
                  ),
                  !0)
                : (logger$c.error('Missing required camera or renderer'), !1);
        } catch (e) {
            return (
                logger$c.error('Initialization failed', e),
                this.errorHandler &&
                    this.errorHandler.handleRuntimeError(e, 'CameraEffectsManager initialization'),
                (this.initialized = !1),
                !1
            );
        }
    }
    update(e) {
        var t;
        if (this.initialized && this.enabled)
            try {
                if (
                    (this.updatePerformanceMetrics(e),
                    this.degradationManager &&
                        (this.degradationManager.update(e),
                        !this.degradationManager.shouldEnableEffects()))
                )
                    return void this.setEnabled(!1);
                (this.shakeController &&
                    (null == (t = this.degradationManager) ? void 0 : t.shouldEnableShake()) &&
                    this.shakeController.update(e),
                    this.applyCameraEffects());
            } catch (i) {
                (logger$c.error('Update error', i),
                    this.errorHandler
                        ? this.errorHandler.handleRuntimeError(i, 'CameraEffectsManager update')
                        : this.setEnabled(!1));
            }
    }
    onCollision(e, t = 1) {
        if (this.initialized && this.enabled)
            try {
                if (!e || 'number' != typeof t)
                    return void logger$c.warn('Invalid collision parameters');
                const i = Math.max(0, Math.min(1, t));
                (this.notifyEventHandlers('collision', { entity: e, intensity: i }),
                    this.shakeController && this.shakeController.triggerCollisionShake(i),
                    logger$c.debug(
                        `Collision event - entity: ${e.id || 'unknown'}, intensity: ${i}`
                    ));
            } catch (i) {
                logger$c.error('Collision handling error', i);
            }
    }
    onNearMiss(e, t) {
        if (this.initialized && this.enabled)
            try {
                if (!e || 'number' != typeof t)
                    return void logger$c.warn('Invalid near-miss parameters');
                if (t < 0 || t > 2) return;
                (this.notifyEventHandlers('nearMiss', { entity: e, distance: t }),
                    this.shakeController && this.shakeController.triggerNearMissShake(t),
                    logger$c.debug(
                        `Near-miss event - entity: ${e.id || 'unknown'}, distance: ${t}`
                    ));
            } catch (i) {
                logger$c.error('Near-miss handling error', i);
            }
    }
    onSpeedChange(e, t) {
        if (this.initialized && this.enabled)
            try {
                if (!e || 'number' != typeof t)
                    return void logger$c.warn('Invalid speed change parameters');
                if (t < 0 || t > 10) return;
                (this.notifyEventHandlers('speedChange', { entity: e, newSpeed: t }),
                    this.motionBlurController && this.motionBlurController.updateBlurIntensity(t),
                    logger$c.debug(
                        `Speed change event - entity: ${e.id || 'unknown'}, speed: ${t}`
                    ));
            } catch (i) {
                logger$c.error('Speed change handling error', i);
            }
    }
    addEventListener(e, t) {
        this.eventHandlers[e]
            ? 'function' == typeof t
                ? this.eventHandlers[e].push(t)
                : logger$c.warn('Event handler must be a function')
            : logger$c.warn(`Unknown event type: ${e}`);
    }
    removeEventListener(e, t) {
        if (!this.eventHandlers[e]) return;
        const i = this.eventHandlers[e].indexOf(t);
        -1 !== i && this.eventHandlers[e].splice(i, 1);
    }
    notifyEventHandlers(e, t) {
        this.eventHandlers[e] &&
            this.eventHandlers[e].forEach((i) => {
                try {
                    i(t);
                } catch (r) {
                    logger$c.error(`Event handler error for ${e}`, r);
                }
            });
    }
    applyCameraEffects() {
        this.camera && this.originalCameraPosition;
    }
    updatePerformanceMetrics(e) {
        const t = performance.now(),
            i = t - this.performanceMetrics.lastFrameTime;
        ((this.performanceMetrics.averageFrameTime =
            0.9 * this.performanceMetrics.averageFrameTime + 0.1 * i),
            (this.performanceMetrics.lastFrameTime = t),
            this.performanceMetrics.frameCount++);
    }
    getPerformanceMetrics() {
        const e = 1e3 / this.performanceMetrics.averageFrameTime;
        return (
            (!this.performanceMetrics.minFPS || e < this.performanceMetrics.minFPS) &&
                (this.performanceMetrics.minFPS = e),
            (!this.performanceMetrics.maxFPS || e > this.performanceMetrics.maxFPS) &&
                (this.performanceMetrics.maxFPS = e),
            __spreadProps(__spreadValues({}, this.performanceMetrics), {
                currentFPS: e,
                minFPS: this.performanceMetrics.minFPS,
                maxFPS: this.performanceMetrics.maxFPS,
                isPerformanceGood: this.performanceMetrics.averageFrameTime < 20,
            })
        );
    }
    setEnabled(e) {
        ((this.enabled = Boolean(e)),
            this.shakeController && this.shakeController.setEnabled(this.enabled),
            this.motionBlurController && this.motionBlurController.setEnabled(this.enabled),
            this.enabled || this.resetCameraPosition(),
            logger$c.info('' + (this.enabled ? 'Enabled' : 'Disabled')));
    }
    isEnabled() {
        return this.enabled && this.initialized;
    }
    resetCameraPosition() {
        this.camera &&
            this.originalCameraPosition &&
            this.camera.position.copy(this.originalCameraPosition);
    }
    pause() {
        this.initialized &&
            (this.shakeController &&
                'function' == typeof this.shakeController.pause &&
                this.shakeController.pause(),
            this.motionBlurController &&
                'function' == typeof this.motionBlurController.pause &&
                this.motionBlurController.pause(),
            logger$c.debug('Paused'));
    }
    resume() {
        this.initialized &&
            (this.shakeController &&
                'function' == typeof this.shakeController.resume &&
                this.shakeController.resume(),
            this.motionBlurController &&
                'function' == typeof this.motionBlurController.resume &&
                this.motionBlurController.resume(),
            (this.lastUpdateTime = performance.now()),
            (this.performanceMetrics.lastFrameTime = this.lastUpdateTime),
            logger$c.debug('Resumed'));
    }
    destroy() {
        try {
            (this.resetCameraPosition(),
                Object.keys(this.eventHandlers).forEach((e) => {
                    this.eventHandlers[e] = [];
                }),
                this.shakeController &&
                    'function' == typeof this.shakeController.destroy &&
                    this.shakeController.destroy(),
                this.motionBlurController &&
                    'function' == typeof this.motionBlurController.destroy &&
                    this.motionBlurController.destroy(),
                this.configManager &&
                    'function' == typeof this.configManager.destroy &&
                    this.configManager.destroy(),
                this.effectPool && (this.effectPool.shakeInstances = []),
                this.degradationManager &&
                    'function' == typeof this.degradationManager.destroy &&
                    this.degradationManager.destroy(),
                this.errorHandler &&
                    'function' == typeof this.errorHandler.destroy &&
                    this.errorHandler.destroy(),
                (this.initialized = !1),
                (this.enabled = !1),
                (this.originalCameraPosition = null),
                logger$c.info('Destroyed'));
        } catch (e) {
            (logger$c.error('Destruction error', e),
                this.errorHandler &&
                    this.errorHandler.handleRuntimeError(e, 'CameraEffectsManager destruction'));
        }
    }
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            settings: __spreadValues({}, this.settings),
            hasCamera: !!this.camera,
            hasRenderer: !!this.renderer,
            eventHandlerCounts: Object.keys(this.eventHandlers).reduce(
                (e, t) => ((e[t] = this.eventHandlers[t].length), e),
                {}
            ),
            performanceMetrics: this.getPerformanceMetrics(),
            subsystems: {
                shake: this.shakeController
                    ? {
                          enabled: this.shakeController.isEnabled(),
                          activeEffects: this.shakeController.getActiveShakeCount(),
                          currentOffset: this.shakeController.getCurrentOffset(),
                      }
                    : null,
                motionBlur: this.motionBlurController
                    ? {
                          enabled: this.motionBlurController.enabled,
                          intensity: this.motionBlurController.getBlurConfig().intensity,
                          quality: this.motionBlurController.getCurrentQuality(),
                      }
                    : null,
                configManager: !!this.configManager,
                degradationManager: !!this.degradationManager,
                errorHandler: !!this.errorHandler,
            },
            degradationState: this.degradationManager
                ? this.degradationManager.getDegradationState()
                : null,
            errorStatistics: this.errorHandler ? this.errorHandler.getErrorStatistics() : null,
            capabilities: this.degradationManager
                ? this.degradationManager.getCapabilitiesSummary()
                : null,
        };
    }
    getErrorHandler() {
        return this.errorHandler;
    }
    getDegradationManager() {
        return this.degradationManager;
    }
    isInFallbackMode() {
        return !!this.errorHandler && this.errorHandler.getStatus().fallbackMode;
    }
    attemptRecovery() {
        return (
            !(!this.errorHandler || !this.errorHandler.hasRecoverableErrors()) &&
            this.errorHandler.attemptRecovery('runtime')
        );
    }
    updateSettings(e) {
        if (e) {
            if (
                ((this.settings = __spreadValues(__spreadValues({}, this.settings), e)),
                this.configManager &&
                    'function' == typeof this.configManager.updateSettings &&
                    this.configManager.updateSettings(e),
                void 0 !== e.accessibilityMode &&
                    (e.accessibilityMode
                        ? (this.shakeController && this.shakeController.setEnabled(!1),
                          this.motionBlurController && this.motionBlurController.setEnabled(!1))
                        : (this.shakeController && this.shakeController.setEnabled(!0),
                          this.motionBlurController && this.motionBlurController.setEnabled(!0))),
                void 0 !== e.shakeIntensity &&
                    this.shakeController &&
                    'number' == typeof e.shakeIntensity &&
                    this.shakeController.setIntensityMultiplier(e.shakeIntensity),
                void 0 !== e.shakeEnabled &&
                    this.shakeController &&
                    this.shakeController.setEnabled(e.shakeEnabled),
                void 0 !== e.motionBlurEnabled &&
                    this.motionBlurController &&
                    this.motionBlurController.setEnabled(e.motionBlurEnabled),
                void 0 !== e.motionBlurQuality &&
                    this.motionBlurController &&
                    this.motionBlurController.setQuality(e.motionBlurQuality),
                void 0 !== e.respectSystemPreferences &&
                    e.respectSystemPreferences &&
                    window.matchMedia)
            ) {
                window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
                    (this.shakeController && this.shakeController.setEnabled(!1),
                    this.motionBlurController && this.motionBlurController.setEnabled(!1));
            }
            logger$c.debug('Settings updated', e);
        }
    }
    reset() {
        (this.shakeController && this.shakeController.clearAllShakes(),
            this.motionBlurController &&
                (this.motionBlurController.setEnabled(!1),
                this.motionBlurController.setEnabled(this.enabled)),
            this.resetCameraPosition(),
            logger$c.debug('Reset'));
    }
    updateGameState(e) {
        ((this.gameState = e), logger$c.debug('Game state updated'));
    }
    hasPostProcessing() {
        return (
            this.motionBlurController &&
            this.motionBlurController.enabled &&
            !this.motionBlurController.fallbackMode
        );
    }
    render(e, t) {
        this.hasPostProcessing()
            ? this.motionBlurController.render(e, t)
            : this.renderer.render(e, t);
    }
};
module$x.exports = { CameraEffectsManager: CameraEffectsManager$2 };
const __CJS__export_default__$w =
        (null == module$x.exports ? {} : module$x.exports).default || module$x.exports,
    __CJS__import__25__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$w },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$w = { exports: {} };
const { Logger: Logger$8 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$b = Logger$8.create('EffectsConfigManager');
let EffectsConfigManager$1 = class {
    constructor() {
        ((this.storageKey = 'lightbikes_camera_effects_settings'),
            (this.settingsVersion = '1.0.0'),
            (this.defaultSettings = {
                version: this.settingsVersion,
                shakeEnabled: !0,
                shakeIntensity: 1,
                motionBlurEnabled: !0,
                motionBlurQuality: 'medium',
                accessibilityMode: !1,
                respectSystemPreferences: !0,
            }),
            (this.currentSettings = null),
            (this.changeListeners = []),
            this.loadSettings());
    }
    getSettings() {
        return __spreadValues({}, this.currentSettings);
    }
    updateSettings(e) {
        const t = this.validateSettings(e);
        if (!t || 0 === Object.keys(t).length)
            return (logger$b.warn('Invalid settings provided to EffectsConfigManager'), !1);
        const i = __spreadValues({}, this.currentSettings);
        return (
            (this.currentSettings = __spreadValues(__spreadValues({}, this.currentSettings), t)),
            this.saveSettings(),
            this.notifyListeners(this.currentSettings, i),
            !0
        );
    }
    resetToDefaults() {
        ((this.currentSettings = __spreadValues({}, this.defaultSettings)),
            this.saveSettings(),
            this.notifyListeners(this.currentSettings, {}));
    }
    addChangeListener(e) {
        'function' == typeof e && this.changeListeners.push(e);
    }
    removeChangeListener(e) {
        const t = this.changeListeners.indexOf(e);
        t > -1 && this.changeListeners.splice(t, 1);
    }
    validateSettings(e) {
        if (!e || 'object' != typeof e)
            return (logger$b.warn('Invalid settings object provided to validateSettings'), null);
        const t = {},
            i = [];
        'version' in e &&
            ('string' == typeof e.version
                ? (t.version = e.version)
                : i.push('version must be a string'));
        if (
            ([
                'shakeEnabled',
                'motionBlurEnabled',
                'accessibilityMode',
                'respectSystemPreferences',
            ].forEach((r) => {
                r in e &&
                    ('boolean' == typeof e[r] ||
                    'true' === e[r] ||
                    'false' === e[r] ||
                    1 === e[r] ||
                    0 === e[r]
                        ? (t[r] = Boolean(e[r]))
                        : i.push(`${r} must be a boolean value`));
            }),
            'shakeIntensity' in e)
        ) {
            const r = Number(e.shakeIntensity);
            !isNaN(r) && r >= 0 && r <= 2
                ? (t.shakeIntensity = r)
                : i.push('shakeIntensity must be a number between 0.0 and 2.0');
        }
        if ('motionBlurQuality' in e) {
            const r = ['low', 'medium', 'high'];
            r.includes(e.motionBlurQuality)
                ? (t.motionBlurQuality = e.motionBlurQuality)
                : i.push(`motionBlurQuality must be one of: ${r.join(', ')}`);
        }
        return (i.length > 0 && logger$b.warn('Settings validation errors:', i), t);
    }
    loadSettings() {
        try {
            if ('undefined' != typeof localStorage) {
                const e = localStorage.getItem(this.storageKey);
                if (e) {
                    const t = JSON.parse(e),
                        i = this.migrateSettings(t),
                        r = this.validateSettings(i);
                    r && Object.keys(r).length > 0
                        ? ((this.currentSettings = __spreadValues(
                              __spreadValues({}, this.defaultSettings),
                              r
                          )),
                          i.version !== t.version &&
                              (this.saveSettings(),
                              logger$b.info(
                                  'Camera effects settings migrated to version',
                                  this.settingsVersion
                              )))
                        : (this.currentSettings = __spreadValues({}, this.defaultSettings));
                } else this.currentSettings = __spreadValues({}, this.defaultSettings);
            } else this.currentSettings = __spreadValues({}, this.defaultSettings);
        } catch (e) {
            (logger$b.warn('Failed to load camera effects settings from storage:', e),
                (this.currentSettings = __spreadValues({}, this.defaultSettings)));
        }
    }
    migrateSettings(e) {
        if (!e || 'object' != typeof e) return __spreadValues({}, this.defaultSettings);
        const t = __spreadValues({}, e);
        return (
            t.version || (t.version = this.settingsVersion),
            (t.version = this.settingsVersion),
            t
        );
    }
    saveSettings() {
        try {
            'undefined' != typeof localStorage &&
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
        } catch (e) {
            logger$b.warn('Failed to save camera effects settings to storage:', e);
        }
    }
    notifyListeners(e, t) {
        this.changeListeners.forEach((i) => {
            try {
                i(e, t);
            } catch (r) {
                logger$b.error('Error in settings change listener:', r);
            }
        });
    }
    getSetting(e) {
        return void 0 !== this.currentSettings[e]
            ? this.currentSettings[e]
            : this.defaultSettings[e];
    }
    shouldDisableEffects() {
        if (this.currentSettings.accessibilityMode) return !0;
        if (this.currentSettings.respectSystemPreferences)
            try {
                if ('undefined' != typeof window && window.matchMedia)
                    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            } catch (e) {
                return !1;
            }
        return !1;
    }
    getEffectiveSettings() {
        const e = this.getSettings();
        return this.shouldDisableEffects()
            ? __spreadProps(__spreadValues({}, e), { shakeEnabled: !1, motionBlurEnabled: !1 })
            : e;
    }
    checkAndRepairSettings() {
        let e = !1;
        try {
            const t = this.validateSettings(this.currentSettings);
            if (t && 0 !== Object.keys(t).length) {
                const t = Object.keys(this.defaultSettings).filter(
                    (e) => !(e in this.currentSettings)
                );
                t.length > 0 &&
                    (logger$b.warn('Missing settings keys detected, adding defaults:', t),
                    t.forEach((e) => {
                        this.currentSettings[e] = this.defaultSettings[e];
                    }),
                    this.saveSettings(),
                    (e = !0));
            } else
                (logger$b.warn('Current settings are corrupted, resetting to defaults'),
                    (this.currentSettings = __spreadValues({}, this.defaultSettings)),
                    this.saveSettings(),
                    (e = !0));
        } catch (t) {
            (logger$b.error('Error during settings integrity check:', t),
                (this.currentSettings = __spreadValues({}, this.defaultSettings)),
                this.saveSettings(),
                (e = !0));
        }
        return e;
    }
    exportSettings() {
        try {
            return JSON.stringify(this.currentSettings, null, 2);
        } catch (e) {
            return (logger$b.error('Failed to export settings:', e), null);
        }
    }
    importSettings(e) {
        try {
            const t = JSON.parse(e),
                i = this.validateSettings(t);
            if (i && Object.keys(i).length > 0) {
                const e = __spreadValues({}, this.currentSettings);
                return (
                    (this.currentSettings = __spreadValues(
                        __spreadValues({}, this.defaultSettings),
                        i
                    )),
                    this.saveSettings(),
                    this.notifyListeners(this.currentSettings, e),
                    !0
                );
            }
            return (logger$b.warn('Invalid settings data provided for import'), !1);
        } catch (t) {
            return (logger$b.error('Failed to import settings:', t), !1);
        }
    }
};
module$w.exports = { EffectsConfigManager: EffectsConfigManager$1 };
const __CJS__export_default__$v =
        (null == module$w.exports ? {} : module$w.exports).default || module$w.exports,
    __CJS__import__0__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$v },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$v = { exports: {} };
const { EffectsConfigManager: EffectsConfigManager } =
    __CJS__export_default__$v || __CJS__import__0__$1;
let CameraEffectsUI$2 = class {
    constructor() {
        ((this.configManager = new EffectsConfigManager()),
            (this.isVisible = !1),
            (this.elements = {}),
            this.initializeElements(),
            this.bindEvents(),
            this.loadCurrentSettings(),
            this.configManager.addChangeListener((e) => {
                this.updateUIFromSettings(e);
            }));
    }
    initializeElements() {
        this.elements = {
            button: document.getElementById('cameraEffectsButton'),
            panel: document.getElementById('cameraEffectsPanel'),
            accessibilityWarning: document.getElementById('accessibilityWarning'),
            shakeIntensityButtons: document.querySelectorAll('.shake-intensity-btn'),
            motionBlurToggle: document.getElementById('motionBlurToggle'),
            motionBlurQualityButtons: document.querySelectorAll('#cameraEffectsPanel .quality-btn'),
            accessibilityModeToggle: document.getElementById('accessibilityModeToggle'),
            systemPreferencesToggle: document.getElementById('systemPreferencesToggle'),
            resetButton: document.getElementById('resetCameraEffectsSettings'),
            closeButton: document.getElementById('closeCameraEffectsSettings'),
        };
    }
    bindEvents() {
        if (
            (this.elements.button &&
                this.elements.button.addEventListener('click', () => this.togglePanel()),
            this.elements.shakeIntensityButtons.forEach((e) => {
                e.addEventListener('click', (e) => {
                    const t = parseFloat(e.currentTarget.dataset.intensity);
                    this.updateShakeIntensity(t);
                });
            }),
            this.elements.motionBlurToggle &&
                this.elements.motionBlurToggle.addEventListener('click', () => {
                    this.toggleMotionBlur();
                }),
            this.elements.motionBlurQualityButtons.forEach((e) => {
                e.addEventListener('click', (e) => {
                    const t = e.currentTarget.dataset.quality;
                    this.updateMotionBlurQuality(t);
                });
            }),
            this.elements.accessibilityModeToggle &&
                this.elements.accessibilityModeToggle.addEventListener('click', () => {
                    this.toggleAccessibilityMode();
                }),
            this.elements.systemPreferencesToggle &&
                this.elements.systemPreferencesToggle.addEventListener('click', () => {
                    this.toggleSystemPreferences();
                }),
            this.elements.resetButton &&
                this.elements.resetButton.addEventListener('click', () => this.resetSettings()),
            this.elements.closeButton &&
                this.elements.closeButton.addEventListener('click', () => this.hidePanel()),
            document.addEventListener('click', (e) => {
                !this.isVisible ||
                    this.elements.panel.contains(e.target) ||
                    this.elements.button.contains(e.target) ||
                    this.hidePanel();
            }),
            'undefined' != typeof window && window.matchMedia)
        ) {
            window
                .matchMedia('(prefers-reduced-motion: reduce)')
                .addListener(() => this.updateAccessibilityWarning());
        }
    }
    togglePanel() {
        this.isVisible ? this.hidePanel() : this.showPanel();
    }
    showPanel() {
        this.elements.panel &&
            ((this.elements.panel.style.display = 'block'),
            this.elements.button.classList.add('active'),
            (this.isVisible = !0),
            this.updateAccessibilityWarning());
    }
    hidePanel() {
        this.elements.panel &&
            ((this.elements.panel.style.display = 'none'),
            this.elements.button.classList.remove('active'),
            (this.isVisible = !1));
    }
    loadCurrentSettings() {
        const e = this.configManager.getSettings();
        this.updateUIFromSettings(e);
    }
    updateUIFromSettings(e) {
        (this.elements.shakeIntensityButtons.forEach((t) => {
            (t.classList.remove('active'),
                parseFloat(t.dataset.intensity) === e.shakeIntensity && t.classList.add('active'));
        }),
            this.updateToggleState(this.elements.motionBlurToggle, e.motionBlurEnabled),
            this.elements.motionBlurQualityButtons.forEach((t) => {
                (t.classList.remove('active'),
                    t.dataset.quality === e.motionBlurQuality && t.classList.add('active'));
            }),
            this.updateToggleState(this.elements.accessibilityModeToggle, e.accessibilityMode),
            this.updateToggleState(
                this.elements.systemPreferencesToggle,
                e.respectSystemPreferences
            ),
            this.updateAccessibilityWarning());
    }
    updateToggleState(e, t) {
        e && (t ? e.classList.add('active') : e.classList.remove('active'));
    }
    updateShakeIntensity(e) {
        const t = { shakeIntensity: e, shakeEnabled: e > 0 };
        this.configManager.updateSettings(t);
    }
    toggleMotionBlur() {
        const e = this.configManager.getSettings();
        this.configManager.updateSettings({ motionBlurEnabled: !e.motionBlurEnabled });
    }
    updateMotionBlurQuality(e) {
        this.configManager.updateSettings({ motionBlurQuality: e });
    }
    toggleAccessibilityMode() {
        const e = this.configManager.getSettings();
        this.configManager.updateSettings({ accessibilityMode: !e.accessibilityMode });
    }
    toggleSystemPreferences() {
        const e = this.configManager.getSettings();
        this.configManager.updateSettings({
            respectSystemPreferences: !e.respectSystemPreferences,
        });
    }
    resetSettings() {
        this.configManager.resetToDefaults();
    }
    updateAccessibilityWarning() {
        if (this.elements.accessibilityWarning) {
            this.configManager.shouldDisableEffects()
                ? this.elements.accessibilityWarning.classList.add('show')
                : this.elements.accessibilityWarning.classList.remove('show');
        }
    }
    getConfigManager() {
        return this.configManager;
    }
    destroy() {
        this.configManager &&
            this.configManager.removeChangeListener(this.updateUIFromSettings.bind(this));
    }
};
module$v.exports = { CameraEffectsUI: CameraEffectsUI$2 };
const __CJS__export_default__$u =
        (null == module$v.exports ? {} : module$v.exports).default || module$v.exports,
    __CJS__import__26__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$u },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$u = { exports: {} };
const { logger: logger$a } = __CJS__export_default__$1a || __CJS__import__50__;
class PerformanceOptimizer {
    constructor(e, t) {
        ((this.scene = e),
            (this.renderer = t),
            (this.materialPools = { bike: new Map(), trail: new Map(), theme: new Map() }),
            (this.geometryPools = { bike: null, trailSegment: null, powerUp: new Map() }),
            (this.texturePools = { gradients: new Map(), patterns: new Map(), effects: new Map() }),
            (this.lodConfig = {
                trailSegments: {
                    highDetail: { distance: 20, opacity: 0.8 },
                    mediumDetail: { distance: 50, opacity: 0.6 },
                    lowDetail: { distance: 100, opacity: 0.4 },
                    culled: { distance: 150 },
                },
                effects: {
                    highDetail: { distance: 30 },
                    mediumDetail: { distance: 60 },
                    culled: { distance: 120 },
                },
            }),
            (this.performanceMetrics = {
                frameTime: 0,
                drawCalls: 0,
                materialCount: 0,
                geometryCount: 0,
                textureCount: 0,
                lastOptimizationTime: 0,
                averageFPS: 0,
            }),
            (this.lastFrameTime =
                'undefined' != typeof performance ? performance.now() : Date.now()),
            (this.debugMode = !1),
            (this.batchUpdates = {
                materials: new Set(),
                geometries: new Set(),
                textures: new Set(),
                scheduled: !1,
            }),
            this.initializeGeometryPools(),
            this.startPerformanceMonitoring());
    }
    initializeGeometryPools() {
        ((this.geometryPools.bike = new THREE.BoxGeometry(1, 1, 1)),
            (this.geometryPools.trailSegment = new THREE.BoxGeometry(0.1, 0.5, 0.5)),
            this.geometryPools.powerUp.set('speed', new THREE.SphereGeometry(0.3, 16, 16)));
        const e = THREE.OctahedronGeometry || THREE.SphereGeometry,
            t = THREE.IcosahedronGeometry || THREE.SphereGeometry,
            i = THREE.ConeGeometry || THREE.BoxGeometry;
        (this.geometryPools.powerUp.set('shield', new e(0.3, 1)),
            this.geometryPools.powerUp.set('eraser', new i(0.3, 0.6, 8)),
            this.geometryPools.powerUp.set('ghost', new t(0.3, 1)));
    }
    getOrCreateBikeMaterial(e, t = {}) {
        const i = `${e}_${JSON.stringify(t)}`;
        if (this.materialPools.bike.has(i)) return this.materialPools.bike.get(i);
        const r = new THREE.MeshLambertMaterial({
            color: e,
            transparent: t.transparent || !1,
            opacity: t.opacity || 1,
            emissive: t.emissive || 0,
            emissiveIntensity: t.emissiveIntensity || 0,
        });
        return (this.materialPools.bike.set(i, r), this.performanceMetrics.materialCount++, r);
    }
    getOrCreateTrailMaterial(e, t, i = {}) {
        const r = `${e}_${t}_${JSON.stringify(i)}`;
        if (this.materialPools.trail.has(r)) return this.materialPools.trail.get(r);
        let n;
        if ('glowing' === t)
            n = new THREE.MeshLambertMaterial({
                color: e,
                transparent: !0,
                opacity: i.opacity || 0.9,
                emissive: e,
                emissiveIntensity: i.emissiveIntensity || 0.5,
            });
        else
            n = new THREE.MeshLambertMaterial({
                color: e,
                transparent: !0,
                opacity: i.opacity || 0.8,
            });
        return (this.materialPools.trail.set(r, n), this.performanceMetrics.materialCount++, n);
    }
    getOrCreateThemeMaterial(e, t, i) {
        const r = `${e}_${t}_${JSON.stringify(i)}`;
        if (this.materialPools.theme.has(r)) return this.materialPools.theme.get(r);
        let n;
        switch (t) {
            case 'grid':
                n = new THREE.LineBasicMaterial({
                    color: i.color,
                    opacity: i.opacity,
                    transparent: !0,
                });
                break;
            case 'background':
                n = new THREE.MeshBasicMaterial({
                    color: i.color,
                    transparent: i.transparent || !1,
                    opacity: i.opacity || 1,
                });
                break;
            default:
                n = new THREE.MeshLambertMaterial({
                    color: i.color,
                    transparent: i.transparent || !1,
                    opacity: i.opacity || 1,
                });
        }
        return (this.materialPools.theme.set(r, n), this.performanceMetrics.materialCount++, n);
    }
    getSharedGeometry(e) {
        return this.geometryPools[e]
            ? this.geometryPools[e]
            : this.geometryPools.powerUp.has(e)
              ? this.geometryPools.powerUp.get(e)
              : (logger$a.warn('Unknown geometry type:', e), this.geometryPools.bike);
    }
    getOrCreateTexture(e, t, i) {
        const r = this.texturePools[e];
        if (!r) return (logger$a.warn('Unknown texture pool type:', e), null);
        if (r.has(t)) return r.get(t);
        const n = i();
        return (r.set(t, n), this.performanceMetrics.textureCount++, n);
    }
    applyTrailLOD(e) {
        const t = this.lodConfig.trailSegments;
        this.scene.traverse((i) => {
            if (i.userData && i.userData.materialId && i.userData.materialId.startsWith('trail_')) {
                const r = i.position.distanceTo(e);
                r > t.culled.distance
                    ? (i.visible = !1)
                    : r > t.lowDetail.distance
                      ? ((i.visible = !0), (i.material.opacity = t.lowDetail.opacity))
                      : r > t.mediumDetail.distance
                        ? ((i.visible = !0), (i.material.opacity = t.mediumDetail.opacity))
                        : ((i.visible = !0), (i.material.opacity = t.highDetail.opacity));
            }
        });
    }
    applyEffectsLOD(e) {
        const t = this.lodConfig.effects;
        this.scene.traverse((i) => {
            if (i.userData && i.userData.effectType) {
                const r = e.distanceTo(i.position);
                r > t.culled.distance
                    ? (i.visible = !1)
                    : r > t.mediumDetail.distance
                      ? ((i.visible = !0),
                        i.material &&
                            void 0 !== i.material.emissiveIntensity &&
                            (i.material.emissiveIntensity *= 0.5))
                      : ((i.visible = !0),
                        i.material &&
                            void 0 !== i.material.emissiveIntensity &&
                            (i.material.emissiveIntensity =
                                i.userData.originalEmissiveIntensity || 0.5));
            }
        });
    }
    scheduleMaterialUpdate(e) {
        (this.batchUpdates.materials.add(e), this.scheduleBatchUpdate());
    }
    scheduleGeometryUpdate(e) {
        (this.batchUpdates.geometries.add(e), this.scheduleBatchUpdate());
    }
    scheduleTextureUpdate(e) {
        (this.batchUpdates.textures.add(e), this.scheduleBatchUpdate());
    }
    scheduleBatchUpdate() {
        this.batchUpdates.scheduled ||
            ((this.batchUpdates.scheduled = !0),
            requestAnimationFrame(() => {
                this.executeBatchUpdates();
            }));
    }
    executeBatchUpdates() {
        (this.batchUpdates.materials.forEach((e) => {
            void 0 !== e.needsUpdate && (e.needsUpdate = !0);
        }),
            this.batchUpdates.geometries.forEach((e) => {
                e.attributes &&
                    Object.values(e.attributes).forEach((e) => {
                        void 0 !== e.needsUpdate && (e.needsUpdate = !0);
                    });
            }),
            this.batchUpdates.textures.forEach((e) => {
                void 0 !== e.needsUpdate && (e.needsUpdate = !0);
            }),
            this.batchUpdates.materials.clear(),
            this.batchUpdates.geometries.clear(),
            this.batchUpdates.textures.clear(),
            (this.batchUpdates.scheduled = !1));
    }
    optimizeScene(e) {
        (this.applyTrailLOD(e),
            this.applyEffectsLOD(e),
            this.batchUpdates.scheduled && this.executeBatchUpdates(),
            this.updatePerformanceMetrics());
    }
    updatePerformanceMetrics() {
        const e = this.renderer ? this.renderer.info : null;
        e &&
            ((this.performanceMetrics.drawCalls = e.render ? e.render.calls : 0),
            (this.performanceMetrics.geometryCount = e.memory ? e.memory.geometries : 0),
            (this.performanceMetrics.textureCount = e.memory ? e.memory.textures : 0));
        const t = 'undefined' != typeof performance ? performance.now() : Date.now();
        if (void 0 !== this.lastFrameTime) {
            const e = t - this.lastFrameTime;
            ((this.performanceMetrics.frameTime =
                0.9 * this.performanceMetrics.frameTime + 0.1 * e),
                (this.performanceMetrics.averageFPS = 1e3 / this.performanceMetrics.frameTime));
        }
        this.lastFrameTime = t;
    }
    getPerformanceMetrics() {
        return __spreadValues({}, this.performanceMetrics);
    }
    isPerformanceAcceptable() {
        return this.performanceMetrics.frameTime <= 20.004;
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            (this.updatePerformanceMetrics(),
                this.performanceMetrics.averageFPS < 30 &&
                    (this.debugMode &&
                        logger$a.warn('Performance below target:', this.performanceMetrics),
                    this.optimizePerformance()));
        }, 1e3);
    }
    optimizePerformance() {}
    cleanup() {
        (Object.values(this.materialPools).forEach((e) => {
            (e.forEach((e) => {
                e.dispose && e.dispose();
            }),
                e.clear());
        }),
            Object.values(this.texturePools).forEach((e) => {
                (e.forEach((e) => {
                    e.dispose && e.dispose();
                }),
                    e.clear());
            }),
            Object.values(this.geometryPools).forEach((e) => {
                e && e.dispose && e.dispose();
            }),
            this.geometryPools.powerUp.forEach((e) => {
                e.dispose && e.dispose();
            }),
            (this.performanceMetrics.materialCount = 0),
            (this.performanceMetrics.textureCount = 0),
            (this.performanceMetrics.geometryCount = 0));
    }
    disposeMaterial(e, t) {
        const i = this.materialPools[e];
        if (i && i.has(t)) {
            const e = i.get(t);
            (e.dispose && e.dispose(), i.delete(t), this.performanceMetrics.materialCount--);
        }
    }
}
module$u.exports = { PerformanceOptimizer: PerformanceOptimizer };
const __CJS__export_default__$t =
        (null == module$u.exports ? {} : module$u.exports).default || module$u.exports,
    __CJS__import__1__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$t },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$t = { exports: {} };
const { Logger: Logger$7 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$9 = new Logger$7('CustomizationManager');
let CustomizationManager$2 = class {
    constructor(e, t) {
        if (
            ((this.renderingEngine = e),
            (this.preferenceStorage = t),
            (this.themeEngine = null),
            (this.performanceOptimizer = null),
            e && e.scene && e.renderer)
        ) {
            const { PerformanceOptimizer: t } = __CJS__export_default__$t || __CJS__import__1__;
            this.performanceOptimizer = new t(e.scene, e.renderer);
        }
        ((this.currentState = {
            bikeColor: '#00FF00',
            trailColor: '#00FF00',
            trailStyle: 'solid',
            arenaTheme: 'classic-grid',
        }),
            (this.previewMode = !1),
            (this.previewState = null),
            (this.originalState = null),
            (this.pendingPreferenceApplication = !1),
            (this.colorPresets = {
                red: '#FF0000',
                blue: '#0000FF',
                green: '#00FF00',
                yellow: '#FFFF00',
                purple: '#800080',
                orange: '#FFA500',
                cyan: '#00FFFF',
                white: '#FFFFFF',
            }),
            (this.trailStyles = {
                solid: { opacity: 0.8, segments: 'continuous', effects: [] },
                dashed: { opacity: 0.8, segments: 'alternating', effects: [] },
                glowing: { opacity: 0.9, segments: 'continuous', effects: ['emissive', 'bloom'] },
                rainbow: { opacity: 0.8, segments: 'continuous', effects: ['color-cycle'] },
            }),
            this.initializePreferences());
    }
    setBikeColor(e, t) {
        if (!this.validateColor(t)) return (logger$9.warn('Invalid color format:', t), !1);
        const i = this.previewMode ? this.previewState : this.currentState;
        if (
            'player' === e &&
            ((i.bikeColor = t), this.renderingEngine && this.renderingEngine.emissiveMaterialSystem)
        )
            try {
                const e = parseInt(t.replace('#', ''), 16);
                this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial('player', e);
            } catch (r) {
                logger$9.warn('Failed to apply bike color to rendering engine:', r.message);
            }
        return !0;
    }
    setTrailColor(e, t) {
        if (!this.validateColor(t)) return (logger$9.warn('Invalid color format:', t), !1);
        const i = this.previewMode ? this.previewState : this.currentState;
        if (
            'player' === e &&
            ((i.trailColor = t),
            this.renderingEngine && this.renderingEngine.emissiveMaterialSystem)
        ) {
            const e = parseInt(t.replace('#', ''), 16);
            this.updateExistingTrailMaterials('player', e);
        }
        return !0;
    }
    setTrailStyle(e, t) {
        if (!this.trailStyles[t]) return (logger$9.warn('Invalid trail style:', t), !1);
        const i = this.previewMode ? this.previewState : this.currentState;
        return ('player' === e && ((i.trailStyle = t), this.applyTrailStyle(e, t)), !0);
    }
    setArenaTheme(e) {
        if ((this.themeEngine || this.initializeThemeEngine(), !this.themeEngine.isValidTheme(e)))
            return (logger$9.warn('Invalid theme name:', e), !1);
        return (
            ((this.previewMode ? this.previewState : this.currentState).arenaTheme = e),
            this.themeEngine.loadTheme(e),
            !0
        );
    }
    enablePreviewMode() {
        this.previewMode ||
            ((this.previewMode = !0),
            (this.originalState = __spreadValues({}, this.currentState)),
            (this.previewState = __spreadValues({}, this.currentState)));
    }
    disablePreviewMode() {
        this.previewMode &&
            (this.originalState &&
                (this.applyState(this.originalState),
                (this.currentState = __spreadValues({}, this.originalState))),
            (this.previewMode = !1),
            (this.previewState = null),
            (this.originalState = null));
    }
    applyPreviewChanges() {
        return (
            !(!this.previewMode || !this.previewState) &&
            ((this.currentState = __spreadValues({}, this.previewState)),
            (this.previewMode = !1),
            (this.previewState = null),
            (this.originalState = null),
            this.saveCurrentPreferences(),
            !0)
        );
    }
    cancelPreviewChanges() {
        this.disablePreviewMode();
    }
    loadSavedPreferences(e = !1) {
        try {
            const t = this.preferenceStorage.loadPreferences();
            if (t && t.preferences) {
                const i = t.preferences;
                return (
                    i.bikeColor &&
                        this.validateColor(i.bikeColor) &&
                        (this.currentState.bikeColor = i.bikeColor),
                    i.trailColor &&
                        this.validateColor(i.trailColor) &&
                        (this.currentState.trailColor = i.trailColor),
                    i.trailStyle &&
                        this.trailStyles[i.trailStyle] &&
                        (this.currentState.trailStyle = i.trailStyle),
                    i.arenaTheme && (this.currentState.arenaTheme = i.arenaTheme),
                    e || this.isRenderingEngineReady()
                        ? this.applyState(this.currentState)
                        : (this.pendingPreferenceApplication = !0),
                    logger$9.info('Loaded saved preferences:', this.currentState),
                    !0
                );
            }
            return (logger$9.info('No saved preferences found, using defaults'), !1);
        } catch (t) {
            return (logger$9.warn('Failed to load saved preferences:', t), !1);
        }
    }
    isRenderingEngineReady() {
        return (
            this.renderingEngine &&
            this.renderingEngine.emissiveMaterialSystem &&
            this.renderingEngine.scene &&
            this.renderingEngine.renderer
        );
    }
    applyPendingPreferences() {
        return (
            !(!this.pendingPreferenceApplication || !this.isRenderingEngineReady()) &&
            (logger$9.info('Applying pending preferences to rendering engine'),
            this.applyState(this.currentState),
            (this.pendingPreferenceApplication = !1),
            !0)
        );
    }
    initializePreferences() {
        const e = this.loadSavedPreferences(!1);
        return (!e && this.isRenderingEngineReady() && this.applyState(this.currentState), e);
    }
    saveCurrentPreferences() {
        try {
            const e = {
                bikeColor: this.currentState.bikeColor,
                trailColor: this.currentState.trailColor,
                trailStyle: this.currentState.trailStyle,
                arenaTheme: this.currentState.arenaTheme,
            };
            this.preferenceStorage.savePreferences(e);
        } catch (e) {
            logger$9.error('Failed to save preferences:', e);
        }
    }
    resetToDefaults() {
        const e = {
            bikeColor: '#00FF00',
            trailColor: '#00FF00',
            trailStyle: 'solid',
            arenaTheme: 'classic-grid',
        };
        (this.previewMode
            ? (this.previewState = __spreadValues({}, e))
            : ((this.currentState = __spreadValues({}, e)), this.saveCurrentPreferences()),
            this.applyState(e));
    }
    getCurrentState() {
        return this.previewMode
            ? __spreadValues({}, this.previewState)
            : __spreadValues({}, this.currentState);
    }
    getSavedState() {
        try {
            const e = this.preferenceStorage.loadPreferences();
            if (e)
                return {
                    bikeColor: e.bikeColor || '#00FF00',
                    trailColor: e.trailColor || '#00FF00',
                    trailStyle: e.trailStyle || 'solid',
                    arenaTheme: e.arenaTheme || 'classic-grid',
                };
        } catch (e) {
            logger$9.warn('Failed to load saved preferences:', e);
        }
        return {
            bikeColor: '#00FF00',
            trailColor: '#00FF00',
            trailStyle: 'solid',
            arenaTheme: 'classic-grid',
        };
    }
    getColorPresets() {
        return __spreadValues({}, this.colorPresets);
    }
    getAvailableTrailStyles() {
        return Object.keys(this.trailStyles);
    }
    getAvailableThemes() {
        return (
            this.themeEngine || this.initializeThemeEngine(),
            this.themeEngine.getAvailableThemes()
        );
    }
    validateColor(e) {
        if ('string' != typeof e) return !1;
        return /^#[0-9A-Fa-f]{6}$/.test(e);
    }
    validateColorContrast(e, t = '#000033') {
        const i = this.calculateLuminance(e),
            r = this.calculateLuminance(t);
        return (Math.max(i, r) + 0.05) / (Math.min(i, r) + 0.05) >= 3;
    }
    calculateLuminance(e) {
        const t = e.replace('#', ''),
            i = [
                parseInt(t.substr(0, 2), 16) / 255,
                parseInt(t.substr(2, 2), 16) / 255,
                parseInt(t.substr(4, 2), 16) / 255,
            ].map((e) => (e <= 0.03928 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)));
        return 0.2126 * i[0] + 0.7152 * i[1] + 0.0722 * i[2];
    }
    applyState(e) {
        if (e.bikeColor && this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
            const t = parseInt(e.bikeColor.replace('#', ''), 16);
            if (this.performanceOptimizer) {
                const e = this.performanceOptimizer.getOrCreateBikeMaterial(t, {
                    emissive: t,
                    emissiveIntensity: 0.2,
                });
                this.renderingEngine.player &&
                    this.renderingEngine.player.material &&
                    (this.renderingEngine.player.material = e);
            } else
                this.renderingEngine.emissiveMaterialSystem &&
                    'function' ==
                        typeof this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial &&
                    this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial('player', t);
        }
        if (e.trailColor && this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
            const t = parseInt(e.trailColor.replace('#', ''), 16);
            this.updateExistingTrailMaterials('player', t);
        }
        (e.trailStyle && this.applyTrailStyle('player', e.trailStyle),
            e.arenaTheme &&
                (this.themeEngine || this.initializeThemeEngine(),
                this.themeEngine.loadTheme(e.arenaTheme)),
            this.performanceOptimizer &&
                this.renderingEngine.camera &&
                this.performanceOptimizer.optimizeScene(this.renderingEngine.camera.position));
    }
    applyTrailStyle(e, t) {
        this.trailStyles[t] &&
            this.renderingEngine &&
            this.renderingEngine.trailStyleRenderer &&
            this.renderingEngine.trailStyleRenderer.setTrailStyle(e, t);
    }
    updateExistingTrailMaterials(e, t) {
        this.renderingEngine &&
            this.renderingEngine.emissiveMaterialSystem &&
            this.renderingEngine.emissiveMaterialSystem.updateTrailMaterialTemplate(e, t);
    }
    initializeThemeEngine() {
        if (!this.themeEngine)
            try {
                const { ThemeEngine: e } = __CJS__export_default__$W || __CJS__import__2__$3;
                this.themeEngine = new e(this.renderingEngine.scene, this.renderingEngine.renderer);
            } catch (e) {
                (logger$9.error('Failed to initialize ThemeEngine:', e),
                    (this.themeEngine = this.createMinimalThemeEngine()));
            }
    }
    createMinimalThemeEngine() {
        return {
            isValidTheme: (e) => 'classic-grid' === e,
            loadTheme: (e) => {
                logger$9.info('Loading theme:', e);
            },
            getAvailableThemes: () => ['classic-grid'],
        };
    }
    getPerformanceMetrics() {
        return this.performanceOptimizer ? this.performanceOptimizer.getPerformanceMetrics() : null;
    }
    isPerformanceAcceptable() {
        return !this.performanceOptimizer || this.performanceOptimizer.isPerformanceAcceptable();
    }
    optimizePerformance() {
        this.performanceOptimizer &&
            this.renderingEngine.camera &&
            this.performanceOptimizer.optimizeScene(this.renderingEngine.camera.position);
    }
    cleanup() {
        this.performanceOptimizer && this.performanceOptimizer.cleanup();
    }
};
module$t.exports = { CustomizationManager: CustomizationManager$2 };
const __CJS__export_default__$s =
        (null == module$t.exports ? {} : module$t.exports).default || module$t.exports,
    __CJS__import__27__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$s },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$s = { exports: {} };
const { logger: logger$8 } = __CJS__export_default__$1a || __CJS__import__50__;
class ColorPickerUI {
    constructor() {
        ((this.currentColor = '#00FF00'),
            (this.onColorChange = null),
            (this.previewMode = !1),
            (this.presetColors = {
                red: '#FF0000',
                blue: '#0000FF',
                green: '#00FF00',
                yellow: '#FFFF00',
                purple: '#800080',
                orange: '#FFA500',
                cyan: '#00FFFF',
                white: '#FFFFFF',
            }),
            (this.element = null),
            (this.hexInput = null),
            (this.presetButtons = []),
            (this.previewElement = null));
    }
    createElement(e = 'Color Selection') {
        const t = document.createElement('div');
        t.className = 'color-picker-container';
        const i = document.createElement('h4');
        ((i.textContent = e), (i.className = 'color-picker-title'), t.appendChild(i));
        const r = document.createElement('div');
        r.className = 'color-presets';
        const n = document.createElement('div');
        ((n.textContent = 'Preset Colors:'),
            (n.className = 'color-presets-label'),
            r.appendChild(n));
        const s = document.createElement('div');
        ((s.className = 'color-presets-grid'),
            Object.entries(this.presetColors).forEach(([e, t]) => {
                const i = document.createElement('button');
                ((i.className = 'color-preset-btn'),
                    (i.style.backgroundColor = t),
                    (i.title = `${e.charAt(0).toUpperCase() + e.slice(1)} (${t})`),
                    i.setAttribute('data-color', t));
                const r = document.createElement('span');
                ((r.textContent = e.charAt(0).toUpperCase() + e.slice(1)),
                    (r.className = 'color-preset-label'),
                    i.appendChild(r),
                    i.addEventListener('click', () => {
                        this.setColor(t);
                    }),
                    this.presetButtons.push(i),
                    s.appendChild(i));
            }),
            r.appendChild(s),
            t.appendChild(r));
        const a = document.createElement('div');
        a.className = 'color-custom';
        const o = document.createElement('div');
        ((o.textContent = 'Custom Color:'), (o.className = 'color-custom-label'), a.appendChild(o));
        const l = document.createElement('div');
        ((l.className = 'color-input-container'),
            (this.hexInput = document.createElement('input')),
            (this.hexInput.type = 'text'),
            (this.hexInput.className = 'color-hex-input'),
            (this.hexInput.placeholder = '#00FF00'),
            (this.hexInput.value = this.currentColor),
            (this.hexInput.maxLength = 7),
            this.hexInput.addEventListener('input', (e) => {
                const t = e.target.value;
                this.validateColorFormat(t) && this.setColor(t);
            }),
            this.hexInput.addEventListener('blur', (e) => {
                const t = e.target;
                this.validateColorFormat(t.value) || (t.value = this.currentColor);
            }),
            l.appendChild(this.hexInput),
            (this.previewElement = document.createElement('div')),
            (this.previewElement.className = 'color-preview'),
            (this.previewElement.style.backgroundColor = this.currentColor),
            l.appendChild(this.previewElement),
            a.appendChild(l),
            t.appendChild(a));
        const c = document.createElement('div');
        c.className = 'color-live-preview';
        const d = document.createElement('div');
        ((d.textContent = 'Preview:'), (d.className = 'color-preview-label'), c.appendChild(d));
        const h = document.createElement('div');
        return (
            (h.className = 'color-preview-display'),
            (h.textContent = 'Color will be applied in real-time'),
            c.appendChild(h),
            t.appendChild(c),
            (this.element = t),
            t
        );
    }
    setColor(e) {
        /^#[0-9A-F]{6}$/i.test(e)
            ? ((this.currentColor = e),
              this.hexInput && (this.hexInput.value = e),
              this.previewElement && (this.previewElement.style.backgroundColor = e),
              this.updatePresetSelection(e),
              this.onColorChange && this.onColorChange(e))
            : logger$8.warn('Invalid color format:', e);
    }
    getColor() {
        return this.currentColor;
    }
    setOnColorChange(e) {
        this.onColorChange = e;
    }
    validateColorFormat(e) {
        if ('string' != typeof e) return !1;
        return /^#[0-9A-Fa-f]{6}$/.test(e);
    }
    validateColorContrast(e, t = '#000033') {
        const i = this.calculateLuminance(e),
            r = this.calculateLuminance(t);
        return (Math.max(i, r) + 0.05) / (Math.min(i, r) + 0.05) >= 3;
    }
    calculateLuminance(e) {
        const t = e.replace('#', ''),
            i = [
                parseInt(t.substr(0, 2), 16) / 255,
                parseInt(t.substr(2, 2), 16) / 255,
                parseInt(t.substr(4, 2), 16) / 255,
            ].map((e) => (e <= 0.03928 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)));
        return 0.2126 * i[0] + 0.7152 * i[1] + 0.0722 * i[2];
    }
    updatePresetSelection(e) {
        this.presetButtons.forEach((t) => {
            t.getAttribute('data-color') === e
                ? t.classList.add('selected')
                : t.classList.remove('selected');
        });
    }
    showContrastWarning(e) {
        if (this.validateColorContrast(e)) {
            const e = this.element.querySelector('.contrast-warning');
            e && (e.style.display = 'none');
        } else {
            let e = this.element.querySelector('.contrast-warning');
            (e ||
                ((e = document.createElement('div')),
                (e.className = 'contrast-warning'),
                (e.innerHTML =
                    '⚠️ This color may be difficult to see against the arena background'),
                this.element.appendChild(e)),
                (e.style.display = 'block'));
        }
    }
    setEnabled(e) {
        if (!this.element) return;
        (this.element.querySelectorAll('input, button').forEach((t) => {
            t.disabled = !e;
        }),
            e ? this.element.classList.remove('disabled') : this.element.classList.add('disabled'));
    }
    destroy() {
        (this.element &&
            this.element.parentNode &&
            this.element.parentNode.removeChild(this.element),
            (this.element = null),
            (this.hexInput = null),
            (this.presetButtons = []),
            (this.previewElement = null),
            (this.onColorChange = null));
    }
}
module$s.exports = { ColorPickerUI: ColorPickerUI };
const __CJS__export_default__$r =
        (null == module$s.exports ? {} : module$s.exports).default || module$s.exports,
    __CJS__import__2__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$r },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$r = { exports: {} };
const { logger: logger$7 } = __CJS__export_default__$1a || __CJS__import__50__;
let CustomizationUI$2 = class {
    constructor(e) {
        ((this.customizationManager = e),
            (this.isVisible = !1),
            (this.previewMode = !1),
            (this.panel = null),
            (this.bikeColorPicker = null),
            (this.trailColorPicker = null),
            (this.trailStyleSelector = null),
            (this.themeSelector = null),
            (this.toggleButton = null),
            this.createToggleButton(),
            this.createPanel(),
            this.setupEventListeners());
    }
    createToggleButton() {
        ((this.toggleButton = document.createElement('div')),
            (this.toggleButton.id = 'customizationButton'),
            (this.toggleButton.title = 'Customization Settings'),
            (this.toggleButton.innerHTML = '🎨'),
            (this.toggleButton.style.cssText =
                '\n            position: absolute;\n            top: 420px;\n            left: 20px;\n            width: 60px;\n            height: 60px;\n            background-color: rgba(255, 255, 255, 0.2);\n            border: 2px solid white;\n            color: white;\n            font-size: 1.5em;\n            cursor: pointer;\n            border-radius: 50%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            transition: background-color 0.3s;\n            z-index: 100;\n            min-width: 44px;\n            min-height: 44px;\n        '),
            this.toggleButton.addEventListener('mouseenter', () => {
                this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            }),
            this.toggleButton.addEventListener('mouseleave', () => {
                this.isVisible ||
                    (this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)');
            }),
            this.toggleButton.addEventListener('click', () => {
                this.toggle();
            }),
            document.body.appendChild(this.toggleButton),
            this.addPauseMenuIntegration());
    }
    addPauseMenuIntegration() {
        setTimeout(() => {
            if (document.getElementById('pauseOverlay')) {
                const e = document.createElement('div');
                ((e.id = 'pauseCustomizationButton'),
                    (e.innerHTML = '🎨 Customize'),
                    (e.style.cssText =
                        '\n                    color: white;\n                    font-size: 1.5em;\n                    background-color: rgba(255, 255, 255, 0.2);\n                    border: 2px solid white;\n                    padding: 15px 30px;\n                    cursor: pointer;\n                    border-radius: 5px;\n                    transition: background-color 0.3s;\n                    margin-top: 20px;\n                    min-width: 44px;\n                    min-height: 44px;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                '),
                    e.addEventListener('mouseenter', () => {
                        e.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                    }),
                    e.addEventListener('mouseleave', () => {
                        e.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }),
                    e.addEventListener('click', () => {
                        this.show();
                    }));
                const t = document.getElementById('resumeButton');
                t && t.parentNode && t.parentNode.insertBefore(e, t.nextSibling);
            }
        }, 100);
    }
    createPanel() {
        ((this.panel = document.createElement('div')),
            (this.panel.id = 'customizationPanel'),
            (this.panel.style.cssText =
                '\n            position: absolute;\n            top: 20px;\n            left: 100px;\n            background-color: rgba(0, 0, 0, 0.9);\n            border: 2px solid white;\n            border-radius: 10px;\n            padding: 20px;\n            color: white;\n            font-family: Arial, sans-serif;\n            z-index: 200;\n            min-width: 350px;\n            max-width: 450px;\n            display: none;\n            max-height: 80vh;\n            overflow-y: auto;\n        '));
        const e = document.createElement('div');
        ((e.className = 'customization-header'),
            (e.innerHTML =
                '\n            <h3 style="margin: 0 0 5px 0; font-size: 1.4em; text-align: center; color: white; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);">\n                Customization\n            </h3>\n            <p style="margin: 0 0 20px 0; font-size: 0.9em; text-align: center; color: #cccccc; opacity: 0.8;">\n                Personalize your LightBikes experience\n            </p>\n        '),
            this.panel.appendChild(e),
            this.createBikeCustomizationSection(),
            this.createTrailCustomizationSection(),
            this.createThemeSection(),
            this.createControlButtons(),
            document.body.appendChild(this.panel));
    }
    createBikeCustomizationSection() {
        const e = document.createElement('div');
        e.className = 'settings-section';
        const t = document.createElement('div');
        ((t.className = 'section-header'),
            (t.innerHTML =
                '\n            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">\n                🏍️ Bike Customization\n            </h4>\n            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">\n                Customize your bike\'s appearance and make it uniquely yours\n            </p>\n        '),
            e.appendChild(t));
        const { ColorPickerUI: i } = __CJS__export_default__$r || __CJS__import__2__;
        this.bikeColorPicker = new i();
        const r = this.bikeColorPicker.createElement('Bike Color');
        e.appendChild(r);
        const n = this.customizationManager.getCurrentState();
        (this.bikeColorPicker.setColor(n.bikeColor),
            this.bikeColorPicker.setOnColorChange((e) => {
                (this.customizationManager.setBikeColor('player', e),
                    this.bikeColorPicker.showContrastWarning(e),
                    this.refreshPreview());
            }),
            this.panel.appendChild(e));
    }
    createTrailCustomizationSection() {
        const e = document.createElement('div');
        e.className = 'settings-section';
        const t = document.createElement('div');
        ((t.className = 'section-header'),
            (t.innerHTML =
                '\n            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">\n                ✨ Trail Customization\n            </h4>\n            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">\n                Choose colors and visual effects for your trail\n            </p>\n        '),
            e.appendChild(t));
        const { ColorPickerUI: i } = __CJS__export_default__$r || __CJS__import__2__;
        this.trailColorPicker = new i();
        const r = this.trailColorPicker.createElement('Trail Color');
        e.appendChild(r);
        const n = this.customizationManager.getCurrentState();
        (this.trailColorPicker.setColor(n.trailColor),
            this.trailColorPicker.setOnColorChange((e) => {
                (this.customizationManager.setTrailColor('player', e),
                    this.trailColorPicker.showContrastWarning(e),
                    this.refreshPreview());
            }),
            this.createTrailStyleSelector(e),
            this.panel.appendChild(e));
    }
    createTrailStyleSelector(e) {
        const t = document.createElement('div');
        t.className = 'color-picker-container';
        const i = document.createElement('h4');
        ((i.textContent = 'Trail Style'), (i.className = 'color-picker-title'), t.appendChild(i));
        const r = document.createElement('div');
        ((r.className = 'trail-styles-grid'),
            (r.style.cssText =
                '\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 8px;\n        '));
        const n = this.customizationManager.getAvailableTrailStyles(),
            s = this.customizationManager.getCurrentState();
        (n.forEach((e) => {
            const t = document.createElement('button');
            ((t.className = 'trail-style-btn'),
                t.setAttribute('data-style', e),
                e === s.trailStyle && t.classList.add('active'));
            const i = document.createElement('div');
            ((i.className = 'style-name'),
                (i.textContent = e.charAt(0).toUpperCase() + e.slice(1)),
                t.appendChild(i));
            const n = document.createElement('div');
            switch (((n.className = 'style-desc'), e)) {
                case 'solid':
                    n.textContent = 'Continuous opaque trail';
                    break;
                case 'dashed':
                    n.textContent = 'Alternating segments';
                    break;
                case 'glowing':
                    n.textContent = 'Enhanced emissive effects';
                    break;
                case 'rainbow':
                    n.textContent = 'Color cycling trail';
                    break;
                default:
                    n.textContent = 'Custom trail style';
            }
            (t.appendChild(n),
                t.addEventListener('click', () => {
                    (r.querySelectorAll('.trail-style-btn').forEach((e) => {
                        e.classList.remove('active');
                    }),
                        t.classList.add('active'),
                        this.customizationManager.setTrailStyle('player', e),
                        this.refreshPreview());
                }),
                r.appendChild(t));
        }),
            t.appendChild(r),
            e.appendChild(t));
    }
    createThemeSection() {
        const e = document.createElement('div');
        e.className = 'settings-section';
        const t = document.createElement('div');
        ((t.className = 'section-header'),
            (t.innerHTML =
                '\n            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">\n                🌌 Arena Themes\n            </h4>\n            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">\n                Transform your arena with different visual environments\n            </p>\n        '),
            e.appendChild(t));
        const i = document.createElement('div');
        ((i.className = 'themes-grid'),
            (i.style.cssText =
                '\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 8px;\n        '));
        const r = this.customizationManager.getAvailableThemes(),
            n = this.customizationManager.getCurrentState(),
            s = {
                'classic-grid': 'Current default styling',
                'neon-city': 'Cyberpunk visuals',
                space: 'Starfield background',
                'tron-legacy': 'Movie-inspired aesthetics',
            };
        (r.forEach((e) => {
            const t = document.createElement('button');
            ((t.className = 'theme-btn'),
                t.setAttribute('data-theme', e),
                e === n.arenaTheme && t.classList.add('active'));
            const r = document.createElement('div');
            ((r.className = 'theme-name'),
                (r.textContent = e
                    .split('-')
                    .map((e) => e.charAt(0).toUpperCase() + e.slice(1))
                    .join(' ')),
                t.appendChild(r));
            const a = document.createElement('div');
            ((a.className = 'theme-desc'),
                (a.textContent = s[e] || 'Custom theme'),
                t.appendChild(a),
                t.addEventListener('click', () => {
                    (i.querySelectorAll('.theme-btn').forEach((e) => {
                        e.classList.remove('active');
                    }),
                        t.classList.add('active'),
                        this.customizationManager.setArenaTheme(e),
                        this.refreshPreview());
                }),
                i.appendChild(t));
        }),
            e.appendChild(i),
            this.panel.appendChild(e));
    }
    createPreviewSection() {
        const e = document.createElement('div');
        e.className = 'settings-section preview-section';
        const t = document.createElement('div');
        ((t.className = 'section-header'),
            (t.innerHTML =
                '\n            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">\n                👁️ Live Preview\n            </h4>\n            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">\n                See how your customizations look in real-time\n            </p>\n        '),
            e.appendChild(t));
        const i = document.createElement('div');
        ((i.className = 'preview-container'),
            (i.style.cssText =
                '\n            background-color: rgba(0, 0, 0, 0.5);\n            border: 2px solid rgba(255, 255, 255, 0.3);\n            border-radius: 8px;\n            padding: 15px;\n            margin-bottom: 15px;\n            text-align: center;\n            min-height: 120px;\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n        '));
        const r = document.createElement('div');
        ((r.className = 'preview-status'),
            (r.innerHTML =
                '\n            <div style="font-size: 2em; margin-bottom: 10px;">🎨</div>\n            <div style="color: #cccccc; font-size: 0.9em; margin-bottom: 5px;">\n                Preview Mode: <span id="previewModeStatus" style="color: #ff6666;">Disabled</span>\n            </div>\n            <div style="color: #aaaaaa; font-size: 0.8em; line-height: 1.3;">\n                Enable preview mode to see changes applied in real-time to the game arena\n            </div>\n        '),
            i.appendChild(r));
        const n = document.createElement('div');
        ((n.className = 'customization-summary'),
            (n.style.cssText =
                '\n            margin-top: 15px;\n            padding: 10px;\n            background-color: rgba(255, 255, 255, 0.05);\n            border-radius: 5px;\n            font-size: 0.8em;\n            color: #cccccc;\n        '),
            this.updateCustomizationSummary(n),
            i.appendChild(n),
            e.appendChild(i));
        const s = document.createElement('div');
        s.style.cssText =
            '\n            display: flex;\n            gap: 10px;\n            margin-bottom: 10px;\n        ';
        const a = document.createElement('button');
        ((a.className = 'settings-btn preview-toggle-btn'),
            (a.textContent = 'Enable Preview'),
            (a.style.cssText =
                '\n            flex: 1;\n            background-color: rgba(0, 255, 0, 0.2);\n            border-color: #00ff00;\n        '),
            a.addEventListener('click', () => {
                this.togglePreviewMode();
            }),
            s.appendChild(a));
        const o = document.createElement('button');
        ((o.className = 'settings-btn'),
            (o.textContent = 'Refresh'),
            (o.title = 'Update preview with current settings'),
            o.addEventListener('click', () => {
                this.refreshPreview();
            }),
            s.appendChild(o),
            e.appendChild(s),
            this.panel.appendChild(e),
            (this.previewContainer = i),
            (this.customizationSummary = n),
            (this.previewToggleBtn = a));
    }
    updateCustomizationSummary(e) {
        const t = this.customizationManager.getCurrentState();
        e.innerHTML = `\n            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left;">\n                <div>\n                    <strong>Bike:</strong> \n                    <span style="display: inline-block; width: 12px; height: 12px; background-color: ${t.bikeColor}; border: 1px solid white; margin-left: 5px; vertical-align: middle;"></span>\n                    ${t.bikeColor}\n                </div>\n                <div>\n                    <strong>Trail:</strong> \n                    <span style="display: inline-block; width: 12px; height: 12px; background-color: ${t.trailColor}; border: 1px solid white; margin-left: 5px; vertical-align: middle;"></span>\n                    ${t.trailColor}\n                </div>\n                <div>\n                    <strong>Style:</strong> ${t.trailStyle.charAt(0).toUpperCase() + t.trailStyle.slice(1)}\n                </div>\n                <div>\n                    <strong>Theme:</strong> ${t.arenaTheme
            .split('-')
            .map((e) => e.charAt(0).toUpperCase() + e.slice(1))
            .join(' ')}\n                </div>\n            </div>\n        `;
    }
    refreshPreview() {
        (this.customizationSummary && this.updateCustomizationSummary(this.customizationSummary),
            this.showNotification('🔄 Preview refreshed', 'info'));
    }
    createControlButtons() {
        const e = document.createElement('div');
        ((e.style.cssText =
            '\n            border-top: 1px solid rgba(255, 255, 255, 0.2);\n            margin: 20px 0 15px 0;\n        '),
            this.panel.appendChild(e),
            this.createPreviewSection());
        const t = document.createElement('div');
        ((t.innerHTML =
            '\n            <h4 style="margin: 0 0 15px 0; font-size: 1.1em; color: #00ffff; text-align: center;">\n                🎮 Controls\n            </h4>\n        '),
            this.panel.appendChild(t));
        const i = document.createElement('div');
        ((i.className = 'primary-buttons'),
            (i.style.cssText =
                '\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 10px;\n            margin-bottom: 15px;\n        '));
        const r = document.createElement('button');
        ((r.className = 'settings-btn apply-btn'),
            (r.textContent = '✓ Apply Changes'),
            (r.title = 'Apply and save all customization changes'),
            (r.style.cssText =
                '\n            background-color: rgba(0, 255, 0, 0.3);\n            border-color: #00ff00;\n            font-weight: bold;\n        '),
            r.addEventListener('click', () => {
                this.applyChanges();
            }),
            i.appendChild(r));
        const n = document.createElement('button');
        ((n.className = 'settings-btn cancel-btn'),
            (n.textContent = '✗ Cancel Changes'),
            (n.title = 'Discard all changes and revert to saved settings'),
            (n.style.cssText =
                '\n            background-color: rgba(255, 102, 102, 0.3);\n            border-color: #ff6666;\n        '),
            n.addEventListener('click', () => {
                this.cancelChanges();
            }),
            i.appendChild(n),
            this.panel.appendChild(i));
        const s = document.createElement('div');
        ((s.className = 'secondary-buttons'),
            (s.style.cssText =
                '\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 10px;\n            margin-bottom: 10px;\n        '));
        const a = document.createElement('button');
        ((a.className = 'settings-btn preview-btn'),
            (a.textContent = 'Preview Mode'),
            (a.title = 'Toggle real-time preview of changes'),
            a.addEventListener('click', () => {
                this.togglePreviewMode();
            }),
            s.appendChild(a));
        const o = document.createElement('button');
        ((o.className = 'settings-btn reset-btn'),
            (o.textContent = 'Reset to Defaults'),
            (o.title = 'Reset all customizations to default values'),
            o.addEventListener('click', () => {
                this.showResetConfirmation();
            }),
            s.appendChild(o),
            this.panel.appendChild(s));
        const l = document.createElement('div');
        l.style.cssText =
            '\n            display: flex;\n            gap: 10px;\n            margin-top: 10px;\n        ';
        const c = document.createElement('button');
        ((c.className = 'settings-btn close-btn'),
            (c.textContent = 'Close Menu'),
            (c.style.cssText =
                '\n            flex: 1;\n            background-color: rgba(255, 255, 255, 0.2);\n            border-color: rgba(255, 255, 255, 0.5);\n        '),
            c.addEventListener('click', () => {
                this.handleMenuClose();
            }),
            l.appendChild(c),
            this.panel.appendChild(l),
            (this.applyButton = r),
            (this.cancelButton = n),
            (this.previewButton = a),
            (this.closeButton = c));
    }
    setupEventListeners() {
        (document.addEventListener('click', (e) => {
            const t = e.target;
            !this.isVisible ||
                this.panel.contains(t) ||
                this.toggleButton.contains(t) ||
                this.hide();
        }),
            document.addEventListener('keydown', (e) => {
                'Escape' === e.key && this.isVisible && this.hide();
            }));
    }
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    show() {
        ((this.panel.style.display = 'block'),
            (this.isVisible = !0),
            (this.toggleButton.style.backgroundColor = 'rgba(255, 192, 203, 0.3)'),
            (this.toggleButton.style.borderColor = '#ffc0cb'),
            this.updateUIFromState());
    }
    hide() {
        ((this.panel.style.display = 'none'),
            (this.isVisible = !1),
            (this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'),
            (this.toggleButton.style.borderColor = 'white'),
            this.previewMode &&
                (this.customizationManager.applyPreviewChanges(),
                (this.previewMode = !1),
                this.updatePreviewModeUI()));
    }
    togglePreviewMode() {
        (this.previewMode
            ? (this.customizationManager.applyPreviewChanges(), (this.previewMode = !1))
            : (this.customizationManager.enablePreviewMode(), (this.previewMode = !0)),
            this.updatePreviewModeUI(),
            this.refreshPreview());
    }
    updatePreviewModeUI() {
        (this.previewButton &&
            (this.previewMode
                ? ((this.previewButton.textContent = 'Exit Preview'),
                  (this.previewButton.style.backgroundColor = 'rgba(255, 102, 102, 0.3)'),
                  (this.previewButton.style.borderColor = '#ff6666'))
                : ((this.previewButton.textContent = 'Preview Mode'),
                  (this.previewButton.style.backgroundColor = ''),
                  (this.previewButton.style.borderColor = ''))),
            this.previewToggleBtn &&
                (this.previewMode
                    ? ((this.previewToggleBtn.textContent = 'Disable Preview'),
                      (this.previewToggleBtn.style.backgroundColor = 'rgba(255, 102, 102, 0.3)'),
                      (this.previewToggleBtn.style.borderColor = '#ff6666'))
                    : ((this.previewToggleBtn.textContent = 'Enable Preview'),
                      (this.previewToggleBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.2)'),
                      (this.previewToggleBtn.style.borderColor = '#00ff00'))));
        const e = document.getElementById('previewModeStatus');
        (e &&
            (this.previewMode
                ? ((e.textContent = 'Enabled'), (e.style.color = '#00ff00'))
                : ((e.textContent = 'Disabled'), (e.style.color = '#ff6666'))),
            this.previewContainer &&
                (this.previewMode
                    ? ((this.previewContainer.style.borderColor = 'rgba(0, 255, 0, 0.6)'),
                      (this.previewContainer.style.backgroundColor = 'rgba(0, 255, 0, 0.05)'))
                    : ((this.previewContainer.style.borderColor = 'rgba(255, 255, 255, 0.3)'),
                      (this.previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'))),
            this.applyButton &&
                this.cancelButton &&
                (this.previewMode
                    ? ((this.applyButton.textContent = '✓ Apply Preview'),
                      (this.cancelButton.textContent = '✗ Cancel Preview'))
                    : ((this.applyButton.textContent = '✓ Apply Changes'),
                      (this.cancelButton.textContent = '✗ Cancel Changes'))));
    }
    showResetConfirmation() {
        const e = document.createElement('div');
        ((e.className = 'reset-confirmation-overlay'),
            (e.style.cssText =
                '\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            background-color: rgba(0, 0, 0, 0.8);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            z-index: 300;\n        '));
        const t = document.createElement('div');
        ((t.style.cssText =
            '\n            background-color: rgba(0, 0, 0, 0.95);\n            border: 2px solid #ff6666;\n            border-radius: 10px;\n            padding: 30px;\n            color: white;\n            font-family: Arial, sans-serif;\n            text-align: center;\n            max-width: 400px;\n            margin: 20px;\n        '),
            (t.innerHTML =
                '\n            <h3 style="margin: 0 0 15px 0; color: #ff6666; font-size: 1.3em;">\n                ⚠️ Reset to Defaults\n            </h3>\n            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">\n                This will reset all your customizations including bike colors, trail styles, and arena themes back to their default values.\n            </p>\n            <p style="margin: 0 0 25px 0; color: #ffaaaa; font-size: 0.9em;">\n                This action cannot be undone.\n            </p>\n            <div style="display: flex; gap: 15px; justify-content: center;">\n                <button class="confirm-reset-btn" style="\n                    background-color: rgba(255, 102, 102, 0.3);\n                    border: 2px solid #ff6666;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    Reset All\n                </button>\n                <button class="cancel-reset-btn" style="\n                    background-color: rgba(255, 255, 255, 0.2);\n                    border: 2px solid white;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    Cancel\n                </button>\n            </div>\n        '),
            e.appendChild(t),
            document.body.appendChild(e));
        const i = t.querySelector('.confirm-reset-btn'),
            r = t.querySelector('.cancel-reset-btn');
        (i.addEventListener('mouseenter', () => {
            i.style.backgroundColor = 'rgba(255, 102, 102, 0.5)';
        }),
            i.addEventListener('mouseleave', () => {
                i.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
            }),
            r.addEventListener('mouseenter', () => {
                r.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            }),
            r.addEventListener('mouseleave', () => {
                r.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }),
            i.addEventListener('click', () => {
                (this.resetToDefaults(), document.body.removeChild(e));
            }),
            r.addEventListener('click', () => {
                document.body.removeChild(e);
            }),
            e.addEventListener('click', (t) => {
                t.target === e && document.body.removeChild(e);
            }));
        const n = (t) => {
            'Escape' === t.key &&
                (document.body.removeChild(e), document.removeEventListener('keydown', n));
        };
        document.addEventListener('keydown', n);
    }
    resetToDefaults() {
        try {
            (this.customizationManager.resetToDefaults(),
                this.updateUIFromState(),
                this.showNotification('✅ All customizations reset to defaults', 'success'));
        } catch (e) {
            (logger$7.error('Failed to reset customizations:', e),
                this.showNotification('❌ Failed to reset customizations', 'error'));
        }
    }
    applyChanges() {
        try {
            (this.previewMode &&
                (this.customizationManager.applyPreviewChanges(),
                (this.previewMode = !1),
                this.updatePreviewModeUI()),
                this.customizationManager.saveCurrentPreferences(),
                this.showNotification('✅ Customizations applied and saved!', 'success'),
                setTimeout(() => {
                    this.hide();
                }, 1500));
        } catch (e) {
            (logger$7.error('Failed to apply customizations:', e),
                this.showNotification('❌ Failed to apply customizations', 'error'));
        }
    }
    cancelChanges() {
        this.showCancelConfirmation();
    }
    showCancelConfirmation() {
        const e = document.createElement('div');
        ((e.className = 'cancel-confirmation-overlay'),
            (e.style.cssText =
                '\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            background-color: rgba(0, 0, 0, 0.8);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            z-index: 300;\n        '));
        const t = document.createElement('div');
        ((t.style.cssText =
            '\n            background-color: rgba(0, 0, 0, 0.95);\n            border: 2px solid #ff6666;\n            border-radius: 10px;\n            padding: 30px;\n            color: white;\n            font-family: Arial, sans-serif;\n            text-align: center;\n            max-width: 400px;\n            margin: 20px;\n        '),
            (t.innerHTML =
                '\n            <h3 style="margin: 0 0 15px 0; color: #ff6666; font-size: 1.3em;">\n                ⚠️ Cancel Changes\n            </h3>\n            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">\n                This will discard all unsaved customization changes and revert to your previously saved settings.\n            </p>\n            <p style="margin: 0 0 25px 0; color: #ffaaaa; font-size: 0.9em;">\n                Any changes you made will be lost.\n            </p>\n            <div style="display: flex; gap: 15px; justify-content: center;">\n                <button class="confirm-cancel-btn" style="\n                    background-color: rgba(255, 102, 102, 0.3);\n                    border: 2px solid #ff6666;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    Discard Changes\n                </button>\n                <button class="keep-changes-btn" style="\n                    background-color: rgba(255, 255, 255, 0.2);\n                    border: 2px solid white;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    Keep Editing\n                </button>\n            </div>\n        '),
            e.appendChild(t),
            document.body.appendChild(e));
        const i = t.querySelector('.confirm-cancel-btn'),
            r = t.querySelector('.keep-changes-btn');
        (i.addEventListener('mouseenter', () => {
            i.style.backgroundColor = 'rgba(255, 102, 102, 0.5)';
        }),
            i.addEventListener('mouseleave', () => {
                i.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
            }),
            r.addEventListener('mouseenter', () => {
                r.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            }),
            r.addEventListener('mouseleave', () => {
                r.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }),
            i.addEventListener('click', () => {
                (this.performCancelChanges(), document.body.removeChild(e));
            }),
            r.addEventListener('click', () => {
                document.body.removeChild(e);
            }),
            e.addEventListener('click', (t) => {
                t.target === e && document.body.removeChild(e);
            }));
        const n = (t) => {
            'Escape' === t.key &&
                (document.body.removeChild(e), document.removeEventListener('keydown', n));
        };
        document.addEventListener('keydown', n);
    }
    performCancelChanges() {
        try {
            (this.previewMode &&
                (this.customizationManager.cancelPreviewChanges(),
                (this.previewMode = !1),
                this.updatePreviewModeUI()),
                this.customizationManager.loadSavedPreferences(),
                this.updateUIFromState(),
                this.showNotification('↶ Changes cancelled, reverted to saved settings', 'info'));
        } catch (e) {
            (logger$7.error('Failed to cancel customizations:', e),
                this.showNotification('❌ Failed to cancel changes', 'error'));
        }
    }
    handleMenuClose() {
        this.hasUnsavedChanges() ? this.showUnsavedChangesDialog() : this.hide();
    }
    hasUnsavedChanges() {
        try {
            const e = this.customizationManager.getCurrentState(),
                t = this.customizationManager.getSavedState();
            return (
                e.bikeColor !== t.bikeColor ||
                e.trailColor !== t.trailColor ||
                e.trailStyle !== t.trailStyle ||
                e.arenaTheme !== t.arenaTheme
            );
        } catch (e) {
            return (logger$7.warn('Could not check for unsaved changes:', e), !1);
        }
    }
    showUnsavedChangesDialog() {
        const e = document.createElement('div');
        ((e.className = 'unsaved-changes-overlay'),
            (e.style.cssText =
                '\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            background-color: rgba(0, 0, 0, 0.8);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            z-index: 300;\n        '));
        const t = document.createElement('div');
        ((t.style.cssText =
            '\n            background-color: rgba(0, 0, 0, 0.95);\n            border: 2px solid #ffaa00;\n            border-radius: 10px;\n            padding: 30px;\n            color: white;\n            font-family: Arial, sans-serif;\n            text-align: center;\n            max-width: 400px;\n            margin: 20px;\n        '),
            (t.innerHTML =
                '\n            <h3 style="margin: 0 0 15px 0; color: #ffaa00; font-size: 1.3em;">\n                💾 Unsaved Changes\n            </h3>\n            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">\n                You have unsaved customization changes. What would you like to do?\n            </p>\n            <div style="display: flex; flex-direction: column; gap: 10px;">\n                <button class="save-and-close-btn" style="\n                    background-color: rgba(0, 255, 0, 0.3);\n                    border: 2px solid #00ff00;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    💾 Save & Close\n                </button>\n                <button class="discard-and-close-btn" style="\n                    background-color: rgba(255, 102, 102, 0.3);\n                    border: 2px solid #ff6666;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    🗑️ Discard & Close\n                </button>\n                <button class="continue-editing-btn" style="\n                    background-color: rgba(255, 255, 255, 0.2);\n                    border: 2px solid white;\n                    color: white;\n                    padding: 12px 20px;\n                    border-radius: 5px;\n                    cursor: pointer;\n                    font-size: 1em;\n                    transition: background-color 0.3s;\n                ">\n                    ✏️ Continue Editing\n                </button>\n            </div>\n        '),
            e.appendChild(t),
            document.body.appendChild(e));
        const i = t.querySelector('.save-and-close-btn'),
            r = t.querySelector('.discard-and-close-btn'),
            n = t.querySelector('.continue-editing-btn');
        ([i, r, n].forEach((e) => {
            (e.addEventListener('mouseenter', () => {
                e.style.opacity = '0.8';
            }),
                e.addEventListener('mouseleave', () => {
                    e.style.opacity = '1';
                }));
        }),
            i.addEventListener('click', () => {
                (this.applyChanges(), document.body.removeChild(e));
            }),
            r.addEventListener('click', () => {
                (this.performCancelChanges(), this.hide(), document.body.removeChild(e));
            }),
            n.addEventListener('click', () => {
                document.body.removeChild(e);
            }),
            e.addEventListener('click', (t) => {
                t.target === e && document.body.removeChild(e);
            }));
        const s = (t) => {
            'Escape' === t.key &&
                (document.body.removeChild(e), document.removeEventListener('keydown', s));
        };
        document.addEventListener('keydown', s);
    }
    showNotification(e, t = 'info') {
        const i = document.createElement('div');
        i.className = 'customization-notification';
        const r =
                'success' === t
                    ? 'rgba(0, 255, 0, 0.2)'
                    : 'error' === t
                      ? 'rgba(255, 0, 0, 0.2)'
                      : 'rgba(0, 255, 255, 0.2)',
            n = 'success' === t ? '#00ff00' : 'error' === t ? '#ff0000' : '#00ffff';
        ((i.style.cssText = `\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background-color: ${r};\n            border: 2px solid ${n};\n            border-radius: 8px;\n            padding: 15px 25px;\n            color: white;\n            font-family: Arial, sans-serif;\n            font-size: 1.1em;\n            z-index: 400;\n            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);\n            animation: fadeInOut 3s ease-in-out;\n        `),
            (i.textContent = e),
            document.body.appendChild(i));
        const s = document.createElement('style');
        ((s.textContent =
            '\n            @keyframes fadeInOut {\n                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }\n                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }\n                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }\n                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }\n            }\n        '),
            document.head.appendChild(s),
            setTimeout(() => {
                (i.parentNode && document.body.removeChild(i),
                    s.parentNode && document.head.removeChild(s));
            }, 3e3));
    }
    updateUIFromState() {
        const e = this.customizationManager.getCurrentState();
        (this.bikeColorPicker && this.bikeColorPicker.setColor(e.bikeColor),
            this.trailColorPicker && this.trailColorPicker.setColor(e.trailColor));
        this.panel.querySelectorAll('.trail-style-btn').forEach((t) => {
            t.getAttribute('data-style') === e.trailStyle
                ? t.classList.add('active')
                : t.classList.remove('active');
        });
        (this.panel.querySelectorAll('.theme-btn').forEach((t) => {
            t.getAttribute('data-theme') === e.arenaTheme
                ? t.classList.add('active')
                : t.classList.remove('active');
        }),
            this.refreshPreview());
    }
    destroy() {
        (this.toggleButton &&
            this.toggleButton.parentNode &&
            this.toggleButton.parentNode.removeChild(this.toggleButton),
            this.panel && this.panel.parentNode && this.panel.parentNode.removeChild(this.panel),
            this.bikeColorPicker && this.bikeColorPicker.destroy(),
            this.trailColorPicker && this.trailColorPicker.destroy(),
            (this.toggleButton = null),
            (this.panel = null),
            (this.bikeColorPicker = null),
            (this.trailColorPicker = null));
    }
};
module$r.exports = { CustomizationUI: CustomizationUI$2 };
const __CJS__export_default__$q =
        (null == module$r.exports ? {} : module$r.exports).default || module$r.exports,
    __CJS__import__28__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$q },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$q = { exports: {} };
const { Logger: Logger$6 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$6 = new Logger$6('PreferenceStorage');
let PreferenceStorage$2 = class {
    constructor() {
        ((this.storageKey = 'lightbikes_customization_preferences'),
            (this.currentVersion = '1.0'),
            (this.sessionFallback = {}),
            (this.storageAvailable = this.isStorageAvailable()),
            this.storageAvailable ||
                logger$6.warn('localStorage not available, using session-only preferences'));
    }
    savePreferences(e) {
        if (!e || 'object' != typeof e)
            return (logger$6.error('Invalid preferences object provided'), !1);
        const t = {
            version: this.currentVersion,
            preferences: e,
            timestamp: new Date().toISOString(),
        };
        try {
            if (this.storageAvailable) {
                const e = JSON.stringify(t);
                return (localStorage.setItem(this.storageKey, e), !0);
            }
            return ((this.sessionFallback = t), !0);
        } catch (i) {
            return this.handleStorageError(i, 'save', t);
        }
    }
    loadPreferences() {
        try {
            let e = null;
            if (!this.storageAvailable)
                return this.sessionFallback && this.sessionFallback.preferences
                    ? this.sessionFallback
                    : null;
            if (((e = localStorage.getItem(this.storageKey)), !e)) return null;
            const t = JSON.parse(e);
            if (!this.validateStorageData(t))
                return (
                    logger$6.warn('Invalid preference data structure, resetting to defaults'),
                    this.clearPreferences(),
                    null
                );
            if (t.version !== this.currentVersion) {
                const e = this.migratePreferences(t);
                if (e) return (this.savePreferences(e.preferences), e);
            }
            return t;
        } catch (e) {
            return this.handleStorageError(e, 'load');
        }
    }
    clearPreferences() {
        try {
            return (
                this.storageAvailable
                    ? localStorage.removeItem(this.storageKey)
                    : (this.sessionFallback = {}),
                !0
            );
        } catch (e) {
            return this.handleStorageError(e, 'clear');
        }
    }
    isStorageAvailable() {
        try {
            const e = '__lightbikes_storage_test__',
                t = 'test';
            localStorage.setItem(e, t);
            const i = localStorage.getItem(e);
            return (localStorage.removeItem(e), i === t);
        } catch (e) {
            return !1;
        }
    }
    handleStorageError(e, t, i = null) {
        if ((logger$6.error(`Storage ${t} error:`, e), this.isQuotaExceededError(e)))
            return this.handleQuotaExceeded(t, i);
        if (!this.isStorageAvailable()) {
            if (
                ((this.storageAvailable = !1),
                logger$6.warn('localStorage became unavailable, switching to session-only mode'),
                'save' === t && i)
            )
                return ((this.sessionFallback = i), !0);
            if ('load' === t) return this.sessionFallback.preferences ? this.sessionFallback : null;
            if ('clear' === t) return ((this.sessionFallback = {}), !0);
        }
        return 'load' === t && e instanceof SyntaxError
            ? (logger$6.warn('Corrupted preference data detected, clearing and using defaults'),
              this.clearPreferences(),
              null)
            : 'save' !== t && 'load' === t && null;
    }
    handleQuotaExceeded(e, t) {
        if ((logger$6.warn('Storage quota exceeded, attempting cleanup'), 'save' === e))
            try {
                this.clearOldData();
                const e = JSON.stringify(t);
                return (localStorage.setItem(this.storageKey, e), !0);
            } catch (i) {
                return (
                    logger$6.error('Failed to save even after cleanup, using session fallback'),
                    (this.sessionFallback = t),
                    !0
                );
            }
        return !1;
    }
    clearOldData() {
        try {
            const e = [];
            for (let t = 0; t < localStorage.length; t++) e.push(localStorage.key(t));
            e.forEach((e) => {
                if (
                    e &&
                    e !== this.storageKey &&
                    (e.includes('game_') || e.includes('temp_') || e.includes('cache_'))
                )
                    try {
                        localStorage.removeItem(e);
                    } catch (t) {}
            });
        } catch (e) {
            logger$6.warn('Failed to clear old data:', e);
        }
    }
    isQuotaExceededError(e) {
        const t = e;
        return (
            e &&
            ('QuotaExceededError' === e.name ||
                'NS_ERROR_DOM_QUOTA_REACHED' === e.name ||
                22 === t.code ||
                1014 === t.code)
        );
    }
    validateStorageData(e) {
        if (!e || 'object' != typeof e) return !1;
        if (!e.version || !e.preferences || !e.timestamp) return !1;
        const t = e.preferences;
        return (
            'object' == typeof t &&
            (!t.bikeColor || 'string' == typeof t.bikeColor) &&
            (!t.trailColor || 'string' == typeof t.trailColor) &&
            (!t.trailStyle || 'string' == typeof t.trailStyle) &&
            (!t.arenaTheme || 'string' == typeof t.arenaTheme)
        );
    }
    migratePreferences(e) {
        try {
            if (!e) return null;
            if (!e.version) {
                const t = {
                    bikeColor: e.bikeColor || '#00FF00',
                    trailColor: e.trailColor || '#00FF00',
                    trailStyle: e.trailStyle || 'solid',
                    arenaTheme: e.arenaTheme || 'classic-grid',
                };
                return {
                    version: this.currentVersion,
                    preferences: t,
                    timestamp: new Date().toISOString(),
                };
            }
            return e;
        } catch (t) {
            return (logger$6.error('Failed to migrate preferences:', t), null);
        }
    }
    getStorageStats() {
        const e = {
            available: this.storageAvailable,
            usingFallback: !this.storageAvailable,
            hasData: !1,
            dataSize: 0,
            lastSaved: null,
        };
        try {
            if (this.storageAvailable) {
                const t = localStorage.getItem(this.storageKey);
                if (t) {
                    ((e.hasData = !0), (e.dataSize = t.length));
                    const i = JSON.parse(t);
                    e.lastSaved = i.timestamp;
                }
            } else
                ((e.hasData = Object.keys(this.sessionFallback).length > 0),
                    (e.dataSize = JSON.stringify(this.sessionFallback).length),
                    (e.lastSaved = this.sessionFallback.timestamp));
        } catch (t) {
            logger$6.warn('Failed to get storage stats:', t);
        }
        return e;
    }
    exportPreferences() {
        try {
            const e = this.loadPreferences();
            return e && e.preferences ? JSON.stringify(e.preferences, null, 2) : null;
        } catch (e) {
            return (logger$6.error('Failed to export preferences:', e), null);
        }
    }
    importPreferences(e) {
        try {
            const t = JSON.parse(e);
            if (!t || 'object' != typeof t) throw new Error('Invalid preferences format');
            return this.savePreferences(t);
        } catch (t) {
            return (logger$6.error('Failed to import preferences:', t), !1);
        }
    }
};
module$q.exports = { PreferenceStorage: PreferenceStorage$2 };
const __CJS__export_default__$p =
        (null == module$q.exports ? {} : module$q.exports).default || module$q.exports,
    __CJS__import__29__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$p },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$p = { exports: {} };
const { logger: logger$5 } = __CJS__export_default__$1a || __CJS__import__50__;
let MusicSettingsUI$2 = class {
    constructor(e) {
        ((this.audioManager = e),
            (this.isVisible = !1),
            (this.panel = null),
            (this.button = null),
            (this.trackButtons = []),
            (this.volumeSlider = null),
            (this.volumeValue = null),
            (this.statusValue = null),
            (this.currentTrackValue = null),
            (this.currentTrack = 'none'),
            (this.currentVolume = 70),
            this.initialize());
    }
    initialize() {
        try {
            if (
                ((this.panel = document.getElementById('musicSettingsPanel')),
                (this.button = document.getElementById('musicSettingsButton')),
                (this.volumeSlider = document.getElementById('musicVolumeSlider')),
                (this.volumeValue = document.getElementById('musicVolumeValue')),
                (this.statusValue = document.getElementById('musicStatusValue')),
                (this.currentTrackValue = document.getElementById('currentTrackValue')),
                !this.panel || !this.button)
            )
                return void logger$5.warn('Music settings UI elements not found');
            ((this.trackButtons = Array.from(document.querySelectorAll('.track-btn'))),
                this.setupEventListeners(),
                this.loadSettings(),
                this.updateUI(),
                logger$5.info('Music settings UI initialized successfully'));
        } catch (e) {
            logger$5.error('Failed to initialize music settings UI:', e);
        }
    }
    setupEventListeners() {
        (this.button.addEventListener('click', () => {
            this.toggle();
        }),
            this.trackButtons.forEach((e) => {
                e.addEventListener('click', () => {
                    const t = e.getAttribute('data-track');
                    this.selectTrack(t);
                });
            }),
            this.volumeSlider &&
                this.volumeSlider.addEventListener('input', (e) => {
                    const t = e.target,
                        i = parseInt(t.value);
                    this.setVolume(i);
                }));
        const e = document.getElementById('resetMusicSettings'),
            t = document.getElementById('closeMusicSettings');
        (e &&
            e.addEventListener('click', () => {
                this.resetSettings();
            }),
            t &&
                t.addEventListener('click', () => {
                    this.hide();
                }),
            document.addEventListener('click', (e) => {
                const t = e.target;
                !this.isVisible || this.panel.contains(t) || this.button.contains(t) || this.hide();
            }),
            document.addEventListener('keydown', (e) => {
                'Escape' === e.key && this.isVisible && this.hide();
            }));
    }
    loadSettings() {
        if (this.audioManager && this.audioManager.isMusicAvailable())
            try {
                const e = this.audioManager.getMusicSettings();
                e &&
                    ((this.currentTrack = e.getSelectedTrack()),
                    (this.currentVolume = Math.round(100 * e.getMusicVolume())));
            } catch (e) {
                logger$5.warn('Failed to load music settings:', e);
            }
    }
    updateUI() {
        if (
            (this.trackButtons.forEach((e) => {
                e.getAttribute('data-track') === this.currentTrack
                    ? e.classList.add('active')
                    : e.classList.remove('active');
            }),
            this.volumeSlider)
        ) {
            this.volumeSlider.value = this.currentVolume.toString();
        }
        (this.volumeValue && (this.volumeValue.textContent = `${this.currentVolume}%`),
            this.updateStatus(),
            this.updateCurrentTrackDisplay());
    }
    updateStatus() {
        if (!this.statusValue) return;
        let e = 'Stopped',
            t = 'stopped';
        if (this.audioManager && this.audioManager.isMusicAvailable()) {
            const i = this.audioManager.getMusicPlayer();
            if (i)
                if (i.isPlaying()) ((e = 'Playing'), (t = 'playing'));
                else if (i.isPaused()) ((e = 'Paused'), (t = 'paused'));
                else if (i.isFading()) {
                    ((e = 'in' === i.getFadeState().type ? 'Fading In' : 'Fading Out'),
                        (t = 'fading'));
                } else i.isDucked() && ((e = 'Ducked'), (t = 'ducked'));
        }
        ((this.statusValue.textContent = e),
            (this.statusValue.className = `music-status-value ${t}`));
    }
    updateCurrentTrackDisplay() {
        if (!this.currentTrackValue) return;
        const e =
            {
                none: 'No Music',
                'ambient-space': 'Ambient Space',
                'cyber-pulse': 'Cyber Pulse',
                'neon-rush': 'Neon Rush',
            }[this.currentTrack] || this.currentTrack;
        this.currentTrackValue.textContent = e;
    }
    selectTrack(e) {
        if (this.audioManager && this.audioManager.isMusicAvailable())
            try {
                this.audioManager.setMusicTrack(e)
                    ? ((this.currentTrack = e),
                      this.updateUI(),
                      this.showFeedback(`Track changed to: ${this.getTrackDisplayName(e)}`))
                    : this.showFeedback('Failed to change track', 'error');
            } catch (t) {
                (logger$5.error('Failed to select track:', t),
                    this.showFeedback('Error changing track', 'error'));
            }
        else logger$5.warn('Music system not available');
    }
    setVolume(e) {
        if (this.audioManager && this.audioManager.isMusicAvailable())
            try {
                const t = e / 100;
                this.audioManager.setMusicVolume(t) && ((this.currentVolume = e), this.updateUI());
            } catch (t) {
                logger$5.error('Failed to set volume:', t);
            }
    }
    resetSettings() {
        try {
            if (this.audioManager && this.audioManager.isMusicAvailable()) {
                const e = this.audioManager.getMusicSettings();
                e &&
                    (e.reset(),
                    this.loadSettings(),
                    this.updateUI(),
                    this.showFeedback('Settings reset to defaults'));
            }
        } catch (e) {
            (logger$5.error('Failed to reset settings:', e),
                this.showFeedback('Error resetting settings', 'error'));
        }
    }
    getTrackDisplayName(e) {
        return (
            {
                none: 'No Music',
                'ambient-space': 'Ambient Space',
                'cyber-pulse': 'Cyber Pulse',
                'neon-rush': 'Neon Rush',
            }[e] || e
        );
    }
    showFeedback(e, t = 'success') {
        let i = document.getElementById('music-feedback');
        (i ||
            ((i = document.createElement('div')),
            (i.id = 'music-feedback'),
            (i.className = 'music-feedback'),
            document.body.appendChild(i),
            this.addFeedbackStyles()),
            (i.textContent = e),
            (i.className = `music-feedback ${t}`),
            (i.style.display = 'block'),
            (i.style.opacity = '1'),
            setTimeout(() => {
                ((i.style.opacity = '0'),
                    setTimeout(() => {
                        i.style.display = 'none';
                    }, 300));
            }, 3e3));
    }
    addFeedbackStyles() {
        if (document.getElementById('music-feedback-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'music-feedback-styles'),
            (e.textContent =
                '\n            .music-feedback {\n                position: fixed;\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                background-color: rgba(0, 0, 0, 0.9);\n                color: white;\n                padding: 12px 20px;\n                border-radius: 5px;\n                font-family: Arial, sans-serif;\n                font-size: 14px;\n                z-index: 1000;\n                border: 2px solid #00ff00;\n                opacity: 0;\n                transition: opacity 0.3s ease;\n                max-width: 300px;\n                text-align: center;\n            }\n            \n            .music-feedback.error {\n                border-color: #ff4444;\n                color: #ff6666;\n            }\n            \n            .music-feedback.info {\n                border-color: #00ffff;\n                color: #66ffff;\n            }\n        '),
            document.head.appendChild(e));
    }
    show() {
        this.panel &&
            ((this.panel.style.display = 'block'),
            this.button.classList.add('active'),
            (this.isVisible = !0),
            this.loadSettings(),
            this.updateUI(),
            this.startStatusUpdates());
    }
    hide() {
        this.panel &&
            ((this.panel.style.display = 'none'),
            this.button.classList.remove('active'),
            (this.isVisible = !1),
            this.stopStatusUpdates());
    }
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    startStatusUpdates() {
        this.statusUpdateInterval ||
            (this.statusUpdateInterval = setInterval(() => {
                this.isVisible && this.updateStatus();
            }, 500));
    }
    stopStatusUpdates() {
        this.statusUpdateInterval &&
            (clearInterval(this.statusUpdateInterval), (this.statusUpdateInterval = null));
    }
    isOpen() {
        return this.isVisible;
    }
    getCurrentSettings() {
        return { track: this.currentTrack, volume: this.currentVolume };
    }
    cleanup() {
        this.stopStatusUpdates();
    }
};
module$p.exports = { MusicSettingsUI: MusicSettingsUI$2 };
const __CJS__export_default__$o =
        (null == module$p.exports ? {} : module$p.exports).default || module$p.exports,
    __CJS__import__30__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$o },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$o = { exports: {} };
let MultiplayerGameOverUI$1 = class {
    constructor() {
        ((this.gameOverElement = null), (this.isInitialized = !1), this.addStyles());
    }
    addStyles() {
        if (document.getElementById('multiplayerGameOverStyles')) return;
        const e = document.createElement('style');
        ((e.id = 'multiplayerGameOverStyles'),
            (e.textContent =
                "\n            .multiplayer-game-over-container {\n                position: fixed;\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                background: rgba(0, 0, 0, 0.95);\n                border: 3px solid #ffffff;\n                border-radius: 15px;\n                padding: 40px;\n                color: white;\n                font-family: 'Courier New', monospace;\n                text-align: center;\n                z-index: 1000;\n                min-width: 400px;\n                max-width: 600px;\n                box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);\n            }\n\n            .multiplayer-game-over-title {\n                font-size: 3em;\n                font-weight: bold;\n                margin-bottom: 30px;\n                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);\n            }\n\n            .multiplayer-game-over-title.player1-wins {\n                color: #00ff41;\n                text-shadow: 0 0 20px rgba(0, 255, 65, 0.8);\n            }\n\n            .multiplayer-game-over-title.player2-wins {\n                color: #00bfff;\n                text-shadow: 0 0 20px rgba(0, 191, 255, 0.8);\n            }\n\n            .multiplayer-game-over-title.tie {\n                color: #ffff00;\n                text-shadow: 0 0 20px rgba(255, 255, 0, 0.8);\n            }\n\n            .multiplayer-final-scores {\n                background: rgba(255, 255, 255, 0.1);\n                border: 2px solid rgba(255, 255, 255, 0.3);\n                border-radius: 10px;\n                padding: 20px;\n                margin: 20px 0;\n            }\n\n            .multiplayer-score-row {\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                padding: 10px 20px;\n                margin: 5px 0;\n                font-size: 1.5em;\n            }\n\n            .multiplayer-score-label {\n                color: #cccccc;\n            }\n\n            .multiplayer-score-value {\n                font-weight: bold;\n                font-size: 1.2em;\n            }\n\n            .multiplayer-score-value.player1 {\n                color: #00ff41;\n                text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);\n            }\n\n            .multiplayer-score-value.player2 {\n                color: #00bfff;\n                text-shadow: 0 0 10px rgba(0, 191, 255, 0.6);\n            }\n\n            .multiplayer-score-separator {\n                border-top: 1px solid rgba(255, 255, 255, 0.2);\n                margin: 15px 0;\n            }\n\n            .multiplayer-round-info {\n                color: #aaaaaa;\n                font-size: 1.1em;\n                margin: 15px 0;\n            }\n\n            .multiplayer-game-over-buttons {\n                display: flex;\n                gap: 15px;\n                justify-content: center;\n                margin-top: 30px;\n            }\n\n            .multiplayer-game-over-btn {\n                padding: 15px 30px;\n                font-size: 1.2em;\n                font-family: 'Courier New', monospace;\n                font-weight: bold;\n                border: 2px solid;\n                border-radius: 8px;\n                cursor: pointer;\n                transition: all 0.3s ease;\n                min-width: 150px;\n                text-transform: uppercase;\n            }\n\n            .multiplayer-game-over-btn.restart {\n                background: rgba(0, 255, 65, 0.2);\n                border-color: #00ff41;\n                color: #00ff41;\n            }\n\n            .multiplayer-game-over-btn.restart:hover {\n                background: rgba(0, 255, 65, 0.4);\n                box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);\n            }\n\n            .multiplayer-game-over-btn.reset {\n                background: rgba(255, 165, 0, 0.2);\n                border-color: #ffa500;\n                color: #ffa500;\n            }\n\n            .multiplayer-game-over-btn.reset:hover {\n                background: rgba(255, 165, 0, 0.4);\n                box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);\n            }\n\n            .multiplayer-game-over-btn.single-player {\n                background: rgba(0, 191, 255, 0.2);\n                border-color: #00bfff;\n                color: #00bfff;\n            }\n\n            .multiplayer-game-over-btn.single-player:hover {\n                background: rgba(0, 191, 255, 0.4);\n                box-shadow: 0 0 15px rgba(0, 191, 255, 0.5);\n            }\n\n            /* Mobile responsive styles */\n            @media (max-width: 768px) {\n                .multiplayer-game-over-container {\n                    min-width: 300px;\n                    padding: 30px 20px;\n                }\n\n                .multiplayer-game-over-title {\n                    font-size: 2em;\n                    margin-bottom: 20px;\n                }\n\n                .multiplayer-score-row {\n                    font-size: 1.2em;\n                    padding: 8px 15px;\n                }\n\n                .multiplayer-game-over-buttons {\n                    flex-direction: column;\n                    gap: 10px;\n                }\n\n                .multiplayer-game-over-btn {\n                    padding: 12px 20px;\n                    font-size: 1em;\n                    min-width: 120px;\n                }\n            }\n\n            /* Extra small screens */\n            @media (max-width: 480px) {\n                .multiplayer-game-over-container {\n                    min-width: 250px;\n                    padding: 20px 15px;\n                }\n\n                .multiplayer-game-over-title {\n                    font-size: 1.5em;\n                    margin-bottom: 15px;\n                }\n\n                .multiplayer-score-row {\n                    font-size: 1em;\n                    padding: 6px 10px;\n                }\n\n                .multiplayer-round-info {\n                    font-size: 0.9em;\n                }\n\n                .multiplayer-game-over-btn {\n                    padding: 10px 15px;\n                    font-size: 0.9em;\n                    min-width: 100px;\n                }\n            }\n\n            /* Reduced motion support */\n            @media (prefers-reduced-motion: reduce) {\n                .multiplayer-game-over-btn {\n                    transition: none;\n                }\n            }\n        "),
            document.head.appendChild(e),
            (this.isInitialized = !0));
    }
    show(e, t, i, r) {
        this.hide();
        const n = e.localScoring || {},
            s = n.player1Wins || 0,
            a = n.player2Wins || 0,
            o = n.totalRounds || 0;
        let l = 'tie',
            c = 'Tie Game!';
        (s > a
            ? ((l = 'player1-wins'), (c = 'Player 1 Wins!'))
            : a > s && ((l = 'player2-wins'), (c = 'Player 2 Wins!')),
            (this.gameOverElement = document.createElement('div')),
            (this.gameOverElement.className = 'multiplayer-game-over-container'),
            (this.gameOverElement.innerHTML = `\n            <div class="multiplayer-game-over-title ${l}">\n                ${c}\n            </div>\n            \n            <div class="multiplayer-final-scores">\n                <div class="multiplayer-score-row">\n                    <span class="multiplayer-score-label">Player 1</span>\n                    <span class="multiplayer-score-value player1">${s}</span>\n                </div>\n                <div class="multiplayer-score-separator"></div>\n                <div class="multiplayer-score-row">\n                    <span class="multiplayer-score-label">Player 2</span>\n                    <span class="multiplayer-score-value player2">${a}</span>\n                </div>\n            </div>\n            \n            <div class="multiplayer-round-info">\n                Total Rounds: ${o}\n            </div>\n            \n            <div class="multiplayer-game-over-buttons">\n                <button class="multiplayer-game-over-btn restart" id="multiplayerRestartBtn">\n                    Next Round\n                </button>\n                <button class="multiplayer-game-over-btn reset" id="multiplayerResetBtn">\n                    Reset Scores\n                </button>\n                <button class="multiplayer-game-over-btn single-player" id="multiplayerSinglePlayerBtn">\n                    Single Player\n                </button>\n            </div>\n        `),
            document.body.appendChild(this.gameOverElement));
        const d = document.getElementById('multiplayerRestartBtn'),
            h = document.getElementById('multiplayerResetBtn'),
            u = document.getElementById('multiplayerSinglePlayerBtn');
        (d &&
            t &&
            d.addEventListener('click', () => {
                (this.hide(), t());
            }),
            h &&
                i &&
                h.addEventListener('click', () => {
                    (this.hide(), i());
                }),
            u &&
                r &&
                u.addEventListener('click', () => {
                    (this.hide(), r());
                }));
    }
    hide() {
        this.gameOverElement &&
            this.gameOverElement.parentNode &&
            (this.gameOverElement.parentNode.removeChild(this.gameOverElement),
            (this.gameOverElement = null));
    }
    isVisible() {
        return null !== this.gameOverElement && null !== this.gameOverElement.parentNode;
    }
    destroy() {
        this.hide();
        const e = document.getElementById('multiplayerGameOverStyles');
        (e && e.parentNode && e.parentNode.removeChild(e), (this.isInitialized = !1));
    }
};
module$o.exports = { MultiplayerGameOverUI: MultiplayerGameOverUI$1 };
const __CJS__export_default__$n =
        (null == module$o.exports ? {} : module$o.exports).default || module$o.exports,
    __CJS__import__31__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$n },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$n = { exports: {} };
let LocalScoringUI$1 = class {
    constructor(e) {
        ((this.localScoring = e),
            (this.scoreElements = {}),
            (this.isInitialized = !1),
            this.createScoreElements());
    }
    createScoreElements() {
        ((this.scoreElements.player1Score = document.createElement('div')),
            (this.scoreElements.player1Score.id = 'player1Score'),
            (this.scoreElements.player1Score.className = 'local-score-display player1-score'),
            document.body.appendChild(this.scoreElements.player1Score),
            (this.scoreElements.player2Score = document.createElement('div')),
            (this.scoreElements.player2Score.id = 'player2Score'),
            (this.scoreElements.player2Score.className = 'local-score-display player2-score'),
            document.body.appendChild(this.scoreElements.player2Score),
            (this.scoreElements.roundIndicator = document.createElement('div')),
            (this.scoreElements.roundIndicator.id = 'roundIndicator'),
            (this.scoreElements.roundIndicator.className = 'local-score-display round-indicator'),
            document.body.appendChild(this.scoreElements.roundIndicator),
            (this.scoreElements.winnerAnnouncement = document.createElement('div')),
            (this.scoreElements.winnerAnnouncement.id = 'winnerAnnouncement'),
            (this.scoreElements.winnerAnnouncement.className =
                'local-score-display winner-announcement'),
            (this.scoreElements.winnerAnnouncement.style.display = 'none'),
            document.body.appendChild(this.scoreElements.winnerAnnouncement),
            this.addScoreStyles(),
            (this.isInitialized = !0));
    }
    addScoreStyles() {
        if (document.getElementById('localScoringStyles')) return;
        const e = document.createElement('style');
        ((e.id = 'localScoringStyles'),
            (e.textContent =
                "\n            /* Base local score display styles */\n            .local-score-display {\n                position: absolute;\n                font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace;\n                font-weight: bold;\n                z-index: 100;\n                pointer-events: none;\n                user-select: none;\n                text-rendering: optimizeLegibility;\n                -webkit-font-smoothing: antialiased;\n                -moz-osx-font-smoothing: grayscale;\n            }\n\n            /* Player 1 score styling - green theme */\n            .player1-score {\n                top: 20px;\n                left: 20px;\n                color: #00ff41;\n                font-size: 2em;\n                text-shadow: \n                    0 0 5px rgba(0, 255, 65, 0.8),\n                    0 0 10px rgba(0, 255, 65, 0.6),\n                    0 0 15px rgba(0, 255, 65, 0.4),\n                    2px 2px 0px rgba(0, 0, 0, 0.8);\n                background: rgba(0, 0, 0, 0.3);\n                padding: 8px 12px;\n                border-radius: 4px;\n                border: 1px solid rgba(0, 255, 65, 0.3);\n            }\n\n            /* Player 2 score styling - blue theme */\n            .player2-score {\n                top: 20px;\n                right: 20px;\n                color: #00bfff;\n                font-size: 2em;\n                text-shadow: \n                    0 0 5px rgba(0, 191, 255, 0.8),\n                    0 0 10px rgba(0, 191, 255, 0.6),\n                    0 0 15px rgba(0, 191, 255, 0.4),\n                    2px 2px 0px rgba(0, 0, 0, 0.8);\n                background: rgba(0, 0, 0, 0.3);\n                padding: 8px 12px;\n                border-radius: 4px;\n                border: 1px solid rgba(0, 191, 255, 0.3);\n            }\n\n            /* Round indicator styling - centered */\n            .round-indicator {\n                top: 20px;\n                left: 50%;\n                transform: translateX(-50%);\n                color: #ffffff;\n                font-size: 1.5em;\n                text-shadow: \n                    0 0 5px rgba(255, 255, 255, 0.8),\n                    0 0 10px rgba(255, 255, 255, 0.6),\n                    2px 2px 0px rgba(0, 0, 0, 0.8);\n                background: rgba(0, 0, 0, 0.4);\n                padding: 6px 16px;\n                border-radius: 4px;\n                border: 1px solid rgba(255, 255, 255, 0.3);\n            }\n\n            /* Winner announcement styling - prominent center display */\n            .winner-announcement {\n                top: 50%;\n                left: 50%;\n                transform: translate(-50%, -50%);\n                color: #ffff00;\n                font-size: 3em;\n                text-shadow: \n                    0 0 10px rgba(255, 255, 0, 1),\n                    0 0 20px rgba(255, 255, 0, 0.8),\n                    0 0 30px rgba(255, 255, 0, 0.6),\n                    3px 3px 0px rgba(0, 0, 0, 0.9);\n                background: rgba(0, 0, 0, 0.7);\n                padding: 20px 40px;\n                border-radius: 10px;\n                border: 3px solid rgba(255, 255, 0, 0.7);\n                animation: winnerPulse 1.5s ease-in-out infinite;\n                backdrop-filter: blur(3px);\n                text-align: center;\n            }\n\n            /* Winner announcement for Player 1 */\n            .winner-announcement.player1-wins {\n                color: #00ff41;\n                border-color: rgba(0, 255, 65, 0.7);\n                text-shadow: \n                    0 0 10px rgba(0, 255, 65, 1),\n                    0 0 20px rgba(0, 255, 65, 0.8),\n                    0 0 30px rgba(0, 255, 65, 0.6),\n                    3px 3px 0px rgba(0, 0, 0, 0.9);\n            }\n\n            /* Winner announcement for Player 2 */\n            .winner-announcement.player2-wins {\n                color: #00bfff;\n                border-color: rgba(0, 191, 255, 0.7);\n                text-shadow: \n                    0 0 10px rgba(0, 191, 255, 1),\n                    0 0 20px rgba(0, 191, 255, 0.8),\n                    0 0 30px rgba(0, 191, 255, 0.6),\n                    3px 3px 0px rgba(0, 0, 0, 0.9);\n            }\n\n            /* Winner announcement for tie */\n            .winner-announcement.tie {\n                color: #ffffff;\n                border-color: rgba(255, 255, 255, 0.7);\n                text-shadow: \n                    0 0 10px rgba(255, 255, 255, 1),\n                    0 0 20px rgba(255, 255, 255, 0.8),\n                    0 0 30px rgba(255, 255, 255, 0.6),\n                    3px 3px 0px rgba(0, 0, 0, 0.9);\n            }\n\n            /* Pulse animation for winner announcement */\n            @keyframes winnerPulse {\n                0% { \n                    opacity: 1; \n                    transform: translate(-50%, -50%) scale(1);\n                }\n                50% { \n                    opacity: 0.9; \n                    transform: translate(-50%, -50%) scale(1.05);\n                }\n                100% { \n                    opacity: 1; \n                    transform: translate(-50%, -50%) scale(1);\n                }\n            }\n\n            /* Mobile responsive styles */\n            @media (max-width: 768px) {\n                .player1-score, .player2-score {\n                    font-size: 1.5em;\n                    top: 10px;\n                    padding: 6px 10px;\n                }\n                \n                .player1-score {\n                    left: 10px;\n                }\n                \n                .player2-score {\n                    right: 10px;\n                }\n                \n                .round-indicator {\n                    font-size: 1.2em;\n                    top: 10px;\n                    padding: 5px 12px;\n                }\n                \n                .winner-announcement {\n                    font-size: 2em;\n                    padding: 15px 30px;\n                }\n            }\n\n            /* Extra small screens */\n            @media (max-width: 480px) {\n                .player1-score, .player2-score {\n                    font-size: 1.2em;\n                    top: 5px;\n                    padding: 4px 8px;\n                }\n                \n                .player1-score {\n                    left: 5px;\n                }\n                \n                .player2-score {\n                    right: 5px;\n                }\n                \n                .round-indicator {\n                    font-size: 1em;\n                    top: 5px;\n                    padding: 4px 10px;\n                }\n                \n                .winner-announcement {\n                    font-size: 1.5em;\n                    padding: 12px 24px;\n                }\n            }\n\n            /* High contrast mode support */\n            @media (prefers-contrast: high) {\n                .player1-score {\n                    background: rgba(0, 0, 0, 0.8);\n                    border: 2px solid #00ff41;\n                }\n                \n                .player2-score {\n                    background: rgba(0, 0, 0, 0.8);\n                    border: 2px solid #00bfff;\n                }\n                \n                .round-indicator {\n                    background: rgba(0, 0, 0, 0.8);\n                    border: 2px solid #ffffff;\n                }\n                \n                .winner-announcement {\n                    background: rgba(0, 0, 0, 0.9);\n                    border-width: 4px;\n                }\n            }\n\n            /* Reduced motion support */\n            @media (prefers-reduced-motion: reduce) {\n                .winner-announcement {\n                    animation: none;\n                }\n            }\n        "),
            document.head.appendChild(e));
    }
    updateScores() {
        this.isInitialized || this.createScoreElements();
        const e = this.localScoring.getScoreDetails();
        ((this.scoreElements.player1Score.textContent = `P1: ${e.player1Wins}`),
            (this.scoreElements.player1Score.style.display = 'block'),
            (this.scoreElements.player2Score.textContent = `P2: ${e.player2Wins}`),
            (this.scoreElements.player2Score.style.display = 'block'),
            (this.scoreElements.roundIndicator.textContent = `Round ${e.currentRound}`),
            (this.scoreElements.roundIndicator.style.display = 'block'),
            (this.scoreElements.winnerAnnouncement.style.display = 'none'));
    }
    showRoundWinner(e) {
        (this.isInitialized || this.createScoreElements(), this.updateScores());
        const t = this.scoreElements.winnerAnnouncement;
        ((t.className = 'local-score-display winner-announcement'),
            'P1' === e
                ? ((t.textContent = 'Player 1 Wins!'), t.classList.add('player1-wins'))
                : 'P2' === e
                  ? ((t.textContent = 'Player 2 Wins!'), t.classList.add('player2-wins'))
                  : ((t.textContent = 'Tie!'), t.classList.add('tie')),
            (t.style.display = 'block'),
            setTimeout(() => {
                t.style.display = 'none';
            }, 3e3));
    }
    showFinalScores() {
        this.isInitialized || this.createScoreElements();
        const e = this.localScoring.getScoreDetails(),
            t = this.localScoring.getLeader();
        this.updateScores();
        const i = this.scoreElements.winnerAnnouncement;
        ((i.className = 'local-score-display winner-announcement'),
            'P1' === t
                ? ((i.innerHTML = `\n                <div>Player 1 Wins!</div>\n                <div style="font-size: 0.6em; margin-top: 10px;">\n                    ${e.player1Wins} - ${e.player2Wins}\n                </div>\n            `),
                  i.classList.add('player1-wins'))
                : 'P2' === t
                  ? ((i.innerHTML = `\n                <div>Player 2 Wins!</div>\n                <div style="font-size: 0.6em; margin-top: 10px;">\n                    ${e.player1Wins} - ${e.player2Wins}\n                </div>\n            `),
                    i.classList.add('player2-wins'))
                  : ((i.innerHTML = `\n                <div>Tie Game!</div>\n                <div style="font-size: 0.6em; margin-top: 10px;">\n                    ${e.player1Wins} - ${e.player2Wins}\n                </div>\n            `),
                    i.classList.add('tie')),
            (i.style.display = 'block'));
    }
    hideScores() {
        this.isInitialized &&
            Object.values(this.scoreElements).forEach((e) => {
                e && e.style && (e.style.display = 'none');
            });
    }
    showScores() {
        (this.isInitialized || this.createScoreElements(), this.updateScores());
    }
    reset() {
        (this.hideScores(), this.isInitialized && this.updateScores());
    }
    destroy() {
        Object.values(this.scoreElements).forEach((e) => {
            e && e.parentNode && e.parentNode.removeChild(e);
        });
        const e = document.getElementById('localScoringStyles');
        (e && e.parentNode && e.parentNode.removeChild(e),
            (this.scoreElements = {}),
            (this.isInitialized = !1));
    }
};
module$n.exports = { LocalScoringUI: LocalScoringUI$1 };
const __CJS__export_default__$m =
        (null == module$n.exports ? {} : module$n.exports).default || module$n.exports,
    __CJS__import__32__$1 = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$m },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$m = { exports: {} };
let UIManager$2 = class {
    constructor() {
        ((this.gameOverUI = null),
            (this.modeUI = null),
            (this.styleManager = null),
            (this.currentMode = null));
    }
    initialize(e) {
        ((this.gameOverUI = e.gameOverUI),
            (this.modeUI = e.modeUI),
            (this.styleManager = e.styleManager));
    }
    updateForMode(e) {
        ((this.currentMode = e),
            this.modeUI && this.modeUI.hideAllModeUI(),
            this.updateUIVisibility(e));
    }
    updateUIVisibility(e) {
        const t = document.getElementById('difficultySelector'),
            i = document.getElementById('aiCountSelector'),
            r = {
                TIME_TRIAL: { difficultySelector: !1, aiCountSelector: !1 },
                ARENA_SHRINK: { difficultySelector: !1, aiCountSelector: !0 },
                LOCAL_MULTIPLAYER: { difficultySelector: !1, aiCountSelector: !1 },
                CLASSIC: { difficultySelector: !0, aiCountSelector: !0 },
            },
            n = r[e] || r.CLASSIC;
        (t &&
            (n.difficultySelector ? t.classList.remove('ui-hidden') : t.classList.add('ui-hidden')),
            i &&
                (n.aiCountSelector
                    ? i.classList.remove('ui-hidden')
                    : i.classList.add('ui-hidden')));
    }
    showGameOver(e, t, i = {}) {
        this.gameOverUI && this.gameOverUI.show(e, t, i);
    }
    hideGameOver() {
        this.gameOverUI && this.gameOverUI.hide();
        const e = document.getElementById('gameOver');
        e && (e.style.display = 'none');
        const t = document.getElementById('restart');
        t && (t.style.display = 'none');
    }
    createModeUI(e) {
        this.modeUI && this.modeUI.createUI(e);
    }
    updateModeDisplay(e, t) {
        this.modeUI && this.modeUI.updateDisplay(e, t);
    }
    hideModeUI(e) {
        this.modeUI && this.modeUI.hideUI(e);
    }
    getCurrentMode() {
        return this.currentMode;
    }
};
module$m.exports = { UIManager: UIManager$2 };
const __CJS__export_default__$l =
        (null == module$m.exports ? {} : module$m.exports).default || module$m.exports,
    __CJS__import__33__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$l },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$l = { exports: {} };
let GameOverUI$2 = class {
    constructor() {
        ((this.styleManager = null),
            (this.multiplayerGameOverUI = null),
            (this.localScoringUI = null));
    }
    initialize(e) {
        ((this.styleManager = e.styleManager),
            (this.multiplayerGameOverUI = e.multiplayerGameOverUI),
            (this.localScoringUI = e.localScoringUI),
            (this.scoreDisplay = e.scoreDisplay),
            (this.survivalTimer = e.survivalTimer),
            (this.leaderboardSystem = e.leaderboardSystem),
            (this.hideRemainingEntitiesDisplay = e.hideRemainingEntitiesDisplay),
            (this.showModeSelector = e.showModeSelector),
            (this.game = e.game));
    }
    show(e, t, i = {}) {
        switch (t) {
            case 'TIME_TRIAL':
                this.showTimeTrialGameOver();
                break;
            case 'ARENA_SHRINK':
                this.showArenaShrinkGameOver();
                break;
            case 'LOCAL_MULTIPLAYER':
                this.showMultiplayerGameOver(i);
                break;
            default:
                this.showMultiAIGameOver();
        }
    }
    hide() {
        const e = document.getElementById('gameOver');
        e && (e.style.display = 'none');
        const t = document.getElementById('restart');
        (t && (t.style.display = 'none'),
            this.multiplayerGameOverUI &&
                this.multiplayerGameOverUI.isVisible() &&
                this.multiplayerGameOverUI.hide());
    }
    showMultiAIGameOver() {
        const e = this.game.getGameState(),
            t = document.getElementById('gameOver');
        if ((this.hideRemainingEntitiesDisplay && this.hideRemainingEntitiesDisplay(), t)) {
            const i = e.playerScore > e.aiScore,
                r = e.isNewHighScore,
                n = e.aiOpponents ? e.aiOpponents.length : 1;
            e.aiOpponents ? e.aiOpponents.filter((e) => e.alive).length : e.ai;
            let s = '';
            ((s = i
                ? n > 1
                    ? `Victory! You defeated ${n} AI opponents!`
                    : 'Victory! You defeated the AI!'
                : n > 1
                  ? `Defeated by ${n} AI opponents`
                  : 'Defeated by AI'),
                (t.innerHTML = `\n                <div class="multi-ai-game-over">\n                    <h2 class="${i ? 'victory' : 'defeat'}">${s}</h2>\n                    <div class="score-summary">\n                        <div class="score-row">\n                            <span class="score-label">Your Score:</span>\n                            <span class="score-value player-score">${e.playerScore}</span>\n                        </div>\n                        <div class="score-row">\n                            <span class="score-label">AI Score:</span>\n                            <span class="score-value ai-score">${e.aiScore}</span>\n                        </div>\n                        <div class="score-row">\n                            <span class="score-label">High Score:</span>\n                            <span class="score-value high-score">${e.highScore}</span>\n                        </div>\n                    </div>\n                    ${r ? '<div class="new-high-score">New High Score!</div>' : ''}\n                    <div class="game-stats">\n                        <div class="stat-item">\n                            <span class="stat-label">AI Opponents:</span>\n                            <span class="stat-value">${n}</span>\n                        </div>\n                        <div class="stat-item">\n                            <span class="stat-label">Rounds Played:</span>\n                            <span class="stat-value">${e.roundsPlayed || e.playerScore + e.aiScore}</span>\n                        </div>\n                    </div>\n                    <button id="changeModeButton" onclick="showModeSelector()" class="mode-change-btn">\n                        Change Mode\n                    </button>\n                </div>\n            `),
                this.addMultiAIGameOverStyles());
        }
        this.scoreDisplay &&
            this.scoreDisplay.showGameOverScores(
                e.playerScore,
                e.aiScore,
                e.highScore,
                e.isNewHighScore
            );
    }
    addMultiAIGameOverStyles() {
        if (!this.styleManager) return;
        this.styleManager.addStyles(
            'multi-ai-game-over-styles',
            "\n            .multi-ai-game-over {\n                text-align: center;\n                color: white;\n                font-family: 'Courier New', monospace;\n            }\n\n            .multi-ai-game-over h2 {\n                font-size: 2.5em;\n                margin-bottom: 30px;\n                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);\n            }\n\n            .multi-ai-game-over h2.victory {\n                color: #00ff00;\n                text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);\n            }\n\n            .multi-ai-game-over h2.defeat {\n                color: #ff4444;\n                text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);\n            }\n\n            .score-summary {\n                background: rgba(0, 0, 0, 0.7);\n                border: 2px solid #ffffff;\n                border-radius: 10px;\n                padding: 20px;\n                margin: 20px auto;\n                max-width: 300px;\n            }\n\n            .score-row {\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                margin: 10px 0;\n                font-size: 1.2em;\n            }\n\n            .score-label {\n                color: #cccccc;\n            }\n\n            .player-score {\n                color: #00ffff;\n                font-weight: bold;\n            }\n\n            .ai-score {\n                color: #ff6666;\n                font-weight: bold;\n            }\n\n            .high-score {\n                color: #ffff00;\n                font-weight: bold;\n            }\n\n            .new-high-score {\n                color: #ffff00;\n                font-size: 1.5em;\n                font-weight: bold;\n                margin: 15px 0;\n                text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);\n                animation: highScoreGlow 1s ease-in-out infinite alternate;\n            }\n\n            .game-stats {\n                background: rgba(0, 0, 0, 0.5);\n                border: 1px solid #666666;\n                border-radius: 8px;\n                padding: 15px;\n                margin: 20px auto;\n                max-width: 250px;\n            }\n\n            .stat-item {\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                margin: 8px 0;\n                font-size: 1em;\n            }\n\n            .stat-label {\n                color: #aaaaaa;\n            }\n\n            .stat-value {\n                color: #ffffff;\n                font-weight: bold;\n            }\n\n            .mode-change-btn {\n                margin-top: 20px;\n                padding: 12px 24px;\n                font-size: 1.2em;\n                background: rgba(0, 255, 255, 0.2);\n                border: 2px solid #00ffff;\n                color: white;\n                border-radius: 8px;\n                cursor: pointer;\n                font-family: 'Courier New', monospace;\n                transition: all 0.3s ease;\n            }\n\n            .mode-change-btn:hover {\n                background: rgba(0, 255, 255, 0.4);\n                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);\n            }\n\n            @keyframes highScoreGlow {\n                from {\n                    text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);\n                }\n                to {\n                    text-shadow: 0 0 25px rgba(255, 255, 0, 1.0);\n                }\n            }\n\n            @media (max-width: 768px) {\n                .multi-ai-game-over h2 {\n                    font-size: 1.8em;\n                    margin-bottom: 20px;\n                }\n                \n                .score-summary {\n                    max-width: 250px;\n                    padding: 15px;\n                }\n                \n                .score-row {\n                    font-size: 1em;\n                    margin: 8px 0;\n                }\n                \n                .game-stats {\n                    max-width: 200px;\n                    padding: 12px;\n                }\n                \n                .mode-change-btn {\n                    padding: 10px 20px;\n                    font-size: 1em;\n                }\n            }\n        "
        );
    }
    showTimeTrialGameOver() {
        const e = this.survivalTimer.getElapsedTime(),
            t = this.survivalTimer.formatTime(e),
            i = document.getElementById('gameOver');
        i &&
            (i.innerHTML = `\n                <h2>Time Trial Complete!</h2>\n                <p>Survival Time: ${t}</p>\n                ${this.leaderboardSystem.isNewRecord(e) ? '<p class="new-record">New Personal Best!</p>' : ''}\n                <button id="changeModeButton" onclick="showModeSelector()" style="\n                    margin-top: 20px;\n                    padding: 10px 20px;\n                    font-size: 1.2em;\n                    background: rgba(0, 255, 255, 0.2);\n                    border: 2px solid #00ffff;\n                    color: white;\n                    border-radius: 5px;\n                    cursor: pointer;\n                ">Change Mode</button>\n            `);
    }
    showArenaShrinkGameOver() {
        this.game.getSurvivalTime();
        const e = this.game.getFormattedSurvivalTime(),
            t = this.game.getShrinksSurvived(),
            i = this.game.getBounds().size,
            r = document.getElementById('gameOver');
        if (r) {
            const n = this.game.getGameState(),
                s = n.playerScore > n.aiScore ? 'You Win!' : 'AI Wins!';
            r.innerHTML = `\n                <h2>${s}</h2>\n                <p>Survival Time: ${e}</p>\n                <p>Shrinks Survived: ${t}</p>\n                <p>Final Arena: ${i}x${i}</p>\n                <button id="changeModeButton" onclick="showModeSelector()" style="\n                    margin-top: 20px;\n                    padding: 10px 20px;\n                    font-size: 1.2em;\n                    background: rgba(0, 255, 255, 0.2);\n                    border: 2px solid #00ffff;\n                    color: white;\n                    border-radius: 5px;\n                    cursor: pointer;\n                ">Change Mode</button>\n            `;
        }
    }
    showMultiplayerGameOver(e = {}) {
        if (!this.multiplayerGameOverUI) {
            const { MultiplayerGameOverUI: e } = __CJS__export_default__$n || __CJS__import__31__;
            this.multiplayerGameOverUI = new e();
        }
        const t = this.game.getGameState();
        this.multiplayerGameOverUI.show(
            t,
            () => {
                (this.game.restart(),
                    (this.game.gameOver = !1),
                    this.localScoringUI && this.localScoringUI.updateScores(),
                    e.onRestart && e.onRestart());
            },
            () => {
                (this.game.resetScores(),
                    (this.game.gameOver = !1),
                    this.localScoringUI && this.localScoringUI.updateScores(),
                    e.onResetScores && e.onResetScores());
            },
            () => {
                (this.localScoringUI && this.localScoringUI.hideScores(),
                    this.showModeSelector && this.showModeSelector(),
                    e.onReturnToSinglePlayer && e.onReturnToSinglePlayer());
            }
        );
        const i = document.getElementById('gameOver');
        i && (i.style.display = 'none');
        const r = document.getElementById('restart');
        r && (r.style.display = 'none');
    }
};
module$l.exports = { GameOverUI: GameOverUI$2 };
const __CJS__export_default__$k =
        (null == module$l.exports ? {} : module$l.exports).default || module$l.exports,
    __CJS__import__34__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$k },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$k = { exports: {} };
let ModeUI$2 = class {
    constructor() {
        ((this.styleManager = null), (this.game = null), (this.survivalTimer = null));
    }
    initialize(e) {
        ((this.styleManager = e.styleManager),
            (this.game = e.game),
            (this.survivalTimer = e.survivalTimer));
    }
    createUI(e) {
        switch (e) {
            case 'TIME_TRIAL':
                this.createTimeTrialUI();
                break;
            case 'ARENA_SHRINK':
                this.createArenaShrinkUI();
        }
    }
    updateDisplay(e, t) {
        switch (e) {
            case 'TIME_TRIAL':
                this.updateTimeTrialDisplay();
                break;
            case 'ARENA_SHRINK':
                this.updateArenaShrinkDisplay();
        }
    }
    hideUI(e) {
        switch (e) {
            case 'TIME_TRIAL':
                this.hideTimeTrialUI();
                break;
            case 'ARENA_SHRINK':
                this.hideArenaShrinkUI();
        }
    }
    hideAllModeUI() {
        (this.hideTimeTrialUI(), this.hideArenaShrinkUI(), this.hideRemainingEntitiesDisplay());
    }
    createTimeTrialUI() {
        let e = document.getElementById('timer-display');
        (e ||
            ((e = document.createElement('div')),
            (e.id = 'timer-display'),
            (e.className = 'timer-display'),
            (e.textContent = '00:00.00'),
            document.body.appendChild(e)),
            this.addTimeTrialStyles());
    }
    updateTimeTrialDisplay() {
        const e = document.getElementById('timer-display');
        e && this.survivalTimer
            ? (e.textContent = this.survivalTimer.getCurrentFormattedTime())
            : e || this.createTimeTrialUI();
    }
    hideTimeTrialUI() {
        const e = document.getElementById('timer-display');
        e && e.remove();
    }
    addTimeTrialStyles() {
        if (!this.styleManager) return;
        this.styleManager.addStyles(
            'time-trial-styles',
            "\n            .timer-display {\n                position: fixed;\n                top: 20px;\n                left: 50%;\n                transform: translateX(-50%);\n                font-size: 36px;\n                font-weight: bold;\n                color: #00ffff;\n                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);\n                z-index: 100;\n                font-family: 'Courier New', monospace;\n                background: rgba(0, 0, 0, 0.7);\n                padding: 10px 20px;\n                border-radius: 5px;\n                border: 2px solid #00ffff;\n            }\n\n            .new-record {\n                color: #ffff00;\n                font-weight: bold;\n                text-shadow: 0 0 10px rgba(255, 255, 0, 0.8);\n            }\n\n            .ui-hidden {\n                display: none !important;\n            }\n\n            @media (max-width: 768px) {\n                .timer-display {\n                    font-size: 24px;\n                    top: 10px;\n                    padding: 8px 16px;\n                }\n            }\n        "
        );
    }
    createArenaShrinkUI() {
        let e = document.getElementById('arena-timer-display');
        e ||
            ((e = document.createElement('div')),
            (e.id = 'arena-timer-display'),
            (e.className = 'arena-timer-display'),
            (e.textContent = '00:00.00'),
            document.body.appendChild(e));
        let t = document.getElementById('arena-info-display');
        (t ||
            ((t = document.createElement('div')),
            (t.id = 'arena-info-display'),
            (t.className = 'arena-info-display'),
            (t.innerHTML =
                '\n                <div class="arena-size">Arena: 30x30</div>\n                <div class="shrink-countdown">Next shrink: 5.0s</div>\n            '),
            document.body.appendChild(t)),
            this.addArenaShrinkStyles());
    }
    updateArenaShrinkDisplay() {
        if (!this.game) return;
        const e = this.game.getGameState(),
            t = document.getElementById('arena-timer-display');
        t && e.formattedSurvivalTime && (t.textContent = e.formattedSurvivalTime);
        const i = document.getElementById('arena-info-display');
        if (i && e.arenaState) {
            const t = e.arenaState,
                r = i.querySelector('.arena-size'),
                n = i.querySelector('.shrink-countdown');
            if ((r && (r.textContent = `Arena: ${t.currentSize}x${t.currentSize}`), n))
                if (t.isAtMinimum)
                    ((n.textContent = 'FINAL ARENA'), n.classList.add('final-arena'));
                else if (t.warningActive) {
                    const e = (t.timeUntilShrink / 1e3).toFixed(1);
                    ((n.textContent = `Shrinking in: ${e}s`), n.classList.add('warning-active'));
                } else {
                    const e = (t.timeUntilShrink / 1e3).toFixed(1);
                    ((n.textContent = `Next shrink: ${e}s`),
                        n.classList.remove('warning-active', 'final-arena'));
                }
        }
    }
    hideArenaShrinkUI() {
        const e = document.getElementById('arena-timer-display');
        e && e.remove();
        const t = document.getElementById('arena-info-display');
        t && t.remove();
    }
    addArenaShrinkStyles() {
        if (!this.styleManager) return;
        this.styleManager.addStyles(
            'arena-shrink-styles',
            "\n            .arena-timer-display {\n                position: fixed;\n                top: 20px;\n                left: 20px;\n                font-size: 24px;\n                font-weight: bold;\n                color: #00ffff;\n                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);\n                z-index: 100;\n                font-family: 'Courier New', monospace;\n                background: rgba(0, 0, 0, 0.7);\n                padding: 8px 16px;\n                border-radius: 5px;\n                border: 2px solid #00ffff;\n            }\n\n            .arena-info-display {\n                position: fixed;\n                top: 20px;\n                right: 20px;\n                font-size: 18px;\n                font-weight: bold;\n                color: #ffffff;\n                text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);\n                z-index: 100;\n                font-family: 'Courier New', monospace;\n                background: rgba(0, 0, 0, 0.7);\n                padding: 12px 20px;\n                border-radius: 5px;\n                border: 2px solid #ffffff;\n                text-align: right;\n            }\n\n            .arena-info-display .arena-size {\n                margin-bottom: 8px;\n                color: #00ff00;\n            }\n\n            .arena-info-display .shrink-countdown {\n                color: #ffff00;\n                transition: color 0.3s ease;\n            }\n\n            .arena-info-display .shrink-countdown.warning-active {\n                color: #ff4444;\n                animation: warningPulse 0.5s ease-in-out infinite alternate;\n            }\n\n            .arena-info-display .shrink-countdown.final-arena {\n                color: #ff0000;\n                font-weight: bold;\n                animation: finalArenaPulse 1s ease-in-out infinite alternate;\n            }\n\n            @keyframes warningPulse {\n                from { opacity: 0.7; }\n                to { opacity: 1.0; }\n            }\n\n            @keyframes finalArenaPulse {\n                from { \n                    opacity: 0.8;\n                    text-shadow: 0 0 8px rgba(255, 0, 0, 0.6);\n                }\n                to { \n                    opacity: 1.0;\n                    text-shadow: 0 0 15px rgba(255, 0, 0, 1.0);\n                }\n            }\n\n            @media (max-width: 768px) {\n                .arena-timer-display {\n                    font-size: 18px;\n                    top: 10px;\n                    left: 10px;\n                    padding: 6px 12px;\n                }\n                \n                .arena-info-display {\n                    font-size: 14px;\n                    top: 10px;\n                    right: 10px;\n                    padding: 8px 16px;\n                }\n            }\n\n            @media (max-width: 480px) {\n                .arena-timer-display {\n                    font-size: 16px;\n                    padding: 4px 8px;\n                }\n                \n                .arena-info-display {\n                    font-size: 12px;\n                    padding: 6px 12px;\n                }\n            }\n        "
        );
    }
    showFinalArenaMessage() {
        let e = document.getElementById('final-arena-message');
        (e ||
            ((e = document.createElement('div')),
            (e.id = 'final-arena-message'),
            (e.className = 'final-arena-message'),
            document.body.appendChild(e)),
            (e.innerHTML = '<span class="final-arena-text">FINAL ARENA</span>'),
            (e.style.display = 'block'),
            (e.style.opacity = '0'),
            setTimeout(() => {
                e.style.opacity = '1';
            }, 50),
            setTimeout(() => {
                this.hideFinalArenaMessage();
            }, 3e3),
            this.addFinalArenaStyles());
    }
    hideFinalArenaMessage() {
        const e = document.getElementById('final-arena-message');
        e &&
            ((e.style.opacity = '0'),
            setTimeout(() => {
                e.style.display = 'none';
            }, 500));
    }
    addFinalArenaStyles() {
        if (!this.styleManager) return;
        this.styleManager.addStyles(
            'final-arena-styles',
            "\n            .final-arena-message {\n                position: fixed;\n                top: 30%;\n                left: 50%;\n                transform: translateX(-50%);\n                z-index: 200;\n                display: none;\n                opacity: 0;\n                transition: opacity 0.5s ease-in-out;\n                pointer-events: none;\n            }\n\n            .final-arena-text {\n                font-size: 48px;\n                font-weight: bold;\n                color: #ff4444;\n                text-shadow: \n                    0 0 10px rgba(255, 68, 68, 0.8),\n                    0 0 20px rgba(255, 68, 68, 0.6),\n                    0 0 30px rgba(255, 68, 68, 0.4);\n                font-family: 'Courier New', monospace;\n                background: rgba(0, 0, 0, 0.8);\n                padding: 20px 40px;\n                border-radius: 10px;\n                border: 3px solid #ff4444;\n                animation: finalArenaGlow 2s ease-in-out infinite alternate;\n            }\n\n            @keyframes finalArenaGlow {\n                from {\n                    text-shadow: \n                        0 0 10px rgba(255, 68, 68, 0.8),\n                        0 0 20px rgba(255, 68, 68, 0.6),\n                        0 0 30px rgba(255, 68, 68, 0.4);\n                    border-color: #ff4444;\n                }\n                to {\n                    text-shadow: \n                        0 0 15px rgba(255, 68, 68, 1.0),\n                        0 0 25px rgba(255, 68, 68, 0.8),\n                        0 0 35px rgba(255, 68, 68, 0.6);\n                    border-color: #ff6666;\n                }\n            }\n\n            @media (max-width: 768px) {\n                .final-arena-text {\n                    font-size: 32px;\n                    padding: 15px 30px;\n                }\n            }\n\n            @media (max-width: 480px) {\n                .final-arena-text {\n                    font-size: 24px;\n                    padding: 10px 20px;\n                }\n            }\n        "
        );
    }
    updateRemainingEntityDisplay(e) {
        let t = document.getElementById('remaining-entities-display');
        t ||
            ((t = document.createElement('div')),
            (t.id = 'remaining-entities-display'),
            (t.className = 'remaining-entities-display'),
            document.body.appendChild(t),
            this.addRemainingEntitiesStyles());
        const i = e.includes('player'),
            r = e.filter((e) => e.startsWith('ai_')).length,
            n = e.length;
        n > 1
            ? ((t.innerHTML = `\n                <div class="remaining-count">Remaining: ${n}</div>\n                <div class="remaining-breakdown">\n                    ${i ? '<span class="player-status alive">You</span>' : '<span class="player-status dead">You</span>'}\n                    <span class="ai-status">${r} AI${1 !== r ? 's' : ''}</span>\n                </div>\n            `),
              (t.style.display = 'block'))
            : (t.style.display = 'none');
    }
    addRemainingEntitiesStyles() {
        if (!this.styleManager) return;
        this.styleManager.addStyles(
            'remaining-entities-styles',
            "\n            .remaining-entities-display {\n                position: fixed;\n                top: 100px;\n                left: 20px;\n                background-color: rgba(0, 0, 0, 0.8);\n                border: 2px solid #ffffff;\n                border-radius: 8px;\n                padding: 12px 16px;\n                color: white;\n                font-family: 'Courier New', monospace;\n                font-size: 16px;\n                z-index: 100;\n                min-width: 120px;\n            }\n\n            .remaining-count {\n                font-weight: bold;\n                font-size: 18px;\n                margin-bottom: 8px;\n                text-align: center;\n                color: #00ffff;\n            }\n\n            .remaining-breakdown {\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                gap: 12px;\n            }\n\n            .player-status {\n                font-weight: bold;\n            }\n\n            .player-status.alive {\n                color: #00ff00;\n            }\n\n            .player-status.dead {\n                color: #ff4444;\n                text-decoration: line-through;\n            }\n\n            .ai-status {\n                color: #ffaa00;\n            }\n\n            @media (max-width: 768px) {\n                .remaining-entities-display {\n                    font-size: 14px;\n                    padding: 8px 12px;\n                    top: 80px;\n                    left: 10px;\n                }\n                \n                .remaining-count {\n                    font-size: 16px;\n                    margin-bottom: 6px;\n                }\n            }\n        "
        );
    }
    hideRemainingEntitiesDisplay() {
        const e = document.getElementById('remaining-entities-display');
        e && (e.style.display = 'none');
    }
};
module$k.exports = { ModeUI: ModeUI$2 };
const __CJS__export_default__$j =
        (null == module$k.exports ? {} : module$k.exports).default || module$k.exports,
    __CJS__import__35__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$j },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$j = { exports: {} };
let StyleManager$2 = class {
    constructor() {
        this.injectedStyles = new Set();
    }
    addStyles(e, t) {
        if (this.hasStyles(e)) return !1;
        const i = document.createElement('style');
        return (
            (i.id = e),
            (i.textContent = t),
            document.head.appendChild(i),
            this.injectedStyles.add(e),
            !0
        );
    }
    removeStyles(e) {
        const t = document.getElementById(e);
        return !!t && (t.remove(), this.injectedStyles.delete(e), !0);
    }
    hasStyles(e) {
        return null !== document.getElementById(e);
    }
    getInjectedStyleIds() {
        return Array.from(this.injectedStyles);
    }
    removeAllStyles() {
        this.injectedStyles.forEach((e) => {
            this.removeStyles(e);
        });
    }
    updateStyles(e, t) {
        return (this.hasStyles(e) && this.removeStyles(e), this.addStyles(e, t));
    }
};
module$j.exports = { StyleManager: StyleManager$2 };
const __CJS__export_default__$i =
        (null == module$j.exports ? {} : module$j.exports).default || module$j.exports,
    __CJS__import__36__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$i },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$i = { exports: {} };
const { logger: logger$4 } = __CJS__export_default__$1a || __CJS__import__50__;
let BrowserCompatibility$2 = class BrowserCompatibility2 {
    constructor() {
        ((this.features = {
            webgl: !1,
            localStorage: !1,
            es6: !1,
            webAudio: !1,
            requestAnimationFrame: !1,
            canvas: !1,
        }),
            (this.browserInfo = { name: 'Unknown', version: 'Unknown', isSupported: !1 }),
            (this.warnings = []),
            (this.errors = []));
    }
    checkCompatibility() {
        (this.detectBrowser(),
            this.checkWebGL(),
            this.checkLocalStorage(),
            this.checkES6Features(),
            this.checkWebAudio(),
            this.checkRequestAnimationFrame(),
            this.checkCanvas());
        return {
            isCompatible: ['webgl', 'localStorage', 'es6', 'requestAnimationFrame', 'canvas'].every(
                (e) => this.features[e]
            ),
            features: __spreadValues({}, this.features),
            browserInfo: __spreadValues({}, this.browserInfo),
            warnings: [...this.warnings],
            errors: [...this.errors],
        };
    }
    detectBrowser() {
        const e = navigator.userAgent;
        if (e.indexOf('Chrome') > -1 && -1 === e.indexOf('Edg') && -1 === e.indexOf('OPR')) {
            this.browserInfo.name = 'Chrome';
            const t = e.match(/Chrome\/(\d+)/);
            t &&
                ((this.browserInfo.version = t[1]),
                (this.browserInfo.isSupported = parseInt(t[1]) >= 90));
        } else if (e.indexOf('Edg') > -1) {
            this.browserInfo.name = 'Edge';
            const t = e.match(/Edg\/(\d+)/);
            t &&
                ((this.browserInfo.version = t[1]),
                (this.browserInfo.isSupported = parseInt(t[1]) >= 90));
        } else if (e.indexOf('Firefox') > -1) {
            this.browserInfo.name = 'Firefox';
            const t = e.match(/Firefox\/(\d+)/);
            t &&
                ((this.browserInfo.version = t[1]),
                (this.browserInfo.isSupported = parseInt(t[1]) >= 88));
        } else if (e.indexOf('Safari') > -1 && -1 === e.indexOf('Chrome')) {
            this.browserInfo.name = 'Safari';
            const t = e.match(/Version\/(\d+)/);
            t &&
                ((this.browserInfo.version = t[1]),
                (this.browserInfo.isSupported = parseInt(t[1]) >= 14));
        } else if (e.indexOf('OPR') > -1 || e.indexOf('Opera') > -1) {
            this.browserInfo.name = 'Opera';
            const t = e.match(/(?:OPR|Opera)\/(\d+)/);
            t &&
                ((this.browserInfo.version = t[1]),
                (this.browserInfo.isSupported = parseInt(t[1]) >= 76));
        }
        this.browserInfo.isSupported ||
            this.warnings.push(
                `${this.browserInfo.name} ${this.browserInfo.version} may not be fully supported. Recommended: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+`
            );
    }
    checkWebGL() {
        try {
            const e = document.createElement('canvas'),
                t = e.getContext('webgl') || e.getContext('experimental-webgl');
            if (!t || !window.WebGLRenderingContext)
                return (
                    (this.features.webgl = !1),
                    this.errors.push('WebGL is not supported in this browser'),
                    !1
                );
            const i = t,
                r = i.getExtension('WEBGL_debug_renderer_info');
            if (r) {
                const e = i.getParameter(r.UNMASKED_RENDERER_WEBGL);
                logger$4.info(`WebGL Renderer: ${e}`);
            }
            return ((this.features.webgl = !0), !0);
        } catch (e) {
            return (
                (this.features.webgl = !1),
                this.errors.push(`WebGL check failed: ${e.message}`),
                !1
            );
        }
    }
    checkLocalStorage() {
        try {
            const e = '__lightbikes_storage_test__',
                t = 'test';
            localStorage.setItem(e, t);
            const i = localStorage.getItem(e);
            if ((localStorage.removeItem(e), i !== t))
                throw new Error('localStorage read/write verification failed');
            return ((this.features.localStorage = !0), !0);
        } catch (e) {
            return (
                (this.features.localStorage = !1),
                this.warnings.push(
                    'localStorage is not available. Game settings will not persist between sessions.'
                ),
                !1
            );
        }
    }
    checkES6Features() {
        try {
            if (
                (eval('() => {}'),
                eval('const x = 1; let y = 2;'),
                eval('class Test {}'),
                eval('`template`'),
                eval('const {a} = {a: 1};'),
                eval('const arr = [...[1, 2]];'),
                'undefined' == typeof Promise)
            )
                throw new Error('Promise not supported');
            if ('undefined' == typeof Map || 'undefined' == typeof Set)
                throw new Error('Map/Set not supported');
            return ((this.features.es6 = !0), !0);
        } catch (e) {
            return (
                (this.features.es6 = !1),
                this.errors.push('Required JavaScript ES6 features are not supported'),
                !1
            );
        }
    }
    checkWebAudio() {
        try {
            const e = window.AudioContext || window.webkitAudioContext;
            if (!e)
                return (
                    (this.features.webAudio = !1),
                    this.warnings.push(
                        'Web Audio API is not supported. Audio features will be limited.'
                    ),
                    !1
                );
            return (new e().close(), (this.features.webAudio = !0), !0);
        } catch (e) {
            return (
                (this.features.webAudio = !1),
                this.warnings.push(
                    'Web Audio API is not available. Audio features will be limited.'
                ),
                !1
            );
        }
    }
    checkRequestAnimationFrame() {
        return void 0 === window.requestAnimationFrame
            ? ((this.features.requestAnimationFrame = !1),
              this.errors.push('requestAnimationFrame is not supported'),
              !1)
            : ((this.features.requestAnimationFrame = !0), !0);
    }
    checkCanvas() {
        try {
            const e = document.createElement('canvas');
            return e.getContext('2d')
                ? ((this.features.canvas = !0), !0)
                : ((this.features.canvas = !1),
                  this.errors.push('Canvas 2D context is not supported'),
                  !1);
        } catch (e) {
            return (
                (this.features.canvas = !1),
                this.errors.push('Canvas API is not supported'),
                !1
            );
        }
    }
    getSummary() {
        const e = this.checkCompatibility();
        if (e.isCompatible)
            return `✓ Your browser (${e.browserInfo.name} ${e.browserInfo.version}) is compatible with LightBikes.`;
        let t = '⚠ Compatibility Issues Detected:\n\n';
        return (
            (t += `Browser: ${e.browserInfo.name} ${e.browserInfo.version}\n\n`),
            e.errors.length > 0 &&
                ((t += 'Critical Issues:\n'),
                e.errors.forEach((e) => {
                    t += `  • ${e}\n`;
                }),
                (t += '\n')),
            e.warnings.length > 0 &&
                ((t += 'Warnings:\n'),
                e.warnings.forEach((e) => {
                    t += `  • ${e}\n`;
                })),
            t
        );
    }
    getRecommendedBrowsers() {
        return [
            { name: 'Chrome', version: '90+', url: 'https://www.google.com/chrome/' },
            { name: 'Firefox', version: '88+', url: 'https://www.mozilla.org/firefox/' },
            { name: 'Safari', version: '14+', url: 'https://www.apple.com/safari/' },
            { name: 'Edge', version: '90+', url: 'https://www.microsoft.com/edge' },
        ];
    }
    detectEmojiSupport() {
        try {
            const e = document.createElement('canvas').getContext('2d');
            if (!e) return !1;
            ((e.textBaseline = 'top'), (e.font = '32px Arial'), e.fillText('😀', 0, 0));
            const t = e.getImageData(16, 16, 1, 1).data;
            return 0 !== t[0] || 0 !== t[1] || 0 !== t[2];
        } catch (e) {
            return !1;
        }
    }
    initializeIconDisplay() {
        this.detectEmojiSupport()
            ? logger$4.info('Emoji support detected')
            : (logger$4.warn('Emoji support not detected, using fallback text'),
              document.body.classList.add('no-emoji-support'));
    }
    showWebGLError() {
        const e = document.createElement('div');
        ((e.id = 'webgl-error'),
            (e.style.cssText =
                '\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background: rgba(255, 0, 0, 0.9);\n            color: white;\n            padding: 30px;\n            border-radius: 10px;\n            font-family: Arial, sans-serif;\n            text-align: center;\n            z-index: 10000;\n            max-width: 500px;\n            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);\n        '),
            (e.innerHTML =
                '\n            <h2 style="margin: 0 0 15px 0; font-size: 2em;">WebGL Not Supported</h2>\n            <p style="margin: 0 0 20px 0; font-size: 1.1em;">\n                Your browser does not support WebGL, which is required to run this game.\n            </p>\n            <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">\n                Please try using a modern browser like:\n            </p>\n            <ul style="list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 0.9em;">\n                <li>• Chrome 90+</li>\n                <li>• Firefox 88+</li>\n                <li>• Safari 14+</li>\n                <li>• Edge 90+</li>\n            </ul>\n            <p style="margin: 0; font-size: 0.8em; color: #ffcccc;">\n                If you\'re using a supported browser, WebGL may be disabled in your settings.\n            </p>\n        '),
            document.body.appendChild(e),
            logger$4.error('WebGL is not available. The game cannot run without WebGL support.'));
    }
};
void 0 !== module$i &&
    module$i.exports &&
    (module$i.exports = { BrowserCompatibility: BrowserCompatibility$2 });
const __CJS__export_default__$h =
        (null == module$i.exports ? {} : module$i.exports).default || module$i.exports,
    __CJS__import__37__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$h },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$h = { exports: {} };
let ModeController$4 = class {
    constructor(e, t) {
        ((this.game = e), (this.systems = t));
    }
    initialize() {
        throw new Error('ModeController.initialize() must be implemented by subclass');
    }
    cleanup() {
        throw new Error('ModeController.cleanup() must be implemented by subclass');
    }
    update(e) {}
    handleGameOver() {
        throw new Error('ModeController.handleGameOver() must be implemented by subclass');
    }
    createUI() {
        throw new Error('ModeController.createUI() must be implemented by subclass');
    }
    destroyUI() {
        throw new Error('ModeController.destroyUI() must be implemented by subclass');
    }
    _commonInitialization() {
        (this.systems.renderingEngine.clearTrails(),
            this.systems.powerUpManager.reset(),
            this.systems.statusIndicator.reset(),
            this.systems.glowEffectManager &&
                this.systems.glowEffectManager.initialized &&
                this.systems.glowEffectManager.handleGameRestart());
        const e = document.getElementById('gameOver');
        e && (e.style.display = 'none');
        const t = document.getElementById('restart');
        (t && (t.style.display = 'none'), this._updatePauseOverlay());
    }
    _updatePauseOverlay() {
        const e = this.game.getGameState(),
            t = document.getElementById('pauseOverlay');
        t && (e.isPaused ? (t.style.display = 'flex') : (t.style.display = 'none'));
    }
};
module$h.exports = { ModeController: ModeController$4 };
const __CJS__export_default__$g =
        (null == module$h.exports ? {} : module$h.exports).default || module$h.exports,
    __CJS__import__0__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$g },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$g = { exports: {} };
const { ModeController: ModeController$3 } = __CJS__export_default__$g || __CJS__import__0__,
    { GameModes: GameModes$6 } = __CJS__export_default__$17 || __CJS__import__19__;
let ClassicMode$1 = class extends ModeController$3 {
    constructor(e, t, i) {
        (super(e, t), (this.helpers = i), (this.currentAICount = i.currentAICount || 1));
    }
    initialize() {
        ((this.game.gameConfig.aiCount = this.currentAICount),
            this.game.restart(),
            this.game.setTimeTrialMode(!1),
            this.helpers.initializeAIControllers(this.currentAICount),
            this._commonInitialization(),
            this.createUI());
        const e = this.game.getGameState();
        (this.systems.scoreDisplay.updateGameplayScores(e.playerScore, e.aiScore),
            this.systems.audioManager.handleGameStart());
    }
    cleanup() {
        this.destroyUI();
    }
    handleGameOver() {
        this.systems.gameOverUI
            ? this.systems.gameOverUI.showMultiAIGameOver(this.game)
            : this.helpers.showMultiAIGameOver();
    }
    createUI() {
        this.systems.uiManager && this.systems.modeUI
            ? (this.systems.uiManager.updateForMode(GameModes$6.CLASSIC),
              this.systems.modeUI.hideAllModeUI())
            : (this.helpers.updateUIForGameMode(),
              this.helpers.hideTimeTrialUI(),
              this.helpers.hideArenaShrinkUI(),
              this.helpers.hideRemainingEntitiesDisplay());
    }
    destroyUI() {
        this.systems.modeUI
            ? this.systems.modeUI.hideAllModeUI()
            : this.helpers.hideRemainingEntitiesDisplay();
    }
};
module$g.exports = { ClassicMode: ClassicMode$1 };
const __CJS__export_default__$f =
        (null == module$g.exports ? {} : module$g.exports).default || module$g.exports,
    __CJS__import__38__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$f },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$f = { exports: {} };
const { ModeController: ModeController$2 } = __CJS__export_default__$g || __CJS__import__0__,
    { GameModes: GameModes$5 } = __CJS__export_default__$17 || __CJS__import__19__;
let TimeTrialMode$1 = class extends ModeController$2 {
    constructor(e, t, i) {
        (super(e, t), (this.helpers = i));
    }
    initialize() {
        (this.game.restart(),
            this.game.setTimeTrialMode(!0),
            this.systems.survivalTimer.reset(),
            this.systems.achievementSystem.reset(),
            this.systems.survivalTimer.start(),
            this._commonInitialization(),
            this.createUI(),
            this.systems.audioManager.handleGameStart());
    }
    cleanup() {
        (this.systems.survivalTimer.stop(), this.destroyUI());
    }
    handleGameOver() {
        this.systems.gameOverUI
            ? this.systems.gameOverUI.showTimeTrialGameOver(this.game)
            : this.helpers.showTimeTrialGameOver();
    }
    createUI() {
        this.systems.uiManager
            ? (this.systems.uiManager.updateForMode(GameModes$5.TIME_TRIAL),
              this.systems.uiManager.createModeUI(GameModes$5.TIME_TRIAL))
            : (this.helpers.updateUIForGameMode(),
              this.helpers.createTimeTrialUI(),
              this.helpers.hideArenaShrinkUI());
    }
    destroyUI() {
        this.systems.modeUI
            ? this.systems.modeUI.hideTimeTrialUI()
            : this.helpers.hideTimeTrialUI();
    }
};
module$f.exports = { TimeTrialMode: TimeTrialMode$1 };
const __CJS__export_default__$e =
        (null == module$f.exports ? {} : module$f.exports).default || module$f.exports,
    __CJS__import__39__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$e },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$e = { exports: {} };
const { ModeController: ModeController$1 } = __CJS__export_default__$g || __CJS__import__0__,
    { GameModes: GameModes$4 } = __CJS__export_default__$17 || __CJS__import__19__;
let ArenaShrinkMode$1 = class extends ModeController$1 {
    constructor(e, t, i) {
        (super(e, t), (this.helpers = i), (this.currentAICount = i.currentAICount || 1));
    }
    initialize() {
        ((this.game.gameConfig.aiCount = this.currentAICount),
            this.game.restart(),
            this.game.setGameMode(GameModes$4.ARENA_SHRINK),
            this.helpers.initializeAIControllers(this.currentAICount),
            this._setupShrinkCallbacks(),
            this._commonInitialization(),
            this.createUI());
        const e = this.game.getGameState();
        (this.systems.scoreDisplay.updateGameplayScores(e.playerScore, e.aiScore),
            this.systems.audioManager.handleGameStart());
    }
    _setupShrinkCallbacks() {
        this.game.arenaShrinker &&
            (this.game.arenaShrinker.setOnWarning(() => {
                this.systems.audioManager.playShrinkWarningSound();
            }),
            this.game.arenaShrinker.setOnShrink(() => {
                this.systems.audioManager.playShrinkExecuteSound();
                const e = this.game.arenaShrinker.getCurrentBounds(),
                    t = this.game.arenaShrinker.getNextBounds();
                this.systems.renderingEngine.startShrinkAnimation(e, t);
            }),
            this.game.arenaShrinker.setOnFinalArena(() => {
                this.systems.modeUI
                    ? this.systems.modeUI.showFinalArenaMessage()
                    : this.helpers.showFinalArenaMessage();
            }));
    }
    cleanup() {
        this.destroyUI();
    }
    handleGameOver() {
        this.systems.gameOverUI
            ? this.systems.gameOverUI.showArenaShrinkGameOver(this.game)
            : this.helpers.showArenaShrinkGameOver();
    }
    createUI() {
        this.systems.uiManager
            ? (this.systems.uiManager.updateForMode(GameModes$4.ARENA_SHRINK),
              this.systems.uiManager.createModeUI(GameModes$4.ARENA_SHRINK))
            : (this.helpers.updateUIForGameMode(),
              this.helpers.hideTimeTrialUI(),
              this.helpers.hideRemainingEntitiesDisplay(),
              this.helpers.createArenaShrinkUI());
    }
    destroyUI() {
        this.systems.modeUI
            ? (this.systems.modeUI.hideArenaShrinkUI(), this.systems.modeUI.hideFinalArenaMessage())
            : (this.helpers.hideArenaShrinkUI(), this.helpers.hideFinalArenaMessage());
    }
};
module$e.exports = { ArenaShrinkMode: ArenaShrinkMode$1 };
const __CJS__export_default__$d =
        (null == module$e.exports ? {} : module$e.exports).default || module$e.exports,
    __CJS__import__40__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$d },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$d = { exports: {} };
const { ModeController: ModeController } = __CJS__export_default__$g || __CJS__import__0__,
    { GameModes: GameModes$3 } = __CJS__export_default__$17 || __CJS__import__19__,
    { MultiplayerGame: MultiplayerGame$1 } = __CJS__export_default__$10 || __CJS__import__1__$5,
    { DualControlScheme: DualControlScheme$1 } = __CJS__export_default__$Y || __CJS__import__6__,
    { SplitScreenCamera: SplitScreenCamera$1 } = __CJS__export_default__$T || __CJS__import__8__;
let MultiplayerMode$1 = class extends ModeController {
    constructor(e, t, i) {
        (super(e, t),
            (this.helpers = i),
            (this.multiplayerGame = null),
            (this.dualControlScheme = null),
            (this.splitScreenCamera = null));
    }
    initialize() {
        (this.multiplayerGame
            ? this.multiplayerGame.restart()
            : ((this.multiplayerGame = new MultiplayerGame$1()),
              this.multiplayerGame.setPowerUpManager(this.systems.powerUpManager),
              this.multiplayerGame.setCameraEffectsManager(this.systems.cameraEffectsManager)),
            (this.game = this.multiplayerGame),
            this.helpers.setGame(this.multiplayerGame),
            this.dualControlScheme
                ? this.dualControlScheme.reset()
                : (this.dualControlScheme = new DualControlScheme$1()),
            this.multiplayerGame.init(),
            this.splitScreenCamera ||
                (this.splitScreenCamera = new SplitScreenCamera$1(
                    this.systems.renderingEngine.camera
                )),
            this.splitScreenCamera.setPlayers([
                this.multiplayerGame.player1,
                this.multiplayerGame.player2,
            ]),
            this._initializeMultiplayerUI(),
            this._commonInitialization(),
            this.createUI(),
            this.systems.audioManager.handleGameStart());
    }
    _initializeMultiplayerUI() {
        this.helpers.initializeMultiplayerUI &&
            this.helpers.initializeMultiplayerUI(this.multiplayerGame);
    }
    cleanup() {
        (this.helpers.cleanupMultiplayerUI && this.helpers.cleanupMultiplayerUI(),
            this.destroyUI(),
            this.helpers.resetGameReference && this.helpers.resetGameReference());
    }
    handleGameOver() {
        this.helpers.showMultiplayerGameOver && this.helpers.showMultiplayerGameOver();
    }
    createUI() {
        this.systems.uiManager && this.systems.modeUI
            ? (this.systems.uiManager.updateForMode(GameModes$3.LOCAL_MULTIPLAYER),
              this.systems.modeUI.hideAllModeUI())
            : (this.helpers.updateUIForGameMode(),
              this.helpers.hideTimeTrialUI(),
              this.helpers.hideArenaShrinkUI(),
              this.helpers.hideRemainingEntitiesDisplay());
    }
    destroyUI() {
        this.systems.modeUI && this.systems.modeUI.hideAllModeUI();
    }
    getMultiplayerGame() {
        return this.multiplayerGame;
    }
    getSplitScreenCamera() {
        return this.splitScreenCamera;
    }
    getDualControlScheme() {
        return this.dualControlScheme;
    }
};
module$d.exports = { MultiplayerMode: MultiplayerMode$1 };
const __CJS__export_default__$c =
        (null == module$d.exports ? {} : module$d.exports).default || module$d.exports,
    __CJS__import__41__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$c },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$c = { exports: {} };
let CompatibilityWarningUI$2 = class {
    constructor() {
        ((this.warningElement = null), (this.isVisible = !1));
    }
    showWarning(e) {
        (this.warningElement && this.hide(),
            (this.warningElement = document.createElement('div')),
            (this.warningElement.id = 'compatibility-warning'),
            (this.warningElement.className = 'compatibility-warning'));
        const t = e.browserInfo || { name: 'Unknown', version: 'Unknown' },
            i = e.errors || [],
            r = e.warnings || [];
        let n = `\n            <div class="compatibility-warning-content">\n                <div class="compatibility-warning-header">\n                    <h2>⚠ Browser Compatibility Warning</h2>\n                    <button class="compatibility-close-btn" id="compatibilityCloseBtn">×</button>\n                </div>\n                <div class="compatibility-warning-body">\n                    <p class="browser-info">\n                        <strong>Detected Browser:</strong> ${t.name} ${t.version}\n                    </p>\n        `;
        (i.length > 0 &&
            (n += `\n                <div class="compatibility-errors">\n                    <h3>Critical Issues:</h3>\n                    <ul>\n                        ${i.map((e) => `<li>${e}</li>`).join('')}\n                    </ul>\n                </div>\n            `),
            r.length > 0 &&
                (n += `\n                <div class="compatibility-warnings">\n                    <h3>Warnings:</h3>\n                    <ul>\n                        ${r.map((e) => `<li>${e}</li>`).join('')}\n                    </ul>\n                </div>\n            `),
            (n +=
                '\n                    <div class="compatibility-recommendations">\n                        <h3>Recommended Browsers:</h3>\n                        <ul class="browser-list">\n                            <li>Chrome 90+ <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">Download</a></li>\n                            <li>Firefox 88+ <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener">Download</a></li>\n                            <li>Safari 14+ <a href="https://www.apple.com/safari/" target="_blank" rel="noopener">Learn More</a></li>\n                            <li>Edge 90+ <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener">Download</a></li>\n                        </ul>\n                    </div>\n        '),
            0 === i.length
                ? (n +=
                      '\n                    <div class="compatibility-actions">\n                        <button class="compatibility-btn compatibility-btn-primary" id="compatibilityContinueBtn">\n                            Continue Anyway\n                        </button>\n                        <p class="compatibility-disclaimer">\n                            Some features may not work correctly.\n                        </p>\n                    </div>\n            ')
                : (n +=
                      '\n                    <div class="compatibility-actions">\n                        <p class="compatibility-error-message">\n                            The game cannot run without these critical features.\n                            Please upgrade your browser or try a different one.\n                        </p>\n                    </div>\n            '),
            (n += '\n                </div>\n            </div>\n        '),
            (this.warningElement.innerHTML = n),
            this.addStyles(),
            document.body.appendChild(this.warningElement),
            this.setupEventListeners(0 === i.length),
            (this.isVisible = !0));
    }
    showCriticalError(e) {
        (this.warningElement && this.hide(),
            (this.warningElement = document.createElement('div')),
            (this.warningElement.id = 'compatibility-warning'),
            (this.warningElement.className = 'compatibility-warning compatibility-critical'),
            (this.warningElement.innerHTML = `\n            <div class="compatibility-warning-content">\n                <div class="compatibility-warning-header">\n                    <h2>❌ Critical Error</h2>\n                </div>\n                <div class="compatibility-warning-body">\n                    <p class="compatibility-error-message">${e}</p>\n                    <div class="compatibility-recommendations">\n                        <h3>Recommended Browsers:</h3>\n                        <ul class="browser-list">\n                            <li>Chrome 90+ <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">Download</a></li>\n                            <li>Firefox 88+ <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener">Download</a></li>\n                            <li>Safari 14+ <a href="https://www.apple.com/safari/" target="_blank" rel="noopener">Learn More</a></li>\n                            <li>Edge 90+ <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener">Download</a></li>\n                        </ul>\n                    </div>\n                </div>\n            </div>\n        `),
            this.addStyles(),
            document.body.appendChild(this.warningElement),
            (this.isVisible = !0));
    }
    setupEventListeners(e) {
        const t = document.getElementById('compatibilityCloseBtn');
        if ((t && t.addEventListener('click', () => this.hide()), e)) {
            const e = document.getElementById('compatibilityContinueBtn');
            e &&
                e.addEventListener('click', () => {
                    (this.hide(),
                        sessionStorage.setItem('lightbikes_compatibility_acknowledged', 'true'));
                });
        }
    }
    hide() {
        (this.warningElement &&
            this.warningElement.parentNode &&
            this.warningElement.parentNode.removeChild(this.warningElement),
            (this.warningElement = null),
            (this.isVisible = !1));
    }
    isShowing() {
        return this.isVisible;
    }
    addStyles() {
        if (document.getElementById('compatibility-warning-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'compatibility-warning-styles'),
            (e.textContent =
                '\n            .compatibility-warning {\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                background: rgba(0, 0, 0, 0.9);\n                z-index: 10000;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                font-family: Arial, sans-serif;\n                animation: fadeIn 0.3s ease-in-out;\n            }\n\n            @keyframes fadeIn {\n                from { opacity: 0; }\n                to { opacity: 1; }\n            }\n\n            .compatibility-warning-content {\n                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n                border: 3px solid #ff6b6b;\n                border-radius: 15px;\n                max-width: 600px;\n                width: 90%;\n                max-height: 90vh;\n                overflow-y: auto;\n                box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);\n            }\n\n            .compatibility-critical .compatibility-warning-content {\n                border-color: #ff0000;\n                box-shadow: 0 10px 40px rgba(255, 0, 0, 0.5);\n            }\n\n            .compatibility-warning-header {\n                background: rgba(255, 107, 107, 0.2);\n                padding: 20px;\n                border-bottom: 2px solid #ff6b6b;\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n            }\n\n            .compatibility-warning-header h2 {\n                margin: 0;\n                color: #ff6b6b;\n                font-size: 1.8em;\n                text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);\n            }\n\n            .compatibility-close-btn {\n                background: none;\n                border: none;\n                color: #ffffff;\n                font-size: 2em;\n                cursor: pointer;\n                padding: 0;\n                width: 40px;\n                height: 40px;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                border-radius: 50%;\n                transition: all 0.3s ease;\n            }\n\n            .compatibility-close-btn:hover {\n                background: rgba(255, 255, 255, 0.1);\n                transform: rotate(90deg);\n            }\n\n            .compatibility-warning-body {\n                padding: 25px;\n                color: #ffffff;\n            }\n\n            .browser-info {\n                background: rgba(255, 255, 255, 0.05);\n                padding: 15px;\n                border-radius: 8px;\n                margin-bottom: 20px;\n                border-left: 4px solid #4ecdc4;\n            }\n\n            .compatibility-errors,\n            .compatibility-warnings {\n                margin: 20px 0;\n            }\n\n            .compatibility-errors h3 {\n                color: #ff6b6b;\n                margin: 0 0 10px 0;\n                font-size: 1.2em;\n            }\n\n            .compatibility-warnings h3 {\n                color: #ffd93d;\n                margin: 0 0 10px 0;\n                font-size: 1.2em;\n            }\n\n            .compatibility-errors ul,\n            .compatibility-warnings ul {\n                margin: 0;\n                padding-left: 20px;\n            }\n\n            .compatibility-errors li {\n                color: #ffb3b3;\n                margin: 8px 0;\n                line-height: 1.5;\n            }\n\n            .compatibility-warnings li {\n                color: #ffe699;\n                margin: 8px 0;\n                line-height: 1.5;\n            }\n\n            .compatibility-recommendations {\n                margin: 20px 0;\n                background: rgba(78, 205, 196, 0.1);\n                padding: 15px;\n                border-radius: 8px;\n                border-left: 4px solid #4ecdc4;\n            }\n\n            .compatibility-recommendations h3 {\n                color: #4ecdc4;\n                margin: 0 0 15px 0;\n                font-size: 1.2em;\n            }\n\n            .browser-list {\n                list-style: none;\n                padding: 0;\n                margin: 0;\n            }\n\n            .browser-list li {\n                padding: 10px;\n                margin: 8px 0;\n                background: rgba(255, 255, 255, 0.05);\n                border-radius: 5px;\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                transition: background 0.3s ease;\n            }\n\n            .browser-list li:hover {\n                background: rgba(255, 255, 255, 0.1);\n            }\n\n            .browser-list a {\n                color: #4ecdc4;\n                text-decoration: none;\n                font-weight: bold;\n                padding: 5px 15px;\n                border: 1px solid #4ecdc4;\n                border-radius: 5px;\n                transition: all 0.3s ease;\n            }\n\n            .browser-list a:hover {\n                background: #4ecdc4;\n                color: #1a1a2e;\n            }\n\n            .compatibility-actions {\n                margin-top: 25px;\n                text-align: center;\n            }\n\n            .compatibility-btn {\n                padding: 12px 30px;\n                font-size: 1.1em;\n                border: none;\n                border-radius: 8px;\n                cursor: pointer;\n                font-weight: bold;\n                transition: all 0.3s ease;\n                font-family: Arial, sans-serif;\n            }\n\n            .compatibility-btn-primary {\n                background: linear-gradient(135deg, #4ecdc4 0%, #44a8a0 100%);\n                color: #1a1a2e;\n                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);\n            }\n\n            .compatibility-btn-primary:hover {\n                transform: translateY(-2px);\n                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);\n            }\n\n            .compatibility-disclaimer {\n                margin-top: 15px;\n                color: #ffd93d;\n                font-size: 0.9em;\n                font-style: italic;\n            }\n\n            .compatibility-error-message {\n                color: #ffb3b3;\n                font-size: 1.1em;\n                line-height: 1.6;\n                text-align: center;\n                padding: 20px;\n                background: rgba(255, 107, 107, 0.1);\n                border-radius: 8px;\n                border: 1px solid rgba(255, 107, 107, 0.3);\n            }\n\n            @media (max-width: 768px) {\n                .compatibility-warning-content {\n                    width: 95%;\n                    max-height: 95vh;\n                }\n\n                .compatibility-warning-header {\n                    padding: 15px;\n                }\n\n                .compatibility-warning-header h2 {\n                    font-size: 1.4em;\n                }\n\n                .compatibility-warning-body {\n                    padding: 15px;\n                }\n\n                .browser-list li {\n                    flex-direction: column;\n                    gap: 10px;\n                    text-align: center;\n                }\n\n                .compatibility-btn {\n                    padding: 10px 20px;\n                    font-size: 1em;\n                }\n            }\n        '),
            document.head.appendChild(e));
    }
};
void 0 !== module$c &&
    module$c.exports &&
    (module$c.exports = { CompatibilityWarningUI: CompatibilityWarningUI$2 });
const __CJS__export_default__$b =
        (null == module$c.exports ? {} : module$c.exports).default || module$c.exports,
    __CJS__import__42__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$b },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$b = { exports: {} };
let DOMNotReadyError$3 = class extends Error {
        constructor(e = 'DOM is not ready for initialization') {
            (super(e),
                (this.name = 'DOMNotReadyError'),
                (this.recoverable = !0),
                (this.actionableSteps = [
                    'Wait a moment and the game will retry automatically',
                    'If the problem persists, refresh the page',
                    'Check your internet connection',
                ]));
        }
    },
    CanvasCreationError$3 = class extends Error {
        constructor(e = 'Failed to create or verify game canvas', t = null) {
            (super(e),
                (this.name = 'CanvasCreationError'),
                (this.recoverable = !1),
                (this.details = t),
                (this.actionableSteps = [
                    'Update your browser to the latest version',
                    'Enable hardware acceleration in browser settings',
                    'Try a different browser (Chrome, Firefox, or Edge)',
                    'Check if WebGL is supported: visit https://get.webgl.org/',
                ]));
        }
    },
    ModeSelectorError$2 = class extends Error {
        constructor(e = 'Mode selector failed to display', t = null) {
            (super(e),
                (this.name = 'ModeSelectorError'),
                (this.recoverable = !0),
                (this.details = t),
                (this.actionableSteps = [
                    'The game will attempt to use a fallback mode selector',
                    'Refresh the page if the mode selector does not appear',
                    'Disable browser extensions that might interfere with the page',
                    'Check if JavaScript is enabled in your browser',
                ]));
        }
    };
module$b.exports = {
    DOMNotReadyError: DOMNotReadyError$3,
    CanvasCreationError: CanvasCreationError$3,
    ModeSelectorError: ModeSelectorError$2,
};
const __CJS__export_default__$a =
        (null == module$b.exports ? {} : module$b.exports).default || module$b.exports,
    __CJS__import__48__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$a },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$a = { exports: {} };
const { Logger: Logger$5 } = __CJS__export_default__$1a || __CJS__import__50__,
    {
        DOMNotReadyError: DOMNotReadyError$2,
        CanvasCreationError: CanvasCreationError$2,
        ModeSelectorError: ModeSelectorError$1,
    } = __CJS__export_default__$a || __CJS__import__48__;
let RecoveryManager$1 = class {
    constructor() {
        ((this.logger = Logger$5.create('RecoveryManager')),
            (this.errorContainer = null),
            (this.activeErrors = new Map()),
            (this.errorCount = 0),
            (this.maxRetries = 3),
            (this.retryAttempts = new Map()),
            (this.initialized = !1),
            (this.recoveryStrategies = new Map()),
            (this.failedComponents = new Set()),
            (this.fallbackMode = !1),
            (this.disabledFeatures = new Set()),
            (this.maxDOMRetries = 3),
            (this.domRetryDelay = 500),
            (this.domRetryCount = 0));
    }
    init() {
        this.initialized ||
            (this.createErrorContainer(), this.addStyles(), (this.initialized = !0));
    }
    createErrorContainer() {
        ((this.errorContainer = document.createElement('div')),
            (this.errorContainer.id = 'error-container'),
            (this.errorContainer.className = 'error-container'),
            document.body.appendChild(this.errorContainer));
    }
    addStyles() {
        if (document.getElementById('error-handler-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'error-handler-styles'),
            (e.textContent =
                "\n            .error-container {\n                position: fixed;\n                top: 20px;\n                right: 20px;\n                z-index: 10000;\n                max-width: 400px;\n                pointer-events: none;\n            }\n\n            .error-message {\n                background: rgba(220, 53, 69, 0.95);\n                color: white;\n                padding: 16px 20px;\n                border-radius: 8px;\n                margin-bottom: 10px;\n                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n                font-family: 'Courier New', monospace;\n                font-size: 14px;\n                line-height: 1.5;\n                pointer-events: auto;\n                animation: slideIn 0.3s ease-out;\n                border-left: 4px solid #dc3545;\n            }\n\n            .error-message.warning {\n                background: rgba(255, 193, 7, 0.95);\n                color: #333;\n                border-left-color: #ffc107;\n            }\n\n            .error-message.info {\n                background: rgba(23, 162, 184, 0.95);\n                color: white;\n                border-left-color: #17a2b8;\n            }\n\n            .error-message.critical {\n                background: rgba(139, 0, 0, 0.95);\n                border-left-color: #8b0000;\n                font-weight: bold;\n            }\n\n            .error-header {\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                margin-bottom: 8px;\n            }\n\n            .error-title {\n                font-weight: bold;\n                font-size: 16px;\n            }\n\n            .error-close {\n                background: none;\n                border: none;\n                color: inherit;\n                font-size: 20px;\n                cursor: pointer;\n                padding: 0;\n                width: 24px;\n                height: 24px;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                opacity: 0.7;\n                transition: opacity 0.2s;\n            }\n\n            .error-close:hover {\n                opacity: 1;\n            }\n\n            .error-body {\n                margin-bottom: 8px;\n            }\n\n            .error-actions {\n                display: flex;\n                gap: 8px;\n                margin-top: 12px;\n            }\n\n            .error-action-btn {\n                background: rgba(255, 255, 255, 0.2);\n                border: 1px solid rgba(255, 255, 255, 0.4);\n                color: inherit;\n                padding: 6px 12px;\n                border-radius: 4px;\n                cursor: pointer;\n                font-family: 'Courier New', monospace;\n                font-size: 12px;\n                transition: background 0.2s;\n            }\n\n            .error-action-btn:hover {\n                background: rgba(255, 255, 255, 0.3);\n            }\n\n            .error-action-btn.primary {\n                background: rgba(255, 255, 255, 0.9);\n                color: #333;\n            }\n\n            .error-action-btn.primary:hover {\n                background: rgba(255, 255, 255, 1);\n            }\n\n            @keyframes slideIn {\n                from {\n                    transform: translateX(120%);\n                    opacity: 0;\n                }\n                to {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n            }\n\n            @keyframes slideOut {\n                from {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n                to {\n                    transform: translateX(120%);\n                    opacity: 0;\n                }\n            }\n\n            .error-message.removing {\n                animation: slideOut 0.3s ease-in forwards;\n            }\n\n            @media (max-width: 768px) {\n                .error-container {\n                    top: 10px;\n                    right: 10px;\n                    left: 10px;\n                    max-width: none;\n                }\n\n                .error-message {\n                    padding: 12px 16px;\n                    font-size: 13px;\n                }\n\n                .error-title {\n                    font-size: 14px;\n                }\n            }\n        "),
            document.head.appendChild(e));
    }
    showError(e, t = {}) {
        this.initialized || this.init();
        const {
            type: i = 'error',
            title: r = this.getDefaultTitle(i),
            duration: n = 'critical' === i ? 0 : 5e3,
            actions: s = [],
            id: a = 'error-' + this.errorCount++,
        } = t;
        if (this.activeErrors.has(a)) return a;
        const o = document.createElement('div');
        if (
            ((o.className = `error-message ${i}`),
            (o.dataset.errorId = a),
            (o.innerHTML = `\n            <div class="error-header">\n                <div class="error-title">${this.escapeHtml(r)}</div>\n                <button class="error-close" aria-label="Close">×</button>\n            </div>\n            <div class="error-body">${this.escapeHtml(e)}</div>\n            ${s.length > 0 ? '<div class="error-actions"></div>' : ''}\n        `),
            s.length > 0)
        ) {
            const e = o.querySelector('.error-actions');
            s.forEach((t) => {
                const i = document.createElement('button');
                ((i.className = 'error-action-btn ' + (t.primary ? 'primary' : '')),
                    (i.textContent = t.label),
                    (i.onclick = () => {
                        (t.callback && t.callback(), this.dismissError(a));
                    }),
                    e.appendChild(i));
            });
        }
        ((o.querySelector('.error-close').onclick = () => this.dismissError(a)),
            this.errorContainer.appendChild(o),
            this.activeErrors.set(a, o),
            n > 0 && setTimeout(() => this.dismissError(a), n));
        const l = `[${i.toUpperCase()}] ${r}: ${e}`;
        return (
            'info' === i
                ? this.logger.info(l)
                : 'warning' === i
                  ? this.logger.warn(l)
                  : this.logger.error(l),
            a
        );
    }
    dismissError(e) {
        const t = this.activeErrors.get(e);
        t &&
            (t.classList.add('removing'),
            setTimeout(() => {
                (t.parentNode && t.parentNode.removeChild(t), this.activeErrors.delete(e));
            }, 300));
    }
    clearAll() {
        this.activeErrors.forEach((e, t) => this.dismissError(t));
    }
    getDefaultTitle(e) {
        return (
            { error: 'Error', warning: 'Warning', info: 'Information', critical: 'Critical Error' }[
                e
            ] || 'Error'
        );
    }
    escapeHtml(e) {
        const t = document.createElement('div');
        return ((t.textContent = e), t.innerHTML);
    }
    showWarning(e, t = {}) {
        return this.showError(
            e,
            __spreadProps(__spreadValues({}, t), { type: 'warning', duration: t.duration || 5e3 })
        );
    }
    showInfo(e, t = {}) {
        return this.showError(
            e,
            __spreadProps(__spreadValues({}, t), { type: 'info', duration: t.duration || 4e3 })
        );
    }
    resetRetries(e) {
        this.retryAttempts.delete(`init-${e}`);
    }
    getRetryAttempts(e) {
        return this.retryAttempts.get(`init-${e}`) || 0;
    }
    handleInitializationError(e, t, i = 'Component') {
        const r = `init-${i}`,
            n = this.retryAttempts.get(r) || 0,
            s = [];
        return (
            n < this.maxRetries &&
                t &&
                s.push({
                    label: `Retry (${this.maxRetries - n} left)`,
                    callback: () => {
                        (this.retryAttempts.set(r, n + 1), t());
                    },
                    primary: !0,
                }),
            s.push({ label: 'Reload Page', callback: () => window.location.reload() }),
            this.showError(`Failed to initialize ${i}: ${e.message}`, {
                type: n >= this.maxRetries ? 'critical' : 'error',
                title: `${i} Initialization Failed`,
                duration: 0,
                actions: s,
                id: r,
            })
        );
    }
    handleWebGLError(e) {
        return this.showError(
            'Your browser does not support WebGL or it is disabled. Please use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) or enable WebGL in your browser settings.',
            {
                type: 'critical',
                title: 'WebGL Not Supported',
                duration: 0,
                actions: [
                    {
                        label: 'Learn More',
                        callback: () => window.open('https://get.webgl.org/', '_blank'),
                    },
                ],
                id: 'webgl-error',
            }
        );
    }
    handleRenderingError(e, t) {
        const i = [];
        return (
            t && i.push({ label: 'Use Simple Graphics', callback: t, primary: !0 }),
            this.showError(`Rendering error: ${e.message}. Try using simplified graphics mode.`, {
                type: 'error',
                title: 'Rendering Error',
                duration: 0,
                actions: i,
                id: 'rendering-error',
            })
        );
    }
    handleFeatureError(e, t, i) {
        const r = [];
        return (
            i && r.push({ label: 'Disable Feature', callback: i, primary: !0 }),
            this.showError(`${e} encountered an error and may not work correctly: ${t.message}`, {
                type: 'warning',
                title: `${e} Error`,
                duration: 8e3,
                actions: r,
                id: `feature-${e}`,
            })
        );
    }
    registerStrategy(e, t) {
        this.recoveryStrategies.set(e, {
            initialize: t.initialize,
            fallback: t.fallback || null,
            critical: !1 !== t.critical,
            maxRetries: t.maxRetries || 3,
            retryCount: 0,
        });
    }
    initializeWithRecovery(e) {
        return __async(this, null, function* () {
            const t = this.recoveryStrategies.get(e);
            if (!t) throw new Error(`No recovery strategy registered for ${e}`);
            try {
                const i = yield t.initialize();
                return ((t.retryCount = 0), this.failedComponents.delete(e), i);
            } catch (i) {
                return (
                    this.logger.error(`Failed to initialize ${e}:`, i),
                    this.failedComponents.add(e),
                    yield this.attemptRecovery(e, i, t)
                );
            }
        });
    }
    attemptRecovery(e, t, i) {
        return __async(this, null, function* () {
            if ((i.retryCount++, i.retryCount < i.maxRetries))
                return (
                    this.handleInitializationError(t, () => this.retryInitialization(e), e),
                    yield this.delay(1e3 * i.retryCount),
                    yield this.retryInitialization(e)
                );
            if (i.fallback) {
                this.logger.warn(`Using fallback for ${e}`);
                try {
                    const t = yield i.fallback();
                    return (
                        (this.fallbackMode = !0),
                        this.showWarning(
                            `${e} is running in simplified mode due to initialization errors.`,
                            { duration: 8e3 }
                        ),
                        t
                    );
                } catch (r) {
                    this.logger.error(`Fallback failed for ${e}:`, r);
                }
            }
            if (i.critical) throw (this.handleInitializationError(t, null, e), t);
            return (this.disableFeature(e), null);
        });
    }
    retryInitialization(e) {
        return __async(this, null, function* () {
            const t = this.recoveryStrategies.get(e);
            if (!t) throw new Error(`No recovery strategy registered for ${e}`);
            try {
                const i = yield t.initialize();
                return (
                    (t.retryCount = 0),
                    this.failedComponents.delete(e),
                    this.resetRetries(e),
                    this.showInfo(`${e} initialized successfully.`, { duration: 3e3 }),
                    i
                );
            } catch (i) {
                return (
                    this.logger.error(`Retry failed for ${e}:`, i),
                    yield this.attemptRecovery(e, i, t)
                );
            }
        });
    }
    disableFeature(e) {
        (this.disabledFeatures.add(e),
            this.showWarning(
                `${e} has been disabled due to errors. The game will continue without this feature.`,
                { duration: 8e3 }
            ),
            this.logger.warn(`Feature disabled: ${e}`));
    }
    isFeatureDisabled(e) {
        return this.disabledFeatures.has(e);
    }
    enableFeature(e) {
        (this.disabledFeatures.delete(e), this.logger.info(`Feature enabled: ${e}`));
    }
    isInFallbackMode() {
        return this.fallbackMode;
    }
    getFailedComponents() {
        return Array.from(this.failedComponents);
    }
    getDisabledFeatures() {
        return Array.from(this.disabledFeatures);
    }
    delay(e) {
        return new Promise((t) => setTimeout(t, e));
    }
    handleRenderingErrorWithFallback(e, t) {
        if ((this.logger.error('Rendering error:', e), t))
            try {
                return (
                    t(),
                    (this.fallbackMode = !0),
                    this.handleRenderingError(e, () => {
                        (t(),
                            this.showInfo('Switched to simplified graphics mode.', {
                                duration: 3e3,
                            }));
                    }),
                    !0
                );
            } catch (i) {
                return (
                    this.logger.error('Simplified renderer also failed:', i),
                    this.showError('Unable to initialize graphics. Please reload the page.', {
                        type: 'critical',
                        title: 'Graphics Initialization Failed',
                        duration: 0,
                        actions: [],
                        id: 'graphics-init-critical-error',
                    }),
                    !1
                );
            }
        return (this.handleRenderingError(e, null), !1);
    }
    handleFeatureRuntimeError(e, t, i) {
        (this.logger.error(`Runtime error in ${e}:`, t),
            this.isFeatureDisabled(e) ||
                this.handleFeatureError(e, t, () => {
                    (i && i(), this.disableFeature(e));
                }));
    }
    wrapWithRecovery(e, t, i = null) {
        return (...r) => {
            if (this.isFeatureDisabled(t)) return i ? i(...r) : null;
            try {
                return e(...r);
            } catch (n) {
                if ((this.logger.error(`Error in ${t}:`, n), i))
                    try {
                        return i(...r);
                    } catch (s) {
                        this.logger.error(`Fallback also failed for ${t}:`, s);
                    }
                return (this.handleFeatureRuntimeError(t, n, null), null);
            }
        };
    }
    createSafeUpdateLoop(e, t) {
        let i = 0;
        let r = [];
        return (...n) => {
            try {
                if (this.isFeatureDisabled(t)) return;
                (e(...n), i > 0 && ((i = 0), (r = [])));
            } catch (s) {
                const e = Date.now();
                if (
                    (r.push(e),
                    (r = r.filter((t) => e - t < 1e4)),
                    (i = r.length),
                    this.logger.error(`Error in ${t} update:`, s),
                    i >= 5)
                ) {
                    const e = new Error(`Too many errors (${i} in 10000ms)`);
                    (this.logger.error(`Disabling ${t} due to excessive errors:`, e),
                        this.disableFeature(t));
                }
            }
        };
    }
    recoverFromDOMNotReady(e) {
        return __async(this, null, function* () {
            return (
                !(this.domRetryCount >= this.maxDOMRetries) &&
                (this.domRetryCount++,
                this.logger.info(
                    `Retrying initialization (attempt ${this.domRetryCount}/${this.maxDOMRetries})...`
                ),
                new Promise((t) => {
                    setTimeout(
                        () =>
                            __async(this, null, function* () {
                                try {
                                    (yield e(), t(!0));
                                } catch (i) {
                                    t(!1);
                                }
                            }),
                        this.domRetryDelay
                    );
                }))
            );
        });
    }
    getUserAgent() {
        return navigator.userAgent;
    }
    getWebGLCompatibilityMessage() {
        const e = this.getUserAgent().toLowerCase();
        let t = 'your browser',
            i = '';
        return (
            e.includes('edg')
                ? ((t = 'Edge'), (i = 'https://www.microsoft.com/edge'))
                : e.includes('chrome')
                  ? ((t = 'Chrome'), (i = 'https://www.google.com/chrome/'))
                  : e.includes('firefox')
                    ? ((t = 'Firefox'), (i = 'https://www.mozilla.org/firefox/'))
                    : e.includes('safari') &&
                      ((t = 'Safari'), (i = 'https://www.apple.com/safari/')),
            {
                browserName: t,
                updateLink: i,
                message: `WebGL is not available in ${t}. This game requires WebGL to run.`,
                actionableSteps: [
                    `Update ${t} to the latest version`,
                    'Enable hardware acceleration in browser settings',
                    'Try a different browser if the issue persists',
                    'Visit https://get.webgl.org/ to test WebGL support',
                ],
            }
        );
    }
    createFallbackModeSelector(e) {
        const t = document.createElement('div');
        ((t.id = 'fallback-mode-selector'),
            (t.style.cssText =
                "\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background: rgba(0, 0, 0, 0.95);\n            border: 2px solid #0ff;\n            padding: 30px;\n            border-radius: 8px;\n            z-index: 10000;\n            font-family: 'Courier New', monospace;\n            color: #0ff;\n        "),
            (t.innerHTML =
                '\n            <h2 style="margin: 0 0 20px 0; text-align: center;">Select Game Mode</h2>\n            <div style="display: flex; flex-direction: column; gap: 10px;">\n                <button class="fallback-mode-btn" data-mode="classic" style="\n                    background: #0ff;\n                    color: #000;\n                    border: none;\n                    padding: 15px;\n                    font-size: 16px;\n                    font-family: \'Courier New\', monospace;\n                    font-weight: bold;\n                    cursor: pointer;\n                    border-radius: 4px;\n                ">Classic Mode</button>\n                <button class="fallback-mode-btn" data-mode="time_trial" style="\n                    background: #0ff;\n                    color: #000;\n                    border: none;\n                    padding: 15px;\n                    font-size: 16px;\n                    font-family: \'Courier New\', monospace;\n                    font-weight: bold;\n                    cursor: pointer;\n                    border-radius: 4px;\n                ">Time Trial</button>\n                <button class="fallback-mode-btn" data-mode="survival" style="\n                    background: #0ff;\n                    color: #000;\n                    border: none;\n                    padding: 15px;\n                    font-size: 16px;\n                    font-family: \'Courier New\', monospace;\n                    font-weight: bold;\n                    cursor: pointer;\n                    border-radius: 4px;\n                ">Survival</button>\n            </div>\n        '));
        return (
            t.querySelectorAll('.fallback-mode-btn').forEach((i) => {
                (i.addEventListener('mouseenter', () => {
                    i.style.background = '#0cc';
                }),
                    i.addEventListener('mouseleave', () => {
                        i.style.background = '#0ff';
                    }),
                    i.addEventListener('click', () => {
                        const r = i.getAttribute('data-mode');
                        (t.remove(), e(r));
                    }));
            }),
            t
        );
    }
    recoverFromModeSelectorError(e) {
        try {
            const t = this.createFallbackModeSelector(e);
            return (
                document.body.appendChild(t),
                this.logger.info('Fallback mode selector created'),
                !0
            );
        } catch (t) {
            return (this.logger.error('Failed to create fallback mode selector:', t), !1);
        }
    }
    reset() {
        (this.failedComponents.clear(),
            this.disabledFeatures.clear(),
            (this.fallbackMode = !1),
            (this.domRetryCount = 0),
            this.recoveryStrategies.forEach((e) => {
                e.retryCount = 0;
            }));
    }
    getStatus() {
        return {
            fallbackMode: this.fallbackMode,
            failedComponents: this.getFailedComponents(),
            disabledFeatures: this.getDisabledFeatures(),
            registeredStrategies: Array.from(this.recoveryStrategies.keys()),
        };
    }
};
module$a.exports = { RecoveryManager: RecoveryManager$1 };
const __CJS__export_default__$9 =
        (null == module$a.exports ? {} : module$a.exports).default || module$a.exports,
    __CJS__import__43__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$9 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$9 = { exports: {} };
let LoadingIndicator$2 = class {
    constructor() {
        ((this.element = null), (this.messageElement = null), (this.stylesAdded = !1));
    }
    show(e = 'Loading...') {
        (this.element
            ? this.element.querySelector('.loading-spinner')
                ? this.messageElement && (this.messageElement.textContent = e)
                : ((this.element.innerHTML = `\n                    <div class="loading-spinner"></div>\n                    <div class="loading-message">${e}</div>\n                `),
                  (this.messageElement = this.element.querySelector('.loading-message')))
            : ((this.element = document.createElement('div')),
              (this.element.id = 'loading-indicator'),
              (this.element.className = 'loading-indicator'),
              (this.element.innerHTML = `\n                <div class="loading-spinner"></div>\n                <div class="loading-message">${e}</div>\n            `),
              document.body.appendChild(this.element),
              (this.messageElement = this.element.querySelector('.loading-message')),
              this.stylesAdded || (this._addStyles(), (this.stylesAdded = !0))),
            (this.element.style.display = 'flex'));
    }
    updateProgress(e, t) {
        this.messageElement && (this.messageElement.textContent = t || e);
    }
    hide() {
        this.element &&
            ((this.element.style.opacity = '0'),
            setTimeout(() => {
                ((this.element.style.display = 'none'), (this.element.style.opacity = '1'));
            }, 300));
    }
    showError(e, t = null) {
        this.element || this.show('Error');
        const i = e.name && 'Error' !== e.name ? e.name : 'Initialization Error',
            r = e.message || 'An unexpected error occurred',
            n = e.stack ? `<pre>${e.stack}</pre>` : '',
            s = this._getActionableSteps(e),
            a = s.length > 0 ? `<ul>${s.map((e) => `<li>${e}</li>`).join('')}</ul>` : '',
            o = t
                ? '<button class="error-retry-button" id="error-retry-button">Retry</button>'
                : '';
        if (
            ((this.element.innerHTML = `\n            <div class="error-display">\n                <div class="error-title">${i}</div>\n                <div class="error-message">${r}</div>\n                ${a ? `<div class="error-steps"><strong>What you can do:</strong>${a}</div>` : ''}\n                ${n ? `<details class="error-details"><summary>Technical Details</summary>${n}</details>` : ''}\n                ${o}\n            </div>\n        `),
            (this.element.style.display = 'flex'),
            t)
        ) {
            const e = document.getElementById('error-retry-button');
            e && e.addEventListener('click', t);
        }
    }
    _getActionableSteps(e) {
        if (e.actionableSteps && Array.isArray(e.actionableSteps)) return e.actionableSteps;
        const t = e.message || '',
            i = [];
        return (
            t.includes('WebGL')
                ? (i.push('Update your browser to the latest version'),
                  i.push('Enable hardware acceleration in browser settings'),
                  i.push('Try a different browser (Chrome, Firefox, or Edge)'))
                : t.includes('DOM') || t.includes('canvas')
                  ? (i.push('Refresh the page'),
                    i.push('Clear your browser cache'),
                    i.push('Disable browser extensions that might interfere'))
                  : t.includes('Mode Selector')
                    ? (i.push('Refresh the page'), i.push('Check if JavaScript is enabled'))
                    : (i.push('Refresh the page'), i.push('Try again in a few moments')),
            i
        );
    }
    _addStyles() {
        if (document.getElementById('loading-indicator-styles')) return;
        const e = document.createElement('style');
        ((e.id = 'loading-indicator-styles'),
            (e.textContent =
                "\n            .loading-indicator {\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                background: rgba(0, 0, 0, 0.9);\n                display: flex;\n                flex-direction: column;\n                justify-content: center;\n                align-items: center;\n                z-index: 9999;\n                transition: opacity 0.3s ease;\n            }\n\n            .loading-spinner {\n                width: 50px;\n                height: 50px;\n                border: 4px solid rgba(0, 255, 255, 0.3);\n                border-top-color: #0ff;\n                border-radius: 50%;\n                animation: spin 1s linear infinite;\n            }\n\n            @keyframes spin {\n                to { transform: rotate(360deg); }\n            }\n\n            .loading-message {\n                margin-top: 20px;\n                color: #0ff;\n                font-size: 18px;\n                font-family: 'Courier New', monospace;\n                text-align: center;\n            }\n\n            .error-display {\n                max-width: 600px;\n                padding: 30px;\n                background: rgba(20, 20, 20, 0.95);\n                border: 2px solid #f00;\n                border-radius: 8px;\n                color: #fff;\n                font-family: 'Courier New', monospace;\n            }\n\n            .error-title {\n                font-size: 24px;\n                color: #f00;\n                margin-bottom: 15px;\n                font-weight: bold;\n            }\n\n            .error-message {\n                font-size: 16px;\n                margin-bottom: 20px;\n                line-height: 1.5;\n            }\n\n            .error-steps {\n                margin-bottom: 20px;\n            }\n\n            .error-steps ul {\n                margin-top: 10px;\n                padding-left: 20px;\n            }\n\n            .error-steps li {\n                margin: 5px 0;\n                line-height: 1.4;\n            }\n\n            .error-details {\n                margin-bottom: 20px;\n                font-size: 12px;\n            }\n\n            .error-details summary {\n                cursor: pointer;\n                color: #0ff;\n                margin-bottom: 10px;\n            }\n\n            .error-details pre {\n                background: rgba(0, 0, 0, 0.5);\n                padding: 10px;\n                border-radius: 4px;\n                overflow-x: auto;\n                font-size: 11px;\n                max-height: 200px;\n                overflow-y: auto;\n            }\n\n            .error-retry-button {\n                background: #0ff;\n                color: #000;\n                border: none;\n                padding: 12px 30px;\n                font-size: 16px;\n                font-family: 'Courier New', monospace;\n                font-weight: bold;\n                cursor: pointer;\n                border-radius: 4px;\n                transition: all 0.2s;\n            }\n\n            .error-retry-button:hover {\n                background: #0cc;\n                transform: scale(1.05);\n            }\n\n            .error-retry-button:active {\n                transform: scale(0.95);\n            }\n        "),
            document.head.appendChild(e));
    }
};
module$9.exports = { LoadingIndicator: LoadingIndicator$2 };
const __CJS__export_default__$8 =
        (null == module$9.exports ? {} : module$9.exports).default || module$9.exports,
    __CJS__import__47__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$8 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$8 = { exports: {} };
const { logger: logger$3 } = __CJS__export_default__$1a || __CJS__import__50__;
let InitializationState$2 = class {
    constructor() {
        ((this.steps = {
            domReady: !1,
            errorHandlingInit: !1,
            compatibilityCheck: !1,
            webglCheck: !1,
            gameCreation: !1,
            rendererInit: !1,
            canvasVerification: !1,
            controlsSetup: !1,
            systemsInit: !1,
            modeSelectorReady: !1,
            gameStarted: !1,
        }),
            (this.errors = []),
            (this.startTime = null),
            (this.endTime = null),
            (this.currentStep = null),
            (this.debug = !1));
    }
    start() {
        ((this.startTime = performance.now()), this.log('Initialization started'));
    }
    completeStep(e) {
        this.steps.hasOwnProperty(e)
            ? ((this.steps[e] = !0), (this.currentStep = e), this.log(`Step completed: ${e}`))
            : logger$3.warn(`Unknown initialization step: ${e}`);
    }
    recordError(e, t) {
        const i = {
            step: e,
            error: t.message,
            name: t.name,
            recoverable: t.recoverable || !1,
            timestamp: performance.now() - (this.startTime || 0),
        };
        (this.errors.push(i), this.log(`Error in ${e}: ${t.message}`));
    }
    complete() {
        ((this.endTime = performance.now()),
            (this.steps.gameStarted = !0),
            this.log(`Initialization completed in ${this.getDuration()}ms`));
    }
    getDuration() {
        if (!this.startTime) return 0;
        const e = this.endTime || performance.now();
        return Math.round(e - this.startTime);
    }
    isStepComplete(e) {
        return !0 === this.steps[e];
    }
    getCompletedSteps() {
        return Object.keys(this.steps).filter((e) => this.steps[e]);
    }
    getIncompleteSteps() {
        return Object.keys(this.steps).filter((e) => !this.steps[e]);
    }
    getState() {
        return {
            steps: __spreadValues({}, this.steps),
            currentStep: this.currentStep,
            errors: [...this.errors],
            duration: this.getDuration(),
            isComplete: this.steps.gameStarted,
            completedCount: this.getCompletedSteps().length,
            totalSteps: Object.keys(this.steps).length,
        };
    }
    getRecoveryRecommendation() {
        const e = this.errors[this.errors.length - 1];
        if (!e) return { shouldRecover: !1, reason: 'No errors recorded' };
        if (!e.recoverable)
            return { shouldRecover: !1, reason: 'Error is not recoverable', step: e.step };
        return ['domReady', 'errorHandlingInit', 'compatibilityCheck'].includes(e.step)
            ? {
                  shouldRecover: !0,
                  reason: 'Early initialization error, retry recommended',
                  step: e.step,
                  strategy: 'retry',
              }
            : 'modeSelectorReady' === e.step
              ? {
                    shouldRecover: !0,
                    reason: 'Mode selector error, fallback available',
                    step: e.step,
                    strategy: 'fallback',
                }
              : {
                    shouldRecover: !0,
                    reason: 'Recoverable error detected',
                    step: e.step,
                    strategy: 'retry',
                };
    }
    reset() {
        (Object.keys(this.steps).forEach((e) => {
            this.steps[e] = !1;
        }),
            (this.errors = []),
            (this.startTime = null),
            (this.endTime = null),
            (this.currentStep = null),
            this.log('State reset for retry'));
    }
    log(e) {
        this.debug && logger$3.info(`[InitializationState] ${e}`);
    }
};
module$8.exports = { InitializationState: InitializationState$2 };
const __CJS__export_default__$7 =
        (null == module$8.exports ? {} : module$8.exports).default || module$8.exports,
    __CJS__import__49__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$7 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$7 = { exports: {} };
let CanvasVerifier$2 = class {
    verifyCanvasCreated(e) {
        const t = { success: !0, errors: [] };
        if (!e) return ((t.success = !1), t.errors.push('Renderer is null or undefined'), t);
        const i = e.domElement;
        return i
            ? (i.parentNode ||
                  ((t.success = !1),
                  t.errors.push('Canvas element is not attached to the DOM (no parentNode)')),
              t)
            : ((t.success = !1), t.errors.push('Canvas element does not exist on renderer'), t);
    }
    verifyCanvasVisible(e) {
        const t = { success: !0, errors: [] };
        if (!e) return ((t.success = !1), t.errors.push('Canvas element is null or undefined'), t);
        const i = window.getComputedStyle(e);
        return (
            'none' === i.display &&
                ((t.success = !1), t.errors.push('Canvas display style is "none"')),
            'hidden' === i.visibility &&
                ((t.success = !1), t.errors.push('Canvas visibility style is "hidden"')),
            null === e.offsetParent &&
                'fixed' !== i.position &&
                'absolute' !== i.position &&
                'none' !== i.display &&
                'hidden' !== i.visibility &&
                null !== e.parentNode &&
                e.parentNode !== document.body &&
                t.errors.push('Canvas offsetParent is null (element may be hidden)'),
            t
        );
    }
    verifyCanvasSize(e) {
        const t = { success: !0, errors: [], dimensions: { width: 0, height: 0 } };
        if (!e) return ((t.success = !1), t.errors.push('Canvas element is null or undefined'), t);
        const i = e.width,
            r = e.height;
        ((t.dimensions = { width: i, height: r }),
            i <= 0 &&
                ((t.success = !1), t.errors.push(`Canvas width is ${i}, must be greater than 0`)),
            r <= 0 &&
                ((t.success = !1), t.errors.push(`Canvas height is ${r}, must be greater than 0`)));
        const n = window.innerWidth,
            s = window.innerHeight,
            a = i / n,
            o = r / s;
        return (
            (a < 0.5 || a > 1.5) &&
                t.errors.push(`Canvas width (${i}) does not match viewport width (${n})`),
            (o < 0.5 || o > 1.5) &&
                t.errors.push(`Canvas height (${r}) does not match viewport height (${s})`),
            t
        );
    }
    renderTestFrame(e, t = null, i = null) {
        const r = { success: !0, errors: [] };
        if (!e) return ((r.success = !1), r.errors.push('Renderer is null or undefined'), r);
        try {
            const n = t || new THREE.Scene(),
                s =
                    i ||
                    new THREE.PerspectiveCamera(
                        75,
                        window.innerWidth / window.innerHeight,
                        0.1,
                        1e3
                    );
            if (!t) {
                const e = new THREE.BoxGeometry(1, 1, 1),
                    t = new THREE.MeshBasicMaterial({ color: 65280 }),
                    i = new THREE.Mesh(e, t);
                (n.add(i), (s.position.z = 5));
            }
            e.render(n, s);
            const a = e.getContext(),
                o = a.getError();
            o !== a.NO_ERROR &&
                ((r.success = !1), r.errors.push(`WebGL error during test render: ${o}`));
        } catch (n) {
            ((r.success = !1), r.errors.push(`Exception during test render: ${n.message}`));
        }
        return r;
    }
    verifyAll(e, t = null, i = null) {
        const r = {
            success: !0,
            checks: { created: null, visible: null, size: null, render: null },
            errors: [],
        };
        if (((r.checks.created = this.verifyCanvasCreated(e)), !r.checks.created.success))
            return ((r.success = !1), r.errors.push(...r.checks.created.errors), r);
        const n = e.domElement;
        return (
            (r.checks.visible = this.verifyCanvasVisible(n)),
            r.checks.visible.success ||
                ((r.success = !1), r.errors.push(...r.checks.visible.errors)),
            (r.checks.size = this.verifyCanvasSize(n)),
            r.checks.size.success || ((r.success = !1), r.errors.push(...r.checks.size.errors)),
            (r.checks.render = this.renderTestFrame(e, t, i)),
            r.checks.render.success || ((r.success = !1), r.errors.push(...r.checks.render.errors)),
            r
        );
    }
};
module$7.exports = { CanvasVerifier: CanvasVerifier$2 };
const __CJS__export_default__$6 =
        (null == module$7.exports ? {} : module$7.exports).default || module$7.exports,
    __CJS__import__46__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$6 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$6 = { exports: {} };
const { Logger: Logger$4 } = __CJS__export_default__$1a || __CJS__import__50__,
    { LoadingIndicator: LoadingIndicator$1 } = __CJS__export_default__$8 || __CJS__import__47__,
    { InitializationState: InitializationState$1 } =
        __CJS__export_default__$7 || __CJS__import__49__,
    { DOMNotReadyError: DOMNotReadyError$1, CanvasCreationError: CanvasCreationError$1 } =
        __CJS__export_default__$a || __CJS__import__48__,
    { BrowserCompatibility: BrowserCompatibility$1 } =
        __CJS__export_default__$h || __CJS__import__37__,
    { CompatibilityWarningUI: CompatibilityWarningUI$1 } =
        __CJS__export_default__$b || __CJS__import__42__,
    { CanvasVerifier: CanvasVerifier$1 } = __CJS__export_default__$6 || __CJS__import__46__;
let GameInitializer$1 = class {
    constructor(e) {
        ((this.recoveryManager = e),
            (this.logger = Logger$4.create('GameInitializer')),
            (this.loadingIndicator = null),
            (this.initializationState = null),
            (this.phases = []));
    }
    initialize() {
        return __async(this, null, function* () {
            try {
                ((this.initializationState = new InitializationState$1()),
                    this.initializationState.start(),
                    this.initializationState.completeStep('domReady'),
                    (this.loadingIndicator = new LoadingIndicator$1()),
                    this.loadingIndicator.show('Initializing game...'),
                    this.loadingIndicator.updateProgress('init', 'Initializing error handling...'),
                    this.recoveryManager.init(),
                    this.initializationState.completeStep('errorHandlingInit'));
                const e = {};
                return (
                    yield this.executePhase(
                        'compatibility',
                        'Checking browser compatibility...',
                        () =>
                            __async(this, null, function* () {
                                const e = this.performBrowserCompatibilityCheck();
                                if (!e.isCompatible)
                                    throw new Error('Browser compatibility check failed');
                                return e;
                            })
                    ),
                    yield this.executePhase('webgl', 'Checking WebGL support...', () =>
                        __async(this, null, function* () {
                            if (!this.checkWebGLSupport()) {
                                const e = new CanvasCreationError$1('WebGL not supported'),
                                    t = this.recoveryManager.getWebGLCompatibilityMessage();
                                throw (
                                    (e.actionableSteps = t.actionableSteps),
                                    this.recoveryManager.handleWebGLError(e),
                                    this.loadingIndicator.showError(e),
                                    e
                                );
                            }
                        })
                    ),
                    yield this.executePhase('game', 'Creating game instance...', () =>
                        __async(this, null, function* () {
                            ((e.game = yield this.recoveryManager.initializeWithRecovery('Game')),
                                (e.aiCoordinator =
                                    yield this.recoveryManager.initializeWithRecovery(
                                        'AICoordinator'
                                    )),
                                (e.collisionDetectionEngine =
                                    yield this.recoveryManager.initializeWithRecovery(
                                        'CollisionDetectionEngine'
                                    )),
                                (e.playerCollisionHandler =
                                    yield this.recoveryManager.initializeWithRecovery(
                                        'PlayerCollisionHandler'
                                    )),
                                (e.playerController =
                                    yield this.recoveryManager.initializeWithRecovery(
                                        'PlayerController'
                                    )));
                        })
                    ),
                    yield this.executePhase('renderer', 'Initializing 3D renderer...', () =>
                        __async(this, null, function* () {
                            if (
                                ((e.renderingEngine =
                                    yield this.recoveryManager.initializeWithRecovery(
                                        'RenderingEngine'
                                    )),
                                !(
                                    e.renderingEngine &&
                                    e.renderingEngine.renderer &&
                                    e.renderingEngine.scene &&
                                    e.renderingEngine.camera
                                ))
                            ) {
                                throw new CanvasCreationError$1(
                                    'Failed to initialize rendering engine'
                                );
                            }
                        })
                    ),
                    yield this.executePhase('canvas', 'Verifying canvas...', () =>
                        __async(this, null, function* () {
                            const t = new CanvasVerifier$1().verifyAll(
                                e.renderingEngine.renderer,
                                e.renderingEngine.scene,
                                e.renderingEngine.camera
                            );
                            if (
                                (this.logger.info('Canvas verification results:', {
                                    success: t.success,
                                    checks: {
                                        created: t.checks.created.success,
                                        visible: t.checks.visible.success,
                                        size: t.checks.size.success,
                                        render: t.checks.render.success,
                                    },
                                    errors: t.errors,
                                }),
                                !t.success)
                            ) {
                                const e =
                                    'Canvas verification failed:\n' +
                                    t.errors.map((e) => `  - ${e}`).join('\n');
                                throw new CanvasCreationError$1(e, t);
                            }
                        })
                    ),
                    {
                        success: !0,
                        components: e,
                        loadingIndicator: this.loadingIndicator,
                        initializationState: this.initializationState,
                    }
                );
            } catch (e) {
                if (
                    (this.logger.error('Game initialization failed:', e), this.initializationState)
                ) {
                    (this.initializationState.recordError(
                        this.initializationState.currentStep || 'unknown',
                        e
                    ),
                        this.logger.info(
                            'Initialization state at failure:',
                            this.initializationState.getState()
                        ));
                    const t = this.initializationState.getRecoveryRecommendation();
                    this.logger.info('Recovery recommendation:', t);
                }
                return (
                    this.loadingIndicator
                        ? this.loadingIndicator.showError(e, () => {
                              window.location.reload();
                          })
                        : this.recoveryManager &&
                          this.recoveryManager.handleInitializationError(
                              e,
                              () => {
                                  window.location.reload();
                              },
                              'Game'
                          ),
                    { success: !1, error: e }
                );
            }
        });
    }
    executePhase(e, t, i) {
        return __async(this, null, function* () {
            this.loadingIndicator.updateProgress(e, t);
            const r = yield i();
            return (this.initializationState.completeStep(e), r);
        });
    }
    getInitializationState() {
        return this.initializationState ? this.initializationState.getState() : null;
    }
    checkWebGLSupport() {
        try {
            const e = document.createElement('canvas');
            return !(
                !(e.getContext('webgl') || e.getContext('experimental-webgl')) ||
                !window.WebGLRenderingContext
            );
        } catch (e) {
            return (this.logger.warn('WebGL context creation failed:', e), !1);
        }
    }
    performBrowserCompatibilityCheck() {
        const e = sessionStorage.getItem('lightbikes_compatibility_acknowledged'),
            t = new BrowserCompatibility$1().checkCompatibility();
        if ((this.logger.info('Browser Compatibility Check:', t), !t.isCompatible)) {
            const e = new CompatibilityWarningUI$1();
            if (t.errors.length > 0) return (e.showWarning(t), { isCompatible: !1, report: t });
        }
        if (t.warnings.length > 0 && !e) {
            new CompatibilityWarningUI$1().showWarning(t);
        }
        return { isCompatible: !0, report: t };
    }
};
module$6.exports = { GameInitializer: GameInitializer$1 };
const __CJS__export_default__$5 =
        (null == module$6.exports ? {} : module$6.exports).default || module$6.exports,
    __CJS__import__44__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$5 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$5 = { exports: {} };
class GlowSettingsUI {
    constructor(e, t) {
        ((this.glowSettings = e),
            (this.glowEffectManager = t),
            (this.settingsButton = null),
            (this.settingsPanel = null),
            (this.intensityButtons = []),
            (this.previewLevel = null),
            (this.currentIntensityLabel = null),
            (this._isVisible = !1),
            this.initializeUI());
    }
    initializeUI() {
        ((this.settingsButton = document.getElementById('glowSettingsButton')),
            (this.settingsPanel = document.getElementById('glowSettingsPanel')),
            (this.previewLevel = document.getElementById('glowPreviewLevel')),
            (this.currentIntensityLabel = document.getElementById('currentIntensityLabel')),
            (this.intensityButtons = Array.from(document.querySelectorAll('.glow-intensity-btn'))),
            this.setupEventListeners(),
            this.updateUI());
    }
    setupEventListeners() {
        (this.settingsButton &&
            this.settingsButton.addEventListener('click', () => {
                this.togglePanel();
            }),
            this.intensityButtons.forEach((e) => {
                e.addEventListener('click', () => {
                    const t = e.dataset.intensity;
                    this.setIntensity(t);
                });
            }));
        const e = document.getElementById('closeGlowSettings');
        e &&
            e.addEventListener('click', () => {
                this.hidePanel();
            });
        const t = document.getElementById('resetGlowSettings');
        (t &&
            t.addEventListener('click', () => {
                this.resetSettings();
            }),
            document.addEventListener('click', (e) => {
                const t = e.target;
                !this._isVisible ||
                    this.settingsPanel.contains(t) ||
                    this.settingsButton.contains(t) ||
                    this.hidePanel();
            }),
            document.addEventListener('keydown', (e) => {
                'Escape' === e.key && this._isVisible && this.hidePanel();
            }));
    }
    togglePanel() {
        this._isVisible ? this.hidePanel() : this.showPanel();
    }
    showPanel() {
        this.settingsPanel &&
            ((this.settingsPanel.style.display = 'block'),
            (this._isVisible = !0),
            this.settingsButton && this.settingsButton.classList.add('active'),
            this.updateUI());
    }
    hidePanel() {
        this.settingsPanel &&
            ((this.settingsPanel.style.display = 'none'),
            (this._isVisible = !1),
            this.settingsButton && this.settingsButton.classList.remove('active'));
    }
    setIntensity(e) {
        this.glowSettings.setIntensity(e) &&
            (this.glowEffectManager && this.glowEffectManager.setIntensity(e), this.updateUI());
    }
    resetSettings() {
        (this.glowSettings.resetToDefaults(),
            this.glowEffectManager &&
                this.glowEffectManager.setIntensity(this.glowSettings.getIntensity()),
            this.updateUI());
    }
    updateUI() {
        const e = this.glowSettings.getIntensity(),
            t = this.glowSettings.getIntensityConfig();
        (this.intensityButtons.forEach((t) => {
            t.dataset.intensity === e ? t.classList.add('active') : t.classList.remove('active');
        }),
            this.updatePreview(e, t),
            this.updateButtonState(e));
    }
    updatePreview(e, t) {
        if (!this.previewLevel || !this.currentIntensityLabel) return;
        this.currentIntensityLabel.textContent = t.label;
        let i = 0;
        switch (e) {
            case 'OFF':
                i = 0;
                break;
            case 'LOW':
                i = 25;
                break;
            case 'MEDIUM':
                i = 60;
                break;
            case 'HIGH':
                i = 100;
        }
        if (((this.previewLevel.style.width = `${i}%`), 'OFF' === e))
            this.previewLevel.style.boxShadow = 'none';
        else {
            const e = 0.5 * t.bloom;
            this.previewLevel.style.boxShadow = `0 0 ${10 + 5 * e}px rgba(0, 255, 255, ${e})`;
        }
    }
    updateButtonState(e) {
        this.settingsButton &&
            ('OFF' === e
                ? ((this.settingsButton.style.opacity = '0.6'),
                  (this.settingsButton.title = 'Glow Effects Settings (Currently Off)'))
                : ((this.settingsButton.style.opacity = '1.0'),
                  (this.settingsButton.title = `Glow Effects Settings (${this.glowSettings.getIntensityLabel()})`)));
    }
    isVisible() {
        return this._isVisible;
    }
    updateFromExternal(e) {
        this.updateUI();
    }
    handleResize() {
        if (this._isVisible && this.settingsPanel) {
            const e = this.settingsPanel.getBoundingClientRect(),
                t = window.innerWidth,
                i = window.innerHeight;
            (e.right > t && (this.settingsPanel.style.left = t - e.width - 20 + 'px'),
                e.bottom > i && (this.settingsPanel.style.top = i - e.height - 20 + 'px'));
        }
    }
    destroy() {
        (this.settingsButton && this.settingsButton.removeEventListener('click', this.togglePanel),
            this.intensityButtons.forEach((e) => {
                e.removeEventListener('click', this.setIntensity);
            }),
            (this.glowSettings = null),
            (this.glowEffectManager = null),
            (this.settingsButton = null),
            (this.settingsPanel = null),
            (this.intensityButtons = []),
            (this.previewLevel = null),
            (this.currentIntensityLabel = null));
    }
}
module$5.exports = { GlowSettingsUI: GlowSettingsUI };
const __CJS__export_default__$4 =
        (null == module$5.exports ? {} : module$5.exports).default || module$5.exports,
    __CJS__import__32__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$4 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$4 = { exports: {} };
const { Logger: Logger$3 } = __CJS__export_default__$1a || __CJS__import__50__,
    { Game: Game$1 } = __CJS__export_default__$13 || __CJS__import__0__$4,
    { AICoordinator: AICoordinator$1 } = __CJS__export_default__$$ || __CJS__import__2__$4,
    { CollisionDetectionEngine: CollisionDetectionEngine$1 } =
        __CJS__export_default__$_ || __CJS__import__3__$2,
    { PlayerCollisionHandler: PlayerCollisionHandler$1 } =
        __CJS__export_default__$Z || __CJS__import__4__$1,
    { PlayerController: PlayerController$1 } = __CJS__export_default__$X || __CJS__import__5__$1,
    { RenderingEngine: RenderingEngine$1 } = __CJS__export_default__$S || __CJS__import__7__,
    { ScoreDisplay: ScoreDisplay$1 } = __CJS__export_default__$R || __CJS__import__9__,
    { AudioManager: AudioManager$1 } = __CJS__export_default__$1d || __CJS__import__10__,
    { DifficultyManager: DifficultyManager$1 } = __CJS__export_default__$Q || __CJS__import__11__,
    { PowerUpManager: PowerUpManager$1 } = __CJS__export_default__$P || __CJS__import__12__,
    { StatusIndicator: StatusIndicator$1 } = __CJS__export_default__$O || __CJS__import__13__,
    { ModeSelector: ModeSelector$1 } = __CJS__export_default__$N || __CJS__import__14__,
    { SurvivalTimer: SurvivalTimer$1 } = __CJS__export_default__$16 || __CJS__import__15__,
    { CountdownTimer: CountdownTimer$1 } = __CJS__export_default__$M || __CJS__import__16__,
    { LeaderboardSystem: LeaderboardSystem$1 } = __CJS__export_default__$L || __CJS__import__17__,
    { AchievementSystem: AchievementSystem$1 } = __CJS__export_default__$K || __CJS__import__18__,
    { PerformanceMonitor: PerformanceMonitor$1 } =
        __CJS__export_default__$1c || __CJS__import__20__,
    { PerformanceDegradationManager: PerformanceDegradationManager$1 } =
        __CJS__export_default__$I || __CJS__import__21__,
    { ParticleSystem: ParticleSystem$1 } = __CJS__export_default__$1b || __CJS__import__22__,
    { ParticleSettingsUI: ParticleSettingsUI$1 } = __CJS__export_default__$G || __CJS__import__23__,
    { GlowEffectManager: GlowEffectManager$1 } = __CJS__export_default__$C || __CJS__import__24__,
    { CameraEffectsManager: CameraEffectsManager$1 } =
        __CJS__export_default__$w || __CJS__import__25__,
    { CameraEffectsUI: CameraEffectsUI$1 } = __CJS__export_default__$u || __CJS__import__26__,
    { CustomizationManager: CustomizationManager$1 } =
        __CJS__export_default__$s || __CJS__import__27__,
    { CustomizationUI: CustomizationUI$1 } = __CJS__export_default__$q || __CJS__import__28__,
    { PreferenceStorage: PreferenceStorage$1 } = __CJS__export_default__$p || __CJS__import__29__,
    { MusicSettingsUI: MusicSettingsUI$1 } = __CJS__export_default__$o || __CJS__import__30__,
    { UIManager: UIManager$1 } = __CJS__export_default__$l || __CJS__import__33__,
    { GameOverUI: GameOverUI$1 } = __CJS__export_default__$k || __CJS__import__34__,
    { ModeUI: ModeUI$1 } = __CJS__export_default__$j || __CJS__import__35__,
    { StyleManager: StyleManager$1 } = __CJS__export_default__$i || __CJS__import__36__;
let SystemInitializer$1 = class {
    constructor(e, t) {
        ((this.recoveryManager = e),
            (this.coreComponents = t),
            (this.logger = Logger$3.create('SystemInitializer')),
            (this.systems = {}));
    }
    registerRecoveryStrategies() {
        const {
            game: e,
            renderingEngine: t,
            collisionDetectionEngine: i,
            playerCollisionHandler: r,
        } = this.coreComponents;
        (this.recoveryManager.registerStrategy('Game', {
            initialize: () =>
                __async(this, null, function* () {
                    return new Game$1();
                }),
            critical: !0,
            maxRetries: 3,
        }),
            this.recoveryManager.registerStrategy('AICoordinator', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new AICoordinator$1();
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('CollisionDetectionEngine', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new CollisionDetectionEngine$1();
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('PlayerCollisionHandler', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new PlayerCollisionHandler$1();
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('PlayerController', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new PlayerController$1(e);
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('RenderingEngine', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new RenderingEngine$1(e.bounds);
                    }),
                fallback: () =>
                    __async(this, null, function* () {
                        this.logger.warn('Using simplified rendering mode');
                        const t = new RenderingEngine$1(e.bounds);
                        return (t.renderer && t.renderer.setPixelRatio(1), t);
                    }),
                critical: !0,
                maxRetries: 2,
            }),
            this.recoveryManager.registerStrategy('ScoreDisplay', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new ScoreDisplay$1(t);
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('AudioManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new AudioManager$1();
                    }),
                fallback: () =>
                    __async(this, null, function* () {
                        this.logger.warn('Audio system unavailable, continuing without sound');
                        const e = new AudioManager$1();
                        return (e.setMuted(!0), e);
                    }),
                critical: !1,
                maxRetries: 2,
            }),
            this.recoveryManager.registerStrategy('DifficultyManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new DifficultyManager$1(e, null);
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('PowerUpManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new PowerUpManager$1(e, t, i, this.systems.audioManager);
                    }),
                fallback: () =>
                    __async(this, null, function* () {
                        this.logger.warn('Power-ups disabled due to initialization error');
                        const r = new PowerUpManager$1(e, t, i, this.systems.audioManager);
                        return ((r.enabled = !1), r);
                    }),
                critical: !1,
                maxRetries: 2,
            }),
            this.recoveryManager.registerStrategy('PerformanceMonitor', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new PerformanceMonitor$1();
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('PerformanceDegradationManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new PerformanceDegradationManager$1(
                            e,
                            this.systems.performanceMonitor
                        );
                    }),
                critical: !0,
                maxRetries: 3,
            }),
            this.recoveryManager.registerStrategy('CameraEffectsManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        const i = new CameraEffectsManager$1(
                            t.camera,
                            t.renderer,
                            e.getGameState()
                        );
                        if (!i.initialize())
                            throw new Error('Camera effects initialization failed');
                        return i;
                    }),
                critical: !1,
                maxRetries: 1,
            }),
            this.recoveryManager.registerStrategy('StatusIndicator', {
                initialize: () =>
                    __async(this, null, function* () {
                        return new StatusIndicator$1();
                    }),
                critical: !1,
                maxRetries: 1,
            }),
            this.recoveryManager.registerStrategy('GlowEffectManager', {
                initialize: () =>
                    __async(this, null, function* () {
                        const e = new GlowEffectManager$1(t.renderer, t.scene, t.camera);
                        if (!e.initialize()) throw new Error('Glow effects initialization failed');
                        return e;
                    }),
                critical: !1,
                maxRetries: 1,
            }));
    }
    initializeGameSystemsWithRecovery() {
        return __async(this, null, function* () {
            const {
                game: e,
                renderingEngine: t,
                collisionDetectionEngine: i,
                playerCollisionHandler: r,
            } = this.coreComponents;
            ((this.systems.scoreDisplay =
                yield this.recoveryManager.initializeWithRecovery('ScoreDisplay')),
                (this.systems.cameraEffectsManager =
                    yield this.recoveryManager.initializeWithRecovery('CameraEffectsManager')),
                this.systems.cameraEffectsManager ||
                    this.logger.info('Camera effects disabled, continuing without them'),
                (this.systems.audioManager =
                    yield this.recoveryManager.initializeWithRecovery('AudioManager')),
                (this.systems.difficultyManager =
                    yield this.recoveryManager.initializeWithRecovery('DifficultyManager')),
                (this.systems.powerUpManager =
                    yield this.recoveryManager.initializeWithRecovery('PowerUpManager')),
                (this.systems.powerUpManager && !1 !== this.systems.powerUpManager.enabled) ||
                    this.logger.info('Power-ups disabled, continuing without them'),
                (this.systems.statusIndicator =
                    yield this.recoveryManager.initializeWithRecovery('StatusIndicator')),
                this.systems.statusIndicator ||
                    this.logger.info('Status indicator disabled, continuing without it'),
                (this.systems.glowEffectManager =
                    yield this.recoveryManager.initializeWithRecovery('GlowEffectManager')),
                this.systems.glowEffectManager ||
                    this.logger.info('Glow effects disabled, continuing without them'),
                (this.systems.performanceMonitor =
                    yield this.recoveryManager.initializeWithRecovery('PerformanceMonitor')),
                (this.systems.performanceDegradationManager =
                    yield this.recoveryManager.initializeWithRecovery(
                        'PerformanceDegradationManager'
                    )));
            let n = 1;
            try {
                const e = localStorage.getItem('lightbikes_ai_count');
                if (null !== e) {
                    const t = parseInt(e);
                    !isNaN(t) && t >= 1 && t <= 4 && (n = t);
                }
            } catch (a) {
                this.logger.warn('Failed to load AI count from localStorage:', a);
            }
            try {
                ((this.systems.modeSelector = new ModeSelector$1(e)),
                    (this.systems.survivalTimer = new SurvivalTimer$1()),
                    (this.systems.countdownTimer = new CountdownTimer$1()),
                    (this.systems.leaderboardSystem = new LeaderboardSystem$1()),
                    (this.systems.achievementSystem = new AchievementSystem$1()),
                    this.logger.info('Game modes initialized successfully'));
            } catch (a) {
                throw (this.logger.error('Failed to initialize game modes:', a), a);
            }
            (e.setPowerUpManager(this.systems.powerUpManager),
                i.setPowerUpManager(this.systems.powerUpManager),
                r.setPowerUpManager(this.systems.powerUpManager),
                i.setCameraEffectsManager(this.systems.cameraEffectsManager),
                r.setCameraEffectsManager(this.systems.cameraEffectsManager),
                e.setCameraEffectsManager(this.systems.cameraEffectsManager),
                t.setCameraEffectsManager(this.systems.cameraEffectsManager),
                (this.systems.particleSettingsUI = new ParticleSettingsUI$1()));
            try {
                if (
                    ((this.systems.cameraEffectsUI = new CameraEffectsUI$1()),
                    this.systems.cameraEffectsManager && this.systems.cameraEffectsUI)
                ) {
                    const e = this.systems.cameraEffectsUI.getConfigManager();
                    e.addChangeListener((e) => {
                        this.systems.cameraEffectsManager.updateSettings(e);
                    });
                    const t = e.getEffectiveSettings();
                    this.systems.cameraEffectsManager.updateSettings(t);
                }
            } catch (a) {
                this.logger.error('Failed to initialize camera effects UI:', a);
                const e = document.getElementById('cameraEffectsButton');
                e && (e.style.display = 'none');
            }
            try {
                const { GlowSettingsUI: e } = __CJS__export_default__$4 || __CJS__import__32__;
                this.systems.glowEffectManager && this.systems.glowEffectManager.settings
                    ? (this.systems.glowSettingsUI = new e(
                          this.systems.glowEffectManager.settings,
                          this.systems.glowEffectManager
                      ))
                    : this.logger.warn(
                          'Glow effect manager not properly initialized, glow settings UI disabled'
                      );
            } catch (a) {
                this.logger.error('Failed to initialize glow settings UI:', a);
                const e = document.getElementById('glowSettingsButton');
                e && (e.style.display = 'none');
            }
            try {
                const e = new PreferenceStorage$1();
                ((this.systems.customizationManager = new CustomizationManager$1(t, e)),
                    (this.systems.customizationUI = new CustomizationUI$1(
                        this.systems.customizationManager
                    )),
                    this.logger.info('Customization system successfully initialized'));
            } catch (a) {
                this.logger.error('Failed to initialize customization system:', a);
                const e = document.getElementById('customizationButton');
                e && (e.style.display = 'none');
            }
            try {
                ((this.systems.musicSettingsUI = new MusicSettingsUI$1(this.systems.audioManager)),
                    this.logger.info('Music settings UI successfully initialized'));
            } catch (a) {
                this.logger.error('Failed to initialize music settings UI:', a);
                const e = document.getElementById('musicSettingsButton');
                e && (e.style.display = 'none');
            }
            try {
                ((this.systems.styleManager = new StyleManager$1()),
                    (this.systems.modeUI = new ModeUI$1()),
                    (this.systems.gameOverUI = new GameOverUI$1()),
                    (this.systems.uiManager = new UIManager$1()),
                    this.systems.modeUI.initialize({
                        styleManager: this.systems.styleManager,
                        game: e,
                        survivalTimer: this.systems.survivalTimer,
                    }),
                    this.systems.gameOverUI.initialize({
                        styleManager: this.systems.styleManager,
                        multiplayerGameOverUI: null,
                        localScoringUI: null,
                        scoreDisplay: this.systems.scoreDisplay,
                        survivalTimer: this.systems.survivalTimer,
                        leaderboardSystem: this.systems.leaderboardSystem,
                        hideRemainingEntitiesDisplay: () =>
                            this.systems.modeUI.hideRemainingEntitiesDisplay(),
                        showModeSelector: () => this.systems.modeSelector.show(),
                        game: e,
                    }),
                    this.systems.uiManager.initialize({
                        gameOverUI: this.systems.gameOverUI,
                        modeUI: this.systems.modeUI,
                        styleManager: this.systems.styleManager,
                    }),
                    this.logger.info('UI management system successfully initialized'));
            } catch (a) {
                this.logger.error('Failed to initialize UI management system:', a);
            }
            const s = this.systems.particleSettingsUI.getParticleSystemSettings();
            return (
                t.initializeParticleSystem(ParticleSystem$1, s),
                this.systems.customizationManager &&
                    this.systems.customizationManager.applyPendingPreferences(),
                this.systems.particleSettingsUI.addExternalListener((e, i) => {
                    const r = this.systems.particleSettingsUI.getParticleSystemSettings(),
                        n = t.getParticleSystem();
                    if (n)
                        if ('enabled' === e) n.setEnabled(i);
                        else if ('quality' === e) n.setQualityLevel(i);
                        else if (e.startsWith('effects.')) {
                            const t = e.split('.')[1];
                            n.setEffectEnabled(t, i);
                        } else
                            'performance.maxParticles' === e || 'advanced.particleDensity' === e
                                ? n.setMaxParticles(r.maxParticles)
                                : 'performance.adaptiveQuality' === e
                                  ? n.setAdaptiveQuality(i)
                                  : ('bulk' !== e && 'reset' !== e) ||
                                    t.reinitializeParticleSystem(r);
                }),
                (this.systems.currentAICount = n),
                this.systems
            );
        });
    }
    getSystems() {
        return this.systems;
    }
};
module$4.exports = { SystemInitializer: SystemInitializer$1 };
const __CJS__export_default__$3 =
        (null == module$4.exports ? {} : module$4.exports).default || module$4.exports,
    __CJS__import__45__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$3 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$3 = { exports: {} };
const { GameModes: GameModes$2 } = __CJS__export_default__$17 || __CJS__import__19__,
    state = {
        errorHandler: null,
        errorRecovery: null,
        loadingIndicator: null,
        errorRecoveryStrategies: null,
        initializationState: null,
        game: null,
        aiCoordinator: null,
        collisionDetectionEngine: null,
        playerCollisionHandler: null,
        playerController: null,
        renderingEngine: null,
        scoreDisplay: null,
        cameraEffectsManager: null,
        audioManager: null,
        difficultyManager: null,
        powerUpManager: null,
        statusIndicator: null,
        glowEffectManager: null,
        performanceMonitor: null,
        performanceDegradationManager: null,
        modeSelector: null,
        survivalTimer: null,
        countdownTimer: null,
        leaderboardSystem: null,
        achievementSystem: null,
        particleSettingsUI: null,
        cameraEffectsUI: null,
        glowSettingsUI: null,
        customizationManager: null,
        customizationUI: null,
        musicSettingsUI: null,
        multiplayerGame: null,
        dualControlScheme: null,
        splitScreenCamera: null,
        aiControllers: [],
        currentAICount: 1,
        currentGameMode: GameModes$2.CLASSIC,
        isTimeTrialActive: !1,
    };
module$3.exports = state;
const __CJS__export_default__$2 =
        (null == module$3.exports ? {} : module$3.exports).default || module$3.exports,
    __CJS__import__51__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$2 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$2 = { exports: {} };
const { Logger: Logger$2 } = __CJS__export_default__$1a || __CJS__import__50__,
    logger$2 = Logger$2.create('EventManager');
let EventManager$1 = class {
    constructor(e) {
        ((this.game = e.game),
            (this.playerController = e.playerController),
            (this.audioManager = e.audioManager),
            (this.renderingEngine = e.renderingEngine),
            (this.glowEffectManager = e.glowEffectManager),
            (this.cameraEffectsManager = e.cameraEffectsManager),
            (this.difficultyManager = e.difficultyManager),
            (this.performanceDegradationManager = e.performanceDegradationManager),
            (this.restartGame = e.restartGame),
            (this.updatePauseOverlay = e.updatePauseOverlay),
            (this.updateMuteButton = e.updateMuteButton),
            (this.updatePerformanceButton = e.updatePerformanceButton),
            (this.setAICount = e.setAICount),
            (this.updateAICountUI = e.updateAICountUI),
            (this.updateDifficultyUI = e.updateDifficultyUI),
            (this.listeners = []),
            (this.audioInitialized = !1));
    }
    registerAll() {
        (this.registerGameControls(), this.registerUIControls(), this.registerWindowEvents());
    }
    registerGameControls() {
        (this.playerController.init(),
            this.registerTouchControl('up', 'ArrowUp'),
            this.registerTouchControl('down', 'ArrowDown'),
            this.registerTouchControl('left', 'ArrowLeft'),
            this.registerTouchControl('right', 'ArrowRight'));
    }
    registerUIControls() {
        (this.registerButtonClick('restart', () => {
            this.restartGame();
        }),
            this.registerButtonClick('resumeButton', () => {
                this.game.resume()
                    ? (this.updatePauseOverlay(),
                      this.glowEffectManager &&
                          this.glowEffectManager.initialized &&
                          this.glowEffectManager.forceResume(),
                      this.cameraEffectsManager &&
                          this.cameraEffectsManager.isEnabled() &&
                          this.cameraEffectsManager.resume())
                    : logger$2.debug('Resume operation failed - game may be in invalid state');
            }),
            this.registerButtonClick('muteButton', () => {
                const e = this.audioManager.getMuted();
                (this.audioManager.setMuted(!e), this.updateMuteButton());
            }),
            this.registerButtonClick('performanceButton', () => {
                const e = this.performanceDegradationManager.getSettings().performanceModeEnabled;
                (this.performanceDegradationManager.setPerformanceMode(!e),
                    this.updatePerformanceButton());
            }),
            this.registerAICountButtons(),
            this.registerDifficultyButtons(),
            this.registerAudioInitialization());
    }
    registerWindowEvents() {
        const e = () => {
            this.renderingEngine &&
                (this.renderingEngine.renderer.setSize(window.innerWidth, window.innerHeight),
                (this.renderingEngine.camera.aspect = window.innerWidth / window.innerHeight),
                this.renderingEngine.camera.updateProjectionMatrix(),
                this.glowEffectManager &&
                    this.glowEffectManager.handleResize(window.innerWidth, window.innerHeight));
        };
        (window.addEventListener('resize', e),
            this.listeners.push({ element: window, event: 'resize', handler: e }));
        const t = () => {
            try {
                this.audioManager && this.audioManager.cleanup();
            } catch (e) {
                logger$2.warn('Error during music system cleanup:', e);
            }
        };
        (window.addEventListener('beforeunload', t),
            this.listeners.push({ element: window, event: 'beforeunload', handler: t }));
    }
    registerButtonClick(e, t) {
        const i = document.getElementById(e);
        i &&
            (i.addEventListener('click', t),
            this.listeners.push({ element: i, event: 'click', handler: t }));
    }
    registerTouchControl(e, t) {
        const i = document.getElementById(e);
        if (i) {
            const e = () => {
                this.game.changePlayerDirection(t) && this.audioManager.playTurnSound();
            };
            (i.addEventListener('touchstart', e),
                this.listeners.push({ element: i, event: 'touchstart', handler: e }));
        }
    }
    registerAICountButtons() {
        document.querySelectorAll('.ai-count-btn').forEach((e) => {
            const t = () => {
                const t = parseInt(e.getAttribute('data-count'));
                (this.setAICount(t), this.updateAICountUI());
            };
            (e.addEventListener('click', t),
                this.listeners.push({ element: e, event: 'click', handler: t }));
        });
    }
    registerDifficultyButtons() {
        document.querySelectorAll('.difficulty-btn').forEach((e) => {
            const t = () => {
                const t = e.getAttribute('data-level');
                (this.difficultyManager.setDifficulty(t), this.updateDifficultyUI());
            };
            (e.addEventListener('click', t),
                this.listeners.push({ element: e, event: 'click', handler: t }));
        });
    }
    registerAudioInitialization() {
        const e = () =>
            __async(this, null, function* () {
                if (!this.audioInitialized) {
                    this.audioInitialized = !0;
                    (yield this.audioManager.initialize()) && this.audioManager.isMusicAvailable()
                        ? logger$2.info('Music system ready for playback')
                        : logger$2.warn(
                              'Music system not available, continuing without background music'
                          );
                }
            });
        (document.addEventListener('click', e, { once: !0 }),
            document.addEventListener('keydown', e, { once: !0 }),
            document.addEventListener('touchstart', e, { once: !0 }));
    }
    unregisterAll() {
        (this.listeners.forEach(({ element: e, event: t, handler: i }) => {
            e.removeEventListener(t, i);
        }),
            (this.listeners = []));
    }
};
module$2.exports = { EventManager: EventManager$1 };
const __CJS__export_default__$1 =
        (null == module$2.exports ? {} : module$2.exports).default || module$2.exports,
    __CJS__import__52__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__$1 },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    );
var module$1 = { exports: {} };
const { Logger: Logger$1 } = __CJS__export_default__$1a || __CJS__import__50__,
    { GameModes: GameModes$1 } = __CJS__export_default__$17 || __CJS__import__19__,
    logger$1 = Logger$1.create('GameLoop');
let GameLoop$1 = class {
    constructor(e) {
        ((this.game = e.game),
            (this.renderingEngine = e.renderingEngine),
            (this.performanceMonitor = e.performanceMonitor),
            (this.performanceDegradationManager = e.performanceDegradationManager),
            (this.glowEffectManager = e.glowEffectManager),
            (this.cameraEffectsManager = e.cameraEffectsManager),
            (this.powerUpManager = e.powerUpManager),
            (this.statusIndicator = e.statusIndicator),
            (this.audioManager = e.audioManager),
            (this.scoreDisplay = e.scoreDisplay),
            (this.survivalTimer = e.survivalTimer),
            (this.leaderboardSystem = e.leaderboardSystem),
            (this.achievementSystem = e.achievementSystem),
            (this.localScoringUI = e.localScoringUI),
            (this.splitScreenCamera = e.splitScreenCamera),
            (this.collisionDetectionEngine = e.collisionDetectionEngine),
            (this.playerCollisionHandler = e.playerCollisionHandler),
            (this.recoveryManager = e.recoveryManager),
            (this.uiManager = e.uiManager),
            (this.gameOverUI = e.gameOverUI),
            (this.modeUI = e.modeUI),
            (this.aiCoordinator = e.aiCoordinator),
            (this.difficultyManager = e.difficultyManager),
            (this.updatePauseOverlay = e.updatePauseOverlay),
            (this.updateTimeTrialDisplay = e.updateTimeTrialDisplay),
            (this.updateArenaShrinkDisplay = e.updateArenaShrinkDisplay),
            (this.updateRemainingEntityDisplay = e.updateRemainingEntityDisplay),
            (this.showMultiplayerGameOver = e.showMultiplayerGameOver),
            (this.showTimeTrialGameOver = e.showTimeTrialGameOver),
            (this.showArenaShrinkGameOver = e.showArenaShrinkGameOver),
            (this.showMultiAIGameOver = e.showMultiAIGameOver),
            (this.calculateMultiAIDirections = e.calculateMultiAIDirections),
            (this.applyAIDecisions = e.applyAIDecisions),
            (this.handleMultiAICollisions = e.handleMultiAICollisions),
            (this.currentGameMode = e.currentGameMode || GameModes$1.CLASSIC),
            (this.isTimeTrialActive = e.isTimeTrialActive || !1),
            (this.aiControllers = e.aiControllers || []),
            (this.running = !1),
            (this.animationFrameId = null),
            (this.previousGameState = null));
    }
    start() {
        this.running || ((this.running = !0), this.animate());
    }
    stop() {
        ((this.running = !1),
            this.animationFrameId &&
                (cancelAnimationFrame(this.animationFrameId), (this.animationFrameId = null)));
    }
    setMode(e, t = !1) {
        ((this.currentGameMode = e), (this.isTimeTrialActive = t));
    }
    animate() {
        if (!this.running) return;
        if (
            ((this.animationFrameId = requestAnimationFrame(() => this.animate())),
            this.performanceMonitor &&
                !this.recoveryManager.isFeatureDisabled('PerformanceMonitor'))
        )
            try {
                this.performanceMonitor.startFrameMonitoring();
            } catch (i) {
                this.recoveryManager.handleFeatureRuntimeError('PerformanceMonitor', i, null);
            }
        const e = this.game.getGameState(),
            t =
                this.performanceMonitor && this.performanceMonitor.getLastFrameTime
                    ? this.performanceMonitor.getLastFrameTime() / 1e3
                    : 0.016;
        if (this.glowEffectManager && !this.recoveryManager.isFeatureDisabled('GlowEffectManager'))
            try {
                this.glowEffectManager.update(t, e);
            } catch (i) {
                this.recoveryManager.handleFeatureRuntimeError('GlowEffectManager', i, () => {
                    this.glowEffectManager = null;
                });
            }
        if (
            this.cameraEffectsManager &&
            !this.recoveryManager.isFeatureDisabled('CameraEffectsManager')
        )
            try {
                this.cameraEffectsManager.update(t);
            } catch (i) {
                this.recoveryManager.handleFeatureRuntimeError('CameraEffectsManager', i, () => {
                    this.cameraEffectsManager = null;
                });
            }
        if (
            (this.game.gameOver ? this.handleGameOver() : this.updateGameplay(e),
            this.performanceMonitor &&
                !this.recoveryManager.isFeatureDisabled('PerformanceMonitor'))
        )
            try {
                this.performanceMonitor.update();
            } catch (i) {
                this.recoveryManager.handleFeatureRuntimeError('PerformanceMonitor', i, null);
            }
        if (
            this.performanceDegradationManager &&
            !this.recoveryManager.isFeatureDisabled('PerformanceDegradationManager')
        )
            try {
                this.performanceDegradationManager.update();
            } catch (i) {
                this.recoveryManager.handleFeatureRuntimeError(
                    'PerformanceDegradationManager',
                    i,
                    null
                );
            }
        this.previousGameState = __spreadValues({}, e);
    }
    updateGameplay(e) {
        if ((this.handlePauseState(e), !e.isPaused)) {
            if (
                (!e.gameStarted ||
                    (this.previousGameState && this.previousGameState.gameStarted) ||
                    this.audioManager.handleGameStart(),
                !this.isTimeTrialActive &&
                    this.currentGameMode !== GameModes$1.LOCAL_MULTIPLAYER &&
                    e.aiOpponents &&
                    e.aiOpponents.length > 0)
            ) {
                const t = this.difficultyManager.getDifficultyConfig(),
                    i = this.calculateMultiAIDirections(e, t);
                this.applyAIDecisions(i, this.game);
            }
            if (
                (this.game.update(),
                this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER &&
                    this.splitScreenCamera &&
                    this.splitScreenCamera.update(),
                this.powerUpManager.update(),
                this.powerUpManager.checkCollections(e),
                this.isTimeTrialActive && !e.isPaused)
            ) {
                const e = this.survivalTimer.getElapsedTime() / 1e3;
                this.achievementSystem.checkMilestone(e);
            }
            this.handleCollisions(e);
        }
        (this.updateUI(e), this.render(e));
    }
    handleCollisions(e) {
        let t;
        (this.performanceMonitor && this.performanceMonitor.startCollisionDetection(),
            this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER
                ? ((t = this.playerCollisionHandler.checkMultiplayerCollisions(e, this.game)),
                  (t.playerCollided = t.player1Collided || t.player2Collided),
                  (t.aiCollided = !1),
                  t.crashedEntities ||
                      ((t.crashedEntities = []),
                      t.player1Collided && t.crashedEntities.push('P1'),
                      t.player2Collided && t.crashedEntities.push('P2')),
                  t.survivingEntities ||
                      ((t.survivingEntities = []),
                      t.player1Collided || t.survivingEntities.push('P1'),
                      t.player2Collided || t.survivingEntities.push('P2')))
                : (t = this.collisionDetectionEngine.checkCollisions(e, this.game)),
            this.performanceMonitor && this.performanceMonitor.endCollisionDetection());
        const { playerCollided: i, aiCollided: r, winner: n } = t;
        (i || r) && (this.handleCollisionEffects(t, e), this.handleGameEnd(t, n));
    }
    handleCollisionEffects(e, t) {
        if (
            (this.audioManager.playExplosionSound(),
            this.cameraEffectsManager && this.cameraEffectsManager.isEnabled())
        ) {
            let i = 1;
            e.playerCollided && e.aiCollided && (i = 1.5);
            const r = this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER ? t.player1 : t.player;
            r && this.cameraEffectsManager.onCollision(r, i);
        }
        this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER
            ? (e.player1Collided &&
                  t.player1 &&
                  this.renderingEngine.createExplosionEffect(t.player1, 1),
              e.player2Collided &&
                  t.player2 &&
                  this.renderingEngine.createExplosionEffect(t.player2, 1))
            : (e.playerCollided &&
                  t.player &&
                  this.renderingEngine.createExplosionEffect(t.player, 1),
              e.aiCollided && t.aiOpponents
                  ? t.aiOpponents.forEach((e) => {
                        e.alive || this.renderingEngine.createExplosionEffect(e, 1);
                    })
                  : e.aiCollided && t.ai && this.renderingEngine.createExplosionEffect(t.ai, 1));
    }
    handleGameEnd(e, t) {
        if (this.isTimeTrialActive) {
            this.survivalTimer.stop();
            const e = this.survivalTimer.getElapsedTime();
            (this.leaderboardSystem.isNewRecord(e) && this.leaderboardSystem.addScore(e),
                (this.game.gameOver = !0),
                this.audioManager.playDefeatSound());
        } else
            this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER
                ? (this.game.handleRoundEnd(e),
                  (this.game.gameOver = !0),
                  e.player1Collided && e.player2Collided
                      ? this.audioManager.playDefeatSound()
                      : this.audioManager.playVictorySound())
                : (this.handleMultiAICollisions(e, this.game),
                  'player' === t
                      ? this.audioManager.playVictorySound()
                      : this.audioManager.playDefeatSound());
        this.audioManager.handleGameEnd();
    }
    handlePauseState(e) {
        (this.previousGameState &&
            !this.previousGameState.isPaused &&
            (this.audioManager.handleGamePause(),
            this.cameraEffectsManager &&
                this.cameraEffectsManager.isEnabled() &&
                this.cameraEffectsManager.pause(),
            this.isTimeTrialActive && this.survivalTimer.pause()),
            this.previousGameState &&
                this.previousGameState.isPaused &&
                !e.isPaused &&
                (this.audioManager.handleGameResume(),
                this.cameraEffectsManager &&
                    this.cameraEffectsManager.isEnabled() &&
                    this.cameraEffectsManager.resume(),
                this.isTimeTrialActive && this.survivalTimer.resume()));
    }
    updateUI(e) {
        if ((this.updatePauseOverlay(), this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER))
            this.localScoringUI && this.localScoringUI.updateScores();
        else if (this.isTimeTrialActive)
            this.modeUI ? this.modeUI.updateTimeTrialDisplay() : this.updateTimeTrialDisplay();
        else if (this.currentGameMode === GameModes$1.ARENA_SHRINK) {
            this.modeUI ? this.modeUI.updateArenaShrinkDisplay() : this.updateArenaShrinkDisplay();
            const e = this.game.getGameState();
            if (
                (this.scoreDisplay.updateGameplayScores(e.playerScore, e.aiScore),
                e.aiOpponents && e.aiOpponents.length > 1)
            ) {
                const e = this.game.getAliveEntities().map((e) => e.id);
                this.modeUI
                    ? this.modeUI.updateRemainingEntityDisplay(e)
                    : this.updateRemainingEntityDisplay(e);
            }
        } else {
            const e = this.game.getGameState();
            if (
                (this.scoreDisplay.updateGameplayScores(e.playerScore, e.aiScore),
                e.aiOpponents && e.aiOpponents.length > 1)
            ) {
                const e = this.game.getAliveEntities().map((e) => e.id);
                this.modeUI
                    ? this.modeUI.updateRemainingEntityDisplay(e)
                    : this.updateRemainingEntityDisplay(e);
            }
        }
        if (this.statusIndicator) {
            const e = this.powerUpManager.getAllActiveEffects();
            (this.statusIndicator.updateStatus(e), this.statusIndicator.updateTimers());
        }
    }
    render(e) {
        const t = this.game.getGameState();
        t.powerUpManager = this.powerUpManager;
        try {
            this.renderingEngine.draw(t);
        } catch (i) {
            logger$1.error('Error rendering game:', i);
            if (
                !this.recoveryManager.handleRenderingError(i, () => {
                    this.renderingEngine &&
                        this.renderingEngine.renderer &&
                        this.renderingEngine.scene &&
                        this.renderingEngine.camera &&
                        this.renderingEngine.renderer.render(
                            this.renderingEngine.scene,
                            this.renderingEngine.camera
                        );
                })
            )
                return (
                    logger$1.error('Critical rendering failure, stopping game loop'),
                    void this.stop()
                );
        }
        if (this.glowEffectManager && !this.recoveryManager.isFeatureDisabled('GlowEffectManager'))
            try {
                this.glowEffectManager.render();
            } catch (i) {
                (this.recoveryManager.handleFeatureRuntimeError('GlowEffectManager', i, () => {
                    this.glowEffectManager = null;
                }),
                    this.renderingEngine &&
                        this.renderingEngine.renderer &&
                        this.renderingEngine.scene &&
                        this.renderingEngine.camera &&
                        this.renderingEngine.renderer.render(
                            this.renderingEngine.scene,
                            this.renderingEngine.camera
                        ));
            }
    }
    handleGameOver() {
        if (this.uiManager && this.gameOverUI) {
            const e = this.game.getGameState();
            if (
                (this.uiManager.showGameOver(e, this.currentGameMode),
                this.currentGameMode !== GameModes$1.LOCAL_MULTIPLAYER)
            ) {
                document.getElementById('gameOver').style.display = 'block';
                const e = document.getElementById('restart');
                e && (e.style.display = 'block');
            }
        } else if (this.currentGameMode === GameModes$1.LOCAL_MULTIPLAYER)
            this.showMultiplayerGameOver();
        else if (this.isTimeTrialActive) {
            (this.showTimeTrialGameOver(),
                (document.getElementById('gameOver').style.display = 'block'));
            const e = document.getElementById('restart');
            e && (e.style.display = 'block');
        } else if (this.currentGameMode === GameModes$1.ARENA_SHRINK) {
            (this.showArenaShrinkGameOver(),
                (document.getElementById('gameOver').style.display = 'block'));
            const e = document.getElementById('restart');
            e && (e.style.display = 'block');
        } else {
            (this.showMultiAIGameOver(),
                (document.getElementById('gameOver').style.display = 'block'));
            const e = document.getElementById('restart');
            e && (e.style.display = 'block');
        }
    }
};
module$1.exports = { GameLoop: GameLoop$1 };
const __CJS__export_default__ =
        (null == module$1.exports ? {} : module$1.exports).default || module$1.exports,
    __CJS__import__53__ = Object.freeze(
        Object.defineProperty(
            { __proto__: null, default: __CJS__export_default__ },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    ),
    { Game: Game } = __CJS__export_default__$13 || __CJS__import__0__$4,
    { MultiplayerGame: MultiplayerGame } = __CJS__export_default__$10 || __CJS__import__1__$5,
    { AIController: AIController, AICoordinator: AICoordinator } =
        __CJS__export_default__$$ || __CJS__import__2__$4,
    { CollisionDetectionEngine: CollisionDetectionEngine } =
        __CJS__export_default__$_ || __CJS__import__3__$2,
    { PlayerCollisionHandler: PlayerCollisionHandler } =
        __CJS__export_default__$Z || __CJS__import__4__$1,
    { PlayerController: PlayerController } = __CJS__export_default__$X || __CJS__import__5__$1,
    { DualControlScheme: DualControlScheme } = __CJS__export_default__$Y || __CJS__import__6__,
    { RenderingEngine: RenderingEngine } = __CJS__export_default__$S || __CJS__import__7__,
    { SplitScreenCamera: SplitScreenCamera } = __CJS__export_default__$T || __CJS__import__8__,
    { ScoreDisplay: ScoreDisplay } = __CJS__export_default__$R || __CJS__import__9__,
    { AudioManager: AudioManager } = __CJS__export_default__$1d || __CJS__import__10__,
    { DifficultyManager: DifficultyManager } = __CJS__export_default__$Q || __CJS__import__11__,
    { PowerUpManager: PowerUpManager } = __CJS__export_default__$P || __CJS__import__12__,
    { StatusIndicator: StatusIndicator } = __CJS__export_default__$O || __CJS__import__13__,
    { ModeSelector: ModeSelector } = __CJS__export_default__$N || __CJS__import__14__,
    { SurvivalTimer: SurvivalTimer } = __CJS__export_default__$16 || __CJS__import__15__,
    { CountdownTimer: CountdownTimer } = __CJS__export_default__$M || __CJS__import__16__,
    { LeaderboardSystem: LeaderboardSystem } = __CJS__export_default__$L || __CJS__import__17__,
    { AchievementSystem: AchievementSystem } = __CJS__export_default__$K || __CJS__import__18__,
    { GameModes: GameModes } = __CJS__export_default__$17 || __CJS__import__19__,
    { PerformanceMonitor: PerformanceMonitor } = __CJS__export_default__$1c || __CJS__import__20__,
    { PerformanceDegradationManager: PerformanceDegradationManager } =
        __CJS__export_default__$I || __CJS__import__21__,
    { ParticleSystem: ParticleSystem } = __CJS__export_default__$1b || __CJS__import__22__,
    { ParticleSettingsUI: ParticleSettingsUI } = __CJS__export_default__$G || __CJS__import__23__,
    { GlowEffectManager: GlowEffectManager } = __CJS__export_default__$C || __CJS__import__24__,
    { CameraEffectsManager: CameraEffectsManager } =
        __CJS__export_default__$w || __CJS__import__25__,
    { CameraEffectsUI: CameraEffectsUI } = __CJS__export_default__$u || __CJS__import__26__,
    { CustomizationManager: CustomizationManager } =
        __CJS__export_default__$s || __CJS__import__27__,
    { CustomizationUI: CustomizationUI } = __CJS__export_default__$q || __CJS__import__28__,
    { PreferenceStorage: PreferenceStorage } = __CJS__export_default__$p || __CJS__import__29__,
    { MusicSettingsUI: MusicSettingsUI } = __CJS__export_default__$o || __CJS__import__30__,
    { MultiplayerGameOverUI: MultiplayerGameOverUI } =
        __CJS__export_default__$n || __CJS__import__31__,
    { LocalScoringUI: LocalScoringUI } = __CJS__export_default__$m || __CJS__import__32__$1,
    { UIManager: UIManager } = __CJS__export_default__$l || __CJS__import__33__,
    { GameOverUI: GameOverUI } = __CJS__export_default__$k || __CJS__import__34__,
    { ModeUI: ModeUI } = __CJS__export_default__$j || __CJS__import__35__,
    { StyleManager: StyleManager } = __CJS__export_default__$i || __CJS__import__36__,
    { BrowserCompatibility: BrowserCompatibility } =
        __CJS__export_default__$h || __CJS__import__37__,
    { ClassicMode: ClassicMode } = __CJS__export_default__$f || __CJS__import__38__,
    { TimeTrialMode: TimeTrialMode } = __CJS__export_default__$e || __CJS__import__39__,
    { ArenaShrinkMode: ArenaShrinkMode } = __CJS__export_default__$d || __CJS__import__40__,
    { MultiplayerMode: MultiplayerMode } = __CJS__export_default__$c || __CJS__import__41__,
    { CompatibilityWarningUI: CompatibilityWarningUI } =
        __CJS__export_default__$b || __CJS__import__42__,
    { RecoveryManager: RecoveryManager } = __CJS__export_default__$9 || __CJS__import__43__,
    { GameInitializer: GameInitializer } = __CJS__export_default__$5 || __CJS__import__44__,
    { SystemInitializer: SystemInitializer } = __CJS__export_default__$3 || __CJS__import__45__,
    { CanvasVerifier: CanvasVerifier } = __CJS__export_default__$6 || __CJS__import__46__,
    { LoadingIndicator: LoadingIndicator } = __CJS__export_default__$8 || __CJS__import__47__,
    {
        DOMNotReadyError: DOMNotReadyError,
        CanvasCreationError: CanvasCreationError,
        ModeSelectorError: ModeSelectorError,
    } = __CJS__export_default__$a || __CJS__import__48__,
    { InitializationState: InitializationState } = __CJS__export_default__$7 || __CJS__import__49__,
    { Logger: Logger } = __CJS__export_default__$1a || __CJS__import__50__,
    { errorRecovery: errorRecovery } = __CJS__export_default__$2 || __CJS__import__51__,
    { EventManager: EventManager } = __CJS__export_default__$1 || __CJS__import__52__,
    { GameLoop: GameLoop } = __CJS__export_default__ || __CJS__import__53__,
    logger = Logger.create('Main'),
    browserCompatibility = new BrowserCompatibility();
browserCompatibility.initializeIconDisplay();
let recoveryManager = null,
    loadingIndicator = null,
    initializationState = null,
    eventManager = null,
    gameLoop = null,
    game = null,
    aiCoordinator = null,
    collisionDetectionEngine = null,
    playerCollisionHandler = null,
    playerController = null,
    renderingEngine = null,
    scoreDisplay = null,
    cameraEffectsManager = null,
    audioManager = null,
    difficultyManager = null,
    powerUpManager = null,
    statusIndicator = null,
    glowEffectManager = null,
    performanceMonitor = null,
    performanceDegradationManager = null,
    modeSelector = null,
    survivalTimer = null,
    countdownTimer = null,
    leaderboardSystem = null,
    achievementSystem = null,
    particleSettingsUI = null,
    cameraEffectsUI = null,
    glowSettingsUI = null,
    customizationManager = null,
    customizationUI = null,
    musicSettingsUI = null,
    uiManager = null,
    gameOverUI = null,
    modeUI = null,
    styleManager = null,
    multiplayerGame = null,
    dualControlScheme = null,
    splitScreenCamera = null,
    aiControllers = [],
    currentAICount = 1,
    currentGameMode = GameModes.CLASSIC,
    isTimeTrialActive = !1,
    currentModeController = null;
function initializeAIControllers(e = 1) {
    const t = Math.max(1, Math.min(4, Math.floor(e)));
    ((currentAICount = t), (aiControllers = []));
    const i = ['aggressive', 'defensive', 'erratic'];
    for (let r = 0; r < t; r++) {
        const e = new AIController(i[r % i.length]);
        aiControllers.push(e);
    }
    aiControllers.length > 0 && difficultyManager.setAIController(aiControllers[0]);
}
function calculateMultiAIDirections(e, t) {
    if (!e.aiOpponents || 0 === e.aiOpponents.length) return [];
    performanceMonitor.startAICalculation('multi-ai');
    try {
        const i = e.aiOpponents.map((e, t) =>
            __spreadProps(__spreadValues({}, e), {
                controller: aiControllers[t] || aiControllers[0],
            })
        );
        return aiCoordinator.coordinateAIDecisions(i, e, t);
    } finally {
        performanceMonitor.endAICalculation('multi-ai');
    }
}
function applyAIDecisions(e, t) {
    const i = t.getGameState();
    (e.forEach((e, t) => {
        t < i.aiOpponents.length &&
            i.aiOpponents[t].alive &&
            ((i.aiOpponents[t].direction = e.newDirection),
            aiControllers[t] && (aiControllers[t].aiState = e.newState));
    }),
        i.aiOpponents.length > 0 && (t.aiDirection = i.aiOpponents[0].direction));
}
function handleMultiAICollisions(e, t) {
    const { crashedEntities: i, survivingEntities: r, winner: n } = e,
        s = t.getGameState();
    i &&
        s.aiOpponents &&
        i.forEach((e) => {
            if (e.startsWith('ai_')) {
                const t = s.aiOpponents.findIndex((t) => t.id === e);
                -1 !== t && (s.aiOpponents[t].alive = !1);
            }
        });
    (determineGameEnd(r) && (updateMultiAIScores(n, r), (t.gameOver = !0)),
        modeUI ? modeUI.updateRemainingEntityDisplay(r) : updateRemainingEntityDisplay(r));
}
function determineGameEnd(e, t) {
    return !e.includes('player') || (1 === e.length && 'player' === e[0]);
}
function updateMultiAIScores(e, t) {
    const i = game.scoreManager;
    'player' === e && 1 === t.length && 'player' === t[0]
        ? i.incrementPlayerScore()
        : i.incrementAIScore();
}
function updateRemainingEntityDisplay(e) {
    let t = document.getElementById('remaining-entities-display');
    t ||
        ((t = document.createElement('div')),
        (t.id = 'remaining-entities-display'),
        (t.className = 'remaining-entities-display'),
        document.body.appendChild(t),
        addRemainingEntitiesStyles());
    const i = e.includes('player'),
        r = e.filter((e) => e.startsWith('ai_')).length,
        n = e.length;
    n > 1
        ? ((t.innerHTML = `\n            <div class="remaining-count">Remaining: ${n}</div>\n            <div class="remaining-breakdown">\n                ${i ? '<span class="player-status alive">You</span>' : '<span class="player-status dead">You</span>'}\n                <span class="ai-status">${r} AI${1 !== r ? 's' : ''}</span>\n            </div>\n        `),
          (t.style.display = 'block'))
        : (t.style.display = 'none');
}
function addRemainingEntitiesStyles() {
    if (document.getElementById('remaining-entities-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'remaining-entities-styles'),
        (e.textContent =
            "\n        .remaining-entities-display {\n            position: fixed;\n            top: 100px;\n            left: 20px;\n            background-color: rgba(0, 0, 0, 0.8);\n            border: 2px solid #ffffff;\n            border-radius: 8px;\n            padding: 12px 16px;\n            color: white;\n            font-family: 'Courier New', monospace;\n            font-size: 16px;\n            z-index: 100;\n            min-width: 120px;\n        }\n\n        .remaining-count {\n            font-weight: bold;\n            font-size: 18px;\n            margin-bottom: 8px;\n            text-align: center;\n            color: #00ffff;\n        }\n\n        .remaining-breakdown {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            gap: 12px;\n        }\n\n        .player-status {\n            font-weight: bold;\n        }\n\n        .player-status.alive {\n            color: #00ff00;\n        }\n\n        .player-status.dead {\n            color: #ff4444;\n            text-decoration: line-through;\n        }\n\n        .ai-status {\n            color: #ffaa00;\n        }\n\n        @media (max-width: 768px) {\n            .remaining-entities-display {\n                font-size: 14px;\n                padding: 8px 12px;\n                top: 80px;\n                left: 10px;\n            }\n            \n            .remaining-count {\n                font-size: 16px;\n                margin-bottom: 6px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function hideRemainingEntitiesDisplay() {
    const e = document.getElementById('remaining-entities-display');
    e && (e.style.display = 'none');
}
function showMultiAIGameOver() {
    const e = game.getGameState(),
        t = document.getElementById('gameOver');
    if ((hideRemainingEntitiesDisplay(), t)) {
        const i = e.playerScore > e.aiScore,
            r = e.isNewHighScore,
            n = e.aiOpponents ? e.aiOpponents.length : 1;
        e.aiOpponents ? e.aiOpponents.filter((e) => e.alive).length : e.ai;
        let s = '';
        ((s = i
            ? n > 1
                ? `Victory! You defeated ${n} AI opponents!`
                : 'Victory! You defeated the AI!'
            : n > 1
              ? `Defeated by ${n} AI opponents`
              : 'Defeated by AI'),
            (t.innerHTML = `\n            <div class="multi-ai-game-over">\n                <h2 class="${i ? 'victory' : 'defeat'}">${s}</h2>\n                <div class="score-summary">\n                    <div class="score-row">\n                        <span class="score-label">Your Score:</span>\n                        <span class="score-value player-score">${e.playerScore}</span>\n                    </div>\n                    <div class="score-row">\n                        <span class="score-label">AI Score:</span>\n                        <span class="score-value ai-score">${e.aiScore}</span>\n                    </div>\n                    <div class="score-row">\n                        <span class="score-label">High Score:</span>\n                        <span class="score-value high-score">${e.highScore}</span>\n                    </div>\n                </div>\n                ${r ? '<div class="new-high-score">New High Score!</div>' : ''}\n                <div class="game-stats">\n                    <div class="stat-item">\n                        <span class="stat-label">AI Opponents:</span>\n                        <span class="stat-value">${n}</span>\n                    </div>\n                    <div class="stat-item">\n                        <span class="stat-label">Rounds Played:</span>\n                        <span class="stat-value">${e.roundsPlayed || e.playerScore + e.aiScore}</span>\n                    </div>\n                </div>\n                <button id="changeModeButton" onclick="showModeSelector()" class="mode-change-btn">\n                    Change Mode\n                </button>\n            </div>\n        `),
            addMultiAIGameOverStyles());
    }
    scoreDisplay.showGameOverScores(e.playerScore, e.aiScore, e.highScore, e.isNewHighScore);
}
function addMultiAIGameOverStyles() {
    if (document.getElementById('multi-ai-game-over-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'multi-ai-game-over-styles'),
        (e.textContent =
            "\n        .multi-ai-game-over {\n            text-align: center;\n            color: white;\n            font-family: 'Courier New', monospace;\n        }\n\n        .multi-ai-game-over h2 {\n            font-size: 2.5em;\n            margin-bottom: 30px;\n            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);\n        }\n\n        .multi-ai-game-over h2.victory {\n            color: #00ff00;\n            text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);\n        }\n\n        .multi-ai-game-over h2.defeat {\n            color: #ff4444;\n            text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);\n        }\n\n        .score-summary {\n            background: rgba(0, 0, 0, 0.7);\n            border: 2px solid #ffffff;\n            border-radius: 10px;\n            padding: 20px;\n            margin: 20px auto;\n            max-width: 300px;\n        }\n\n        .score-row {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            margin: 10px 0;\n            font-size: 1.2em;\n        }\n\n        .score-label {\n            color: #cccccc;\n        }\n\n        .player-score {\n            color: #00ffff;\n            font-weight: bold;\n        }\n\n        .ai-score {\n            color: #ff6666;\n            font-weight: bold;\n        }\n\n        .high-score {\n            color: #ffff00;\n            font-weight: bold;\n        }\n\n        .new-high-score {\n            color: #ffff00;\n            font-size: 1.5em;\n            font-weight: bold;\n            margin: 15px 0;\n            text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);\n            animation: highScoreGlow 1s ease-in-out infinite alternate;\n        }\n\n        .game-stats {\n            background: rgba(0, 0, 0, 0.5);\n            border: 1px solid #666666;\n            border-radius: 8px;\n            padding: 15px;\n            margin: 20px auto;\n            max-width: 250px;\n        }\n\n        .stat-item {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            margin: 8px 0;\n            font-size: 1em;\n        }\n\n        .stat-label {\n            color: #aaaaaa;\n        }\n\n        .stat-value {\n            color: #ffffff;\n            font-weight: bold;\n        }\n\n        .mode-change-btn {\n            margin-top: 20px;\n            padding: 12px 24px;\n            font-size: 1.2em;\n            background: rgba(0, 255, 255, 0.2);\n            border: 2px solid #00ffff;\n            color: white;\n            border-radius: 8px;\n            cursor: pointer;\n            font-family: 'Courier New', monospace;\n            transition: all 0.3s ease;\n        }\n\n        .mode-change-btn:hover {\n            background: rgba(0, 255, 255, 0.4);\n            box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);\n        }\n\n        @keyframes highScoreGlow {\n            from {\n                text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);\n            }\n            to {\n                text-shadow: 0 0 25px rgba(255, 255, 0, 1.0);\n            }\n        }\n\n        @media (max-width: 768px) {\n            .multi-ai-game-over h2 {\n                font-size: 1.8em;\n                margin-bottom: 20px;\n            }\n            \n            .score-summary {\n                max-width: 250px;\n                padding: 15px;\n            }\n            \n            .score-row {\n                font-size: 1em;\n                margin: 8px 0;\n            }\n            \n            .game-stats {\n                max-width: 200px;\n                padding: 12px;\n            }\n            \n            .mode-change-btn {\n                padding: 10px 20px;\n                font-size: 1em;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
(game && powerUpManager && game.setPowerUpManager(powerUpManager),
    collisionDetectionEngine &&
        powerUpManager &&
        collisionDetectionEngine.setPowerUpManager(powerUpManager),
    playerCollisionHandler &&
        powerUpManager &&
        playerCollisionHandler.setPowerUpManager(powerUpManager),
    collisionDetectionEngine &&
        cameraEffectsManager &&
        collisionDetectionEngine.setCameraEffectsManager(cameraEffectsManager),
    playerCollisionHandler &&
        cameraEffectsManager &&
        playerCollisionHandler.setCameraEffectsManager(cameraEffectsManager),
    game && cameraEffectsManager && game.setCameraEffectsManager(cameraEffectsManager),
    renderingEngine &&
        cameraEffectsManager &&
        renderingEngine.setCameraEffectsManager(cameraEffectsManager));
let multiplayerGameOverUI = null,
    localScoringUI = null;
function initializeMultiplayerUI(e) {
    (localScoringUI || (localScoringUI = new LocalScoringUI(e.localScoring)),
        localScoringUI.showScores());
}
function cleanupMultiplayerUI() {
    (localScoringUI && localScoringUI.hideScores(),
        multiplayerGameOverUI && multiplayerGameOverUI.isVisible() && multiplayerGameOverUI.hide());
}
function showMultiplayerGameOver() {
    multiplayerGameOverUI || (multiplayerGameOverUI = new MultiplayerGameOverUI());
    const e = game.getGameState();
    multiplayerGameOverUI.show(
        e,
        () => {
            (game.restart(), (game.gameOver = !1), localScoringUI && localScoringUI.updateScores());
        },
        () => {
            (game.resetScores(),
                (game.gameOver = !1),
                localScoringUI && localScoringUI.updateScores());
        },
        () => {
            (localScoringUI && localScoringUI.hideScores(), showModeSelector());
        }
    );
    const t = document.getElementById('gameOver');
    t && (t.style.display = 'none');
    const i = document.getElementById('restart');
    i && (i.style.display = 'none');
}
function showModeSelector() {
    document.getElementById('gameOver').style.display = 'none';
    const e = document.getElementById('restart');
    (e && (e.style.display = 'none'),
        multiplayerGameOverUI && multiplayerGameOverUI.isVisible() && multiplayerGameOverUI.hide(),
        (game.gameOver = !1),
        modeSelector.show());
}
function showPerformanceNotification(e) {
    let t = document.getElementById('performance-notification');
    (t ||
        ((t = document.createElement('div')),
        (t.id = 'performance-notification'),
        (t.className = 'performance-notification'),
        document.body.appendChild(t),
        addPerformanceNotificationStyles()),
        (t.textContent = e),
        (t.style.display = 'block'),
        (t.style.opacity = '1'),
        setTimeout(() => {
            ((t.style.opacity = '0'),
                setTimeout(() => {
                    t.style.display = 'none';
                }, 500));
        }, 4e3));
}
function updatePerformanceModeUI(e) {
    let t = document.getElementById('performance-mode-indicator');
    (t ||
        ((t = document.createElement('div')),
        (t.id = 'performance-mode-indicator'),
        (t.className = 'performance-mode-indicator'),
        document.body.appendChild(t),
        addPerformanceModeIndicatorStyles()),
        e
            ? ((t.textContent = 'Performance Mode'), (t.style.display = 'block'))
            : (t.style.display = 'none'));
}
function addPerformanceNotificationStyles() {
    if (document.getElementById('performance-notification-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'performance-notification-styles'),
        (e.textContent =
            "\n        .performance-notification {\n            position: fixed;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background-color: rgba(255, 165, 0, 0.9);\n            color: white;\n            padding: 15px 25px;\n            border-radius: 8px;\n            font-family: 'Courier New', monospace;\n            font-size: 16px;\n            font-weight: bold;\n            z-index: 1000;\n            border: 2px solid #ff8c00;\n            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n            opacity: 0;\n            transition: opacity 0.5s ease-in-out;\n            max-width: 400px;\n            text-align: center;\n        }\n\n        @media (max-width: 768px) {\n            .performance-notification {\n                font-size: 14px;\n                padding: 12px 20px;\n                max-width: 300px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function addPerformanceModeIndicatorStyles() {
    if (document.getElementById('performance-mode-indicator-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'performance-mode-indicator-styles'),
        (e.textContent =
            "\n        .performance-mode-indicator {\n            position: fixed;\n            bottom: 20px;\n            right: 20px;\n            background-color: rgba(255, 165, 0, 0.8);\n            color: white;\n            padding: 8px 16px;\n            border-radius: 5px;\n            font-family: 'Courier New', monospace;\n            font-size: 14px;\n            font-weight: bold;\n            z-index: 100;\n            border: 1px solid #ff8c00;\n            display: none;\n        }\n\n        @media (max-width: 768px) {\n            .performance-mode-indicator {\n                bottom: 10px;\n                right: 10px;\n                font-size: 12px;\n                padding: 6px 12px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function startGameWithMode(e) {
    ((currentGameMode = e),
        (isTimeTrialActive = e === GameModes.TIME_TRIAL),
        currentModeController && (currentModeController.cleanup(), (currentModeController = null)));
    const t = {
            renderingEngine: renderingEngine,
            powerUpManager: powerUpManager,
            statusIndicator: statusIndicator,
            glowEffectManager: glowEffectManager,
            audioManager: audioManager,
            scoreDisplay: scoreDisplay,
            survivalTimer: survivalTimer,
            achievementSystem: achievementSystem,
            uiManager: uiManager,
            modeUI: modeUI,
            gameOverUI: gameOverUI,
            cameraEffectsManager: cameraEffectsManager,
        },
        i = {
            currentAICount: currentAICount,
            initializeAIControllers: initializeAIControllers,
            showMultiAIGameOver: showMultiAIGameOver,
            showTimeTrialGameOver: showTimeTrialGameOver,
            showArenaShrinkGameOver: showArenaShrinkGameOver,
            showMultiplayerGameOver: showMultiplayerGameOver,
            updateUIForGameMode: updateUIForGameMode,
            createTimeTrialUI: createTimeTrialUI,
            hideTimeTrialUI: hideTimeTrialUI,
            createArenaShrinkUI: createArenaShrinkUI,
            hideArenaShrinkUI: hideArenaShrinkUI,
            showFinalArenaMessage: showFinalArenaMessage,
            hideFinalArenaMessage: hideFinalArenaMessage,
            hideRemainingEntitiesDisplay: hideRemainingEntitiesDisplay,
            initializeMultiplayerUI: initializeMultiplayerUI,
            cleanupMultiplayerUI: cleanupMultiplayerUI,
            setGame: (e) => {
                game = e;
            },
            resetGameReference: () => {},
        };
    e === GameModes.TIME_TRIAL
        ? countdownTimer.start(() => {
              ((currentModeController = new TimeTrialMode(game, t, i)),
                  currentModeController.initialize());
          })
        : e === GameModes.ARENA_SHRINK
          ? countdownTimer.start(() => {
                ((currentModeController = new ArenaShrinkMode(game, t, i)),
                    currentModeController.initialize());
            })
          : e === GameModes.LOCAL_MULTIPLAYER
            ? ((currentModeController = new MultiplayerMode(game, t, i)),
              currentModeController.initialize())
            : ((currentModeController = new ClassicMode(game, t, i)),
              currentModeController.initialize());
}
function initializeTimeTrialMode() {
    (game.restart(),
        game.setTimeTrialMode(!0),
        survivalTimer.reset(),
        achievementSystem.reset(),
        survivalTimer.start(),
        renderingEngine.clearTrails(),
        powerUpManager.reset(),
        statusIndicator.reset(),
        glowEffectManager && glowEffectManager.initialized && glowEffectManager.handleGameRestart(),
        (document.getElementById('gameOver').style.display = 'none'));
    const e = document.getElementById('restart');
    (e && (e.style.display = 'none'),
        updatePauseOverlay(),
        uiManager
            ? (uiManager.updateForMode(GameModes.TIME_TRIAL),
              uiManager.createModeUI(GameModes.TIME_TRIAL))
            : (updateUIForGameMode(), createTimeTrialUI(), hideArenaShrinkUI()),
        audioManager.handleGameStart());
}
function initializeClassicMode() {
    ((game.gameConfig.aiCount = currentAICount),
        game.restart(),
        game.setTimeTrialMode(!1),
        initializeAIControllers(currentAICount),
        renderingEngine.clearTrails(),
        powerUpManager.reset(),
        statusIndicator.reset(),
        glowEffectManager && glowEffectManager.initialized && glowEffectManager.handleGameRestart(),
        (document.getElementById('gameOver').style.display = 'none'));
    const e = document.getElementById('restart');
    (e && (e.style.display = 'none'),
        updatePauseOverlay(),
        uiManager && modeUI
            ? (uiManager.updateForMode(GameModes.CLASSIC), modeUI.hideAllModeUI())
            : (updateUIForGameMode(),
              hideTimeTrialUI(),
              hideArenaShrinkUI(),
              hideRemainingEntitiesDisplay()));
    const t = game.getGameState();
    (scoreDisplay.updateGameplayScores(t.playerScore, t.aiScore), audioManager.handleGameStart());
}
function initializeArenaShrinkMode() {
    ((game.gameConfig.aiCount = currentAICount),
        game.restart(),
        game.setGameMode(GameModes.ARENA_SHRINK),
        initializeAIControllers(currentAICount),
        game.arenaShrinker &&
            (game.arenaShrinker.setOnWarning(() => {
                audioManager.playShrinkWarningSound();
            }),
            game.arenaShrinker.setOnShrink(() => {
                audioManager.playShrinkExecuteSound();
                const e = game.arenaShrinker.getCurrentBounds(),
                    t = game.arenaShrinker.getNextBounds();
                renderingEngine.startShrinkAnimation(e, t);
            }),
            game.arenaShrinker.setOnFinalArena(() => {
                modeUI ? modeUI.showFinalArenaMessage() : showFinalArenaMessage();
            })),
        renderingEngine.clearTrails(),
        powerUpManager.reset(),
        statusIndicator.reset(),
        glowEffectManager && glowEffectManager.initialized && glowEffectManager.handleGameRestart(),
        (document.getElementById('gameOver').style.display = 'none'));
    const e = document.getElementById('restart');
    (e && (e.style.display = 'none'),
        updatePauseOverlay(),
        uiManager
            ? (uiManager.updateForMode(GameModes.ARENA_SHRINK),
              uiManager.createModeUI(GameModes.ARENA_SHRINK))
            : (updateUIForGameMode(),
              hideTimeTrialUI(),
              hideRemainingEntitiesDisplay(),
              createArenaShrinkUI()));
    const t = game.getGameState();
    (scoreDisplay.updateGameplayScores(t.playerScore, t.aiScore), audioManager.handleGameStart());
}
function initializeLocalMultiplayerMode() {
    (multiplayerGame
        ? multiplayerGame.restart()
        : ((multiplayerGame = new MultiplayerGame()),
          multiplayerGame.setPowerUpManager(powerUpManager),
          multiplayerGame.setCameraEffectsManager(cameraEffectsManager)),
        (game = multiplayerGame),
        dualControlScheme
            ? dualControlScheme.reset()
            : (dualControlScheme = new DualControlScheme()),
        multiplayerGame.init(),
        splitScreenCamera || (splitScreenCamera = new SplitScreenCamera(renderingEngine.camera)),
        splitScreenCamera.setPlayers([multiplayerGame.player1, multiplayerGame.player2]),
        initializeMultiplayerUI(multiplayerGame),
        renderingEngine.clearTrails(),
        powerUpManager.reset(),
        statusIndicator.reset(),
        glowEffectManager && glowEffectManager.initialized && glowEffectManager.handleGameRestart(),
        (document.getElementById('gameOver').style.display = 'none'));
    const e = document.getElementById('restart');
    (e && (e.style.display = 'none'),
        updatePauseOverlay(),
        uiManager && modeUI
            ? (uiManager.updateForMode(GameModes.LOCAL_MULTIPLAYER), modeUI.hideAllModeUI())
            : (updateUIForGameMode(),
              hideTimeTrialUI(),
              hideArenaShrinkUI(),
              hideRemainingEntitiesDisplay()),
        audioManager.handleGameStart());
}
function restartGame() {
    (audioManager.handleGameRestart(),
        currentGameMode === GameModes.TIME_TRIAL
            ? (survivalTimer.stop(),
              countdownTimer.stop(),
              countdownTimer.start(() => {
                  currentModeController
                      ? currentModeController.initialize()
                      : initializeTimeTrialMode();
              }))
            : currentGameMode === GameModes.ARENA_SHRINK
              ? (survivalTimer.stop(),
                countdownTimer.stop(),
                countdownTimer.start(() => {
                    currentModeController
                        ? currentModeController.initialize()
                        : initializeArenaShrinkMode();
                }))
              : currentGameMode === GameModes.LOCAL_MULTIPLAYER
                ? currentModeController
                    ? currentModeController.initialize()
                    : initializeLocalMultiplayerMode()
                : currentModeController
                  ? currentModeController.initialize()
                  : initializeClassicMode());
}
function updatePauseOverlay() {
    const e = game.getGameState(),
        t = document.getElementById('pauseOverlay');
    t && (e.isPaused ? (t.style.display = 'flex') : (t.style.display = 'none'));
}
function updateMuteButton() {
    const e = audioManager.getMuted(),
        t = document.getElementById('muteButton');
    t &&
        (e
            ? ((t.textContent = '🔇'), t.classList.add('muted'), (t.title = 'Unmute Audio'))
            : ((t.textContent = '🔊'), t.classList.remove('muted'), (t.title = 'Mute Audio')));
}
function updatePerformanceButton() {
    const e = document.getElementById('performanceButton');
    if (e) {
        performanceDegradationManager.getSettings().performanceModeEnabled
            ? (e.classList.add('active'), (e.title = 'Disable Performance Mode'))
            : (e.classList.remove('active'), (e.title = 'Enable Performance Mode'));
    }
}
function updateDifficultyUI() {
    const e = difficultyManager.getCurrentDifficulty();
    document.querySelectorAll('.difficulty-btn').forEach((t) => {
        t.getAttribute('data-level') === e
            ? t.classList.add('active')
            : t.classList.remove('active');
    });
}
function updateAICountUI() {
    document.querySelectorAll('.ai-count-btn').forEach((e) => {
        parseInt(e.getAttribute('data-count')) === currentAICount
            ? e.classList.add('active')
            : e.classList.remove('active');
    });
}
function setAICount(e) {
    const t = Math.max(1, Math.min(4, Math.floor(e)));
    if (t !== currentAICount) {
        ((currentAICount = t),
            initializeAIControllers(currentAICount),
            (game.gameConfig.aiCount = currentAICount));
        try {
            localStorage.setItem('lightbikes_ai_count', currentAICount.toString());
        } catch (i) {
            logger.warn('Failed to save AI count to localStorage:', i);
        }
        game.gameOver || currentGameMode === GameModes.TIME_TRIAL || restartGame();
    }
}
function updateTimeTrialDisplay() {
    const e = document.getElementById('timer-display');
    e ? (e.textContent = survivalTimer.getCurrentFormattedTime()) : createTimeTrialUI();
}
function showTimeTrialGameOver() {
    const e = survivalTimer.getElapsedTime(),
        t = survivalTimer.formatTime(e),
        i = document.getElementById('gameOver');
    i &&
        (i.innerHTML = `\n            <h2>Time Trial Complete!</h2>\n            <p>Survival Time: ${t}</p>\n            ${leaderboardSystem.isNewRecord(e) ? '<p class="new-record">New Personal Best!</p>' : ''}\n            <button id="changeModeButton" onclick="showModeSelector()" style="\n                margin-top: 20px;\n                padding: 10px 20px;\n                font-size: 1.2em;\n                background: rgba(0, 255, 255, 0.2);\n                border: 2px solid #00ffff;\n                color: white;\n                border-radius: 5px;\n                cursor: pointer;\n            ">Change Mode</button>\n        `);
}
function createTimeTrialUI() {
    let e = document.getElementById('timer-display');
    (e ||
        ((e = document.createElement('div')),
        (e.id = 'timer-display'),
        (e.className = 'timer-display'),
        (e.textContent = '00:00.00'),
        document.body.appendChild(e)),
        addTimeTrialStyles());
}
function addTimeTrialStyles() {
    if (document.getElementById('time-trial-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'time-trial-styles'),
        (e.textContent =
            "\n        .timer-display {\n            position: fixed;\n            top: 20px;\n            left: 50%;\n            transform: translateX(-50%);\n            font-size: 36px;\n            font-weight: bold;\n            color: #00ffff;\n            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);\n            z-index: 100;\n            font-family: 'Courier New', monospace;\n            background: rgba(0, 0, 0, 0.7);\n            padding: 10px 20px;\n            border-radius: 5px;\n            border: 2px solid #00ffff;\n        }\n\n        .new-record {\n            color: #ffff00;\n            font-weight: bold;\n            text-shadow: 0 0 10px rgba(255, 255, 0, 0.8);\n        }\n\n        .ui-hidden {\n            display: none !important;\n        }\n\n        @media (max-width: 768px) {\n            .timer-display {\n                font-size: 24px;\n                top: 10px;\n                padding: 8px 16px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function updateUIForGameMode() {
    const e = document.getElementById('difficultySelector'),
        t = document.getElementById('aiCountSelector');
    currentGameMode === GameModes.TIME_TRIAL
        ? (e && e.classList.add('ui-hidden'), t && t.classList.add('ui-hidden'))
        : currentGameMode === GameModes.ARENA_SHRINK
          ? (e && e.classList.add('ui-hidden'), t && t.classList.remove('ui-hidden'))
          : currentGameMode === GameModes.LOCAL_MULTIPLAYER
            ? (e && e.classList.add('ui-hidden'), t && t.classList.add('ui-hidden'))
            : (e && e.classList.remove('ui-hidden'), t && t.classList.remove('ui-hidden'));
}
function hideTimeTrialUI() {
    const e = document.getElementById('timer-display');
    e && e.remove();
}
function createArenaShrinkUI() {
    let e = document.getElementById('arena-timer-display');
    e ||
        ((e = document.createElement('div')),
        (e.id = 'arena-timer-display'),
        (e.className = 'arena-timer-display'),
        (e.textContent = '00:00.00'),
        document.body.appendChild(e));
    let t = document.getElementById('arena-info-display');
    (t ||
        ((t = document.createElement('div')),
        (t.id = 'arena-info-display'),
        (t.className = 'arena-info-display'),
        (t.innerHTML =
            '\n            <div class="arena-size">Arena: 30x30</div>\n            <div class="shrink-countdown">Next shrink: 5.0s</div>\n        '),
        document.body.appendChild(t)),
        addArenaShrinkStyles());
}
function updateArenaShrinkDisplay() {
    const e = game.getGameState(),
        t = document.getElementById('arena-timer-display');
    t && e.formattedSurvivalTime && (t.textContent = e.formattedSurvivalTime);
    const i = document.getElementById('arena-info-display');
    if (i && e.arenaState) {
        const t = e.arenaState,
            r = i.querySelector('.arena-size'),
            n = i.querySelector('.shrink-countdown');
        if ((r && (r.textContent = `Arena: ${t.currentSize}x${t.currentSize}`), n))
            if (t.isAtMinimum) ((n.textContent = 'FINAL ARENA'), n.classList.add('final-arena'));
            else if (t.warningActive) {
                const e = (t.timeUntilShrink / 1e3).toFixed(1);
                ((n.textContent = `Shrinking in: ${e}s`), n.classList.add('warning-active'));
            } else {
                const e = (t.timeUntilShrink / 1e3).toFixed(1);
                ((n.textContent = `Next shrink: ${e}s`),
                    n.classList.remove('warning-active', 'final-arena'));
            }
    }
}
function hideArenaShrinkUI() {
    const e = document.getElementById('arena-timer-display');
    e && e.remove();
    const t = document.getElementById('arena-info-display');
    t && t.remove();
}
function showArenaShrinkGameOver() {
    game.getSurvivalTime();
    const e = game.getFormattedSurvivalTime(),
        t = game.getShrinksSurvived(),
        i = game.getBounds().size,
        r = document.getElementById('gameOver');
    if (r) {
        const n = game.getGameState(),
            s = n.playerScore > n.aiScore ? 'You Win!' : 'AI Wins!';
        r.innerHTML = `\n            <h2>${s}</h2>\n            <p>Survival Time: ${e}</p>\n            <p>Shrinks Survived: ${t}</p>\n            <p>Final Arena: ${i}x${i}</p>\n            <button id="changeModeButton" onclick="showModeSelector()" style="\n                margin-top: 20px;\n                padding: 10px 20px;\n                font-size: 1.2em;\n                background: rgba(0, 255, 255, 0.2);\n                border: 2px solid #00ffff;\n                color: white;\n                border-radius: 5px;\n                cursor: pointer;\n            ">Change Mode</button>\n        `;
    }
}
function addArenaShrinkStyles() {
    if (document.getElementById('arena-shrink-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'arena-shrink-styles'),
        (e.textContent =
            "\n        .arena-timer-display {\n            position: fixed;\n            top: 20px;\n            left: 20px;\n            font-size: 24px;\n            font-weight: bold;\n            color: #00ffff;\n            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);\n            z-index: 100;\n            font-family: 'Courier New', monospace;\n            background: rgba(0, 0, 0, 0.7);\n            padding: 8px 16px;\n            border-radius: 5px;\n            border: 2px solid #00ffff;\n        }\n\n        .arena-info-display {\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            font-size: 18px;\n            font-weight: bold;\n            color: #ffffff;\n            text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);\n            z-index: 100;\n            font-family: 'Courier New', monospace;\n            background: rgba(0, 0, 0, 0.7);\n            padding: 12px 20px;\n            border-radius: 5px;\n            border: 2px solid #ffffff;\n            text-align: right;\n        }\n\n        .arena-info-display .arena-size {\n            margin-bottom: 8px;\n            color: #00ff00;\n        }\n\n        .arena-info-display .shrink-countdown {\n            color: #ffff00;\n            transition: color 0.3s ease;\n        }\n\n        .arena-info-display .shrink-countdown.warning-active {\n            color: #ff4444;\n            animation: warningPulse 0.5s ease-in-out infinite alternate;\n        }\n\n        .arena-info-display .shrink-countdown.final-arena {\n            color: #ff0000;\n            font-weight: bold;\n            animation: finalArenaPulse 1s ease-in-out infinite alternate;\n        }\n\n        @keyframes warningPulse {\n            from { opacity: 0.7; }\n            to { opacity: 1.0; }\n        }\n\n        @keyframes finalArenaPulse {\n            from { \n                opacity: 0.8;\n                text-shadow: 0 0 8px rgba(255, 0, 0, 0.6);\n            }\n            to { \n                opacity: 1.0;\n                text-shadow: 0 0 15px rgba(255, 0, 0, 1.0);\n            }\n        }\n\n        @media (max-width: 768px) {\n            .arena-timer-display {\n                font-size: 18px;\n                top: 10px;\n                left: 10px;\n                padding: 6px 12px;\n            }\n            \n            .arena-info-display {\n                font-size: 14px;\n                top: 10px;\n                right: 10px;\n                padding: 8px 16px;\n            }\n        }\n\n        @media (max-width: 480px) {\n            .arena-timer-display {\n                font-size: 16px;\n                padding: 4px 8px;\n            }\n            \n            .arena-info-display {\n                font-size: 12px;\n                padding: 6px 12px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function showFinalArenaMessage() {
    let e = document.getElementById('final-arena-message');
    (e ||
        ((e = document.createElement('div')),
        (e.id = 'final-arena-message'),
        (e.className = 'final-arena-message'),
        document.body.appendChild(e)),
        (e.innerHTML = '<span class="final-arena-text">FINAL ARENA</span>'),
        (e.style.display = 'block'),
        (e.style.opacity = '0'),
        setTimeout(() => {
            e.style.opacity = '1';
        }, 50),
        setTimeout(() => {
            hideFinalArenaMessage();
        }, 3e3),
        addFinalArenaStyles());
}
function hideFinalArenaMessage() {
    const e = document.getElementById('final-arena-message');
    e &&
        ((e.style.opacity = '0'),
        setTimeout(() => {
            e.style.display = 'none';
        }, 500));
}
function addFinalArenaStyles() {
    if (document.getElementById('final-arena-styles')) return;
    const e = document.createElement('style');
    ((e.id = 'final-arena-styles'),
        (e.textContent =
            "\n        .final-arena-message {\n            position: fixed;\n            top: 30%;\n            left: 50%;\n            transform: translateX(-50%);\n            z-index: 200;\n            display: none;\n            opacity: 0;\n            transition: opacity 0.5s ease-in-out;\n            pointer-events: none;\n        }\n\n        .final-arena-text {\n            font-size: 48px;\n            font-weight: bold;\n            color: #ff4444;\n            text-shadow: \n                0 0 10px rgba(255, 68, 68, 0.8),\n                0 0 20px rgba(255, 68, 68, 0.6),\n                0 0 30px rgba(255, 68, 68, 0.4);\n            font-family: 'Courier New', monospace;\n            background: rgba(0, 0, 0, 0.8);\n            padding: 20px 40px;\n            border-radius: 10px;\n            border: 3px solid #ff4444;\n            animation: finalArenaGlow 2s ease-in-out infinite alternate;\n        }\n\n        @keyframes finalArenaGlow {\n            from {\n                text-shadow: \n                    0 0 10px rgba(255, 68, 68, 0.8),\n                    0 0 20px rgba(255, 68, 68, 0.6),\n                    0 0 30px rgba(255, 68, 68, 0.4);\n                border-color: #ff4444;\n            }\n            to {\n                text-shadow: \n                    0 0 15px rgba(255, 68, 68, 1.0),\n                    0 0 25px rgba(255, 68, 68, 0.8),\n                    0 0 35px rgba(255, 68, 68, 0.6);\n                border-color: #ff6666;\n            }\n        }\n\n        @media (max-width: 768px) {\n            .final-arena-text {\n                font-size: 32px;\n                padding: 15px 30px;\n            }\n        }\n\n        @media (max-width: 480px) {\n            .final-arena-text {\n                font-size: 24px;\n                padding: 10px 20px;\n            }\n        }\n    "),
        document.head.appendChild(e));
}
function initializeGame() {
    return __async(this, null, function* () {
        try {
            recoveryManager = new RecoveryManager();
            const e = new GameInitializer(recoveryManager),
                t = yield e.initialize();
            if (!t.success) return !1;
            const { components: i } = t;
            ((game = i.game),
                (aiCoordinator = i.aiCoordinator),
                (collisionDetectionEngine = i.collisionDetectionEngine),
                (playerCollisionHandler = i.playerCollisionHandler),
                (playerController = i.playerController),
                (renderingEngine = i.renderingEngine),
                (loadingIndicator = t.loadingIndicator),
                (initializationState = t.initializationState));
            const r = new SystemInitializer(recoveryManager, i);
            (r.registerRecoveryStrategies(),
                loadingIndicator.updateProgress('controls', 'Setting up controls...'),
                setupEventListeners(),
                initializationState.completeStep('controlsSetup'),
                loadingIndicator.updateProgress('systems', 'Initializing game systems...'));
            const n = yield r.initializeGameSystemsWithRecovery();
            (initializationState.completeStep('systemsInit'),
                (scoreDisplay = n.scoreDisplay),
                (cameraEffectsManager = n.cameraEffectsManager),
                (audioManager = n.audioManager),
                (difficultyManager = n.difficultyManager),
                (powerUpManager = n.powerUpManager),
                (statusIndicator = n.statusIndicator),
                (glowEffectManager = n.glowEffectManager),
                (performanceMonitor = n.performanceMonitor),
                (performanceDegradationManager = n.performanceDegradationManager),
                (modeSelector = n.modeSelector),
                (survivalTimer = n.survivalTimer),
                (countdownTimer = n.countdownTimer),
                (leaderboardSystem = n.leaderboardSystem),
                (achievementSystem = n.achievementSystem),
                (particleSettingsUI = n.particleSettingsUI),
                (cameraEffectsUI = n.cameraEffectsUI),
                (glowSettingsUI = n.glowSettingsUI),
                (customizationManager = n.customizationManager),
                (customizationUI = n.customizationUI),
                (musicSettingsUI = n.musicSettingsUI),
                (styleManager = n.styleManager),
                (modeUI = n.modeUI),
                (gameOverUI = n.gameOverUI),
                (uiManager = n.uiManager),
                (currentAICount = n.currentAICount),
                performanceDegradationManager &&
                    (performanceDegradationManager.setOnDegradation((e, t) => {
                        logger.info(`Performance degradation: ${e}`, t);
                        try {
                            showPerformanceNotification(
                                `Performance optimization applied: ${e.replace('_', ' ')}`
                            );
                        } catch (i) {
                            logger.error('Error showing performance notification:', i);
                        }
                    }),
                    performanceDegradationManager.setOnRecovery((e, t) => {
                        logger.info(`Performance recovery: ${e}`, t);
                        try {
                            showPerformanceNotification(
                                `Performance restored: ${e.replace('_', ' ')}`
                            );
                        } catch (i) {
                            logger.error('Error showing performance notification:', i);
                        }
                    }),
                    performanceDegradationManager.setOnPerformanceModeToggle((e, t) => {
                        logger.info('Performance mode ' + (e ? 'enabled' : 'disabled'), t);
                        try {
                            updatePerformanceModeUI(e);
                        } catch (i) {
                            logger.error('Error updating performance mode UI:', i);
                        }
                    })),
                (window.scoreDisplayInstance = scoreDisplay),
                (window.audioManager = audioManager),
                (window.difficultyManager = difficultyManager),
                (window.powerUpManager = powerUpManager),
                (window.statusIndicator = statusIndicator),
                (window.modeSelector = modeSelector),
                (window.survivalTimer = survivalTimer),
                (window.leaderboardSystem = leaderboardSystem),
                (window.achievementSystem = achievementSystem),
                (window.showModeSelector = showModeSelector),
                (window.performanceMonitor = performanceMonitor),
                (window.performanceDegradationManager = performanceDegradationManager),
                (window.glowEffectManager = glowEffectManager),
                (window.glowSettingsUI = glowSettingsUI),
                (window.cameraEffectsManager = cameraEffectsManager),
                (window.musicSettingsUI = musicSettingsUI),
                (window.getMusicPlayer = () => audioManager.getMusicPlayer()),
                (window.getMusicSettings = () => audioManager.getMusicSettings()),
                (window.isMusicAvailable = () => audioManager.isMusicAvailable()),
                modeSelector.setOnModeSelected((e) => {
                    const t = currentGameMode;
                    ((currentGameMode = e),
                        (isTimeTrialActive = e === GameModes.TIME_TRIAL),
                        glowEffectManager &&
                            glowEffectManager.initialized &&
                            glowEffectManager.handleGameModeSwitch(e, t),
                        startGameWithMode(e));
                }),
                updateMuteButton(),
                updatePerformanceButton(),
                updateDifficultyUI(),
                updateAICountUI(),
                initializeAIControllers(currentAICount),
                modeSelector.show(),
                loadingIndicator.updateProgress('mode-selector', 'Preparing mode selector...'),
                initializationState.completeStep('modeSelectorReady'),
                loadingIndicator.updateProgress('start', 'Starting game...'),
                loadingIndicator.hide(),
                (gameLoop = new GameLoop({
                    game: game,
                    renderingEngine: renderingEngine,
                    performanceMonitor: performanceMonitor,
                    performanceDegradationManager: performanceDegradationManager,
                    glowEffectManager: glowEffectManager,
                    cameraEffectsManager: cameraEffectsManager,
                    powerUpManager: powerUpManager,
                    statusIndicator: statusIndicator,
                    audioManager: audioManager,
                    scoreDisplay: scoreDisplay,
                    survivalTimer: survivalTimer,
                    leaderboardSystem: leaderboardSystem,
                    achievementSystem: achievementSystem,
                    localScoringUI: localScoringUI,
                    splitScreenCamera: splitScreenCamera,
                    collisionDetectionEngine: collisionDetectionEngine,
                    playerCollisionHandler: playerCollisionHandler,
                    recoveryManager: recoveryManager,
                    uiManager: uiManager,
                    gameOverUI: gameOverUI,
                    modeUI: modeUI,
                    aiCoordinator: aiCoordinator,
                    difficultyManager: difficultyManager,
                    updatePauseOverlay: updatePauseOverlay,
                    updateTimeTrialDisplay: updateTimeTrialDisplay,
                    updateArenaShrinkDisplay: updateArenaShrinkDisplay,
                    updateRemainingEntityDisplay: updateRemainingEntityDisplay,
                    showMultiplayerGameOver: showMultiplayerGameOver,
                    showTimeTrialGameOver: showTimeTrialGameOver,
                    showArenaShrinkGameOver: showArenaShrinkGameOver,
                    showMultiAIGameOver: showMultiAIGameOver,
                    calculateMultiAIDirections: calculateMultiAIDirections,
                    applyAIDecisions: applyAIDecisions,
                    handleMultiAICollisions: handleMultiAICollisions,
                    currentGameMode: currentGameMode,
                    isTimeTrialActive: isTimeTrialActive,
                    aiControllers: aiControllers,
                })),
                gameLoop.start(),
                initializationState.complete(),
                logger.info('Game initialization completed successfully'),
                logger.info('Initialization state:', initializationState.getState()));
            const s = recoveryManager.getStatus();
            return (
                s.disabledFeatures.length > 0 &&
                    logger.warn('Some features were disabled:', s.disabledFeatures),
                s.fallbackMode && logger.warn('Running in fallback mode'),
                !0
            );
        } catch (e) {
            if ((logger.error('Game initialization failed:', e), initializationState)) {
                (initializationState.recordError(initializationState.currentStep || 'unknown', e),
                    logger.info(
                        'Initialization state at failure:',
                        initializationState.getState()
                    ));
                const t = initializationState.getRecoveryRecommendation();
                logger.info('Recovery recommendation:', t);
            }
            return (
                loadingIndicator
                    ? loadingIndicator.showError(e, () => {
                          window.location.reload();
                      })
                    : recoveryManager
                      ? recoveryManager.handleInitializationError(
                            e,
                            () => {
                                window.location.reload();
                            },
                            'Game'
                        )
                      : showInitializationError(e),
                !1
            );
        }
    });
}
function setupEventListeners() {
    ((eventManager = new EventManager({
        game: game,
        playerController: playerController,
        audioManager: audioManager,
        renderingEngine: renderingEngine,
        glowEffectManager: glowEffectManager,
        cameraEffectsManager: cameraEffectsManager,
        difficultyManager: difficultyManager,
        performanceDegradationManager: performanceDegradationManager,
        restartGame: restartGame,
        updatePauseOverlay: updatePauseOverlay,
        updateMuteButton: updateMuteButton,
        updatePerformanceButton: updatePerformanceButton,
        setAICount: setAICount,
        updateAICountUI: updateAICountUI,
        updateDifficultyUI: updateDifficultyUI,
    })),
        eventManager.registerAll());
}
function showInitializationError(e) {
    const t = document.createElement('div');
    ((t.id = 'initialization-error'),
        (t.style.cssText =
            '\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        background: rgba(255, 0, 0, 0.9);\n        color: white;\n        padding: 30px;\n        border-radius: 10px;\n        font-family: Arial, sans-serif;\n        text-align: center;\n        z-index: 10000;\n        max-width: 500px;\n        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);\n    '),
        (t.innerHTML = `\n        <h2 style="margin: 0 0 15px 0; font-size: 2em;">Initialization Failed</h2>\n        <p style="margin: 0 0 15px 0; font-size: 1.1em;">\n            The game failed to initialize properly.\n        </p>\n        <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">\n            Error: ${e.message}\n        </p>\n        <p style="margin: 0; font-size: 0.9em; color: #ffcccc;">\n            Please try refreshing the page. If the problem persists, check the browser console for details.\n        </p>\n        <button onclick="location.reload()" style="\n            margin-top: 20px;\n            padding: 10px 20px;\n            font-size: 1em;\n            background: rgba(255, 255, 255, 0.2);\n            border: 2px solid white;\n            color: white;\n            border-radius: 5px;\n            cursor: pointer;\n        ">Reload Page</button>\n    `),
        document.body.appendChild(t));
}
function startGameWhenReady() {
    initializeGame().catch((e) => {
        logger.error('Fatal initialization error:', e);
    });
}
((window.scoreDisplayInstance = scoreDisplay),
    (window.audioManager = audioManager),
    (window.difficultyManager = difficultyManager),
    (window.powerUpManager = powerUpManager),
    (window.statusIndicator = statusIndicator),
    (window.modeSelector = modeSelector),
    (window.survivalTimer = survivalTimer),
    (window.leaderboardSystem = leaderboardSystem),
    (window.achievementSystem = achievementSystem),
    (window.showModeSelector = showModeSelector),
    (window.performanceMonitor = performanceMonitor),
    (window.performanceDegradationManager = performanceDegradationManager),
    'loading' === document.readyState
        ? document.addEventListener('DOMContentLoaded', startGameWhenReady)
        : startGameWhenReady());
//# sourceMappingURL=index-Bmg4SEj1.js.map
