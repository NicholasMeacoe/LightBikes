/**
 * LeaderboardUI - Manages leaderboard display and user interaction
 * Provides responsive UI for viewing Time Trial leaderboard scores
 */
class LeaderboardUI {
    constructor(leaderboardSystem) {
        this.leaderboardSystem = leaderboardSystem;
        this.isVisible = false;
        this.overlay = null;
        this.container = null;
        this.createUI();
        this.setupEventListeners();
    }

    /**
     * Create the leaderboard UI elements and inject into DOM
     */
    createUI() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'leaderboardOverlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 2000;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        `;

        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'leaderboardContainer';
        this.container.style.cssText = `
            background-color: rgba(0, 20, 40, 0.95);
            border: 3px solid #00ffff;
            border-radius: 15px;
            padding: 30px;
            color: white;
            font-family: Arial, sans-serif;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            min-width: 320px;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #00ffff;
            padding-bottom: 15px;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Time Trial Leaderboard';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 2.2em;
            color: #00ffff;
            text-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Top 10 Survival Times';
        subtitle.style.cssText = `
            margin: 0;
            font-size: 1.1em;
            opacity: 0.8;
        `;

        header.appendChild(title);
        header.appendChild(subtitle);

        // Create scores container
        this.scoresContainer = document.createElement('div');
        this.scoresContainer.id = 'scoresContainer';
        this.scoresContainer.style.cssText = `
            margin-bottom: 25px;
            min-height: 200px;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background-color: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 25px;
            font-size: 1.1em;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s;
            display: block;
            margin: 0 auto;
            min-width: 44px;
            min-height: 44px;
        `;

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        closeButton.addEventListener('click', () => {
            this.hide();
        });

        // Assemble UI
        this.container.appendChild(header);
        this.container.appendChild(this.scoresContainer);
        this.container.appendChild(closeButton);
        this.overlay.appendChild(this.container);

        // Add to document
        document.body.appendChild(this.overlay);
    }

    /**
     * Setup event listeners for keyboard navigation
     */
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.isVisible && event.key === 'Escape') {
                this.hide();
            }
        });

        // Close on overlay click (but not container click)
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.hide();
            }
        });
    }

    /**
     * Show the leaderboard with current scores
     */
    show() {
        this.updateScores();
        this.overlay.style.display = 'flex';
        this.isVisible = true;
    }

    /**
     * Hide the leaderboard
     */
    hide() {
        this.overlay.style.display = 'none';
        this.isVisible = false;
    }

    /**
     * Toggle leaderboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update the scores display with current leaderboard data
     */
    updateScores() {
        const scores = this.leaderboardSystem.getTopScores();
        const stats = this.leaderboardSystem.getStats();

        // Clear existing content
        this.scoresContainer.innerHTML = '';

        if (scores.length === 0) {
            this.showEmptyState();
            return;
        }

        // Create scores list
        const scoresList = document.createElement('div');
        scoresList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        scores.forEach((score, index) => {
            const scoreItem = this.createScoreItem(score, index + 1);
            scoresList.appendChild(scoreItem);
        });

        // Create stats section
        const statsSection = this.createStatsSection(stats);

        this.scoresContainer.appendChild(scoresList);
        this.scoresContainer.appendChild(statsSection);
    }

    /**
     * Create a score item element
     * @param {Object} score - Score object with timeMs, formattedTime, timestamp
     * @param {number} rank - Ranking position (1-10)
     * @returns {HTMLElement} Score item element
     */
    createScoreItem(score, rank) {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border-left: 4px solid ${this.getRankColor(rank)};
            transition: background-color 0.3s;
        `;

