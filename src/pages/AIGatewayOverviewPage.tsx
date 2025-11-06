/**
 * AI Gateway Overview Page
 * Landing view for the AI Gateway section
 */

import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, PlugZap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AIGatewayOverviewPage() {
  return (
    <PageLayout>
      <PageHeader
        title="AI Gateway"
        description="Route traffic across providers, manage credentials, and explore the model catalog in one unified workspace."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Configure providers and issue API keys to begin sending requests through the AI Gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link to="/ai-gateway/providers">
                Manage providers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://docs.leger.run/ai-gateway" target="_blank" rel="noopener noreferrer">
                Read the docs
                <BookOpen className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore models</CardTitle>
            <CardDescription>
              Compare pricing, context windows, and capabilities for every provider-supported model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/ai-gateway/models">
                Browse models
                <PlugZap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
