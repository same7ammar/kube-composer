import React, { useState } from 'react';
import { Plus, X, Key, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { Secret } from '../types';

interface SecretManagerProps {
  secrets: Secret[];
  namespaces: string[];
  onAddSecret: (secret: Secret) => void;
  onDeleteSecret: (secretName: string) => void;
  onClose: () => void;
}

export function SecretManager({ 
  secrets, 
  namespaces,
  onAddSecret, 
  onDeleteSecret, 
  onClose 
}: SecretManagerProps) {
  const [newSecret, setNewSecret] = useState({
    name: '',
    namespace: 'default',
    type: 'Opaque' as Secret['type'],
    labels: {} as Record<string, string>,
    annotations: {} as Record<string, string>,
    data: {} as Record<string, string>
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [newDataEntry, setNewDataEntry] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const validateSecretName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Secret name is required');
      return errors;
    }
    
    if (name.length > 253) {
      errors.push('Name must be 253 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name)) {
      errors.push('Use only lowercase letters, numbers, dots, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-') || name.startsWith('.') || name.endsWith('.')) {
      errors.push('Cannot start or end with hyphen or dot');
    }
    
    if (secrets.some(s => s.name === name)) {
      errors.push('Secret already exists');
    }
    
    return errors;
  };

  const handleSecretNameChange = (name: string) => {
    setNewSecret(prev => ({ ...prev, name }));
    setErrors(validateSecretName(name));
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewSecret(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewSecret(prev => {
      const { [key]: removed, ...rest } = prev.labels;
      return { ...prev, labels: rest };
    });
  };

  const addDataEntry = () => {
    if (newDataEntry.key && newDataEntry.value) {
      setNewSecret(prev => ({
        ...prev,
        data: { ...prev.data, [newDataEntry.key]: newDataEntry.value }
      }));
      setNewDataEntry({ key: '', value: '' });
    }
  };

  const removeDataEntry = (key: string) => {
    setNewSecret(prev => {
      const { [key]: removed, ...rest } = prev.data;
      return { ...prev, data: rest };
    });
  };

  const handleCreateSecret = () => {
    const validationErrors = validateSecretName(newSecret.name);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (Object.keys(newSecret.data).length === 0) {
      setErrors(['At least one data entry is required']);
      return;
    }

    const secret: Secret = {
      ...newSecret,
      createdAt: new Date().toISOString()
    };

    onAddSecret(secret);
    setNewSecret({ 
      name: '', 
      namespace: 'default', 
      type: 'Opaque',
      labels: {}, 
      annotations: {}, 
      data: {} 
    });
    setErrors([]);
  };

  const handleDeleteSecret = (secretName: string) => {
    onDeleteSecret(secretName);
    setDeleteConfirm(null);
  };

  const toggleShowValue = (secretName: string, key: string) => {
    const toggleKey = `${secretName}-${key}`;
    setShowValues(prev => ({
      ...prev,
      [toggleKey]: !prev[toggleKey]
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getSecretTypeColor = (type: string) => {
    switch (type) {
      case 'kubernetes.io/tls': return 'bg-green-100 text-green-800';
      case 'kubernetes.io/dockerconfigjson': return 'bg-blue-100 text-blue-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Secret Manager</h3>
              <p className="text-sm text-gray-500">Create and manage Kubernetes Secrets</p>
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Create New Secret */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Create New Secret</h4>

              {/* Secret Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Name *
                </label>
                <input
                  type="text"
                  value={newSecret.name}
                  onChange={(e) => handleSecretNameChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreateSecret)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="my-secret"
                />
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Namespace and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namespace
                  </label>
                  <select
                    value={newSecret.namespace}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, namespace: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {namespaces.map(namespace => (
                      <option key={namespace} value={namespace}>
                        {namespace}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newSecret.type}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, type: e.target.value as Secret['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Opaque">Opaque</option>
                    <option value="kubernetes.io/tls">TLS</option>
                    <option value="kubernetes.io/dockerconfigjson">Docker Config</option>
                  </select>
                </div>
              </div>

              {/* Data Entries */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Data *
                  </label>
                  <button
                    onClick={addDataEntry}
                    disabled={!newDataEntry.key || !newDataEntry.value}
                    className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newDataEntry.key}
                    onChange={(e) => setNewDataEntry(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addDataEntry)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="username"
                  />
                  <input
                    type="password"
                    value={newDataEntry.value}
                    onChange={(e) => setNewDataEntry(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addDataEntry)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="secret-value"
                  />
                </div>
                
                {Object.entries(newSecret.data).length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(newSecret.data).map(([key]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">{key}</div>
                          <div className="text-xs text-gray-600">••••••••</div>
                        </div>
                        <button
                          onClick={() => removeDataEntry(key)}
                          className="ml-2 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Labels (Optional)
                  </label>
                  <button
                    onClick={addLabel}
                    disabled={!newLabel.key || !newLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newLabel.key}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newLabel.value}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(newSecret.labels).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(newSecret.labels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">{key}</span>: {value}
                        </span>
                        <button
                          onClick={() => removeLabel(key)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateSecret}
                disabled={!newSecret.name || errors.length > 0 || Object.keys(newSecret.data).length === 0}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Secret</span>
              </button>
            </div>

            {/* Existing Secrets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Existing Secrets</h4>
                <span className="text-sm text-gray-500">{secrets.length} total</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {secrets.map((secret) => (
                  <div key={secret.name} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-gray-900">{secret.name}</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          {secret.namespace}
                        </span>
                      </div>
                      
                      <div>
                        {deleteConfirm === secret.name ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteSecret(secret.name)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(secret.name)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2 flex items-center space-x-2">
                      <span>Created: {new Date(secret.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className={`px-1 py-0.5 rounded text-xs font-medium ${getSecretTypeColor(secret.type)}`}>
                        {secret.type}
                      </span>
                    </div>

                    {/* Data Preview */}
                    {Object.keys(secret.data).length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 mb-1">Data ({Object.keys(secret.data).length} entries):</div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {Object.entries(secret.data).slice(0, 3).map(([key, value]) => {
                            const toggleKey = `${secret.name}-${key}`;
                            const isVisible = showValues[toggleKey];
                            return (
                              <div key={key} className="bg-gray-50 px-2 py-1 rounded text-xs flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-gray-700">{key}</span>
                                  <div className="text-gray-600 font-mono">
                                    {isVisible ? value : '••••••••'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleShowValue(secret.name, key)}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                  {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            );
                          })}
                          {Object.keys(secret.data).length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{Object.keys(secret.data).length - 3} more entries
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Labels */}
                    {Object.keys(secret.labels).length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 mb-1">Labels:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(secret.labels).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete confirmation warning */}
                    {deleteConfirm === secret.name && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Confirm deletion</span>
                        </div>
                        <div>
                          This will remove the Secret and any references to it in deployments.
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {secrets.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No Secrets</h5>
                    <p className="text-sm text-gray-500">
                      Create your first Secret to store sensitive data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}