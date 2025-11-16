/**
 * ChatSystem - Dedicated chat functionality for multiplayer
 * Handles chat interface, message display, and moderation features
 */

class ChatSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.messages = [];
        this.mutedPlayers = new Set();
        this.maxMessages = 100;
        this.chatEnabled = true;
        
        // UI elements
        this.elements = {
            container: null,
            messagesContainer: null,
            input: null,
            sendButton: null
        };
        
        this.setupNetworkHandlers();
    }
    
    /**
     * Setup network event handlers
     */
    setupNetworkHandlers() {
        if (!this.networkManager) return;
        
        this.networkManager.onChatMessage((data) => {
            this.addMessage(data);
        });
    }
    
    /**
     * Create chat interface
     * @param {HTMLElement} parentElement - Parent element to attach chat to
     * @param {Object} options - Configuration options
     */
    createChatInterface(parentElement, options = {}) {
        const {
            width = '100%',
            height = '200px',
            showModeration = true,
            placeholder = 'Type a message...'
        } = options;
        
        // Create container
        const container = document.createElement('div');
        container.className = 'chat-system';
        container.style.cssText = `
            width: ${width};
            display: flex;
            flex-direction: column;
        `;
        
        // Create messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';
        messagesContainer.style.cssText = `
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            height: ${height};
            overflow-y: auto;
            margin-bottom: 10px;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chat-input';
        input.placeholder = placeholder;
        input.maxLength = 200;
        input.style.cssText = `
            flex: 1;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            font-family: Arial, sans-serif;
        `;
        
        // Create send button
        const sendButton = document.createElement('button');
        sendButton.className = 'chat-send-button';
        sendButton.textContent = 'Send';
        sendButton.style.cssText = `
            padding: 10px 20px;
            background: #00ff00;
            color: black;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        // Assemble interface
        inputContainer.appendChild(input);
        inputContainer.appendChild(sendButton);
        container.appendChild(messagesContainer);
        container.appendChild(inputContainer);
        
        if (parentElement) {
            parentElement.appendChild(container);
        }
        
        // Store references
        this.elements.container = container;
        this.elements.messagesContainer = messagesContainer;
        this.elements.input = input;
        this.elements.sendButton = sendButton;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render existing messages
        this.renderMessages();
        
        return container;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.elements.input || !this.elements.sendButton) return;
        
        // Send button click
        this.elements.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key press
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Prevent game controls when typing
        this.elements.input.addEventListener('focus', () => {
            this.elements.input.setAttribute('data-chat-focused', 'true');
        });
        
        this.elements.input.addEventListener('blur', () => {
            this.elements.input.removeAttribute('data-chat-focused');
        });
    }
    
    /**
     * Send chat message
     */
    sendMessage() {
        if (!this.chatEnabled) {
            this.showSystemMessage('Chat is disabled');
            return;
        }
        
        const message = this.elements.input.value.trim();
        
        if (!message) {
            return;
        }
        
        if (message.length > 200) {
            this.showSystemMessage('Message too long (max 200 characters)');
            return;
        }
        
        // Check for spam (simple rate limiting)
        if (this.isSpamming()) {
            this.showSystemMessage('Please wait before sending another message');
            return;
        }
        
        // Send through network manager
        if (this.networkManager) {
            this.networkManager.sendChatMessage(message);
        }
        
        // Clear input
        this.elements.input.value = '';
        
        // Track last message time for spam prevention
        this.lastMessageTime = Date.now();
    }
    
    /**
     * Add message to chat
     * @param {Object} messageData - Message data from server
     */
    addMessage(messageData) {
        const {
            playerId,
            playerName = 'Player',
            message,
            timestamp = Date.now(),
            type = 'chat' // chat, system, join, leave
        } = messageData;
        
        // Check if player is muted
        if (this.mutedPlayers.has(playerId)) {
            return;
        }
        
        // Add to messages array
        this.messages.push({
            playerId,
            playerName,
            message,
            timestamp,
            type
        });
        
        // Limit message history
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        // Render new message
        this.renderMessage(this.messages[this.messages.length - 1]);
        
        // Auto-scroll to bottom
        this.scrollToBottom();
    }
    
    /**
     * Show system message
     * @param {string} message - System message text
     */
    showSystemMessage(message) {
        this.addMessage({
            playerId: 'system',
            playerName: 'System',
            message,
            type: 'system'
        });
    }
    
    /**
     * Render all messages
     */
    renderMessages() {
        if (!this.elements.messagesContainer) return;
        
        this.elements.messagesContainer.innerHTML = '';
        
        if (this.messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'color: #888; text-align: center; padding: 20px;';
            emptyMessage.textContent = 'No messages yet. Say hello!';
            this.elements.messagesContainer.appendChild(emptyMessage);
            return;
        }
        
        this.messages.forEach(msg => this.renderMessage(msg));
    }
    
    /**
     * Render single message
     * @param {Object} messageData - Message data
     */
    renderMessage(messageData) {
        if (!this.elements.messagesContainer) return;
        
        const { playerId, playerName, message, timestamp, type } = messageData;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message chat-message-${type}`;
        messageEl.setAttribute('data-player-id', playerId);
        
        // Style based on message type
        let backgroundColor = 'rgba(255, 255, 255, 0.05)';
        let textColor = 'white';
        
        if (type === 'system') {
            backgroundColor = 'rgba(255, 255, 0, 0.1)';
            textColor = '#ffff00';
        } else if (type === 'join') {
            backgroundColor = 'rgba(0, 255, 0, 0.1)';
            textColor = '#00ff00';
        } else if (type === 'leave') {
            backgroundColor = 'rgba(255, 0, 0, 0.1)';
            textColor = '#ff8888';
        }
        
        messageEl.style.cssText = `
            padding: 8px;
            margin-bottom: 5px;
            background: ${backgroundColor};
            border-radius: 3px;
            word-wrap: break-word;
            color: ${textColor};
        `;
        
        // Format timestamp
        const time = new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Create message content
        if (type === 'system' || type === 'join' || type === 'leave') {
            messageEl.innerHTML = `
                <span style="color: #888; font-size: 11px;">[${time}]</span>
                <span style="margin-left: 5px;">${message}</span>
            `;
        } else {
            messageEl.innerHTML = `
                <span style="color: #888; font-size: 11px;">[${time}]</span>
                <strong style="margin-left: 5px; color: #00ffff;">${this.escapeHtml(playerName)}:</strong>
                <span style="margin-left: 5px;">${this.escapeHtml(message)}</span>
            `;
            
            // Add moderation button for non-system messages
            if (playerId !== 'system' && playerId !== this.networkManager?.getPlayerId()) {
                const moderationBtn = document.createElement('button');
                moderationBtn.textContent = '⋮';
                moderationBtn.style.cssText = `
                    float: right;
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0 5px;
                `;
                moderationBtn.onclick = () => this.showModerationMenu(playerId, playerName);
                messageEl.appendChild(moderationBtn);
            }
        }
        
        this.elements.messagesContainer.appendChild(messageEl);
    }
    
    /**
     * Show moderation menu for a player
     * @param {string} playerId - Player ID
     * @param {string} playerName - Player name
     */
    showModerationMenu(playerId, playerName) {
        const isMuted = this.mutedPlayers.has(playerId);
        
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #222;
            border: 2px solid #00ff00;
            border-radius: 5px;
            padding: 20px;
            z-index: 10000;
            min-width: 250px;
        `;
        
        menu.innerHTML = `
            <h3 style="margin-top: 0; color: white;">Moderate: ${this.escapeHtml(playerName)}</h3>
            
            <button id="mute-player-btn" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                background: ${isMuted ? '#ff8800' : '#ff0000'};
                color: white;
                border: none;
                cursor: pointer;
                border-radius: 3px;
            ">${isMuted ? 'Unmute' : 'Mute'}</button>
            
            <button id="report-player-btn" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                background: #ff0000;
                color: white;
                border: none;
                cursor: pointer;
                border-radius: 3px;
            ">Report Player</button>
            
            <button id="close-menu-btn" style="
                width: 100%;
                padding: 10px;
                background: #666;
                color: white;
                border: none;
                cursor: pointer;
                border-radius: 3px;
            ">Cancel</button>
        `;
        
        document.body.appendChild(menu);
        
        // Mute/Unmute button
        document.getElementById('mute-player-btn').addEventListener('click', () => {
            if (isMuted) {
                this.unmutePlayer(playerId);
                this.showSystemMessage(`Unmuted ${playerName}`);
            } else {
                this.mutePlayer(playerId);
                this.showSystemMessage(`Muted ${playerName}`);
            }
            menu.remove();
        });
        
        // Report button
        document.getElementById('report-player-btn').addEventListener('click', () => {
            this.reportPlayer(playerId, playerName);
            menu.remove();
        });
        
        // Close button
        document.getElementById('close-menu-btn').addEventListener('click', () => {
            menu.remove();
        });
    }
    
    /**
     * Mute a player
     * @param {string} playerId - Player ID to mute
     */
    mutePlayer(playerId) {
        this.mutedPlayers.add(playerId);
        
        // Remove messages from muted player
        if (this.elements.messagesContainer) {
            const messages = this.elements.messagesContainer.querySelectorAll(
                `[data-player-id="${playerId}"]`
            );
            messages.forEach(msg => msg.remove());
        }
    }
    
    /**
     * Unmute a player
     * @param {string} playerId - Player ID to unmute
     */
    unmutePlayer(playerId) {
        this.mutedPlayers.delete(playerId);
    }
    
    /**
     * Report a player
     * @param {string} playerId - Player ID to report
     * @param {string} playerName - Player name
     */
    reportPlayer(playerId, playerName) {
        // In a real implementation, this would send a report to the server
        this.showSystemMessage(`Reported ${playerName}. Thank you for helping keep the community safe.`);
        
        // Optionally send report to server
        if (this.networkManager && this.networkManager.socket) {
            this.networkManager.socket.emit('reportPlayer', {
                playerId,
                reason: 'inappropriate_behavior'
            });
        }
    }
    
    /**
     * Check if user is spamming
     * @returns {boolean} True if spamming
     */
    isSpamming() {
        if (!this.lastMessageTime) {
            return false;
        }
        
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        return timeSinceLastMessage < 1000; // 1 second cooldown
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.scrollTop = 
                this.elements.messagesContainer.scrollHeight;
        }
    }
    
    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        this.renderMessages();
    }
    
    /**
     * Enable/disable chat
     * @param {boolean} enabled - Whether chat is enabled
     */
    setChatEnabled(enabled) {
        this.chatEnabled = enabled;
        
        if (this.elements.input) {
            this.elements.input.disabled = !enabled;
        }
        
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = !enabled;
        }
        
        if (!enabled) {
            this.showSystemMessage('Chat has been disabled');
        }
    }
    
    /**
     * Check if chat input is focused
     * @returns {boolean} True if focused
     */
    isChatFocused() {
        return this.elements.input?.getAttribute('data-chat-focused') === 'true';
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get chat container element
     * @returns {HTMLElement} Chat container
     */
    getContainer() {
        return this.elements.container;
    }
    
    /**
     * Destroy chat system
     */
    destroy() {
        if (this.elements.container) {
            this.elements.container.remove();
        }
        
        this.messages = [];
        this.mutedPlayers.clear();
        this.elements = {
            container: null,
            messagesContainer: null,
            input: null,
            sendButton: null
        };
    }
}

module.exports = { ChatSystem };
