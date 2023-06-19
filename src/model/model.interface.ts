export interface QueryModelBuilder<T> {
  findAll: (path?: string) => T[] | undefined;
  findMany: (selector: (record: T) => boolean, path?: string) => T[];
  find: (id: number | string, path?: string) => T | undefined;
  update: (id: number | string, data: Partial<T>, path?: string) => T | undefined;
  remove: (id: number, path?: string) => boolean;
}
