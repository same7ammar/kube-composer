import { useState } from 'react';
import { Copy, Check, Download, Eye, EyeOff } from 'lucide-react';

interface YamlPreviewProps {
  yaml: string;
}

export function YamlPreview({ yaml }: YamlPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);

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
    a.download = 'kubernetes-config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Split YAML into lines for line numbering
  const yamlLines = yaml.split('\n');
  const maxLineNumber = yamlLines.length;
  const lineNumberWidth = maxLineNumber.toString().length;

  // Syntax highlighting function that returns JSX elements
  const highlightYamlLine = (line: string, lineIndex: number) => {
    // Skip empty lines
    if (!line.trim()) {
      return <span key={lineIndex} className="text-gray-400">{line}</span>;
    }

    // Comments
    if (line.trim().startsWith('#')) {
      return <span key={lineIndex} className="text-green-400 italic">{line}</span>;
    }

    // YAML separators
    if (line.trim() === '---') {
      return <span key={lineIndex} className="text-purple-400 font-bold">{line}</span>;
    }

    // Parse the line for different syntax elements
    const parts = [];
    let remainingLine = line;
    let partIndex = 0;

    // Handle indentation
    const indentMatch = remainingLine.match(/^(\s*)/);
    if (indentMatch && indentMatch[1]) {
      parts.push(<span key={`${lineIndex}-indent-${partIndex++}`}>{indentMatch[1]}</span>);
      remainingLine = remainingLine.slice(indentMatch[1].length);
    }

    // Handle array items
    if (remainingLine.startsWith('- ')) {
      parts.push(<span key={`${lineIndex}-array-${partIndex++}`} className="text-purple-400">-</span>);
      parts.push(<span key={`${lineIndex}-space-${partIndex++}`}> </span>);
      remainingLine = remainingLine.slice(2);
    }

    // Handle keys (before colon)
    const keyMatch = remainingLine.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):(\s|$)/);
    if (keyMatch) {
      parts.push(<span key={`${lineIndex}-key-${partIndex++}`} className="text-blue-400 font-medium">{keyMatch[1]}</span>);
      parts.push(<span key={`${lineIndex}-colon-${partIndex++}`}>:</span>);
      remainingLine = remainingLine.slice(keyMatch[0].length);
      
      if (keyMatch[2]) {
        parts.push(<span key={`${lineIndex}-keyspace-${partIndex++}`}>{keyMatch[2]}</span>);
      }
    }

    // Handle the rest of the line (values)
    if (remainingLine) {
      // String values (quoted)
      remainingLine = remainingLine.replace(
        /"([^"]*)"/g,
        (_, content) => {
          parts.push(<span key={`${lineIndex}-string-${partIndex++}`} className="text-green-300">"{content}"</span>);
          return '';
        }
      );
      
      remainingLine = remainingLine.replace(
        /'([^']*)'/g,
        (_, content) => {
          parts.push(<span key={`${lineIndex}-string2-${partIndex++}`} className="text-green-300">'{content}'</span>);
          return '';
        }
      );

      // Numbers
      remainingLine = remainingLine.replace(
        /^\s*(\d+)(\s|$)/,
        (match, number, space) => {
          if (match.trim()) {
            parts.push(<span key={`${lineIndex}-space2-${partIndex++}`}> </span>);
            parts.push(<span key={`${lineIndex}-number-${partIndex++}`} className="text-yellow-300">{number}</span>);
            if (space) parts.push(<span key={`${lineIndex}-numspace-${partIndex++}`}>{space}</span>);
          }
          return '';
        }
      );

      // Booleans
      remainingLine = remainingLine.replace(
        /^\s*(true|false)(\s|$)/,
        (match, bool, space) => {
          if (match.trim()) {
            parts.push(<span key={`${lineIndex}-space3-${partIndex++}`}> </span>);
            parts.push(<span key={`${lineIndex}-bool-${partIndex++}`} className="text-orange-300">{bool}</span>);
            if (space) parts.push(<span key={`${lineIndex}-boolspace-${partIndex++}`}>{space}</span>);
          }
          return '';
        }
      );

      // Special Kubernetes values
      remainingLine = remainingLine.replace(
        /^\s*(apps\/v1|v1|Deployment|Service|ConfigMap|Secret|Namespace)(\s|$)/,
        (match, k8sValue, space) => {
          if (match.trim()) {
            parts.push(<span key={`${lineIndex}-space4-${partIndex++}`}> </span>);
            parts.push(<span key={`${lineIndex}-k8s-${partIndex++}`} className="text-cyan-300 font-medium">{k8sValue}</span>);
            if (space) parts.push(<span key={`${lineIndex}-k8sspace-${partIndex++}`}>{space}</span>);
          }
          return '';
        }
      );

      // Any remaining text
      if (remainingLine.trim()) {
        parts.push(<span key={`${lineIndex}-remaining-${partIndex++}`} className="text-gray-100">{remainingLine}</span>);
      }
    }

    return <span key={lineIndex}>{parts}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">Generated YAML</h3>
        
        <div className="flex items-center space-x-2">
          {/* View options */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`p-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                showLineNumbers 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Toggle line numbers"
            >
              {showLineNumbers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                wordWrap 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Toggle word wrap"
            >
              Wrap
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            title="Download YAML file"
          >
            <Download className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-green-300" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* YAML content */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        {/* Header bar */}
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 text-gray-400 text-sm font-mono">kubernetes-config.yaml</span>
          </div>
        </div>

        {/* Code content */}
        <div className="relative">
          <pre className={`p-4 text-sm text-gray-100 overflow-x-auto ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
            <code className="font-mono leading-relaxed">
              {yamlLines.map((line, index) => (
                <div key={index} className="flex">
                  {showLineNumbers && (
                    <span 
                      className="text-gray-500 text-right mr-4 select-none flex-shrink-0 font-mono text-xs"
                      style={{ minWidth: `${lineNumberWidth + 1}ch` }}
                    >
                      {(index + 1).toString().padStart(lineNumberWidth, ' ')}
                    </span>
                  )}
                  <span className="flex-1">
                    {highlightYamlLine(line, index)}
                  </span>
                </div>
              ))}
            </code>
          </pre>

          {/* Copy overlay for better UX */}
          {copied && (
            <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
              ✓ Copied to clipboard
            </div>
          )}
        </div>

        {/* Footer with stats */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{yamlLines.length} lines • {yaml.length} characters</span>
            <span>YAML • UTF-8</span>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Ready to deploy!</p>
            <p>
              Save this YAML to a file (e.g., <code className="bg-blue-100 px-1 rounded">deployment.yaml</code>) 
              and apply it to your Kubernetes cluster with: 
              <code className="bg-blue-100 px-1 rounded ml-1">kubectl apply -f deployment.yaml</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}