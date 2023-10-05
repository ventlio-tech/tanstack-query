import axios from 'axios';
import { axiosInstance } from './axios-instance';

import { ContentType, HttpMethod } from './request.enum';
import type { IMakeRequest } from './request.interface';
import { errorTransformer, successTransformer } from './transformer';

export async function makeRequest<TResponse>({
  body,
  method = HttpMethod.GET,
  path,
  isFormData,
  headers = {},
  baseURL,
  timeout,
  appFileConfig,
  onUploadProgress,
}: IMakeRequest) {
  // check if file is included in mobile app environment and extract all file input to avoid
  // it being formatted to object using axios formData builder
  const isApp = appFileConfig?.isApp;
  const appFiles: Record<string, string> = isApp ? getAppFiles(body, appFileConfig.fileSelectors) : {};

  // configure body
  body = (isFormData ? axios.toFormData(body as FormData) : body) as FormData;

  // configure request header1
  if (!isFormData) {
    headers['Content-Type'] = ContentType.APPLICATION_JSON;
  } else {
    if (isApp) {
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
  }

  try {
    const axiosRequest = axiosInstance({ baseURL, headers, timeout });

    //   send request
    const resp = await axiosRequest({
      url: path,
      method,
      data: body,
      onUploadProgress,
    });

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
