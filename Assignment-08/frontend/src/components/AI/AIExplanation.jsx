import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Bot } from 'lucide-react';
import { explainPhase } from '../../services/api';

const PHASE_LABELS = {
  lexer: 'Lexical Analysis',
  parser: 'Syntax Analysis',
  semantic: 'Semantic Analysis',
  tac: 'Intermediate Code',
  optimizer: 'Code Optimization',
  registers: 'Register Allocation',
  assembly: 'Assembly Generation',
  cfg: 'Control Flow Graph',
};

export default function AIExplanation({ phase, context = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchExplanation = async () => {
    if (fetched) {
      setExpanded(!expanded);
      return;
    }
    setExpanded(true);
    setLoading(true);
    try {
      const res = await explainPhase(phase, context);
      setExplanation(res.explanation);
      setSource(res.source);
      setFetched(true);
    } catch (err) {
      setExplanation('Unable to fetch explanation. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!phase) return null;

  return (
    <div className="glass-card overflow-hidden border border-cyber-purple/20">
      <button
        onClick={fetchExplanation}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-violet-300">
            AI: {PHASE_LABELS[phase] || phase}
          </span>
          {source === 'openai' && (
            <span className="badge badge-purple text-[10px]">GPT</span>
          )}
          {source === 'builtin' && (
            <span className="badge text-[10px] bg-gray-800 text-gray-400 border-gray-700">Built-in</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!fetched && <span className="text-xs text-gray-500">Click to explain</span>}
          {loading ? (
            <Loader2 size={14} className="animate-spin text-violet-400" />
          ) : (
            expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-dark-border px-4 py-3 max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-violet-400 text-sm py-4">
                  <Bot size={16} className="animate-pulse" />
                  <span>Generating explanation...</span>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-gray-300
                  prose-headings:text-violet-300 prose-code:text-amber-300 prose-code:bg-dark-surface
                  prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-strong:text-white prose-a:text-primary-400
                  prose-table:text-xs prose-td:py-1 prose-th:py-1 prose-th:text-gray-400
                  prose-blockquote:border-violet-500 prose-blockquote:text-gray-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {explanation}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
