import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface ResourceSummaryProps {
  config: DeploymentConfig;
}

export function ResourceSummary({ config }: ResourceSummaryProps) {
  const getValidationStatus = () => {
    const issues = [];
    const warnings = [];
    const info = [];

    // Required fields
    if (!config.appName) issues.push('Application name is required');
    if (!config.image) issues.push('Container image is required');

    // Best practices
    if (!config.resources.requests.cpu && !config.resources.requests.memory) {
      warnings.push('No resource requests specified - consider adding for better scheduling');
    }
    if (!config.resources.limits.cpu && !config.resources.limits.memory) {
      warnings.push('No resource limits specified - consider adding to prevent resource exhaustion');
    }
    if (config.replicas === 1) {
      warnings.push('Single replica deployment - consider multiple replicas for high availability');
    }

    // Information
    info.push(`Will create ${config.replicas} pod${config.replicas > 1 ? 's' : ''}`);
    info.push(`Service will expose port ${config.port} (${config.serviceType})`);
    if (config.namespace !== 'default') {
      info.push(`Will be deployed to namespace: ${config.namespace}`);
    }

    return { issues, warnings, info };
  };

  const { issues, warnings, info } = getValidationStatus();

  const StatusItem = ({ 
    icon: Icon, 
    items, 
    title, 
    colorClass 
  }: { 
    icon: any; 
    items: string[]; 
    title: string; 
    colorClass: string; 
  }) => {
    if (items.length === 0) return null;

    return (
      <div className={`rounded-lg p-4 ${colorClass}`}>
        <div className="flex items-center mb-2">
          <Icon className="w-5 h-5 mr-2" />
          <h4 className="font-medium">{title}</h4>
        </div>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-sm flex items-start">
              <span className="w-1.5 h-1.5 rounded-full mt-2 mr-2 flex-shrink-0 bg-current opacity-60"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Resource Summary</h3>
      
      <div className="space-y-4">
        <StatusItem
          icon={AlertCircle}
          items={issues}
          title="Issues"
          colorClass="bg-red-50 text-red-800 border border-red-200"
        />
        
        <StatusItem
          icon={AlertCircle}
          items={warnings}
          title="Recommendations"
          colorClass="bg-yellow-50 text-yellow-800 border border-yellow-200"
        />
        
        <StatusItem
          icon={Info}
          items={info}
          title="Deployment Info"
          colorClass="bg-blue-50 text-blue-800 border border-blue-200"
        />

        {issues.length === 0 && (
          <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Configuration Valid</span>
            </div>
            <p className="text-sm mt-1">Your deployment configuration is ready to generate YAML.</p>
          </div>
        )}
      </div>

      {/* Resource Breakdown */}
      {config.appName && config.image && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Resources to be Created</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Deployment:</span>
              <span className="font-medium">{config.appName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{config.appName}-service</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pods:</span>
              <span className="font-medium">{config.replicas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Namespace:</span>
              <span className="font-medium">{config.namespace}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}