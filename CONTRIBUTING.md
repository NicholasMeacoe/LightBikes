# Contributing to LightBikes

Thank you for your interest in contributing to LightBikes! This document provides guidelines and instructions for contributing.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/LightBikes.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Commit your changes (pre-commit hooks will run automatically)
8. Push and create a Pull Request

## Development Setup

### Prerequisites
- Node.js v18+ or v20+
- npm or yarn
- Git

### Installation
```bash
npm install
```

### Running the Project
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test

# Run multiplayer server
npm run server
```

## Code Quality

### Pre-Commit Hooks
This project uses Husky and lint-staged. On every commit:
- ESLint automatically checks and fixes code
- Prettier formats code
- Commits are blocked if unfixable errors exist

### Manual Checks
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Testing

### Running Tests
```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/unit/game.test.js
```

### Writing Tests
- Place tests in `tests/unit/` or `tests/integration/`
- Name test files: `ComponentName.test.js`
- Maintain 100% test pass rate
- Aim for >80% code coverage

### Test Structure
```javascript
describe('ComponentName', () => {
    let component;
    
    beforeEach(() => {
        component = new ComponentName();
    });
    
    describe('methodName', () => {
        it('should handle specific case', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = component.methodName(input);
            
            // Assert
            expect(result).toBe('expected');
        });
    });
});
```

## Coding Standards

### JavaScript Style
- Use ES6+ features
- CommonJS modules (`require`/`module.exports`)
- Semicolons required
- 4-space indentation
- Single quotes for strings
- Descriptive variable names

### Naming Conventions
- **Classes:** PascalCase (`GameEngine`, `AudioManager`)
- **Functions:** camelCase (`calculateScore`, `handleCollision`)
- **Constants:** UPPER_CASE (`MAX_SPEED`, `DEFAULT_COLOR`)
- **Files:** PascalCase for classes (`GameEngine.js`), camelCase for utilities (`controls.js`)

### Code Organization
```javascript
// 1. Imports
const { Game } = require('./core/game.js');

// 2. Constants
const MAX_SPEED = 10;

// 3. Class definition
class MyComponent {
    constructor() {
        // ...
    }
    
    // Public methods first
    publicMethod() {
        // ...
    }
    
    // Private methods last (prefixed with _)
    _privateMethod() {
        // ...
    }
}

// 4. Exports
module.exports = { MyComponent };
```

## Pull Request Process

### Before Submitting
1. ✅ All tests pass (`npm test`)
2. ✅ Code is linted (`npm run lint`)
3. ✅ Code is formatted (`npm run format`)
4. ✅ No console errors in browser
5. ✅ Game runs without issues (`npm run dev`)

### PR Guidelines
- **Title:** Clear, descriptive (e.g., "Add power-up system", "Fix collision detection bug")
- **Description:** Explain what and why
- **Link Issues:** Reference related issues (#123)
- **Small PRs:** Keep changes focused and reviewable
- **Tests:** Include tests for new features
- **Documentation:** Update docs if needed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manually tested in browser

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
```

## Project Structure

```
LightBikes/
├── src/                    # Client-side source
│   ├── core/              # Game logic
│   ├── rendering/         # Graphics
│   ├── audio/             # Audio system
│   ├── ui/                # User interface
│   ├── systems/           # Game systems
│   ├── utils/             # Utilities
│   └── main.js            # Entry point
├── server/                # Multiplayer server
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── docs/                  # Documentation
└── public/                # Static assets
```

## Common Tasks

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement feature in appropriate directory
3. Add tests in `tests/unit/`
4. Update documentation
5. Test thoroughly
6. Submit PR

### Fixing a Bug
1. Create bug fix branch: `git checkout -b fix/bug-description`
2. Write failing test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Submit PR

### Adding a New Game Mode
1. Create mode in `src/systems/GameModes.js`
2. Add mode logic in `src/main.js` or separate module
3. Add UI controls
4. Add tests
5. Update documentation

## Reporting Issues

### Bug Reports
Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors (if any)
- Screenshots (if applicable)

### Feature Requests
Include:
- Clear description of feature
- Use case / motivation
- Proposed implementation (optional)
- Mockups (optional)

## Code Review

### As a Reviewer
- Be constructive and respectful
- Focus on code, not person
- Explain reasoning
- Suggest improvements
- Approve when ready

### As an Author
- Respond to feedback
- Make requested changes
- Ask questions if unclear
- Be patient and respectful

## Getting Help

- **Documentation:** Check `docs/` folder
- **Issues:** Search existing issues
- **Questions:** Open a discussion issue
- **Chat:** Discord (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Recognition

Contributors are recognized in:
- Git commit history
- Release notes
- README acknowledgments

Thank you for contributing to LightBikes! 🚀
