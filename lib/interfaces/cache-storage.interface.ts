export interface CacheStorage {
  set(key: string, value: string, expiresIn: number): string | void;

  get(key: string): Promise<string | null> | string | null;
}
