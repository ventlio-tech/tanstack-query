import type { QueryClient } from '@tanstack/react-query';
import result from 'lodash.result';
import set from 'lodash.set';
import type { TanstackQueryConfig } from '../types';
import type { QueryModelBuilder } from './model.interface';

export class QueryModel<T> implements QueryModelBuilder<T> {
  constructor(
    private readonly queryKey: any[],
    private readonly queryClient: QueryClient,
    private readonly exact: boolean = true
  ) {}

  public findAll(path?: string): T[] | undefined {
    const data = this.queryClient.getQueryData(this.queryKey, { exact: this.exact });

    if (!data) {
      return [];
    }

    if (!path) {
      return Array.isArray(data) ? data : [data];
    }

    return result<T[]>(data, path, []);
  }

  public findMany(selector: (record: T) => boolean, path?: string): T[] {
    const data = this.findAll(path) ?? [];
    return data.filter(selector);
  }

  find(id: string | number, path?: string): T | undefined {
    const modelConfig = this.getModelConfig();

    if (!modelConfig?.idColumn) {
      return undefined;
    }
    const data = this.findAll(path) ?? [];

    return data.find((record) => (record as Record<string, any>)[modelConfig.idColumn] === id);
  }

  update(id: string | number, data: Partial<T>, path?: string): T | undefined {
    const oldData = this.findAll(path) ?? [];
    const modelConfig = this.getModelConfig();

    if (!modelConfig?.idColumn) {
      return undefined;
    }
    const idColumn = modelConfig.idColumn;

    let updatedRecord: T | undefined = undefined;
    const newData = oldData.map((record) => {
      let dataRecord = record as Record<string, any>;

      if (dataRecord[idColumn] === id) {
        dataRecord = { ...dataRecord, ...data };
        updatedRecord = dataRecord as T;
      }

      return dataRecord;
    });

    if (!path) {
      this.queryClient.setQueryData(this.queryKey, newData);
    } else {
      const queryData = this.queryClient.getQueryData(this.queryKey, { exact: this.exact }) ?? {};
      this.queryClient.setQueryData(this.queryKey, set(queryData, path, newData));
    }
    return updatedRecord;
  }

  delete(id: number | string, path?: string): boolean {
    const oldData = this.findAll(path) ?? [];
    const modelConfig = this.getModelConfig();

    if (!modelConfig?.idColumn) {
      return false;
    }
    const idColumn = modelConfig.idColumn;
    let updated = false;
    const newData = oldData.filter((record) => {
      const dataRecord = record as Record<string, any>;
      if (dataRecord[idColumn] === id) {
        updated = true;
        return false;
      }
      return true;
    });

    if (!path) {
      this.queryClient.setQueryData(this.queryKey, newData);
    } else {
      const queryData = this.queryClient.getQueryData(this.queryKey, { exact: this.exact }) ?? {};
      this.queryClient.setQueryData(this.queryKey, set(queryData, path, newData));
    }
    return updated;
  }

  private getModelConfig() {
    const { options } = this.queryClient.getQueryData<TanstackQueryConfig>(['config']) ?? {};
    const { modelConfig } = options ?? {};

    return modelConfig;
  }
}
