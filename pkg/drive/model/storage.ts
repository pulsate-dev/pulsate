export interface Storage {
  upload: (name: string, file: Uint8Array) => Promise<void>;
}
