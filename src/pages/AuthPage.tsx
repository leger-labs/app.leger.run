/**
 * Auth Page
 * JWT validation landing page
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Copy, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { setSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('leger auth login');
      setCopied(true);
      toast.success('Command copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy command');
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No authentication token provided');
        return;
      }

      try {
        const response = await apiClient.validateAuth(token);

        // Store JWT and user data atomically
        setSession(response.token, response.user);

        // Navigate to default page
        navigate('/api-keys');
      } catch (error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed. Please try again.');
      }
    };

    validateToken();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <img
            src="/brand/assets/logotype/light/leger-logo-light.svg"
            alt="Leger"
            className="h-16 mx-auto mb-8 dark:hidden"
          />
          <img
            src="/brand/assets/logotype/dark/leger-logo-dark.svg"
            alt="Leger"
            className="h-16 mx-auto mb-8 hidden dark:block"
          />

          <h1 className="text-2xl font-bold text-foreground mb-4">
            Leger Auth
          </h1>
          <p className="text-muted-foreground">{error}</p>

          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="text-sm text-muted-foreground mb-3">
              To authenticate, run this command in your terminal:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-background rounded text-xs font-mono">
                leger auth login
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <img
          src="/brand/assets/logotype/light/leger-logo-light.svg"
          alt="Leger"
          className="h-16 mx-auto mb-8 dark:hidden"
        />
        <img
          src="/brand/assets/logotype/dark/leger-logo-dark.svg"
          alt="Leger"
          className="h-16 mx-auto mb-8 hidden dark:block"
        />

        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Validating authentication...</p>
      </div>
    </div>
  );
}
