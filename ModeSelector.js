/**
 * ModeSelector - Component for game mode selection UI
 * Handles mode selection, persistence, and UI state management
 */
const { GameModes } = require('./GameModes.js');

class ModeSelector {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.selectedMode = this.loadSelectedMode();
        this.isVisible = false;
        this.onModeSelected = null; // Callback for mode selection
        
        // Storage key for mode persistence
        this.storageKey = 'lightbikes_selected_mode';
    }

    /**
     * Load the last selected mode from localStorage
     * @returns {string} The selected mode or default to classic
     */
    loadSelectedMode() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && Object.values(GameModes).includes(saved)) {
                return saved;
            }
        } catch (error) {
            console.warn('Failed to load selected mode from localStorage:', error);
        }
        return GameModes.CLASSIC;
    }

    /**
     * Save the selected mode to localStorage
     * @param {string} mode - The mode to save
     */
    saveSelectedMode(mode) {
        try {
            localStorage.setItem(this.storageKey, mode);
        } catch (error) {
            console.warn('Failed to save selected mode to localStorage:', error);
        }
    }

    /**
     * Create and show the mode selection UI
     */
    show() {
        if (this.isVisible) {
            return;
        }

        this.createModeSelectionUI();
        this.isVisible = true;
        
        // Verify visibility after creation (Task 4.1)
        this.verifyVisibility();
        
        // Block UI controls until mode is selected (Task 4.3)
        this.blockUIControls();
    }
    
    /**
     * Verify that the mode selector element is visible (Task 4.1)
     * Applies fallback visibility fixes if needed (Task 4.2)
     */
    verifyVisibility() {
        const element = document.getElementById('mode-selector');
        
        // Check if element exists
        if (!element) {
            console.warn('ModeSelector: Element not found after creation');
            return;
        }
        
        // Check if element is visible using offsetParent
        // offsetParent is null if element or any ancestor has display:none
        if (element.offsetParent === null) {
            console.warn('ModeSelector: Element not visible, applying fallback styles');
            this.forceVisibility(element);
        }
    }
    
    /**
     * Force visibility of the mode selector with inline styles (Task 4.2)
     * @param {HTMLElement} element - The mode selector element
     */
    forceVisibility(element) {
        // Apply inline styles to ensure visibility
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.style.position = 'fixed';
        element.style.top = '50%';
        element.style.left = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.zIndex = '10000';
        
        console.log('ModeSelector: Forced visibility with inline styles');
    }
    
    /**
     * Block UI controls (AI count selector, difficulty selector) until mode is selected (Task 4.3)
     */
    blockUIControls() {
        // Block AI count selector
        const aiSelector = document.getElementById('aiCountSelector');
        if (aiSelector) {
            aiSelector.style.pointerEvents = 'none';
            aiSelector.style.opacity = '0.5';
        }
        
        // Block difficulty selector
        const difficultySelector = document.getElementById('difficultySelector');
        if (difficultySelector) {
            difficultySelector.style.pointerEvents = 'none';
            difficultySelector.style.opacity = '0.5';
        }
    }
    
    /**
     * Unblock UI controls after mode is selected (Task 4.3)
     */
    unblockUIControls() {
        // Unblock AI count selector
        const aiSelector = document.getElementById('aiCountSelector');
        if (aiSelector) {
            aiSelector.style.pointerEvents = 'auto';
            aiSelector.style.opacity = '1';
        }
        
        // Unblock difficulty selector
        const difficultySelector = document.getElementById('difficultySelector');
        if (difficultySelector) {
            difficultySelector.style.pointerEvents = 'auto';
            difficultySelector.style.opacity = '1';
        }
    }

    /**
     * Hide and remove the mode selection UI
     */
    hide() {
        if (!this.isVisible) {
            return;
        }

        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) {
            modeSelector.remove();
        }
        this.isVisible = false;
    }

    /**
     * Create the mode selection UI elements
     */
    createModeSelectionUI() {
        // Remove existing selector if present
        const existing = document.getElementById('mode-selector');
        if (existing) {
            existing.remove();
        }

        // Create main container
        const container = document.createElement('div');
        container.id = 'mode-selector';
        container.className = 'mode-selector-container';
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Select Game Mode';
        title.className = 'mode-selector-title';
        container.appendChild(title);

        // Create mode options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'mode-options-container';

        // Create Classic mode option
        const classicOption = this.createModeOption(
            GameModes.CLASSIC,
            'Classic',
            'Compete against AI opponent'
        );
        optionsContainer.appendChild(classicOption);

        // Create Time Trial mode option
        const timeTrialOption = this.createModeOption(
            GameModes.TIME_TRIAL,
            'Time Trial',
            'Survive as long as possible solo'
        );
        optionsContainer.appendChild(timeTrialOption);

        // Create Arena Shrink mode option
        const arenaShrinkOption = this.createModeOption(
            GameModes.ARENA_SHRINK,
            'Arena Shrink',
            'Battle AI as arena shrinks over time'
        );
        optionsContainer.appendChild(arenaShrinkOption);

        // Create Local Multiplayer mode option
        const localMultiplayerOption = this.createModeOption(
            GameModes.LOCAL_MULTIPLAYER,
            'Local 2-Player',
            'Compete against a friend on same device'
        );
        optionsContainer.appendChild(localMultiplayerOption);

        container.appendChild(optionsContainer);

        // Create start button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.className = 'mode-start-button';
        startButton.onclick = () => this.startSelectedMode();
        container.appendChild(startButton);

        // Add styles
        this.addModeSelectionStyles();

        // Add to document
        document.body.appendChild(container);
    }

    /**
     * Create a mode option element
     * @param {string} mode - The mode value
     * @param {string} title - Display title
     * @param {string} description - Mode description
     * @returns {HTMLElement} The mode option element
     */
    createModeOption(mode, title, description) {
        const option = document.createElement('div');
        option.className = 'mode-option';
        option.dataset.mode = mode;
        
        if (mode === this.selectedMode) {
            option.classList.add('selected');
        }

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.className = 'mode-option-title';

        const descElement = document.createElement('p');
        descElement.textContent = description;
        descElement.className = 'mode-option-description';

        option.appendChild(titleElement);
        option.appendChild(descElement);

        // Add click handler
        option.onclick = () => this.selectMode(mode);

        return option;
    }

    /**
     * Select a game mode
     * @param {string} mode - The mode to select
     */
    selectMode(mode) {
        if (!Object.values(GameModes).includes(mode)) {
            console.warn('Invalid game mode:', mode);
            return;
        }

        this.selectedMode = mode;
        this.saveSelectedMode(mode);
        this.updateModeSelection();
    }

    /**
     * Update the visual selection in the UI
     */
    updateModeSelection() {
        const options = document.querySelectorAll('.mode-option');
        options.forEach(option => {
            if (option.dataset.mode === this.selectedMode) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    /**
     * Start the game with the selected mode
     */
    startSelectedMode() {
        // Unblock UI controls before starting (Task 4.3)
        this.unblockUIControls();
        
        if (this.onModeSelected) {
            this.onModeSelected(this.selectedMode);
        }
        this.hide();
    }

    /**
     * Get the currently selected mode
     * @returns {string} The selected mode
     */
    getSelectedMode() {
        return this.selectedMode;
    }

    /**
     * Set callback for mode selection
     * @param {function} callback - Function to call when mode is selected
     */
    setOnModeSelected(callback) {
        this.onModeSelected = callback;
    }

    /**
     * Add CSS styles for the mode selection UI
     */
    addModeSelectionStyles() {
        // Check if styles already exist
        if (document.getElementById('mode-selector-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'mode-selector-styles';
        style.textContent = `
            .mode-selector-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 30px;
                z-index: 1000;
                text-align: center;
                min-width: 600px;
                max-width: 800px;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }

            .mode-selector-title {
                color: #00ffff;
                margin: 0 0 20px 0;
                font-size: 24px;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            }

            .mode-options-container {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .mode-option {
                background: rgba(0, 50, 50, 0.8);
                border: 2px solid #004444;
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 140px;
                flex: 1;
                max-width: 180px;
            }

            .mode-option:hover {
                border-color: #00aaaa;
                background: rgba(0, 80, 80, 0.8);
            }

            .mode-option.selected {
                border-color: #00ffff;
                background: rgba(0, 100, 100, 0.8);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }

            .mode-option-title {
                color: #ffffff;
                margin: 0 0 10px 0;
                font-size: 18px;
            }

            .mode-option-description {
                color: #cccccc;
                margin: 0;
                font-size: 14px;
                line-height: 1.4;
            }

            .mode-start-button {
                background: linear-gradient(45deg, #00ffff, #0088ff);
                border: none;
                border-radius: 5px;
                color: #000000;
                font-size: 18px;
                font-weight: bold;
                padding: 12px 30px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
            }

            .mode-start-button:hover {
                background: linear-gradient(45deg, #00cccc, #0066cc);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 255, 255, 0.4);
            }

            @media (max-width: 600px) {
                .mode-selector-container {
                    min-width: 300px;
                    padding: 20px;
                }

                .mode-options-container {
                    flex-direction: column;
                    gap: 15px;
                }

                .mode-option {
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Check if mode selector is currently visible
     * @returns {boolean} True if visible
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Cleanup method to remove event listeners and DOM elements
     */
    destroy() {
        this.hide();
        const styles = document.getElementById('mode-selector-styles');
        if (styles) {
            styles.remove();
        }
    }
}

module.exports = { ModeSelector };