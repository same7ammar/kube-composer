import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface DeploymentsListProps {
  deployments: DeploymentConfig[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: () => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}

export function DeploymentsList({ 
  deployments, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: DeploymentsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleDeleteClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(index);
  };

  const handleConfirmDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(index);
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

  return (
    <div className="space-y-1 p-4">
      {deployments.map((deployment, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                deployment.appName ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {deployment.appName || 'Untitled Deployment'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {deployment.image || 'No image specified'}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === index ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(index, e)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(index);
                      onEdit();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                    title="Edit deployment"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                    title="Duplicate deployment"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(index, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Delete deployment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Delete confirmation warning */}
          {deleteConfirm === index && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                {deployments.length === 1 
                  ? 'This will reset the deployment to default values.'
                  : 'This action cannot be undone.'
                }
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}