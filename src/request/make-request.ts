import type { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import axios from 'axios';
import { axiosInstance } from './axios-instance';

import type { MiddlewareContext, MiddlewareFunction, MiddlewareNext } from '../types';
import { ContentType, HttpMethod } from './request.enum';
import type { IMakeRequest, IRequestError, IRequestSuccess } from './request.interface';
import { errorTransformer, successTransformer } from './transformer';

/**
 * Execute a chain of middleware functions
 */
export async function executeMiddlewareChain<T>(
  middlewares: MiddlewareFunction[],
  context: MiddlewareContext<T>,
  finalHandler: MiddlewareNext<T>
): Promise<IRequestSuccess<T> | IRequestError> {
  // Create a chain of middleware functions
  const chain = middlewares.reduceRight((next: MiddlewareNext<T>, middleware: MiddlewareFunction<T>) => {
    return (options) => {
      // Update context with new options if provided
      const updatedContext = options ? { ...context, options: { ...context.options, ...options } } : context;
      return middleware(updatedContext, next);
    };
  }, finalHandler);

  // Execute the middleware chain
  return await chain(undefined);
}

/**
 * Make an HTTP request with middleware support
 *
 * @param requestOptions - Request options
 * @param middlewares - Optional array of middleware functions
 */
export async function makeRequest<TResponse>(
  requestOptions: IMakeRequest,
  middlewares?: MiddlewareFunction[]
): Promise<IRequestSuccess<TResponse> | IRequestError> {
  const {
    body = {},
    method = HttpMethod.GET,
    path,
    isFormData,
    headers = {},
    baseURL,
    timeout,
    appFileConfig,
    onUploadProgress,
  } = requestOptions;

  // check if file is included in mobile app environment and extract all file input to avoid
  // it being formatted to object using axios formData builder
  const isApp = appFileConfig?.isApp;
  const appFiles: Record<string, string> = isApp ? getAppFiles(body, appFileConfig.fileSelectors) : {};

  // configure body
  const processedBody = (isFormData ? axios.toFormData(body as FormData) : body) as FormData;

  // configure request header
  configureRequestHeader(isFormData, headers, isApp, appFiles, processedBody);

  // Create the final handler that makes the actual request
  const finalHandler: MiddlewareNext<TResponse> = async (options) => {
    const finalRequestOptions = options
      ? {
          ...requestOptions,
          body: processedBody,
          ...options,
        }
      : {
          ...requestOptions,
          body: processedBody,
        };

    return await performRequest<TResponse>(finalRequestOptions);
  };

  // If middleware is available, execute the middleware chain
  if (middlewares && middlewares.length > 0) {
    const context: MiddlewareContext<TResponse> = {
      baseUrl: baseURL,
      path,
      body: body as Record<string, any>,
      method,
      headers,
      options: {
        baseURL,
        timeout,
        path,
        body: processedBody,
        method,
        isFormData,
        headers,
        appFileConfig,
        onUploadProgress,
      },
    };

    return await executeMiddlewareChain<TResponse>(middlewares, context, finalHandler);
  }

  // Otherwise, just make the request directly
  return await finalHandler(undefined);
}

/**
 * Perform the actual HTTP request
 */
async function performRequest<TResponse>({
  body,
  method,
  path,
  isFormData,
  headers,
  baseURL,
  timeout,
  appFileConfig,
  onUploadProgress,
}: IMakeRequest): Promise<IRequestSuccess<TResponse> | IRequestError> {
  try {
    const axiosRequest = axiosInstance({ baseURL, headers, timeout });
    const isApp = appFileConfig?.isApp;

    const axiosRequestConfig: AxiosRequestConfig<Record<string, any>> = {
      url: path,
      method,
      onUploadProgress,
    };

    // Check if body exists and is not null
    if (
      body &&
      ((typeof body === 'object' && Object.keys(body).length > 0) ||
        (isFormData && !isApp && body instanceof FormData && Array.from(body.keys()).length > 0))
    ) {
      axiosRequestConfig.data = body;
    }

    //   send request
    const resp = await axiosRequest(axiosRequestConfig);

    // get response json
    const jsonResp: any = await resp.data;

    // get response code
    const responseCode = resp.status;

    if (responseCode > 299) {
      // server returned an error
      return errorTransformer({ ...jsonResp, statusCode: responseCode });
    }

    return successTransformer<TResponse>({
      statusCode: responseCode,
      ...jsonResp,
      status: resp.status,
    });
  } catch (error: any) {
    const errorData = error?.response?.data;
    return errorTransformer({
      statusCode: error.status,
      message: error.message,
      code: error.status || error.statusCode,
      ...errorData,
    });
  }
}

const configureRequestHeader = (
  isFormData: boolean | undefined,
  headers: RawAxiosRequestHeaders,
  isApp: boolean | undefined,
  appFiles: Record<string, string>,
  body: Record<string, any>
) => {
  if (!isFormData) {
    headers['Content-Type'] = ContentType.APPLICATION_JSON;
  } else if (isApp) {
    headers['Content-Type'] = ContentType.MULTIPART_FORM_DATA;
    // add the app files
    for (const fileKey in appFiles) {
      const currentFile = appFiles[fileKey];
      if (Array.isArray(currentFile)) {
        for (const innerFile of currentFile) {
          body.append(fileKey, innerFile);
        }
      } else {
        body.append(fileKey, currentFile);
      }
    }
  } else {
    delete headers['Content-Type'];
  }
};

function getAppFiles(body: any, fileSelectors: string[] = []) {
  const files: Record<string, string> = {};

  if (body) {
    if (fileSelectors.length > 0) {
      //
      for (const fileKey of fileSelectors) {
        files[fileKey] = body[fileKey];
        delete body[fileKey];
      }
    }
  }

  return files;
}
