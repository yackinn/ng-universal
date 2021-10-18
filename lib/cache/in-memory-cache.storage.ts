import * as cache from 'memory-cache';
import { CacheStorage } from '../interfaces/cache-storage.interface';
import { Request } from 'express';

export class InMemoryCacheStorage implements CacheStorage {
  set(key: string, value: string, expiresIn: number) {
    cache.put(key, value, expiresIn);
  }

  get(key: string, request: Request): string {
    return cache.get(key);
  }
}
