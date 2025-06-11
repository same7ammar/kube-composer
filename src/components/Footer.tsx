import { Github, Heart, ExternalLink, FileText, Zap, Shield, Users } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white relative">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Kube Composer</h3>
                <p className="text-blue-200 text-sm">YAML Generator</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Simplify Kubernetes deployment configuration with our intuitive visual editor. 
              Generate production-ready YAML files in minutes, not hours.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://kubernetes.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Kubernetes Documentation"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Features</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Visual Deployment Editor</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm">YAML Generation</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Resource Validation</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Multi-Deployment Support</span>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://kubernetes.io/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                >
                  <span>Kubernetes Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                >
                  <span>Deployment Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://kubernetes.io/docs/concepts/services-networking/service/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                >
                  <span>Service Types</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                >
                  <span>Resource Management</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-100">Support</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  Getting Started
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  Best Practices
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  Troubleshooting
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  Report Issues
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <p className="text-gray-400 text-sm">
                © {currentYear} Kube Composer. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Terms of Service
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              <span>for the Kubernetes community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
    </footer>
  );
}