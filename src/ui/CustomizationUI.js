/**
 * CustomizationUI - Main user interface for the customization system
 * Provides organized interface for bike colors, trail colors, trail styles, and arena themes
 */
const { logger } = require('../utils/Logger.js');

class CustomizationUI {
    constructor(customizationManager) {
        this.customizationManager = customizationManager;
        this.isVisible = false;
        this.previewMode = false;

        // UI components
        this.panel = null;
        this.bikeColorPicker = null;
        this.trailColorPicker = null;
        this.trailStyleSelector = null;
        this.themeSelector = null;

        // Button reference for toggle
        this.toggleButton = null;

        this.createToggleButton();
        this.createPanel();
        this.setupEventListeners();
    }

    /**
     * Create the toggle button for opening customization menu
     */
    createToggleButton() {
        this.toggleButton = document.createElement('div');
        this.toggleButton.id = 'customizationButton';
        this.toggleButton.title = 'Customization Settings';
        this.toggleButton.innerHTML = '🎨';
        this.toggleButton.style.cssText = `
            position: absolute;
            top: 420px;
            left: 20px;
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            font-size: 1.5em;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s;
            z-index: 100;
            min-width: 44px;
            min-height: 44px;
        `;

        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        });

        this.toggleButton.addEventListener('mouseleave', () => {
            if (!this.isVisible) {
                this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }
        });

        this.toggleButton.addEventListener('click', () => {
            this.toggle();
        });

        document.body.appendChild(this.toggleButton);

        // Add customization access to pause menu
        this.addPauseMenuIntegration();
    }

    /**
     * Add customization menu access to the pause overlay
     */
    addPauseMenuIntegration() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay) {
                // Create customization button for pause menu
                const pauseCustomizationButton = document.createElement('div');
                pauseCustomizationButton.id = 'pauseCustomizationButton';
                pauseCustomizationButton.innerHTML = '🎨 Customize';
                pauseCustomizationButton.style.cssText = `
                    color: white;
                    font-size: 1.5em;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    padding: 15px 30px;
                    cursor: pointer;
                    border-radius: 5px;
                    transition: background-color 0.3s;
                    margin-top: 20px;
                    min-width: 44px;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                pauseCustomizationButton.addEventListener('mouseenter', () => {
                    pauseCustomizationButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                });

                pauseCustomizationButton.addEventListener('mouseleave', () => {
                    pauseCustomizationButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                });

                pauseCustomizationButton.addEventListener('click', () => {
                    this.show();
                });

                // Insert after the resume button
                const resumeButton = document.getElementById('resumeButton');
                if (resumeButton && resumeButton.parentNode) {
                    resumeButton.parentNode.insertBefore(
                        pauseCustomizationButton,
                        resumeButton.nextSibling
                    );
                }
            }
        }, 100);
    }

    /**
     * Create the main customization panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'customizationPanel';
        this.panel.style.cssText = `
            position: absolute;
            top: 20px;
            left: 100px;
            background-color: rgba(0, 0, 0, 0.9);
            border: 2px solid white;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 200;
            min-width: 350px;
            max-width: 450px;
            display: none;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Panel header with navigation info
        const header = document.createElement('div');
        header.className = 'customization-header';
        header.innerHTML = `
            <h3 style="margin: 0 0 5px 0; font-size: 1.4em; text-align: center; color: white; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);">
                Customization
            </h3>
            <p style="margin: 0 0 20px 0; font-size: 0.9em; text-align: center; color: #cccccc; opacity: 0.8;">
                Personalize your LightBikes experience
            </p>
        `;
        this.panel.appendChild(header);

        // Create organized sections with clear labels
        this.createBikeCustomizationSection();
        this.createTrailCustomizationSection();
        this.createThemeSection();
        this.createControlButtons();

        document.body.appendChild(this.panel);
    }

    /**
     * Create bike customization section
     */
    createBikeCustomizationSection() {
        const section = document.createElement('div');
        section.className = 'settings-section';

        // Section header with icon and description
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">
                🏍️ Bike Customization
            </h4>
            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">
                Customize your bike's appearance and make it uniquely yours
            </p>
        `;
        section.appendChild(sectionHeader);

        const { ColorPickerUI } = require('./ColorPickerUI.js');
        this.bikeColorPicker = new ColorPickerUI();

        const colorPickerElement = this.bikeColorPicker.createElement('Bike Color');
        section.appendChild(colorPickerElement);

        // Set initial color from customization manager
        const currentState = this.customizationManager.getCurrentState();
        this.bikeColorPicker.setColor(currentState.bikeColor);

        // Set up color change callback
        this.bikeColorPicker.setOnColorChange((color) => {
            this.customizationManager.setBikeColor('player', color);
            this.bikeColorPicker.showContrastWarning(color);
            this.refreshPreview();
        });

        this.panel.appendChild(section);
    }

    /**
     * Create trail customization section
     */
    createTrailCustomizationSection() {
        const section = document.createElement('div');
        section.className = 'settings-section';

        // Section header with icon and description
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">
                ✨ Trail Customization
            </h4>
            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">
                Choose colors and visual effects for your trail
            </p>
        `;
        section.appendChild(sectionHeader);

        // Trail color picker
        const { ColorPickerUI } = require('./ColorPickerUI.js');
        this.trailColorPicker = new ColorPickerUI();

        const colorPickerElement = this.trailColorPicker.createElement('Trail Color');
        section.appendChild(colorPickerElement);

        // Set initial color from customization manager
        const currentState = this.customizationManager.getCurrentState();
        this.trailColorPicker.setColor(currentState.trailColor);

        // Set up color change callback
        this.trailColorPicker.setOnColorChange((color) => {
            this.customizationManager.setTrailColor('player', color);
            this.trailColorPicker.showContrastWarning(color);
            this.refreshPreview();
        });

        // Trail style selector
        this.createTrailStyleSelector(section);

        this.panel.appendChild(section);
    }

    /**
     * Create trail style selector
     * @param {HTMLElement} section - Parent section element
     */
    createTrailStyleSelector(section) {
        const styleContainer = document.createElement('div');
        styleContainer.className = 'color-picker-container';

        const title = document.createElement('h4');
        title.textContent = 'Trail Style';
        title.className = 'color-picker-title';
        styleContainer.appendChild(title);

        const stylesGrid = document.createElement('div');
        stylesGrid.className = 'trail-styles-grid';
        stylesGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        `;

        const availableStyles = this.customizationManager.getAvailableTrailStyles();
        const currentState = this.customizationManager.getCurrentState();

        availableStyles.forEach((style) => {
            const button = document.createElement('button');
            button.className = 'trail-style-btn';
            button.setAttribute('data-style', style);

            if (style === currentState.trailStyle) {
                button.classList.add('active');
            }

            // Style-specific content
            const styleName = document.createElement('div');
            styleName.className = 'style-name';
            styleName.textContent = style.charAt(0).toUpperCase() + style.slice(1);
            button.appendChild(styleName);

            const styleDesc = document.createElement('div');
            styleDesc.className = 'style-desc';

            switch (style) {
                case 'solid':
                    styleDesc.textContent = 'Continuous opaque trail';
                    break;
                case 'dashed':
                    styleDesc.textContent = 'Alternating segments';
                    break;
                case 'glowing':
                    styleDesc.textContent = 'Enhanced emissive effects';
                    break;
                case 'rainbow':
                    styleDesc.textContent = 'Color cycling trail';
                    break;
                default:
                    styleDesc.textContent = 'Custom trail style';
            }

            button.appendChild(styleDesc);

            button.addEventListener('click', () => {
                // Update selection
                stylesGrid.querySelectorAll('.trail-style-btn').forEach((btn) => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                // Apply style
                this.customizationManager.setTrailStyle('player', style);
                this.refreshPreview();
            });

            stylesGrid.appendChild(button);
        });

        styleContainer.appendChild(stylesGrid);
        section.appendChild(styleContainer);
    }

    /**
     * Create arena theme section
     */
    createThemeSection() {
        const section = document.createElement('div');
        section.className = 'settings-section';

        // Section header with icon and description
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">
                🌌 Arena Themes
            </h4>
            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">
                Transform your arena with different visual environments
            </p>
        `;
        section.appendChild(sectionHeader);

        const themesGrid = document.createElement('div');
        themesGrid.className = 'themes-grid';
        themesGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        `;

        const availableThemes = this.customizationManager.getAvailableThemes();
        const currentState = this.customizationManager.getCurrentState();

        const themeDescriptions = {
            'classic-grid': 'Current default styling',
            'neon-city': 'Cyberpunk visuals',
            space: 'Starfield background',
            'tron-legacy': 'Movie-inspired aesthetics',
        };

        availableThemes.forEach((theme) => {
            const button = document.createElement('button');
            button.className = 'theme-btn';
            button.setAttribute('data-theme', theme);

            if (theme === currentState.arenaTheme) {
                button.classList.add('active');
            }

            const themeName = document.createElement('div');
            themeName.className = 'theme-name';
            themeName.textContent = theme
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            button.appendChild(themeName);

            const themeDesc = document.createElement('div');
            themeDesc.className = 'theme-desc';
            themeDesc.textContent = themeDescriptions[theme] || 'Custom theme';
            button.appendChild(themeDesc);

            button.addEventListener('click', () => {
                // Update selection
                themesGrid.querySelectorAll('.theme-btn').forEach((btn) => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                // Apply theme
                this.customizationManager.setArenaTheme(theme);
                this.refreshPreview();
            });

            themesGrid.appendChild(button);
        });

        section.appendChild(themesGrid);
        this.panel.appendChild(section);
    }

    /**
     * Create preview section with real-time updates
     */
    createPreviewSection() {
        const previewSection = document.createElement('div');
        previewSection.className = 'settings-section preview-section';

        // Section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: #00ffff; display: flex; align-items: center;">
                👁️ Live Preview
            </h4>
            <p style="margin: 0 0 15px 0; font-size: 0.8em; color: #aaaaaa; opacity: 0.9;">
                See how your customizations look in real-time
            </p>
        `;
        previewSection.appendChild(sectionHeader);

        // Preview viewport container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.style.cssText = `
            background-color: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            text-align: center;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;

        // Preview status indicator
        const previewStatus = document.createElement('div');
        previewStatus.className = 'preview-status';
        previewStatus.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">🎨</div>
            <div style="color: #cccccc; font-size: 0.9em; margin-bottom: 5px;">
                Preview Mode: <span id="previewModeStatus" style="color: #ff6666;">Disabled</span>
            </div>
            <div style="color: #aaaaaa; font-size: 0.8em; line-height: 1.3;">
                Enable preview mode to see changes applied in real-time to the game arena
            </div>
        `;
        previewContainer.appendChild(previewStatus);

        // Current customization summary
        const customizationSummary = document.createElement('div');
        customizationSummary.className = 'customization-summary';
        customizationSummary.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            font-size: 0.8em;
            color: #cccccc;
        `;

        this.updateCustomizationSummary(customizationSummary);
        previewContainer.appendChild(customizationSummary);

        previewSection.appendChild(previewContainer);

        // Preview controls
        const previewControls = document.createElement('div');
        previewControls.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        `;

        const enablePreviewBtn = document.createElement('button');
        enablePreviewBtn.className = 'settings-btn preview-toggle-btn';
        enablePreviewBtn.textContent = 'Enable Preview';
        enablePreviewBtn.style.cssText = `
            flex: 1;
            background-color: rgba(0, 255, 0, 0.2);
            border-color: #00ff00;
        `;
        enablePreviewBtn.addEventListener('click', () => {
            this.togglePreviewMode();
        });
        previewControls.appendChild(enablePreviewBtn);

        const refreshPreviewBtn = document.createElement('button');
        refreshPreviewBtn.className = 'settings-btn';
        refreshPreviewBtn.textContent = 'Refresh';
        refreshPreviewBtn.title = 'Update preview with current settings';
        refreshPreviewBtn.addEventListener('click', () => {
            this.refreshPreview();
        });
        previewControls.appendChild(refreshPreviewBtn);

        previewSection.appendChild(previewControls);
        this.panel.appendChild(previewSection);

        // Store references for updates
        this.previewContainer = previewContainer;
        this.customizationSummary = customizationSummary;
        this.previewToggleBtn = enablePreviewBtn;
    }

    /**
     * Update the customization summary display
     * @param {HTMLElement} summaryElement - The summary element to update
     */
    updateCustomizationSummary(summaryElement) {
        const currentState = this.customizationManager.getCurrentState();

        summaryElement.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left;">
                <div>
                    <strong>Bike:</strong> 
                    <span style="display: inline-block; width: 12px; height: 12px; background-color: ${currentState.bikeColor}; border: 1px solid white; margin-left: 5px; vertical-align: middle;"></span>
                    ${currentState.bikeColor}
                </div>
                <div>
                    <strong>Trail:</strong> 
                    <span style="display: inline-block; width: 12px; height: 12px; background-color: ${currentState.trailColor}; border: 1px solid white; margin-left: 5px; vertical-align: middle;"></span>
                    ${currentState.trailColor}
                </div>
                <div>
                    <strong>Style:</strong> ${currentState.trailStyle.charAt(0).toUpperCase() + currentState.trailStyle.slice(1)}
                </div>
                <div>
                    <strong>Theme:</strong> ${currentState.arenaTheme
                        .split('-')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                </div>
            </div>
        `;
    }

    /**
     * Refresh the preview display
     */
    refreshPreview() {
        if (this.customizationSummary) {
            this.updateCustomizationSummary(this.customizationSummary);
        }

        // Show refresh notification
        this.showNotification('🔄 Preview refreshed', 'info');
    }

    /**
     * Create control buttons (Apply, Cancel, Reset)
     */
    createControlButtons() {
        // Add separator before controls
        const separator = document.createElement('div');
        separator.style.cssText = `
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin: 20px 0 15px 0;
        `;
        this.panel.appendChild(separator);

        // Add preview section before controls
        this.createPreviewSection();

        // Control section header
        const controlHeader = document.createElement('div');
        controlHeader.innerHTML = `
            <h4 style="margin: 0 0 15px 0; font-size: 1.1em; color: #00ffff; text-align: center;">
                🎮 Controls
            </h4>
        `;
        this.panel.appendChild(controlHeader);

        // Primary action buttons (Apply/Cancel workflow)
        const primaryButtonsContainer = document.createElement('div');
        primaryButtonsContainer.className = 'primary-buttons';
        primaryButtonsContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        `;

        // Apply button - confirms and saves changes
        const applyButton = document.createElement('button');
        applyButton.className = 'settings-btn apply-btn';
        applyButton.textContent = '✓ Apply Changes';
        applyButton.title = 'Apply and save all customization changes';
        applyButton.style.cssText = `
            background-color: rgba(0, 255, 0, 0.3);
            border-color: #00ff00;
            font-weight: bold;
        `;
        applyButton.addEventListener('click', () => {
            this.applyChanges();
        });
        primaryButtonsContainer.appendChild(applyButton);

        // Cancel button - discards changes and reverts
        const cancelButton = document.createElement('button');
        cancelButton.className = 'settings-btn cancel-btn';
        cancelButton.textContent = '✗ Cancel Changes';
        cancelButton.title = 'Discard all changes and revert to saved settings';
        cancelButton.style.cssText = `
            background-color: rgba(255, 102, 102, 0.3);
            border-color: #ff6666;
        `;
        cancelButton.addEventListener('click', () => {
            this.cancelChanges();
        });
        primaryButtonsContainer.appendChild(cancelButton);

        this.panel.appendChild(primaryButtonsContainer);

        // Secondary action buttons
        const secondaryButtonsContainer = document.createElement('div');
        secondaryButtonsContainer.className = 'secondary-buttons';
        secondaryButtonsContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        `;

        // Preview mode toggle
        const previewButton = document.createElement('button');
        previewButton.className = 'settings-btn preview-btn';
        previewButton.textContent = 'Preview Mode';
        previewButton.title = 'Toggle real-time preview of changes';
        previewButton.addEventListener('click', () => {
            this.togglePreviewMode();
        });
        secondaryButtonsContainer.appendChild(previewButton);

        // Reset to defaults button with confirmation
        const resetButton = document.createElement('button');
        resetButton.className = 'settings-btn reset-btn';
        resetButton.textContent = 'Reset to Defaults';
        resetButton.title = 'Reset all customizations to default values';
        resetButton.addEventListener('click', () => {
            this.showResetConfirmation();
        });
        secondaryButtonsContainer.appendChild(resetButton);

        this.panel.appendChild(secondaryButtonsContainer);

        // Close button (full width)
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
        `;

        const closeButton = document.createElement('button');
        closeButton.className = 'settings-btn close-btn';
        closeButton.textContent = 'Close Menu';
        closeButton.style.cssText = `
            flex: 1;
            background-color: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
        `;
        closeButton.addEventListener('click', () => {
            this.handleMenuClose();
        });
        closeButtonContainer.appendChild(closeButton);

        this.panel.appendChild(closeButtonContainer);

        // Store button references for updates
        this.applyButton = applyButton;
        this.cancelButton = cancelButton;
        this.previewButton = previewButton;
        this.closeButton = closeButton;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            /** @type {any} */
            const target = e.target;
            if (
                this.isVisible &&
                !this.panel.contains(target) &&
                !this.toggleButton.contains(target)
            ) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Toggle customization panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show customization panel
     */
    show() {
        this.panel.style.display = 'block';
        this.isVisible = true;
        this.toggleButton.style.backgroundColor = 'rgba(255, 192, 203, 0.3)';
        this.toggleButton.style.borderColor = '#ffc0cb';

        // Update UI with current state
        this.updateUIFromState();
    }

    /**
     * Hide customization panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.isVisible = false;
        this.toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.toggleButton.style.borderColor = 'white';

        // Exit preview mode if active (apply changes automatically on close)
        if (this.previewMode) {
            this.customizationManager.applyPreviewChanges();
            this.previewMode = false;
            this.updatePreviewModeUI();
        }
    }

    /**
     * Toggle preview mode
     */
    togglePreviewMode() {
        if (this.previewMode) {
            // Exit preview mode and apply changes
            this.customizationManager.applyPreviewChanges();
            this.previewMode = false;
        } else {
            // Enter preview mode
            this.customizationManager.enablePreviewMode();
            this.previewMode = true;
        }

        this.updatePreviewModeUI();
        this.refreshPreview();
    }

    /**
     * Update preview mode UI indicators
     */
    updatePreviewModeUI() {
        // Update the preview button in secondary controls
        if (this.previewButton) {
            if (this.previewMode) {
                this.previewButton.textContent = 'Exit Preview';
                this.previewButton.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
                this.previewButton.style.borderColor = '#ff6666';
            } else {
                this.previewButton.textContent = 'Preview Mode';
                this.previewButton.style.backgroundColor = '';
                this.previewButton.style.borderColor = '';
            }
        }

        // Update the preview section toggle button
        if (this.previewToggleBtn) {
            if (this.previewMode) {
                this.previewToggleBtn.textContent = 'Disable Preview';
                this.previewToggleBtn.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
                this.previewToggleBtn.style.borderColor = '#ff6666';
            } else {
                this.previewToggleBtn.textContent = 'Enable Preview';
                this.previewToggleBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                this.previewToggleBtn.style.borderColor = '#00ff00';
            }
        }

        // Update preview status indicator
        const previewModeStatus = document.getElementById('previewModeStatus');
        if (previewModeStatus) {
            if (this.previewMode) {
                previewModeStatus.textContent = 'Enabled';
                previewModeStatus.style.color = '#00ff00';
            } else {
                previewModeStatus.textContent = 'Disabled';
                previewModeStatus.style.color = '#ff6666';
            }
        }

        // Update preview container appearance
        if (this.previewContainer) {
            if (this.previewMode) {
                this.previewContainer.style.borderColor = 'rgba(0, 255, 0, 0.6)';
                this.previewContainer.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
            } else {
                this.previewContainer.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                this.previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        }

        // Update apply/cancel button states based on preview mode
        if (this.applyButton && this.cancelButton) {
            if (this.previewMode) {
                this.applyButton.textContent = '✓ Apply Preview';
                this.cancelButton.textContent = '✗ Cancel Preview';
            } else {
                this.applyButton.textContent = '✓ Apply Changes';
                this.cancelButton.textContent = '✗ Cancel Changes';
            }
        }
    }

    /**
     * Show reset confirmation dialog
     */
    showResetConfirmation() {
        // Create confirmation overlay
        const confirmationOverlay = document.createElement('div');
        confirmationOverlay.className = 'reset-confirmation-overlay';
        confirmationOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 300;
        `;

        const confirmationDialog = document.createElement('div');
        confirmationDialog.style.cssText = `
            background-color: rgba(0, 0, 0, 0.95);
            border: 2px solid #ff6666;
            border-radius: 10px;
            padding: 30px;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;

        confirmationDialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ff6666; font-size: 1.3em;">
                ⚠️ Reset to Defaults
            </h3>
            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">
                This will reset all your customizations including bike colors, trail styles, and arena themes back to their default values.
            </p>
            <p style="margin: 0 0 25px 0; color: #ffaaaa; font-size: 0.9em;">
                This action cannot be undone.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="confirm-reset-btn" style="
                    background-color: rgba(255, 102, 102, 0.3);
                    border: 2px solid #ff6666;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    Reset All
                </button>
                <button class="cancel-reset-btn" style="
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    Cancel
                </button>
            </div>
        `;

        confirmationOverlay.appendChild(confirmationDialog);
        document.body.appendChild(confirmationOverlay);

        // Add event listeners
        /** @type {HTMLElement} */
        const confirmButton = confirmationDialog.querySelector('.confirm-reset-btn');
        /** @type {HTMLElement} */
        const cancelButton = confirmationDialog.querySelector('.cancel-reset-btn');

        confirmButton.addEventListener('mouseenter', () => {
            confirmButton.style.backgroundColor = 'rgba(255, 102, 102, 0.5)';
        });
        confirmButton.addEventListener('mouseleave', () => {
            confirmButton.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
        });

        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        confirmButton.addEventListener('click', () => {
            this.resetToDefaults();
            document.body.removeChild(confirmationOverlay);
        });

        cancelButton.addEventListener('click', () => {
            document.body.removeChild(confirmationOverlay);
        });

        // Close on overlay click
        confirmationOverlay.addEventListener('click', (e) => {
            if (e.target === confirmationOverlay) {
                document.body.removeChild(confirmationOverlay);
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(confirmationOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Reset all customizations to defaults
     */
    resetToDefaults() {
        try {
            this.customizationManager.resetToDefaults();
            this.updateUIFromState();

            // Show success notification
            this.showNotification('✅ All customizations reset to defaults', 'success');
        } catch (error) {
            logger.error('Failed to reset customizations:', error);
            this.showNotification('❌ Failed to reset customizations', 'error');
        }
    }

    /**
     * Apply all customization changes and save them
     */
    applyChanges() {
        try {
            // If in preview mode, apply preview changes
            if (this.previewMode) {
                this.customizationManager.applyPreviewChanges();
                this.previewMode = false;
                this.updatePreviewModeUI();
            }

            // Save current preferences to storage
            this.customizationManager.saveCurrentPreferences();

            // Show success notification
            this.showNotification('✅ Customizations applied and saved!', 'success');

            // Auto-close menu after applying changes
            setTimeout(() => {
                this.hide();
            }, 1500);
        } catch (error) {
            logger.error('Failed to apply customizations:', error);
            this.showNotification('❌ Failed to apply customizations', 'error');
        }
    }

    /**
     * Cancel all changes and revert to saved settings
     */
    cancelChanges() {
        // Show confirmation dialog for canceling changes
        this.showCancelConfirmation();
    }

    /**
     * Show cancel confirmation dialog
     */
    showCancelConfirmation() {
        // Create confirmation overlay
        const confirmationOverlay = document.createElement('div');
        confirmationOverlay.className = 'cancel-confirmation-overlay';
        confirmationOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 300;
        `;

        const confirmationDialog = document.createElement('div');
        confirmationDialog.style.cssText = `
            background-color: rgba(0, 0, 0, 0.95);
            border: 2px solid #ff6666;
            border-radius: 10px;
            padding: 30px;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;

        confirmationDialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ff6666; font-size: 1.3em;">
                ⚠️ Cancel Changes
            </h3>
            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">
                This will discard all unsaved customization changes and revert to your previously saved settings.
            </p>
            <p style="margin: 0 0 25px 0; color: #ffaaaa; font-size: 0.9em;">
                Any changes you made will be lost.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="confirm-cancel-btn" style="
                    background-color: rgba(255, 102, 102, 0.3);
                    border: 2px solid #ff6666;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    Discard Changes
                </button>
                <button class="keep-changes-btn" style="
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    Keep Editing
                </button>
            </div>
        `;

        confirmationOverlay.appendChild(confirmationDialog);
        document.body.appendChild(confirmationOverlay);

        // Add event listeners
        /** @type {HTMLElement} */
        const confirmButton = confirmationDialog.querySelector('.confirm-cancel-btn');
        /** @type {HTMLElement} */
        const keepButton = confirmationDialog.querySelector('.keep-changes-btn');

        confirmButton.addEventListener('mouseenter', () => {
            confirmButton.style.backgroundColor = 'rgba(255, 102, 102, 0.5)';
        });
        confirmButton.addEventListener('mouseleave', () => {
            confirmButton.style.backgroundColor = 'rgba(255, 102, 102, 0.3)';
        });

        keepButton.addEventListener('mouseenter', () => {
            keepButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        });
        keepButton.addEventListener('mouseleave', () => {
            keepButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        confirmButton.addEventListener('click', () => {
            this.performCancelChanges();
            document.body.removeChild(confirmationOverlay);
        });

        keepButton.addEventListener('click', () => {
            document.body.removeChild(confirmationOverlay);
        });

        // Close on overlay click
        confirmationOverlay.addEventListener('click', (e) => {
            if (e.target === confirmationOverlay) {
                document.body.removeChild(confirmationOverlay);
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(confirmationOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Actually perform the cancel changes operation
     */
    performCancelChanges() {
        try {
            // If in preview mode, cancel preview changes
            if (this.previewMode) {
                this.customizationManager.cancelPreviewChanges();
                this.previewMode = false;
                this.updatePreviewModeUI();
            }

            // Reload saved preferences
            this.customizationManager.loadSavedPreferences();

            // Update UI to reflect reverted state
            this.updateUIFromState();

            // Show notification
            this.showNotification('↶ Changes cancelled, reverted to saved settings', 'info');
        } catch (error) {
            logger.error('Failed to cancel customizations:', error);
            this.showNotification('❌ Failed to cancel changes', 'error');
        }
    }

    /**
     * Handle menu close with unsaved changes check
     */
    handleMenuClose() {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            this.showUnsavedChangesDialog();
        } else {
            this.hide();
        }
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        try {
            const currentState = this.customizationManager.getCurrentState();
            const savedState = this.customizationManager.getSavedState();

            return (
                currentState.bikeColor !== savedState.bikeColor ||
                currentState.trailColor !== savedState.trailColor ||
                currentState.trailStyle !== savedState.trailStyle ||
                currentState.arenaTheme !== savedState.arenaTheme
            );
        } catch (error) {
            logger.warn('Could not check for unsaved changes:', error);
            return false;
        }
    }

    /**
     * Show dialog when closing with unsaved changes
     */
    showUnsavedChangesDialog() {
        // Create confirmation overlay
        const confirmationOverlay = document.createElement('div');
        confirmationOverlay.className = 'unsaved-changes-overlay';
        confirmationOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 300;
        `;

        const confirmationDialog = document.createElement('div');
        confirmationDialog.style.cssText = `
            background-color: rgba(0, 0, 0, 0.95);
            border: 2px solid #ffaa00;
            border-radius: 10px;
            padding: 30px;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;

        confirmationDialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ffaa00; font-size: 1.3em;">
                💾 Unsaved Changes
            </h3>
            <p style="margin: 0 0 20px 0; color: #cccccc; line-height: 1.4;">
                You have unsaved customization changes. What would you like to do?
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="save-and-close-btn" style="
                    background-color: rgba(0, 255, 0, 0.3);
                    border: 2px solid #00ff00;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    💾 Save & Close
                </button>
                <button class="discard-and-close-btn" style="
                    background-color: rgba(255, 102, 102, 0.3);
                    border: 2px solid #ff6666;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    🗑️ Discard & Close
                </button>
                <button class="continue-editing-btn" style="
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: background-color 0.3s;
                ">
                    ✏️ Continue Editing
                </button>
            </div>
        `;

        confirmationOverlay.appendChild(confirmationDialog);
        document.body.appendChild(confirmationOverlay);

        // Add event listeners
        /** @type {HTMLElement} */
        const saveAndCloseBtn = confirmationDialog.querySelector('.save-and-close-btn');
        /** @type {HTMLElement} */
        const discardAndCloseBtn = confirmationDialog.querySelector('.discard-and-close-btn');
        /** @type {HTMLElement} */
        const continueEditingBtn = confirmationDialog.querySelector('.continue-editing-btn');

        // Hover effects
        [saveAndCloseBtn, discardAndCloseBtn, continueEditingBtn].forEach(
            /** @param {HTMLElement} btn */ (btn) => {
                btn.addEventListener('mouseenter', () => {
                    btn.style.opacity = '0.8';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.opacity = '1';
                });
            }
        );

        saveAndCloseBtn.addEventListener('click', () => {
            this.applyChanges();
            document.body.removeChild(confirmationOverlay);
        });

        discardAndCloseBtn.addEventListener('click', () => {
            this.performCancelChanges();
            this.hide();
            document.body.removeChild(confirmationOverlay);
        });

        continueEditingBtn.addEventListener('click', () => {
            document.body.removeChild(confirmationOverlay);
        });

        // Close on overlay click (continue editing)
        confirmationOverlay.addEventListener('click', (e) => {
            if (e.target === confirmationOverlay) {
                document.body.removeChild(confirmationOverlay);
            }
        });

        // Close on escape key (continue editing)
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(confirmationOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Show a temporary notification
     * @param {string} message - The message to display
     * @param {string} type - The type of notification ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'customization-notification';

        const bgColor =
            type === 'success'
                ? 'rgba(0, 255, 0, 0.2)'
                : type === 'error'
                  ? 'rgba(255, 0, 0, 0.2)'
                  : 'rgba(0, 255, 255, 0.2)';
        const borderColor =
            type === 'success' ? '#00ff00' : type === 'error' ? '#ff0000' : '#00ffff';

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 8px;
            padding: 15px 25px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 1.1em;
            z-index: 400;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            animation: fadeInOut 3s ease-in-out;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);

        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        }, 3000);
    }

    /**
     * Update UI elements to match current customization state
     */
    updateUIFromState() {
        const currentState = this.customizationManager.getCurrentState();

        // Update color pickers
        if (this.bikeColorPicker) {
            this.bikeColorPicker.setColor(currentState.bikeColor);
        }

        if (this.trailColorPicker) {
            this.trailColorPicker.setColor(currentState.trailColor);
        }

        // Update trail style selection
        const styleButtons = this.panel.querySelectorAll('.trail-style-btn');
        styleButtons.forEach((button) => {
            const style = button.getAttribute('data-style');
            if (style === currentState.trailStyle) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update theme selection
        const themeButtons = this.panel.querySelectorAll('.theme-btn');
        themeButtons.forEach((button) => {
            const theme = button.getAttribute('data-theme');
            if (theme === currentState.arenaTheme) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Refresh preview to show updated state
        this.refreshPreview();
    }

    /**
     * Destroy the customization UI and clean up
     */
    destroy() {
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }

        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }

        if (this.bikeColorPicker) {
            this.bikeColorPicker.destroy();
        }

        if (this.trailColorPicker) {
            this.trailColorPicker.destroy();
        }

        this.toggleButton = null;
        this.panel = null;
        this.bikeColorPicker = null;
        this.trailColorPicker = null;
    }
}

module.exports = { CustomizationUI };
