import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Copy, Check, Code } from 'lucide-react';

const ASM_TYPE_STYLES = {
  data_move: { border: 'border-l-gray-500', op: 'text-gray-400' },
  arithmetic: { border: 'border-l-blue-500', op: 'text-blue-400' },
  compare: { border: 'border-l-purple-500', op: 'text-purple-400' },
  jump: { border: 'border-l-orange-500', op: 'text-orange-400' },
  branch: { border: 'border-l-yellow-500', op: 'text-yellow-400' },
  function: { border: 'border-l-cyan-500', op: 'text-cyan-400' },
  stack: { border: 'border-l-green-500', op: 'text-green-400' },
  io: { border: 'border-l-pink-500', op: 'text-pink-400' },
  data: { border: 'border-l-teal-500', op: 'text-teal-400' },
  label: { border: 'border-l-pink-500', op: 'text-pink-500' },
};

export default function AssemblyOutput({ data }) {
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState('all');

  if (!data) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No assembly code yet.
      </div>
    );
  }

  const { data_section = [], text_section = [], all_instructions = [] } = data;

  const displayed = section === 'data' ? data_section : section === 'text' ? text_section : all_instructions;

  const copyAll = () => {
    const txt = [
      '; === DATA SECTION ===',
      ...data_section.map((i) => '  ' + i.instruction),
      '',
      '; === TEXT SECTION ===',
      ...text_section.map((i) => (i.op === 'LABEL' ? i.instruction : '  ' + i.instruction)),
    ].join('\n');
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-pink-400" />
          <span className="text-sm font-semibold text-gray-200">Assembly Output</span>
          <span className="badge badge-pink text-[10px]">{all_instructions.length} instructions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['all', 'data', 'text'].map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`text-xs px-2 py-1 rounded ${section === s ? 'bg-pink-600/30 text-pink-300 border border-pink-600/40' : 'text-gray-500 hover:text-gray-300'}`}
              >
                .{s}
              </button>
            ))}
          </div>
          <button onClick={copyAll} className="btn-secondary text-xs px-2.5 py-1.5">
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-dark-border shrink-0">
        {[
          { type: 'data_move', label: 'MOV' },
          { type: 'arithmetic', label: 'Arithmetic' },
          { type: 'compare', label: 'CMP' },
          { type: 'jump', label: 'JMP' },
          { type: 'branch', label: 'Branch' },
          { type: 'function', label: 'CALL/RET' },
        ].map(({ type, label }) => (
          <div key={type} className={`flex items-center gap-1 text-[10px] ${ASM_TYPE_STYLES[type]?.op || 'text-gray-400'}`}>
            <div className={`w-1.5 h-3 rounded-sm ${ASM_TYPE_STYLES[type]?.border.replace('border-l-', 'bg-')}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {displayed.map((instr, i) => {
          const style = ASM_TYPE_STYLES[instr.type] || ASM_TYPE_STYLES.data_move;
          const isLabel = instr.type === 'label';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              className={`asm-line ${style.border} ${isLabel ? 'mt-3 mb-0.5' : ''}`}
            >
              {isLabel ? (
                <span className="text-pink-400 font-bold">{instr.instruction}</span>
              ) : (
                <div className="flex items-center justify-between">
                  <span>
                    <span className={`${style.op} font-semibold mr-2`}>
                      {instr.op || instr.instruction.split(' ')[0]}
                    </span>
                    <span className="text-gray-300">
                      {instr.operands?.join(', ') || instr.instruction.split(' ').slice(1).join(' ')}
                    </span>
                  </span>
                  {instr.comment && (
                    <span className="text-gray-600 ml-3 text-[10px]">; {instr.comment}</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Code size={24} className="mb-2 opacity-30" />
            <p>No assembly instructions in this section</p>
          </div>
        )}
      </div>
    </div>
  );
}
