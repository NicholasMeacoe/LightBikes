/**
 * ColorPickerUI Tests
 * Tests for the color picker UI component functionality
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { ColorPickerUI } = require('@/ui/ColorPickerUI.js');

// Mock DOM methods for testing
const mockElement = {
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    maxLength: 0,
    type: '',
    disabled: false,
    classList: {
        contains: jest.fn(() => false),
        add: jest.fn(),
        remove: jest.fn(),
    },
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(() => ''),
    click: jest.fn(),
    dispatchEvent: jest.fn(),
};

const mockDocument = {
    createElement: jest.fn(() => ({ ...mockElement })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        innerHTML: '',
    },
};

global.document = mockDocument;

describe('ColorPickerUI', () => {
    let colorPicker;

    beforeEach(() => {
        colorPicker = new ColorPickerUI();
        // Clear any existing DOM elements
        document.body.innerHTML = '';
    });

    afterEach(() => {
        if (colorPicker) {
            colorPicker.destroy();
        }
    });

    describe('initialization', () => {
        it('should initialize with default green color', () => {
            expect(colorPicker.currentColor).toBe('#00FF00');
        });

        it('should have preset colors defined', () => {
            const presets = colorPicker.presetColors;
            expect(presets.red).toBe('#FF0000');
            expect(presets.blue).toBe('#0000FF');
            expect(presets.green).toBe('#00FF00');
            expect(presets.yellow).toBe('#FFFF00');
            expect(presets.purple).toBe('#800080');
            expect(presets.orange).toBe('#FFA500');
            expect(presets.cyan).toBe('#00FFFF');
            expect(presets.white).toBe('#FFFFFF');
        });
    });

    describe('createElement', () => {
        it('should create color picker DOM element', () => {
            const element = colorPicker.createElement('Test Color Picker');

            expect(element).toBeTruthy();
            expect(element.className).toBe('color-picker-container');
            expect(element.querySelector('h4').textContent).toBe('Test Color Picker');
        });

        it('should create preset color buttons', () => {
            const element = colorPicker.createElement();
            const presetButtons = element.querySelectorAll('.color-preset-btn');

            expect(presetButtons.length).toBe(8); // 8 preset colors

            // Check first button (red)
            const redButton = presetButtons[0];
            expect(redButton.getAttribute('data-color')).toBe('#FF0000');
            expect(redButton.style.backgroundColor).toBe('rgb(255, 0, 0)');
        });

        it('should create hex input field', () => {
            const element = colorPicker.createElement();
            const hexInput = element.querySelector('.color-hex-input');

            expect(hexInput).toBeTruthy();
            expect(hexInput.type).toBe('text');
            expect(hexInput.value).toBe('#00FF00');
            expect(hexInput.maxLength).toBe(7);
        });

        it('should create color preview element', () => {
            const element = colorPicker.createElement();
            const preview = element.querySelector('.color-preview');

            expect(preview).toBeTruthy();
            expect(preview.style.backgroundColor).toBe('rgb(0, 255, 0)');
        });
    });

    describe('setColor', () => {
        beforeEach(() => {
            colorPicker.createElement();
        });

        it('should set valid hex color', () => {
            const result = colorPicker.setColor('#FF0000');

            expect(colorPicker.currentColor).toBe('#FF0000');
            expect(colorPicker.hexInput.value).toBe('#FF0000');
            expect(colorPicker.previewElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
        });

        it('should reject invalid color format', () => {
            const originalColor = colorPicker.currentColor;
            colorPicker.setColor('invalid-color');

            expect(colorPicker.currentColor).toBe(originalColor);
        });

        it('should trigger color change callback', () => {
            const callback = jest.fn();
            colorPicker.setOnColorChange(callback);

            colorPicker.setColor('#FF0000');

            expect(callback).toHaveBeenCalledWith('#FF0000');
        });

        it('should update preset button selection', () => {
            const element = colorPicker.element;
            const redButton = element.querySelector('[data-color="#FF0000"]');

            colorPicker.setColor('#FF0000');

            expect(redButton.classList.contains('selected')).toBe(true);
        });
    });

    describe('color validation', () => {
        it('should validate correct hex colors', () => {
            expect(colorPicker.validateColorFormat('#FF0000')).toBe(true);
            expect(colorPicker.validateColorFormat('#00ff00')).toBe(true);
            expect(colorPicker.validateColorFormat('#123ABC')).toBe(true);
        });

        it('should reject invalid color formats', () => {
            expect(colorPicker.validateColorFormat('FF0000')).toBe(false); // Missing #
            expect(colorPicker.validateColorFormat('#FF00')).toBe(false); // Too short
            expect(colorPicker.validateColorFormat('#FF00000')).toBe(false); // Too long
            expect(colorPicker.validateColorFormat('#GGGGGG')).toBe(false); // Invalid hex
            expect(colorPicker.validateColorFormat('')).toBe(false); // Empty
            expect(colorPicker.validateColorFormat(null)).toBe(false); // Null
        });
    });

    describe('color contrast validation', () => {
        it('should validate sufficient contrast', () => {
            // White on dark blue should have good contrast
            expect(colorPicker.validateColorContrast('#FFFFFF', '#000033')).toBe(true);
            // Yellow on dark blue should have good contrast
            expect(colorPicker.validateColorContrast('#FFFF00', '#000033')).toBe(true);
        });

        it('should reject insufficient contrast', () => {
            // Dark blue on dark blue should have poor contrast
            expect(colorPicker.validateColorContrast('#000066', '#000033')).toBe(false);
            // Light gray on white should have poor contrast
            expect(colorPicker.validateColorContrast('#CCCCCC', '#FFFFFF')).toBe(false);
        });
    });

    describe('luminance calculation', () => {
        it('should calculate correct luminance values', () => {
            // Black should have luminance close to 0
            expect(colorPicker.calculateLuminance('#000000')).toBeCloseTo(0, 2);
            // White should have luminance close to 1
            expect(colorPicker.calculateLuminance('#FFFFFF')).toBeCloseTo(1, 2);
            // Red should have specific luminance
            expect(colorPicker.calculateLuminance('#FF0000')).toBeCloseTo(0.2126, 2);
        });
    });

    describe('user interactions', () => {
        beforeEach(() => {
            colorPicker.createElement();
            document.body.appendChild(colorPicker.element);
        });

        it('should handle preset button clicks', () => {
            const callback = jest.fn();
            colorPicker.setOnColorChange(callback);

            // Simulate clicking red preset button
            colorPicker.setColor('#FF0000');

            expect(colorPicker.currentColor).toBe('#FF0000');
            expect(callback).toHaveBeenCalledWith('#FF0000');
        });

        it('should handle hex input changes', () => {
            const callback = jest.fn();
            colorPicker.setOnColorChange(callback);

            // Simulate valid hex input
            colorPicker.setColor('#0000FF');

            expect(colorPicker.currentColor).toBe('#0000FF');
            expect(callback).toHaveBeenCalledWith('#0000FF');
        });

        it('should handle invalid hex input gracefully', () => {
            const originalColor = colorPicker.currentColor;
            const callback = jest.fn();
            colorPicker.setOnColorChange(callback);

            // Simulate invalid hex input
            colorPicker.setColor('invalid');

            expect(colorPicker.currentColor).toBe(originalColor);
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('enable/disable functionality', () => {
        beforeEach(() => {
            colorPicker.createElement();
        });

        it('should enable color picker', () => {
            colorPicker.setEnabled(true);

            const inputs = colorPicker.element.querySelectorAll('input, button');
            inputs.forEach((input) => {
                expect(input.disabled).toBe(false);
            });
            expect(colorPicker.element.classList.contains('disabled')).toBe(false);
        });

        it('should disable color picker', () => {
            colorPicker.setEnabled(false);

            const inputs = colorPicker.element.querySelectorAll('input, button');
            inputs.forEach((input) => {
                expect(input.disabled).toBe(true);
            });
            expect(colorPicker.element.classList.contains('disabled')).toBe(true);
        });
    });

    describe('cleanup', () => {
        it('should destroy color picker cleanly', () => {
            const element = colorPicker.createElement();
            document.body.appendChild(element);

            colorPicker.destroy();

            expect(colorPicker.element).toBe(null);
            expect(colorPicker.hexInput).toBe(null);
            expect(colorPicker.presetButtons.length).toBe(0);
            expect(colorPicker.previewElement).toBe(null);
            expect(colorPicker.onColorChange).toBe(null);
        });
    });
});
