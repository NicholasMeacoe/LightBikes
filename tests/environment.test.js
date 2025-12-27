describe('Environment Test', () => {
    it('should have required globals', () => {
        expect(global).toBeDefined();
        expect(global.document).toBeDefined();
        expect(global.window).toBeDefined();
        expect(global.navigator).toBeDefined();
    });

    it('should have JSDOM environment', () => {
        expect(window).toBeDefined();
        expect(document).toBeDefined();
        expect(document.createElement).toBeDefined();
    });

    it('should have Jest functions', () => {
        expect(jest).toBeDefined();
        expect(expect).toBeDefined();
        expect(test).toBeDefined();
        expect(describe).toBeDefined();
    });

    it('should have requestAnimationFrame', () => {
        expect(typeof requestAnimationFrame).toBe('function');
    });
});
