/**
 * ScoreDisplay - UI rendering and visual presentation for LightBikes scoring system
 * Handles real-time score display during gameplay and game over screen presentation
 */
class ScoreDisplay {
    constructor(renderer) {
        this.renderer = renderer;
        this.scoreElements = {};
        this.isInitialized = false;
        this.createScoreElements();
    }

    /**
     * Create and position score UI elements in the DOM
     */
    createScoreElements() {
        // Player score (top-left)
        this.scoreElements.playerScore = document.createElement('div');
        this.scoreElements.playerScore.id = 'playerScore';
        this.scoreElements.playerScore.className = 'score-display player-score';
        document.body.appendChild(this.scoreElements.playerScore);

        // AI score (top-right)
        this.scoreElements.aiScore = document.createElement('div');
        this.scoreElements.aiScore.id = 'aiScore';
        this.scoreElements.aiScore.className = 'score-display ai-score';
        document.body.appendChild(this.scoreElements.aiScore);

        // High score display (for game over screen)
        this.scoreElements.highScore = document.createElement('div');
        this.scoreElements.highScore.id = 'highScore';
        this.scoreElements.highScore.className = 'score-display high-score';
        this.scoreElements.highScore.style.display = 'none';
        document.body.appendChild(this.scoreElements.highScore);

        // New high score message
        this.scoreElements.newHighScore = document.createElement('div');
        this.scoreElements.newHighScore.id = 'newHighScore';
        this.scoreElements.newHighScore.className = 'score-display new-high-score';
        this.scoreElements.newHighScore.style.display = 'none';
        document.body.appendChild(this.scoreElements.newHighScore);

        // Add comprehensive CSS styles
        this.addScoreStyles();
        this.positionScoreElements();

        this.isInitialized = true;
    }

