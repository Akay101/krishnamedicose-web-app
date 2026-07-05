import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // Important for sending/receiving cookies
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
  (config) => {
    // If authorization header is already set, do not overwrite it
    if (config.headers.Authorization) {
      return config;
    }

    // Auto-attach bundle token for secure medicine-bundle data requests only
    if (config.url?.includes('/medicine-bundle/data')) {
      const bundleToken = localStorage.getItem('bundle_token');
      if (bundleToken) {
        config.headers.Authorization = `Bearer ${bundleToken}`;
      }
      return config;
    }

    // Fallback to admin/default token
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

    // If error is 401, we haven't retried yet, and the request is not for the medicine bundle
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/medicine-bundle')) {
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
    if (error.response?.status === 403 && !originalRequest.url?.includes('/medicine-bundle')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export default api;
