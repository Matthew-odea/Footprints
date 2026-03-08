# Expo Jest Configuration - Known Issues

## Current Status

Jest configuration has been improved with:
- ✅ Proper `transformIgnorePatterns` for Expo modules
- ✅ Module name mapper configured
- ✅ Extended matchers from `@testing-library/jest-native`
- ✅ Global fetch mocked
- ✅ React Navigation mocked
- ✅ Expo modules (image-picker, file-system) mocked

## Remaining Issues

### Issue: "Import outside scope" Error

**Error:**
```
ReferenceError: You are trying to `import` a file outside of the scope of the test code.
at Runtime._execModule (node_modules/jest-runtime/build/index.js:1216:13)
```

**Root Cause:**
Expo's winter runtime (used in Expo SDK 54+) conflicts with Jest's module system when importing files that access `globalThis.process.env` (like `lib/constants.ts`).

**Workaround:**
Tests that don't directly import constants work fine. For API client tests that need constants:

1. Mock constants at module level:
```typescript
jest.mock('../../lib/constants', () => ({
  API_BASE_URL: 'https://test-api.com',
}));
```

2. Or avoid importing files that use Expo's env system

### Affected Test Files
- `src/services/__tests__/friends.test.ts` - Imports friends.ts which imports constants.ts
- `src/lib/format.test.ts` - Similar import chain issue

### Working Test Files
- Component tests that don't import API clients directly
- Tests that mock all imports properly

## Solutions to Try

### Option 1: Upgrade Expo (when available)
Wait for Expo SDK 55+ which may have better Jest support

### Option 2: Separate Constants
Split constants into:
- `constants.native.ts` - Uses Expo process.env
- `constants.test.ts` - Plain values for tests
- Configure Jest to use test version

### Option 3: Use Different Test Runner
Consider using:
- Detox for E2E tests (doesn't have this issue)
- Manual testing for API clients (they're simple)

## Current Recommendation

**Skip Jest tests for now** and focus on:
1. Manual testing with Expo Go
2. E2E tests on real devices with production APK
3. Backend integration tests (which cover API contracts)

The cost/benefit of fixing Expo's Jest issues is low since:
- API clients are simple wrappers around fetch
- Components can be tested manually
- Backend tests provide good coverage

## Future Work

When Expo improves Jest support (or we have more time), revisit:
- Upgrading jest-expo preset
- Checking Expo GitHub issues for solutions
- Using experimental Jest transformers

## References
- https://github.com/expo/expo/issues (search for "jest import scope")
- https://docs.expo.dev/guides/testing-with-jest/
- https://github.com/testing-library/react-native-testing-library/issues
