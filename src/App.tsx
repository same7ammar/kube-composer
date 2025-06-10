import React, { useState } from 'react';
import { Download, Eye, FileText, List, Github, Linkedin, Heart, Plus } from 'lucide-react';
import { DeploymentForm } from './components/DeploymentForm';
import { YamlPreview } from './components/YamlPreview';
import { VisualPreview } from './components/VisualPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { DeploymentsList } from './components/DeploymentsList';
import { ArchitecturePreview } from './components/ArchitecturePreview';
import { generateKubernetesYaml } from './utils/yamlGenerator';
import type { DeploymentConfig } from './types';

type PreviewMode = 'visual' | 'yaml' | 'summary';

function App() {
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([
    {
      appName: 'my-app',
      image: 'nginx:latest',
      replicas: 3,
      port: 80,
      targetPort: 80,
      serviceType: 'ClusterIP',
      namespace: 'default',
      labels: {},
      annotations: {},
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' }
      },
      env: [],
      volumes: [],
      configMaps: [],
      secrets: []
    }
  ]);

  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('visual');
  const [showForm, setShowForm] = useState(false);

  const currentConfig = deployments[selectedDeployment] || {
    appName: '',
    image: '',
    replicas: 1,
    port: 80,
    targetPort: 8080,
    serviceType: 'ClusterIP',
    namespace: 'default',
    labels: {},
    annotations: {},
    resources: {
      requests: { cpu: '', memory: '' },
      limits: { cpu: '', memory: '' }
    },
    env: [],
    volumes: [],
    configMaps: [],
    secrets: []
  };

  const handleConfigChange = (newConfig: DeploymentConfig) => {
    const newDeployments = [...deployments];
    if (selectedDeployment < deployments.length) {
      newDeployments[selectedDeployment] = newConfig;
    } else {
      newDeployments.push(newConfig);
    }
    setDeployments(newDeployments);
  };

  const handleAddDeployment = () => {
    const newDeployment: DeploymentConfig = {
      appName: '',
      image: '',
      replicas: 1,
      port: 80,
      targetPort: 8080,
      serviceType: 'ClusterIP',
      namespace: 'default',
      labels: {},
      annotations: {},
      resources: {
        requests: { cpu: '', memory: '' },
        limits: { cpu: '', memory: '' }
      },
      env: [],
      volumes: [],
      configMaps: [],
      secrets: []
    };
    setDeployments([...deployments, newDeployment]);
    setSelectedDeployment(deployments.length);
    setShowForm(true);
  };

  const handleDownload = () => {
    const yaml = generateKubernetesYaml(currentConfig);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConfig.appName || 'kubernetes'}-deployment.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewModes = [
    { id: 'visual' as const, label: 'Visual', icon: Eye },
    { id: 'summary' as const, label: 'Summary', icon: List },
    { id: 'yaml' as const, label: 'YAML', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Kube Composer</h1>
                <p className="text-sm text-gray-500">Kubernetes YAML Generator for developers</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{deployments.length} deployment{deployments.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={handleAddDeployment}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deployment
              </button>
              <button
                onClick={handleDownload}
                disabled={!currentConfig.appName}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-1" />
                Download YAML
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-12 h-full">
          {/* Left Sidebar - Deployments List */}
          <div className="col-span-3 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Deployments</h2>
            </div>
            <DeploymentsList
              deployments={deployments}
              selectedIndex={selectedDeployment}
              onSelect={setSelectedDeployment}
              onEdit={() => setShowForm(true)}
            />
          </div>

          {/* Right Content - Preview */}
          <div className="col-span-9 flex flex-col">
            {/* Preview Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                <div className="flex items-center space-x-1">
                  {previewModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setPreviewMode(mode.id)}
                        className={`${
                          previewMode === mode.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        } px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors duration-200`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 p-6 bg-gray-50">
              {previewMode === 'visual' && <ArchitecturePreview deployments={deployments} />}
              {previewMode === 'yaml' && <YamlPreview yaml={generateKubernetesYaml(currentConfig)} />}
              {previewMode === 'summary' && <ResourceSummary config={currentConfig} />}
            </div>
          </div>
        </div>
      </main>

      {/* Deployment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentConfig.appName ? `Edit ${currentConfig.appName}` : 'New Deployment'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <DeploymentForm config={currentConfig} onChange={handleConfigChange} />
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;