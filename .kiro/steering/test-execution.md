# Test Execution Guidelines

## Terminal Output Redirection

When running any Node.js commands (npm, npx, jest, etc.), always redirect output to capture everything properly:

### Standard Pattern
```bash
# For any node command, redirect both stdout and stderr to a temp file
npm test > terminal_output.txt 2>&1
npx jest sometest.js > terminal_output.txt 2>&1
npm run build > terminal_output.txt 2>&1
```

### File Handling
- **Always use `terminal_output.txt`** as the temporary output file name
- **Always overwrite** the file - never append
- **Always capture both streams** using `2>&1` to redirect stderr to stdout
- **Always output to the terminal as well** using `| tee {temporary output file}` to redirect stderr to stdout
- **Always read the file** after command execution to see results

### Complete Workflow
1. Run command with redirection: `command > terminal_output.txt 2>&1`
2. Read the output file: `cat terminal_output.txt` or use readFile tool
3. Analyze results and proceed accordingly

### Examples
```bash
# Running all tests
npm test 2>&1 | tee terminal_output.txt

# Running specific test file
npx jest game.test.js 2>&1 | tee terminal_output.txt

# Running with coverage
npm run test -- --coverage 2>&1 | tee terminal_output.txt 

# Building the project
npm run build 2>&1 | tee terminal_output.txt 
```

## Why This Pattern
- Captures all output including errors and warnings
- Prevents terminal display issues in the IDE environment
- Provides clean, readable output for analysis
- Ensures consistent behavior across different commands
- Allows for proper error handling and debugging

## File Cleanup
The `terminal_output.txt` file will be automatically overwritten on each command execution, so no manual cleanup is needed.