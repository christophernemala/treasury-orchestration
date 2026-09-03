export interface Repository<T extends { id: string }> {
  list(entityIds: string[]): T[];
  get(id: string, entityIds: string[]): T | undefined;
  insert(record: T): T;
  update(id: string, updater: (record: T) => T): T | undefined;
}

