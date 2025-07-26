/**
 * Declaration file for js-yaml module
 */
declare module 'js-yaml' {
  export function load(yaml: string, options?: any): any;
  export function dump(obj: any, options?: any): string;
}
