/**
 * StatusIndicator - UI system for displaying active power-up effects
 * Shows icons and countdown timers for active power-ups in top-right corner
 */

/**
 * StatusIndicator class manages the power-up status display UI
 */
const { logger } = require('../utils/Logger.js');

class StatusIndicator {
    constructor() {
        this.container = null;
        this.activeIndicators = new Map(); // effectId -> indicator element
        this.initialized = false;

        // Power-up type configurations for UI display
        this.powerUpUIConfig = {
            SPEED_BOOST: {
                icon: '⚡',
                color: '#0066ff',
                name: 'Speed Boost',
                showTimer: true,
            },
            SHIELD: {
                icon: '🛡️',
                color: '#ffd700',
                name: 'Shield',
                showTimer: false,
            },
            TRAIL_ERASER: {
                icon: '🗑️',
                color: '#9932cc',
                name: 'Trail Eraser',
                showTimer: false,
            },
            GHOST_MODE: {
                icon: '👻',
                color: '#ffffff',
                name: 'Ghost Mode',
                showTimer: true,
            },
        };
    }

    /**
     * Initialize the status indicator UI system
     * Creates the container and sets up styles
     */
    initialize() {
        if (this.initialized) return;

        this.createContainer();
        this.addStyles();
        this.initialized = true;
    }

