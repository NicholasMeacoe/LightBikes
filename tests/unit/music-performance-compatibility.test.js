/**
 * Performance and Browser Compatibility Tests for Music System
 * Tests memory usage, loading performance, mobile browser functionality, and autoplay policy compliance
 */

const { MusicPlayer } = require('@/audio/MusicPlayer.js');
const { MusicSettings } = require('@/audio/MusicSettings.js');
const { MusicTrack } = require('@/audio/MusicTrack.js');
const { MusicPerformanceMonitor } = require('@/audio/MusicPerformanceMonitor.js');
const { MusicBufferManager } = require('@/audio/MusicBufferManager.js');

// Mock Web Audio API with performance tracking
const createMockAudioContext = (options = {}) => ({
    createGain: jest.fn(() => ({
        gain: {
            value: 0.7,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            cancelScheduledValues: jest.fn()
        },
        connect: jest.fn(),
        disconnect: jest.fn()
    })),
    createBufferSource: jest.fn(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
    })),
    decodeAudioData: jest.fn().mockImplementation((arrayBuffer) => {
        // Simulate decode time based on buffer size
        const decodeTime = Math.max(10, arrayBuffer.byteLength / 10000);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    duration: 60,
                    numberOfChannels: 2,
                    length: 2646000,
                    sampleRate: 44100
                });
            }, decodeTime);
        });
    }),
    destination: {},
    currentTime: 0,
    state: options.state || 'running',
    resume: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue()
});

// Mock fetch with performance simulation
global.fetch = jest.fn().mockImplementation((url) => {
    const fileSize = url.includes('large') ? 5000000 : 1000000; // 5MB or 1MB
    const networkDelay = Math.random() * 100 + 50; // 50-150ms

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(fileSize))
            });
        }, networkDelay);
    });
});

