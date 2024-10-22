import type { IRequestError, IRequestSuccess, IServerRequestError, IServerRequestSuccess } from './request.interface';

//
export const errorTransformer = (data: IServerRequestError & { statusCode: number }): IRequestError => {
  return {
    timeStamp: new Date(),
    data: data.data,
    ...data,
    status: false,
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
