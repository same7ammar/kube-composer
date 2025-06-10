import React from 'react';
import type { DeploymentConfig } from '../types';

interface DeploymentFormProps {
  config: DeploymentConfig;
  onChange: (config: DeploymentConfig) => void;
}

export function DeploymentForm({ config, onChange }: DeploymentFormProps) {
  const handleChange = (field: keyof DeploymentConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const handleNestedChange = (field: keyof DeploymentConfig, subField: string, value: any) => {
    onChange({
      ...config,
      [field]: {
        ...(config[field] as any),
        [subField]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Name *
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => handleChange('appName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my-app"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Container Image *
            </label>
            <input
              type="text"
              value={config.image}
              onChange={(e) => handleChange('image', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="nginx:latest"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replicas
            </label>
            <input
              type="number"
              min="1"
              value={config.replicas}
              onChange={(e) => handleChange('replicas', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value) || 80)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Port
            </label>
            <input
              type="number"
              value={config.targetPort}
              onChange={(e) => handleChange('targetPort', parseInt(e.target.value) || 8080)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={config.serviceType}
              onChange={(e) => handleChange('serviceType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Namespace
            </label>
            <input
              type="text"
              value={config.namespace}
              onChange={(e) => handleChange('namespace', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="default"
            />
          </div>
        </div>
      </div>

      {/* Resource Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Resource Limits</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU Request
            </label>
            <input
              type="text"
              value={config.resources.requests.cpu}
              onChange={(e) => handleNestedChange('resources', 'requests', { ...config.resources.requests, cpu: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100m"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Request
            </label>
            <input
              type="text"
              value={config.resources.requests.memory}
              onChange={(e) => handleNestedChange('resources', 'requests', { ...config.resources.requests, memory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="128Mi"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU Limit
            </label>
            <input
              type="text"
              value={config.resources.limits.cpu}
              onChange={(e) => handleNestedChange('resources', 'limits', { ...config.resources.limits, cpu: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="500m"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Limit
            </label>
            <input
              type="text"
              value={config.resources.limits.memory}
              onChange={(e) => handleNestedChange('resources', 'limits', { ...config.resources.limits, memory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="256Mi"
            />
          </div>
        </div>
      </div>
    </div>
  );
}