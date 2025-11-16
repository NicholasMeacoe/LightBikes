/**
 * AchievementNotification - Non-intrusive achievement notification system
 * Displays achievement unlocks without interfering with gameplay
 */
class AchievementNotification {
    constructor() {
        this.notificationQueue = [];
        this.isDisplaying = false;
        this.currentNotification = null;
        this.displayDuration = 3000; // 3 seconds
        this.fadeInDuration = 500; // 0.5 seconds
        this.fadeOutDuration = 500; // 0.5 seconds
        this.createNotificationElement();
    }

    /**
     * Create the notification DOM element and add styles
     */
    createNotificationElement() {
        // Create notification container
        this.notificationElement = document.createElement('div');
        this.notificationElement.id = 'achievementNotification';
        this.notificationElement.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.9), rgba(0, 200, 255, 0.9));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px 20px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 1.1em;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1);
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-width: 300px;
            min-width: 250px;
            pointer-events: none;
            display: none;
        `;

        // Create achievement icon
        this.iconElement = document.createElement('div');
        this.iconElement.style.cssText = `
            display: inline-block;
            width: 24px;
            height: 24px;
            margin-right: 10px;
            vertical-align: middle;
            font-size: 1.5em;
        `;
        this.iconElement.textContent = '🏆';

        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.cssText = `
            display: inline-block;
            vertical-align: middle;
        `;

        // Create title element
        this.titleElement = document.createElement('div');
        this.titleElement.style.cssText = `
            font-size: 1.1em;
            margin-bottom: 2px;
            color: #ffffff;
        `;
        this.titleElement.textContent = 'Achievement Unlocked!';

        // Create message element
        this.messageElement = document.createElement('div');
        this.messageElement.style.cssText = `
            font-size: 0.9em;
            font-weight: normal;
            color: #e0f7ff;
            line-height: 1.2;
        `;

        // Create time element
        this.timeElement = document.createElement('div');
        this.timeElement.style.cssText = `
            font-size: 0.8em;
            font-weight: normal;
            color: #b3ecff;
            margin-top: 2px;
            opacity: 0.8;
        `;

        // Assemble the notification
        this.messageContainer.appendChild(this.titleElement);
        this.messageContainer.appendChild(this.messageElement);
        this.messageContainer.appendChild(this.timeElement);
        
        this.notificationElement.appendChild(this.iconElement);
        this.notificationElement.appendChild(this.messageContainer);

        // Add to document body
        document.body.appendChild(this.notificationElement);
    }

    /**
     * Show an achievement notification
     * @param {Object} achievement - Achievement object with message, description, and time info
     */
    showAchievement(achievement) {
        if (!achievement || !achievement.message) {
            return;
        }

        // Add to queue
        this.notificationQueue.push({
            message: achievement.message,
            description: achievement.description || '',
            formattedTime: achievement.formattedTime || this.formatTime(achievement.seconds * 1000),
            timestamp: Date.now()
        });

        // Process queue if not currently displaying
        if (!this.isDisplaying) {
            this.processQueue();
        }
    }

    /**
     * Process the notification queue
     */
    processQueue() {
        if (this.notificationQueue.length === 0 || this.isDisplaying) {
            return;
        }

        this.isDisplaying = true;
        const notification = this.notificationQueue.shift();
        this.displayNotification(notification);
    }

    /**
     * Display a single notification
     * @param {Object} notification - Notification data
     */
    displayNotification(notification) {
        this.currentNotification = notification;

        // Update content
        this.messageElement.textContent = notification.message;
        this.timeElement.textContent = `Survived ${notification.formattedTime}`;

        // Show and animate in
        this.notificationElement.style.display = 'block';
        
        // Force reflow before animation
        this.notificationElement.offsetHeight;

        // Animate in
        requestAnimationFrame(() => {
            this.notificationElement.style.opacity = '1';
            this.notificationElement.style.transform = 'translateX(0)';
        });

        // Schedule hide animation
        setTimeout(() => {
            this.hideNotification();
        }, this.displayDuration);
    }

    /**
     * Hide the current notification
     */
    hideNotification() {
        if (!this.currentNotification) {
            return;
        }

        // Animate out
        this.notificationElement.style.opacity = '0';
        this.notificationElement.style.transform = 'translateX(100%)';

        // Hide element after animation
        setTimeout(() => {
            this.notificationElement.style.display = 'none';
            this.currentNotification = null;
            this.isDisplaying = false;

            // Process next notification in queue
            setTimeout(() => {
                this.processQueue();
            }, 100); // Small delay between notifications
        }, this.fadeOutDuration);
    }

    /**
     * Clear all pending notifications
     */
    clearQueue() {
        this.notificationQueue = [];
        
        if (this.isDisplaying) {
            this.hideNotification();
        }
    }

    /**
     * Check if notifications are currently being displayed
     * @returns {boolean} True if displaying or queue has items
     */
    isActive() {
        return this.isDisplaying || this.notificationQueue.length > 0;
    }

    /**
     * Get the number of queued notifications
     * @returns {number} Number of notifications in queue
     */
    getQueueLength() {
        return this.notificationQueue.length;
    }

    /**
     * Update notification position (useful for responsive design)
     * @param {Object} position - Position object with top, right, etc.
     */
    updatePosition(position) {
        if (position.top !== undefined) {
            this.notificationElement.style.top = position.top;
        }
        if (position.right !== undefined) {
            this.notificationElement.style.right = position.right;
        }
        if (position.left !== undefined) {
            this.notificationElement.style.left = position.left;
        }
        if (position.bottom !== undefined) {
            this.notificationElement.style.bottom = position.bottom;
        }
    }

    /**
     * Set custom display duration
     * @param {number} duration - Duration in milliseconds
     */
    setDisplayDuration(duration) {
        if (typeof duration === 'number' && duration > 0) {
            this.displayDuration = duration;
        }
    }

    /**
     * Format time in milliseconds to MM:SS format
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(timeMs) {
        if (typeof timeMs !== 'number' || timeMs < 0 || !isFinite(timeMs)) {
            return "00:00";
        }

        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Destroy the notification system and clean up DOM
     */
    destroy() {
        this.clearQueue();
        
        if (this.notificationElement && this.notificationElement.parentNode) {
            this.notificationElement.parentNode.removeChild(this.notificationElement);
        }
        
        this.notificationElement = null;
        this.currentNotification = null;
        this.isDisplaying = false;
    }

    /**
     * Get debug information about the notification system
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            isDisplaying: this.isDisplaying,
            queueLength: this.notificationQueue.length,
            currentNotification: this.currentNotification,
            displayDuration: this.displayDuration,
            elementExists: !!this.notificationElement
        };
    }
}

module.exports = { AchievementNotification };