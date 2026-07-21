"""
Register Allocator module.
Uses liveness analysis + interference graph (NetworkX) + graph coloring.
"""
import networkx as nx
import re


NUM_REGISTERS = 8
REGISTER_NAMES = [f"R{i}" for i in range(NUM_REGISTERS)]


def _extract_variables(instructions: list) -> set:
    """Get all variable and temp names from instructions."""
    variables = set()
    for instr in instructions:
        for key in ("result", "arg1", "arg2"):
            val = instr.get(key)
            if val and isinstance(val, str):
                # Only take identifiers (not numbers, strings, labels)
                if re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', val):
                    variables.add(val)
    return variables


def _build_basic_blocks(instructions: list) -> list:
    """Split TAC into basic blocks (lists of instructions)."""
    if not instructions:
        return [[]]

    # Find leader indices
    leaders = {0}
    for i, instr in enumerate(instructions):
        if instr["op"] in ("GOTO", "IF_FALSE"):
            if i + 1 < len(instructions):
                leaders.add(i + 1)
        if instr["op"] == "LABEL":
            leaders.add(i)

    leader_list = sorted(leaders)
    blocks = []
    for idx, start in enumerate(leader_list):
        end = leader_list[idx + 1] if idx + 1 < len(leader_list) else len(instructions)
        block = instructions[start:end]
        if block:
            blocks.append(block)
    return blocks if blocks else [instructions]


def _liveness_analysis(instructions: list, variables: set) -> list:
    """
    Compute live-in and live-out sets for each instruction.
    Simple backward dataflow analysis within a linear sequence.
    """
    n = len(instructions)
    live_in = [set() for _ in range(n)]
    live_out = [set() for _ in range(n)]

    # Backward pass
    for _ in range(3):  # iterate to convergence (3 passes sufficient for small TAC)
        for i in range(n - 1, -1, -1):
            instr = instructions[i]
            # Use = {arg1, arg2} ∩ variables
            use = set()
            for key in ("arg1", "arg2"):
                val = instr.get(key)
                if val and isinstance(val, str) and re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', val):
                    if val in variables:
                        use.add(val)
            # Def = {result}
            defs = set()
            result = instr.get("result")
            if result and isinstance(result, str) and re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', result):
                if result in variables:
                    defs.add(result)

            live_out_i = live_out[i]
            live_in[i] = use | (live_out_i - defs)
            if i + 1 < n:
                live_out[i] = live_in[i + 1]

    return live_in, live_out


def build_interference_graph(instructions: list, variables: set) -> nx.Graph:
    """
    Build the interference graph.
    Two variables interfere if they are both live at the same program point.
    """
    G = nx.Graph()
    G.add_nodes_from(variables)

    _, live_out = _liveness_analysis(instructions, variables)

    for live_set in live_out:
        live_list = list(live_set)
        for i in range(len(live_list)):
            for j in range(i + 1, len(live_list)):
                G.add_edge(live_list[i], live_list[j])

    # Also add edges for simultaneously defined + live variables
    for instr in instructions:
        result = instr.get("result")
        arg1, arg2 = instr.get("arg1"), instr.get("arg2")
        if result and result in variables:
            for arg in (arg1, arg2):
                if arg and arg in variables and arg != result:
                    G.add_edge(result, arg)

    return G


def graph_color(G: nx.Graph, k: int = NUM_REGISTERS) -> dict:
    """
    Greedy graph coloring. Returns {node: color_index}.
    Uses largest-first ordering heuristic.
    """
    if len(G.nodes()) == 0:
        return {}
    coloring = nx.coloring.greedy_color(G, strategy="largest_first")
    return coloring


def allocate_registers(instructions: list) -> dict:
    """
    Main register allocation function.
    Returns allocation map, interference graph data, and live ranges.
    """
    variables = _extract_variables(instructions)

    if not variables:
        return {
            "allocation": {},
            "interference_graph": {"nodes": [], "edges": []},
            "register_usage": {},
            "spills": [],
            "live_ranges": {},
        }

    # Filter out non-meaningful names (very long strings, etc.)
    variables = {v for v in variables if len(v) <= 20 and not v[0].isdigit()}

    G = build_interference_graph(instructions, variables)
    coloring = graph_color(G)

    # Map color -> register name
    allocation = {}
    spills = []
    for var, color in coloring.items():
        if color < NUM_REGISTERS:
            allocation[var] = REGISTER_NAMES[color]
        else:
            allocation[var] = f"SPILL[{color - NUM_REGISTERS}]"
            spills.append(var)

    # Compute live ranges: first def to last use for each variable
    live_ranges = {}
    for i, instr in enumerate(instructions):
        for key in ("result", "arg1", "arg2"):
            val = instr.get(key)
            if val and val in variables:
                if val not in live_ranges:
                    live_ranges[val] = {"start": i, "end": i}
                else:
                    live_ranges[val]["end"] = i

    # Register usage count
    register_usage = {}
    for var, reg in allocation.items():
        register_usage[reg] = register_usage.get(reg, [])
        register_usage[reg].append(var)

    # Serialize interference graph
    ig_nodes = [{"id": n, "register": allocation.get(n, "?"), "color": coloring.get(n, 0)} for n in G.nodes()]
    ig_edges = [{"source": u, "target": v} for u, v in G.edges()]

    return {
        "allocation": allocation,
        "interference_graph": {"nodes": ig_nodes, "edges": ig_edges},
        "register_usage": register_usage,
        "spills": spills,
        "live_ranges": live_ranges,
        "num_colors_used": max(coloring.values()) + 1 if coloring else 0,
    }
