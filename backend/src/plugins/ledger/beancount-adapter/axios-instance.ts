import axios, { AxiosRequestConfig } from 'axios';

// Base URL for beancount service - will be configured via environment variable
const BEANCOUNT_SERVICE_URL = process.env.BEANCOUNT_SERVICE_URL || 'http://localhost:8000';

/**
 * Custom axios instance function for orval
 * This is the mutator function that orval will use
 */
export const beancountClient = <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  const instance = axios.create({
    baseURL: BEANCOUNT_SERVICE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
  });

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        console.error(`Beancount service error (${status}):`, data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Beancount service not reachable:', error.message);
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return instance.request<T>(config).then(({ data }) => data);
};
