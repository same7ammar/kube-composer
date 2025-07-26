import React, { useState } from 'react';
import { FileText, Trash2, Edit, Eye, Calendar } from 'lucide-react';
import { CustomResource, CustomResourceDefinition } from '../types';

// Simple Tooltip Component
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${
            position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900' :
            position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900' :
            position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900' :
            'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
          }`} />
        </div>
      )}
    </div>
  );
};

interface CustomResourcesListProps {
  customResources: CustomResource[];
  crds: CustomResourceDefinition[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onEdit: (cr: CustomResource) => void;
  onViewYaml: (cr: CustomResource) => void;
}

export const CustomResourcesList: React.FC<CustomResourcesListProps> = ({
  customResources,
  crds,
  selectedIndex,
  onSelect,
  onDelete,
  onEdit,
  onViewYaml
}) => {
  if (customResources.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <FileText className="w-8 h-8 mx-auto" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No Custom Resources
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Create resources from imported CRDs
        </p>
      </div>
    );
  }

  const getCrdForResource = (cr: CustomResource): CustomResourceDefinition | undefined => {
    return crds.find(crd => crd.id === cr.crdId);
  };

  return (
    <div className="space-y-2">
      {customResources.map((cr, index) => {
        const crd = getCrdForResource(cr);
        const isSelected = selectedIndex === index;
        
        return (
          <div
            key={cr.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
            onClick={() => onSelect(index)}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {cr.name}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <Tooltip content="View YAML" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewYaml(cr);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Edit Resource" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cr);
                    }}
                    className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Delete Resource" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(index);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            
            {/* Details Row */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Kind:</span>
                <span className="text-purple-600 dark:text-purple-400">{cr.kind}</span>
              </div>
              
              {crd && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">CRD:</span>
                  <span className="text-gray-600 dark:text-gray-300">{crd.name}</span>
                </div>
              )}
              
              {cr.namespace && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Namespace:</span>
                  <span className="text-gray-600 dark:text-gray-300">{cr.namespace}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span>{new Date(cr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 