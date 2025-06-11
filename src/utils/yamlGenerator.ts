import type { DeploymentConfig, KubernetesResource, Namespace } from '../types';

export function generateKubernetesYaml(config: DeploymentConfig): string {
  if (!config.appName) {
    return '# Please configure your deployment first';
  }

  const resources: KubernetesResource[] = [];

  // Generate Deployment
  const deployment: KubernetesResource = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: config.appName,
      namespace: config.namespace,
      labels: {
        app: config.appName,
        ...config.labels
      },
      ...(Object.keys(config.annotations).length > 0 && { annotations: config.annotations })
    },
    spec: {
      replicas: config.replicas,
      selector: {
        matchLabels: {
          app: config.appName
        }
      },
      template: {
        metadata: {
          labels: {
            app: config.appName,
            ...config.labels
          }
        },
        spec: {
          containers: [
            {
              name: config.appName,
              image: config.image,
              ports: [
                {
                  containerPort: config.targetPort
                }
              ],
              ...(config.env.length > 0 && {
                env: config.env.map(e => ({ name: e.name, value: e.value }))
              }),
              ...(config.volumes.length > 0 && {
                volumeMounts: config.volumes.map(v => ({
                  name: v.name,
                  mountPath: v.mountPath
                }))
              }),
              ...((config.resources.requests.cpu || config.resources.requests.memory || 
                  config.resources.limits.cpu || config.resources.limits.memory) && {
                resources: {
                  ...(config.resources.requests.cpu || config.resources.requests.memory) && {
                    requests: {
                      ...(config.resources.requests.cpu && { cpu: config.resources.requests.cpu }),
                      ...(config.resources.requests.memory && { memory: config.resources.requests.memory })
                    }
                  },
                  ...(config.resources.limits.cpu || config.resources.limits.memory) && {
                    limits: {
                      ...(config.resources.limits.cpu && { cpu: config.resources.limits.cpu }),
                      ...(config.resources.limits.memory && { memory: config.resources.limits.memory })
                    }
                  }
                }
              })
            }
          ],
          ...(config.volumes.length > 0 && {
            volumes: config.volumes.map(v => ({
              name: v.name,
              ...(v.type === 'emptyDir' && { emptyDir: {} }),
              ...(v.type === 'configMap' && { configMap: { name: v.name } }),
              ...(v.type === 'secret' && { secret: { secretName: v.name } })
            }))
          })
        }
      }
    }
  };

  resources.push(deployment);

  // Generate Service
  const service: KubernetesResource = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${config.appName}-service`,
      namespace: config.namespace,
      labels: {
        app: config.appName,
        ...config.labels
      }
    },
    spec: {
      selector: {
        app: config.appName
      },
      ports: [
        {
          port: config.port,
          targetPort: config.targetPort,
          protocol: 'TCP'
        }
      ],
      type: config.serviceType
    }
  };

  resources.push(service);

  // Generate ConfigMaps
  config.configMaps.forEach(cm => {
    const configMap: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: cm.name,
        namespace: config.namespace,
        labels: {
          app: config.appName,
          ...config.labels
        }
      },
      data: cm.data
    };
    resources.push(configMap);
  });

  // Generate Secrets
  config.secrets.forEach(secret => {
    const secretResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secret.name,
        namespace: config.namespace,
        labels: {
          app: config.appName,
          ...config.labels
        }
      },
      type: 'Opaque',
      data: Object.fromEntries(
        Object.entries(secret.data).map(([key, value]) => [key, btoa(value)])
      )
    };
    resources.push(secretResource);
  });

  // Convert to YAML
  return resources.map(resource => {
    const yaml = objectToYaml(resource);
    return yaml;
  }).join('\n---\n');
}

export function generateNamespaceYaml(namespaces: Namespace[]): string {
  if (namespaces.length === 0) {
    return '# No namespaces configured';
  }

  // Filter out default namespace and system namespaces
  const customNamespaces = namespaces.filter(ns => 
    !['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(ns.name)
  );

  if (customNamespaces.length === 0) {
    return `# Only system namespaces available
# Create custom namespaces to see their YAML configuration here

# Available system namespaces:
${namespaces.map(ns => `# - ${ns.name}`).join('\n')}

