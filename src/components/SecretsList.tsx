import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Key, Calendar, Tag, Shield } from 'lucide-react';
import type { Secret } from '../types';

interface SecretsListProps {
  secrets: Secret[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (secretName: string) => void;
  onDuplicate: (index: number) => void;
}

export function SecretsList({ 
  secrets, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: SecretsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (secretName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(secretName);
  };

  const handleConfirmDelete = (secretName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(secretName);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleDuplicateClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(index);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(index);
  };

  const getSecretTypeColor = (type: string) => {
    switch (type) {
      case 'kubernetes.io/tls': return 'bg-green-100 text-green-800';
      case 'kubernetes.io/dockerconfigjson': return 'bg-blue-100 text-blue-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getSecretTypeIcon = (type: string) => {
    switch (type) {
      case 'kubernetes.io/tls': return <Shield className="w-3 h-3" />;
      case 'kubernetes.io/dockerconfigjson': return <Key className="w-3 h-3" />;
      default: return <Key className="w-3 h-3" />;
    }
  };

  if (secrets.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Secrets</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create Secrets to store sensitive data like passwords, tokens, and certificates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {secrets.map((secret, index) => (
        <div
          key={secret.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Key className="w-4 h-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate">
                    {secret.name}
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                    {secret.namespace}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(secret.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{Object.keys(secret.data).length} key{Object.keys(secret.data).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === secret.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(secret.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                // Normal action buttons
                <>
                  <button
                    onClick={(e) => handleEditClick(index, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                    title="Edit Secret"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-orange-600 rounded transition-colors duration-200"
                    title="Duplicate Secret"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(secret.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Delete Secret"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Type, Labels and Data Preview */}
          <div className="mt-2 space-y-1">
            {/* Secret Type */}
            <div className="flex items-center space-x-1">
              {getSecretTypeIcon(secret.type)}
              <span className="text-xs text-gray-500">Type:</span>
              <span className={`px-1 py-0.5 rounded text-xs font-medium ${getSecretTypeColor(secret.type)}`}>
                {secret.type}
              </span>
            </div>

            {/* Labels */}
            {Object.keys(secret.labels).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-500">Labels:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(secret.labels).slice(0, 2).map(([key, value]) => (
                    <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(secret.labels).length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(secret.labels).length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Data Keys */}
            {Object.keys(secret.data).length > 0 && (
              <div className="flex items-center space-x-1">
                <Key className="w-3 h-3 text-red-500" />
                <span className="text-xs text-gray-500">Keys:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(secret.data).slice(0, 3).map((key) => (
                    <span key={key} className="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                      {key}
                    </span>
                  ))}
                  {Object.keys(secret.data).length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(secret.data).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Delete confirmation warning */}
          {deleteConfirm === secret.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the Secret and remove it from any deployments that reference it.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}