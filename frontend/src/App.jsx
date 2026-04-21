import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './admin/AdminLayout';
import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import ContentEditor from './admin/ContentEditor';
import LeadsManager from './admin/LeadsManager';
import UsersManager from './admin/UsersManager';
import AssetLibraryPage from './admin/AssetLibraryPage';
import OffersManager from './admin/OffersManager';

function App() {
  const getAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { token, user };
  };

  const PrivateRoute = ({ children, permission }) => {
    const { token, user } = getAuth();
    if (!token) return <Navigate to="/admin/login" />;
    
    // Super Admin check
    if (user.email === 'amanyadavu65@gmail.com') return children;
    
    // Permission check
    if (permission && !user.permissions?.[permission]) {
      return <Navigate to="/admin" />;
    }
    
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
