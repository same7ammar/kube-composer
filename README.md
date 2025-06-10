# Kube Composer

A modern, intuitive Kubernetes YAML generator that simplifies deployment configuration for developers.

## 🚀 Features

- **Visual Deployment Editor** - Configure deployments through an intuitive interface
- **Multi-Deployment Support** - Manage multiple deployments in a single project
- **Real-time YAML Generation** - See your YAML output update as you configure
- **Architecture Visualization** - Visual representation of your Kubernetes resources
- **Resource Validation** - Built-in validation to ensure proper configuration
- **Export & Download** - Download production-ready YAML files

## 🌐 Live Demo

Visit the live application: [https://same7ammar.github.io/kube-composer/](https://same7ammar.github.io/kube-composer/)

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/same7ammar/kube-composer.git
cd kube-composer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚀 Deployment

### GitHub Pages (Automatic)

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Your site will be available at `https://same7ammar.github.io/kube-composer/`

### Manual Deployment

You can also deploy manually using the gh-pages package:

```bash
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ArchitecturePreview.tsx
│   ├── DeploymentForm.tsx
│   ├── DeploymentsList.tsx
│   ├── Footer.tsx
│   ├── ResourceSummary.tsx
│   ├── UsageCounter.tsx
│   ├── VisualPreview.tsx
│   └── YamlPreview.tsx
├── hooks/              # Custom React hooks
│   └── useUsageCounter.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── yamlGenerator.ts
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🔧 Configuration

### GitHub Pages Setup

1. Go to your repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on pushes to main

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public` directory with your domain
2. Configure your domain's DNS to point to GitHub Pages
3. Update the `homepage` field in `package.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Deployed on [GitHub Pages](https://pages.github.com/)

## 📊 Usage Statistics

This tool tracks anonymous usage statistics to help improve the user experience. No personal data is collected.

---

Made with ❤️ for the Kubernetes community