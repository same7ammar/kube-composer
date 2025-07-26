import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy } from 'lucide-react';
import { CustomResourceDefinition } from '../types';
import { YamlPreview } from './YamlPreview';

interface CrdYamlViewerProps {
  crd: CustomResourceDefinition | null;
  onClose: () => void;
}

/**
 * Component for displaying a CRD's YAML
 */
export const CrdYamlViewer: React.FC<CrdYamlViewerProps> = ({
  crd,
  onClose
}) => {
  if (!crd) return null;

  const yaml = crd.rawYaml || '# YAML not available';
  
  const copyToClipboard = () => {
    if (crd.rawYaml) {
      navigator.clipboard.writeText(crd.rawYaml);
    }
  };

  // Create a portal element for the modal
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Find the modal root element or create it if it doesn't exist
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  if (!modalRoot) {
    return null;
  }
  
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            CRD: {crd.name}
          </h2>
          <div className="flex items-center">
            <button
              onClick={copyToClipboard}
              className="mr-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
              title="Copy YAML"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* YAML Content */}
        <div className="overflow-auto flex-grow">
          <YamlPreview yaml={yaml} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, modalRoot);
};
