import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GitMerge } from 'lucide-react';

export default function CFGVisualizer({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.nodes?.length) return;
    drawCFG(data);
  }, [data]);

  const drawCFG = (cfg) => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.2, 2]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -5 10 10')
      .attr('refX', 32).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#4b5563');

    // Layout: top-down DAG using simple column/row assignment
    const nodeMap = {};
    cfg.nodes.forEach((n) => { nodeMap[n.id] = n; });

    // BFS layering
    const layers = {};
    const visited = new Set();
    const queue = [{ id: cfg.nodes[0]?.id, layer: 0 }];
    while (queue.length) {
      const { id, layer } = queue.shift();
      if (!id || visited.has(id)) continue;
      visited.add(id);
      layers[id] = layer;
      cfg.edges.filter((e) => e.source === id).forEach((e) => {
        if (!visited.has(e.target)) queue.push({ id: e.target, layer: layer + 1 });
      });
    }

    const nodeW = 150, nodeH = 50;
    const layerMap = {};
    Object.entries(layers).forEach(([id, layer]) => {
      if (!layerMap[layer]) layerMap[layer] = [];
      layerMap[layer].push(id);
    });

    const positions = {};
    Object.entries(layerMap).forEach(([layer, ids]) => {
      ids.forEach((id, idx) => {
        const totalWidth = ids.length * (nodeW + 20);
        positions[id] = {
          x: (idx - (ids.length - 1) / 2) * (nodeW + 30) + width / 2,
          y: parseInt(layer) * 120 + 60,
        };
      });
    });

    // Fallback positions for disconnected nodes
    cfg.nodes.forEach((n, i) => {
      if (!positions[n.id]) {
        positions[n.id] = { x: 100 + (i % 4) * 170, y: 80 + Math.floor(i / 4) * 120 };
      }
    });

    // Draw edges
    g.selectAll('line.edge')
      .data(cfg.edges)
      .enter().append('line')
      .attr('class', 'edge')
      .attr('x1', (d) => (positions[d.source] || {x:0}).x + nodeW / 2)
      .attr('y1', (d) => (positions[d.source] || {y:0}).y + nodeH)
      .attr('x2', (d) => (positions[d.target] || {x:0}).x + nodeW / 2)
      .attr('y2', (d) => (positions[d.target] || {y:0}).y)
      .attr('stroke', (d) => d.label === 'true' ? '#10b981' : d.label === 'false' ? '#ef4444' : '#4b5563')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Edge labels
    g.selectAll('text.edge-label')
      .data(cfg.edges.filter((e) => e.label))
      .enter().append('text')
      .attr('class', 'edge-label')
      .attr('x', (d) => ((positions[d.source]?.x || 0) + (positions[d.target]?.x || 0)) / 2 + nodeW / 2)
      .attr('y', (d) => ((positions[d.source]?.y || 0) + (positions[d.target]?.y || 0)) / 2 + nodeH / 2)
      .attr('fill', (d) => d.label === 'true' ? '#10b981' : d.label === 'false' ? '#ef4444' : '#6b7280')
      .attr('font-size', '9').attr('text-anchor', 'middle')
      .text((d) => d.label);

    // Draw nodes
    const node = g.selectAll('g.cfg-node')
      .data(cfg.nodes)
      .enter().append('g')
      .attr('class', 'cfg-node')
      .attr('transform', (d) => `translate(${positions[d.id]?.x || 0},${positions[d.id]?.y || 0})`);

    node.append('rect')
      .attr('width', nodeW).attr('height', nodeH).attr('rx', 8)
      .attr('fill', '#1f2937').attr('stroke', '#3b82f6').attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0 0 6px rgba(59,130,246,0.3))');

    node.append('text')
      .attr('x', nodeW / 2).attr('y', 14)
      .attr('text-anchor', 'middle').attr('font-size', '10').attr('font-weight', 'bold')
      .attr('fill', '#60a5fa').attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => d.label);

    node.append('text')
      .attr('x', nodeW / 2).attr('y', 30)
      .attr('text-anchor', 'middle').attr('font-size', '9').attr('fill', '#9ca3af')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => {
        const instrs = d.instructions || [];
        const preview = instrs.slice(0, 1).join('; ');
        return preview.length > 22 ? preview.slice(0, 21) + '…' : preview;
      });

    node.append('title').text((d) => (d.instructions || []).join('\n'));

    // Center the view
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 20).scale(0.9));
  };

  if (!data?.nodes?.length) {
    return (
      <div className="glass-card h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <GitMerge size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No CFG data. Compile to see the control flow graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border shrink-0">
        <GitMerge size={15} className="text-blue-400" />
        <span className="text-sm font-semibold text-gray-200">Control Flow Graph</span>
        <span className="badge badge-blue text-[10px]">{data.nodes.length} blocks</span>
        <span className="badge text-[10px]">{data.edges.length} edges</span>
        <span className="text-[10px] text-gray-500 ml-auto">Scroll to zoom • Drag to pan</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden bg-dark-surface/30">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
