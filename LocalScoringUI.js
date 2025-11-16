/**
 * LocalScoringUI - UI component for displaying local multiplayer scores
 * Handles real-time score updates and visual presentation for 2-player mode
 */
class LocalScoringUI {
    /**
     * Create a new LocalScoringUI instance
     * @param {LocalScoring} localScoring - LocalScoring instance to display
     */
    constructor(localScoring) {
        this.localScoring = localScoring;
        this.scoreElements = {};
        this.isInitialized = false;
        this.createScoreElements();
    }

    /**
     * Create and position score UI elements in the DOM
     */
    createScoreElements() {
        // Player 1 score (top-left)
        this.scoreElements.player1Score = document.createElement('div');
        this.scoreElements.player1Score.id = 'player1Score';
        this.scoreElements.player1Score.className = 'local-score-display player1-score';
        document.body.appendChild(this.scoreElements.player1Score);

        // Player 2 score (top-right)
        this.scoreElements.player2Score = document.createElement('div');
        this.scoreElements.player2Score.id = 'player2Score';
        this.scoreElements.player2Score.className = 'local-score-display player2-score';
        document.body.appendChild(this.scoreElements.player2Score);

        // Round indicator (top-center)
        this.scoreElements.roundIndicator = document.createElement('div');
        this.scoreElements.roundIndicator.id = 'roundIndicator';
        this.scoreElements.roundIndicator.className = 'local-score-display round-indicator';
        document.body.appendChild(this.scoreElements.roundIndicator);

        // Winner announcement (center, hidden by default)
        this.scoreElements.winnerAnnouncement = document.createElement('div');
        this.scoreElements.winnerAnnouncement.id = 'winnerAnnouncement';
        this.scoreElements.winnerAnnouncement.className = 'local-score-display winner-announcement';
        this.scoreElements.winnerAnnouncement.style.display = 'none';
        document.body.appendChild(this.scoreElements.winnerAnnouncement);

        // Add comprehensive CSS styles
        this.addScoreStyles();

        this.isInitialized = true;
    }

