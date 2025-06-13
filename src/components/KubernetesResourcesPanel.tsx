import { Server, Globe, Shield, Key, HardDrive, Database, Plus } from 'lucide-react';

interface KubernetesResourcesPanelProps {
  onResourceAction: (resourceType: string) => void;
}

const kubernetesResources = [
  {
    id: 'deployment',
    name: 'Deployment',
    description: 'Manages a replicated application',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'service',
    name: 'Service',
    description: 'Exposes an application running on a set of Pods',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'ingress',
    name: 'Ingress',
    description: 'Manages external access to services',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'configmap',
    name: 'ConfigMap',
    description: 'Stores configuration data',
    icon: Key,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'secret',
    name: 'Secret',
    description: 'Stores sensitive data',
    icon: Key,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 'persistentvolume',
    name: 'PersistentVolume',
    description: 'Provides persistent storage',
    icon: HardDrive,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
];

export function KubernetesResourcesPanel({ onResourceAction }: KubernetesResourcesPanelProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Database className="w-5 h-5 text-gray-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Kubernetes Resources</h3>
          <p className="text-sm text-gray-500">Add Kubernetes resources to your Helm chart</p>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="space-y-3">
        {kubernetesResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.id}
              onClick={() => onResourceAction(resource.id)}
              className={`w-full p-4 rounded-lg border ${resource.borderColor} ${resource.bgColor} hover:shadow-md transition-all duration-200 text-left group`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-lg ${resource.bgColor} border ${resource.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${resource.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${resource.color} group-hover:text-gray-900 transition-colors duration-200`}>
                      {resource.name}
                    </h4>
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {resource.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Getting Started</p>
            <p>
              Click on any resource type above to add it to your deployment. 
              Start with a <strong>Deployment</strong> to define your application, 
              then add a <strong>Service</strong> to expose it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}