import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Network, Table2 } from 'lucide-react';

const REGISTER_COLORS = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444',
  '#06b6d4','#ec4899','#f97316','#84cc16','#6366f1',
];

export default function RegisterGraph({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.interference_graph) return;
    drawGraph(data.interference_graph, data.allocation || {});
  }, [data]);

  const drawGraph = (graph, allocation) => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 350;

    d3.select(svgRef.current).selectAll('*').remove();

    if (!graph.nodes?.length) {
      d3.select(svgRef.current)
        .append('text')
        .attr('x', width / 2).attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .attr('font-size', '13')
        .text('No interference graph data');
      return;
    }

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height);

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.3, 2]).on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // Map register names to color indices
    const regColorMap = {};
    let colorIdx = 0;
    graph.nodes.forEach((n) => {
      const reg = allocation[n.id] || n.register || '';
      if (reg && !regColorMap[reg]) {
        regColorMap[reg] = REGISTER_COLORS[colorIdx % REGISTER_COLORS.length];
        colorIdx++;
      }
    });

    // Force simulation
    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.edges).id((d) => d.id).distance(80).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(35));

    // Links
    const link = g.selectAll('line')
      .data(graph.edges)
      .enter().append('line')
      .attr('stroke', 'rgba(100,116,139,0.4)')
      .attr('stroke-width', 1.5);

    // Nodes
    const node = g.selectAll('g.node')
      .data(graph.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    const getNodeColor = (d) => {
      const reg = allocation[d.id] || d.register || '';
      return regColorMap[reg] || '#374151';
    };

    node.append('circle')
      .attr('r', 22)
      .attr('fill', (d) => getNodeColor(d) + '30')
      .attr('stroke', (d) => getNodeColor(d))
      .attr('stroke-width', 2)
      .style('filter', (d) => `drop-shadow(0 0 8px ${getNodeColor(d)}60)`);

    node.append('text')
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '10').attr('font-weight', 'bold')
      .attr('fill', '#e2e8f0').attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => d.id.length > 6 ? d.id.slice(0, 5) + '…' : d.id);

    // Show register label below
    node.append('text')
      .attr('text-anchor', 'middle').attr('dy', '1.1em')
      .attr('font-size', '9').attr('fill', (d) => getNodeColor(d))
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => allocation[d.id] || d.register || '?');

    node.append('title').text((d) => `${d.id} → ${allocation[d.id] || '?'}`);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  };

  if (!data) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-gray-500 text-sm">
        No register data yet.
      </div>
    );
  }

  const { allocation = {}, register_usage = {}, spills = [], live_ranges = {}, num_colors_used = 0 } = data;

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border shrink-0">
        <Network size={15} className="text-orange-400" />
        <span className="text-sm font-semibold text-gray-200">Register Allocation</span>
        <span className="badge badge-orange text-[10px]">{num_colors_used} registers used</span>
        {spills.length > 0 && <span className="badge badge-red text-[10px]">{spills.length} spills</span>}
      </div>

      <div className="flex flex-1 overflow-hidden divide-x divide-dark-border">
        {/* D3 Graph */}
        <div ref={containerRef} className="flex-1 overflow-hidden bg-dark-surface/30">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Allocation table */}
        <div className="w-44 overflow-y-auto shrink-0">
          <div className="sticky top-0 bg-dark-card px-3 py-2 border-b border-dark-border">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
              <Table2 size={10} /> Allocation
            </p>
          </div>
          <div className="p-2 space-y-1">
            {Object.entries(allocation).map(([variable, reg]) => (
              <div key={variable} className="flex items-center justify-between gap-1 text-xs">
                <span className="font-mono text-gray-300 truncate">{variable}</span>
                <span className={`badge text-[10px] shrink-0 ${reg.startsWith('SPILL') ? 'badge-red' : 'badge-orange'}`}>
                  {reg}
                </span>
              </div>
            ))}
          </div>

          {/* Live ranges */}
          {Object.keys(live_ranges).length > 0 && (
            <>
              <div className="sticky top-0 bg-dark-card px-3 py-2 border-y border-dark-border mt-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Live Ranges</p>
              </div>
              <div className="p-2 space-y-1">
                {Object.entries(live_ranges).map(([v, range]) => (
                  <div key={v} className="text-[10px] text-gray-500">
                    <span className="text-gray-300 font-mono">{v}</span>
                    <span className="ml-1">[{range.start}–{range.end}]</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
