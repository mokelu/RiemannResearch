// UI prefs only — notebooks, documents, artifacts belong to SurrealDB

import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { StorageAdapter } from "../shared/storage/storage.types";

const storage = createStorage({
  driver: fsDriver({ base: ".riemann", noClear: true }),
});

export const nodeStorage: StorageAdapter = {
  getItem: (key) => storage.getItem(key) as any,
  setItem: (key, value) => storage.setItem(key, value as any),
  removeItem: (key) => storage.removeItem(key),
  hasItem: (key) => storage.hasItem(key),
  getKeys: () => storage.getKeys(),
  getItems: (keys) => storage.getItems(keys) as any,
  setItems: (entries) => storage.setItems(entries as any),
  clear: () => storage.clear(),
};
