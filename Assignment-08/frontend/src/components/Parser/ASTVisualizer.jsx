import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function ASTVisualizer({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    if (!data?.ast) return;
    drawTree(data.ast);
  }, [data]);

  const drawTree = (astData) => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Convert flat dict to d3 hierarchy
    const root = d3.hierarchy(astData, (d) => d.children?.length ? d.children : null);
    setNodeCount(root.descendants().length);
    setDepth(root.height);

    // Limit depth for performance
    if (root.descendants().length > 300) {
      root.descendants().forEach((d) => {
        if (d.depth >= 5) {
          d._children = d.children;
          d.children = null;
        }
      });
    }

    const treeLayout = d3.tree().nodeSize([140, 60]);

    let collapsed = {};
    const update = (source) => {
      treeLayout(root);
      const nodes = root.descendants();
      const links = root.links();

      g.selectAll('*').remove();

      // Links
      g.selectAll('path.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
          .x((d) => d.x)
          .y((d) => d.y * 1.5))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(100,116,139,0.5)')
        .attr('stroke-width', 1.5);

      // Nodes
      const node = g.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d) => `translate(${d.x},${d.y * 1.5})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          if (d._children) {
            d.children = d._children;
            d._children = null;
          } else if (d.children) {
            d._children = d.children;
            d.children = null;
          }
          update(d);
        });

      const nodeColor = (d) => {
        if (d.data.type === 'leaf') return '#1e40af';
        const depth = d.depth;
        const colors = ['#1d4ed8', '#1e40af', '#1e3a8a', '#1d4ed8', '#2563eb'];
        return colors[depth % colors.length];
      };

      const nodeBorder = (d) => {
        if (d.data.type === 'leaf') return '#3b82f6';
        const depth = d.depth;
        const colors = ['#60a5fa', '#818cf8', '#34d399', '#fbbf24', '#fb923c'];
        return colors[depth % colors.length];
      };

      // Node rect
      const nodeWidth = 120, nodeHeight = 32;
      node.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('rx', 6)
        .attr('fill', nodeColor)
        .attr('stroke', nodeBorder)
        .attr('stroke-width', 1.5)
        .style('filter', (d) => d.data.type !== 'leaf' ? 'drop-shadow(0 0 6px rgba(99,102,241,0.4))' : 'none');

      // Collapse indicator dot
      node.filter((d) => d._children)
        .append('circle')
        .attr('r', 5)
        .attr('cx', nodeWidth / 2 - 6)
        .attr('cy', -nodeHeight / 2 + 6)
        .attr('fill', '#f59e0b');

      // Node text
      node.append('text')
        .attr('dy', '0.32em')
        .attr('text-anchor', 'middle')
        .attr('font-family', "'JetBrains Mono', monospace")
        .attr('font-size', '10px')
        .attr('fill', '#e2e8f0')
        .text((d) => {
          const name = d.data.name || '';
          return name.length > 18 ? name.substring(0, 17) + '…' : name;
        });

      // Tooltip
      node.append('title')
        .text((d) => `${d.data.name}\nType: ${d.data.type || 'node'}\nChildren: ${d.data.children?.length || 0}`);
    };

    update(root);

    // Initial center
    const initialX = width / 2;
    const initialY = 50;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(0.8));
  };

  if (!data?.ast) {
    return (
      <div className="glass-card h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <GitBranch size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No AST data. Compile to see the syntax tree.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-gray-200">Abstract Syntax Tree</span>
          {nodeCount > 0 && <span className="badge badge-purple text-[10px]">{nodeCount} nodes</span>}
          {depth > 0 && <span className="badge badge-blue text-[10px]">depth {depth}</span>}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Click nodes to expand/collapse • Scroll to zoom • Drag to pan</span>
        </div>
      </div>

      {/* Grammar rules */}
      {data.grammar_rules?.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-dark-border shrink-0">
          <span className="text-[10px] text-gray-500 mr-1">Grammar rules:</span>
          {data.grammar_rules.slice(0, 8).map((rule) => (
            <span key={rule} className="badge badge-purple text-[10px]">{rule}</span>
          ))}
          {data.grammar_rules.length > 8 && (
            <span className="text-[10px] text-gray-500">+{data.grammar_rules.length - 8} more</span>
          )}
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-hidden bg-dark-surface/50">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
