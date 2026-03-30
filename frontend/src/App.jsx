import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Forecasts from './pages/Forecasts';
import Alerts from './pages/Alerts';
import Stores from './pages/Stores';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><StoreProvider><Dashboard /></StoreProvider></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><StoreProvider><Dashboard /></StoreProvider></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><StoreProvider><Products /></StoreProvider></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><StoreProvider><Sales /></StoreProvider></ProtectedRoute>} />
      <Route path="/forecasts" element={<ProtectedRoute><StoreProvider><Forecasts /></StoreProvider></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><StoreProvider><Alerts /></StoreProvider></ProtectedRoute>} />
      <Route path="/stores" element={<ProtectedRoute><StoreProvider><Stores /></StoreProvider></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
