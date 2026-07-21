import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, ArrowRight } from 'lucide-react';

const OPT_COLORS = {
  'Constant Folding': 'badge-yellow',
  'CSE': 'badge-cyan',
  'Dead Code Elimination': 'badge-red',
  'Loop Optimization': 'badge-purple',
};

function diffLines(original, optimized) {
  const origTexts = original.map((i) => i.text || '');
  const optTexts = optimized.map((i) => i.text || '');
  const removed = origTexts.filter((t) => !optTexts.includes(t));
  const added = optTexts.filter((t) => !origTexts.includes(t));
  const modified = [];
  origTexts.forEach((t) => {
    optTexts.forEach((ot) => {
      if (t !== ot && t.split('=')[0] === ot.split('=')[0] && t.split('=')[0].trim()) {
        modified.push({ from: t, to: ot });
      }
    });
  });
  return { removed, added, modified };
}

export default function OptimizationView({ data }) {
  const [view, setView] = useState('diff'); // 'diff' | 'side-by-side'

  if (!data) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No optimization data yet.
      </div>
    );
  }

  const { original = [], optimized = [], applied_optimizations = [], stats = {} } = data;
  const diff = diffLines(original, optimized);

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-400" />
          <span className="text-sm font-semibold text-gray-200">Code Optimization</span>
          {stats.instructions_removed > 0 && (
            <span className="badge badge-green text-[10px]">
              -{stats.instructions_removed} instructions
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {['diff', 'side-by-side'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-2.5 py-1 rounded ${view === v ? 'bg-primary-600/30 text-primary-300 border border-primary-600/40' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {v === 'diff' ? 'Diff View' : 'Side by Side'}
            </button>
          ))}
        </div>
      </div>

      {/* Applied optimizations */}
      {applied_optimizations.length > 0 && (
        <div className="px-4 py-2 border-b border-dark-border bg-amber-950/20 shrink-0">
          <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Applied Optimizations</p>
          <div className="space-y-1 max-h-16 overflow-y-auto">
            {applied_optimizations.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <CheckCircle size={11} className="text-green-400 shrink-0" />
                <span className="text-green-300">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 px-4 py-2 border-b border-dark-border shrink-0">
        {[
          { label: 'Const Fold', val: stats.constant_folding, color: 'text-yellow-400' },
          { label: 'CSE', val: stats.cse, color: 'text-cyan-400' },
          { label: 'Dead Code', val: stats.dead_code_elimination, color: 'text-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">{label}:</span>
            <span className={`font-bold ${color}`}>{val || 0}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'diff' ? (
          <div className="h-full overflow-y-auto p-3 font-mono text-xs space-y-0.5">
            {/* Show removed lines */}
            {diff.removed.map((text, i) => (
              <div key={`r${i}`} className="bg-red-950/40 border-l-2 border-red-500 px-3 py-0.5 text-red-400">
                − {text}
              </div>
            ))}
            {/* Show modified */}
            {diff.modified.map((m, i) => (
              <div key={`m${i}`} className="space-y-0.5">
                <div className="bg-red-950/30 border-l-2 border-red-500/60 px-3 py-0.5 text-red-400/80">− {m.from}</div>
                <div className="bg-green-950/30 border-l-2 border-green-500/60 px-3 py-0.5 text-green-400/80">+ {m.to}</div>
              </div>
            ))}
            {/* Show all optimized lines */}
            {optimized.map((instr, i) => {
              const wasAdded = diff.added.includes(instr.text);
              return (
                <div
                  key={i}
                  className={`px-3 py-0.5 border-l-2 ${
                    wasAdded ? 'bg-green-950/40 border-green-500 text-green-300' : 'border-dark-border/40 text-gray-300'
                  }`}
                >
                  {wasAdded ? '+ ' : '  '}{instr.text}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full divide-x divide-dark-border overflow-hidden">
            {/* Original */}
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 font-medium border-b border-dark-border">
                Original ({original.length} instr.)
              </div>
              <div className="p-3 font-mono text-xs space-y-0.5">
                {original.map((instr, i) => (
                  <div key={i} className="tac-line text-gray-300">{instr.text}</div>
                ))}
              </div>
            </div>
            {/* Arrow */}
            <div className="w-8 flex items-center justify-center shrink-0 bg-dark-surface/30">
              <ArrowRight size={14} className="text-amber-400" />
            </div>
            {/* Optimized */}
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 bg-green-950/30 px-3 py-1.5 text-xs text-green-400 font-medium border-b border-dark-border">
                Optimized ({optimized.length} instr.)
              </div>
              <div className="p-3 font-mono text-xs space-y-0.5">
                {optimized.map((instr, i) => (
                  <div key={i} className="tac-line text-gray-300">{instr.text}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
