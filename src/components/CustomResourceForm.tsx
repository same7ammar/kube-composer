import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Code, AlertCircle } from 'lucide-react';
import { CustomResourceDefinition, CustomResource, SchemaProperty } from '../types';
import { toYaml } from '../utils/yamlParser';

interface CustomResourceFormProps {
  crd: CustomResourceDefinition;
  onSave: (cr: CustomResource) => void;
  onClose: () => void;
  existingCr?: CustomResource; // For editing existing CRs
}

/**
 * Dynamically generates form controls based on JSON schema
 */
const generateFormControl = (
  propertyName: string,
  property: SchemaProperty,
  value: any,
  onChange: (value: any) => void,
  path: string = ''
): React.ReactNode => {
  const fullPath = path ? `${path}.${propertyName}` : propertyName;
  const currentValue = path ? value?.[path]?.[propertyName] : value?.[propertyName];

  const handleChange = (newValue: any) => {
    if (path) {
      const pathParts = path.split('.');
      const newValueObj = { ...value };
      let current = newValueObj;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]] = current[pathParts[i]] || {};
      }
      current[pathParts[pathParts.length - 1]] = { ...current[pathParts[pathParts.length - 1]], [propertyName]: newValue };
      onChange(newValueObj);
    } else {
      onChange({ ...value, [propertyName]: newValue });
    }
  };

  switch (property.type) {
    case 'string':
      if (property.enum) {
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Select {propertyName}</option>
            {property.enum.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          type="text"
          value={currentValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={property.description || `Enter ${propertyName}`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
        />
      );

    case 'number':
    case 'integer':
      return (
        <input
          type="number"
          value={currentValue || ''}
          onChange={(e) => handleChange(Number(e.target.value))}
          min={property.minimum}
          max={property.maximum}
          placeholder={property.description || `Enter ${propertyName}`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={currentValue || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {property.description || propertyName}
          </span>
        </div>
      );

    case 'array':
      if (property.items) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {propertyName}
              </label>
              <button
                type="button"
                onClick={() => {
                  const newArray = [...(currentValue || []), property.items?.type === 'object' ? {} : ''];
                  handleChange(newArray);
                }}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                Add Item
              </button>
            </div>
            {(currentValue || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                {property.items?.type === 'object' ? (
                  <div className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded">
                    {property.items?.properties && Object.entries(property.items.properties).map(([key, prop]) => (
                      <div key={key} className="mb-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {key}
                        </label>
                        {generateFormControl(key, prop, item, (newValue) => {
                          const newArray = [...(currentValue || [])];
                          newArray[index] = { ...newArray[index], [key]: newValue };
                          handleChange(newArray);
                        }, fullPath)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={item || ''}
                    onChange={(e) => {
                      const newArray = [...(currentValue || [])];
                      newArray[index] = e.target.value;
                      handleChange(newArray);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newArray = [...(currentValue || [])];
                    newArray.splice(index, 1);
                    handleChange(newArray);
                  }}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      }
      return <div>Array type not fully supported</div>;

    case 'object':
      if (property.properties) {
        return (
          <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
            {Object.entries(property.properties).map(([key, prop]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key}
                  {prop.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {generateFormControl(key, prop, value, onChange, fullPath)}
                {prop.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{prop.description}</p>
                )}
              </div>
            ))}
          </div>
        );
      }
      return <div>Object type not fully supported</div>;

    default:
      return <div>Unsupported type: {property.type}</div>;
  }
};

/**
 * Component for creating/editing Custom Resources based on CRD schema
 */
export const CustomResourceForm: React.FC<CustomResourceFormProps> = ({
  crd,
  onSave,
  onClose,
  existingCr
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [crName, setCrName] = useState(existingCr?.name || '');
  const [namespace, setNamespace] = useState(existingCr?.namespace || '');
  const [showYaml, setShowYaml] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Get the storage version schema
  const storageVersion = crd.versions.find(v => v.storage) || crd.versions[0];
  const schema = storageVersion.schema;

  useEffect(() => {
    if (existingCr) {
      setFormData(existingCr.spec || {});
      setCrName(existingCr.name);
      setNamespace(existingCr.namespace || '');
    }
  }, [existingCr]);

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!crName.trim()) {
      newErrors.push('Resource name is required');
    }

    if (crd.scope === 'Namespaced' && !namespace.trim()) {
      newErrors.push('Namespace is required for Namespaced resources');
    }

    // Validate required fields from schema
    if (schema?.required) {
      schema.required.forEach((field) => {
        if (!formData[field]) {
          newErrors.push(`${field} is required`);
        }
      });
    }

    return newErrors;
  };

  const generateYaml = (): string => {
    const cr: CustomResource = {
      id: existingCr?.id || `cr-${Date.now()}`,
      crdId: crd.id,
      name: crName,
      namespace: crd.scope === 'Namespaced' ? namespace : undefined,
      apiVersion: `${crd.group}/${storageVersion.name}`,
      kind: crd.name.split('.')[0],
      spec: formData,
      createdAt: existingCr?.createdAt || new Date().toISOString()
    };

    const yamlObject = {
      apiVersion: cr.apiVersion,
      kind: cr.kind,
      metadata: {
        name: cr.name,
        ...(cr.namespace && { namespace: cr.namespace })
      },
      spec: cr.spec
    };

    return toYaml(yamlObject);
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const cr: CustomResource = {
        id: existingCr?.id || `cr-${Date.now()}`,
        crdId: crd.id,
        name: crName,
        namespace: crd.scope === 'Namespaced' ? namespace : undefined,
        apiVersion: `${crd.group}/${storageVersion.name}`,
        kind: crd.name.split('.')[0],
        spec: formData,
        createdAt: existingCr?.createdAt || new Date().toISOString()
      };

      await onSave(cr);
      onClose();
    } catch (error) {
      setErrors([`Failed to save: ${error}`]);
    } finally {
      setIsSaving(false);
    }
  };

  if (!schema) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Schema Not Available
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This CRD doesn't have a schema defined, so we can't generate a form for it.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {existingCr ? 'Edit' : 'Create'} Custom Resource
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {crd.name.split('.')[0]} ({crd.group})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowYaml(!showYaml)}
              className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors"
              title={showYaml ? 'Show Form' : 'Show YAML'}
            >
              {showYaml ? <Eye className="w-5 h-5" /> : <Code className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                  <ul className="mt-1 text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {showYaml ? (
            /* YAML Preview */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Generated YAML
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {generateYaml()}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            /* Form */
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    value={crName}
                    onChange={(e) => setCrName(e.target.value)}
                    placeholder="Enter resource name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {crd.scope === 'Namespaced' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Namespace *
                    </label>
                    <input
                      type="text"
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      placeholder="Enter namespace"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>

              {/* Schema-based Form */}
              {schema.properties && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Specification</h3>
                  
                  {Object.entries(schema.properties).map(([propertyName, property]) => (
                    <div key={propertyName}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {propertyName}
                        {schema.required?.includes(propertyName) && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {generateFormControl(propertyName, property, formData, setFormData)}
                      {property.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingCr ? 'Update' : 'Create'} Resource
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 