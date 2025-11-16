/**
 * ColorPickerUI - User interface components for color customization
 * Provides color picker with preset colors and custom hex input
 */
class ColorPickerUI {
    constructor() {
        this.currentColor = '#00FF00'; // Default green
        this.onColorChange = null; // Callback for color changes
        this.previewMode = false;
        
        // Preset colors matching CustomizationManager
        this.presetColors = {
            red: '#FF0000',
            blue: '#0000FF',
            green: '#00FF00',
            yellow: '#FFFF00',
            purple: '#800080',
            orange: '#FFA500',
            cyan: '#00FFFF',
            white: '#FFFFFF'
        };
        
        this.element = null;
        this.hexInput = null;
        this.presetButtons = [];
        this.previewElement = null;
    }
    
    /**
     * Create and return the color picker DOM element
     * @param {string} title - Title for the color picker section
     * @returns {HTMLElement} Color picker container element
     */
    createElement(title = 'Color Selection') {
        const container = document.createElement('div');
        container.className = 'color-picker-container';
        
        // Title
        const titleElement = document.createElement('h4');
        titleElement.textContent = title;
        titleElement.className = 'color-picker-title';
        container.appendChild(titleElement);
        
        // Preset colors section
        const presetsContainer = document.createElement('div');
        presetsContainer.className = 'color-presets';
        
        const presetsLabel = document.createElement('div');
        presetsLabel.textContent = 'Preset Colors:';
        presetsLabel.className = 'color-presets-label';
        presetsContainer.appendChild(presetsLabel);
        
        const presetsGrid = document.createElement('div');
        presetsGrid.className = 'color-presets-grid';
        
        // Create preset color buttons
        Object.entries(this.presetColors).forEach(([name, color]) => {
            const button = document.createElement('button');
            button.className = 'color-preset-btn';
            button.style.backgroundColor = color;
            button.title = `${name.charAt(0).toUpperCase() + name.slice(1)} (${color})`;
            button.setAttribute('data-color', color);
            
            // Add color name label
            const label = document.createElement('span');
            label.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            label.className = 'color-preset-label';
            button.appendChild(label);
            
            button.addEventListener('click', () => {
                this.setColor(color);
            });
            
            this.presetButtons.push(button);
            presetsGrid.appendChild(button);
        });
        
        presetsContainer.appendChild(presetsGrid);
        container.appendChild(presetsContainer);
        
        // Custom color input section
        const customContainer = document.createElement('div');
        customContainer.className = 'color-custom';
        
        const customLabel = document.createElement('div');
        customLabel.textContent = 'Custom Color:';
        customLabel.className = 'color-custom-label';
        customContainer.appendChild(customLabel);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'color-input-container';
        
        // Hex input
        this.hexInput = document.createElement('input');
        this.hexInput.type = 'text';
        this.hexInput.className = 'color-hex-input';
        this.hexInput.placeholder = '#00FF00';
        this.hexInput.value = this.currentColor;
        this.hexInput.maxLength = 7;
        
        this.hexInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (this.validateColorFormat(value)) {
                this.setColor(value);
            }
        });
        
        this.hexInput.addEventListener('blur', (e) => {
            // Ensure valid format on blur
            if (!this.validateColorFormat(e.target.value)) {
                e.target.value = this.currentColor;
            }
        });
        
        inputContainer.appendChild(this.hexInput);
        
        // Color preview
        this.previewElement = document.createElement('div');
        this.previewElement.className = 'color-preview';
        this.previewElement.style.backgroundColor = this.currentColor;
        inputContainer.appendChild(this.previewElement);
        
        customContainer.appendChild(inputContainer);
        container.appendChild(customContainer);
        
        // Real-time preview section
        const previewContainer = document.createElement('div');
        previewContainer.className = 'color-live-preview';
        
        const previewLabel = document.createElement('div');
        previewLabel.textContent = 'Preview:';
        previewLabel.className = 'color-preview-label';
        previewContainer.appendChild(previewLabel);
        
        const previewDisplay = document.createElement('div');
        previewDisplay.className = 'color-preview-display';
        previewDisplay.textContent = 'Color will be applied in real-time';
        previewContainer.appendChild(previewDisplay);
        
        container.appendChild(previewContainer);
        
        this.element = container;
        return container;
    }
    
    /**
     * Set the current color and update UI
     * @param {string} color - Hex color string
     */
    setColor(color) {
        if (!this.validateColorFormat(color)) {
            console.warn('Invalid color format:', color);
            return;
        }
        
        this.currentColor = color;
        
        // Update UI elements
        if (this.hexInput) {
            this.hexInput.value = color;
        }
        
        if (this.previewElement) {
            this.previewElement.style.backgroundColor = color;
        }
        
        // Update preset button selection
        this.updatePresetSelection(color);
        
        // Trigger callback
        if (this.onColorChange) {
            this.onColorChange(color);
        }
    }
    
    /**
     * Get the current selected color
     * @returns {string} Current color hex string
     */
    getColor() {
        return this.currentColor;
    }
    
    /**
     * Set callback for color change events
     * @param {Function} callback - Function to call when color changes
     */
    setOnColorChange(callback) {
        this.onColorChange = callback;
    }
    
    /**
     * Validate color format (hex string)
     * @param {string} color - Color string to validate
     * @returns {boolean} True if valid
     */
    validateColorFormat(color) {
        if (typeof color !== 'string') return false;
        
        // Check hex format (#RRGGBB)
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        return hexRegex.test(color);
    }
    
    /**
     * Check color contrast against background
     * @param {string} color - Color to check
     * @param {string} backgroundColor - Background color (default arena background)
     * @returns {boolean} True if contrast is sufficient
     */
    validateColorContrast(color, backgroundColor = '#000033') {
        const colorLuminance = this.calculateLuminance(color);
        const bgLuminance = this.calculateLuminance(backgroundColor);
        
        const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) / 
                        (Math.min(colorLuminance, bgLuminance) + 0.05);
        
        return contrast >= 3.0; // WCAG AA standard
    }
    
    /**
     * Calculate relative luminance of a color
     * @param {string} color - Hex color string
     * @returns {number} Luminance value
     */
    calculateLuminance(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const sRGB = [r, g, b].map(c => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }
    
    /**
     * Update preset button selection visual state
     * @param {string} color - Currently selected color
     */
    updatePresetSelection(color) {
        this.presetButtons.forEach(button => {
            const buttonColor = button.getAttribute('data-color');
            if (buttonColor === color) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }
    
    /**
     * Show contrast warning if color has poor visibility
     * @param {string} color - Color to check
     */
    showContrastWarning(color) {
        if (!this.validateColorContrast(color)) {
            // Create or show warning element
            let warning = this.element.querySelector('.contrast-warning');
            if (!warning) {
                warning = document.createElement('div');
                warning.className = 'contrast-warning';
                warning.innerHTML = '⚠️ This color may be difficult to see against the arena background';
                this.element.appendChild(warning);
            }
            warning.style.display = 'block';
        } else {
            // Hide warning
            const warning = this.element.querySelector('.contrast-warning');
            if (warning) {
                warning.style.display = 'none';
            }
        }
    }
    
    /**
     * Enable or disable the color picker
     * @param {boolean} enabled - Whether the picker should be enabled
     */
    setEnabled(enabled) {
        if (!this.element) return;
        
        const inputs = this.element.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
        
        if (enabled) {
            this.element.classList.remove('disabled');
        } else {
            this.element.classList.add('disabled');
        }
    }
    
    /**
     * Destroy the color picker and clean up event listeners
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.hexInput = null;
        this.presetButtons = [];
        this.previewElement = null;
        this.onColorChange = null;
    }
}

module.exports = { ColorPickerUI };