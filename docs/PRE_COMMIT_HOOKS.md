# Pre-Commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically check code quality before commits.

## What Runs on Commit

When you run `git commit`, the following checks run automatically on staged files:

1. **ESLint** - Lints JavaScript files and auto-fixes issues
2. **Prettier** - Formats code to maintain consistent style

## Configuration

### Husky
- Hook location: `.husky/pre-commit`
- Initialized via: `npm run prepare` (runs automatically after `npm install`)

### Lint-Staged
- Configuration: `package.json` → `lint-staged` section
- Runs only on staged files (fast!)

```json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## How It Works

1. You stage files: `git add src/some-file.js`
2. You commit: `git commit -m "Fix bug"`
3. Pre-commit hook runs:
   - ESLint checks and fixes the staged file
   - Prettier formats the staged file
   - If fixes are made, they're automatically added to the commit
   - If errors can't be auto-fixed, commit is blocked

## Bypassing Hooks (Not Recommended)

In rare cases where you need to bypass hooks:

```bash
git commit --no-verify -m "Emergency fix"
```

**Warning:** Only use this for emergencies. Bypassing hooks can introduce code quality issues.

## Troubleshooting

### Hook Not Running

If the hook doesn't run:

```bash
# Reinstall hooks
npm run prepare

# Check hook is executable
chmod +x .husky/pre-commit
```

### ESLint Errors

If ESLint blocks your commit:

```bash
# Run ESLint manually to see errors
npm run lint

# Auto-fix what's possible
npm run lint:fix

# Check remaining issues
npm run lint
```

### Prettier Errors

If Prettier blocks your commit:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

## Benefits

✅ **Consistent Code Style** - All code follows the same formatting  
✅ **Catch Errors Early** - Find issues before they reach CI/CD  
✅ **Automatic Fixes** - Many issues are fixed automatically  
✅ **Fast** - Only checks staged files, not entire codebase  
✅ **Prevent Broken Builds** - Catch linting errors before push

## Scripts

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Maintenance

### Updating Hooks

To update hook behavior, edit:
- `.husky/pre-commit` - Change what runs
- `package.json` → `lint-staged` - Change which tools run on which files

### Adding New Checks

To add new checks (e.g., type checking):

```json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.ts": [
      "tsc --noEmit",
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Related Documentation

- [ESLint Configuration](../eslint.config.js)
- [Prettier Configuration](../.prettierrc)
- [Contributing Guidelines](../CONTRIBUTING.md) (when created)
