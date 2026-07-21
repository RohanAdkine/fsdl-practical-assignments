import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, AlignLeft, Tag, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react';

const TOKEN_COLORS = {
  KEYWORD: 'badge-blue',
  IDENTIFIER: 'badge-green',
  NUMBER: 'badge-yellow',
  STRING: 'badge-green',
  CHAR: 'badge-green',
  OPERATOR: 'badge-cyan',
  ASSIGN: 'badge-orange',
  EQ: 'badge-cyan', NEQ: 'badge-cyan', LT: 'badge-cyan', GT: 'badge-cyan',
  L_PAREN: 'badge-purple', R_PAREN: 'badge-purple',
  L_BRACKET: 'badge-purple', R_BRACKET: 'badge-purple',
  L_BRACE: 'badge-purple', R_BRACE: 'badge-purple',
  COMMA: 'badge', SEMICOLON: 'badge', COLON: 'badge', DOT: 'badge',
  COMMENT: 'badge text-gray-500', NEWLINE: 'badge', INDENT: 'badge', DEDENT: 'badge',
  PREPROCESSOR: 'badge-pink',
  ERROR: 'badge-red',
};

export default function TokenTable({ data }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [collapsed, setCollapsed] = useState(false);

  if (!data || !data.tokens) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No token data yet. Compile some code first.
      </div>
    );
  }

  const { tokens, summary, total } = data;

  const tokenTypes = ['all', ...new Set(tokens.map((t) => t.type))];

  const filtered = tokens.filter((t) => {
    const matchSearch = search === '' || 
      t.value.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <Hash size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-gray-200">Lexical Analysis</span>
          <span className="badge badge-blue ml-1">{total} tokens</span>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="btn-secondary p-1.5">
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Summary badges */}
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-dark-border shrink-0">
            {Object.entries(summary || {}).slice(0, 8).map(([type, count]) => (
              <span key={type} className={`badge ${TOKEN_COLORS[type] || 'badge'} text-[10px]`}>
                {type}: {count}
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-4 py-2 border-b border-dark-border shrink-0">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-dark-surface border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1.5 text-xs bg-dark-surface border border-dark-border rounded-lg text-gray-300 focus:outline-none focus:border-primary-500"
            >
              {tokenTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-dark-card/90 backdrop-blur-sm">
                <tr className="border-b border-dark-border">
                  <th className="text-left px-4 py-2 text-gray-500 font-medium w-8">#</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">Value</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium w-12">Line</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium w-12">Col</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((token, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.01, 0.3) }}
                      className="border-b border-dark-border/40 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-1.5 text-gray-600">{i + 1}</td>
                      <td className="px-4 py-1.5">
                        <span className={`badge ${TOKEN_COLORS[token.type] || 'badge'} text-[10px]`}>
                          {token.type}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 font-mono text-[11px] text-gray-200 max-w-[180px] truncate">
                        {token.value}
                      </td>
                      <td className="px-4 py-1.5 text-gray-500">{token.line}</td>
                      <td className="px-4 py-1.5 text-gray-500">{token.col}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs">No tokens match your filter</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
