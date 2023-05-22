import type { IRequestError, IRequestSuccess, IServerRequestError, IServerRequestSuccess } from './request.interface';

//
export const errorTransformer = (data: IServerRequestError & { statusCode: number }): IRequestError => {
  return {
    message: data.message,
    statusCode: data.statusCode,
    timeStamp: new Date(),
    status: false,
    data: data.data,
  };
};

//
export const successTransformer = <T>(data: IServerRequestSuccess & { statusCode: number }): IRequestSuccess<T> => {
  return {
    message: data.message ?? 'Request successful',
    statusCode: data.statusCode,
    timeStamp: new Date(),
    status: true,
    data: data.data,
  };
};
