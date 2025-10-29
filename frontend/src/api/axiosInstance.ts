import Axios, { AxiosRequestConfig } from 'axios';

// Axios instance that will be configured at app startup
export const AXIOS_INSTANCE = Axios.create({});

// Orval mutator function
export const apiClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error promise is any here...
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
