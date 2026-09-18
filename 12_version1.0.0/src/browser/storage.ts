// UI prefs only — notebooks, documents, artifacts belong to SurrealDB

import { createStorage } from "unstorage";
import indexedbDriver from "unstorage/drivers/indexedb";
import type { StorageAdapter } from "../shared/storage/storage.types";

const storage = createStorage({
  driver: indexedbDriver({ dbName: "riemann" }),
});

export const browserStorage: StorageAdapter = {
  getItem: (key) => storage.getItem(key) as any,
  setItem: (key, value) => storage.setItem(key, value as any),
  removeItem: (key) => storage.removeItem(key),
  hasItem: (key) => storage.hasItem(key),
  getKeys: () => storage.getKeys(),
  getItems: (keys) => storage.getItems(keys) as any,
  setItems: (entries) => storage.setItems(entries as any),
  clear: () => storage.clear(),
};
