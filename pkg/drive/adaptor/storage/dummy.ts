import * as fs from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Storage } from '../../model/storage.js';

export class LocalStorage implements Storage {
  constructor(private readonly basePath: string = './drive') {}

  async upload(name: string, file: Uint8Array) {
    try {
      await fs.statfs(this.basePath);
    } catch (e) {
      await fs.mkdir(this.basePath, { recursive: true });
    }

    const baseName = path.basename(name);
    const savePath = path.join(this.basePath, baseName);
    await writeFile(savePath, file);
  }
}