# Example custom namespace:
apiVersion: v1
kind: Namespace
metadata:
  name: my-custom-namespace
  labels:
    environment: development
    team: backend
  annotations:
    description: "Custom namespace for development environment"
    created-by: "kube-composer"`;
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Custom Kubernetes Namespaces`);
  allResources.push(`# Generated by Kube Composer`);
  allResources.push(`# Total namespaces: ${customNamespaces.length}`);
  allResources.push('');

  // Generate YAML for each custom namespace
  customNamespaces.forEach((namespace, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    const namespaceResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace.name,
        ...(Object.keys(namespace.labels).length > 0 && { labels: namespace.labels }),
        ...(Object.keys(namespace.annotations).length > 0 && { annotations: namespace.annotations })
      }
    };

    allResources.push(objectToYaml(namespaceResource));
  });

  return allResources.join('\n');
}

export function generateMultiDeploymentYaml(deployments: DeploymentConfig[], namespaces: Namespace[] = []): string {
  if (deployments.length === 0 && namespaces.length <= 1) {
    return `# Welcome to Kube Composer!
# 
# This is a free Kubernetes YAML generator that helps you create
# production-ready deployment configurations without writing YAML manually.
#
# To get started:
# 1. Click "Add Deployment" to create your first deployment
# 2. Configure your application settings in the form
# 3. Watch as your YAML is generated in real-time
# 4. Download the complete YAML file when ready
#
# Features:
# - Visual deployment editor
# - Multi-deployment support  
# - Real-time YAML generation
# - Architecture visualization
# - Resource validation
# - Production-ready output
#
# No registration required - start building now!

apiVersion: v1
kind: ConfigMap
metadata:
  name: getting-started
  namespace: default
data:
  welcome: |
    Welcome to Kube Composer!
    Create your first deployment to see generated YAML here.
  docs: "Visit https://kubernetes.io/docs/ for Kubernetes documentation"
  repository: "https://github.com/same7ammar/kube-composer"`;
  }

  const allResources: string[] = [];

  // Get custom namespaces (excluding system namespaces)
  const customNamespaces = namespaces.filter(ns => 
    !['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(ns.name)
  );

  // Add header comment
  if (deployments.length > 0 || customNamespaces.length > 0) {
    allResources.push(`# Kubernetes Configuration`);
    allResources.push(`# Generated by Kube Composer`);
    
    if (customNamespaces.length > 0) {
      allResources.push(`# Custom Namespaces: ${customNamespaces.length}`);
    }
    if (deployments.length > 0) {
      allResources.push(`# Deployments: ${deployments.filter(d => d.appName).length}`);
    }
    allResources.push('');
  }

  // Generate namespace resources for custom namespaces
  if (customNamespaces.length > 0) {
    allResources.push('# === NAMESPACES ===');
    customNamespaces.forEach((namespace, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      const namespaceResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: namespace.name,
          ...(Object.keys(namespace.labels).length > 0 && { labels: namespace.labels }),
          ...(Object.keys(namespace.annotations).length > 0 && { annotations: namespace.annotations })
        }
      };

      allResources.push(objectToYaml(namespaceResource));
    });
    
    if (deployments.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate YAML for each deployment
  if (deployments.length > 0) {
    const validDeployments = deployments.filter(d => d.appName);
    
    if (validDeployments.length === 0) {
      if (customNamespaces.length === 0) {
        return `# Deployment Configuration Needed
#
# You have ${deployments.length} deployment${deployments.length !== 1 ? 's' : ''} but none have been properly configured yet.
# 
# To generate YAML:
# 1. Select a deployment from the sidebar
# 2. Click the edit button (⚙️) to configure it
# 3. Add at least an application name and container image
# 4. Your YAML will appear here automatically`;
      }
    } else {
      if (customNamespaces.length > 0) {
        allResources.push('# === DEPLOYMENTS ===');
      }

      validDeployments.forEach((deployment, index) => {
        if (index > 0) {
          allResources.push(''); // Add spacing between deployments
        }
        
        if (validDeployments.length > 1) {
          allResources.push(`# === ${deployment.appName.toUpperCase()} DEPLOYMENT ===`);
        }
        
        const deploymentYaml = generateKubernetesYaml(deployment);
        allResources.push(deploymentYaml);
      });
    }
  }

  return allResources.join('\n');
}

function objectToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    yaml += `${spaces}${key}:`;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += '\n' + objectToYaml(value, indent + 1);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        yaml += ' []\n';
      } else {
        yaml += '\n';
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${objectToYaml(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      }
    } else {
      yaml += ` ${value}\n`;
    }
  }
  
  return yaml;
}