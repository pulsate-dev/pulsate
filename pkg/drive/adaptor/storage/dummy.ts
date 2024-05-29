import { writeFile } from 'node:fs/promises';

import type { Storage } from '../../model/storage.js';

export class LocalStorage implements Storage {
  async upload(name: string, file: Uint8Array) {
    await writeFile(name, file);
  }
}
