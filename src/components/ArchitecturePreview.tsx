import { useState } from 'react';
import { Database, Server, Globe, Info, ChevronDown, ChevronUp, Activity, Cpu, HardDrive, Network, Eye, EyeOff } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface ArchitecturePreviewProps {
  deployments: DeploymentConfig[];
}

export function ArchitecturePreview({ deployments }: ArchitecturePreviewProps) {
  const [expandedDeployments, setExpandedDeployments] = useState<Set<number>>(new Set([0]));
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const validDeployments = deployments.filter(d => d.appName);
  const totalPods = validDeployments.reduce((sum, d) => sum + d.replicas, 0);
  const totalServices = validDeployments.length;
  const totalConfigMaps = validDeployments.reduce((sum, d) => sum + d.configMaps.length, 0);

  const namespaces = [...new Set(validDeployments.map(d => d.namespace))];

  const toggleDeployment = (index: number) => {
    const newExpanded = new Set(expandedDeployments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDeployments(newExpanded);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'LoadBalancer': return 'bg-green-100 text-green-800 border-green-200';
      case 'NodePort': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ClusterIP': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthStatus = (deployment: DeploymentConfig) => {
    const hasImage = !!deployment.image;
    const hasResources = !!(deployment.resources.requests.cpu || deployment.resources.requests.memory);
    const hasProperPorts = deployment.port > 0 && deployment.targetPort > 0;
    
    if (hasImage && hasResources && hasProperPorts) return { status: 'healthy', color: 'green' };
    if (hasImage && hasProperPorts) return { status: 'warning', color: 'yellow' };
    return { status: 'error', color: 'red' };
  };

  if (validDeployments.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Server className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Deployments Configured</h3>
          <p className="text-gray-600 mb-6">Create your first deployment to see the architecture visualization</p>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-gray-500">
              Add deployments to visualize your Kubernetes architecture with interactive diagrams and real-time insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Metrics */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Kubernetes Architecture</h3>
            <p className="text-blue-100">Real-time visualization of your deployment infrastructure</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-300" />
              <span className="text-sm text-blue-100">Live Preview</span>
            </div>
            <button
              onClick={toggleDetails}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              {showDetails ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm">Hide Details</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Show Details</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Server className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">Deployments</span>
            </div>
            <div className="text-2xl font-bold">{validDeployments.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-green-200" />
              <span className="text-sm text-blue-100">Pods</span>
            </div>
            <div className="text-2xl font-bold">{totalPods}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-5 h-5 text-purple-200" />
              <span className="text-sm text-blue-100">Services</span>
            </div>
            <div className="text-2xl font-bold">{totalServices}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-5 h-5 text-orange-200" />
              <span className="text-sm text-blue-100">ConfigMaps</span>
            </div>
            <div className="text-2xl font-bold">{totalConfigMaps}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-5 h-5 text-yellow-200" />
              <span className="text-sm text-blue-100">Namespaces</span>
            </div>
            <div className="text-2xl font-bold">{namespaces.length}</div>
          </div>
        </div>
      </div>

      {/* Namespace Filter */}
      {namespaces.length > 1 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by namespace:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedNamespace(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedNamespace === null
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Namespaces
              </button>
              {namespaces.map(namespace => (
                <button
                  key={namespace}
                  onClick={() => setSelectedNamespace(namespace)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedNamespace === namespace
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {namespace}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Namespace Views */}
      {namespaces
        .filter(namespace => !selectedNamespace || namespace === selectedNamespace)
        .map(namespace => {
          const namespaceDeployments = validDeployments.filter(d => d.namespace === namespace);
          const namespacePods = namespaceDeployments.reduce((sum, d) => sum + d.replicas, 0);
          
          return (
            <div key={namespace} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Enhanced Namespace Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Namespace: {namespace}</h4>
                      <p className="text-sm text-gray-600">
                        {namespaceDeployments.length} deployment{namespaceDeployments.length !== 1 ? 's' : ''} • {namespacePods} pod{namespacePods !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Deployments */}
              <div className="p-6 space-y-4">
                {namespaceDeployments.map((deployment, index) => {
                  const globalIndex = validDeployments.indexOf(deployment);
                  const isExpanded = showDetails && expandedDeployments.has(globalIndex);
                  const health = getHealthStatus(deployment);
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition-all duration-300">
                      {/* Enhanced Deployment Header */}
                      <div 
                        className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => showDetails && toggleDeployment(globalIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className={`w-3 h-3 rounded-full ${
                              health.color === 'green' ? 'bg-green-500' :
                              health.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                            } animate-pulse`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-semibold text-gray-900 truncate">{deployment.appName}</h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getServiceTypeColor(deployment.serviceType)}`}>
                                  {deployment.serviceType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">{deployment.image}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{deployment.replicas} replica{deployment.replicas !== 1 ? 's' : ''}</div>
                              <div className="text-xs text-gray-500">Port {deployment.port}→{deployment.targetPort}</div>
                            </div>
                            {showDetails && (
                              isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Deployment Details */}
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Enhanced Deployment Section */}
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Server className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <h6 className="font-semibold text-gray-900">Deployment</h6>
                                  <p className="text-xs text-gray-500">Container orchestration</p>
                                </div>
                              </div>
                              
                              {/* Enhanced Pods Grid */}
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-green-900">Pod Instances</span>
                                  <span className="text-xs text-green-600">{deployment.replicas} running</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {Array.from({ length: Math.min(deployment.replicas, 8) }).map((_, podIndex) => (
                                    <div key={podIndex} className="bg-white rounded-lg p-2 border border-green-200 text-center group hover:bg-green-50 transition-colors duration-200">
                                      <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-1 group-hover:scale-110 transition-transform duration-200" />
                                      <div className="text-xs text-green-700">Pod {podIndex + 1}</div>
                                    </div>
                                  ))}
                                  {deployment.replicas > 8 && (
                                    <div className="bg-gray-100 rounded-lg p-2 border border-gray-200 text-center">
                                      <div className="text-xs text-gray-600">+{deployment.replicas - 8} more</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Enhanced Resource Metrics */}
                              {(deployment.resources.requests.cpu || deployment.resources.requests.memory) && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <Cpu className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Resource Allocation</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {deployment.resources.requests.cpu && (
                                      <div className="bg-white rounded p-2 border border-blue-200">
                                        <div className="text-xs text-blue-600 mb-1">CPU</div>
                                        <div className="text-sm font-medium text-blue-900">
                                          {deployment.resources.requests.cpu}
                                          {deployment.resources.limits.cpu && ` / ${deployment.resources.limits.cpu}`}
                                        </div>
                                      </div>
                                    )}
                                    {deployment.resources.requests.memory && (
                                      <div className="bg-white rounded p-2 border border-blue-200">
                                        <div className="text-xs text-blue-600 mb-1">Memory</div>
                                        <div className="text-sm font-medium text-blue-900">
                                          {deployment.resources.requests.memory}
                                          {deployment.resources.limits.memory && ` / ${deployment.resources.limits.memory}`}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Enhanced Service Section */}
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Globe className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <h6 className="font-semibold text-gray-900">Service</h6>
                                  <p className="text-xs text-gray-500">Network access layer</p>
                                </div>
                              </div>
                              
                              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-purple-900">Service Name</span>
                                    <span className="text-sm text-purple-700">{deployment.appName}-service</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-purple-900">Type</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getServiceTypeColor(deployment.serviceType)}`}>
                                      {deployment.serviceType}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded p-3 border border-purple-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Network className="w-4 h-4 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-900">Port Mapping</span>
                                    </div>
                                    <div className="text-center">
                                      <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-lg px-3 py-2">
                                        <span className="text-sm font-mono text-purple-800">{deployment.port}</span>
                                        <span className="text-purple-600">→</span>
                                        <span className="text-sm font-mono text-purple-800">{deployment.targetPort}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Resources */}
                              {(deployment.env.length > 0 || deployment.volumes.length > 0) && (
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <HardDrive className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium text-orange-900">Additional Resources</span>
                                  </div>
                                  <div className="space-y-2">
                                    {deployment.env.length > 0 && (
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-orange-700">Environment Variables</span>
                                        <span className="text-orange-600 font-medium">{deployment.env.length}</span>
                                      </div>
                                    )}
                                    {deployment.volumes.length > 0 && (
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-orange-700">Volumes</span>
                                        <span className="text-orange-600 font-medium">{deployment.volumes.length}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Enhanced Architecture Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-900 mb-2">Architecture Insights</h4>
            <div className="text-sm text-indigo-700 space-y-2">
              <p>
                Your Kubernetes architecture consists of <strong>{validDeployments.length}</strong> deployment{validDeployments.length !== 1 ? 's' : ''} 
                running <strong>{totalPods}</strong> pod{totalPods !== 1 ? 's' : ''} across <strong>{namespaces.length}</strong> namespace{namespaces.length !== 1 ? 's' : ''}.
              </p>
              <p>
                Each deployment manages container replicas and is exposed through services for network access. 
                {showDetails ? 'Click on deployments above to explore detailed configurations and resource allocations.' : 'Enable details view to explore configurations and resource allocations.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}