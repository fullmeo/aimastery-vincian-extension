# Core Infrastructure

This directory contains the foundational infrastructure for v8.0.

## Structure

- **di/**: Dependency Injection container and service registration
- **features/**: Base feature classes and feature registry
- **workers/**: Web Worker pool for parallel processing
- **events/**: Event bus for inter-feature communication
- **models/**: Core data models (from v7.x)
- **types/**: TypeScript type definitions (from v7.x)
- **utils/**: Utility functions (from v7.x)

## Architecture

All v8.0 features use:
1. **ServiceContainer** for dependency injection
2. **BaseFeature** for consistent feature structure
3. **EventBus** for decoupled communication

## Usage

```typescript
import { container } from './di/ServiceContainer';
import { BaseFeature } from './features/BaseFeature';

// Register service
container.registerSingleton('myService', new MyService());

// Resolve service
const service = container.resolve<MyService>('myService');
```
