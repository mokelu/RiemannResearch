export type StorageValue = string | number | boolean | object;

export interface StorageAdapter {
  getItem<T extends StorageValue>(key: string): Promise<T | null>;
  setItem<T extends StorageValue>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  hasItem(key: string): Promise<boolean>;
  getKeys(): Promise<string[]>;
  getItems(keys: string[]): Promise<(StorageValue | null)[]>;
  setItems(entries: [string, StorageValue][]): Promise<void>;
  clear(): Promise<void>;
  /** Subscribe to key changes. Returns unsubscribe function. */
  watch?(callback: (key: string) => void): () => void;
}

export interface PrefixedStorageAdapter extends StorageAdapter {
  readonly prefix: string;
}

export function prefixed(adapter: StorageAdapter, prefix: string): PrefixedStorageAdapter {
  const keyOf = (key: string) => `${prefix}:${key}`;
  return {
    prefix,
    getItem: (key) => adapter.getItem(keyOf(key)),
    setItem: (key, value) => adapter.setItem(keyOf(key), value),
    removeItem: (key) => adapter.removeItem(keyOf(key)),
    hasItem: (key) => adapter.hasItem(keyOf(key)),
    getKeys: async () => {
      const keys = await adapter.getKeys();
      return keys.filter((k) => k.startsWith(`${prefix}:`)).map((k) => k.slice(prefix.length + 1));
    },
    getItems: (keys) => adapter.getItems(keys.map(keyOf)),
    setItems: (entries) => adapter.setItems(entries.map(([k, v]) => [keyOf(k), v])),
    clear: () => adapter.clear(),
    watch: adapter.watch
      ? (cb) => adapter.watch!((key) => {
          if (key.startsWith(`${prefix}:`)) {
            cb(key.slice(prefix.length + 1));
          }
        })
      : undefined,
  };
}
