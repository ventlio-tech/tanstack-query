import { useCallback, useRef, useState } from 'react';
import type { IRequestError, IRequestSuccess } from '../request/request.interface';
import type { CollectionMapping } from './powersync.interface';
import { parseApiPath } from './powersync-resolver';
import { usePowerSyncStore } from './powersync-store';

export type MutationOperation = 'insert' | 'update' | 'delete';

interface PowerSyncMutationState<TResponse> {
  isLoading: boolean;
  isPending: boolean;
  error: IRequestError | null;
  data: IRequestSuccess<TResponse> | undefined;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Internal hook that handles mutations against a TanStack DB collection.
 *
 * When PowerSync mode is active, mutations (POST/PATCH/DELETE) are applied
 * directly to the collection. PowerSync's CRUD queue then handles uploading
 * these changes to the backend via the Rust connector.
 *
 * Returns the same shape as the HTTP mutation hooks (post/patch/destroy).
 */
export function usePowerSyncMutation<TResponse>({
  mapping,
  path,
  operation,
}: {
  mapping: CollectionMapping | null;
  path: string;
  operation: MutationOperation;
}) {
  const [state, setState] = useState<PowerSyncMutationState<TResponse>>({
    isLoading: false,
    isPending: false,
    error: null,
    data: undefined,
    isSuccess: false,
    isError: false,
  });

  const mountedRef = useRef(true);
  const store = usePowerSyncStore();

  const executeMutation = useCallback(
    async (data?: Record<string, unknown>): Promise<IRequestSuccess<TResponse> | undefined> => {
      if (!mapping) return undefined;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isPending: true,
        error: null,
        isSuccess: false,
        isError: false,
      }));

      try {
        const { filters } = parseApiPath(path);
        const spaceId = store.config?.getSpaceId?.() ?? null;
        const collection = mapping.collection as any;

        let resultData: unknown;

        switch (operation) {
          case 'insert': {
            const record: Record<string, unknown> = {
              ...data,
              id: data?.id ?? generateId(),
            };

            if (mapping.spaceScoped && spaceId) {
              record.space_id = spaceId;
            }

            if (collection && typeof collection.insert === 'function') {
              await collection.insert(record);
            }

            resultData = record;
            break;
          }

          case 'update': {
            const id = filters.id ?? (data as any)?.id;
            if (!id) {
              throw createMutationError('Update requires an ID');
            }

            const updateData = { ...data };
            delete updateData.id;

            if (collection && typeof collection.update === 'function') {
              await collection.update({ id, ...updateData });
            }

            resultData = { id, ...updateData };
            break;
          }

          case 'delete': {
            const id = filters.id ?? (data as any)?.id;
            if (!id) {
              throw createMutationError('Delete requires an ID');
            }

            if (collection && typeof collection.delete === 'function') {
              await collection.delete({ id });
            }

            resultData = { id };
            break;
          }
        }

        const result: IRequestSuccess<TResponse> = {
          status: true,
          statusCode: operation === 'insert' ? 201 : 200,
          message: `${operation} successful`,
          timeStamp: new Date(),
          data: resultData as TResponse,
        };

        if (mountedRef.current) {
          setState({
            isLoading: false,
            isPending: false,
            error: null,
            data: result,
            isSuccess: true,
            isError: false,
          });
        }

        return result;
      } catch (err: unknown) {
        const mutationError: IRequestError = {
          status: false,
          statusCode: 500,
          message: err instanceof Error ? err.message : 'Mutation failed',
          timeStamp: new Date(),
          data: err,
        };

        if (mountedRef.current) {
          setState({
            isLoading: false,
            isPending: false,
            error: mutationError,
            data: undefined,
            isSuccess: false,
            isError: true,
          });
        }

        throw mutationError;
      }
    },
    [mapping, path, operation, store.config]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isPending: false,
      error: null,
      data: undefined,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    mutate: executeMutation,
    mutateAsync: executeMutation,
    ...state,
    reset,
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMutationError(message: string): IRequestError {
  return {
    status: false,
    statusCode: 400,
    message,
    timeStamp: new Date(),
  };
}
