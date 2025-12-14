'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({ code, language = 'javascript', showLineNumbers = false, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.split('\n');

  return (
    <div className={cn(
      "relative rounded-lg border border-border bg-stone-950 dark:bg-stone-950 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-900">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-700" />
            <span className="w-3 h-3 rounded-full bg-stone-700" />
            <span className="w-3 h-3 rounded-full bg-stone-700" />
          </div>
          {language && (
            <span className="text-xs text-stone-500 font-mono ml-2">{language}</span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 transition-colors"
        >
          {copied ? (
            <>
              <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Icon icon="solar:copy-linear" className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <div className="overflow-x-auto scrollbar-thin">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code className="text-stone-300">
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-stone-600 w-8 text-right pr-4 shrink-0">{i + 1}</span>
                  <span className="flex-1">{highlightSyntax(line, language)}</span>
                </div>
              ))
            ) : (
              <span>{highlightSyntax(code, language)}</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(code: string, language: string) {
  if (language === 'html' || language === 'javascript' || language === 'js') {
    return code
      .split(/(".*?"|'.*?'|`.*?`)/)
      .map((part, i) => {
        if (part.match(/^["'`].*["'`]$/)) {
          return <span key={i} className="text-amber-400">{part}</span>;
        }
        // Keywords
        const withKeywords = part.split(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|window|document)\b/);
        return withKeywords.map((segment, j) => {
          if (['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await'].includes(segment)) {
            return <span key={`${i}-${j}`} className="text-purple-400">{segment}</span>;
          }
          if (['window', 'document'].includes(segment)) {
            return <span key={`${i}-${j}`} className="text-blue-400">{segment}</span>;
          }
          // Comments
          if (segment.includes('//')) {
            const [before, ...after] = segment.split('//');
            return <span key={`${i}-${j}`}>{before}<span className="text-stone-500">//{after.join('//')}</span></span>;
          }
          return <span key={`${i}-${j}`}>{segment}</span>;
        });
      });
  }
  return code;
}

export default CodeBlock;
