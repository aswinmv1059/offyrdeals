import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VendorPage from './pages/VendorPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';

function RouteLoader() {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!show) return null;

  return (
    <div className="route-loader">
      <div className="route-loader-bubble" aria-label="Loading">
        <img
          src={`${import.meta.env.BASE_URL}offeyr-logo-mark.svg`}
          alt="OFFEYR loading"
          className="route-loader-logo"
        />
        <div className="flex gap-2">
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <RouteLoader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor"
          element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <Layout>
                <VendorPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
