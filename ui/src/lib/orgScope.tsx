import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { ORG_HIERARCHY_ENABLED } from './flags.js';

interface OrgScope {
  trustId?: string;
  hospitalId?: string;
  trustName?: string;
  hospitalName?: string;
}

interface OrgScopeContextType {
  scope: OrgScope;
  setTrust: (trustId: string, trustName: string) => void;
  setHospital: (hospitalId: string, hospitalName: string) => void;
  clearScope: () => void;
  isHierarchyEnabled: boolean;
}

const OrgScopeContext = createContext<OrgScopeContextType | undefined>(undefined);

const STORAGE_KEY = 'rota-org-scope';

export function OrgScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<OrgScope>({});
  const hasLoadedInitialData = useRef(false);

  // Load scope from localStorage on mount
  useEffect(() => {
    if (!ORG_HIERARCHY_ENABLED) {
      console.log('Org hierarchy disabled, not loading scope');
      return;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('Loading org scope from localStorage:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Parsed org scope:', parsed);
        setScope(parsed);
      }
      hasLoadedInitialData.current = true;
    } catch (error) {
      console.warn('Failed to load org scope from localStorage:', error);
      hasLoadedInitialData.current = true;
    }
  }, []);

  // Test localStorage on mount
  useEffect(() => {
    console.log('OrgScopeProvider mounted, testing localStorage...');
    try {
      localStorage.setItem('test-key', 'test-value');
      const testValue = localStorage.getItem('test-key');
      console.log('localStorage test:', testValue);
      localStorage.removeItem('test-key');
    } catch (error) {
      console.error('localStorage test failed:', error);
    }
  }, []);

  // Save scope to localStorage when it changes (but not on initial load)
  useEffect(() => {
    if (!ORG_HIERARCHY_ENABLED) {
      console.log('Org hierarchy disabled, not saving scope');
      return;
    }
    
    // Skip saving until we've loaded initial data
    if (!hasLoadedInitialData.current) {
      console.log('Skipping save - initial data not loaded yet');
      return;
    }
    
    try {
      console.log('Saving org scope to localStorage:', scope);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
    } catch (error) {
      console.warn('Failed to save org scope to localStorage:', error);
    }
  }, [scope]);

  const setTrust = (trustId: string, trustName: string) => {
    setScope(prev => ({
      ...prev,
      trustId,
      trustName,
      // Clear hospital when trust changes
      hospitalId: undefined,
      hospitalName: undefined,
    }));
  };

  const setHospital = (hospitalId: string, hospitalName: string) => {
    setScope(prev => ({
      ...prev,
      hospitalId,
      hospitalName,
    }));
  };

  const clearScope = () => {
    setScope({});
  };

  const value: OrgScopeContextType = {
    scope,
    setTrust,
    setHospital,
    clearScope,
    isHierarchyEnabled: ORG_HIERARCHY_ENABLED,
  };

  return (
    <OrgScopeContext.Provider value={value}>
      {children}
    </OrgScopeContext.Provider>
  );
}

export function useOrgScope() {
  const context = useContext(OrgScopeContext);
  if (context === undefined) {
    throw new Error('useOrgScope must be used within an OrgScopeProvider');
  }
  return context;
}
