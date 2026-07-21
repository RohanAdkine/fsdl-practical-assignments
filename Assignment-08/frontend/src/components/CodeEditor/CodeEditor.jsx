import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Code2, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python', monacoLang: 'python', color: '#3b82f6' },
  { value: 'java', label: 'Java', monacoLang: 'java', color: '#f59e0b' },
  { value: 'c', label: 'C', monacoLang: 'c', color: '#10b981' },
];

const SAMPLES = {
  python: `# Sample Python program
def factorial(n):
    if n <= 1:
        return 1
    result = n * factorial(n - 1)
    return result

x = 5
y = factorial(x)
z = x + y * 2
print(z)
`,
  java: `// Sample Java program
public class Main {
    public static int factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        int result = n * factorial(n - 1);
        return result;
    }

    public static void main(String[] args) {
        int x = 5;
        int y = factorial(x);
        int z = x + y * 2;
        System.out.println(z);
    }
}
`,
  c: `/* Sample C program */
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    int result = n * factorial(n - 1);
    return result;
}

int main() {
    int x = 5;
    int y = factorial(x);
    int z = x + y * 2;
    printf("%d\\n", z);
    return 0;
}
`,
};

export default function CodeEditor({ code, onCodeChange, language, onLanguageChange, onCompile, loading, errors }) {
  const editorRef = useRef(null);
  const currentLang = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const loadSample = () => {
    onCodeChange(SAMPLES[language] || SAMPLES.python);
  };

  // Build Monaco markers from errors
  const handleEditorValidation = () => {};

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Code2 size={15} className="text-primary-400" />
          <span className="text-sm font-semibold text-gray-200">Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => {
                onLanguageChange(e.target.value);
                onCodeChange(SAMPLES[e.target.value] || '');
              }}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-dark-hover border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={loadSample} className="btn-secondary text-xs px-2.5 py-1.5">
            Load Sample
          </button>

          <button
            onClick={onCompile}
            disabled={loading}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {loading ? 'Compiling...' : 'Compile'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={currentLang.monacoLang}
          value={code}
          onChange={(val) => onCodeChange(val || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            roundedSelection: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12, bottom: 12 },
            overviewRulerBorder: false,
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
          }}
        />
      </div>

      {/* Error panel */}
      {errors && errors.length > 0 && (
        <div className="shrink-0 border-t border-red-900/50 bg-red-950/30 px-3 py-2 max-h-24 overflow-y-auto">
          {errors.map((err, i) => (
            <div key={i} className="text-xs text-red-400 flex items-start gap-1.5 py-0.5">
              <span className="text-red-500 shrink-0">●</span>
              <span>
                {err.phase && <span className="text-red-300 font-medium">[{err.phase}] </span>}
                {err.message || JSON.stringify(err)}
                {err.line && <span className="text-gray-500 ml-1">Line {err.line}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
