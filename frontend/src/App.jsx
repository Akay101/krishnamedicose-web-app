import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { ModalProvider } from './context/ModalContext';
import { useAnalytics } from './hooks/useAnalytics';
import MedicineDataPage from './pages/MedicineDataPage';
import PaymentVerificationPage from './pages/PaymentVerificationPage';
import { Loader2 } from 'lucide-react';

// Lazy load admin pages to decouple admin source code from public bundle
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Login = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const ContentEditor = lazy(() => import('./admin/ContentEditor'));
const LeadsManager = lazy(() => import('./admin/LeadsManager'));
const UsersManager = lazy(() => import('./admin/UsersManager'));
const AssetLibraryPage = lazy(() => import('./admin/AssetLibraryPage'));
const OffersManager = lazy(() => import('./admin/OffersManager'));
const MedicineDataManager = lazy(() => import('./admin/MedicineDataManager'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-teal-600">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );
}

function App() {
  useAnalytics();
  const getAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { token, user };
  };

  const PrivateRoute = ({ children, permission }) => {
    const { token, user } = getAuth();
    if (!token) return <Navigate to="/admin/login" />;
    
    // Super / Root Admin role check
    if (user.role === 'admin') return children;
    
    // Permission check
    if (permission && !user.permissions?.[permission]) {
      return <Navigate to="/admin" />;
    }
    
    return children;
  };

  return (
    <ModalProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/medicine-data" element={<MedicineDataPage />} />
          <Route path="/medicine-data/verify-payment" element={<PaymentVerificationPage />} />
          <Route path="/admin/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route 
              path="content" 
              element={
                <PrivateRoute permission="website">
                  <ContentEditor />
                </PrivateRoute>
              } 
            />
            <Route 
              path="leads" 
              element={
                <PrivateRoute permission="leads">
                  <LeadsManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <PrivateRoute>
                  <UsersManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="assets" 
              element={
                <PrivateRoute>
                  <AssetLibraryPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="offers" 
              element={
                <PrivateRoute>
                  <OffersManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="medicine-data" 
              element={
                <PrivateRoute>
                  <MedicineDataManager />
                </PrivateRoute>
              } 
            />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </ModalProvider>
  );
}

export default App;
