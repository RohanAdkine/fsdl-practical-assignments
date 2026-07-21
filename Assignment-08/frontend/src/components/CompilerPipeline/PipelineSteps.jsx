import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2, ChevronRight } from 'lucide-react';

const PHASES = [
  { id: 'lexer',     label: 'Lexical',       subtitle: 'Tokenize',     color: '#3b82f6', bg: 'from-blue-600 to-blue-800',     num: '01' },
  { id: 'parser',    label: 'Syntax',        subtitle: 'Parse → AST',  color: '#8b5cf6', bg: 'from-violet-600 to-violet-800',  num: '02' },
  { id: 'semantic',  label: 'Semantic',      subtitle: 'Type Check',   color: '#06b6d4', bg: 'from-cyan-600 to-cyan-800',     num: '03' },
  { id: 'tac',       label: 'Intermediate',  subtitle: 'TAC Gen',      color: '#10b981', bg: 'from-emerald-600 to-emerald-800',num: '04' },
  { id: 'optimizer', label: 'Optimization',  subtitle: 'Optimize',     color: '#f59e0b', bg: 'from-amber-600 to-amber-800',   num: '05' },
  { id: 'registers', label: 'Registers',     subtitle: 'Alloc',        color: '#f97316', bg: 'from-orange-600 to-orange-800', num: '06' },
  { id: 'assembly',  label: 'Assembly',      subtitle: 'Codegen',      color: '#ec4899', bg: 'from-pink-600 to-pink-800',     num: '07' },
];

export default function PipelineSteps({ activePhase, completedPhases = [], loading, onPhaseClick }) {
  return (
    <div className="glass-card px-4 py-3 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compiler Pipeline</h2>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-primary-400">
            <Loader2 size={12} className="animate-spin" />
            Processing...
          </div>
        )}
      </div>

      {/* Steps row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PHASES.map((phase, index) => {
          const isDone = completedPhases.includes(phase.id);
          const isActive = activePhase === phase.id;
          const isClickable = completedPhases.length > 0;

          return (
            <React.Fragment key={phase.id}>
              <motion.button
                onClick={() => isClickable && onPhaseClick(phase.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`pipeline-step shrink-0 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Icon circle */}
                <div
                  className={`pipeline-step-icon text-sm transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${phase.bg} border-transparent text-white scale-110`
                      : isDone
                      ? 'bg-dark-card border-green-500/60 text-green-400'
                      : 'bg-dark-surface border-dark-border text-gray-500'
                  }`}
                  style={isActive ? { boxShadow: `0 0 16px ${phase.color}60` } : {}}
                >
                  {isDone && !isActive ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <span className="text-xs font-bold">{phase.num}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="text-center min-w-0">
                  <p className={`text-xs font-semibold leading-tight truncate max-w-[64px] ${
                    isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-gray-500'
                  }`} style={isActive ? { color: phase.color } : {}}>
                    {phase.label}
                  </p>
                  <p className="text-[10px] text-gray-600 leading-tight">{phase.subtitle}</p>
                </div>
              </motion.button>

              {/* Connector arrow */}
              {index < PHASES.length - 1 && (
                <div className={`shrink-0 transition-colors duration-300 ${
                  completedPhases.includes(PHASES[index + 1]?.id) || isDone
                    ? 'text-primary-600'
                    : 'text-dark-border'
                }`}>
                  <ChevronRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-dark-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-600 via-cyber-purple to-cyber-pink rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedPhases.length / PHASES.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-gray-600 mt-1">
        {completedPhases.length}/{PHASES.length} phases complete
      </p>
    </div>
  );
}

export { PHASES };
