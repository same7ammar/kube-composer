import type { DeploymentConfig, DaemonSetConfig, KubernetesResource, Namespace, ConfigMap, Secret, ServiceAccount, ProjectSettings, JobConfig, CronJobConfig, Container, EnvVar, DockerHubSecret, KubernetesRole, KubernetesClusterRole, PolicyRule } from '../types';

export function generateKubernetesYaml(config: DeploymentConfig, projectSettings?: ProjectSettings): string {
  if (!config.appName) {
    return '# Please configure your deployment first';
  }

  const resources: KubernetesResource[] = [];

  // Merge global labels with deployment labels
  const mergedLabels = projectSettings ? {
    ...projectSettings.globalLabels,
    ...config.labels,
    project: projectSettings.name
  } : config.labels;

  // Create selector labels that include the project label
  const selectorLabels = {
    'app.kubernetes.io/name': config.appName,
    ...(projectSettings && { project: projectSettings.name })
  };

  // Generate Deployment
  const deployment: KubernetesResource = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: config.appName,
      namespace: config.namespace,
      labels: {
        'app.kubernetes.io/name': config.appName,
        ...mergedLabels
      },
      ...(Object.keys(config.annotations).length > 0 && { annotations: config.annotations })
    },
    spec: {
      replicas: config.replicas,
      selector: {
        matchLabels: selectorLabels
      },
      template: {
        metadata: {
          labels: {
            'app.kubernetes.io/name': config.appName,
            ...mergedLabels
          }
        },
        spec: {
          ...(config.serviceAccount && { serviceAccountName: config.serviceAccount }),
          containers: generateContainers(config),
          ...(config.volumes.length > 0 && {
            volumes: config.volumes.map(v => ({
              name: v.name,
              ...(v.type === 'emptyDir' && { emptyDir: {} }),
              ...(v.type === 'configMap' && { configMap: { name: v.configMapName || v.name } }),
              ...(v.type === 'secret' && { secret: { secretName: v.secretName || v.name } })
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
        'app.kubernetes.io/name': config.appName,
        ...mergedLabels
      }
    },
    spec: {
      selector: selectorLabels, // Use the same selector labels as the deployment
      ports: generateServicePorts(config),
      type: config.serviceType
    }
  };

  resources.push(service);

  // Generate Ingress if enabled
  if (config.ingress.enabled && config.ingress.rules.length > 0) {
    const ingress: KubernetesResource = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${config.appName}-ingress`,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
        },
        ...(Object.keys(config.ingress.annotations).length > 0 && {
          annotations: config.ingress.annotations
        })
      },
      spec: {
        ...(config.ingress.className && { ingressClassName: config.ingress.className }),
        ...(config.ingress.tls.length > 0 && {
          tls: config.ingress.tls.map(tls => ({
            secretName: tls.secretName,
            hosts: tls.hosts.filter(host => host.trim() !== '')
          })).filter(tls => tls.hosts.length > 0)
        }),
        rules: config.ingress.rules.map(rule => ({
          ...(rule.host && { host: rule.host }),
          http: {
            paths: [{
              path: rule.path,
              pathType: rule.pathType,
              backend: {
                service: {
                  name: rule.serviceName,
                  port: {
                    number: rule.servicePort
                  }
                }
              }
            }]
          }
        }))
      }
    };

    resources.push(ingress);
  }

  // Generate ConfigMaps (legacy support)
  config.configMaps.forEach(cm => {
    const configMap: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: cm.name,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
        }
      },
      data: cm.data
    };
    resources.push(configMap);
  });

  // Generate Secrets (legacy support)
  config.secrets.forEach(secret => {
    const secretResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secret.name,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
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

// Generic interface for configs that have containers, port, and targetPort
interface ContainerConfig {
  containers: Container[];
  port: number;
  targetPort: number;
}

function generateContainers(config: ContainerConfig): any[] {
  // Use new containers array if available, otherwise fall back to legacy fields
  if (config.containers && config.containers.length > 0) {
    return config.containers.map(container => {
      const requests = {
        cpu: container.resources.requests.cpu || '100m',
        memory: container.resources.requests.memory || '128Mi'
      };
      const limits: any = {};
      if (container.resources.limits.cpu) limits.cpu = container.resources.limits.cpu;
      if (container.resources.limits.memory) limits.memory = container.resources.limits.memory;
      return {
        name: container.name || 'app',
        image: container.image,
        ...(container.port && {
          ports: [{ containerPort: container.port }]
        }),
        ...(container.env.length > 0 && {
          env: container.env.map((e: EnvVar) => {
            if (e.valueFrom) {
              // Environment variable from ConfigMap or Secret
              return {
                name: e.name,
                valueFrom: e.valueFrom.type === 'configMap' ? {
                  configMapKeyRef: {
                    name: e.valueFrom.name,
                    key: e.valueFrom.key
                  }
                } : {
                  secretKeyRef: {
                    name: e.valueFrom.name,
                    key: e.valueFrom.key
                  }
                }
              };
            } else {
              // Simple environment variable
              return {
                name: e.name,
                value: e.value
              };
            }
          })
        }),
        ...(container.volumeMounts.length > 0 && {
          volumeMounts: container.volumeMounts
        }),
        ...(container.command && { command: [container.command] }),
        ...(container.args && { args: [container.args] }),
        resources: {
          requests,
          ...(Object.keys(limits).length > 0 && { limits })
        }
      };
    });
  }

  // Legacy fallback - this should not be reached for DaemonSets
  return [{
    name: 'app',
    image: (config as any).image || 'nginx:latest',
    ports: [{ containerPort: config.targetPort }],
    env: (config as any).env || [],
    resources: {
      requests: {
        cpu: (config as any).resources?.requests?.cpu || '100m',
        memory: (config as any).resources?.requests?.memory || '128Mi'
      }
    }
  }];
}

function generateServicePorts(config: ContainerConfig): any[] {
  // If using new containers structure, generate ports for all containers
  if (config.containers && config.containers.length > 0) {
    const ports = [];
    
    // Add main service port
    ports.push({
      port: config.port,
      targetPort: config.targetPort,
      protocol: 'TCP',
      name: 'http'
    });

    // Add additional ports for containers that have different ports
    config.containers.forEach((container, index) => {
      if (container.port && container.port !== config.targetPort) {
        ports.push({
          port: container.port,
          targetPort: container.port,
          protocol: 'TCP',
          name: `${container.name || `container-${index}`}-port`
        });
      }
    });

    return ports;
  }

  // Legacy fallback
  return [{
    port: config.port,
    targetPort: config.targetPort,
    protocol: 'TCP'
  }];
}

export function generateNamespaceYaml(namespaces: Namespace[], projectSettings?: ProjectSettings): string {
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
    ${projectSettings ? `project: ${projectSettings.name}` : ''}
  annotations:
    description: "Custom namespace for development environment"
    created-by: "kube-composer"`;
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Custom Kubernetes Namespaces`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total namespaces: ${customNamespaces.length}`);
  allResources.push('');

  // Generate YAML for each custom namespace
  customNamespaces.forEach((namespace, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with namespace labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...namespace.labels,
      project: projectSettings.name
    } : namespace.labels;

    const namespaceResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace.name,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(namespace.annotations).length > 0 && { annotations: namespace.annotations })
      }
    };

    allResources.push(objectToYaml(namespaceResource));
  });

  return allResources.join('\n');
}

