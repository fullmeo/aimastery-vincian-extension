# Tests

Comprehensive test suite for v8.0.

## Structure

- **unit/**: Unit tests for individual classes/functions
- **integration/**: Integration tests for feature interactions
- **performance/**: Performance benchmarks and stress tests

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ServiceContainer.test.ts

# Watch mode
npm run test:watch
```

## Test Standards

- **Coverage Target**: 80%+ overall
- **Critical Paths**: 100% coverage
- **Performance**: < 100ms per unit test

## Writing Tests

```typescript
import { ServiceContainer } from '../../src/core/di/ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(() => {
    container.clear();
  });

  test('should register and resolve singleton', () => {
    const service = { name: 'test' };
    container.registerSingleton('test', service);

    const resolved = container.resolve('test');
    expect(resolved).toBe(service);
  });
});
```

## Test Corpus

`tests/corpus/` contains sample code files for analysis testing:
- Good code examples (score 80+)
- Bad code examples (score < 50)
- Edge cases
