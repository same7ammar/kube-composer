# Kube Composer

A modern, intuitive **Kubernetes YAML generator** that simplifies deployment configuration for developers and DevOps teams.

## 🚀 Features

### 🎨 **Visual Deployment Editor**
- **Multi-Container Support** - Configure multiple containers per deployment
- **Advanced Container Configuration** - Resources, environment variables, volume mounts
- **Real-time Validation** - Built-in configuration validation and error checking
- **Interactive Forms** - Intuitive interface for complex Kubernetes configurations

### 📦 **Comprehensive Resource Management**
- **Deployments** - Full deployment configuration with replica management
- **Services** - ClusterIP, NodePort, and LoadBalancer service types
- **Ingress** - Complete ingress configuration with TLS support
- **Namespaces** - Custom namespace creation and management
- **ConfigMaps** - Configuration data storage and management
- **Secrets** - Secure storage for sensitive data (Opaque, TLS, Docker Config)
- **Volumes** - EmptyDir, ConfigMap, and Secret volume types

### 🌐 **Advanced Networking**
- **Ingress Controllers** - Support for multiple ingress classes
- **TLS/SSL Configuration** - Automatic HTTPS setup with certificate management
- **Traffic Flow Visualization** - Visual representation of request routing
- **Port Mapping** - Flexible port configuration and service discovery

### ⚡ **Real-time Features**
- **Live YAML Generation** - See your YAML output update as you configure
- **Architecture Visualization** - Interactive diagrams showing resource relationships
- **Traffic Flow Diagrams** - Visual representation of request routing from Ingress to Pods
- **Multi-Deployment Support** - Manage multiple applications in a single project

### 🔧 **Advanced Configuration**
- **Environment Variables** - Support for direct values, ConfigMap refs, and Secret refs
- **Resource Limits** - CPU and memory requests/limits configuration
- **Volume Mounts** - Flexible volume mounting with multiple volume types
- **Labels & Annotations** - Custom metadata for all resources
- **Health Checks** - Built-in configuration validation

### 📱 **User Experience**
- **Mobile Responsive** - Works perfectly on all devices
- **No Registration Required** - Start using immediately, no sign-up needed
- **Export & Download** - Production-ready YAML files
- **Social Sharing** - Share your configurations with the community

## 🌐 Live Demo

