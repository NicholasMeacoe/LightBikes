# Type Checking

## Overview

This project uses TypeScript's type checker to validate JavaScript code with JSDoc annotations. This provides type safety without converting to TypeScript.

## Running Type Checks

```bash
# Run type checking once
npm run type-check

# Run type checking in watch mode (continuous)
npm run type-check:watch
```

## Configuration

- **tsconfig.json**: TypeScript configuration for JavaScript type checking
- **src/types/globals.d.ts**: Global type declarations for THREE.js and custom window properties

## Type Checking Features

- ✅ Validates JSDoc type annotations
- ✅ Checks function signatures and parameters
- ✅ Detects potential type mismatches
- ✅ Works with existing JavaScript code (no conversion needed)

## Current Status

The type checker is configured with relaxed settings suitable for JavaScript:
- `strict: false` - Basic type checking only
- `noImplicitAny: false` - Allows implicit any types
- `checkJs: true` - Enables checking for .js files

## Addressing Type Errors

When the type checker finds issues:

1. **Add JSDoc annotations**: Document parameter and return types
   ```javascript
   /**
    * @param {number} x - X coordinate
    * @param {string} name - Entity name
    * @returns {boolean} Success status
    */
   function example(x, name) {
       return true;
   }
   ```

2. **Declare global types**: Add to `src/types/globals.d.ts`
   ```typescript
   declare const THREE: any;
   ```

3. **Use type assertions**: For complex cases
   ```javascript
   /** @type {HTMLInputElement} */
   const input = document.querySelector('#myInput');
   ```

## Integration with CI/CD

You can add type checking to your continuous integration:

```yaml
# Example for GitHub Actions
- name: Type Check
  run: npm run type-check
```

## Next Steps

1. Gradually add more JSDoc annotations to reduce type errors
2. Consider stricter type checking options as coverage improves
3. Add type checking to pre-commit hooks
