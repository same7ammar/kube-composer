import { useState } from 'react';
import { Download, Eye, FileText, List, Plus, Menu, X } from 'lucide-react';
import { DeploymentForm } from './components/DeploymentForm';
import { YamlPreview } from './components/YamlPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { DeploymentsList } from './components/DeploymentsList';
import { ArchitecturePreview } from './components/ArchitecturePreview';
import { Footer } from './components/Footer';
import { SocialShare } from './components/SocialShare';
import { SEOHead } from './components/SEOHead';
import { generateMultiDeploymentYaml } from './utils/yamlGenerator';
import type { DeploymentConfig } from './types';

type PreviewMode = 'visual' | 'yaml' | 'summary';

function App() {
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('visual');
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleDeleteDeployment = (index: number) => {
    if (deployments.length <= 1) {
      // If it's the last deployment, remove it completely
      setDeployments([]);
      setSelectedDeployment(0);
      return;
    }

    const newDeployments = deployments.filter((_, i) => i !== index);
    setDeployments(newDeployments);
    
    // Adjust selected deployment index
    if (selectedDeployment >= index) {
      setSelectedDeployment(Math.max(0, selectedDeployment - 1));
    }
  };

  const handleDuplicateDeployment = (index: number) => {
    const deploymentToDuplicate = deployments[index];
    const duplicatedDeployment: DeploymentConfig = {
      ...deploymentToDuplicate,
      appName: `${deploymentToDuplicate.appName}-copy`
    };
    
    const newDeployments = [...deployments];
    newDeployments.splice(index + 1, 0, duplicatedDeployment);
    setDeployments(newDeployments);
    setSelectedDeployment(index + 1);
  };

  const handleDownload = async () => {
    if (deployments.length === 0) {
      return;
    }
    
    // Filter out deployments without app names
    const validDeployments = deployments.filter(d => d.appName);
    if (validDeployments.length === 0) {
      return;
    }
    
    const yaml = generateMultiDeploymentYaml(validDeployments);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename based on number of deployments
    const filename = validDeployments.length === 1 
      ? `${validDeployments[0].appName}-deployment.yaml`
      : `kubernetes-deployments-${validDeployments.length}.yaml`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate YAML for preview based on mode
  const getPreviewYaml = () => {
    if (deployments.length === 0) {
      return '# No deployments configured\n# Create your first deployment to see the generated YAML';
    }
    
    const validDeployments = deployments.filter(d => d.appName);
    if (validDeployments.length === 0) {
      return '# No valid deployments found\n# Please configure at least one deployment with an app name';
    }
    
    return generateMultiDeploymentYaml(validDeployments);
  };

  const previewModes = [
    { id: 'visual' as const, label: 'Visual', icon: Eye },
    { id: 'summary' as const, label: 'Summary', icon: List },
    { id: 'yaml' as const, label: 'YAML', icon: FileText }
  ];

  // Check if download should be enabled
  const hasValidDeployments = deployments.some(d => d.appName);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* SEO Head Component */}
      <SEOHead />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Kube Composer</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Kubernetes YAML Generator for developers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{deployments.length} deployment{deployments.length !== 1 ? 's' : ''}</span>
                </div>
                <SocialShare />
              </div>
              <button
                onClick={handleAddDeployment}
                className="inline-flex items-center px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Add Deployment</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!hasValidDeployments}
                className="inline-flex items-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
              >
                <Download className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Download YAML</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Deployments List */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 lg:w-1/4 xl:w-1/5 bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out lg:transition-none
          flex flex-col
        `}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Deployments</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {deployments.length > 0 ? (
              <DeploymentsList
                deployments={deployments}
                selectedIndex={selectedDeployment}
                onSelect={(index) => {
                  setSelectedDeployment(index);
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                onEdit={() => setShowForm(true)}
                onDelete={handleDeleteDeployment}
                onDuplicate={handleDuplicateDeployment}
              />
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployments</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Get started by creating your first Kubernetes deployment
                </p>
                <button
                  onClick={handleAddDeployment}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Deployment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Preview
                {previewMode === 'yaml' && deployments.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (All {deployments.filter(d => d.appName).length} deployments)
                  </span>
                )}
              </h2>
              <div className="flex items-center justify-between sm:justify-end">
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
                        } px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 sm:p-6 pb-8">
              {previewMode === 'visual' && <ArchitecturePreview deployments={deployments} />}
              {previewMode === 'yaml' && <YamlPreview yaml={getPreviewYaml()} />}
              {previewMode === 'summary' && <ResourceSummary config={currentConfig} />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Deployment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentConfig.appName ? `Edit ${currentConfig.appName}` : 'Create New Deployment'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <DeploymentForm config={currentConfig} onChange={handleConfigChange} />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
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