import axios from 'axios';

const servicesApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/services`,
  withCredentials: true
});

// Attach service_token or admin token
servicesApi.interceptors.request.use(
  (config) => {
    if (config.headers.Authorization) {
      return config;
    }

    const serviceToken = localStorage.getItem('service_token');
    const adminToken = localStorage.getItem('token');

    // Context detection:
    // If request URL has '/admin' OR current window location is an admin path, prioritize platform admin token
    const isAdminContext =
      (config.url && config.url.includes('/admin')) ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

    const primaryToken = isAdminContext
      ? (adminToken || serviceToken)
      : (serviceToken || adminToken);

    if (primaryToken) {
      // Proactive 24-hour session expiration check
      try {
        const parts = primaryToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.exp && payload.exp * 1000 <= Date.now()) {
            if (primaryToken === serviceToken) {
              localStorage.removeItem('service_token');
              localStorage.removeItem('service_user');
              window.dispatchEvent(new Event('service_auth_change'));
            }
            return config;
          }
        }
      } catch {
        // Fall through
      }
      config.headers.Authorization = `Bearer ${primaryToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Graceful response interceptor
servicesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isServiceReq =
      !error.config?.url?.includes('/admin') &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/admin');

    // If blocked or 401 on service user
    if (error.response?.status === 401 && isServiceReq && localStorage.getItem('service_token')) {
      // Clear expired service user session
      localStorage.removeItem('service_token');
      localStorage.removeItem('service_user');
      window.dispatchEvent(new Event('service_auth_change'));
    }
    return Promise.reject(error);
  }
);

export default servicesApi;
