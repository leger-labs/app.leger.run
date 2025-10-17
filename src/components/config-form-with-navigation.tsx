/**
 * RJSF Config Form with Navigation
 * 
 * Form layout with sidebar navigation for category management
 * Part of Task 019: Category Navigation System
 */

import React, { useState, useMemo } from 'react';
import { ConfigFormRJSF } from '@/components/config-form-rjsf';
import { HierarchicalNavigation } from '@/components/ui/navigation/hierarchical-navigation';
import type { ConfigData } from '@/types';
import configSchema from '@/schemas/config-schema.json';

interface ConfigFormWithNavigationProps {
  data: ConfigData;
  onDataChange: (data: ConfigData) => void;
  className?: string;
}

export function ConfigFormWithNavigation({ 
  data, 
  onDataChange, 
  className 
}: ConfigFormWithNavigationProps) {
  const [activeSection, setActiveSection] = useState('app');
  
  // Build navigation structure from schema
  const navigationItems = useMemo(() => {
    if (!configSchema.properties) return [];
    
    return Object.entries(configSchema.properties).map(([key, value]: [string, any]) => ({
      id: key,
      label: value.title || key.charAt(0).toUpperCase() + key.slice(1),
      children: value.properties ? Object.keys(value.properties).map(subKey => ({
        id: `${key}.${subKey}`,
        label: value.properties[subKey].title || subKey,
      })) : undefined
    }));
  }, []);
  
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-80 border-r bg-card/50 p-6 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Navigate through different configuration sections
            </p>
          </div>
          
          <HierarchicalNavigation
            items={navigationItems}
            activeItemId={activeSection}
            onItemClick={handleSectionChange}
          />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-8">
          <ConfigFormRJSF 
            data={data}
            onDataChange={onDataChange}
            className={className}
          />
        </div>
      </main>
    </div>
  );
}