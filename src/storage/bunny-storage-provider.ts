import {
  normalizeStorageKey,
  type StorageProvider,
  type StorageUploadInput,
  type StoredObject,
} from "./storage-provider.js";

export interface BunnyStorageConfig {
  storageZone: string;
  accessKey: string;
  cdnBaseUrl: string;
  storageHost?: string;
}

export class BunnyStorageProvider implements StorageProvider {
  readonly id = "bunny";
  private readonly storageHost: string;
  private readonly cdnBaseUrl: string;

  constructor(private readonly config: BunnyStorageConfig) {
    if (!config.storageZone.trim()) throw new Error("Bunny storageZone is required");
    if (!config.accessKey.trim()) throw new Error("Bunny accessKey is required");
    if (!config.cdnBaseUrl.trim()) throw new Error("Bunny cdnBaseUrl is required");
    this.storageHost = (config.storageHost ?? "https://storage.bunnycdn.com").replace(/\/+$/, "");
    this.cdnBaseUrl = config.cdnBaseUrl.replace(/\/+$/, "");
  }

  async upload(input: StorageUploadInput): Promise<StoredObject> {
    const key = normalizeStorageKey(input.key);
    const response = await fetch(this.storageUrl(key), {
      method: "PUT",
      headers: {
        AccessKey: this.config.accessKey,
        "Content-Type": input.contentType ?? "application/octet-stream",
      },
      body: input.body as BodyInit,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Bunny upload failed (${response.status}): ${details || response.statusText}`);
    }

    return { key, uri: this.publicUrl(key), sizeBytes: input.body.byteLength };
  }

  async delete(key: string): Promise<void> {
    const normalized = normalizeStorageKey(key);
    const response = await fetch(this.storageUrl(normalized), {
      method: "DELETE",
      headers: { AccessKey: this.config.accessKey },
    });

    if (!response.ok && response.status !== 404) {
      const details = await response.text().catch(() => "");
      throw new Error(`Bunny delete failed (${response.status}): ${details || response.statusText}`);
    }
  }

  publicUrl(key: string): string {
    return `${this.cdnBaseUrl}/${normalizeStorageKey(key).split("/").map(encodeURIComponent).join("/")}`;
  }

  private storageUrl(key: string): string {
    const zone = encodeURIComponent(this.config.storageZone);
    const path = normalizeStorageKey(key).split("/").map(encodeURIComponent).join("/");
    return `${this.storageHost}/${zone}/${path}`;
  }
}
