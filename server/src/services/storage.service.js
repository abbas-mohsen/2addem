import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/* Storage is deliberately behind this interface: controllers only ever see
   public URLs and opaque keys, so swapping local disk for S3 later means adding
   a driver here and flipping STORAGE_DRIVER. */

const PUBLIC_PREFIX = '/uploads';

const localDriver = {
  async init() {
    await fs.mkdir(env.uploadRoot, { recursive: true });
  },

  /* multer has already written the file to disk; we only derive the key/URL. */
  keyFor(file) {
    return path.basename(file.path);
  },

  urlFor(key) {
    return `${PUBLIC_PREFIX}/${key}`;
  },

  async remove(key) {
    try {
      await fs.unlink(path.join(env.uploadRoot, path.basename(key)));
    } catch (error) {
      if (error.code !== 'ENOENT') logger.warn(`Failed to remove upload ${key}: ${error.message}`);
    }
  },
};

const drivers = { local: localDriver };

export const storage = drivers[env.STORAGE_DRIVER];

export async function initStorage() {
  await storage.init();
}

export function toPublicUrl(file) {
  return storage.urlFor(storage.keyFor(file));
}
