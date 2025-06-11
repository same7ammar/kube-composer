import React, { useState } from 'react';
import { Plus, X, Database, Tag, Calendar, Trash2, Check, AlertTriangle, Info } from 'lucide-react';
import type { Namespace } from '../types';

interface NamespaceManagerProps {
  namespaces: Namespace[];
  onAddNamespace: (namespace: Namespace) => void;
  onDeleteNamespace: (namespaceName: string) => void;
  onClose: () => void;
}

export function NamespaceManager({ 
  namespaces, 
  onAddNamespace, 
  onDeleteNamespace, 
  onClose 
}: NamespaceManagerProps) {
  const [newNamespace, setNewNamespace] = useState({
    name: '',
    labels: {} as Record<string, string>,
    annotations: {} as Record<string, string>
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [newAnnotation, setNewAnnotation] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const validateNamespaceName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Namespace name is required');
      return errors;
    }
    
    if (name.length > 63) {
      errors.push('Namespace name must be 63 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
      errors.push('Namespace name must contain only lowercase letters, numbers, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-')) {
      errors.push('Namespace name cannot start or end with a hyphen');
    }
    
    if (namespaces.some(ns => ns.name === name)) {
      errors.push('Namespace already exists');
    }
    
    // Reserved namespace names
    const reserved = ['kube-system', 'kube-public', 'kube-node-lease', 'kubernetes-dashboard'];
    if (reserved.includes(name)) {
      errors.push('This is a reserved namespace name');
    }
    
    return errors;
  };

  const handleNamespaceNameChange = (name: string) => {
    setNewNamespace(prev => ({ ...prev, name }));
    setErrors(validateNamespaceName(name));
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewNamespace(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewNamespace(prev => {
      const { [key]: removed, ...rest } = prev.labels;
      return { ...prev, labels: rest };
    });
  };

  const addAnnotation = () => {
    if (newAnnotation.key && newAnnotation.value) {
      setNewNamespace(prev => ({
        ...prev,
        annotations: { ...prev.annotations, [newAnnotation.key]: newAnnotation.value }
      }));
      setNewAnnotation({ key: '', value: '' });
    }
  };

  const removeAnnotation = (key: string) => {
    setNewNamespace(prev => {
      const { [key]: removed, ...rest } = prev.annotations;
      return { ...prev, annotations: rest };
    });
  };

  const handleCreateNamespace = () => {
    const validationErrors = validateNamespaceName(newNamespace.name);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const namespace: Namespace = {
      ...newNamespace,
      createdAt: new Date().toISOString()
    };

    onAddNamespace(namespace);
    setNewNamespace({ name: '', labels: {}, annotations: {} });
    setErrors([]);
  };

  const handleDeleteNamespace = (namespaceName: string) => {
    onDeleteNamespace(namespaceName);
    setDeleteConfirm(null);
  };

  const isDefaultNamespace = (name: string) => {
    return ['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(name);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Namespace Manager</h3>
              <p className="text-sm text-gray-600">Create and manage Kubernetes namespaces for better resource organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-white rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-6">
            {/* Create New Namespace */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Create New Namespace</h4>
                    <p className="text-sm text-gray-600">Add a new namespace to organize your deployments</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Namespace Guidelines:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Use lowercase letters, numbers, and hyphens only</li>
                        <li>• Must start and end with alphanumeric characters</li>
                        <li>• Maximum 63 characters in length</li>
                        <li>• Cannot use reserved system namespace names</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Namespace Name */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Namespace Name *
                  </label>
                  <input
                    type="text"
                    value={newNamespace.name}
                    onChange={(e) => handleNamespaceNameChange(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleCreateNamespace)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="my-application-namespace"
                  />
                  {errors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {errors.map((error, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Labels (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newLabel.key}
                        onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                        onKeyPress={(e) => handleKeyPress(e, addLabel)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="environment"
                      />
                      <input
                        type="text"
                        value={newLabel.value}
                        onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                        onKeyPress={(e) => handleKeyPress(e, addLabel)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="production"
                      />
                      <button
                        onClick={addLabel}
                        disabled={!newLabel.key || !newLabel.value}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {Object.entries(newNamespace.labels).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Added Labels:</p>
                        <div className="space-y-1">
                          {Object.entries(newNamespace.labels).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <span className="text-sm text-blue-900">
                                <span className="font-semibold">{key}</span>: {value}
                              </span>
                              <button
                                onClick={() => removeLabel(key)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors duration-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Annotations */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Annotations (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newAnnotation.key}
                        onChange={(e) => setNewAnnotation(prev => ({ ...prev, key: e.target.value }))}
                        onKeyPress={(e) => handleKeyPress(e, addAnnotation)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="description"
                      />
                      <input
                        type="text"
                        value={newAnnotation.value}
                        onChange={(e) => setNewAnnotation(prev => ({ ...prev, value: e.target.value }))}
                        onKeyPress={(e) => handleKeyPress(e, addAnnotation)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Production environment namespace"
                      />
                      <button
                        onClick={addAnnotation}
                        disabled={!newAnnotation.key || !newAnnotation.value}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {Object.entries(newNamespace.annotations).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Added Annotations:</p>
                        <div className="space-y-1">
                          {Object.entries(newNamespace.annotations).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                              <span className="text-sm text-purple-900">
                                <span className="font-semibold">{key}</span>: {value}
                              </span>
                              <button
                                onClick={() => removeAnnotation(key)}
                                className="text-purple-600 hover:text-purple-800 p-1 rounded transition-colors duration-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateNamespace}
                  disabled={!newNamespace.name || errors.length > 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Namespace</span>
                </button>
              </div>
            </div>

            {/* Existing Namespaces */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Existing Namespaces
                      </h4>
                      <p className="text-sm text-gray-600">{namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''} configured</p>
                    </div>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-sm font-semibold text-blue-600">{namespaces.length}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {namespaces.map((namespace) => (
                    <div key={namespace.name} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDefaultNamespace(namespace.name) 
                              ? 'bg-blue-100' 
                              : 'bg-purple-100'
                          }`}>
                            <Database className={`w-4 h-4 ${
                              isDefaultNamespace(namespace.name) 
                                ? 'text-blue-600' 
                                : 'text-purple-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{namespace.name}</span>
                              {isDefaultNamespace(namespace.name) && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  System
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Created: {new Date(namespace.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {!isDefaultNamespace(namespace.name) && (
                          <div className="flex items-center space-x-1">
                            {deleteConfirm === namespace.name ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteNamespace(namespace.name)}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(namespace.name)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                                title="Delete namespace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Labels */}
                      {Object.keys(namespace.labels).length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-600">Labels:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(namespace.labels).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Annotations */}
                      {Object.keys(namespace.annotations).length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="w-3 h-3 text-purple-500" />
                            <span className="text-xs font-medium text-gray-600">Annotations:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(namespace.annotations).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete confirmation warning */}
                      {deleteConfirm === namespace.name && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-semibold text-red-800">Confirm Deletion</span>
                          </div>
                          <p className="text-sm text-red-700">
                            This will delete the namespace and move any deployments using it to the 'default' namespace. This action cannot be undone.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {namespaces.length === 1 && namespaces[0].name === 'default' && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8 text-gray-400" />
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">Only Default Namespace</h5>
                      <p className="text-sm text-gray-500 mb-4">
                        Create custom namespaces to better organize your deployments
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                        <p className="font-medium mb-1">Benefits of using namespaces:</p>
                        <ul className="text-left space-y-1">
                          <li>• Organize resources by environment (dev, staging, prod)</li>
                          <li>• Isolate different applications or teams</li>
                          <li>• Apply resource quotas and policies</li>
                          <li>• Improve security with RBAC</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            <p>💡 <strong>Tip:</strong> Use namespaces to organize deployments by environment, team, or application type</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}