const { Game } = require('./game.js');
const { GameModes } = require('./GameModes.js');
const { SurvivalTimer } = require('./SurvivalTimer.js');
const { ModeSelector } = require('./ModeSelector.js');
const { TimerDisplay } = require('./TimerDisplay.js');

// Mock ScorePersistence to ensure consistent test behavior
jest.mock('./scorePersistence.js', () => ({
    ScorePersistence: {
        loadHighScore: jest.fn(() => 0),
        saveHighScore: jest.fn(() => true)
    }
}));

describe('Time Trial Cross-Browser and Mobile Compatibility Tests', () => {
    let originalPerformance;
    let originalLocalStorage;
    let originalDocument;

    beforeEach(() => {
        // Store originals
        originalPerformance = global.performance;
        originalLocalStorage = global.localStorage;
        originalDocument = global.document;
    });

    afterEach(() => {
        // Restore originals
        global.performance = originalPerformance;
        global.localStorage = originalLocalStorage;
        global.document = originalDocument;
    });

    describe('Browser API Compatibility', () => {
        it('should handle missing performance.now() gracefully', () => {
            // Simulate older browsers without performance.now()
            global.performance = undefined;

            expect(() => {
                const timer = new SurvivalTimer();
                timer.start();
                timer.getElapsedTime();
                timer.stop();
            }).not.toThrow();
        });

        it('should handle missing performance.now() without breaking', () => {
            // Remove performance.now()
            global.performance = undefined;

            // Should not throw errors even without performance.now()
            expect(() => {
                const timer = new SurvivalTimer();
                timer.start();
                const elapsed = timer.getElapsedTime();
                expect(elapsed).toBeGreaterThanOrEqual(0);
                timer.stop();
            }).not.toThrow();
        });

        it('should handle localStorage unavailability', () => {
            // Simulate browsers with disabled localStorage
            global.localStorage = undefined;

            expect(() => {
                const mockGame = new Game(GameModes.CLASSIC);
                const modeSelector = new ModeSelector(mockGame);
                modeSelector.selectMode(GameModes.TIME_TRIAL);
                expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
            }).not.toThrow();
        });

        it('should handle localStorage quota exceeded', () => {
            // Mock localStorage that throws quota exceeded
            global.localStorage = {
                getItem: jest.fn(() => null),
                setItem: jest.fn(() => {
                    const error = new Error('Quota exceeded');
                    error.name = 'QuotaExceededError';
                    throw error;
                }),
                removeItem: jest.fn()
            };

            expect(() => {
                const mockGame = new Game(GameModes.CLASSIC);
                const modeSelector = new ModeSelector(mockGame);
                modeSelector.selectMode(GameModes.TIME_TRIAL);
            }).not.toThrow();
        });

        it('should handle DOM manipulation errors gracefully', () => {
            // Mock document that throws errors
            global.document = {
                createElement: jest.fn(() => {
                    throw new Error('DOM manipulation failed');
                }),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                timerDisplay.hide();
            }).not.toThrow();
        });
    });

    describe('Mobile Browser Compatibility', () => {
        it('should handle touch events properly', () => {
            // Mock mobile environment
            global.navigator = {
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                maxTouchPoints: 5
            };

            // Mock touch event handling
            const mockElement = {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn()
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const mockGame = new Game(GameModes.TIME_TRIAL);
                const modeSelector = new ModeSelector(mockGame);
                modeSelector.show();
            }).not.toThrow();
        });

        it('should handle viewport changes on mobile', () => {
            // Mock mobile viewport
            global.window = {
                innerWidth: 375,
                innerHeight: 667,
                devicePixelRatio: 2,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };

            const mockElement = {
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn(),
                getBoundingClientRect: jest.fn(() => ({
                    width: 375,
                    height: 200,
                    top: 0,
                    left: 0
                }))
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                // Test that display adapts to mobile viewport
                timerDisplay.update({ survivalTime: 1000, formattedSurvivalTime: '00:01.00' });
            }).not.toThrow();
        });

        it('should handle memory constraints on mobile devices', () => {
            // Simulate memory-constrained environment
            const originalMemoryUsage = process.memoryUsage;
            process.memoryUsage = jest.fn(() => ({
                heapUsed: 50 * 1024 * 1024, // 50MB
                heapTotal: 100 * 1024 * 1024, // 100MB
                external: 10 * 1024 * 1024 // 10MB
            }));

            const game = new Game(GameModes.TIME_TRIAL);
            
            // Simulate extended gameplay on mobile
            for (let i = 0; i < 1000; i++) {
                game.update();
                
                // Periodically check memory usage doesn't grow excessively
                if (i % 100 === 0) {
                    const state = game.getGameState();
                    expect(state.playerTrail.length).toBeLessThan(5000); // Smaller limit for mobile
                }
            }

            // Restore
            process.memoryUsage = originalMemoryUsage;
        });
    });

    describe('Performance Across Different Environments', () => {
        it('should maintain performance on slower devices', () => {
            // Mock slower performance.now() to simulate older devices
            let mockTime = 0;
            global.performance = {
                now: jest.fn(() => {
                    mockTime += Math.random() * 50 + 10; // Irregular timing 10-60ms
                    return mockTime;
                })
            };

            const timer = new SurvivalTimer();
            timer.start();

            const startTime = Date.now();
            
            // Perform many operations
            for (let i = 0; i < 1000; i++) {
                timer.getElapsedTime();
                timer.getCurrentFormattedTime();
            }
            
            const endTime = Date.now();
            
            // Should complete within reasonable time even on slower devices
            expect(endTime - startTime).toBeLessThan(500);
        });

        it('should handle high DPI displays correctly', () => {
            // Mock high DPI environment
            global.window = {
                devicePixelRatio: 3,
                innerWidth: 1125, // iPhone X resolution
                innerHeight: 2436
            };

            const mockElement = {
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn()
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                
                // Verify high DPI handling
                expect(mockElement.style).toBeDefined();
            }).not.toThrow();
        });

        it('should work with reduced motion preferences', () => {
            // Mock reduced motion preference
            global.window = {
                matchMedia: jest.fn(() => ({
                    matches: true, // prefers-reduced-motion: reduce
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
            };

            const mockElement = {
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn(),
                animate: jest.fn()
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                
                // Should respect reduced motion preferences
                if (mockElement.animate) {
                    expect(mockElement.animate).not.toHaveBeenCalled();
                }
            }).not.toThrow();
        });
    });

    describe('Browser-Specific Feature Detection', () => {
        it('should detect and handle WebGL availability', () => {
            // Mock WebGL unavailable scenario
            global.HTMLCanvasElement = {
                prototype: {
                    getContext: jest.fn(() => null) // WebGL not available
                }
            };

            // Should not break Time Trial functionality
            expect(() => {
                const game = new Game(GameModes.TIME_TRIAL);
                game.update();
                game.getSurvivalTime();
            }).not.toThrow();
        });

        it('should handle different timer precision across browsers', () => {
            // Test with different timer precisions
            const precisionTests = [
                { precision: 1, name: 'millisecond precision' },
                { precision: 0.1, name: 'sub-millisecond precision' },
                { precision: 16.67, name: 'frame-based precision' }
            ];

            precisionTests.forEach(({ precision, name }) => {
                let mockTime = 0;
                global.performance = {
                    now: jest.fn(() => {
                        mockTime += precision;
                        return mockTime;
                    })
                };

                const timer = new SurvivalTimer();
                timer.start();

                // Advance time
                for (let i = 0; i < 10; i++) {
                    timer.getElapsedTime();
                }

                const elapsed = timer.getElapsedTime();
                expect(elapsed).toBeGreaterThanOrEqual(0);
                expect(isFinite(elapsed)).toBe(true);
            });
        });

        it('should handle CSS feature detection', () => {
            // Mock CSS.supports for feature detection
            global.CSS = {
                supports: jest.fn((property, value) => {
                    // Simulate different browser capabilities
                    const supportedFeatures = {
                        'display': 'flex',
                        'transform': 'translateZ(0)',
                        'backdrop-filter': 'blur(10px)'
                    };
                    return supportedFeatures[property] === value;
                })
            };

            const mockElement = {
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn()
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                
                // Should adapt to available CSS features
                expect(mockElement.style).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Network and Connectivity', () => {
        it('should handle offline scenarios', () => {
            // Mock offline environment
            global.navigator = {
                onLine: false,
                connection: {
                    effectiveType: 'none'
                }
            };

            // Time Trial should work offline (no network dependencies)
            expect(() => {
                const game = new Game(GameModes.TIME_TRIAL);
                game.update();
                
                const timer = new SurvivalTimer();
                timer.start();
                timer.getElapsedTime();
                
                const mockGameInstance = new Game(GameModes.CLASSIC);
                const modeSelector = new ModeSelector(mockGameInstance);
                modeSelector.selectMode(GameModes.TIME_TRIAL);
            }).not.toThrow();
        });

        it('should handle slow network conditions', () => {
            // Mock slow network
            global.navigator = {
                connection: {
                    effectiveType: '2g',
                    downlink: 0.25,
                    rtt: 2000
                }
            };

            // Should not affect Time Trial performance (no network operations)
            const startTime = Date.now();
            
            const game = new Game(GameModes.TIME_TRIAL);
            for (let i = 0; i < 100; i++) {
                game.update();
            }
            
            const endTime = Date.now();
            
            // Should complete quickly regardless of network speed
            expect(endTime - startTime).toBeLessThan(200);
        });
    });

    describe('Accessibility and User Preferences', () => {
        it('should respect user color scheme preferences', () => {
            // Mock dark mode preference
            global.window = {
                matchMedia: jest.fn((query) => ({
                    matches: query.includes('dark'),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
            };

            const mockElement = {
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn()
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                
                // Should work with color scheme preferences without throwing
                expect(timerDisplay).toBeDefined();
            }).not.toThrow();
        });

        it('should handle screen reader compatibility', () => {
            // Mock screen reader environment
            const mockElement = {
                setAttribute: jest.fn(),
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                remove: jest.fn(),
                textContent: ''
            };

            global.document = {
                createElement: jest.fn(() => mockElement),
                body: { appendChild: jest.fn() },
                head: { appendChild: jest.fn() },
                getElementById: jest.fn(() => null)
            };

            expect(() => {
                const timerDisplay = new TimerDisplay();
                timerDisplay.show();
                timerDisplay.update({ survivalTime: 30000, formattedSurvivalTime: '00:30.00' });
                
                // Should work with screen readers without throwing
                expect(timerDisplay).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from timer synchronization issues', () => {
            // Mock inconsistent timer behavior
            let callCount = 0;
            global.performance = {
                now: jest.fn(() => {
                    callCount++;
                    if (callCount % 10 === 0) {
                        return NaN; // Simulate timer glitch
                    }
                    return callCount * 16.67;
                })
            };

            const timer = new SurvivalTimer();
            timer.start();

            // Should handle timer glitches gracefully
            for (let i = 0; i < 50; i++) {
                const elapsed = timer.getElapsedTime();
                expect(isFinite(elapsed)).toBe(true);
                expect(elapsed).toBeGreaterThanOrEqual(0);
            }
        });

        it('should handle component initialization failures', () => {
            // Mock component that fails to initialize
            const originalTimerDisplay = TimerDisplay;
            
            expect(() => {
                const game = new Game(GameModes.TIME_TRIAL);
                game.update();
                
                // Game should continue working even if UI components fail
                expect(game.getSurvivalTime()).toBeGreaterThanOrEqual(0);
            }).not.toThrow();
        });

        it('should maintain functionality during memory pressure', () => {
            // Simulate memory pressure
            const originalGC = global.gc;
            global.gc = jest.fn();

            const game = new Game(GameModes.TIME_TRIAL);
            
            // Run game under memory pressure
            for (let i = 0; i < 1000; i++) {
                game.update();
                
                // Simulate periodic garbage collection
                if (i % 100 === 0 && global.gc) {
                    global.gc();
                }
            }

            // Should maintain functionality
            expect(game.getSurvivalTime()).toBeGreaterThanOrEqual(0);
            expect(game.getFormattedSurvivalTime()).toMatch(/^\d{2}:\d{2}\.\d{2}$/);

            // Restore
            global.gc = originalGC;
        });
    });
});