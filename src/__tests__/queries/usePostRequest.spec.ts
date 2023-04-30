import { renderHook } from '@testing-library/react-hooks';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { usePostRequest } from '../../queries';

const mockAxios = new MockAdapter(axios);

describe('usePostRequest', () => {
  const path = '/test';
  const postData = { name: 'John Doe' };
  const response = { id: 123, name: 'John Doe' };

  beforeEach(() => {
    mockAxios.reset();
  });

  it('should return post function and mutation object', () => {
    const { result } = renderHook(() =>
      usePostRequest<{ id: number; name: string }>({ path })
    );

    expect(result.current.post).toBeInstanceOf(Function);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should make post request and return response data', async () => {
    mockAxios.onPost(path).reply(200, response);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePostRequest<{ id: number; name: string }>({ path })
    );

    const responsePromise = result.current.post(postData);

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(response);
    expect(await responsePromise).toEqual(response);
  });

  it('should make post request and return error', async () => {
    const errorMessage = 'Request failed with status code 500';
    mockAxios.onPost(path).reply(500, { message: errorMessage });

    const { result, waitForNextUpdate } = renderHook(() =>
      usePostRequest<{ id: number; name: string }>({ path })
    );

    const responsePromise = result.current.post(postData);

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe(errorMessage);

    await expect(responsePromise).rejects.toEqual({
      message: errorMessage,
    });
  });

  it('should make post request with FormData', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    mockAxios.onPost(path).reply(200, response);

    const { result } = renderHook(() =>
      usePostRequest<{ id: number; name: string }>({ path, isFormData: true })
    );

    const responsePromise = result.current.post(formData);

    expect(result.current.isLoading).toBe(true);

    await expect(responsePromise).resolves.toEqual(response);
  });
});
