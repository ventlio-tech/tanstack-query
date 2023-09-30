export interface QueryModelBuilder<T> {
  add: (data: T, position?: QueryModelAddPosition, path?: string) => T | undefined;
  findAll: (path?: string) => T[] | T | undefined;
  findMany: (selector: (record: T) => boolean, path?: string) => T[];
  find: (id: number | string, path?: string) => T | undefined;
  update: (id: number | string, data: Partial<T>, path?: string) => T | undefined;
  remove: (id: number, path?: string) => boolean;
  get: (path?: string) => T | undefined;
  set: <DataType>(data: Partial<DataType>, path?: string) => DataType | undefined;
}

export type QueryModelAddPosition = 'start' | 'end';
