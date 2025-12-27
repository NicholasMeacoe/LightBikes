#!/bin/bash

# List of files that were restored and need fixing
FILES=(
    "tests/unit/GlowSettingsPersistence.test.js"
    "tests/unit/GlowSettingsStorage.test.js"
    "tests/unit/InitializationState.test.js"
    "tests/unit/ModeSelector.test.js"
    "tests/unit/NetworkManager.test.js"
    "tests/unit/StatusIndicator.test.js"
    "tests/unit/ThemeEngine.test.js"
    "tests/unit/arena-shrink-integration.test.js"
    "tests/unit/audio.test.js"
    "tests/unit/ErrorRecovery.test.js"
    "tests/unit/ErrorRecoveryStrategies.test.js"
)

LOGGER_MOCK='const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('\''@/utils/Logger.js'\'', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger)
}));

'

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Check if file already has logger mock
        if grep -q "jest.mock.*Logger" "$file"; then
            echo "  Already has logger mock, skipping mock addition"
        else
            # Get first line with require
            first_require_line=$(grep -n "require(" "$file" | head -1 | cut -d: -f1)
            
            if [ -n "$first_require_line" ]; then
                # Insert logger mock before first require
                sed -i "${first_require_line}i\\$LOGGER_MOCK" "$file"
                echo "  Added logger mock"
            fi
        fi
        
        # Fix console spies
        sed -i 's/const consoleSpy = jest\.spyOn(console, '\''log'\'')\.mockImplementation();//g' "$file"
        sed -i 's/const consoleSpy = jest\.spyOn(console, '\''warn'\'')\.mockImplementation();//g' "$file"
        sed -i 's/const consoleSpy = jest\.spyOn(console, '\''error'\'')\.mockImplementation();//g' "$file"
        sed -i 's/consoleSpy\.mockRestore();//g' "$file"
        
        echo "  Fixed console spies"
    fi
done

echo "Done!"
