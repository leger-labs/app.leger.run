/**
 * App Component
 * Main router configuration with protected routes and error boundary
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { AuthErrorPage } from '@/pages/AuthErrorPage';
import { TestAuthPage } from '@/pages/TestAuthPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { AIGatewayPage } from '@/pages/AIGatewayPage';
import { ModelDetailPage } from '@/pages/ModelDetailPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { ReleasesPage } from '@/pages/ReleasesPage';
import { ReleaseFormPage } from '@/pages/ReleaseFormPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { isSessionValid } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * Error Boundary Component
 * Catches render errors and displays fallback UI
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                The application encountered an unexpected error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="font-mono text-xs mt-2">
                  {this.state.error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Protected Route Wrapper
 * Redirects to auth page if no valid session exists
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isSessionValid()) {
    return <Navigate to="/auth?error=session_expired" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="leger-theme">
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes: Authentication */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth-error" element={<AuthErrorPage />} />
            <Route path="/auth/test" element={<TestAuthPage />} />
            <Route path="/api/test/auth/login" element={<TestAuthPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to AI Gateway */}
              <Route index element={<Navigate to="/ai-gateway" replace />} />

              {/* Integrations (replaces API Keys) */}
              <Route path="integrations" element={<IntegrationsPage />} />
              {/* Keep old API Keys route for backwards compatibility */}
              <Route path="api-keys" element={<Navigate to="/integrations" replace />} />

              {/* AI Gateway */}
              <Route path="ai-gateway" element={<AIGatewayPage />} />
              <Route path="models/:modelId" element={<ModelDetailPage />} />

              {/* Releases */}
              <Route path="releases" element={<ReleasesPage />} />
              <Route path="releases/new" element={<ReleaseFormPage />} />
              <Route path="releases/:id" element={<ReleaseFormPage />} />

              {/* Marketplace */}
              <Route path="marketplace" element={<MarketplacePage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
