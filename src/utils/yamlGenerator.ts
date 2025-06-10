import type { DeploymentConfig } from '../types';

export function generateKubernetesYaml(config: DeploymentConfig): string {
  if (!config.appName || !config.image) {
    return '# Please provide app name and container image to generate YAML';
  }

  const deployment = generateDeployment(config);
  const service = generateService(config);

  return `${deployment}\n---\n${service}`;
}

function generateDeployment(config: DeploymentConfig): string {
  const hasResources = 
    config.resources.requests.cpu || 
    config.resources.requests.memory || 
    config.resources.limits.cpu || 
    config.resources.limits.memory;

  let yaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.appName}
  namespace: ${config.namespace}
spec:
  replicas: ${config.replicas}
  selector:
    matchLabels:
      app: ${config.appName}
  template:
    metadata:
      labels:
        app: ${config.appName}
    spec:
      containers:
      - name: ${config.appName}
        image: ${config.image}
        ports:
        - containerPort: ${config.targetPort}`;

  if (hasResources) {
    yaml += '\n        resources:';
    
    if (config.resources.requests.cpu || config.resources.requests.memory) {
      yaml += '\n          requests:';
      if (config.resources.requests.cpu) {
        yaml += `\n            cpu: "${config.resources.requests.cpu}"`;
      }
      if (config.resources.requests.memory) {
        yaml += `\n            memory: "${config.resources.requests.memory}"`;
      }
    }
    
    if (config.resources.limits.cpu || config.resources.limits.memory) {
      yaml += '\n          limits:';
      if (config.resources.limits.cpu) {
        yaml += `\n            cpu: "${config.resources.limits.cpu}"`;
      }
      if (config.resources.limits.memory) {
        yaml += `\n            memory: "${config.resources.limits.memory}"`;
      }
    }
  }

  return yaml;
}

function generateService(config: DeploymentConfig): string {
  let yaml = `apiVersion: v1
kind: Service
metadata:
  name: ${config.appName}-service
  namespace: ${config.namespace}
spec:
  selector:
    app: ${config.appName}
  ports:
  - port: ${config.port}
    targetPort: ${config.targetPort}
  type: ${config.serviceType}`;

  return yaml;
}