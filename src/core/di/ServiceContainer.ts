/**
 * Dependency Injection Container for v8.0
 * Replaces all Singleton patterns from v7.x
 *
 * Features:
 * - Singleton registration and resolution
 * - Factory registration with lazy instantiation
 * - Type-safe service resolution
 * - Clear() for testing
 *
 * @example
 * ```typescript
 * // Register singleton
 * container.registerSingleton('logger', new Logger());
 *
 * // Register factory (lazy instantiation)
 * container.registerFactory('database', () => new Database(config));
 *
 * // Resolve service
 * const logger = container.resolve<Logger>('logger');
 * ```
 */
export class ServiceContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  /**
   * Register a singleton service
   * @param key - Unique service identifier
   * @param instance - Service instance
   */
  registerSingleton<T>(key: string, instance: T): void {
    if (this.services.has(key)) {
      throw new Error(`Service "${key}" is already registered as singleton`);
    }
    if (this.factories.has(key)) {
      throw new Error(`Service "${key}" is already registered as factory`);
    }
    this.services.set(key, instance);
  }

  /**
   * Register a factory function for lazy instantiation
   * The factory will be called only once, on first resolve
   * @param key - Unique service identifier
   * @param factory - Factory function that creates the service
   */
  registerFactory<T>(key: string, factory: () => T): void {
    if (this.services.has(key)) {
      throw new Error(`Service "${key}" is already registered as singleton`);
    }
    if (this.factories.has(key)) {
      throw new Error(`Service "${key}" is already registered as factory`);
    }
    this.factories.set(key, factory);
  }

  /**
   * Resolve a service by key
   * For factories, instantiates on first call and caches the result
   * @param key - Service identifier
   * @returns The service instance
   * @throws Error if service not found
   */
  resolve<T>(key: string): T {
    // Check if already instantiated
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Check if factory exists
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();

      // Cache the instance for future resolves
      this.services.set(key, instance);
      this.factories.delete(key); // No longer need the factory

      return instance as T;
    }

    throw new Error(`Service not found: "${key}". Did you forget to register it?`);
  }

  /**
   * Check if a service is registered
   * @param key - Service identifier
   * @returns True if service is registered (as singleton or factory)
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /**
   * Check if a service has been instantiated
   * @param key - Service identifier
   * @returns True if service exists and has been instantiated
   */
  isInstantiated(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all services and factories
   * Useful for testing to reset the container
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  /**
   * Get all registered service keys
   * @returns Array of service identifiers
   */
  getRegisteredServices(): string[] {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys()),
    ];
  }

  /**
   * Unregister a service
   * @param key - Service identifier
   * @returns True if service was unregistered, false if it didn't exist
   */
  unregister(key: string): boolean {
    const hadService = this.services.delete(key);
    const hadFactory = this.factories.delete(key);
    return hadService || hadFactory;
  }
}

/**
 * Global container instance
 * Use this for application-wide service registration and resolution
 *
 * @example
 * ```typescript
 * import { container } from '@/core/di/ServiceContainer';
 *
 * // In your activation function
 * container.registerSingleton('telemetry', telemetryService);
 * container.registerFactory('analyzer', () => new VincianAnalyzer(config));
 *
 * // In your features
 * const telemetry = container.resolve<TelemetryService>('telemetry');
 * ```
 */
export const container = new ServiceContainer();
