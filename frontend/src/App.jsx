import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Layout
import Navbar from './components/Navbar.jsx';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReportIncidentPage from './pages/ReportIncidentPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import MapPage from './pages/MapPage.jsx';
import PublicMapPage from './pages/PublicMapPage.jsx';
import AuthorityDashboard from './pages/AuthorityDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import MyReportsPage from './pages/MyReports.jsx';
import IncidentDetailsPage from './pages/IncidentDetailsPage.jsx';

function App() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        {/* Default Route - Shows Public Map Page */}
        <Route path="/" element={<PublicMapPage />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        {/* Public Incident Map - No Login Required */}
        <Route path="/incidents/map" element={<PublicMapPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Navbar />
              <ReportIncidentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <IncidentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/authority"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <AuthorityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <Navbar />
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <Navbar />
              <MyReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
