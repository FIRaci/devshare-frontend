import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import useAuthStore from '@/store/authStore';

// Định nghĩa interface cho Promise trong hàng đợi
interface FailedQueueItem {
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}

// Tạo instance axios
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Biến để tránh gọi refresh token lặp vô hạn
let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

// Hàm xử lý hàng đợi các request bị lỗi 401
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Interceptor cho request: Đính kèm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response: Xử lý lỗi 401 và refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, setTokens } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        // Có thể chuyển hướng người dùng về trang đăng nhập ở đây nếu cần
        // window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const rs = await axios.post<{ access: string }>(
          `${apiClient.defaults.baseURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access: newAccessToken } = rs.data;
        
        // SỬA LỖI: Dùng hàm `setTokens` đã có trong store
        setTokens({ access: newAccessToken, refresh: refreshToken });

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (_error) {
        processQueue(_error as AxiosError, null);
        logout();
        // window.location.href = '/login';
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
