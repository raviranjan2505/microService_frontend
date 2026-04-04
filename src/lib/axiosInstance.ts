import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getOrCreateCookieId } from "@/lib/cookieId";
import { API_BASE_URL } from "@/utils/api";

const REFRESH_ENDPOINT = "/v1/auth/refresh-token";
const AUTH_ROUTE_SEGMENT = "/v1/auth/";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function setHeader(config: RetryableRequest | InternalAxiosRequestConfig, key: string, value: string) {
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);
  headers.set(key, value);
  config.headers = headers;
}

function isAuthRequest(url?: string) {
  return typeof url === "string" && url.includes(AUTH_ROUTE_SEGMENT);
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshingPromise: Promise<boolean> | null = null;

async function refreshSessionWithLock() {
  if (!refreshingPromise) {
    refreshingPromise = axiosInstance
      .post(
        REFRESH_ENDPOINT,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((response) => !!response.data?.success)
      .catch(() => false);
  }

  const refreshed = await refreshingPromise;
  refreshingPromise = null;
  return refreshed;
}

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const cookieId = getOrCreateCookieId();
  if (cookieId) {
    setHeader(config, "x-cookie-id", cookieId);
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as RetryableRequest;

    const shouldRefresh =
      (status === 401 || status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url);

    if (shouldRefresh) {
      originalRequest._retry = true;

      const refreshed = await refreshSessionWithLock();
      if (refreshed) {
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