    /**
     * Add comprehensive CSS styles for score display
     */
    addScoreStyles() {
        if (document.getElementById('scoreDisplayStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'scoreDisplayStyles';
        style.textContent = `
            /* Base score display styles */
            .score-display {
                position: absolute;
                font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace;
                font-weight: bold;
                z-index: 100;
                pointer-events: none;
                user-select: none;
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Player score styling - high contrast green */
            .player-score {
                top: 20px;
                left: 20px;
                color: #00ff41;
                font-size: 2em;
                text-shadow: 
                    0 0 5px rgba(0, 255, 65, 0.8),
                    0 0 10px rgba(0, 255, 65, 0.6),
                    0 0 15px rgba(0, 255, 65, 0.4),
                    2px 2px 0px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid rgba(0, 255, 65, 0.3);
            }

            /* AI score styling - high contrast red */
            .ai-score {
                top: 20px;
                right: 20px;
                color: #ff0040;
                font-size: 2em;
                text-shadow: 
                    0 0 5px rgba(255, 0, 64, 0.8),
                    0 0 10px rgba(255, 0, 64, 0.6),
                    0 0 15px rgba(255, 0, 64, 0.4),
                    2px 2px 0px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid rgba(255, 0, 64, 0.3);
            }

            /* High score styling - distinct golden appearance */
            .high-score {
                top: 70%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffd700;
                font-size: 1.8em;
                text-shadow: 
                    0 0 8px rgba(255, 215, 0, 0.9),
                    0 0 16px rgba(255, 215, 0, 0.6),
                    0 0 24px rgba(255, 215, 0, 0.3),
                    2px 2px 0px rgba(0, 0, 0, 0.9);
                background: rgba(0, 0, 0, 0.5);
                padding: 12px 20px;
                border-radius: 8px;
                border: 2px solid rgba(255, 215, 0, 0.5);
                backdrop-filter: blur(2px);
            }

            /* New high score message - animated and prominent */
            .new-high-score {
                top: 75%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffff00;
                font-size: 2.2em;
                text-shadow: 
                    0 0 10px rgba(255, 255, 0, 1),
                    0 0 20px rgba(255, 255, 0, 0.8),
                    0 0 30px rgba(255, 255, 0, 0.6),
                    3px 3px 0px rgba(0, 0, 0, 0.9);
                background: rgba(0, 0, 0, 0.6);
                padding: 15px 25px;
                border-radius: 10px;
                border: 3px solid rgba(255, 255, 0, 0.7);
                animation: pulse 1.5s ease-in-out infinite;
                backdrop-filter: blur(3px);
            }

            /* Pulse animation for new high score */
            @keyframes pulse {
                0% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                    box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
                }
                50% { 
                    opacity: 0.8; 
                    transform: translate(-50%, -50%) scale(1.05);
                    box-shadow: 0 0 30px rgba(255, 255, 0, 0.8);
                }
                100% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                    box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
                }
            }

            /* Mobile responsive styles */
            @media (max-width: 768px) {
                .player-score, .ai-score {
                    font-size: 1.5em;
                    top: 10px;
                    padding: 6px 10px;
                }
                
                .player-score {
                    left: 10px;
                }
                
                .ai-score {
                    right: 10px;
                }
                
                .high-score {
                    font-size: 1.4em;
                    padding: 10px 16px;
                }
                
                .new-high-score {
                    font-size: 1.8em;
                    padding: 12px 20px;
                }
            }

            /* Extra small screens */
            @media (max-width: 480px) {
                .player-score, .ai-score {
                    font-size: 1.2em;
                    top: 5px;
                    padding: 4px 8px;
                }
                
                .player-score {
                    left: 5px;
                }
                
                .ai-score {
                    right: 5px;
                }
                
                .high-score {
                    font-size: 1.2em;
                    padding: 8px 12px;
                    top: 65%;
                }
                
                .new-high-score {
                    font-size: 1.5em;
                    padding: 10px 16px;
                    top: 72%;
                }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .player-score {
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid #00ff41;
                }
                
                .ai-score {
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid #ff0040;
                }
                
                .high-score {
                    background: rgba(0, 0, 0, 0.9);
                    border: 3px solid #ffd700;
                }
                
                .new-high-score {
                    background: rgba(0, 0, 0, 0.9);
                    border: 4px solid #ffff00;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .new-high-score {
                    animation: none;
                }
            }

            /* Touch device optimizations */
            @media (hover: none) and (pointer: coarse) {
                .score-display {
                    /* Ensure scores don't interfere with touch controls */
                    pointer-events: none;
                }
                
                /* Adjust positioning to avoid touch control areas */
                .player-score {
                    top: 15px;
                    left: 15px;
                }
                
                .ai-score {
                    top: 15px;
                    right: 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update score display during gameplay
     * @param {number} playerScore - Current player score
     * @param {number} aiScore - Current AI score
     */
    updateGameplayScores(playerScore, aiScore) {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        this.scoreElements.playerScore.textContent = `Player: ${playerScore}`;
        this.scoreElements.playerScore.style.display = 'block';

        this.scoreElements.aiScore.textContent = `AI: ${aiScore}`;
        this.scoreElements.aiScore.style.display = 'block';

        // Hide game over elements during gameplay
        this.scoreElements.highScore.style.display = 'none';
        this.scoreElements.newHighScore.style.display = 'none';

        // Ensure responsive positioning is maintained
        this.positionScoreElements();
    }

    /**
     * Show scores on game over screen
     * @param {number} playerScore - Final player score
     * @param {number} aiScore - Final AI score
     * @param {number} highScore - Current high score
     * @param {boolean} isNewHigh - Whether this is a new high score
     */
    showGameOverScores(playerScore, aiScore, highScore, isNewHigh) {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        // Keep gameplay scores visible with current values
        this.scoreElements.playerScore.textContent = `Player: ${playerScore}`;
        this.scoreElements.playerScore.style.display = 'block';

        this.scoreElements.aiScore.textContent = `AI: ${aiScore}`;
        this.scoreElements.aiScore.style.display = 'block';

        // Show high score with distinct styling
        this.scoreElements.highScore.textContent = `High Score: ${highScore}`;
        this.scoreElements.highScore.style.display = 'block';

        // Show new high score message if applicable
        if (isNewHigh) {
            this.scoreElements.newHighScore.textContent = 'New High Score!';
            this.scoreElements.newHighScore.style.display = 'block';
        } else {
            this.scoreElements.newHighScore.style.display = 'none';
        }

        // Ensure proper positioning for game over screen
        this.positionScoreElements();
    }

    /**
     * Hide all score displays
     */
    hideScores() {
        if (!this.isInitialized) {
            return;
        }

        Object.values(this.scoreElements).forEach(element => {
            if (element && element.style) {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Position score elements responsively based on screen size
     * Note: Most positioning is now handled by CSS media queries,
     * but this method can handle dynamic adjustments if needed
     */
    positionScoreElements() {
        if (!this.isInitialized) {
            return;
        }

        // Check for touch control interference
        const touchControls = document.getElementById('controls');
        if (touchControls && window.innerWidth < 768) {
            // Ensure scores don't overlap with touch controls
            const controlsRect = touchControls.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // If touch controls are in bottom right, ensure AI score has enough clearance
            if (controlsRect.top < viewportHeight * 0.3) {
                this.scoreElements.aiScore.style.top = '60px';
            }
        }

        // Handle very narrow screens
        if (window.innerWidth < 320) {
            this.scoreElements.playerScore.style.fontSize = '1em';
            this.scoreElements.aiScore.style.fontSize = '1em';
        }

        // Ensure scores remain visible on very short screens
        if (window.innerHeight < 400) {
            this.scoreElements.highScore.style.top = '60%';
            this.scoreElements.newHighScore.style.top = '68%';
        }
    }

    /**
     * Clean up score display elements
     */
    destroy() {
        Object.values(this.scoreElements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        const styleElement = document.getElementById('scoreDisplayStyles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }

        this.scoreElements = {};
        this.isInitialized = false;
    }
}

// Handle window resize for responsive positioning
window.addEventListener('resize', () => {
    const scoreDisplay = window.scoreDisplayInstance;
    if (scoreDisplay && scoreDisplay.positionScoreElements) {
        scoreDisplay.positionScoreElements();
    }
    
    // Handle glow effect manager resize
    const glowEffectManager = window.glowEffectManager;
    if (glowEffectManager && glowEffectManager.handleResize) {
        glowEffectManager.handleResize(window.innerWidth, window.innerHeight);
    }
});

module.exports = { ScoreDisplay };