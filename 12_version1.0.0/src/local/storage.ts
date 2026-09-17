import { createStorage } from "unstorage";
import { fsDriver } from "unstorage/drivers/fs";
import type { StorageAdapter } from "../shared/storage/storage.types";

const storage = createStorage({
  driver: fsDriver({ base: "./.riemann" }),
});

export const localStorage: StorageAdapter = {
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
  getKeys: () => storage.getKeys(),
  clear: () => storage.clear(),
};
