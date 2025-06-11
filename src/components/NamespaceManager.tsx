import React, { useState } from 'react';
import { Plus, X, Database, Tag, Calendar, Trash2, Check, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Namespace Manager</h3>
              <p className="text-sm text-gray-600">Create and manage Kubernetes namespaces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create New Namespace */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-green-600" />
                <h4 className="text-lg font-semibold text-gray-900">Create New Namespace</h4>
              </div>

              {/* Namespace Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namespace Name *
                </label>
                <input
                  type="text"
                  value={newNamespace.name}
                  onChange={(e) => handleNamespaceNameChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="my-namespace"
                />
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-1 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labels (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newLabel.key}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Label key"
                    />
                    <input
                      type="text"
                      value={newLabel.value}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Label value"
                    />
                    <button
                      onClick={addLabel}
                      disabled={!newLabel.key || !newLabel.value}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {Object.entries(newNamespace.labels).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(newNamespace.labels).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                          <span className="text-sm text-blue-900">
                            <span className="font-medium">{key}</span>: {value}
                          </span>
                          <button
                            onClick={() => removeLabel(key)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Annotations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annotations (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAnnotation.key}
                      onChange={(e) => setNewAnnotation(prev => ({ ...prev, key: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Annotation key"
                    />
                    <input
                      type="text"
                      value={newAnnotation.value}
                      onChange={(e) => setNewAnnotation(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Annotation value"
                    />
                    <button
                      onClick={addAnnotation}
                      disabled={!newAnnotation.key || !newAnnotation.value}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {Object.entries(newNamespace.annotations).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(newNamespace.annotations).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg">
                          <span className="text-sm text-purple-900">
                            <span className="font-medium">{key}</span>: {value}
                          </span>
                          <button
                            onClick={() => removeAnnotation(key)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateNamespace}
                disabled={!newNamespace.name || errors.length > 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Namespace</span>
              </button>
            </div>

            {/* Existing Namespaces */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Existing Namespaces ({namespaces.length})
                </h4>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {namespaces.map((namespace) => (
                  <div key={namespace.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{namespace.name}</span>
                        {isDefaultNamespace(namespace.name) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            System
                          </span>
                        )}
                      </div>
                      
                      {!isDefaultNamespace(namespace.name) && (
                        <div className="flex items-center space-x-1">
                          {deleteConfirm === namespace.name ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteNamespace(namespace.name)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(namespace.name)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
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
                      <div className="mb-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Tag className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">Labels:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(namespace.labels).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Annotations */}
                    {Object.keys(namespace.annotations).length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Tag className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">Annotations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(namespace.annotations).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Created: {new Date(namespace.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Delete confirmation warning */}
                    {deleteConfirm === namespace.name && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Are you sure?</span>
                        </div>
                        <div>This will delete the namespace and may affect deployments using it.</div>
                      </div>
                    )}
                  </div>
                ))}

                {namespaces.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No custom namespaces created yet</p>
                    <p className="text-sm">Create your first namespace to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}