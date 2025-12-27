const {
    createLocalStorageMock,
    createPerformanceNowMock,
    createMatchMediaMock,
    createLoggerMock,
    createDOMElementMock,
    createEmissiveMaterialSystemMock,
} = require('./testHelpers.js');

describe('Test Helpers', () => {
    describe('createLocalStorageMock', () => {
        it('should create localStorage mock with all methods', () => {
            const mock = createLocalStorageMock();

            expect(mock.getItem).toBeDefined();
            expect(mock.setItem).toBeDefined();
            expect(mock.removeItem).toBeDefined();
            expect(mock.clear).toBeDefined();
            expect(mock.key).toBeDefined();
        });

        it('should store and retrieve items', () => {
            const mock = createLocalStorageMock();

            mock.setItem('key1', 'value1');
            expect(mock.getItem('key1')).toBe('value1');
        });

        it('should return null for non-existent keys', () => {
            const mock = createLocalStorageMock();

            expect(mock.getItem('nonexistent')).toBeNull();
        });

        it('should remove items', () => {
            const mock = createLocalStorageMock();

            mock.setItem('key1', 'value1');
            mock.removeItem('key1');
            expect(mock.getItem('key1')).toBeNull();
        });

        it('should clear all items', () => {
            const mock = createLocalStorageMock();

            mock.setItem('key1', 'value1');
            mock.setItem('key2', 'value2');
            mock.clear();
            expect(mock.length).toBe(0);
        });

        it('should track length', () => {
            const mock = createLocalStorageMock();

            expect(mock.length).toBe(0);
            mock.setItem('key1', 'value1');
            expect(mock.length).toBe(1);
        });

        it('should support key() method', () => {
            const mock = createLocalStorageMock();

            mock.setItem('key1', 'value1');
            expect(mock.key(0)).toBe('key1');
        });
    });

    describe('createPerformanceNowMock', () => {
        it('should create mock with initial time', () => {
            const mock = createPerformanceNowMock(1000);

            expect(mock()).toBe(1000);
        });

        it('should advance time', () => {
            const mock = createPerformanceNowMock(1000);

            mock.advance(500);
            expect(mock()).toBe(1500);
        });

        it('should set absolute time', () => {
            const mock = createPerformanceNowMock(1000);

            mock.setTime(2000);
            expect(mock()).toBe(2000);
        });

        it('should reset to start time', () => {
            const mock = createPerformanceNowMock(1000);

            mock.advance(500);
            mock.reset();
            expect(mock()).toBe(1000);
        });

        it('should default to 0 start time', () => {
            const mock = createPerformanceNowMock();

            expect(mock()).toBe(0);
        });
    });

    describe('createMatchMediaMock', () => {
        it('should create matchMedia mock', () => {
            const mock = createMatchMediaMock();
            const result = mock('(prefers-reduced-motion: reduce)');

            expect(result.matches).toBe(false);
            expect(result.media).toBe('(prefers-reduced-motion: reduce)');
        });

        it('should support custom matches value', () => {
            const mock = createMatchMediaMock(true);
            const result = mock('(min-width: 768px)');

            expect(result.matches).toBe(true);
        });

        it('should have all required methods', () => {
            const mock = createMatchMediaMock();
            const result = mock('query');

            expect(result.addListener).toBeDefined();
            expect(result.removeListener).toBeDefined();
            expect(result.addEventListener).toBeDefined();
            expect(result.removeEventListener).toBeDefined();
        });
    });

    describe('createLoggerMock', () => {
        it('should create logger with all methods', () => {
            const logger = createLoggerMock();

            expect(logger.warn).toBeDefined();
            expect(logger.info).toBeDefined();
            expect(logger.error).toBeDefined();
            expect(logger.debug).toBeDefined();
        });

        it('should track method calls', () => {
            const logger = createLoggerMock();

            logger.warn('test message');
            expect(logger.warn).toHaveBeenCalledWith('test message');
        });

        it('should support multiple parameters', () => {
            const logger = createLoggerMock();

            logger.warn('message', { data: 'value' });
            expect(logger.warn).toHaveBeenCalledWith('message', { data: 'value' });
        });
    });

    describe('createDOMElementMock', () => {
        it('should create element with common methods', () => {
            const element = createDOMElementMock();

            expect(element.remove).toBeDefined();
            expect(element.appendChild).toBeDefined();
            expect(element.addEventListener).toBeDefined();
        });

        it('should have classList methods', () => {
            const element = createDOMElementMock();

            expect(element.classList.add).toBeDefined();
            expect(element.classList.remove).toBeDefined();
            expect(element.classList.contains).toBeDefined();
        });

        it('should have style and offset properties', () => {
            const element = createDOMElementMock();

            expect(element.style).toBeDefined();
            expect(element.offsetWidth).toBe(100);
            expect(element.offsetHeight).toBe(100);
        });
    });

    describe('createEmissiveMaterialSystemMock', () => {
        it('should create material system with all methods', () => {
            const system = createEmissiveMaterialSystemMock();

            expect(system.updateBikeMaterial).toBeDefined();
            expect(system.updateTrailMaterialTemplate).toBeDefined();
            expect(system.getBikeMaterial).toBeDefined();
            expect(system.getTrailMaterial).toBeDefined();
            expect(system.dispose).toBeDefined();
        });

        it('should return material objects', () => {
            const system = createEmissiveMaterialSystemMock();

            const material = system.getBikeMaterial();
            expect(material).toHaveProperty('color');
        });

        it('should track method calls', () => {
            const system = createEmissiveMaterialSystemMock();

            system.updateBikeMaterial('player', 0xff0000);
            expect(system.updateBikeMaterial).toHaveBeenCalledWith('player', 0xff0000);
        });
    });
});
