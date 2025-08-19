import React from 'react';
import { useOrgScope } from '../lib/orgScope.js';

interface BreadcrumbProps {
  wardName?: string;
}

export function Breadcrumb({ wardName }: BreadcrumbProps) {
  const { scope, isHierarchyEnabled } = useOrgScope();

  if (!isHierarchyEnabled) {
    return null;
  }

  const breadcrumbItems = [];

  if (scope.trustName) {
    breadcrumbItems.push(
      <span key="trust" className="text-gray-600">
        {scope.trustName}
      </span>
    );
  }

  if (scope.hospitalName) {
    breadcrumbItems.push(
      <span key="separator1" className="text-gray-400 mx-2">
        /
      </span>
    );
    breadcrumbItems.push(
      <span key="hospital" className="text-gray-600">
        {scope.hospitalName}
      </span>
    );
  }

  if (wardName) {
    breadcrumbItems.push(
      <span key="separator2" className="text-gray-400 mx-2">
        /
      </span>
    );
    breadcrumbItems.push(
      <span key="ward" className="text-gray-600">
        {wardName}
      </span>
    );
  }

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 px-4 py-2 bg-white border-b">
      <div className="flex items-center space-x-1 text-sm">
        {breadcrumbItems}
      </div>
    </nav>
  );
}
