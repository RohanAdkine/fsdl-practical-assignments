import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, GitBranch, Cpu, Network, Terminal, Zap, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: <Code2 size={20} />, title: 'Lexical Analysis', desc: 'Tokenize source code into typed tokens with line/col info', color: 'from-blue-600 to-blue-800' },
  { icon: <GitBranch size={20} />, title: 'AST Visualization', desc: 'Interactive D3.js collapsible syntax tree with zoom & pan', color: 'from-violet-600 to-violet-800' },
  { icon: <Cpu size={20} />, title: 'Semantic Analysis', desc: 'Type checking, scope analysis, and symbol table generation', color: 'from-cyan-600 to-cyan-800' },
  { icon: <Zap size={20} />, title: 'TAC & Optimization', desc: 'Three-address code with constant folding, CSE, dead code elimination', color: 'from-amber-600 to-amber-800' },
  { icon: <Network size={20} />, title: 'Register Allocation', desc: 'Graph-coloring register assignment with interference graph', color: 'from-orange-600 to-orange-800' },
  { icon: <Terminal size={20} />, title: 'Assembly Generation', desc: 'x86-like assembly output with section view and copy support', color: 'from-pink-600 to-pink-800' },
];

const LANGS = [
  { name: 'Python', color: '#3b82f6' },
  { name: 'Java', color: '#f59e0b' },
  { name: 'C', color: '#10b981' },
];

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] overflow-auto"
      style={{ background: 'radial-gradient(ellipse at 50% -30%, rgba(59,130,246,0.12) 0%, transparent 60%)' }}>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600/15 border border-primary-600/30 text-primary-400 text-xs font-medium mb-5">
            <Sparkles size={12} />
            Research-Level Compiler Visualization
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            See How Your Code
            <span className="block bg-gradient-to-r from-primary-400 via-cyber-purple to-cyber-cyan bg-clip-text text-transparent">
              Becomes Machine Instructions
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            An AI-powered educational platform that visualizes every phase of the compiler pipeline —
            from lexical tokenization to final assembly code — with interactive graphs and AI explanations.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/editor"
              className="btn-primary text-sm px-6 py-3 justify-center shadow-glow-blue hover:scale-105 transition-transform">
              <Code2 size={16} /> Start Compiling
              <ArrowRight size={14} />
            </Link>
            <Link to="/register"
              className="btn-secondary text-sm px-6 py-3 justify-center hover:scale-105 transition-transform">
              Create Free Account
            </Link>
          </div>

          {/* Language badges */}
          <div className="flex justify-center gap-2 mt-6">
            {LANGS.map((l) => (
              <span key={l.name} className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{ color: l.color, borderColor: l.color + '40', background: l.color + '15' }}>
                {l.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card-hover p-5 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 text-white`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Feature callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 glass-card p-6 border border-cyber-purple/30"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%)' }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                AI-Powered Explanations
                <span className="badge badge-purple text-[10px]">GPT + Built-in</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Click "Explain This Phase" for any compiler stage to get a rich, educational breakdown —
                powered by OpenAI GPT when configured, or detailed built-in explanations covering every concept.
                Perfect for students, educators, and researchers.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link to="/editor"
            className="btn-primary text-sm px-8 py-3 justify-center inline-flex shadow-glow-blue">
            <Code2 size={16} /> Open Editor
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
