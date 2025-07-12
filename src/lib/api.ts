import axios from 'axios';
import useAuthStore from '@/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để đính kèm token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến này để tránh việc gọi refresh token lặp lại vô hạn
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor để xử lý lỗi, đặc biệt là lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 và đây không phải là request thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang trong quá trình refresh token, đẩy request vào hàng đợi
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, setAuth } = useAuthStore.getState();
      
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const rs = await axios.post(`${apiClient.defaults.baseURL}auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = rs.data;
        // Lấy lại user state cũ để không bị mất
        const user = useAuthStore.getState().user;
        if (user) {
            setAuth({ accessToken: access, refreshToken, user });
        }
        
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access;
        originalRequest.headers['Authorization'] = 'Bearer ' + access;
        processQueue(null, access);

        return apiClient(originalRequest);
      } catch (_error) {
        processQueue(_error, null);
        logout();
        window.location.href = '/login'; // Chuyển hướng về trang login
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;