/**
 * Tests for ModeSelector class
 */

const { GameModes } = require('@/systems/GameModes.js');
const { ModeSelector } = require('@/ui/ModeSelector.js');

describe('ModeSelector', () => {
    let modeSelector;
    let mockGame;
    let getItemSpy;
    let setItemSpy;

    beforeEach(() => {
        mockGame = {};
        getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

        // Mock DOM elements
        const mockElement = {
            id: '',
            style: {},
            classList: { add: jest.fn(), remove: jest.fn() },
            appendChild: jest.fn(),
            remove: jest.fn(),
            querySelectorAll: jest.fn().mockReturnValue([]),
        };

        jest.spyOn(document, 'getElementById').mockReturnValue(null);
        jest.spyOn(document, 'createElement').mockReturnValue(mockElement);
        jest.spyOn(document, 'querySelectorAll').mockReturnValue([]);

        jest.clearAllMocks();
        modeSelector = new ModeSelector(mockGame);
    });

    afterEach(() => {
        getItemSpy.mockRestore();
        setItemSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('should initialize with default values', () => {
        expect(modeSelector.selectedMode).toBe(GameModes.CLASSIC);
    });

    it('should load saved mode from localStorage', () => {
        getItemSpy.mockReturnValue(GameModes.TIME_TRIAL);
        const selector = new ModeSelector(mockGame);
        expect(selector.selectedMode).toBe(GameModes.TIME_TRIAL);
    });

    it('should save mode to localStorage', () => {
        modeSelector.saveSelectedMode(GameModes.TIME_TRIAL);
        expect(setItemSpy).toHaveBeenCalledWith('lightbikes_selected_mode', GameModes.TIME_TRIAL);
    });

    it('should select valid mode', () => {
        modeSelector.selectMode(GameModes.TIME_TRIAL);
        expect(modeSelector.selectedMode).toBe(GameModes.TIME_TRIAL);
        expect(setItemSpy).toHaveBeenCalledWith('lightbikes_selected_mode', GameModes.TIME_TRIAL);
    });

    it('should update visual selection', () => {
        const mockOption = {
            dataset: { mode: GameModes.TIME_TRIAL },
            classList: { add: jest.fn(), remove: jest.fn() },
        };
        jest.spyOn(document, 'querySelectorAll').mockReturnValue([mockOption]);

        modeSelector.selectedMode = GameModes.TIME_TRIAL;
        modeSelector.updateModeSelection();

        expect(mockOption.classList.add).toHaveBeenCalledWith('selected');
    });

    it('should persist mode selection immediately', () => {
        modeSelector.selectMode(GameModes.TIME_TRIAL);
        expect(setItemSpy).toHaveBeenCalledWith('lightbikes_selected_mode', GameModes.TIME_TRIAL);
    });
});
