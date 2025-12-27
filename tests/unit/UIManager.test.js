/**
 * UIManager Tests
 * Tests for UI coordination and state management
 */

const { UIManager } = require('../../src/ui/UIManager');
const { createContainer, cleanupContainer } = require('@helpers/dom');

describe('UIManager', () => {
    let uiManager;
    let mockGameOverUI;
    let mockModeUI;
    let mockStyleManager;
    let container;

    beforeEach(() => {
        // Create DOM container
        container = createContainer('ui-test-container');

        // Create mock dependencies
        mockGameOverUI = {
            show: jest.fn(),
            hide: jest.fn(),
        };

        mockModeUI = {
            hideAllModeUI: jest.fn(),
            createUI: jest.fn(),
            updateDisplay: jest.fn(),
            hideUI: jest.fn(),
        };

        mockStyleManager = {
            applyTheme: jest.fn(),
        };

        // Create UIManager instance
        uiManager = new UIManager();

        // Spy on console methods
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupContainer(container);
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with null dependencies', () => {
            expect(uiManager.gameOverUI).toBeNull();
            expect(uiManager.modeUI).toBeNull();
            expect(uiManager.styleManager).toBeNull();
        });

        it('should initialize with null current mode', () => {
            expect(uiManager.currentMode).toBeNull();
        });
    });

    describe('initialize', () => {
        it('should set gameOverUI dependency', () => {
            uiManager.initialize({ gameOverUI: mockGameOverUI });
            expect(uiManager.gameOverUI).toBe(mockGameOverUI);
        });

        it('should set modeUI dependency', () => {
            uiManager.initialize({ modeUI: mockModeUI });
            expect(uiManager.modeUI).toBe(mockModeUI);
        });

        it('should set styleManager dependency', () => {
            uiManager.initialize({ styleManager: mockStyleManager });
            expect(uiManager.styleManager).toBe(mockStyleManager);
        });

        it('should set all dependencies at once', () => {
            uiManager.initialize({
                gameOverUI: mockGameOverUI,
                modeUI: mockModeUI,
                styleManager: mockStyleManager,
            });

            expect(uiManager.gameOverUI).toBe(mockGameOverUI);
            expect(uiManager.modeUI).toBe(mockModeUI);
            expect(uiManager.styleManager).toBe(mockStyleManager);
        });

        it('should handle partial dependencies', () => {
            const newManager = new UIManager();
            newManager.initialize({ gameOverUI: mockGameOverUI });
            expect(newManager.gameOverUI).toBe(mockGameOverUI);
            // modeUI becomes undefined when not in dependencies object
            expect(newManager.modeUI).toBeUndefined();
        });

        it('should handle empty dependencies object', () => {
            uiManager.initialize({});
            expect(uiManager.gameOverUI).toBeUndefined();
            expect(uiManager.modeUI).toBeUndefined();
        });

        it('should allow reinitialization', () => {
            const firstGameOverUI = { show: jest.fn(), hide: jest.fn() };
            const secondGameOverUI = { show: jest.fn(), hide: jest.fn() };

            uiManager.initialize({ gameOverUI: firstGameOverUI });
            expect(uiManager.gameOverUI).toBe(firstGameOverUI);

            uiManager.initialize({ gameOverUI: secondGameOverUI });
            expect(uiManager.gameOverUI).toBe(secondGameOverUI);
        });
    });

    describe('updateForMode', () => {
        beforeEach(() => {
            uiManager.initialize({ modeUI: mockModeUI });
        });

        it('should set current mode', () => {
            uiManager.updateForMode('CLASSIC');
            expect(uiManager.currentMode).toBe('CLASSIC');
        });

        it('should hide all mode UI', () => {
            uiManager.updateForMode('CLASSIC');
            expect(mockModeUI.hideAllModeUI).toHaveBeenCalled();
        });

        it('should work without modeUI', () => {
            uiManager.modeUI = null;
            uiManager.updateForMode('CLASSIC');
            expect(uiManager.currentMode).toBe('CLASSIC');
        });

        it('should update for TIME_TRIAL mode', () => {
            uiManager.updateForMode('TIME_TRIAL');
            expect(uiManager.currentMode).toBe('TIME_TRIAL');
        });

        it('should update for ARENA_SHRINK mode', () => {
            uiManager.updateForMode('ARENA_SHRINK');
            expect(uiManager.currentMode).toBe('ARENA_SHRINK');
        });

        it('should update for LOCAL_MULTIPLAYER mode', () => {
            uiManager.updateForMode('LOCAL_MULTIPLAYER');
            expect(uiManager.currentMode).toBe('LOCAL_MULTIPLAYER');
        });

        it('should call updateUIVisibility', () => {
            const spy = jest.spyOn(uiManager, 'updateUIVisibility');
            uiManager.updateForMode('CLASSIC');
            expect(spy).toHaveBeenCalledWith('CLASSIC');
        });
    });

    describe('updateUIVisibility', () => {
        let difficultySelector;
        let aiCountSelector;

        beforeEach(() => {
            // Create UI elements
            difficultySelector = document.createElement('div');
            difficultySelector.id = 'difficultySelector';
            container.appendChild(difficultySelector);

            aiCountSelector = document.createElement('div');
            aiCountSelector.id = 'aiCountSelector';
            container.appendChild(aiCountSelector);
        });

        describe('CLASSIC mode', () => {
            it('should show difficulty selector', () => {
                difficultySelector.classList.add('ui-hidden');
                uiManager.updateUIVisibility('CLASSIC');
                expect(difficultySelector.classList.contains('ui-hidden')).toBe(false);
            });

            it('should show AI count selector', () => {
                aiCountSelector.classList.add('ui-hidden');
                uiManager.updateUIVisibility('CLASSIC');
                expect(aiCountSelector.classList.contains('ui-hidden')).toBe(false);
            });
        });

        describe('TIME_TRIAL mode', () => {
            it('should hide difficulty selector', () => {
                uiManager.updateUIVisibility('TIME_TRIAL');
                expect(difficultySelector.classList.contains('ui-hidden')).toBe(true);
            });

            it('should hide AI count selector', () => {
                uiManager.updateUIVisibility('TIME_TRIAL');
                expect(aiCountSelector.classList.contains('ui-hidden')).toBe(true);
            });
        });

        describe('ARENA_SHRINK mode', () => {
            it('should hide difficulty selector', () => {
                uiManager.updateUIVisibility('ARENA_SHRINK');
                expect(difficultySelector.classList.contains('ui-hidden')).toBe(true);
            });

            it('should show AI count selector', () => {
                aiCountSelector.classList.add('ui-hidden');
                uiManager.updateUIVisibility('ARENA_SHRINK');
                expect(aiCountSelector.classList.contains('ui-hidden')).toBe(false);
            });
        });

        describe('LOCAL_MULTIPLAYER mode', () => {
            it('should hide difficulty selector', () => {
                uiManager.updateUIVisibility('LOCAL_MULTIPLAYER');
                expect(difficultySelector.classList.contains('ui-hidden')).toBe(true);
            });

            it('should hide AI count selector', () => {
                uiManager.updateUIVisibility('LOCAL_MULTIPLAYER');
                expect(aiCountSelector.classList.contains('ui-hidden')).toBe(true);
            });
        });

        it('should handle missing difficulty selector', () => {
            container.removeChild(difficultySelector);
            uiManager.updateUIVisibility('CLASSIC');
            // Should not throw error
        });

        it('should handle missing AI count selector', () => {
            container.removeChild(aiCountSelector);
            uiManager.updateUIVisibility('CLASSIC');
            // Should not throw error
        });

        it('should handle unknown mode with CLASSIC defaults', () => {
            difficultySelector.classList.add('ui-hidden');
            aiCountSelector.classList.add('ui-hidden');
            uiManager.updateUIVisibility('UNKNOWN_MODE');
            expect(difficultySelector.classList.contains('ui-hidden')).toBe(false);
            expect(aiCountSelector.classList.contains('ui-hidden')).toBe(false);
        });

        it('should handle null mode with CLASSIC defaults', () => {
            difficultySelector.classList.add('ui-hidden');
            aiCountSelector.classList.add('ui-hidden');
            uiManager.updateUIVisibility(null);
            expect(difficultySelector.classList.contains('ui-hidden')).toBe(false);
            expect(aiCountSelector.classList.contains('ui-hidden')).toBe(false);
        });
    });

    describe('showGameOver', () => {
        const gameState = { player: { score: 10 }, ai: { score: 5 } };
        const callbacks = { restart: jest.fn(), menu: jest.fn() };

        beforeEach(() => {
            uiManager.initialize({ gameOverUI: mockGameOverUI });
        });

        it('should call gameOverUI.show with correct parameters', () => {
            uiManager.showGameOver(gameState, 'CLASSIC', callbacks);
            expect(mockGameOverUI.show).toHaveBeenCalledWith(gameState, 'CLASSIC', callbacks);
        });

        it('should work without callbacks', () => {
            uiManager.showGameOver(gameState, 'CLASSIC');
            expect(mockGameOverUI.show).toHaveBeenCalledWith(gameState, 'CLASSIC', {});
        });

        it('should handle different game modes', () => {
            uiManager.showGameOver(gameState, 'TIME_TRIAL', callbacks);
            expect(mockGameOverUI.show).toHaveBeenCalledWith(gameState, 'TIME_TRIAL', callbacks);
        });

        it('should log error if gameOverUI not initialized', () => {
            uiManager.gameOverUI = null;
            uiManager.showGameOver(gameState, 'CLASSIC', callbacks);
            expect(console.error).toHaveBeenCalledWith('GameOverUI not initialized');
        });

        it('should not call show if gameOverUI not initialized', () => {
            uiManager.gameOverUI = null;
            uiManager.showGameOver(gameState, 'CLASSIC', callbacks);
            expect(mockGameOverUI.show).not.toHaveBeenCalled();
        });

        it('should handle empty game state', () => {
            uiManager.showGameOver({}, 'CLASSIC', callbacks);
            expect(mockGameOverUI.show).toHaveBeenCalledWith({}, 'CLASSIC', callbacks);
        });

        it('should handle null game state', () => {
            uiManager.showGameOver(null, 'CLASSIC', callbacks);
            expect(mockGameOverUI.show).toHaveBeenCalledWith(null, 'CLASSIC', callbacks);
        });
    });

    describe('hideGameOver', () => {
        let gameOverElement;
        let restartBtn;

        beforeEach(() => {
            uiManager.initialize({ gameOverUI: mockGameOverUI });

            gameOverElement = document.createElement('div');
            gameOverElement.id = 'gameOver';
            gameOverElement.style.display = 'block';
            container.appendChild(gameOverElement);

            restartBtn = document.createElement('button');
            restartBtn.id = 'restart';
            restartBtn.style.display = 'block';
            container.appendChild(restartBtn);
        });

        it('should call gameOverUI.hide', () => {
            uiManager.hideGameOver();
            expect(mockGameOverUI.hide).toHaveBeenCalled();
        });

        it('should hide gameOver element', () => {
            uiManager.hideGameOver();
            expect(gameOverElement.style.display).toBe('none');
        });

        it('should hide restart button', () => {
            uiManager.hideGameOver();
            expect(restartBtn.style.display).toBe('none');
        });

        it('should work without gameOverUI', () => {
            uiManager.gameOverUI = null;
            uiManager.hideGameOver();
            expect(gameOverElement.style.display).toBe('none');
        });

        it('should handle missing gameOver element', () => {
            container.removeChild(gameOverElement);
            uiManager.hideGameOver();
            // Should not throw error
        });

        it('should handle missing restart button', () => {
            container.removeChild(restartBtn);
            uiManager.hideGameOver();
            // Should not throw error
        });

        it('should work when elements already hidden', () => {
            gameOverElement.style.display = 'none';
            restartBtn.style.display = 'none';
            uiManager.hideGameOver();
            expect(gameOverElement.style.display).toBe('none');
            expect(restartBtn.style.display).toBe('none');
        });
    });

    describe('createModeUI', () => {
        beforeEach(() => {
            uiManager.initialize({ modeUI: mockModeUI });
        });

        it('should call modeUI.createUI with mode', () => {
            uiManager.createModeUI('CLASSIC');
            expect(mockModeUI.createUI).toHaveBeenCalledWith('CLASSIC');
        });

        it('should handle different modes', () => {
            uiManager.createModeUI('TIME_TRIAL');
            expect(mockModeUI.createUI).toHaveBeenCalledWith('TIME_TRIAL');
        });

        it('should log error if modeUI not initialized', () => {
            uiManager.modeUI = null;
            uiManager.createModeUI('CLASSIC');
            expect(console.error).toHaveBeenCalledWith('ModeUI not initialized');
        });

        it('should not call createUI if modeUI not initialized', () => {
            uiManager.modeUI = null;
            uiManager.createModeUI('CLASSIC');
            expect(mockModeUI.createUI).not.toHaveBeenCalled();
        });

        it('should handle null mode', () => {
            uiManager.createModeUI(null);
            expect(mockModeUI.createUI).toHaveBeenCalledWith(null);
        });

        it('should handle undefined mode', () => {
            uiManager.createModeUI(undefined);
            expect(mockModeUI.createUI).toHaveBeenCalledWith(undefined);
        });
    });

    describe('updateModeDisplay', () => {
        const gameState = { time: 60, score: 100 };

        beforeEach(() => {
            uiManager.initialize({ modeUI: mockModeUI });
        });

        it('should call modeUI.updateDisplay with mode and state', () => {
            uiManager.updateModeDisplay('TIME_TRIAL', gameState);
            expect(mockModeUI.updateDisplay).toHaveBeenCalledWith('TIME_TRIAL', gameState);
        });

        it('should handle different modes', () => {
            uiManager.updateModeDisplay('ARENA_SHRINK', gameState);
            expect(mockModeUI.updateDisplay).toHaveBeenCalledWith('ARENA_SHRINK', gameState);
        });

        it('should work without modeUI', () => {
            uiManager.modeUI = null;
            uiManager.updateModeDisplay('CLASSIC', gameState);
            // Should not throw error
        });

        it('should not call updateDisplay if modeUI not initialized', () => {
            uiManager.modeUI = null;
            uiManager.updateModeDisplay('CLASSIC', gameState);
            expect(mockModeUI.updateDisplay).not.toHaveBeenCalled();
        });

        it('should handle empty game state', () => {
            uiManager.updateModeDisplay('CLASSIC', {});
            expect(mockModeUI.updateDisplay).toHaveBeenCalledWith('CLASSIC', {});
        });

        it('should handle null game state', () => {
            uiManager.updateModeDisplay('CLASSIC', null);
            expect(mockModeUI.updateDisplay).toHaveBeenCalledWith('CLASSIC', null);
        });
    });

    describe('hideModeUI', () => {
        beforeEach(() => {
            uiManager.initialize({ modeUI: mockModeUI });
        });

        it('should call modeUI.hideUI with mode', () => {
            uiManager.hideModeUI('CLASSIC');
            expect(mockModeUI.hideUI).toHaveBeenCalledWith('CLASSIC');
        });

        it('should handle different modes', () => {
            uiManager.hideModeUI('TIME_TRIAL');
            expect(mockModeUI.hideUI).toHaveBeenCalledWith('TIME_TRIAL');
        });

        it('should work without modeUI', () => {
            uiManager.modeUI = null;
            uiManager.hideModeUI('CLASSIC');
            // Should not throw error
        });

        it('should not call hideUI if modeUI not initialized', () => {
            uiManager.modeUI = null;
            uiManager.hideModeUI('CLASSIC');
            expect(mockModeUI.hideUI).not.toHaveBeenCalled();
        });

        it('should handle null mode', () => {
            uiManager.hideModeUI(null);
            expect(mockModeUI.hideUI).toHaveBeenCalledWith(null);
        });
    });

    describe('getCurrentMode', () => {
        it('should return null initially', () => {
            expect(uiManager.getCurrentMode()).toBeNull();
        });

        it('should return current mode after updateForMode', () => {
            uiManager.initialize({ modeUI: mockModeUI });
            uiManager.updateForMode('CLASSIC');
            expect(uiManager.getCurrentMode()).toBe('CLASSIC');
        });

        it('should return updated mode', () => {
            uiManager.initialize({ modeUI: mockModeUI });
            uiManager.updateForMode('CLASSIC');
            uiManager.updateForMode('TIME_TRIAL');
            expect(uiManager.getCurrentMode()).toBe('TIME_TRIAL');
        });

        it('should return mode even without modeUI', () => {
            uiManager.updateForMode('ARENA_SHRINK');
            expect(uiManager.getCurrentMode()).toBe('ARENA_SHRINK');
        });
    });

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            uiManager.initialize({
                gameOverUI: mockGameOverUI,
                modeUI: mockModeUI,
                styleManager: mockStyleManager,
            });

            // Create UI elements
            const difficultySelector = document.createElement('div');
            difficultySelector.id = 'difficultySelector';
            container.appendChild(difficultySelector);

            const aiCountSelector = document.createElement('div');
            aiCountSelector.id = 'aiCountSelector';
            container.appendChild(aiCountSelector);
        });

        it('should handle full mode switch workflow', () => {
            uiManager.updateForMode('CLASSIC');
            expect(uiManager.getCurrentMode()).toBe('CLASSIC');
            expect(mockModeUI.hideAllModeUI).toHaveBeenCalled();

            const difficultySelector = document.getElementById('difficultySelector');
            expect(difficultySelector.classList.contains('ui-hidden')).toBe(false);
        });

        it('should handle game over workflow', () => {
            const gameState = { winner: 'player' };
            const callbacks = { restart: jest.fn() };

            uiManager.showGameOver(gameState, 'CLASSIC', callbacks);
            expect(mockGameOverUI.show).toHaveBeenCalled();

            uiManager.hideGameOver();
            expect(mockGameOverUI.hide).toHaveBeenCalled();
        });

        it('should handle mode UI lifecycle', () => {
            uiManager.createModeUI('TIME_TRIAL');
            expect(mockModeUI.createUI).toHaveBeenCalledWith('TIME_TRIAL');

            uiManager.updateModeDisplay('TIME_TRIAL', { time: 30 });
            expect(mockModeUI.updateDisplay).toHaveBeenCalled();

            uiManager.hideModeUI('TIME_TRIAL');
            expect(mockModeUI.hideUI).toHaveBeenCalled();
        });

        it('should handle multiple mode switches', () => {
            uiManager.updateForMode('CLASSIC');
            uiManager.updateForMode('TIME_TRIAL');
            uiManager.updateForMode('ARENA_SHRINK');

            expect(uiManager.getCurrentMode()).toBe('ARENA_SHRINK');
            expect(mockModeUI.hideAllModeUI).toHaveBeenCalledTimes(3);
        });

        it('should maintain state across operations', () => {
            uiManager.updateForMode('CLASSIC');
            const gameState = { score: 100 };

            uiManager.updateModeDisplay('CLASSIC', gameState);
            expect(uiManager.getCurrentMode()).toBe('CLASSIC');

            uiManager.showGameOver(gameState, 'CLASSIC');
            expect(uiManager.getCurrentMode()).toBe('CLASSIC');
        });
    });

    describe('Error Handling', () => {
        it('should handle operations without initialization', () => {
            const newManager = new UIManager();
            newManager.updateForMode('CLASSIC');
            newManager.showGameOver({}, 'CLASSIC');
            newManager.hideGameOver();
            newManager.createModeUI('CLASSIC');
            newManager.updateModeDisplay('CLASSIC', {});
            newManager.hideModeUI('CLASSIC');
            // Should not throw errors
        });

        it('should handle null dependencies gracefully', () => {
            uiManager.initialize({
                gameOverUI: null,
                modeUI: null,
                styleManager: null,
            });

            uiManager.updateForMode('CLASSIC');
            uiManager.showGameOver({}, 'CLASSIC');
            uiManager.hideGameOver();
            // Should not throw errors
        });

        it('should handle missing DOM elements', () => {
            uiManager.initialize({ modeUI: mockModeUI });
            uiManager.updateForMode('CLASSIC');
            uiManager.hideGameOver();
            // Should not throw errors
        });
    });
});
