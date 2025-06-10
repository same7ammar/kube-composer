import React from 'react';
import { Database, Server, Globe, Info } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface ArchitecturePreviewProps {
  deployments: DeploymentConfig[];
}

export function ArchitecturePreview({ deployments }: ArchitecturePreviewProps) {
  const validDeployments = deployments.filter(d => d.appName);
  const totalPods = validDeployments.reduce((sum, d) => sum + d.replicas, 0);
  const totalServices = validDeployments.length;
  const totalConfigMaps = validDeployments.reduce((sum, d) => sum + d.configMaps.length, 0);

  const namespaces = [...new Set(validDeployments.map(d => d.namespace))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Architecture Preview</h3>
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <span>{namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}</span>
            <button className="text-gray-400 hover:text-gray-600">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{validDeployments.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Deployments</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{totalPods}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Pods</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{totalServices}</div>
            <div className="text-xs sm:text-sm text-gray-600">Services</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{totalConfigMaps}</div>
            <div className="text-xs sm:text-sm text-gray-600">ConfigMaps</div>
          </div>
        </div>
      </div>

      {/* Namespace Views */}
      {namespaces.map(namespace => {
        const namespaceDeployments = validDeployments.filter(d => d.namespace === namespace);
        const namespacePods = namespaceDeployments.reduce((sum, d) => sum + d.replicas, 0);
        
        return (
          <div key={namespace} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Namespace Header */}
            <div className="bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Namespace: {namespace}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {namespaceDeployments.length} deployment{namespaceDeployments.length !== 1 ? 's' : ''} • {namespacePods} pod{namespacePods !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Deployments */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {namespaceDeployments.map((deployment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Deployment Header */}
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{deployment.appName}</span>
                        <span className="text-xs sm:text-sm text-gray-500 truncate hidden sm:inline">{deployment.image}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium self-start sm:self-auto">
                        {deployment.replicas} replica{deployment.replicas !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 sm:hidden truncate">{deployment.image}</div>
                  </div>

                  {/* Deployment Content */}
                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Deployment Info */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Server className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">Deployment</span>
                          <span className="text-xs text-green-600">{deployment.replicas} replicas</span>
                        </div>
                        
                        {/* Pods Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 mb-4">
                          {Array.from({ length: Math.min(deployment.replicas, 6) }).map((_, podIndex) => (
                            <div key={podIndex} className="bg-green-100 p-2 rounded text-center">
                              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded mx-auto mb-1" />
                              <div className="text-xs text-green-700">Pod</div>
                            </div>
                          ))}
                          {deployment.replicas > 6 && (
                            <div className="bg-gray-100 p-2 rounded text-center">
                              <div className="text-xs text-gray-600">+{deployment.replicas - 6}</div>
                            </div>
                          )}
                        </div>

                        {/* Resource Info */}
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span>Port: {deployment.targetPort}</span>
                          </div>
                          {deployment.resources.requests.cpu && (
                            <div>CPU: {deployment.resources.requests.cpu} - {deployment.resources.limits.cpu || 'unlimited'}</div>
                          )}
                          {deployment.resources.requests.memory && (
                            <div>Memory: {deployment.resources.requests.memory} - {deployment.resources.limits.memory || 'unlimited'}</div>
                          )}
                        </div>
                      </div>

                      {/* Service Info */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Service</span>
                          <span className="text-xs text-blue-600">{deployment.serviceType}</span>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-1 truncate">
                            Name: {deployment.appName}-service
                          </div>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>Port: {deployment.port} → {deployment.targetPort}</div>
                            <div>Type: {deployment.serviceType}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Architecture Overview */}
      <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
          <span className="font-semibold text-blue-900 text-sm sm:text-base">Architecture Overview</span>
        </div>
        <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
          This visualization shows your Kubernetes deployment architecture. Each deployment creates pods that run your containers, 
          services provide network access, and ConfigMaps store configuration data. Click on deployments to see detailed information.
        </p>
      </div>
    </div>
  );
}