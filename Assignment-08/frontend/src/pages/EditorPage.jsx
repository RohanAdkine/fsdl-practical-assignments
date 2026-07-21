import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compileCode, saveHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';

import CodeEditor from '../components/CodeEditor/CodeEditor';
import PipelineSteps from '../components/CompilerPipeline/PipelineSteps';
import TokenTable from '../components/Lexer/TokenTable';
import ASTVisualizer from '../components/Parser/ASTVisualizer';
import SymbolTable from '../components/Semantic/SymbolTable';
import TACView from '../components/TAC/TACView';
import OptimizationView from '../components/Optimizer/OptimizationView';
import RegisterGraph from '../components/RegisterAlloc/RegisterGraph';
import AssemblyOutput from '../components/Assembly/AssemblyOutput';
import CFGVisualizer from '../components/CFG/CFGVisualizer';
import AIExplanation from '../components/AI/AIExplanation';

const PHASE_COMPONENTS = {
  lexer: { component: TokenTable, dataKey: 'lexer', label: 'Lexical Analysis' },
  parser: { component: ASTVisualizer, dataKey: 'parser', label: 'Syntax Analysis (AST)' },
  semantic: { component: SymbolTable, dataKey: 'semantic', label: 'Semantic Analysis' },
  tac: { component: TACView, dataKey: 'tac', label: 'Intermediate Code (TAC)' },
  optimizer: { component: OptimizationView, dataKey: 'optimizer', label: 'Code Optimization' },
  registers: { component: RegisterGraph, dataKey: 'registers', label: 'Register Allocation' },
  assembly: { component: AssemblyOutput, dataKey: 'assembly', label: 'Assembly Generation' },
};

const PHASE_ORDER = ['lexer', 'parser', 'semantic', 'tac', 'optimizer', 'registers', 'assembly'];
const SAMPLE_CODE = `def fibonacci(n):
    if n <= 1:
        return n
    a = fibonacci(n - 1)
    b = fibonacci(n - 2)
    result = a + b
    return result

x = 10
answer = fibonacci(x)
print(answer)
`;

export default function EditorPage() {
  const { user } = useAuth();
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activePhase, setActivePhase] = useState('lexer');
  const [completedPhases, setCompletedPhases] = useState([]);
  const [showCFG, setShowCFG] = useState(false);

  const handleCompile = async () => {
    setLoading(true);
    setResults(null);
    setCompletedPhases([]);
    try {
      const data = await compileCode(code, language);
      setResults(data);

      // Animate phases completing one by one
      for (let i = 0; i < PHASE_ORDER.length; i++) {
        await new Promise((r) => setTimeout(r, 120 * i));
        setCompletedPhases((prev) => [...prev, PHASE_ORDER[i]]);
      }
      setActivePhase('lexer');

      // Auto-save to history if logged in
      if (user) {
        saveHistory(language, code, data).catch(() => {});
      }
    } catch (err) {
      console.error('Compile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ActiveComponent = PHASE_COMPONENTS[activePhase]?.component;
  const activeData = results ? results[PHASE_COMPONENTS[activePhase]?.dataKey] : null;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden px-3 py-3 gap-3">
      {/* Pipeline Steps */}
      <PipelineSteps
        activePhase={activePhase}
        completedPhases={completedPhases}
        loading={loading}
        onPhaseClick={setActivePhase}
      />

      {/* Main layout */}
      <div className="flex-1 flex gap-3 overflow-hidden min-h-0">
        {/* Left: Code Editor */}
        <div className="w-[38%] shrink-0 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={code}
              onCodeChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onCompile={handleCompile}
              loading={loading}
              errors={results?.errors}
            />
          </div>
        </div>

        {/* Right: Visualization Area */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* AI Explanation Panel */}
          {results && (
            <AIExplanation phase={activePhase} context={JSON.stringify(activeData).slice(0, 200)} />
          )}

          {/* Active Phase Visualization */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card h-full flex flex-col items-center justify-center text-gray-500 gap-4"
                >
                  <div className="text-6xl">⚙️</div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-300 mb-1">Ready to Compile</p>
                    <p className="text-sm">Write or paste code in the editor, then click <span className="text-primary-400 font-medium">Compile</span></p>
                    <p className="text-xs mt-2 text-gray-600">Supports Python · Java · C</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={activePhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {ActiveComponent && <ActiveComponent data={activeData} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CFG toggle */}
          {results && (
            <div className="shrink-0">
              <button
                onClick={() => setShowCFG(!showCFG)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  showCFG
                    ? 'bg-blue-600/20 text-blue-300 border-blue-600/40'
                    : 'text-gray-500 border-dark-border hover:border-primary-500/40 hover:text-gray-300'
                }`}
              >
                {showCFG ? '▲ Hide Control Flow Graph' : '▼ Show Control Flow Graph'}
              </button>

              <AnimatePresence>
                {showCFG && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 280, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <CFGVisualizer data={results?.cfg} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
