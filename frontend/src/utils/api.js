import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // Important for sending/receiving cookies
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const resp = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });

        const { token } = resp.data;
        localStorage.setItem('token', token);

        // Update the original request with the new token and retry
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login'; // Force logout
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (like 403 Forbidden which might also mean logout)
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export default api;