    /**
     * Create the main status indicator container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'powerUpStatusIndicator';
        this.container.className = 'status-indicator-container';

        // Position in top-right corner, below difficulty selector
        document.body.appendChild(this.container);
    }

    /**
     * Add CSS styles for the status indicator system
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .status-indicator-container {
                position: absolute;
                top: 120px;
                right: 20px;
                background-color: rgba(0, 0, 0, 0.8);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                padding: 10px;
                min-width: 200px;
                max-width: 250px;
                z-index: 90;
                font-family: Arial, sans-serif;
                display: none; /* Hidden when no active effects */
            }

            .status-indicator-container.visible {
                display: block;
            }

            .status-indicator-header {
                color: white;
                font-size: 0.9em;
                font-weight: bold;
                text-align: center;
                margin-bottom: 8px;
                text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 5px;
            }

            .status-indicator-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 8px;
                margin-bottom: 4px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                border-left: 3px solid;
                transition: all 0.3s ease;
            }

            .status-indicator-item:last-child {
                margin-bottom: 0;
            }

            .status-indicator-item.timed {
                border-left-color: #00ffff;
            }

            .status-indicator-item.permanent {
                border-left-color: #ffd700;
            }

            .status-indicator-item.expiring {
                animation: pulse-warning 1s infinite;
            }

            @keyframes pulse-warning {
                0%, 100% { background-color: rgba(255, 255, 255, 0.1); }
                50% { background-color: rgba(255, 100, 100, 0.3); }
            }

            .status-indicator-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-indicator-icon {
                font-size: 1.2em;
                width: 24px;
                text-align: center;
            }

            .status-indicator-name {
                color: white;
                font-size: 0.85em;
                font-weight: 500;
            }

            .status-indicator-timer {
                color: #00ffff;
                font-size: 0.8em;
                font-weight: bold;
                min-width: 35px;
                text-align: right;
                font-family: monospace;
            }

            .status-indicator-permanent {
                color: #ffd700;
                font-size: 0.7em;
                font-weight: bold;
                text-transform: uppercase;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .status-indicator-container {
                    top: 100px;
                    right: 10px;
                    min-width: 180px;
                    max-width: 200px;
                }
                
                .status-indicator-name {
                    font-size: 0.8em;
                }
                
                .status-indicator-timer {
                    font-size: 0.75em;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update the status indicator with current active effects
     * @param {Object} allActiveEffects - Effects for all players from PowerUpManager
     */
    updateStatus(allActiveEffects) {
        if (!this.initialized) {
            this.initialize();
        }

        // Get player effects (focus on player for now, can extend for multiplayer)
        const playerEffects = allActiveEffects.player || [];

        // Clear existing indicators
        this.clearIndicators();

        if (playerEffects.length === 0) {
            this.hideContainer();
            return;
        }

        // Show container and add header
        this.showContainer();
        this.addHeader();

        // Add indicators for each active effect
        playerEffects.forEach((effect) => {
            this.addEffectIndicator(effect);
        });
    }

    /**
     * Clear all current indicators
     */
    clearIndicators() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.activeIndicators.clear();
    }

    /**
     * Show the status indicator container
     */
    showContainer() {
        if (this.container) {
            this.container.classList.add('visible');
        }
    }

    /**
     * Hide the status indicator container
     */
    hideContainer() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
    }

    /**
     * Add header to the status indicator
     */
    addHeader() {
        const header = document.createElement('div');
        header.className = 'status-indicator-header';
        header.textContent = 'Active Power-Ups';
        this.container.appendChild(header);
    }

    /**
     * Add an indicator for a specific effect
     * @param {ActiveEffect} effect - The effect to display
     */
    addEffectIndicator(effect) {
        const config = this.powerUpUIConfig[effect.type];
        if (!config) {
            logger.warn(`No UI config found for effect type: ${effect.type}`);
            return;
        }

        const indicator = document.createElement('div');
        indicator.className = 'status-indicator-item';

        // Add type-specific styling
        if (config.showTimer) {
            indicator.classList.add('timed');
        } else {
            indicator.classList.add('permanent');
        }

        // Create left side (icon + name)
        const leftSide = document.createElement('div');
        leftSide.className = 'status-indicator-left';

        const icon = document.createElement('span');
        icon.className = 'status-indicator-icon';
        icon.textContent = config.icon;
        icon.style.color = config.color;

        const name = document.createElement('span');
        name.className = 'status-indicator-name';
        name.textContent = config.name;

        leftSide.appendChild(icon);
        leftSide.appendChild(name);

        // Create right side (timer or permanent indicator)
        const rightSide = document.createElement('div');

        if (config.showTimer && effect.duration !== -1) {
            rightSide.className = 'status-indicator-timer';
            this.updateTimer(rightSide, effect);
        } else {
            rightSide.className = 'status-indicator-permanent';
            if (effect.type === 'SHIELD') {
                rightSide.textContent = 'ACTIVE';
            } else {
                rightSide.textContent = 'USED';
            }
        }

        indicator.appendChild(leftSide);
        indicator.appendChild(rightSide);

        // Store reference for updates
        const effectId = `${effect.type}_${effect.startTime}`;
        this.activeIndicators.set(effectId, {
            element: indicator,
            timerElement: rightSide,
            effect: effect,
            config: config,
        });

        this.container.appendChild(indicator);
    }

    /**
     * Update timer display for a timed effect
     * @param {HTMLElement} timerElement - The timer display element
     * @param {ActiveEffect} effect - The effect to show timer for
     */
    updateTimer(timerElement, effect) {
        const remainingTime = effect.getRemainingTime();

        if (remainingTime <= 0) {
            timerElement.textContent = '0s';
            return;
        }

        const seconds = Math.ceil(remainingTime / 1000);
        timerElement.textContent = `${seconds}s`;

        // Add warning animation for last 2 seconds
        if (seconds <= 2 && timerElement.parentElement) {
            timerElement.parentElement.classList.add('expiring');
        } else if (timerElement.parentElement) {
            timerElement.parentElement.classList.remove('expiring');
        }
    }

    /**
     * Update timers for all active timed effects
     * Should be called regularly from the game loop
     */
    updateTimers() {
        if (!this.initialized || this.activeIndicators.size === 0) {
            return;
        }

        for (const [effectId, indicator] of this.activeIndicators) {
            if (indicator.config.showTimer && indicator.effect.duration !== -1) {
                this.updateTimer(indicator.timerElement, indicator.effect);
            }
        }
    }

    /**
     * Handle effect expiration or consumption
     * @param {string} effectType - Type of effect that expired
     * @param {number} startTime - Start time of the effect
     */
    handleEffectRemoved(effectType, startTime) {
        const effectId = `${effectType}_${startTime}`;
        const indicator = this.activeIndicators.get(effectId);

        if (indicator) {
            // Add fade-out animation before removal
            indicator.element.style.transition = 'opacity 0.3s ease-out';
            indicator.element.style.opacity = '0';

            setTimeout(() => {
                if (indicator.element.parentNode) {
                    indicator.element.parentNode.removeChild(indicator.element);
                }
                this.activeIndicators.delete(effectId);

                // Hide container if no more effects
                if (this.activeIndicators.size === 0) {
                    this.hideContainer();
                }
            }, 300);
        }
    }

    /**
     * Reset the status indicator (for game restart)
     */
    reset() {
        this.clearIndicators();
        this.hideContainer();
    }

    /**
     * Get debug information about the status indicator
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            visible: this.container ? this.container.classList.contains('visible') : false,
            activeIndicators: this.activeIndicators.size,
            containerExists: !!this.container,
        };
    }
}

module.exports = { StatusIndicator };
