import { Server, Globe, Database, Key, Settings } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface VisualPreviewProps {
  config: DeploymentConfig;
}

export function VisualPreview({ config }: VisualPreviewProps) {
  if (!config.appName) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Configure your deployment to see the visual preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Deployment Architecture</h3>
      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        {/* Namespace */}
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            <Database className="w-4 h-4 mr-1" />
            Namespace: {config.namespace}
          </div>
        </div>

        {/* Service */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">{config.appName}-service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                {config.serviceType}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Port: {config.port} → {config.targetPort}
          </div>
        </div>

        {/* Deployment */}
        <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">{config.appName}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Deployment
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Replicas: {config.replicas}
            </div>
          </div>

          {/* Pods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Array.from({ length: Math.min(config.replicas, 6) }).map((_, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Pod {index + 1}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Image: {config.image || 'Not specified'}
                </div>
                {config.env.length > 0 && (
                  <div className="flex items-center space-x-1 mb-1">
                    <Key className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-gray-600">
                      {config.env.length} env var{config.env.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {config.volumes.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Database className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-gray-600">
                      {config.volumes.length} volume{config.volumes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {config.replicas > 6 && (
              <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <span className="text-sm text-gray-600">
                  +{config.replicas - 6} more
                </span>
              </div>
            )}
          </div>

          {/* Resource Information */}
          {(config.resources.requests.cpu || config.resources.requests.memory || 
            config.resources.limits.cpu || config.resources.limits.memory) && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Resource Limits</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                {(config.resources.requests.cpu || config.resources.requests.memory) && (
                  <div>
                    <div className="font-medium">Requests:</div>
                    {config.resources.requests.cpu && <div>CPU: {config.resources.requests.cpu}</div>}
                    {config.resources.requests.memory && <div>Memory: {config.resources.requests.memory}</div>}
                  </div>
                )}
                {(config.resources.limits.cpu || config.resources.limits.memory) && (
                  <div>
                    <div className="font-medium">Limits:</div>
                    {config.resources.limits.cpu && <div>CPU: {config.resources.limits.cpu}</div>}
                    {config.resources.limits.memory && <div>Memory: {config.resources.limits.memory}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}