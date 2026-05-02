import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const logVisit = async () => {
      // Exclude admin paths from traffic count
      if (location.pathname.startsWith('/admin')) return;

      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = uuidv4();
        localStorage.setItem('visitor_id', visitorId);
      }

      try {
        await api.post('/analytics/log', {
          visitorId,
          path: location.pathname,
          referrer: document.referrer || 'direct'
        });
      } catch (err) {
        // Silent fail for analytics
        console.warn('Analytics log failed');
      }
    };

    logVisit();
  }, [location.pathname]);
};
