import { axiosInstance } from './axios-instance';

import { buildFormData } from './buildFormData';
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
}: IMakeRequest) {
  // configure body
  body = isFormData ? buildFormData(body as Record<string, any>) : body;

  // configure request header

  console.log({ isFormData });
  if (!isFormData) {
    headers['Content-Type'] = ContentType.APPLICATION_JSON;
  }

  try {
    const axios = axiosInstance({ baseURL, headers, timeout });

    //   send request
    const resp = await axios({
      url: path,
      method,
      data: body,
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
    const errorData = error.response.data;
    return errorTransformer({
      statusCode: error.status,
      message: error.message,
      code: error.status || error.statusCode,
      ...errorData,
    });
  }
}
