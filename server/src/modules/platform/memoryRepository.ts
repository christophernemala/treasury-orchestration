import { createPlatformSeed } from "./seed.js";
import type { PlatformState } from "./types.js";

class PlatformMemoryRepository {
  state: PlatformState = createPlatformSeed();

  reset() {
    this.state = createPlatformSeed();
  }

  scoped<K extends keyof PlatformState>(key: K, entityIds: string[]): PlatformState[K] {
    return this.state[key].filter((record) => {
      if ("entityId" in record) return entityIds.includes(record.entityId);
      if ("legalEntityId" in record) return entityIds.includes(record.legalEntityId);
      return entityIds.includes(record.id);
    }) as PlatformState[K];
  }
}

export const platformRepository = new PlatformMemoryRepository();
