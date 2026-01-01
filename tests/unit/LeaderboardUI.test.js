/**
 * Tests for LeaderboardUI
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);
    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

describe('LeaderboardUI', () => {
    let LeaderboardUI;
    let LeaderboardSystem;
    let leaderboardSystem;
    let leaderboardUI;

    beforeEach(() => {
        jest.resetModules();

        // Mock DOM
        if (typeof document !== 'undefined') {
            document.body.innerHTML = '';
            document.body.appendChild = jest.fn();
        }

        LeaderboardUI = require('@/ui/LeaderboardUI.js').LeaderboardUI;
        LeaderboardSystem = require('@/systems/LeaderboardSystem.js').LeaderboardSystem;

        leaderboardSystem = new LeaderboardSystem();
        leaderboardUI = new LeaderboardUI(leaderboardSystem);

        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        expect(leaderboardUI).toBeDefined();
        expect(leaderboardUI.leaderboardSystem).toBe(leaderboardSystem);
    });

    it('should show and hide the leaderboard', () => {
        leaderboardUI.show();
        expect(leaderboardUI.isVisible).toBe(true);
        expect(leaderboardUI.overlay.style.display).toBe('flex');

        leaderboardUI.hide();
        expect(leaderboardUI.isVisible).toBe(false);
        expect(leaderboardUI.overlay.style.display).toBe('none');
    });
});
