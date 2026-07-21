import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Copy, Check } from 'lucide-react';

const OP_COLORS = {
  ASSIGN: 'text-blue-400',
  ADD: 'text-emerald-400',
  SUB: 'text-red-400',
  MUL: 'text-green-400',
  DIV: 'text-yellow-400',
  MOD: 'text-orange-400',
  POW: 'text-amber-400',
  LABEL: 'text-pink-400',
  GOTO: 'text-orange-400',
  IF_FALSE: 'text-yellow-400',
  RETURN: 'text-purple-400',
  CALL: 'text-cyan-400',
  PARAM: 'text-teal-400',
  PRINT: 'text-indigo-400',
  EQ: 'text-cyan-400', NE: 'text-cyan-400',
  LT: 'text-cyan-400', GT: 'text-cyan-400', LE: 'text-cyan-400', GE: 'text-cyan-400',
};

export default function TACView({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data?.instructions) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No intermediate code generated yet.
      </div>
    );
  }

  const { instructions, temp_count } = data;

  const copyToClipboard = () => {
    const text = instructions.map((i) => i.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-emerald-400" />
          <span className="text-sm font-semibold text-gray-200">Three-Address Code</span>
          <span className="badge badge-green text-[10px]">{instructions.length} instructions</span>
          <span className="badge badge-yellow text-[10px]">{temp_count} temps</span>
        </div>
        <button onClick={copyToClipboard} className="btn-secondary text-xs px-2.5 py-1.5">
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono">
        {instructions.map((instr, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.5) }}
            className={`tac-line flex items-start gap-3 ${instr.op === 'LABEL' ? 'mt-2' : ''}`}
          >
            <span className="text-gray-600 w-8 text-right shrink-0 select-none">{i + 1}</span>
            {instr.op === 'LABEL' ? (
              <div className="flex items-center gap-2 text-pink-400 font-bold">
                <span>{instr.label}:</span>
                <span className="text-xs text-gray-600 font-normal">{/* label marker */}</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1 text-sm leading-relaxed">
                {instr.result && (
                  <>
                    <span className="text-white font-semibold">{instr.result}</span>
                    <span className="text-gray-500">=</span>
                  </>
                )}
                {instr.arg1 && (
                  <span className={OP_COLORS[instr.op] === 'text-blue-400' ? 'text-gray-300' : 'text-gray-300'}>
                    {instr.arg1}
                  </span>
                )}
                {instr.op !== 'ASSIGN' && instr.op !== 'LABEL' && instr.op !== 'PARAM' && instr.op !== 'RETURN' && (
                  <span className={`font-semibold ${OP_COLORS[instr.op] || 'text-gray-400'}`}>
                    {getOpSymbol(instr.op)}
                  </span>
                )}
                {instr.arg2 && <span className="text-gray-300">{instr.arg2}</span>}
                {instr.label && instr.op !== 'LABEL' && (
                  <span className="text-orange-400 ml-1">→ {instr.label}</span>
                )}
                <span className="text-gray-600 pl-2 text-xs">// {instr.op}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getOpSymbol(op) {
  const symbols = {
    ADD: '+', SUB: '-', MUL: '*', DIV: '/', MOD: '%', POW: '**',
    EQ: '==', NE: '!=', LT: '<', GT: '>', LE: '<=', GE: '>=',
    IF_FALSE: 'if_false', GOTO: 'goto', CALL: 'call', PARAM: 'param',
    RETURN: 'return', PRINT: 'print', UMINUS: '-', NOT: 'not',
    AND: '&&', OR: '||', INDEX: '[]', STORE_INDEX: '[]=',
  };
  return symbols[op] || op;
}
