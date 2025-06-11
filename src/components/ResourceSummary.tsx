import { Server, Globe, Database, Key, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface ResourceSummaryProps {
  config: DeploymentConfig;
}

export function ResourceSummary({ config }: ResourceSummaryProps) {
  const getResourceCount = () => {
    let count = 0;
    if (config.appName) count += 2; // Deployment + Service
    count += config.configMaps.length;
    count += config.secrets.length;
    return count;
  };

  const getValidationStatus = () => {
    const issues = [];
    if (!config.appName) issues.push('Application name is required');
    if (!config.image) issues.push('Container image is required');
    if (config.port <= 0) issues.push('Service port must be greater than 0');
    if (config.targetPort <= 0) issues.push('Target port must be greater than 0');
    if (config.replicas <= 0) issues.push('Replicas must be greater than 0');
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const validation = getValidationStatus();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Resource Summary</h3>
      
      {/* Validation Status */}
      <div className={`p-4 rounded-lg border ${
        validation.isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {validation.isValid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-medium ${
            validation.isValid ? 'text-green-900' : 'text-red-900'
          }`}>
            {validation.isValid ? 'Configuration Valid' : 'Configuration Issues'}
          </span>
        </div>
        {!validation.isValid && (
          <ul className="text-sm text-red-700 space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Deployment</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Name: {config.appName || 'Not specified'}</div>
            <div>Image: {config.image || 'Not specified'}</div>
            <div>Replicas: {config.replicas}</div>
            <div>Namespace: {config.namespace}</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Service</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <div>Type: {config.serviceType}</div>
            <div>Port: {config.port}</div>
            <div>Target Port: {config.targetPort}</div>
            <div>Protocol: TCP</div>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      {(config.env.length > 0 || config.volumes.length > 0 || 
        config.configMaps.length > 0 || config.secrets.length > 0) && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Additional Resources</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.env.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Environment Variables</span>
                </div>
                <div className="text-sm text-orange-700">
                  {config.env.length} variable{config.env.length !== 1 ? 's' : ''} configured
                </div>
                <div className="mt-2 space-y-1">
                  {config.env.slice(0, 3).map((env, index) => (
                    <div key={index} className="text-xs text-orange-600">
                      {env.name}: {env.value ? '***' : 'Not set'}
                    </div>
                  ))}
                  {config.env.length > 3 && (
                    <div className="text-xs text-orange-600">
                      +{config.env.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {config.volumes.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Volumes</span>
                </div>
                <div className="text-sm text-purple-700">
                  {config.volumes.length} volume{config.volumes.length !== 1 ? 's' : ''} configured
                </div>
                <div className="mt-2 space-y-1">
                  {config.volumes.slice(0, 3).map((volume, index) => (
                    <div key={index} className="text-xs text-purple-600">
                      {volume.name} → {volume.mountPath} ({volume.type})
                    </div>
                  ))}
                  {config.volumes.length > 3 && (
                    <div className="text-xs text-purple-600">
                      +{config.volumes.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Limits */}
      {(config.resources.requests.cpu || config.resources.requests.memory || 
        config.resources.limits.cpu || config.resources.limits.memory) && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Resource Configuration</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(config.resources.requests.cpu || config.resources.requests.memory) && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Requests:</div>
                {config.resources.requests.cpu && (
                  <div className="text-gray-600">CPU: {config.resources.requests.cpu}</div>
                )}
                {config.resources.requests.memory && (
                  <div className="text-gray-600">Memory: {config.resources.requests.memory}</div>
                )}
              </div>
            )}
            {(config.resources.limits.cpu || config.resources.limits.memory) && (
              <div>
                <div className="font-medium text-gray-700 mb-1">Limits:</div>
                {config.resources.limits.cpu && (
                  <div className="text-gray-600">CPU: {config.resources.limits.cpu}</div>
                )}
                {config.resources.limits.memory && (
                  <div className="text-gray-600">Memory: {config.resources.limits.memory}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total Resources */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-indigo-900">Total Kubernetes Resources</span>
          <span className="text-2xl font-bold text-indigo-600">{getResourceCount()}</span>
        </div>
        <div className="text-sm text-indigo-700 mt-1">
          Resources that will be created in your cluster
        </div>
      </div>
    </div>
  );
}