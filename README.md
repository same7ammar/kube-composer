# Kube Composer

A modern, intuitive **Kubernetes YAML generator** that simplifies deployment configuration for developers and DevOps teams.

## 🚀 Features

- **🎨 Visual Deployment Editor** - Configure deployments through an intuitive interface
- **📦 Multi-Deployment Support** - Manage multiple deployments in a single project
- **⚡ Real-time YAML Generation** - See your YAML output update as you configure
- **🏗️ Architecture Visualization** - Visual representation of your Kubernetes resources
- **✅ Resource Validation** - Built-in validation to ensure proper configuration
- **💾 Export & Download** - Download production-ready YAML files
- **📱 Mobile Responsive** - Works perfectly on all devices
- **🔄 No Registration Required** - Start using immediately, no sign-up needed

## 🌐 Live Demo

**🔗 [Try Kube Composer Now](https://kube-composer.com)**

Generate your first Kubernetes deployment in under 2 minutes!

## 🎯 Perfect For

- **Developers** learning Kubernetes
- **DevOps Engineers** creating quick deployments
- **Teams** standardizing deployment configurations
- **Students** understanding Kubernetes concepts
- **Anyone** who wants to avoid writing YAML manually

## 🛠️ Local Development

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
│   ├── ArchitecturePreview.tsx    # Visual architecture display
│   ├── DeploymentForm.tsx         # Deployment configuration form
│   ├── DeploymentsList.tsx        # List of deployments
│   ├── Footer.tsx                 # Footer component
│   ├── ResourceSummary.tsx        # Resource overview
│   ├── SocialShare.tsx            # Social media sharing
│   ├── SEOHead.tsx               # SEO meta tags
│   └── YamlPreview.tsx           # YAML output display
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Utility functions
│   └── yamlGenerator.ts          # YAML generation logic
├── App.tsx             # Main application
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

### Custom Domain Setup

1. Add `CNAME` file to `public/` directory
2. Configure DNS to point to GitHub Pages
3. Update `homepage` in `package.json`

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure responsive design
- Test across browsers

## 📊 SEO & Social Media

This project includes comprehensive SEO optimization:

- **Meta tags** for search engines
- **Open Graph** tags for social sharing
- **Twitter Cards** for Twitter sharing
- **Structured data** (JSON-LD) for rich snippets
- **Sitemap** for search engine crawling
- **Social sharing** buttons built-in

## 🔍 Keywords

`kubernetes` `yaml generator` `deployment` `docker` `containers` `devops` `k8s` `kubernetes deployment` `yaml editor` `kubernetes tools` `free kubernetes tool` `visual editor` `deployment generator`

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[React](https://reactjs.org/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Lucide React](https://lucide.dev/)** - Icons
- **[Vite](https://vitejs.dev/)** - Build tool
- **[GitHub Pages](https://pages.github.com/)** - Hosting

## 🌟 Star History

If this project helped you, please consider giving it a ⭐ on GitHub!

## 📞 Support

- **🐛 Bug Reports:** [GitHub Issues](https://github.com/same7ammar/kube-composer/issues)
- **💡 Feature Requests:** [GitHub Discussions](https://github.com/same7ammar/kube-composer/discussions)
- **📧 Contact:** Open an issue for any questions

---

<div align="center">

**Made with ❤️ for the Kubernetes community**

[🌐 Website](https://kube-composer.com) • [📚 Documentation](https://github.com/same7ammar/kube-composer) • [🐛 Report Bug](https://github.com/same7ammar/kube-composer/issues) • [💡 Request Feature](https://github.com/same7ammar/kube-composer/discussions)

</div>