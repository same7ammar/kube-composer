import { Server, Globe, Database, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface ResourceSummaryProps {
  config: DeploymentConfig;
}

export function ResourceSummary({ config }: ResourceSummaryProps) {
  const getResourceCount = () => {
    let count = 0;
    if (config.appName) count += 2; // Deployment + Service
    if (config.ingress.enabled) count += 1; // Ingress
    count += config.configMaps.length;
    count += config.secrets.length;
    return count;
  };

  const getValidationStatus = () => {
    const issues = [];
    if (!config.appName) issues.push('Application name is required');
    
    // Check containers
    if (!config.containers || config.containers.length === 0) {
      issues.push('At least one container is required');
    } else {
      config.containers.forEach((container, index) => {
        if (!container.name) issues.push(`Container ${index + 1}: Name is required`);
        if (!container.image) issues.push(`Container ${index + 1}: Image is required`);
        if (container.port <= 0) issues.push(`Container ${index + 1}: Port must be greater than 0`);
      });
    }
    
    if (config.port <= 0) issues.push('Service port must be greater than 0');
    if (config.targetPort <= 0) issues.push('Target port must be greater than 0');
    if (config.replicas <= 0) issues.push('Replicas must be greater than 0');
    
    // Check ingress configuration
    if (config.ingress.enabled) {
      if (config.ingress.rules.length === 0) {
        issues.push('Ingress is enabled but no rules are configured');
      } else {
        config.ingress.rules.forEach((rule, index) => {
          if (!rule.serviceName) issues.push(`Ingress rule ${index + 1}: Service name is required`);
          if (rule.servicePort <= 0) issues.push(`Ingress rule ${index + 1}: Service port must be greater than 0`);
        });
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const validation = getValidationStatus();
  const containerCount = config.containers?.length || 0;

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
            <div>Containers: {containerCount}</div>
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

      {/* Ingress Summary */}
      {config.ingress.enabled && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">Ingress</span>
          </div>
          <div className="text-sm text-orange-700 space-y-1">
            <div>Rules: {config.ingress.rules.length}</div>
            <div>TLS Certificates: {config.ingress.tls.length}</div>
            {config.ingress.className && (
              <div>Ingress Class: {config.ingress.className}</div>
            )}
            {config.ingress.rules.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Configured Hosts:</div>
                {config.ingress.rules.map((rule, index) => (
                  <div key={index} className="text-xs text-orange-600">
                    {rule.host || '*'} → {rule.path} → {rule.serviceName}:{rule.servicePort}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Container Details */}
      {config.containers && config.containers.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Container Details</h4>
          <div className="grid grid-cols-1 gap-4">
            {config.containers.map((container, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    Container {index + 1}: {container.name || 'Unnamed'}
                  </span>
                </div>
                <div className="text-sm text-purple-700 space-y-1">
                  <div>Image: {container.image || 'Not specified'}</div>
                  <div>Port: {container.port}</div>
                  {container.env.length > 0 && (
                    <div>Environment Variables: {container.env.length}</div>
                  )}
                  {container.volumeMounts.length > 0 && (
                    <div>Volume Mounts: {container.volumeMounts.length}</div>
                  )}
                  {(container.resources.requests.cpu || container.resources.requests.memory) && (
                    <div>Resource Requests: 
                      {container.resources.requests.cpu && ` CPU: ${container.resources.requests.cpu}`}
                      {container.resources.requests.memory && ` Memory: ${container.resources.requests.memory}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Resources */}
      {config.volumes.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Additional Resources</h4>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-900">Volumes</span>
            </div>
            <div className="text-sm text-indigo-700">
              {config.volumes.length} volume{config.volumes.length !== 1 ? 's' : ''} configured
            </div>
            <div className="mt-2 space-y-1">
              {config.volumes.slice(0, 3).map((volume, index) => (
                <div key={index} className="text-xs text-indigo-600">
                  {volume.name} → {volume.mountPath} ({volume.type})
                </div>
              ))}
              {config.volumes.length > 3 && (
                <div className="text-xs text-indigo-600">
                  +{config.volumes.length - 3} more...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Features */}
      {config.ingress.enabled && config.ingress.tls.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Security Features</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <div>TLS/SSL Encryption: Enabled</div>
            <div>TLS Certificates: {config.ingress.tls.length}</div>
            <div className="mt-2">
              <div className="font-medium mb-1">Protected Domains:</div>
              {config.ingress.tls.map((tls, index) => (
                <div key={index} className="text-xs text-green-600">
                  {tls.secretName}: {tls.hosts.join(', ')}
                </div>
              ))}
            </div>
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