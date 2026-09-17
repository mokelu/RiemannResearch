// UI prefs only — notebooks, documents, artifacts belong to SurrealDB

import { createStorage } from "unstorage";
import { indexedDBDriver } from "unstorage/drivers/indexeddb";
import type { StorageAdapter } from "../shared/storage/storage.types";

const storage = createStorage({
  driver: indexedDBDriver({ dbName: "riemann" }),
});

export const browserStorage: StorageAdapter = {
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
  getKeys: () => storage.getKeys(),
  clear: () => storage.clear(),
};
