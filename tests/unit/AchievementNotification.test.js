const { AchievementNotification } = require('@/ui/AchievementNotification.js');

// Mock DOM methods
const mockElement = {
    style: {},
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    offsetHeight: 100,
    textContent: '',
    parentNode: {
        removeChild: jest.fn()
    }
};

const mockDocument = {
    createElement: jest.fn(() => ({
        ...mockElement,
        style: {},
        appendChild: jest.fn(),
        textContent: ''
    })),
    body: {
        appendChild: jest.fn()
    }
};

const mockRequestAnimationFrame = jest.fn(callback => {
    // Execute callback immediately for testing
    callback();
    return 1;
});

// Setup global mocks
global.document = mockDocument;
global.requestAnimationFrame = mockRequestAnimationFrame;

describe('AchievementNotification', () => {
    let notification;
    let mockSetTimeout;
    let mockClearTimeout;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockDocument.createElement.mockClear();
        mockDocument.body.appendChild.mockClear();
        
        // Mock timers - use fake timers for better control
        jest.useFakeTimers();
        mockSetTimeout = jest.spyOn(global, 'setTimeout');
        mockClearTimeout = jest.spyOn(global, 'clearTimeout');

        notification = new AchievementNotification();
    });

    afterEach(() => {
        if (notification) {
            notification.destroy();
        }
        jest.useRealTimers();
        mockSetTimeout.mockRestore();
        mockClearTimeout.mockRestore();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(notification.notificationQueue).toEqual([]);
            expect(notification.isDisplaying).toBe(false);
            expect(notification.currentNotification).toBeNull();
            expect(notification.displayDuration).toBe(3000);
            expect(notification.fadeInDuration).toBe(500);
            expect(notification.fadeOutDuration).toBe(500);
        });

        it('should create notification DOM element', () => {
            expect(mockDocument.createElement).toHaveBeenCalledWith('div');
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
        });

        it('should create all required child elements', () => {
            // Should create: notification container, icon, message container, title, message, time
            expect(mockDocument.createElement).toHaveBeenCalledTimes(6);
        });
    });

    describe('showAchievement', () => {
        it('should add achievement to queue', () => {
            const achievement = {
                message: 'Test Achievement',
                description: 'Test Description',
                seconds: 30
            };

            notification.showAchievement(achievement);
            
            expect(notification.notificationQueue).toHaveLength(1);
            expect(notification.notificationQueue[0].message).toBe('Test Achievement');
        });

        it('should handle achievement with formatted time', () => {
            const achievement = {
                message: 'Test Achievement',
                formattedTime: '01:30'
            };

            notification.showAchievement(achievement);
            
            expect(notification.notificationQueue[0].formattedTime).toBe('01:30');
        });

        it('should ignore invalid achievements', () => {
            notification.showAchievement(null);
            notification.showAchievement({});
            notification.showAchievement({ description: 'No message' });
            
            expect(notification.notificationQueue).toHaveLength(0);
        });

        it('should process queue immediately if not displaying', () => {
            const processQueueSpy = jest.spyOn(notification, 'processQueue');
            
            notification.showAchievement({
                message: 'Test Achievement',
                seconds: 30
            });
            
            expect(processQueueSpy).toHaveBeenCalled();
        });

        it('should not process queue if already displaying', () => {
            notification.isDisplaying = true;
            const processQueueSpy = jest.spyOn(notification, 'processQueue');
            
            notification.showAchievement({
                message: 'Test Achievement',
                seconds: 30
            });
            
            expect(processQueueSpy).not.toHaveBeenCalled();
        });
    });

    describe('processQueue', () => {
        it('should not process empty queue', () => {
            const displaySpy = jest.spyOn(notification, 'displayNotification');
            
            notification.processQueue();
            
            expect(displaySpy).not.toHaveBeenCalled();
            expect(notification.isDisplaying).toBe(false);
        });

        it('should not process if already displaying', () => {
            notification.notificationQueue.push({ message: 'Test' });
            notification.isDisplaying = true;
            const displaySpy = jest.spyOn(notification, 'displayNotification');
            
            notification.processQueue();
            
            expect(displaySpy).not.toHaveBeenCalled();
        });

        it('should process first item in queue', () => {
            const testNotification = { message: 'Test Achievement' };
            notification.notificationQueue.push(testNotification);
            const displaySpy = jest.spyOn(notification, 'displayNotification');
            
            notification.processQueue();
            
            expect(displaySpy).toHaveBeenCalledWith(testNotification);
            expect(notification.isDisplaying).toBe(true);
            expect(notification.notificationQueue).toHaveLength(0);
        });
    });

    describe('displayNotification', () => {
        it('should update notification content', () => {
            const testNotification = {
                message: 'Test Achievement',
                formattedTime: '01:30'
            };

            notification.displayNotification(testNotification);
            
            expect(notification.currentNotification).toBe(testNotification);
        });

        it('should show and animate notification element', () => {
            const testNotification = { message: 'Test' };
            
            notification.displayNotification(testNotification);
            
            expect(notification.notificationElement.style.display).toBe('block');
        });

        it('should schedule hide animation', () => {
            const hideNotificationSpy = jest.spyOn(notification, 'hideNotification');
            const testNotification = { message: 'Test' };
            
            notification.displayNotification(testNotification);
            
            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                notification.displayDuration
            );
        });
    });

    describe('hideNotification', () => {
        beforeEach(() => {
            notification.currentNotification = { message: 'Test' };
            notification.isDisplaying = true;
        });

        it('should not hide if no current notification', () => {
            notification.currentNotification = null;
            
            notification.hideNotification();
            
            // Should not change display state
            expect(notification.isDisplaying).toBe(true);
        });

        it('should animate out notification', () => {
            notification.hideNotification();
            
            expect(notification.notificationElement.style.opacity).toBe('0');
            expect(notification.notificationElement.style.transform).toBe('translateX(100%)');
        });

        it('should reset state after animation', () => {
            const processQueueSpy = jest.spyOn(notification, 'processQueue');
            
            notification.hideNotification();
            
            // Fast-forward timers
            jest.advanceTimersByTime(notification.fadeOutDuration + 150);
            
            expect(notification.notificationElement.style.display).toBe('none');
            expect(notification.currentNotification).toBeNull();
            expect(notification.isDisplaying).toBe(false);
            expect(processQueueSpy).toHaveBeenCalled();
        });
    });

    describe('clearQueue', () => {
        it('should clear notification queue', () => {
            notification.notificationQueue.push({ message: 'Test 1' });
            notification.notificationQueue.push({ message: 'Test 2' });
            
            notification.clearQueue();
            
            expect(notification.notificationQueue).toHaveLength(0);
        });

        it('should hide current notification if displaying', () => {
            notification.isDisplaying = true;
            const hideNotificationSpy = jest.spyOn(notification, 'hideNotification');
            
            notification.clearQueue();
            
            expect(hideNotificationSpy).toHaveBeenCalled();
        });
    });

    describe('isActive', () => {
        it('should return true when displaying', () => {
            notification.isDisplaying = true;
            
            expect(notification.isActive()).toBe(true);
        });

        it('should return true when queue has items', () => {
            notification.notificationQueue.push({ message: 'Test' });
            
            expect(notification.isActive()).toBe(true);
        });

        it('should return false when not displaying and queue empty', () => {
            notification.isDisplaying = false;
            notification.notificationQueue = [];
            
            expect(notification.isActive()).toBe(false);
        });
    });

    describe('getQueueLength', () => {
        it('should return correct queue length', () => {
            expect(notification.getQueueLength()).toBe(0);
            
            notification.notificationQueue.push({ message: 'Test 1' });
            notification.notificationQueue.push({ message: 'Test 2' });
            
            expect(notification.getQueueLength()).toBe(2);
        });
    });

    describe('updatePosition', () => {
        it('should update element position styles', () => {
            const position = {
                top: '100px',
                right: '50px',
                left: '25px'
            };

            notification.updatePosition(position);
            
            expect(notification.notificationElement.style.top).toBe('100px');
            expect(notification.notificationElement.style.right).toBe('50px');
            expect(notification.notificationElement.style.left).toBe('25px');
        });

        it('should only update provided position properties', () => {
            notification.updatePosition({ top: '100px' });
            
            expect(notification.notificationElement.style.top).toBe('100px');
            expect(notification.notificationElement.style.right).toBeUndefined();
        });
    });

    describe('setDisplayDuration', () => {
        it('should update display duration with valid value', () => {
            notification.setDisplayDuration(5000);
            
            expect(notification.displayDuration).toBe(5000);
        });

        it('should ignore invalid duration values', () => {
            const originalDuration = notification.displayDuration;
            
            notification.setDisplayDuration(-1000);
            notification.setDisplayDuration('invalid');
            notification.setDisplayDuration(0);
            
            expect(notification.displayDuration).toBe(originalDuration);
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            expect(notification.formatTime(30000)).toBe('00:30');
            expect(notification.formatTime(90000)).toBe('01:30');
            expect(notification.formatTime(3600000)).toBe('60:00');
        });

        it('should handle invalid inputs', () => {
            expect(notification.formatTime(-1000)).toBe('00:00');
            expect(notification.formatTime('invalid')).toBe('00:00');
            expect(notification.formatTime(NaN)).toBe('00:00');
            expect(notification.formatTime(Infinity)).toBe('00:00');
        });
    });

    describe('destroy', () => {
        it('should clear queue and remove DOM element', () => {
            notification.notificationQueue.push({ message: 'Test' });
            const clearQueueSpy = jest.spyOn(notification, 'clearQueue');
            
            notification.destroy();
            
            expect(clearQueueSpy).toHaveBeenCalled();
            expect(notification.notificationElement).toBeNull();
            expect(notification.currentNotification).toBeNull();
            expect(notification.isDisplaying).toBe(false);
        });
    });

    describe('getDebugInfo', () => {
        it('should return comprehensive debug information', () => {
            notification.isDisplaying = true;
            notification.notificationQueue.push({ message: 'Test' });
            notification.currentNotification = { message: 'Current' };

            const debugInfo = notification.getDebugInfo();
            
            expect(debugInfo.isDisplaying).toBe(true);
            expect(debugInfo.queueLength).toBe(1);
            expect(debugInfo.currentNotification.message).toBe('Current');
            expect(debugInfo.displayDuration).toBe(3000);
            expect(debugInfo.elementExists).toBe(true);
        });
    });

    describe('notification flow integration', () => {
        it('should handle multiple notifications in sequence', () => {
            const achievements = [
                { message: 'First Achievement', seconds: 30 },
                { message: 'Second Achievement', seconds: 60 }
            ];

            // Add both achievements
            notification.showAchievement(achievements[0]);
            notification.showAchievement(achievements[1]);
            
            expect(notification.getQueueLength()).toBe(1); // One processed, one queued
            expect(notification.isDisplaying).toBe(true);
            
            // Fast-forward through first notification
            jest.advanceTimersByTime(notification.displayDuration + notification.fadeOutDuration + 200);
            
            expect(notification.getQueueLength()).toBe(0);
        });

        it('should not interfere with gameplay timing', () => {
            const startTime = Date.now();
            
            notification.showAchievement({
                message: 'Test Achievement',
                seconds: 30
            });
            
            const endTime = Date.now();
            
            // Notification display should be nearly instantaneous
            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});