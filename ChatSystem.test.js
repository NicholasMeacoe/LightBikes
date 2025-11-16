/**
 * Tests for ChatSystem class
 */

const { ChatSystem } = require('./ChatSystem');

describe('ChatSystem', () => {
    let chatSystem;
    let mockNetworkManager;
    
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        
        // Create mock network manager
        mockNetworkManager = {
            onChatMessage: jest.fn(),
            sendChatMessage: jest.fn(),
            getPlayerId: jest.fn().mockReturnValue('player-1'),
            socket: {
                emit: jest.fn()
            }
        };
        
        chatSystem = new ChatSystem(mockNetworkManager);
    });
    
    afterEach(() => {
        if (chatSystem) {
            chatSystem.destroy();
        }
    });
    
    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(chatSystem.networkManager).toBe(mockNetworkManager);
            expect(chatSystem.messages).toEqual([]);
            expect(chatSystem.mutedPlayers).toBeInstanceOf(Set);
            expect(chatSystem.maxMessages).toBe(100);
            expect(chatSystem.chatEnabled).toBe(true);
        });
        
        it('should setup network handlers', () => {
            expect(mockNetworkManager.onChatMessage).toHaveBeenCalled();
        });
    });
    
    describe('createChatInterface', () => {
        it('should create chat interface elements', () => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            
            chatSystem.createChatInterface(parent);
            
            expect(chatSystem.elements.container).toBeTruthy();
            expect(chatSystem.elements.messagesContainer).toBeTruthy();
            expect(chatSystem.elements.input).toBeTruthy();
            expect(chatSystem.elements.sendButton).toBeTruthy();
        });
        
        it('should apply custom options', () => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            
            chatSystem.createChatInterface(parent, {
                width: '500px',
                height: '300px',
                placeholder: 'Custom placeholder'
            });
            
            expect(chatSystem.elements.container.style.width).toBe('500px');
            expect(chatSystem.elements.messagesContainer.style.height).toBe('300px');
            expect(chatSystem.elements.input.placeholder).toBe('Custom placeholder');
        });
        
        it('should return container element', () => {
            const parent = document.createElement('div');
            const container = chatSystem.createChatInterface(parent);
            
            expect(container).toBe(chatSystem.elements.container);
        });
    });
    
    describe('sendMessage', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should send message through network manager', () => {
            chatSystem.elements.input.value = 'Hello world';
            chatSystem.sendMessage();
            
            expect(mockNetworkManager.sendChatMessage).toHaveBeenCalledWith('Hello world');
            expect(chatSystem.elements.input.value).toBe('');
        });
        
        it('should not send empty messages', () => {
            chatSystem.elements.input.value = '   ';
            chatSystem.sendMessage();
            
            expect(mockNetworkManager.sendChatMessage).not.toHaveBeenCalled();
        });
        
        it('should not send messages when chat is disabled', () => {
            chatSystem.setChatEnabled(false);
            chatSystem.elements.input.value = 'Test message';
            chatSystem.sendMessage();
            
            expect(mockNetworkManager.sendChatMessage).not.toHaveBeenCalled();
        });
        
        it('should prevent spam messages', () => {
            chatSystem.elements.input.value = 'Message 1';
            chatSystem.sendMessage();
            
            chatSystem.elements.input.value = 'Message 2';
            chatSystem.sendMessage();
            
            // Second message should be blocked
            expect(mockNetworkManager.sendChatMessage).toHaveBeenCalledTimes(1);
        });
        
        it('should reject messages over 200 characters', () => {
            chatSystem.elements.input.value = 'a'.repeat(201);
            chatSystem.sendMessage();
            
            expect(mockNetworkManager.sendChatMessage).not.toHaveBeenCalled();
        });
    });
    
    describe('addMessage', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should add message to messages array', () => {
            const messageData = {
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Hello!',
                timestamp: Date.now()
            };
            
            chatSystem.addMessage(messageData);
            
            expect(chatSystem.messages).toHaveLength(1);
            expect(chatSystem.messages[0].message).toBe('Hello!');
        });
        
        it('should render message in UI', () => {
            const messageData = {
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Hello!',
                type: 'chat'
            };
            
            chatSystem.addMessage(messageData);
            
            expect(chatSystem.elements.messagesContainer.textContent).toContain('Player 2');
            expect(chatSystem.elements.messagesContainer.textContent).toContain('Hello!');
        });
        
        it('should not add messages from muted players', () => {
            chatSystem.mutePlayer('player-2');
            
            const messageData = {
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Hello!'
            };
            
            chatSystem.addMessage(messageData);
            
            expect(chatSystem.messages).toHaveLength(0);
        });
        
        it('should limit message history to maxMessages', () => {
            chatSystem.maxMessages = 5;
            
            for (let i = 0; i < 10; i++) {
                chatSystem.addMessage({
                    playerId: 'player-2',
                    playerName: 'Player 2',
                    message: `Message ${i}`
                });
            }
            
            expect(chatSystem.messages).toHaveLength(5);
        });
    });
    
    describe('showSystemMessage', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should add system message', () => {
            chatSystem.showSystemMessage('Server restarting');
            
            expect(chatSystem.messages).toHaveLength(1);
            expect(chatSystem.messages[0].type).toBe('system');
            expect(chatSystem.messages[0].message).toBe('Server restarting');
        });
    });
    
    describe('renderMessages', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should show empty message when no messages', () => {
            chatSystem.renderMessages();
            
            expect(chatSystem.elements.messagesContainer.textContent).toContain('No messages yet');
        });
        
        it('should render all messages', () => {
            chatSystem.messages = [
                { playerId: 'p1', playerName: 'Player 1', message: 'Hi', type: 'chat', timestamp: Date.now() },
                { playerId: 'p2', playerName: 'Player 2', message: 'Hello', type: 'chat', timestamp: Date.now() }
            ];
            
            chatSystem.renderMessages();
            
            expect(chatSystem.elements.messagesContainer.textContent).toContain('Player 1');
            expect(chatSystem.elements.messagesContainer.textContent).toContain('Player 2');
        });
    });
    
    describe('renderMessage', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should render chat message', () => {
            const messageData = {
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Test message',
                type: 'chat',
                timestamp: Date.now()
            };
            
            chatSystem.renderMessage(messageData);
            
            const messageEl = chatSystem.elements.messagesContainer.querySelector('.chat-message-chat');
            expect(messageEl).toBeTruthy();
            expect(messageEl.textContent).toContain('Player 2');
            expect(messageEl.textContent).toContain('Test message');
        });
        
        it('should render system message with different styling', () => {
            const messageData = {
                playerId: 'system',
                playerName: 'System',
                message: 'System message',
                type: 'system',
                timestamp: Date.now()
            };
            
            chatSystem.renderMessage(messageData);
            
            const messageEl = chatSystem.elements.messagesContainer.querySelector('.chat-message-system');
            expect(messageEl).toBeTruthy();
        });
        
        it('should escape HTML in messages', () => {
            const messageData = {
                playerId: 'player-2',
                playerName: '<script>alert("xss")</script>',
                message: '<img src=x onerror=alert(1)>',
                type: 'chat',
                timestamp: Date.now()
            };
            
            chatSystem.renderMessage(messageData);
            
            const messageEl = chatSystem.elements.messagesContainer.querySelector('.chat-message-chat');
            expect(messageEl.innerHTML).not.toContain('<script>');
            expect(messageEl.innerHTML).not.toContain('<img');
        });
    });
    
    describe('mutePlayer', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should add player to muted list', () => {
            chatSystem.mutePlayer('player-2');
            
            expect(chatSystem.mutedPlayers.has('player-2')).toBe(true);
        });
        
        it('should remove existing messages from muted player', () => {
            chatSystem.addMessage({
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Message before mute'
            });
            
            expect(chatSystem.elements.messagesContainer.textContent).toContain('Message before mute');
            
            chatSystem.mutePlayer('player-2');
            
            expect(chatSystem.elements.messagesContainer.textContent).not.toContain('Message before mute');
        });
    });
    
    describe('unmutePlayer', () => {
        it('should remove player from muted list', () => {
            chatSystem.mutePlayer('player-2');
            expect(chatSystem.mutedPlayers.has('player-2')).toBe(true);
            
            chatSystem.unmutePlayer('player-2');
            expect(chatSystem.mutedPlayers.has('player-2')).toBe(false);
        });
    });
    
    describe('reportPlayer', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should show confirmation message', () => {
            chatSystem.reportPlayer('player-2', 'Player 2');
            
            expect(chatSystem.messages.some(msg => 
                msg.message.includes('Reported Player 2')
            )).toBe(true);
        });
        
        it('should send report to server', () => {
            chatSystem.reportPlayer('player-2', 'Player 2');
            
            expect(mockNetworkManager.socket.emit).toHaveBeenCalledWith('reportPlayer', {
                playerId: 'player-2',
                reason: 'inappropriate_behavior'
            });
        });
    });
    
    describe('isSpamming', () => {
        it('should return false if no previous message', () => {
            expect(chatSystem.isSpamming()).toBe(false);
        });
        
        it('should return true if message sent too quickly', () => {
            chatSystem.lastMessageTime = Date.now();
            expect(chatSystem.isSpamming()).toBe(true);
        });
        
        it('should return false if enough time has passed', () => {
            chatSystem.lastMessageTime = Date.now() - 2000;
            expect(chatSystem.isSpamming()).toBe(false);
        });
    });
    
    describe('scrollToBottom', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should set scrollTop to scrollHeight', () => {
            // Add many messages to create scroll
            for (let i = 0; i < 20; i++) {
                chatSystem.addMessage({
                    playerId: 'player-2',
                    playerName: 'Player 2',
                    message: `Message ${i}`
                });
            }
            
            const container = chatSystem.elements.messagesContainer;
            const scrollHeight = container.scrollHeight;
            
            chatSystem.scrollToBottom();
            
            // In jsdom, scrollTop is set but doesn't actually scroll
            // We verify the method was called by checking scrollTop was set to scrollHeight
            expect(container.scrollTop).toBe(scrollHeight);
        });
    });
    
    describe('clearMessages', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should clear all messages', () => {
            chatSystem.addMessage({
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Test'
            });
            
            expect(chatSystem.messages).toHaveLength(1);
            
            chatSystem.clearMessages();
            
            expect(chatSystem.messages).toHaveLength(0);
        });
    });
    
    describe('setChatEnabled', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should disable chat input and button', () => {
            chatSystem.setChatEnabled(false);
            
            expect(chatSystem.chatEnabled).toBe(false);
            expect(chatSystem.elements.input.disabled).toBe(true);
            expect(chatSystem.elements.sendButton.disabled).toBe(true);
        });
        
        it('should enable chat input and button', () => {
            chatSystem.setChatEnabled(false);
            chatSystem.setChatEnabled(true);
            
            expect(chatSystem.chatEnabled).toBe(true);
            expect(chatSystem.elements.input.disabled).toBe(false);
            expect(chatSystem.elements.sendButton.disabled).toBe(false);
        });
    });
    
    describe('isChatFocused', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should return true when input is focused', () => {
            chatSystem.elements.input.setAttribute('data-chat-focused', 'true');
            expect(chatSystem.isChatFocused()).toBe(true);
        });
        
        it('should return false when input is not focused', () => {
            expect(chatSystem.isChatFocused()).toBe(false);
        });
    });
    
    describe('escapeHtml', () => {
        it('should escape HTML special characters', () => {
            const escaped = chatSystem.escapeHtml('<script>alert("xss")</script>');
            expect(escaped).not.toContain('<script>');
            expect(escaped).toContain('&lt;');
            expect(escaped).toContain('&gt;');
        });
    });
    
    describe('getContainer', () => {
        it('should return container element', () => {
            const parent = document.createElement('div');
            chatSystem.createChatInterface(parent);
            
            expect(chatSystem.getContainer()).toBe(chatSystem.elements.container);
        });
    });
    
    describe('destroy', () => {
        it('should cleanup all elements and data', () => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
            
            chatSystem.addMessage({
                playerId: 'player-2',
                playerName: 'Player 2',
                message: 'Test'
            });
            
            chatSystem.destroy();
            
            expect(chatSystem.messages).toEqual([]);
            expect(chatSystem.mutedPlayers.size).toBe(0);
            expect(chatSystem.elements.container).toBeNull();
        });
    });
    
    describe('event listeners', () => {
        beforeEach(() => {
            const parent = document.createElement('div');
            document.body.appendChild(parent);
            chatSystem.createChatInterface(parent);
        });
        
        it('should send message on button click', () => {
            chatSystem.elements.input.value = 'Test message';
            chatSystem.elements.sendButton.click();
            
            expect(mockNetworkManager.sendChatMessage).toHaveBeenCalledWith('Test message');
        });
        
        it('should send message on Enter key', () => {
            chatSystem.elements.input.value = 'Test message';
            
            const event = new KeyboardEvent('keypress', { key: 'Enter' });
            chatSystem.elements.input.dispatchEvent(event);
            
            expect(mockNetworkManager.sendChatMessage).toHaveBeenCalledWith('Test message');
        });
    });
});
