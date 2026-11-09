import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { ModalProvider } from './context/ModalContext';
import { AccountProvider } from './context/AccountContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { useAnalytics } from './hooks/useAnalytics';
import { Loader2 } from 'lucide-react';

// Lazy load admin pages to decouple admin source code from public bundle
const PaymentVerificationPage = lazy(() => import('./pages/PaymentVerificationPage'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Login = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const ContentEditor = lazy(() => import('./admin/ContentEditor'));
const LeadsManager = lazy(() => import('./admin/LeadsManager'));
const UsersManager = lazy(() => import('./admin/UsersManager'));
const AssetLibraryPage = lazy(() => import('./admin/AssetLibraryPage'));
const OffersManager = lazy(() => import('./admin/OffersManager'));
const MedicineDataManager = lazy(() => import('./admin/MedicineDataManager'));
const UsefulLinksPage = lazy(() => import('./pages/UsefulLinksPage'));
const LinksManager = lazy(() => import('./admin/LinksManager'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServicesManager = lazy(() => import('./admin/ServicesManager'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CatalogsManager = lazy(() => import('./admin/CatalogsManager'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-brand-600">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

const readAdminSession = () => {
  const token = localStorage.getItem('token');
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }
  return { token, user };
};

// UI-level gate only; every admin API call is authorised again on the server
const PrivateRoute = ({ children, permission }) => {
  const { token, user } = readAdminSession();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (user.role === 'admin') return children;
  if (permission === 'root') return <Navigate to="/admin" replace />;
  if (permission && !user.permissions?.[permission]) return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  useAnalytics();
  return (
    <ModalProvider>
      <SiteContentProvider>
      <AccountProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalogs" element={<Navigate to="/services?service=catalogs" replace />} />
          <Route path="/catalog" element={<Navigate to="/services?service=catalogs" replace />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/links" element={<Navigate to="/services?service=links" replace />} />
          <Route path="/medicine-data" element={<Navigate to="/services?service=medicine-data" replace />} />
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
              path="services" 
              element={
                <PrivateRoute permission="services">
                  <ServicesManager />
                </PrivateRoute>
              } 
            />
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
                <PrivateRoute permission="root">
                  <UsersManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="assets" 
              element={
                <PrivateRoute permission="website">
                  <AssetLibraryPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="offers" 
              element={
                <PrivateRoute permission="website">
                  <OffersManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="links" 
              element={
                <PrivateRoute permission="website">
                  <LinksManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="medicine-data" 
              element={
                <PrivateRoute permission="bundles">
                  <MedicineDataManager />
                </PrivateRoute>
              } 
            />
            <Route 
              path="catalogs" 
              element={
                <PrivateRoute permission="services">
                  <CatalogsManager />
                </PrivateRoute>
              } 
            />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      </AccountProvider>
      </SiteContentProvider>
    </ModalProvider>
  );
}

export default App;