export function generateConfigMapYaml(configMaps: ConfigMap[], projectSettings?: ProjectSettings): string {
  if (configMaps.length === 0) {
    return '# No ConfigMaps configured';
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Kubernetes ConfigMaps`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total ConfigMaps: ${configMaps.length}`);
  allResources.push('');

  // Generate YAML for each ConfigMap
  configMaps.forEach((configMap, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with ConfigMap labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...configMap.labels,
      project: projectSettings.name
    } : configMap.labels;

    const configMapResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: configMap.name,
        namespace: configMap.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(configMap.annotations).length > 0 && { annotations: configMap.annotations })
      },
      data: configMap.data
    };

    allResources.push(objectToYaml(configMapResource));
  });

  return allResources.join('\n');
}

export function generateSecretYaml(secrets: Secret[], projectSettings?: ProjectSettings): string {
  if (secrets.length === 0) {
    return '# No Secrets configured';
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Kubernetes Secrets`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total Secrets: ${secrets.length}`);
  allResources.push('');

  // Generate YAML for each Secret
  secrets.forEach((secret, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with Secret labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...secret.labels,
      project: projectSettings.name
    } : secret.labels;

    const secretResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secret.name,
        namespace: secret.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(secret.annotations).length > 0 && { annotations: secret.annotations })
      },
      type: secret.type,
      data: Object.fromEntries(
        Object.entries(secret.data).map(([key, value]) => [key, btoa(value)])
      )
    };

    allResources.push(objectToYaml(secretResource));
  });

  return allResources.join('\n');
}

export function generateServiceAccountYaml(serviceAccounts: ServiceAccount[], projectSettings?: ProjectSettings): string {
  if (serviceAccounts.length === 0) {
    return '# No Service Accounts configured';
  }

  const allResources: string[] = [];

  serviceAccounts.forEach(serviceAccount => {
    // Merge global labels with service account labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...serviceAccount.labels,
      project: projectSettings.name
    } : serviceAccount.labels;

    const serviceAccountResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: serviceAccount.name,
        namespace: serviceAccount.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(serviceAccount.annotations).length > 0 && { annotations: serviceAccount.annotations })
      },
      ...(serviceAccount.secrets && serviceAccount.secrets.length > 0 && {
        secrets: serviceAccount.secrets
      }),
      ...(serviceAccount.imagePullSecrets && serviceAccount.imagePullSecrets.length > 0 && {
        imagePullSecrets: serviceAccount.imagePullSecrets
      }),
      ...(serviceAccount.automountServiceAccountToken !== undefined && {
        automountServiceAccountToken: serviceAccount.automountServiceAccountToken
      })
    };

    allResources.push(objectToYaml(serviceAccountResource));
  });

  return allResources.join('\n');
}

export function generateJobYaml(jobs: JobConfig[], projectSettings?: ProjectSettings): string {
  if (jobs.length === 0) {
    return '# No jobs to generate';
  }

  const resources: KubernetesResource[] = [];

  jobs.forEach(job => {
    // Merge global labels with job labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...job.labels,
      project: projectSettings.name
    } : job.labels;

    const resource: KubernetesResource = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: job.name,
        namespace: job.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(job.annotations).length > 0 && { annotations: job.annotations })
      },
      spec: {
        ...(job.completions && { completions: job.completions }),
        ...(job.parallelism && { parallelism: job.parallelism }),
        ...(job.backoffLimit && { backoffLimit: job.backoffLimit }),
        ...(job.activeDeadlineSeconds && { activeDeadlineSeconds: job.activeDeadlineSeconds }),
        template: {
          spec: {
            restartPolicy: job.restartPolicy,
            containers: job.containers
          }
        }
      }
    };

    resources.push(resource);
  });

  return resources.map(resource => objectToYaml(resource)).join('\n---\n');
}

export function generateCronJobYaml(cronjobs: CronJobConfig[], projectSettings?: ProjectSettings): string {
  if (cronjobs.length === 0) {
    return '# No cronjobs to generate';
  }

  const resources: KubernetesResource[] = [];

  cronjobs.forEach(cronjob => {
    // Merge global labels with cronjob labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...cronjob.labels,
      project: projectSettings.name
    } : cronjob.labels;

    const resource: KubernetesResource = {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      metadata: {
        name: cronjob.name,
        namespace: cronjob.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(cronjob.annotations).length > 0 && { annotations: cronjob.annotations })
      },
      spec: {
        schedule: cronjob.schedule,
        ...(cronjob.concurrencyPolicy && { concurrencyPolicy: cronjob.concurrencyPolicy }),
        ...(cronjob.startingDeadlineSeconds && { startingDeadlineSeconds: cronjob.startingDeadlineSeconds }),
        ...(cronjob.successfulJobsHistoryLimit && { successfulJobsHistoryLimit: cronjob.successfulJobsHistoryLimit }),
        ...(cronjob.failedJobsHistoryLimit && { failedJobsHistoryLimit: cronjob.failedJobsHistoryLimit }),
        jobTemplate: {
          spec: {
            ...(cronjob.jobTemplate.completions && { completions: cronjob.jobTemplate.completions }),
            ...(cronjob.jobTemplate.parallelism && { parallelism: cronjob.jobTemplate.parallelism }),
            ...(cronjob.jobTemplate.backoffLimit && { backoffLimit: cronjob.jobTemplate.backoffLimit }),
            ...(cronjob.jobTemplate.activeDeadlineSeconds && { activeDeadlineSeconds: cronjob.jobTemplate.activeDeadlineSeconds }),
            template: {
              spec: {
                restartPolicy: cronjob.jobTemplate.restartPolicy,
                containers: cronjob.jobTemplate.containers
              }
            }
          }
        }
      }
    };

    resources.push(resource);
  });

  return resources.map(resource => objectToYaml(resource)).join('\n---\n');
}

