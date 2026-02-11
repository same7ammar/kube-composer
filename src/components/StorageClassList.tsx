import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Layers, Calendar, Tag } from 'lucide-react';
import type { StorageClass } from '../types';

interface StorageClassListProps {
  storageClasses: StorageClass[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (scName: string) => void;
  onDuplicate: (index: number) => void;
}

export function StorageClassList({ 
  storageClasses, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: StorageClassListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (scName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(scName);
  };

  const handleConfirmDelete = (scName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(scName);
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

  if (storageClasses.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
          <Layers className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No StorageClasses</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create StorageClasses to define storage provisioning policies
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {storageClasses.map((sc, index) => (
        <button
          key={sc.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all w-full text-left duration-200 ${
            selectedIndex === index
              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 dark:bg-indigo-900 dark:border-indigo-700 dark:ring-indigo-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {sc.name}
                  </div>
                  {sc.allowVolumeExpansion && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium dark:bg-green-800 dark:text-green-100">
                      Expandable
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2 dark:text-gray-300">
                  <Calendar className="w-3 h-3 dark:text-gray-300" />
                  <span>{new Date(sc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="truncate">{sc.provisioner}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === sc.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(sc.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 dark:bg-red-700 dark:hover:bg-red-800"
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
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-400"
                    title="Edit StorageClass"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-indigo-500"
                    title="Duplicate StorageClass"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(sc.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-500"
                    title="Delete StorageClass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Labels and Details Preview */}
          {(Object.keys(sc.labels).length > 0 || Object.keys(sc.parameters).length > 0) && (
            <div className="mt-2 space-y-1">
              {Object.keys(sc.labels).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-200">Labels:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(sc.labels).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-800 dark:text-blue-100">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(sc.labels).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-200">
                        +{Object.keys(sc.labels).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {Object.keys(sc.parameters).length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-200">Parameters:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(sc.parameters).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs dark:bg-indigo-800 dark:text-indigo-100">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(sc.parameters).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-200">
                        +{Object.keys(sc.parameters).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-300">
                <span className="font-medium">Reclaim:</span> {sc.reclaimPolicy} • 
                <span className="font-medium"> Binding:</span> {sc.volumeBindingMode}
              </div>
            </div>
          )}
          
          {/* Delete confirmation warning */}
          {deleteConfirm === sc.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:text-gray-300 dark:border-red-800">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3 dark:text-gray-300" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the StorageClass and may affect any PVCs using it.
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
