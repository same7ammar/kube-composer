/**
 * Utility functions for parsing YAML in Kubernetes resources
 */
import jsYaml from 'js-yaml';

/**
 * Parse YAML string to JavaScript object
 * @param yaml YAML string to parse
 * @returns Parsed JavaScript object
 */
export const parseYaml = (yaml: string): any => {
  try {
    return jsYaml.load(yaml);
  } catch (err) {
    console.error('Error parsing YAML:', err);
    throw err;
  }
};

/**
 * Convert JavaScript object to YAML string
 * @param obj JavaScript object to convert
 * @returns YAML string representation
 */
export const toYaml = (obj: any): string => {
  try {
    return jsYaml.dump(obj, {
      lineWidth: -1, // Don't wrap lines
      noRefs: true,   // Don't use references
      indent: 2       // 2-space indentation
    });
  } catch (err) {
    console.error('Error generating YAML:', err);
    throw err;
  }
};
