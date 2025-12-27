/**
 * StyleManager - Manages dynamic CSS injection
 * Centralizes all CSS style management for UI components
 */
class StyleManager {
    constructor() {
        this.injectedStyles = new Set();
    }

    /**
     * Add CSS styles to the document
     * @param {string} id - Unique identifier for the style element
     * @param {string} cssText - CSS content to inject
     * @returns {boolean} True if styles were added, false if they already exist
     */
    addStyles(id, cssText) {
        // Check if styles already exist
        if (this.hasStyles(id)) {
            return false;
        }

        // Create style element
        const style = document.createElement('style');
        style.id = id;
        style.textContent = cssText;

        // Append to document head
        document.head.appendChild(style);

        // Track injected style
        this.injectedStyles.add(id);

        return true;
    }

    /**
     * Remove CSS styles from the document
     * @param {string} id - Unique identifier for the style element
     * @returns {boolean} True if styles were removed, false if they didn't exist
     */
    removeStyles(id) {
        const styleElement = document.getElementById(id);

        if (!styleElement) {
            return false;
        }

        // Remove from document
        styleElement.remove();

        // Remove from tracking
        this.injectedStyles.delete(id);

        return true;
    }

    /**
     * Check if styles with given ID exist
     * @param {string} id - Unique identifier for the style element
     * @returns {boolean} True if styles exist
     */
    hasStyles(id) {
        return document.getElementById(id) !== null;
    }

    /**
     * Get all injected style IDs
     * @returns {Array<string>} Array of style IDs
     */
    getInjectedStyleIds() {
        return Array.from(this.injectedStyles);
    }

    /**
     * Remove all injected styles
     */
    removeAllStyles() {
        this.injectedStyles.forEach((id) => {
            this.removeStyles(id);
        });
    }

    /**
     * Update existing styles or add if they don't exist
     * @param {string} id - Unique identifier for the style element
     * @param {string} cssText - CSS content to inject
     * @returns {boolean} True if styles were updated or added
     */
    updateStyles(id, cssText) {
        // Remove existing styles if present
        if (this.hasStyles(id)) {
            this.removeStyles(id);
        }

        // Add new styles
        return this.addStyles(id, cssText);
    }
}

module.exports = { StyleManager };