    /**
     * Add comprehensive CSS styles for local multiplayer score display
     */
    addScoreStyles() {
        if (document.getElementById('localScoringStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'localScoringStyles';
        style.textContent = `
            /* Base local score display styles */
            .local-score-display {
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

            /* Player 1 score styling - green theme */
            .player1-score {
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

            /* Player 2 score styling - blue theme */
            .player2-score {
                top: 20px;
                right: 20px;
                color: #00bfff;
                font-size: 2em;
                text-shadow: 
                    0 0 5px rgba(0, 191, 255, 0.8),
                    0 0 10px rgba(0, 191, 255, 0.6),
                    0 0 15px rgba(0, 191, 255, 0.4),
                    2px 2px 0px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid rgba(0, 191, 255, 0.3);
            }

            /* Round indicator styling - centered */
            .round-indicator {
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                color: #ffffff;
                font-size: 1.5em;
                text-shadow: 
                    0 0 5px rgba(255, 255, 255, 0.8),
                    0 0 10px rgba(255, 255, 255, 0.6),
                    2px 2px 0px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.4);
                padding: 6px 16px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            /* Winner announcement styling - prominent center display */
            .winner-announcement {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffff00;
                font-size: 3em;
                text-shadow: 
                    0 0 10px rgba(255, 255, 0, 1),
                    0 0 20px rgba(255, 255, 0, 0.8),
                    0 0 30px rgba(255, 255, 0, 0.6),
                    3px 3px 0px rgba(0, 0, 0, 0.9);
                background: rgba(0, 0, 0, 0.7);
                padding: 20px 40px;
                border-radius: 10px;
                border: 3px solid rgba(255, 255, 0, 0.7);
                animation: winnerPulse 1.5s ease-in-out infinite;
                backdrop-filter: blur(3px);
                text-align: center;
            }

            /* Winner announcement for Player 1 */
            .winner-announcement.player1-wins {
                color: #00ff41;
                border-color: rgba(0, 255, 65, 0.7);
                text-shadow: 
                    0 0 10px rgba(0, 255, 65, 1),
                    0 0 20px rgba(0, 255, 65, 0.8),
                    0 0 30px rgba(0, 255, 65, 0.6),
                    3px 3px 0px rgba(0, 0, 0, 0.9);
            }

            /* Winner announcement for Player 2 */
            .winner-announcement.player2-wins {
                color: #00bfff;
                border-color: rgba(0, 191, 255, 0.7);
                text-shadow: 
                    0 0 10px rgba(0, 191, 255, 1),
                    0 0 20px rgba(0, 191, 255, 0.8),
                    0 0 30px rgba(0, 191, 255, 0.6),
                    3px 3px 0px rgba(0, 0, 0, 0.9);
            }

            /* Winner announcement for tie */
            .winner-announcement.tie {
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.7);
                text-shadow: 
                    0 0 10px rgba(255, 255, 255, 1),
                    0 0 20px rgba(255, 255, 255, 0.8),
                    0 0 30px rgba(255, 255, 255, 0.6),
                    3px 3px 0px rgba(0, 0, 0, 0.9);
            }

            /* Pulse animation for winner announcement */
            @keyframes winnerPulse {
                0% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                }
                50% { 
                    opacity: 0.9; 
                    transform: translate(-50%, -50%) scale(1.05);
                }
                100% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            /* Mobile responsive styles */
            @media (max-width: 768px) {
                .player1-score, .player2-score {
                    font-size: 1.5em;
                    top: 10px;
                    padding: 6px 10px;
                }
                
                .player1-score {
                    left: 10px;
                }
                
                .player2-score {
                    right: 10px;
                }
                
                .round-indicator {
                    font-size: 1.2em;
                    top: 10px;
                    padding: 5px 12px;
                }
                
                .winner-announcement {
                    font-size: 2em;
                    padding: 15px 30px;
                }
            }

            /* Extra small screens */
            @media (max-width: 480px) {
                .player1-score, .player2-score {
                    font-size: 1.2em;
                    top: 5px;
                    padding: 4px 8px;
                }
                
                .player1-score {
                    left: 5px;
                }
                
                .player2-score {
                    right: 5px;
                }
                
                .round-indicator {
                    font-size: 1em;
                    top: 5px;
                    padding: 4px 10px;
                }
                
                .winner-announcement {
                    font-size: 1.5em;
                    padding: 12px 24px;
                }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .player1-score {
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid #00ff41;
                }
                
                .player2-score {
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid #00bfff;
                }
                
                .round-indicator {
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid #ffffff;
                }
                
                .winner-announcement {
                    background: rgba(0, 0, 0, 0.9);
                    border-width: 4px;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .winner-announcement {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update score display during gameplay
     */
    updateScores() {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        const details = this.localScoring.getScoreDetails();

        this.scoreElements.player1Score.textContent = `P1: ${details.player1Wins}`;
        this.scoreElements.player1Score.style.display = 'block';

        this.scoreElements.player2Score.textContent = `P2: ${details.player2Wins}`;
        this.scoreElements.player2Score.style.display = 'block';

        this.scoreElements.roundIndicator.textContent = `Round ${details.currentRound}`;
        this.scoreElements.roundIndicator.style.display = 'block';

        // Hide winner announcement during gameplay
        this.scoreElements.winnerAnnouncement.style.display = 'none';
    }

    /**
     * Show winner announcement for round end
     * @param {string|null} winner - Winner ID ('P1', 'P2') or null for tie
     */
    showRoundWinner(winner) {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        // Update scores first
        this.updateScores();

        // Show winner announcement
        const announcement = this.scoreElements.winnerAnnouncement;
        announcement.className = 'local-score-display winner-announcement';

        if (winner === 'P1') {
            announcement.textContent = 'Player 1 Wins!';
            announcement.classList.add('player1-wins');
        } else if (winner === 'P2') {
            announcement.textContent = 'Player 2 Wins!';
            announcement.classList.add('player2-wins');
        } else {
            announcement.textContent = 'Tie!';
            announcement.classList.add('tie');
        }

        announcement.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            announcement.style.display = 'none';
        }, 3000);
    }

    /**
     * Show final scores with overall winner
     */
    showFinalScores() {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        const details = this.localScoring.getScoreDetails();
        const leader = this.localScoring.getLeader();

        // Update score displays
        this.updateScores();

        // Show overall winner
        const announcement = this.scoreElements.winnerAnnouncement;
        announcement.className = 'local-score-display winner-announcement';

        if (leader === 'P1') {
            announcement.innerHTML = `
                <div>Player 1 Wins!</div>
                <div style="font-size: 0.6em; margin-top: 10px;">
                    ${details.player1Wins} - ${details.player2Wins}
                </div>
            `;
            announcement.classList.add('player1-wins');
        } else if (leader === 'P2') {
            announcement.innerHTML = `
                <div>Player 2 Wins!</div>
                <div style="font-size: 0.6em; margin-top: 10px;">
                    ${details.player1Wins} - ${details.player2Wins}
                </div>
            `;
            announcement.classList.add('player2-wins');
        } else {
            announcement.innerHTML = `
                <div>Tie Game!</div>
                <div style="font-size: 0.6em; margin-top: 10px;">
                    ${details.player1Wins} - ${details.player2Wins}
                </div>
            `;
            announcement.classList.add('tie');
        }

        announcement.style.display = 'block';
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
     * Show score displays (for resuming gameplay)
     */
    showScores() {
        if (!this.isInitialized) {
            this.createScoreElements();
        }

        this.updateScores();
    }

    /**
     * Reset score display to initial state
     */
    reset() {
        this.hideScores();
        if (this.isInitialized) {
            this.updateScores();
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
        
        const styleElement = document.getElementById('localScoringStyles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }

        this.scoreElements = {};
        this.isInitialized = false;
    }
}

module.exports = { LocalScoringUI };
