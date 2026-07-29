export interface StorageUploadInput {
  key: string;
  body: Uint8Array;
  contentType?: string;
}

export interface StoredObject {
  key: string;
  uri: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly id: string;
  upload(input: StorageUploadInput): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export function normalizeStorageKey(key: string): string {
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.endsWith("/")) throw new Error("Storage key must identify a file");
  if (normalized.split("/").some((part) => part === ".." || part === ".")) {
    throw new Error("Storage key cannot contain relative path segments");
  }
  return normalized;
}
