# Auto Test Hook

This hook automatically runs tests when TypeScript files are saved.

## Trigger
- File save events for `.ts` and `.tsx` files

## Action
- Run `npm run type-check` to validate TypeScript
- Run basic linting with `npm run lint`
- Display results in terminal

## Benefits
- Immediate feedback on code changes
- Prevents broken builds from being committed
- Maintains code quality standards