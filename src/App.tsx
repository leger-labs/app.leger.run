/**
 * App Component
 * Main router configuration with protected routes
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { ReleasesPage } from '@/pages/ReleasesPage';
import { ReleaseFormPage } from '@/pages/ReleaseFormPage';
import { SettingsPage } from '@/pages/SettingsPage';

/**
 * Protected Route Wrapper
 * Redirects to auth page if no JWT token present
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('jwt');

  if (!isAuthenticated) {
    return <Navigate to="/auth?token=expired" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="leger-theme">
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public route: Authentication */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect to API Keys */}
            <Route index element={<Navigate to="/api-keys" replace />} />

            {/* API Keys (Default page) */}
            <Route path="api-keys" element={<ApiKeysPage />} />

            {/* Releases */}
            <Route path="releases" element={<ReleasesPage />} />
            <Route path="releases/new" element={<ReleaseFormPage />} />
            <Route path="releases/:id" element={<ReleaseFormPage />} />

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
