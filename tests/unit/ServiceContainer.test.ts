import { ServiceContainer } from '../../src/core/di/ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(() => {
    container.clear();
  });

  describe('Singleton Registration', () => {
    test('should register and resolve singleton', () => {
      const service = { name: 'test', value: 42 };
      container.registerSingleton('test', service);

      const resolved = container.resolve('test');
      expect(resolved).toBe(service);
      expect(resolved.name).toBe('test');
      expect(resolved.value).toBe(42);
    });

    test('should return same instance on multiple resolves', () => {
      const service = { name: 'test' };
      container.registerSingleton('test', service);

      const resolved1 = container.resolve('test');
      const resolved2 = container.resolve('test');

      expect(resolved1).toBe(resolved2);
      expect(resolved1).toBe(service);
    });

    test('should throw error when registering duplicate singleton', () => {
      container.registerSingleton('test', { name: 'test1' });

      expect(() => {
        container.registerSingleton('test', { name: 'test2' });
      }).toThrow('Service "test" is already registered as singleton');
    });

    test('should throw error when registering singleton with same key as factory', () => {
      container.registerFactory('test', () => ({ name: 'test' }));

      expect(() => {
        container.registerSingleton('test', { name: 'test' });
      }).toThrow('Service "test" is already registered as factory');
    });
  });

  describe('Factory Registration', () => {
    test('should register and resolve factory', () => {
      let callCount = 0;
      container.registerFactory('test', () => {
        callCount++;
        return { name: 'test', callNumber: callCount };
      });

      const resolved = container.resolve('test');

      expect(callCount).toBe(1);
      expect(resolved.name).toBe('test');
      expect(resolved.callNumber).toBe(1);
    });

    test('should only call factory once (lazy singleton)', () => {
      let callCount = 0;
      container.registerFactory('test', () => {
        callCount++;
        return { name: 'test', callNumber: callCount };
      });

      const resolved1 = container.resolve('test');
      const resolved2 = container.resolve('test');
      const resolved3 = container.resolve('test');

      expect(callCount).toBe(1); // Factory called only once
      expect(resolved1).toBe(resolved2); // Same instance
      expect(resolved2).toBe(resolved3); // Same instance
    });

    test('should throw error when registering duplicate factory', () => {
      container.registerFactory('test', () => ({ name: 'test1' }));

      expect(() => {
        container.registerFactory('test', () => ({ name: 'test2' }));
      }).toThrow('Service "test" is already registered as factory');
    });

    test('should throw error when registering factory with same key as singleton', () => {
      container.registerSingleton('test', { name: 'test' });

      expect(() => {
        container.registerFactory('test', () => ({ name: 'test' }));
      }).toThrow('Service "test" is already registered as singleton');
    });

    test('should support complex dependencies in factory', () => {
      // Register dependencies
      container.registerSingleton('config', { apiKey: 'abc123' });
      container.registerSingleton('logger', { log: jest.fn() });

      // Register factory that uses dependencies
      container.registerFactory('apiClient', () => {
        const config = container.resolve<{ apiKey: string }>('config');
        const logger = container.resolve<{ log: jest.Mock }>('logger');
        return {
          apiKey: config.apiKey,
          logger,
          fetch: jest.fn(),
        };
      });

      const apiClient = container.resolve<any>('apiClient');

      expect(apiClient.apiKey).toBe('abc123');
      expect(apiClient.logger).toBeDefined();
    });
  });

  describe('Service Resolution', () => {
    test('should throw error for unknown service', () => {
      expect(() => container.resolve('unknown')).toThrow(
        'Service not found: "unknown". Did you forget to register it?'
      );
    });

    test('should resolve multiple different services', () => {
      container.registerSingleton('service1', { name: 'one' });
      container.registerSingleton('service2', { name: 'two' });
      container.registerFactory('service3', () => ({ name: 'three' }));

      const s1 = container.resolve('service1');
      const s2 = container.resolve('service2');
      const s3 = container.resolve('service3');

      expect(s1.name).toBe('one');
      expect(s2.name).toBe('two');
      expect(s3.name).toBe('three');
    });

    test('should support TypeScript generic type resolution', () => {
      interface ILogger {
        log(message: string): void;
      }

      const logger: ILogger = {
        log: jest.fn(),
      };

      container.registerSingleton<ILogger>('logger', logger);

      const resolved = container.resolve<ILogger>('logger');

      expect(resolved).toBe(logger);
      resolved.log('test message');
      expect(logger.log).toHaveBeenCalledWith('test message');
    });
  });

  describe('Service Management', () => {
    test('has() should return true for registered singleton', () => {
      container.registerSingleton('test', { name: 'test' });
      expect(container.has('test')).toBe(true);
    });

    test('has() should return true for registered factory', () => {
      container.registerFactory('test', () => ({ name: 'test' }));
      expect(container.has('test')).toBe(true);
    });

    test('has() should return false for unregistered service', () => {
      expect(container.has('unknown')).toBe(false);
    });

    test('isInstantiated() should return true for singleton', () => {
      container.registerSingleton('test', { name: 'test' });
      expect(container.isInstantiated('test')).toBe(true);
    });

    test('isInstantiated() should return false for unresolved factory', () => {
      container.registerFactory('test', () => ({ name: 'test' }));
      expect(container.isInstantiated('test')).toBe(false);
    });

    test('isInstantiated() should return true after factory is resolved', () => {
      container.registerFactory('test', () => ({ name: 'test' }));
      expect(container.isInstantiated('test')).toBe(false);

      container.resolve('test');
      expect(container.isInstantiated('test')).toBe(true);
    });

    test('getRegisteredServices() should return all service keys', () => {
      container.registerSingleton('service1', { name: 'one' });
      container.registerFactory('service2', () => ({ name: 'two' }));
      container.registerSingleton('service3', { name: 'three' });

      const keys = container.getRegisteredServices();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('service1');
      expect(keys).toContain('service2');
      expect(keys).toContain('service3');
    });

    test('unregister() should remove singleton', () => {
      container.registerSingleton('test', { name: 'test' });
      expect(container.has('test')).toBe(true);

      const result = container.unregister('test');

      expect(result).toBe(true);
      expect(container.has('test')).toBe(false);
      expect(() => container.resolve('test')).toThrow();
    });

    test('unregister() should remove factory', () => {
      container.registerFactory('test', () => ({ name: 'test' }));
      expect(container.has('test')).toBe(true);

      const result = container.unregister('test');

      expect(result).toBe(true);
      expect(container.has('test')).toBe(false);
      expect(() => container.resolve('test')).toThrow();
    });

    test('unregister() should return false for non-existent service', () => {
      const result = container.unregister('unknown');
      expect(result).toBe(false);
    });

    test('clear() should remove all services', () => {
      container.registerSingleton('service1', { name: 'one' });
      container.registerFactory('service2', () => ({ name: 'two' }));
      container.registerSingleton('service3', { name: 'three' });

      expect(container.getRegisteredServices()).toHaveLength(3);

      container.clear();

      expect(container.getRegisteredServices()).toHaveLength(0);
      expect(container.has('service1')).toBe(false);
      expect(container.has('service2')).toBe(false);
      expect(container.has('service3')).toBe(false);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    test('should support typical extension services', () => {
      // Mock VS Code-like services
      const telemetryService = {
        trackEvent: jest.fn(),
        trackError: jest.fn(),
      };

      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'apiUrl') return 'https://api.example.com';
          return null;
        }),
      };

      container.registerSingleton('telemetry', telemetryService);
      container.registerSingleton('config', configService);

      // Register analysis service that depends on telemetry
      container.registerFactory('analyzer', () => {
        const telemetry = container.resolve<typeof telemetryService>('telemetry');
        const config = container.resolve<typeof configService>('config');

        return {
          analyze: (code: string) => {
            telemetry.trackEvent('analysis.started');
            const apiUrl = config.get('apiUrl');
            // Simulate analysis
            return { score: 85, apiUrl };
          },
        };
      });

      const analyzer = container.resolve<any>('analyzer');
      const result = analyzer.analyze('function test() {}');

      expect(result.score).toBe(85);
      expect(result.apiUrl).toBe('https://api.example.com');
      expect(telemetryService.trackEvent).toHaveBeenCalledWith('analysis.started');
    });

    test('should support service replacement for testing', () => {
      // Production service
      container.registerSingleton('logger', {
        log: (msg: string) => console.log(msg),
      });

      let resolved1 = container.resolve<any>('logger');
      expect(resolved1.log).toBeDefined();

      // Replace with mock for testing
      container.unregister('logger');
      const mockLogger = { log: jest.fn() };
      container.registerSingleton('logger', mockLogger);

      let resolved2 = container.resolve<any>('logger');
      expect(resolved2).toBe(mockLogger);
      expect(resolved2).not.toBe(resolved1);
    });
  });
});