export function generateMultiDeploymentYaml(
  deployments: DeploymentConfig[], 
  namespaces: Namespace[] = [], 
  configMaps: ConfigMap[] = [], 
  secrets: Secret[] = [],
  projectSettings?: ProjectSettings,
  jobs: JobConfig[] = [],
  cronjobs: CronJobConfig[] = [],
  daemonSets: DaemonSetConfig[] = [],
  serviceAccounts: ServiceAccount[] = [],
  dockerHubSecrets: DockerHubSecret[] = [],
  roles: KubernetesRole[] = [],
  clusterRoles: KubernetesClusterRole[] = [],
  roleBindings: import('../types').RoleBinding[] = [],
  persistentVolumes: import('../types').PersistentVolume[] = [],
  persistentVolumeClaims: import('../types').PersistentVolumeClaim[] = [],
  storageClasses: import('../types').StorageClass[] = []
): string {
  // Check if we have any meaningful content
  if (
    deployments.length === 0 &&
    namespaces.length <= 1 &&
    configMaps.length === 0 &&
    secrets.length === 0 &&
    dockerHubSecrets.length === 0 &&
    jobs.length === 0 &&
    cronjobs.length === 0 &&
    daemonSets.length === 0 &&
    serviceAccounts.length === 0 &&
    roles.length === 0 &&
    clusterRoles.length === 0 &&
    roleBindings.length === 0 &&
    persistentVolumes.length === 0 &&
    persistentVolumeClaims.length === 0 &&
    storageClasses.length === 0
  ) {
    return `# Welcome to Kube Composer!
# 
# This is a free Kubernetes YAML generator that helps you create
# production-ready deployment configurations without writing YAML manually.
#
# To get started:
# 1. Click "Project Settings" to configure your project name and global labels
# 2. Click "Add Deployment" to create your first deployment
# 3. Configure your application settings in the form
# 4. Watch as your YAML is generated in real-time
# 5. Download the complete YAML file when ready
#
# Features:
# - Project-wide settings and global labels
# - Visual deployment editor
# - Multi-container support
# - Multi-deployment support  
# - Real-time YAML generation
# - Architecture visualization
# - Resource validation
# - Production-ready output
# - ConfigMap and Secret management
# - DaemonSet support
#
# No registration required - start building now!

apiVersion: v1
kind: ConfigMap
metadata:
  name: getting-started
  namespace: default
  labels:
    app.kubernetes.io/name: getting-started
    ${projectSettings ? `project: ${projectSettings.name}` : 'project: my-project'}
    created-by: kube-composer
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
  if (deployments.length > 0 || daemonSets.length > 0 || customNamespaces.length > 0 || configMaps.length > 0 || secrets.length > 0 || dockerHubSecrets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || serviceAccounts.length > 0 || roles.length > 0 || clusterRoles.length > 0 || roleBindings.length > 0 || persistentVolumes.length > 0 || persistentVolumeClaims.length > 0 || storageClasses.length > 0) {
    allResources.push(`# Kubernetes Configuration`);
    allResources.push(`# Generated by Kube Composer`);
    
    if (projectSettings) {
      allResources.push(`# Project: ${projectSettings.name}`);
      if (projectSettings.description) {
        allResources.push(`# Description: ${projectSettings.description}`);
      }
      if (Object.keys(projectSettings.globalLabels).length > 0) {
        allResources.push(`# Global Labels: ${Object.keys(projectSettings.globalLabels).length} defined`);
      }
    }
    
    if (customNamespaces.length > 0) {
      allResources.push(`# Custom Namespaces: ${customNamespaces.length}`);
    }
    if (configMaps.length > 0) {
      allResources.push(`# ConfigMaps: ${configMaps.length}`);
    }
    if (secrets.length > 0) {
      allResources.push(`# Secrets: ${secrets.length}`);
    }
    if (dockerHubSecrets.length > 0) {
      allResources.push(`# Docker Hub Secrets: ${dockerHubSecrets.length}`);
    }
    if (serviceAccounts.length > 0) {
      allResources.push(`# Service Accounts: ${serviceAccounts.length}`);
    }
    if (roles.length > 0) {
      allResources.push(`# Roles: ${roles.length}`);
    }
    if (clusterRoles.length > 0) {
      allResources.push(`# ClusterRoles: ${clusterRoles.length}`);
    }
    if (roleBindings.length > 0) {
      allResources.push(`# RoleBindings: ${roleBindings.length}`);
    }
    if (deployments.length > 0) {
      allResources.push(`# Deployments: ${deployments.filter(d => d.appName).length}`);
      const totalContainers = deployments.reduce((sum, d) => sum + (d.containers?.length || 1), 0);
      allResources.push(`# Total Containers: ${totalContainers}`);
      const ingressCount = deployments.filter(d => d.ingress?.enabled).length;
      if (ingressCount > 0) {
        allResources.push(`# Ingress Resources: ${ingressCount}`);
      }
    }
    if (daemonSets.length > 0) {
      allResources.push(`# DaemonSets: ${daemonSets.filter(d => d.appName).length}`);
      const totalContainers = daemonSets.reduce((sum, d) => sum + (d.containers?.length || 1), 0);
      allResources.push(`# Total DaemonSet Containers: ${totalContainers}`);
    }
    if (jobs.length > 0) {
      allResources.push(`# Jobs: ${jobs.length}`);
    }
    if (cronjobs.length > 0) {
      allResources.push(`# CronJobs: ${cronjobs.length}`);
    }
    if (storageClasses.length > 0) {
      allResources.push(`# StorageClasses: ${storageClasses.length}`);
    }
    if (persistentVolumes.length > 0) {
      allResources.push(`# PersistentVolumes: ${persistentVolumes.length}`);
    }
    if (persistentVolumeClaims.length > 0) {
      allResources.push(`# PersistentVolumeClaims: ${persistentVolumeClaims.length}`);
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

      // Merge global labels with namespace labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...namespace.labels,
        project: projectSettings.name
      } : namespace.labels;

      const namespaceResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: namespace.name,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(namespace.annotations).length > 0 && { annotations: namespace.annotations })
        }
      };

      allResources.push(objectToYaml(namespaceResource));
    });
    
    if (configMaps.length > 0 || secrets.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate ConfigMap resources
  if (configMaps.length > 0) {
    allResources.push('# === CONFIGMAPS ===');
    configMaps.forEach((configMap, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with ConfigMap labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...configMap.labels,
        project: projectSettings.name
      } : configMap.labels;

      const configMapResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name: configMap.name,
          namespace: configMap.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(configMap.annotations).length > 0 && { annotations: configMap.annotations })
        },
        data: configMap.data
      };

      allResources.push(objectToYaml(configMapResource));
    });
    
    if (secrets.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate Secret resources
  if (secrets.length > 0) {
    allResources.push('# === SECRETS ===');
    secrets.forEach((secret, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with Secret labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...secret.labels,
        project: projectSettings.name
      } : secret.labels;

      const secretResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: secret.name,
          namespace: secret.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(secret.annotations).length > 0 && { annotations: secret.annotations })
        },
        type: secret.type,
        data: Object.fromEntries(
          Object.entries(secret.data).map(([key, value]) => [key, btoa(value)])
        )
      };

      allResources.push(objectToYaml(secretResource));
    });
    
    if (dockerHubSecrets.length > 0 || serviceAccounts.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate Docker Hub Secret resources
  if (dockerHubSecrets.length > 0) {
    allResources.push('# === DOCKER HUB SECRETS ===');
    dockerHubSecrets.forEach((secret, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with Secret labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...secret.labels,
        project: projectSettings.name
      } : secret.labels;

      // Create Docker config JSON
      const dockerConfig = {
        auths: {
          [secret.dockerServer]: {
            username: secret.username,
            password: secret.password,
            email: secret.email,
            auth: btoa(`${secret.username}:${secret.password}`)
          }
        }
      };

      // Convert to base64
      const dockerConfigJson = btoa(JSON.stringify(dockerConfig));

      const secretResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: secret.name,
          namespace: secret.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(secret.annotations).length > 0 && { annotations: secret.annotations })
        },
        type: 'kubernetes.io/dockerconfigjson',
        data: {
          '.dockerconfigjson': dockerConfigJson
        }
      };

      allResources.push(objectToYaml(secretResource));
    });
    
    if (serviceAccounts.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate Service Account resources
  if (serviceAccounts.length > 0) {
    allResources.push('# === SERVICE ACCOUNTS ===');
    serviceAccounts.forEach((serviceAccount, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with service account labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...serviceAccount.labels,
        project: projectSettings.name
      } : serviceAccount.labels;

      const serviceAccountResource: KubernetesResource = {
        apiVersion: 'v1',
        kind: 'ServiceAccount',
        metadata: {
          name: serviceAccount.name,
          namespace: serviceAccount.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(serviceAccount.annotations).length > 0 && { annotations: serviceAccount.annotations })
        },
        ...(serviceAccount.secrets && serviceAccount.secrets.length > 0 && {
          secrets: serviceAccount.secrets
        }),
        ...(serviceAccount.imagePullSecrets && serviceAccount.imagePullSecrets.length > 0 && {
          imagePullSecrets: serviceAccount.imagePullSecrets
        }),
        ...(serviceAccount.automountServiceAccountToken !== undefined && {
          automountServiceAccountToken: serviceAccount.automountServiceAccountToken
        })
      };

      allResources.push(objectToYaml(serviceAccountResource));
    });
    
    if (roles.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate Role resources
  if (roles.length > 0) {
    allResources.push('# === RBAC ROLES ===');
    roles.forEach((role, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with role labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...role.metadata.labels,
        project: projectSettings.name
      } : role.metadata.labels;

      const roleResource: any = {
        apiVersion: role.apiVersion,
        kind: role.kind,
        metadata: {
          name: role.metadata.name,
          namespace: role.metadata.namespace,
          ...(Object.keys(mergedLabels || {}).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(role.metadata.annotations || {}).length > 0 && { annotations: role.metadata.annotations })
        },
        rules: role.rules.map((rule: PolicyRule) => ({
          apiGroups: rule.apiGroups,
          resources: rule.resources,
          verbs: rule.verbs,
          ...(rule.resourceNames && rule.resourceNames.length > 0 && {
            resourceNames: rule.resourceNames
          })
        }))
      };

      allResources.push(objectToYaml(roleResource));
    });
    
    if (clusterRoles.length > 0 || deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate ClusterRole resources
  if (clusterRoles.length > 0) {
    allResources.push('# === RBAC CLUSTER ROLES ===');
    clusterRoles.forEach((clusterRole, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with cluster role labels (note: no namespace)
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...clusterRole.metadata.labels,
        project: projectSettings.name
      } : clusterRole.metadata.labels;

      const clusterRoleResource: any = {
        apiVersion: clusterRole.apiVersion,
        kind: clusterRole.kind,
        metadata: {
          name: clusterRole.metadata.name,
          // Note: ClusterRoles do not have a namespace field
          ...(Object.keys(mergedLabels || {}).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(clusterRole.metadata.annotations || {}).length > 0 && { annotations: clusterRole.metadata.annotations })
        },
        rules: clusterRole.rules.map((rule: PolicyRule) => ({
          apiGroups: rule.apiGroups,
          resources: rule.resources,
          verbs: rule.verbs,
          ...(rule.resourceNames && rule.resourceNames.length > 0 && {
            resourceNames: rule.resourceNames
          })
        }))
      };

      allResources.push(objectToYaml(clusterRoleResource));
    });
    
    if (deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate RoleBinding resources
  if (roleBindings.length > 0) {
    allResources.push('# === RBAC ROLEBINDINGS ===');
    roleBindings.forEach((binding, index) => {
      if (index > 0) {
        allResources.push('---');
      }
      allResources.push(generateRoleBindingYAML(binding));
    });
    if (deployments.length > 0 || daemonSets.length > 0 || jobs.length > 0 || cronjobs.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate DaemonSet resources
  if (daemonSets.length > 0) {
    allResources.push('# === DAEMONSETS ===');
    daemonSets.forEach((daemonSet, index) => {
      if (index > 0) {
        allResources.push('---');
      }

      // Merge global labels with daemonset labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...daemonSet.labels,
        project: projectSettings.name
      } : daemonSet.labels;

      // Create selector labels that include the project label
      const selectorLabels = {
        'app.kubernetes.io/name': daemonSet.appName,
        ...(projectSettings && { project: projectSettings.name })
      };

      // Generate DaemonSet
      const daemonSetResource: KubernetesResource = {
        apiVersion: 'apps/v1',
        kind: 'DaemonSet',
        metadata: {
          name: daemonSet.appName,
          namespace: daemonSet.namespace,
          labels: {
            'app.kubernetes.io/name': daemonSet.appName,
            ...mergedLabels
          },
          ...(Object.keys(daemonSet.annotations).length > 0 && { annotations: daemonSet.annotations })
        },
        spec: {
          selector: {
            matchLabels: selectorLabels
          },
          template: {
            metadata: {
              labels: {
                'app.kubernetes.io/name': daemonSet.appName,
                ...mergedLabels
              }
            },
            spec: {
              containers: generateContainers(daemonSet),
              ...(daemonSet.volumes.length > 0 && {
                volumes: daemonSet.volumes.map(v => ({
                  name: v.name,
                  ...(v.type === 'emptyDir' && { emptyDir: {} }),
                  ...(v.type === 'configMap' && { configMap: { name: v.configMapName || v.name } }),
                  ...(v.type === 'secret' && { secret: { secretName: v.secretName || v.name } })
                }))
              }),
              ...(daemonSet.nodeSelector && Object.keys(daemonSet.nodeSelector).length > 0 && {
                nodeSelector: daemonSet.nodeSelector
              })
            }
          }
        }
      };

      allResources.push(objectToYaml(daemonSetResource));

      // Generate Service only if enabled
      if (daemonSet.serviceEnabled) {
        const serviceResource: KubernetesResource = {
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: `${daemonSet.appName}-service`,
            namespace: daemonSet.namespace,
            labels: {
              'app.kubernetes.io/name': daemonSet.appName,
              ...mergedLabels
            }
          },
          spec: {
            selector: selectorLabels,
            ports: generateServicePorts(daemonSet),
            type: daemonSet.serviceType
          }
        };

        allResources.push('---');
        allResources.push(objectToYaml(serviceResource));
      }

      // Generate ConfigMaps (legacy support)
      daemonSet.configMaps.forEach(cm => {
        allResources.push('---');
        const configMapResource: KubernetesResource = {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: {
            name: cm.name,
            namespace: daemonSet.namespace,
            labels: {
              'app.kubernetes.io/name': daemonSet.appName,
              ...mergedLabels
            }
          },
          data: cm.data
        };
        allResources.push(objectToYaml(configMapResource));
      });

      // Generate Secrets (legacy support)
      daemonSet.secrets.forEach(secret => {
        allResources.push('---');
        const secretResource: KubernetesResource = {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: secret.name,
            namespace: daemonSet.namespace,
            labels: {
              'app.kubernetes.io/name': daemonSet.appName,
              ...mergedLabels
            }
          },
          type: 'Opaque',
          data: Object.fromEntries(
            Object.entries(secret.data).map(([key, value]) => [key, btoa(value)])
          )
        };
        allResources.push(objectToYaml(secretResource));
      });
    });
    
    if (deployments.length > 0 || jobs.length > 0 || cronjobs.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
  }

  // Generate YAML for each deployment
  if (deployments.length > 0) {
    const validDeployments = deployments.filter(d => d.appName);
    
    if (validDeployments.length === 0) {
      if (customNamespaces.length === 0 && configMaps.length === 0 && secrets.length === 0) {
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
      if (customNamespaces.length > 0 || configMaps.length > 0 || secrets.length > 0) {
        allResources.push('# === DEPLOYMENTS ===');
      }

      validDeployments.forEach((deployment, index) => {
        if (index > 0) {
          allResources.push('---'); // Add YAML separator between deployments
          allResources.push(''); // Add spacing between deployments
        }
        
        if (validDeployments.length > 1) {
          const containerCount = deployment.containers?.length || 1;
          allResources.push(`# === ${deployment.appName.toUpperCase()} DEPLOYMENT ===`);
          allResources.push(`# Containers: ${containerCount}`);
          if (deployment.ingress?.enabled) {
            allResources.push(`# Ingress: Enabled`);
          }
        }
        
        const deploymentYaml = generateKubernetesYaml(deployment, projectSettings);
        allResources.push(deploymentYaml);
      });
    }
  }

  // === JOBS ===
  if (jobs.length > 0 || cronjobs.length > 0) {
    if (customNamespaces.length > 0 || configMaps.length > 0 || secrets.length > 0 || deployments.length > 0 || daemonSets.length > 0 || roleBindings.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
    allResources.push('# === JOBS ===');
    // Add Jobs
    jobs.forEach((job, index) => {
      if (index > 0) {
        allResources.push('---');
        allResources.push('');
      }
      // Merge global labels with job labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...job.labels,
        project: projectSettings.name
      } : job.labels;
      allResources.push(objectToYaml({
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          name: job.name,
          namespace: job.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(job.annotations).length > 0 && { annotations: job.annotations })
        },
        spec: {
          completions: job.completions,
          parallelism: job.parallelism,
          backoffLimit: job.backoffLimit,
          activeDeadlineSeconds: job.activeDeadlineSeconds,
          template: {
            spec: {
              restartPolicy: job.restartPolicy,
              containers: job.containers
            }
          }
        }
      }));
    });
    // Add CronJobs
    cronjobs.forEach((cronjob) => {
      allResources.push('---');
      allResources.push('');
      // Merge global labels with cronjob labels
      const mergedLabels = projectSettings ? {
        ...projectSettings.globalLabels,
        ...cronjob.labels,
        project: projectSettings.name
      } : cronjob.labels;
      allResources.push(objectToYaml({
        apiVersion: 'batch/v1',
        kind: 'CronJob',
        metadata: {
          name: cronjob.name,
          namespace: cronjob.namespace,
          ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
          ...(Object.keys(cronjob.annotations).length > 0 && { annotations: cronjob.annotations })
        },
        spec: {
          schedule: cronjob.schedule,
          concurrencyPolicy: cronjob.concurrencyPolicy,
          startingDeadlineSeconds: cronjob.startingDeadlineSeconds,
          successfulJobsHistoryLimit: cronjob.successfulJobsHistoryLimit,
          failedJobsHistoryLimit: cronjob.failedJobsHistoryLimit,
          jobTemplate: {
            spec: {
              completions: cronjob.jobTemplate.completions,
              parallelism: cronjob.jobTemplate.parallelism,
              backoffLimit: cronjob.jobTemplate.backoffLimit,
              activeDeadlineSeconds: cronjob.jobTemplate.activeDeadlineSeconds,
              template: {
                spec: {
                  restartPolicy: cronjob.jobTemplate.restartPolicy,
                  containers: cronjob.jobTemplate.containers
                }
              }
            }
          }
        }
      }));
    });
  }

  // Generate StorageClass resources
  if (storageClasses.length > 0) {
    if (allResources.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
    allResources.push('# === STORAGE CLASSES ===');
    storageClasses.forEach((sc, index) => {
      if (index > 0) {
        allResources.push('---');
      }
      allResources.push(generateStorageClassYaml([sc], projectSettings).replace(/^# No StorageClasses configured\n/, ''));
    });
  }

  // Generate PersistentVolume resources
  if (persistentVolumes.length > 0) {
    if (allResources.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
    allResources.push('# === PERSISTENT VOLUMES ===');
    persistentVolumes.forEach((pv, index) => {
      if (index > 0) {
        allResources.push('---');
      }
      allResources.push(generatePersistentVolumeYaml([pv], projectSettings).replace(/^# No PersistentVolumes configured\n/, ''));
    });
  }

  // Generate PersistentVolumeClaim resources
  if (persistentVolumeClaims.length > 0) {
    if (allResources.length > 0) {
      allResources.push('---');
      allResources.push('');
    }
    allResources.push('# === PERSISTENT VOLUME CLAIMS ===');
    persistentVolumeClaims.forEach((pvc, index) => {
      if (index > 0) {
        allResources.push('---');
      }
      allResources.push(generatePersistentVolumeClaimYaml([pvc], projectSettings).replace(/^# No PersistentVolumeClaims configured\n/, ''));
    });
  }

  return allResources.join('\n');
}

export function generateDaemonSetYaml(config: DaemonSetConfig, projectSettings?: ProjectSettings): string {
  if (!config.appName) {
    return '# Please configure your daemonset first';
  }

  const resources: KubernetesResource[] = [];

  // Merge global labels with daemonset labels
  const mergedLabels = projectSettings ? {
    ...projectSettings.globalLabels,
    ...config.labels,
    project: projectSettings.name
  } : config.labels;

  // Create selector labels that include the project label
  const selectorLabels = {
    'app.kubernetes.io/name': config.appName,
    ...(projectSettings && { project: projectSettings.name })
  };

  // Generate DaemonSet
  const daemonSet: KubernetesResource = {
    apiVersion: 'apps/v1',
    kind: 'DaemonSet',
    metadata: {
      name: config.appName,
      namespace: config.namespace,
      labels: {
        'app.kubernetes.io/name': config.appName,
        ...mergedLabels
      },
      ...(Object.keys(config.annotations).length > 0 && { annotations: config.annotations })
    },
    spec: {
      selector: {
        matchLabels: selectorLabels
      },
      template: {
        metadata: {
          labels: {
            'app.kubernetes.io/name': config.appName,
            ...mergedLabels
          }
        },
        spec: {
          ...(config.serviceAccount && { serviceAccountName: config.serviceAccount }),
          containers: generateContainers(config),
          ...(config.volumes.length > 0 && {
            volumes: config.volumes.map(v => ({
              name: v.name,
              ...(v.type === 'emptyDir' && { emptyDir: {} }),
              ...(v.type === 'configMap' && { configMap: { name: v.configMapName || v.name } }),
              ...(v.type === 'secret' && { secret: { secretName: v.secretName || v.name } })
            }))
          }),
          ...(config.nodeSelector && Object.keys(config.nodeSelector).length > 0 && {
            nodeSelector: config.nodeSelector
          })
        }
      }
    }
  };

  resources.push(daemonSet);

  // Generate Service only if enabled
  if (config.serviceEnabled) {
    const service: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${config.appName}-service`,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
        }
      },
      spec: {
        selector: selectorLabels, // Use the same selector labels as the daemonset
        ports: generateServicePorts(config),
        type: config.serviceType
      }
    };

    resources.push(service);
  }

  // Generate ConfigMaps (legacy support)
  config.configMaps.forEach(cm => {
    const configMap: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: cm.name,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
        }
      },
      data: cm.data
    };
    resources.push(configMap);
  });

  // Generate Secrets (legacy support)
  config.secrets.forEach(secret => {
    const secretResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secret.name,
        namespace: config.namespace,
        labels: {
          'app.kubernetes.io/name': config.appName,
          ...mergedLabels
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

export function generateDockerHubSecretYaml(dockerHubSecrets: DockerHubSecret[], projectSettings?: ProjectSettings): string {
  if (dockerHubSecrets.length === 0) {
    return '# No Docker Hub Secrets configured';
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Kubernetes Docker Hub Secrets`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total Docker Hub Secrets: ${dockerHubSecrets.length}`);
  allResources.push('');

  // Generate YAML for each Docker Hub Secret
  dockerHubSecrets.forEach((secret, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with Secret labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...secret.labels,
      project: projectSettings.name
    } : secret.labels;

    // Create Docker config JSON
    const dockerConfig = {
      auths: {
        [secret.dockerServer]: {
          username: secret.username,
          password: secret.password,
          email: secret.email,
          auth: btoa(`${secret.username}:${secret.password}`)
        }
      }
    };

    // Convert to base64
    const dockerConfigJson = btoa(JSON.stringify(dockerConfig));

    const secretResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secret.name,
        namespace: secret.namespace,
        ...(Object.keys(mergedLabels).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(secret.annotations).length > 0 && { annotations: secret.annotations })
      },
      type: 'kubernetes.io/dockerconfigjson',
      data: {
        '.dockerconfigjson': dockerConfigJson
      }
    };

    allResources.push(objectToYaml(secretResource));
  });

  return allResources.join('\n');
}

export function generateRoleYaml(roles: KubernetesRole[], projectSettings?: ProjectSettings): string {
  if (roles.length === 0) {
    return '# No Roles configured';
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Kubernetes RBAC Roles`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total Roles: ${roles.length}`);
  allResources.push('');

  // Generate YAML for each Role
  roles.forEach((role, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with Role labels
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...role.metadata.labels,
      project: projectSettings.name
    } : role.metadata.labels;

    const roleResource: any = {
      apiVersion: role.apiVersion,
      kind: role.kind,
      metadata: {
        name: role.metadata.name,
        namespace: role.metadata.namespace,
        ...(Object.keys(mergedLabels || {}).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(role.metadata.annotations || {}).length > 0 && { annotations: role.metadata.annotations })
      },
      rules: role.rules.map((rule: PolicyRule) => ({
        apiGroups: rule.apiGroups,
        resources: rule.resources,
        verbs: rule.verbs,
        ...(rule.resourceNames && rule.resourceNames.length > 0 && {
          resourceNames: rule.resourceNames
        })
      }))
    };

    allResources.push(objectToYaml(roleResource));
  });

  return allResources.join('\n');
}

export function generateSingleRoleYaml(role: KubernetesRole, projectSettings?: ProjectSettings): string {
  return generateRoleYaml([role], projectSettings);
}

export function generateClusterRoleYaml(clusterRoles: KubernetesClusterRole[], projectSettings?: ProjectSettings): string {
  if (clusterRoles.length === 0) {
    return '# No ClusterRoles configured';
  }

  const allResources: string[] = [];

  // Add header comment
  allResources.push(`# Kubernetes RBAC ClusterRoles`);
  allResources.push(`# Generated by Kube Composer`);
  if (projectSettings) {
    allResources.push(`# Project: ${projectSettings.name}`);
  }
  allResources.push(`# Total ClusterRoles: ${clusterRoles.length}`);
  allResources.push('');

  // Generate YAML for each ClusterRole
  clusterRoles.forEach((clusterRole, index) => {
    if (index > 0) {
      allResources.push('---');
    }

    // Merge global labels with ClusterRole labels (note: no namespace)
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...clusterRole.metadata.labels,
      project: projectSettings.name
    } : clusterRole.metadata.labels;

    const clusterRoleResource: any = {
      apiVersion: clusterRole.apiVersion,
      kind: clusterRole.kind,
      metadata: {
        name: clusterRole.metadata.name,
        // Note: ClusterRoles do not have a namespace field
        ...(Object.keys(mergedLabels || {}).length > 0 && { labels: mergedLabels }),
        ...(Object.keys(clusterRole.metadata.annotations || {}).length > 0 && { annotations: clusterRole.metadata.annotations })
      },
      rules: clusterRole.rules.map((rule: PolicyRule) => ({
        apiGroups: rule.apiGroups,
        resources: rule.resources,
        verbs: rule.verbs,
        ...(rule.resourceNames && rule.resourceNames.length > 0 && {
          resourceNames: rule.resourceNames
        })
      }))
    };

    allResources.push(objectToYaml(clusterRoleResource));
  });

  return allResources.join('\n');
}

export function generateSingleClusterRoleYaml(clusterRole: KubernetesClusterRole, projectSettings?: ProjectSettings): string {
  return generateClusterRoleYaml([clusterRole], projectSettings);
}

export const generateRoleBindingYAML = (binding: import('../types').RoleBinding): string => {
  const yaml = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: binding.isClusterRoleBinding ? 'ClusterRoleBinding' : 'RoleBinding',
    metadata: {
      name: binding.name,
      ...(binding.namespace && !binding.isClusterRoleBinding && { namespace: binding.namespace })
    },
    subjects: binding.subjects.map(subject => ({
      kind: subject.kind,
      name: subject.name,
      ...(subject.apiGroup && { apiGroup: subject.apiGroup }),
      ...(subject.namespace && { namespace: subject.namespace })
    })),
    roleRef: {
      kind: binding.roleRef.kind,
      name: binding.roleRef.name,
      apiGroup: binding.roleRef.apiGroup
    }
  };
  // Assumes convertToYAML is already defined in this file
  return objectToYaml(yaml);
};

export function generateRoleBindingsYaml(roleBindings: import('../types').RoleBinding[]): string {
  if (!roleBindings || roleBindings.length === 0) return '';
  const allResources: string[] = [];
  allResources.push('# === RBAC ROLEBINDINGS ===');
  roleBindings.forEach((rb, i) => {
    if (i > 0) allResources.push('---');
    allResources.push(generateRoleBindingYAML(rb));
  });
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
            // Handle special YAML characters and empty strings
            const needsQuoting = item === '' || 
                               item === '*' || 
                               typeof item === 'string' && (
                                 item.includes(':') || 
                                 item.includes('#') || 
                                 item.includes('*') ||
                                 item.includes('?') ||
                                 item.includes('[') ||
                                 item.includes(']') ||
                                 item.includes('{') ||
                                 item.includes('}') ||
                                 item.includes('|') ||
                                 item.includes('>') ||
                                 item.includes('@') ||
                                 item.includes('&') ||
                                 item.includes('!') ||
                                 item.includes('%') ||
                                 item.includes('`') ||
                                 item.includes('"') ||
                                 item.includes("'") ||
                                 item.startsWith(' ') ||
                                 item.endsWith(' ')
                               );
            
            if (needsQuoting) {
              // Escape quotes and use double quotes
              const escapedItem = item.replace(/"/g, '\\"');
              yaml += `${spaces}  - "${escapedItem}"\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          }
        });
      }
    } else {
      // Handle special YAML characters for scalar values
      if (typeof value === 'string' && (value === '' || value === '*' || value.includes(':') || value.includes('#'))) {
        const escapedValue = value.replace(/"/g, '\\"');
        yaml += ` "${escapedValue}"\n`;
      } else {
        yaml += ` ${value}\n`;
      }
    }
  }
  
  return yaml;
}

// Storage Resources YAML Generation
export function generatePersistentVolumeYaml(pvs: import('../types').PersistentVolume[], projectSettings?: ProjectSettings): string {
  if (pvs.length === 0) {
    return '# No PersistentVolumes configured';
  }

  const resources: KubernetesResource[] = [];

  pvs.forEach(pv => {
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...pv.labels,
      project: projectSettings.name
    } : pv.labels;

    const pvResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'PersistentVolume',
      metadata: {
        name: pv.name,
        labels: mergedLabels,
        ...(Object.keys(pv.annotations).length > 0 && { annotations: pv.annotations })
      },
      spec: {
        capacity: {
          storage: pv.capacity
        },
        accessModes: pv.accessModes,
        persistentVolumeReclaimPolicy: pv.persistentVolumeReclaimPolicy,
        ...(pv.storageClassName && { storageClassName: pv.storageClassName }),
        volumeMode: pv.volumeMode,
        ...(pv.volumeSource.type === 'hostPath' && pv.volumeSource.hostPath && {
          hostPath: {
            path: pv.volumeSource.hostPath.path,
            ...(pv.volumeSource.hostPath.type && { type: pv.volumeSource.hostPath.type })
          }
        }),
        ...(pv.volumeSource.type === 'nfs' && pv.volumeSource.nfs && {
          nfs: {
            server: pv.volumeSource.nfs.server,
            path: pv.volumeSource.nfs.path,
            ...(pv.volumeSource.nfs.readOnly !== undefined && { readOnly: pv.volumeSource.nfs.readOnly })
          }
        }),
        ...(pv.volumeSource.type === 'local' && pv.volumeSource.local && {
          local: {
            path: pv.volumeSource.local.path
          }
        }),
        ...(pv.volumeSource.type === 'csi' && pv.volumeSource.csi && {
          csi: {
            driver: pv.volumeSource.csi.driver,
            volumeHandle: pv.volumeSource.csi.volumeHandle,
            ...(pv.volumeSource.csi.fsType && { fsType: pv.volumeSource.csi.fsType }),
            ...(pv.volumeSource.csi.volumeAttributes && { volumeAttributes: pv.volumeSource.csi.volumeAttributes })
          }
        }),
        ...(pv.nodeAffinity && { nodeAffinity: pv.nodeAffinity })
      }
    };

    resources.push(pvResource);
  });

  return resources.map(resource => objectToYaml(resource)).join('\n---\n');
}

export function generatePersistentVolumeClaimYaml(pvcs: import('../types').PersistentVolumeClaim[], projectSettings?: ProjectSettings): string {
  if (pvcs.length === 0) {
    return '# No PersistentVolumeClaims configured';
  }

  const resources: KubernetesResource[] = [];

  pvcs.forEach(pvc => {
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...pvc.labels,
      project: projectSettings.name
    } : pvc.labels;

    const pvcResource: KubernetesResource = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: pvc.name,
        namespace: pvc.namespace,
        labels: mergedLabels,
        ...(Object.keys(pvc.annotations).length > 0 && { annotations: pvc.annotations })
      },
      spec: {
        accessModes: pvc.accessModes,
        resources: {
          requests: {
            storage: pvc.storageRequest
          }
        },
        ...(pvc.storageClassName && { storageClassName: pvc.storageClassName }),
        ...(pvc.volumeName && { volumeName: pvc.volumeName }),
        ...(pvc.volumeMode && { volumeMode: pvc.volumeMode }),
        ...(pvc.selector && { selector: pvc.selector })
      }
    };

    resources.push(pvcResource);
  });

  return resources.map(resource => objectToYaml(resource)).join('\n---\n');
}

export function generateStorageClassYaml(storageClasses: import('../types').StorageClass[], projectSettings?: ProjectSettings): string {
  if (storageClasses.length === 0) {
    return '# No StorageClasses configured';
  }

  const resources: KubernetesResource[] = [];

  storageClasses.forEach(sc => {
    const mergedLabels = projectSettings ? {
      ...projectSettings.globalLabels,
      ...sc.labels,
      project: projectSettings.name
    } : sc.labels;

    const scResource: any = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: {
        name: sc.name,
        labels: mergedLabels,
        ...(Object.keys(sc.annotations).length > 0 && { annotations: sc.annotations })
      },
      provisioner: sc.provisioner,
      ...(Object.keys(sc.parameters).length > 0 && { parameters: sc.parameters }),
      reclaimPolicy: sc.reclaimPolicy,
      volumeBindingMode: sc.volumeBindingMode,
      allowVolumeExpansion: sc.allowVolumeExpansion,
      ...(sc.mountOptions && sc.mountOptions.length > 0 && { mountOptions: sc.mountOptions }),
      ...(sc.allowedTopologies && sc.allowedTopologies.length > 0 && { allowedTopologies: sc.allowedTopologies })
    };

    resources.push(scResource);
  });

  return resources.map(resource => objectToYaml(resource)).join('\n---\n');
}
