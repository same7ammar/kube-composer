import React from 'react';
import { Container, Database, Globe, Settings } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface VisualPreviewProps {
  config: DeploymentConfig;
}

export function VisualPreview({ config }: VisualPreviewProps) {
  if (!config.appName || !config.image) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Container className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Configure your deployment to see the visual preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Deployment Architecture</h3>
      
      <div className="bg-gray-50 rounded-lg p-6">
        {/* Namespace */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-900">Namespace: {config.namespace}</span>
          </div>
          
          {/* Deployment */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Container className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">Deployment: {config.appName}</span>
              </div>
              <span className="text-sm text-gray-600">Replicas: {config.replicas}</span>
            </div>
            
            {/* Pods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.from({ length: Math.min(config.replicas, 6) }).map((_, i) => (
                <div key={i} className="bg-green-50 border border-green-200 rounded p-2 text-center">
                  <div className="text-xs font-medium text-green-800">Pod {i + 1}</div>
                  <div className="text-xs text-green-600 truncate">{config.image}</div>
                  <div className="text-xs text-green-600">:{config.targetPort}</div>
                </div>
              ))}
              {config.replicas > 6 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                  <div className="text-xs font-medium text-gray-600">+{config.replicas - 6} more</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Service */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">Service: {config.appName}-service</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Type: {config.serviceType}</div>
                <div className="text-sm text-gray-600">Port: {config.port} → {config.targetPort}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resource Summary */}
        {(config.resources.requests.cpu || config.resources.requests.memory || 
          config.resources.limits.cpu || config.resources.limits.memory) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <Settings className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-900">Resource Configuration</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-1">Requests</div>
                <div className="text-gray-600">
                  {config.resources.requests.cpu && <div>CPU: {config.resources.requests.cpu}</div>}
                  {config.resources.requests.memory && <div>Memory: {config.resources.requests.memory}</div>}
                  {!config.resources.requests.cpu && !config.resources.requests.memory && <div>None specified</div>}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">Limits</div>
                <div className="text-gray-600">
                  {config.resources.limits.cpu && <div>CPU: {config.resources.limits.cpu}</div>}
                  {config.resources.limits.memory && <div>Memory: {config.resources.limits.memory}</div>}
                  {!config.resources.limits.cpu && !config.resources.limits.memory && <div>None specified</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}