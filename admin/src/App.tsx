import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './components/DashboardLayout';

// Pages placeholders to import
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { PagesManager } from './pages/PagesManager';
import { ContentSection } from './pages/ContentSection';
import { Facilities } from './pages/Facilities';
import { Library } from './pages/Library';
import { Events } from './pages/Events';
import { Notices } from './pages/Notices';
import { Donors } from './pages/Donors';
import { Committees } from './pages/Committees';
import { SliderManager } from './pages/SliderManager';
import { GalleryManager } from './pages/GalleryManager';
import { AdminUsers } from './pages/AdminUsers';
import { MediaLibrary } from './pages/MediaLibrary';
import { Inbox } from './pages/Inbox';
import { Settings } from './pages/Settings';
import { SEO } from './pages/SEO';
import { ChangePassword } from './pages/ChangePassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Protected Route Guard Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected CMS Admin Routes */}
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/pages" element={<ProtectedRoute><PagesManager /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute><ContentSection /></ProtectedRoute>} />
            <Route path="/facilities" element={<ProtectedRoute><Facilities /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
            <Route path="/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
            <Route path="/committees" element={<ProtectedRoute><Committees /></ProtectedRoute>} />
            <Route path="/sliders" element={<ProtectedRoute><SliderManager /></ProtectedRoute>} />
            <Route path="/gallery" element={<ProtectedRoute><GalleryManager /></ProtectedRoute>} />
            <Route path="/media" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/admins" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/seo" element={<ProtectedRoute><SEO /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

            {/* Fallback to Overview */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