**🔗 [Try Kube Composer Now](https://kube-composer.com)**

Generate your first Kubernetes deployment in under 2 minutes!

## 🎯 Perfect For

- **Developers** learning Kubernetes and container orchestration
- **DevOps Engineers** creating quick deployments and testing configurations
- **Platform Engineers** standardizing deployment configurations across teams
- **Students** understanding Kubernetes concepts and resource relationships
- **Teams** collaborating on infrastructure as code
- **Anyone** who wants to avoid writing YAML manually

## 🛠️ Supported Kubernetes Resources

### Core Workloads
- ✅ **Deployments** - Application deployment and replica management
- ✅ **Services** - Network access and service discovery
- ✅ **Ingress** - External access and traffic routing

### Configuration & Storage
- ✅ **ConfigMaps** - Configuration data management
- ✅ **Secrets** - Sensitive data storage (Opaque, TLS, Docker Config)
- ✅ **Volumes** - Persistent and ephemeral storage
- ✅ **Namespaces** - Resource organization and isolation

### Advanced Features
- ✅ **Multi-Container Pods** - Sidecar patterns and complex applications
- ✅ **Environment Variables** - Direct values and resource references
- ✅ **Resource Quotas** - CPU and memory limits/requests
- ✅ **TLS Termination** - HTTPS and certificate management
- ✅ **Ingress Rules** - Path-based and host-based routing

## 🚀 Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/same7ammar/kube-composer.git
cd kube-composer
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Visit [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚀 Deployment

### Automatic GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - GitHub Actions automatically builds and deploys
2. **Live at:** `https://same7ammar.github.io/kube-composer/`
3. **Custom domain:** `https://kube-composer.com`

### Manual Deployment

```bash
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ArchitecturePreview.tsx    # Visual architecture with traffic flow
│   ├── DeploymentForm.tsx         # Multi-container deployment configuration
│   ├── DeploymentsList.tsx        # Deployment management interface
│   ├── NamespaceManager.tsx       # Namespace creation and management
│   ├── ConfigMapManager.tsx       # ConfigMap creation and management
│   ├── SecretManager.tsx          # Secret creation and management
│   ├── YamlPreview.tsx           # Syntax-highlighted YAML output
│   ├── ResourceSummary.tsx        # Resource overview and validation
│   ├── Footer.tsx                 # Enhanced footer with resources
│   ├── SocialShare.tsx            # Social media sharing
│   └── SEOHead.tsx               # SEO optimization
├── hooks/              # Custom React hooks
│   └── useUsageCounter.ts        # Usage statistics tracking
├── types/              # TypeScript definitions
│   └── index.ts                  # Comprehensive type definitions
├── utils/              # Utility functions
│   └── yamlGenerator.ts          # Advanced YAML generation logic
├── App.tsx             # Main application with tabbed interface
├── main.tsx           # Entry point
└── index.css          # Global styles with Tailwind CSS
```

## 🔧 Configuration Examples

### Multi-Container Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: web-server
        image: nginx:1.21
        ports:
        - containerPort: 80
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
      - name: sidecar-proxy
        image: envoyproxy/envoy:v1.20
        ports:
        - containerPort: 8080
```

### Ingress with TLS
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - example.com
    secretName: tls-secret
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
```

### ConfigMap and Secret Integration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database.host: "localhost"
  database.port: "5432"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database.password: <base64-encoded>
  api.key: <base64-encoded>
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and TypeScript patterns
- Add tests for new features and components
- Update documentation for new Kubernetes resources
- Ensure responsive design across all devices
- Test YAML generation for various configurations
- Validate Kubernetes resource compatibility

## 🔍 Keywords

`kubernetes` `yaml generator` `deployment` `docker` `containers` `devops` `k8s` `kubernetes deployment` `yaml editor` `kubernetes tools` `free kubernetes tool` `visual editor` `deployment generator` `ingress` `configmap` `secrets` `namespaces` `multi-container` `microservices`

## 🌟 What's New

### Latest Features (v2.0)
- ✨ **Multi-Container Support** - Configure complex pod specifications
- 🌐 **Advanced Ingress** - Complete ingress configuration with TLS
- 🗂️ **Namespace Management** - Create and organize custom namespaces
- 🔧 **ConfigMap & Secret Management** - Centralized configuration storage
- 📊 **Traffic Flow Visualization** - See how requests flow through your architecture
- 🔗 **Environment Variable References** - Link to ConfigMaps and Secrets
- 📱 **Enhanced Mobile Experience** - Improved responsive design
- 🎨 **Visual Architecture Diagrams** - Interactive resource visualization

### Coming Soon
- 🔄 **StatefulSets** - Stateful application support
- 📊 **HorizontalPodAutoscaler** - Automatic scaling configuration
- 🛡️ **NetworkPolicies** - Network security rules
- 📦 **PersistentVolumes** - Storage management
- 🔍 **Resource Monitoring** - Built-in observability

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[React](https://reactjs.org/)** - UI framework for component-based architecture
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[GitHub Pages](https://pages.github.com/)** - Free hosting platform
- **[Kubernetes Community](https://kubernetes.io/)** - For the amazing container orchestration platform

## 🌟 Star History

If this project helped you, please consider giving it a ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=same7ammar/kube-composer&type=Date)](https://star-history.com/#same7ammar/kube-composer&Date)

## 📞 Support & Community

- **🐛 Bug Reports:** [GitHub Issues](https://github.com/same7ammar/kube-composer/issues)
- **💡 Feature Requests:** [GitHub Discussions](https://github.com/same7ammar/kube-composer/discussions)
- **📧 Contact:** Open an issue for any questions
- **🐦 Twitter:** [@Same7Ammar](https://x.com/Same7Ammar)
- **💼 LinkedIn:** [Same Hammar](https://www.linkedin.com/in/samehammar/)

## 🎯 Roadmap

### Q1 2025
- [ ] StatefulSet support
- [ ] PersistentVolume management
- [ ] HorizontalPodAutoscaler configuration
- [ ] NetworkPolicy editor

### Q2 2025
- [ ] Helm chart generation
- [ ] Kustomize support
- [ ] GitOps integration
- [ ] Cluster resource monitoring

### Q3 2025
- [ ] Multi-cluster support
- [ ] Resource cost estimation
- [ ] Security scanning
- [ ] Performance optimization suggestions

---

<div align="center">

**Made with ❤️ for the Kubernetes community**

[🌐 Website](https://kube-composer.com) • [📚 Documentation](https://github.com/same7ammar/kube-composer) • [🐛 Report Bug](https://github.com/same7ammar/kube-composer/issues) • [💡 Request Feature](https://github.com/same7ammar/kube-composer/discussions)

**⭐ Star us on GitHub — it helps!**

</div>