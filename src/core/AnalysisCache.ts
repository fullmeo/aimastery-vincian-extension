import * as crypto from 'crypto';
import { CodeMetrics } from '../services/RealCodeAnalyzer';

interface CacheEntry {
  metrics: CodeMetrics;
  timestamp: number;
  contentHash: string;
}

export class AnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly MAX_CACHE_SIZE = 100; // LRU cache limit
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a hash of file content for cache key
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached analysis for a file
   * @param filePath - Absolute path to the file
   * @param content - Current file content
   * @returns Cached metrics if valid, null otherwise
   */
  get(filePath: string, content: string): CodeMetrics | null {
    const entry = this.cache.get(filePath);

    if (!entry) {
      return null;
    }

    // Check if content changed (hash mismatch)
    const currentHash = this.hashContent(content);
    if (entry.contentHash !== currentHash) {
      this.cache.delete(filePath);
      return null;
    }

    // Check if cache expired (TTL)
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(filePath);
      return null;
    }

    // Cache hit!
    return entry.metrics;
  }

  /**
   * Store analysis results in cache
   * @param filePath - Absolute path to the file
   * @param content - File content
   * @param metrics - Analysis results
   */
  set(filePath: string, content: string, metrics: CodeMetrics): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      metrics,
      timestamp: Date.now(),
      contentHash: this.hashContent(content)
    };

    this.cache.set(filePath, entry);
  }

  /**
   * Invalidate cache for a specific file
   * @param filePath - Absolute path to the file
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // TODO: Track hits/misses for actual hit rate
    };
  }

  /**
   * Evict the oldest cache entry (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
