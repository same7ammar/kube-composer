import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, FileText, Calendar, Tag } from 'lucide-react';
import type { ConfigMap } from '../types';

interface ConfigMapsListProps {
  configMaps: ConfigMap[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (configMapName: string) => void;
  onDuplicate: (index: number) => void;
}

export function ConfigMapsList({ 
  configMaps, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: ConfigMapsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (configMapName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(configMapName);
  };

  const handleConfirmDelete = (configMapName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(configMapName);
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

  if (configMaps.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No ConfigMaps</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create ConfigMaps to store configuration data for your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {configMaps.map((configMap, index) => (
        <div
          key={configMap.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-green-50 border-green-200 ring-1 ring-green-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate">
                    {configMap.name}
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {configMap.namespace}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(configMap.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{Object.keys(configMap.data).length} key{Object.keys(configMap.data).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === configMap.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(configMap.name, e)}
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
                    title="Edit ConfigMap"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors duration-200"
                    title="Duplicate ConfigMap"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(configMap.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Delete ConfigMap"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Labels and Data Preview */}
          {(Object.keys(configMap.labels).length > 0 || Object.keys(configMap.data).length > 0) && (
            <div className="mt-2 space-y-1">
              {Object.keys(configMap.labels).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-gray-500">Labels:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(configMap.labels).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(configMap.labels).length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{Object.keys(configMap.labels).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {Object.keys(configMap.data).length > 0 && (
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">Data:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(configMap.data).slice(0, 3).map((key) => (
                      <span key={key} className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        {key}
                      </span>
                    ))}
                    {Object.keys(configMap.data).length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{Object.keys(configMap.data).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Delete confirmation warning */}
          {deleteConfirm === configMap.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the ConfigMap and remove it from any deployments that reference it.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}