import React, { useState, useRef } from 'react';
import { Copy, Check, Download, Eye, EyeOff, FileText, Maximize2, Minimize2 } from 'lucide-react';

interface YamlPreviewProps {
  yaml: string;
}

export function YamlPreview({ yaml }: YamlPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kubernetes-deployment.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const highlightYaml = (yamlText: string) => {
    return yamlText
      .replace(/(^|\n)(#.*)/g, '$1<span class="text-gray-500 italic">$2</span>')
      .replace(/^(\s*)([\w-]+):/gm, '$1<span class="text-blue-400 font-medium">$2</span>:')
      .replace(/:\s*([^\n\r]+)/g, ': <span class="text-green-300">$1</span>')
      .replace(/(\s+)(-\s*)/g, '$1<span class="text-yellow-400">$2</span>')
      .replace(/(apiVersion|kind|metadata|spec|selector|template|containers|ports|env|resources|limits|requests):/g, '<span class="text-purple-400 font-semibold">$1</span>:')
      .replace(/:\s*(\d+)/g, ': <span class="text-orange-400">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="text-red-400">$1</span>')
      .replace(/:\s*(".*?")/g, ': <span class="text-green-400">$1</span>');
  };

  const lines = yaml.split('\n');
  const lineCount = lines.length;

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-6' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <h3 className={`text-lg font-semibold ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
            Generated YAML
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{lineCount} lines</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Options */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`p-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                showLineNumbers 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Toggle line numbers"
            >
              123
            </button>
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`p-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                wordWrap 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Toggle word wrap"
            >
              {wordWrap ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className={`bg-gray-900 rounded-lg overflow-hidden border border-gray-700 ${
        isFullscreen ? 'flex-1 flex flex-col' : ''
      }`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-300 text-sm font-mono">kubernetes-deployment.yaml</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>YAML</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Code Content */}
        <div className={`relative ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
          <div className={`${isFullscreen ? 'h-full overflow-auto' : 'max-h-96 overflow-auto'}`}>
            <div className="flex">
              {/* Line Numbers */}
              {showLineNumbers && (
                <div className="flex-shrink-0 px-3 py-4 bg-gray-800 border-r border-gray-700 select-none">
                  <div className="text-xs text-gray-500 font-mono leading-6">
                    {lines.map((_, index) => (
                      <div key={index} className="text-right">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Code */}
              <div className="flex-1 min-w-0">
                <pre 
                  ref={preRef}
                  className={`p-4 text-sm text-gray-100 font-mono leading-6 ${
                    wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'
                  }`}
                  style={{ tabSize: 2 }}
                >
                  <code 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightYaml(yaml) 
                    }} 
                  />
                </pre>
              </div>
            </div>
          </div>

          {/* Scroll Indicators */}
          <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-gray-500">
            <div className="bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded">
              {lineCount} lines
            </div>
          </div>
        </div>

        {/* Footer with file info */}
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Kubernetes YAML</span>
            <span>•</span>
            <span>Ready for deployment</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Generated by Kube Composer</span>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay close button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          title="Exit fullscreen"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}