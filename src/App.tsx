import React, { useState } from 'react';
import { Download, Eye, FileText, List, Github, Linkedin, Heart } from 'lucide-react';
import { DeploymentForm } from './components/DeploymentForm';
import { YamlPreview } from './components/YamlPreview';
import { VisualPreview } from './components/VisualPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { generateKubernetesYaml } from './utils/yamlGenerator';
import type { DeploymentConfig } from './types';

type PreviewMode = 'visual' | 'yaml' | 'summary';

function App() {
  const [config, setConfig] = useState<DeploymentConfig>({
    appName: '',
    image: '',
    replicas: 3,
    port: 80,
    targetPort: 8080,
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
  });

  const [previewMode, setPreviewMode] = useState<PreviewMode>('visual');
  const [yamlContent, setYamlContent] = useState('');

  const handleConfigChange = (newConfig: DeploymentConfig) => {
    setConfig(newConfig);
    const yaml = generateKubernetesYaml(newConfig);
    setYamlContent(yaml);
  };

  const handleDownload = () => {
    const yaml = generateKubernetesYaml(config);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.appName || 'kubernetes'}-deployment.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewModes = [
    { id: 'visual' as const, label: 'Visual', icon: Eye },
    { id: 'yaml' as const, label: 'YAML', icon: FileText },
    { id: 'summary' as const, label: 'Summary', icon: List }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Kube Composer
                </h1>
                <p className="text-sm text-gray-600">Kubernetes YAML Generator</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={!config.appName}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download YAML
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Deployment Configuration</h2>
              <DeploymentForm config={config} onChange={handleConfigChange} />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Preview Mode Tabs */}
              <div className="border-b border-gray-200 bg-gray-50/50">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {previewModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setPreviewMode(mode.id)}
                        className={`${
                          previewMode === mode.id
                            ? 'border-blue-500 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                {previewMode === 'visual' && <VisualPreview config={config} />}
                {previewMode === 'yaml' && <YamlPreview yaml={yamlContent} />}
                {previewMode === 'summary' && <ResourceSummary config={config} />}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Kube Composer
                </h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                A powerful, intuitive tool for generating production-ready Kubernetes YAML configurations. 
                Simplify your container orchestration workflow with visual previews and comprehensive resource management.
              </p>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Visual Deployment Preview</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Real-time YAML Generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Resource Summary & Validation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Production-Ready Templates</span>
                </li>
              </ul>
            </div>

            {/* Connect Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Connect</h4>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/same7ammar/kube-composer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                  aria-label="View on GitHub"
                >
                  <Github className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                </a>
                <a
                  href="https://linkedin.com/in/same7ammar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200 group"
                  aria-label="Connect on LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                </a>
              </div>
              <p className="text-xs text-gray-500">
                Built by{' '}
                <a
                  href="https://linkedin.com/in/same7ammar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Sameh Ammar
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>for the Kubernetes community</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>© 2025 Kube Composer</span>
                <a
                  href="https://github.com/same7ammar/kube-composer/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  MIT License
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;