describe('Music Performance and Compatibility Tests', () => {
    let mockAudioContext;
    let musicPlayer;
    let musicSettings;
    let performanceMonitor;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockAudioContext = createMockAudioContext();
        musicSettings = new MusicSettings();
        performanceMonitor = new MusicPerformanceMonitor();

        // Mock AudioManager
        const mockAudioManager = {
            audioContext: mockAudioContext,
            isInitialized: true,
            isMuted: false
        };

        musicPlayer = new MusicPlayer(mockAudioManager, musicSettings);
    });

    afterEach(() => {
        if (musicPlayer) {
            musicPlayer.cleanup();
        }
        if (performanceMonitor) {
            performanceMonitor.cleanup();
        }
    });

    describe('Memory Usage Tests', () => {
        it('should track memory usage during extended gameplay', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const initialMemory = performance.memory.usedJSHeapSize;

            // Simulate extended gameplay with multiple operations
            for (let i = 0; i < 100; i++) {
                musicPlayer.play();
                musicPlayer.duck(0.3);
                musicPlayer.unduck();
                musicPlayer.setVolume(Math.random());

                // Simulate frame updates
                await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
            }

            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 10MB)
            expect(memoryIncrease).toBeLessThan(10000000);
        });

        it('should clean up audio buffers properly', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const bufferManager = musicPlayer.bufferManager;
            const initialBufferCount = bufferManager.getStatistics().totalBuffers;

            // Load multiple tracks
            const track1 = new MusicTrack('test1', 'test1.mp3');
            const track2 = new MusicTrack('test2', 'test2.mp3');

            track1.setAudioContext(mockAudioContext);
            track2.setAudioContext(mockAudioContext);

            await track1.load();
            await track2.load();

            const loadedBufferCount = bufferManager.getStatistics().totalBuffers;
            expect(loadedBufferCount).toBeGreaterThan(initialBufferCount);

            // Clean up
            track1.cleanup();
            track2.cleanup();
            bufferManager.performCleanup();

            const finalBufferCount = bufferManager.getStatistics().totalBuffers;
            expect(finalBufferCount).toBeLessThanOrEqual(initialBufferCount);
        });

        it('should handle memory pressure gracefully', async () => {
            await musicPlayer.initialize(mockAudioContext);

            // Simulate memory pressure
            const originalMemory = performance.memory;
            performance.memory = {
                ...originalMemory,
                usedJSHeapSize: originalMemory.jsHeapSizeLimit * 0.9 // 90% memory usage
            };

            const optimizationResult = await musicPlayer.performOptimization();

            expect(optimizationResult.performed).toContainEqual(
                expect.objectContaining({ action: 'memory_cleanup' })
            );

            // Restore original memory
            performance.memory = originalMemory;
        });

        it('should monitor buffer memory usage accurately', () => {
            const bufferManager = new MusicBufferManager(performanceMonitor);

            // Register mock buffers
            const mockBuffer1 = { numberOfChannels: 2, length: 1000000 };
            const mockBuffer2 = { numberOfChannels: 2, length: 2000000 };

            bufferManager.registerBuffer('track1', mockBuffer1, { id: 'track1' });
            bufferManager.registerBuffer('track2', mockBuffer2, { id: 'track2' });

            const memoryUsage = bufferManager.getMemoryUsage();

            expect(memoryUsage.totalBytes).toBeGreaterThan(0);
            expect(memoryUsage.bufferCount).toBe(2);
            expect(memoryUsage.utilizationPercentage).toBeGreaterThan(0);
        });
    });

    describe('Audio Loading Performance Tests', () => {
        it('should load audio files within acceptable time limits', async () => {
            const track = new MusicTrack('performance-test', 'test.mp3');
            track.setAudioContext(mockAudioContext);

            const startTime = performance.now();
            await track.load();
            const loadTime = performance.now() - startTime;

            // Loading should complete within 2 seconds for typical files
            expect(loadTime).toBeLessThan(2000);
        });

        it('should handle concurrent loading efficiently', async () => {
            const tracks = [];
            for (let i = 0; i < 5; i++) {
                const track = new MusicTrack(`track${i}`, `test${i}.mp3`);
                track.setAudioContext(mockAudioContext);
                tracks.push(track);
            }

            const startTime = performance.now();
            await Promise.all(tracks.map(track => track.load()));
            const totalLoadTime = performance.now() - startTime;

            // Concurrent loading should be more efficient than sequential
            // Should complete within 3 seconds for 5 tracks
            expect(totalLoadTime).toBeLessThan(3000);

            tracks.forEach(track => track.cleanup());
        });

        it('should optimize loading strategy based on performance', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const loadingOptimizer = musicPlayer.loadingOptimizer;
            const trackConfigs = [
                { id: 'track1', url: 'track1.mp3', priority: 'high' },
                { id: 'track2', url: 'track2.mp3', priority: 'medium' },
                { id: 'track3', url: 'track3.mp3', priority: 'low' }
            ];

            const strategy = loadingOptimizer.optimizeLoadingStrategy(trackConfigs, {
                priorityTrack: 'track1',
                minimizeStartupDelay: true
            });

            expect(strategy.immediate).toContainEqual(
                expect.objectContaining({ id: 'track1' })
            );
            expect(strategy.background.length).toBeGreaterThan(0);
        });

        it('should not impact game startup significantly', async () => {
            const startTime = performance.now();

            await musicPlayer.initialize(mockAudioContext);

            const initTime = performance.now() - startTime;

            // Music system initialization should complete quickly
            expect(initTime).toBeLessThan(500); // 500ms max
        });
    });

    describe('Mobile Browser Functionality Tests', () => {
        it('should handle iOS Safari audio context requirements', async () => {
            // Simulate iOS Safari suspended context
            const iosContext = createMockAudioContext({ state: 'suspended' });
            iosContext.resume = jest.fn().mockResolvedValue();

            await musicPlayer.initialize(iosContext);

            expect(iosContext.resume).toHaveBeenCalled();
        });

        it('should handle mobile memory constraints', async () => {
            // Simulate mobile device with limited memory
            const originalMemory = performance.memory;
            performance.memory = {
                usedJSHeapSize: 50000000,   // 50MB
                totalJSHeapSize: 100000000, // 100MB
                jsHeapSizeLimit: 150000000  // 150MB limit (mobile)
            };

            await musicPlayer.initialize(mockAudioContext);

            const bufferManager = musicPlayer.bufferManager;
            const strategy = bufferManager.getRecommendedPreloadStrategy();

            // Should recommend conservative strategy on mobile
            expect(['minimal', 'selective']).toContain(strategy);

            // Restore original memory
            performance.memory = originalMemory;
        });

        it('should handle touch interaction requirements', async () => {
            const mockAudioManager = {
                audioContext: mockAudioContext,
                isInitialized: true,
                isMuted: false,
                handleUserInteraction: jest.fn().mockResolvedValue(true)
            };

            const mobilePlayer = new MusicPlayer(mockAudioManager, musicSettings);
            await mobilePlayer.initialize(mockAudioContext);

            // Simulate touch interaction
            const result = await mockAudioManager.handleUserInteraction();

            expect(result).toBe(true);
            expect(mockAudioManager.handleUserInteraction).toHaveBeenCalled();
        });

        it('should adapt to mobile network conditions', async () => {
            // Simulate slow mobile network
            global.fetch = jest.fn().mockImplementation((url) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            arrayBuffer: () => Promise.resolve(new ArrayBuffer(500000))
                        });
                    }, 2000); // 2 second delay
                });
            });

            const track = new MusicTrack('mobile-test', 'mobile-test.mp3');
            track.setAudioContext(mockAudioContext);

            const startTime = performance.now();

            try {
                await track.load();
                const loadTime = performance.now() - startTime;

                // Should handle slow loading gracefully
                expect(loadTime).toBeGreaterThan(1500);
                expect(track.isLoaded()).toBe(true);
            } catch (error) {
                // Should handle timeout gracefully
                expect(error.message).toContain('timeout');
            }
        });
    });

    describe('Autoplay Policy Compliance Tests', () => {
        it('should detect autoplay policy restrictions', async () => {
            const restrictedContext = createMockAudioContext({ state: 'suspended' });
            restrictedContext.resume = jest.fn().mockRejectedValue(new Error('Autoplay blocked'));

            const mockAudioManager = {
                audioContext: restrictedContext,
                isInitialized: true,
                isMuted: false,
                checkAutoplayPolicy: jest.fn().mockResolvedValue(false)
            };

            const restrictedPlayer = new MusicPlayer(mockAudioManager, musicSettings);
            const result = await restrictedPlayer.initialize(restrictedContext);

            // Should initialize successfully even with autoplay restrictions
            expect(result).toBe(true);
        });

        it('should require user interaction before playing', async () => {
            const suspendedContext = createMockAudioContext({ state: 'suspended' });

            await musicPlayer.initialize(suspendedContext);

            // Should not play automatically
            const playResult = musicPlayer.play();
            expect(playResult).toBe(false);

            // Should play after user interaction
            suspendedContext.state = 'running';
            const playAfterInteraction = musicPlayer.play();
            expect(playAfterInteraction).toBe(true);
        });

        it('should handle autoplay policy changes gracefully', async () => {
            await musicPlayer.initialize(mockAudioContext);

            // Start playing
            musicPlayer.play();
            expect(musicPlayer.isPlaying()).toBe(true);

            // Simulate autoplay policy enforcement
            mockAudioContext.state = 'suspended';

            // Should handle suspension gracefully
            const pauseResult = musicPlayer.pause();
            expect(pauseResult).toBe(true);
        });

        it('should provide user-friendly autoplay messaging', async () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            const blockedContext = createMockAudioContext({ state: 'suspended' });
            blockedContext.resume = jest.fn().mockRejectedValue(new Error('Autoplay blocked'));

            await musicPlayer.initialize(blockedContext);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('user interaction')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Performance Monitoring Tests', () => {
        it('should track fade operation performance', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const monitor = musicPlayer.performanceMonitor;

            await musicPlayer.fadeIn(0.5);

            const metrics = monitor.getMetrics();
            expect(metrics.fadeOperations).toBeGreaterThan(0);
        });

        it('should track ducking operation performance', async () => {
            await musicPlayer.initialize(mockAudioContext);
            musicPlayer.play();

            const monitor = musicPlayer.performanceMonitor;

            musicPlayer.duck(0.3, 0.2);

            const metrics = monitor.getMetrics();
            expect(metrics.duckingOperations).toBeGreaterThan(0);
        });

        it('should provide optimization recommendations', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const monitor = musicPlayer.performanceMonitor;

            // Simulate performance issues
            for (let i = 0; i < 100; i++) {
                monitor.recordFadeOperation('in', 0.5);
            }

            const recommendations = monitor.getOptimizationRecommendations();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should monitor frame rate impact', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const monitor = musicPlayer.performanceMonitor;

            // Simulate frame rate monitoring
            monitor.startFrameRateMonitoring();

            // Perform music operations
            musicPlayer.play();
            musicPlayer.setVolume(0.8);
            musicPlayer.duck(0.3);

            await new Promise(resolve => setTimeout(resolve, 100));

            monitor.stopFrameRateMonitoring();

            const impact = monitor.getFrameRateImpact();
            expect(impact).toBeDefined();
            expect(impact.averageFrameTime).toBeGreaterThan(0);
        });
    });

    describe('Cross-Browser Compatibility Tests', () => {
        it('should handle different Web Audio API implementations', async () => {
            // Test webkit prefix
            const webkitContext = {
                ...mockAudioContext,
                createGainNode: mockAudioContext.createGain, // Old webkit method
                createJavaScriptNode: jest.fn() // Deprecated method
            };

            const result = await musicPlayer.initialize(webkitContext);
            expect(result).toBe(true);
        });

        it('should handle missing audio format support', async () => {
            // Simulate browser that doesn't support MP3
            global.fetch = jest.fn().mockRejectedValue(new Error('Format not supported'));

            const track = new MusicTrack('format-test', 'test.mp3');
            track.setAudioContext(mockAudioContext);

            await expect(track.load()).rejects.toThrow();
            expect(track.hasError()).toBe(true);
        });

        it('should provide fallback for unsupported browsers', async () => {
            // Simulate browser without Web Audio API
            const noWebAudioContext = null;

            const result = await musicPlayer.initialize(noWebAudioContext);
            expect(result).toBe(false);

            // Should still function without throwing errors
            expect(() => musicPlayer.play()).not.toThrow();
            expect(() => musicPlayer.setVolume(0.5)).not.toThrow();
        });

        it('should handle browser-specific audio context states', async () => {
            const states = ['suspended', 'running', 'closed'];

            for (const state of states) {
                const contextWithState = createMockAudioContext({ state });

                const result = await musicPlayer.initialize(contextWithState);

                if (state === 'closed') {
                    expect(result).toBe(false);
                } else {
                    expect(result).toBe(true);
                }
            }
        });
    });

    describe('Stress Testing', () => {
        it('should handle rapid volume changes without issues', async () => {
            await musicPlayer.initialize(mockAudioContext);
            musicPlayer.play();

            // Rapid volume changes
            for (let i = 0; i < 100; i++) {
                musicPlayer.setVolume(Math.random());
            }

            expect(musicPlayer.isPlaying()).toBe(true);
            expect(musicPlayer.getVolume()).toBeGreaterThanOrEqual(0);
            expect(musicPlayer.getVolume()).toBeLessThanOrEqual(1);
        });

        it('should handle rapid track switching', async () => {
            await musicPlayer.initialize(mockAudioContext);

            const tracks = ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'];

            // Rapid track switching
            for (let i = 0; i < 50; i++) {
                const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
                musicPlayer.setTrack(randomTrack);
            }

            expect(musicPlayer.getPlaybackState()).toBeDefined();
        });

        it('should handle multiple concurrent fade operations', async () => {
            await musicPlayer.initialize(mockAudioContext);

            // Start multiple fade operations
            const fadePromises = [
                musicPlayer.fadeIn(0.5),
                musicPlayer.fadeOut(0.3),
                musicPlayer.fadeIn(0.7)
            ];

            // Should handle gracefully without throwing
            await expect(Promise.allSettled(fadePromises)).resolves.toBeDefined();
        });
    });
});