        // Add hover effect
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });

        // Rank and medal
        const rankSection = document.createElement('div');
        rankSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 60px;
        `;

        const rankNumber = document.createElement('span');
        rankNumber.textContent = `#${rank}`;
        rankNumber.style.cssText = `
            font-size: 1.2em;
            font-weight: bold;
            color: ${this.getRankColor(rank)};
        `;

        const medal = document.createElement('span');
        medal.textContent = this.getMedalEmoji(rank);
        medal.style.fontSize = '1.3em';

        rankSection.appendChild(rankNumber);
        if (rank <= 3) {
            rankSection.appendChild(medal);
        }

        // Time display
        const timeSection = document.createElement('div');
        timeSection.style.cssText = `
            text-align: center;
            flex-grow: 1;
        `;

        const timeText = document.createElement('span');
        timeText.textContent = score.formattedTime;
        timeText.style.cssText = `
            font-size: 1.4em;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;

        timeSection.appendChild(timeText);

        // Date achieved
        const dateSection = document.createElement('div');
        dateSection.style.cssText = `
            text-align: right;
            min-width: 80px;
        `;

        const dateText = document.createElement('span');
        dateText.textContent = this.formatDate(score.timestamp);
        dateText.style.cssText = `
            font-size: 0.9em;
            opacity: 0.7;
        `;

        dateSection.appendChild(dateText);

        item.appendChild(rankSection);
        item.appendChild(timeSection);
        item.appendChild(dateSection);

        return item;
    }

    /**
     * Create statistics section
     * @param {Object} stats - Statistics object from leaderboard system
     * @returns {HTMLElement} Stats section element
     */
    createStatsSection(stats) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            text-align: center;
        `;

        const title = document.createElement('h4');
        title.textContent = 'Statistics';
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #00ffff;
            font-size: 1.1em;
        `;

        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 10px;
        `;

        const statItems = [
            { label: 'Total Scores', value: stats.totalScores },
            { label: 'Best Time', value: stats.bestTime || 'N/A' },
            { label: 'Average Time', value: stats.averageTime || 'N/A' }
        ];

        statItems.forEach(stat => {
            const item = document.createElement('div');
            item.style.cssText = `
                background-color: rgba(255, 255, 255, 0.05);
                padding: 8px;
                border-radius: 5px;
            `;

            const label = document.createElement('div');
            label.textContent = stat.label;
            label.style.cssText = `
                font-size: 0.8em;
                opacity: 0.8;
                margin-bottom: 3px;
            `;

            const value = document.createElement('div');
            value.textContent = stat.value;
            value.style.cssText = `
                font-size: 1.1em;
                font-weight: bold;
                color: #00ffff;
            `;

            item.appendChild(label);
            item.appendChild(value);
            statsGrid.appendChild(item);
        });

        section.appendChild(title);
        section.appendChild(statsGrid);

        return section;
    }

    /**
     * Show empty state when no scores exist
     */
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.6);
        `;

        const icon = document.createElement('div');
        icon.textContent = '🏆';
        icon.style.cssText = `
            font-size: 4em;
            margin-bottom: 15px;
        `;

        const message = document.createElement('p');
        message.textContent = 'No scores yet!';
        message.style.cssText = `
            font-size: 1.5em;
            margin: 0 0 10px 0;
        `;

        const subMessage = document.createElement('p');
        subMessage.textContent = 'Play Time Trial mode to set your first record.';
        subMessage.style.cssText = `
            font-size: 1em;
            margin: 0;
            opacity: 0.8;
        `;

        emptyState.appendChild(icon);
        emptyState.appendChild(message);
        emptyState.appendChild(subMessage);

        this.scoresContainer.appendChild(emptyState);
    }

    /**
     * Get color for ranking position
     * @param {number} rank - Ranking position
     * @returns {string} CSS color value
     */
    getRankColor(rank) {
        switch (rank) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return '#00ffff'; // Cyan
        }
    }

    /**
     * Get medal emoji for top 3 positions
     * @param {number} rank - Ranking position
     * @returns {string} Medal emoji
     */
    getMedalEmoji(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    }

    /**
     * Format timestamp to readable date
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted date string
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Add leaderboard button to game over screen
     * @param {HTMLElement} gameOverElement - Game over screen element
     */
    addToGameOver(gameOverElement) {
        // Check if button already exists
        if (document.getElementById('leaderboardButton')) {
            return;
        }

        const button = document.createElement('div');
        button.id = 'leaderboardButton';
        button.textContent = 'View Leaderboard';
        button.style.cssText = `
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 1.5em;
            cursor: pointer;
            background-color: rgba(0, 255, 255, 0.2);
            border: 2px solid #00ffff;
            padding: 10px 20px;
            border-radius: 8px;
            transition: all 0.3s;
            display: none;
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0, 255, 255, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
        });

        button.addEventListener('click', () => {
            this.show();
        });

        document.body.appendChild(button);
    }

    /**
     * Show/hide leaderboard button based on game mode
     * @param {boolean} isTimeTrialMode - Whether currently in Time Trial mode
     */
    toggleLeaderboardButton(isTimeTrialMode) {
        const button = document.getElementById('leaderboardButton');
        if (button) {
            button.style.display = isTimeTrialMode ? 'flex' : 'none';
        }
    }

    /**
     * Cleanup UI elements
     */
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        const button = document.getElementById('leaderboardButton');
        if (button && button.parentNode) {
            button.parentNode.removeChild(button);
        }
    }
}

module.exports = { LeaderboardUI };