import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table2, AlertCircle, CheckCircle, Search } from 'lucide-react';

const KIND_COLORS = {
  variable: 'badge-blue',
  function: 'badge-purple',
  class: 'badge-yellow',
  parameter: 'badge-cyan',
  import: 'badge-green',
  module: 'badge-green',
};

const SEVERITY_ICON = {
  error: <AlertCircle size={12} className="text-red-400" />,
  warning: <AlertCircle size={12} className="text-yellow-400" />,
};

export default function SymbolTable({ data }) {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');

  if (!data) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No semantic data yet.
      </div>
    );
  }

  const { symbol_table = [], errors = [], scopes = [] } = data;

  const filtered = symbol_table.filter((sym) => {
    const matchSearch = search === '' ||
      sym.name?.toLowerCase().includes(search.toLowerCase()) ||
      sym.type?.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === 'all' || sym.scope === scopeFilter;
    return matchSearch && matchScope;
  });

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Table2 size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-gray-200">Semantic Analysis</span>
          <span className="badge badge-cyan text-[10px]">{symbol_table.length} symbols</span>
        </div>
        {errors.length > 0 && (
          <span className="badge badge-red text-[10px]">
            {errors.filter(e => e.severity === 'error').length} errors,{' '}
            {errors.filter(e => e.severity === 'warning').length} warnings
          </span>
        )}
      </div>

      {/* Errors panel */}
      {errors.length > 0 && (
        <div className="px-4 py-2 border-b border-dark-border bg-yellow-950/20 shrink-0">
          <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wider">Diagnostics</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                {SEVERITY_ICON[err.severity] || SEVERITY_ICON.warning}
                <span className={err.severity === 'error' ? 'text-red-300' : 'text-yellow-300'}>
                  {err.message}
                  {err.line > 0 && <span className="text-gray-500 ml-1">(line {err.line})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 px-4 py-2 border-b border-dark-border shrink-0">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-dark-surface border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-dark-surface border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500"
        >
          <option value="all">All scopes</option>
          {scopes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Symbol table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-dark-card/90 backdrop-blur-sm">
            <tr className="border-b border-dark-border">
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Name</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Type</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Kind</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Scope</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Line</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Memory</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sym, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="border-b border-dark-border/40 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-white font-semibold">{sym.name}</td>
                <td className="px-4 py-2 text-amber-400 font-mono">{sym.type}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${KIND_COLORS[sym.kind] || 'badge'} text-[10px]`}>
                    {sym.kind}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-400 font-mono">{sym.scope}</td>
                <td className="px-4 py-2 text-gray-500">{sym.line}</td>
                <td className="px-4 py-2 font-mono text-green-400 text-[10px]">{sym.memory}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">No symbols found</div>
        )}
      </div>
    </div>
  );
}
