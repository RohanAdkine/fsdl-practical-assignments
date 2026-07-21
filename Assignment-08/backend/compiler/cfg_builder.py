"""
Control Flow Graph (CFG) builder.
Builds basic blocks and edges from TAC instructions.
"""
import re


def build_cfg(instructions: list) -> dict:
    """
    Build a Control Flow Graph from TAC instructions.
    Returns nodes (basic blocks) and edges.
    """
    if not instructions:
        return {"nodes": [], "edges": []}

    # Step 1: Find leaders (start of basic blocks)
    leaders = set()
    leaders.add(0)

    # Build label-to-index map
    label_map = {}
    for i, instr in enumerate(instructions):
        if instr["op"] == "LABEL":
            label_map[instr.get("label", "")] = i

    for i, instr in enumerate(instructions):
        op = instr["op"]
        if op in ("GOTO", "IF_FALSE"):
            # Target of jump is a leader
            target_label = instr.get("label", "")
            if target_label in label_map:
                leaders.add(label_map[target_label])
            # Instruction after jump is a leader
            if i + 1 < len(instructions):
                leaders.add(i + 1)

    leader_list = sorted(leaders)

    # Step 2: Build basic blocks
    blocks = []
    for idx, start in enumerate(leader_list):
        end = leader_list[idx + 1] if idx + 1 < len(leader_list) else len(instructions)
        block_instrs = instructions[start:end]
        if block_instrs:
            block_id = f"B{idx}"
            # Build human-readable label for the block
            first_instr = block_instrs[0]
            if first_instr["op"] == "LABEL":
                block_label = first_instr.get("label", block_id)
            else:
                block_label = block_id

            blocks.append({
                "id": block_id,
                "label": block_label,
                "start": start,
                "end": end - 1,
                "instructions": [i.get("text", "") for i in block_instrs],
                "raw_instructions": block_instrs,
            })

    # Step 3: Build edges
    edges = []
    block_start_map = {b["start"]: b["id"] for b in blocks}

    for block in blocks:
        last_instr = block["raw_instructions"][-1] if block["raw_instructions"] else None
        next_block_start = block["end"] + 1

        if last_instr is None:
            continue

        op = last_instr["op"]

        if op == "GOTO":
            target = last_instr.get("label", "")
            if target in label_map:
                target_start = label_map[target]
                target_block = block_start_map.get(target_start)
                if target_block:
                    edges.append({"source": block["id"], "target": target_block, "label": "goto"})

        elif op == "IF_FALSE":
            # Condition true: fall through to next block
            if next_block_start in block_start_map:
                edges.append({"source": block["id"], "target": block_start_map[next_block_start], "label": "true"})
            # Condition false: jump to label
            target = last_instr.get("label", "")
            if target in label_map:
                target_start = label_map[target]
                target_block = block_start_map.get(target_start)
                if target_block and target_block != block_start_map.get(next_block_start):
                    edges.append({"source": block["id"], "target": target_block, "label": "false"})

        elif op == "RETURN":
            pass  # Terminal block

        else:
            # Fall through to next block
            if next_block_start in block_start_map:
                edges.append({"source": block["id"], "target": block_start_map[next_block_start], "label": ""})

    return {
        "nodes": [{"id": b["id"], "label": b["label"], "instructions": b["instructions"]} for b in blocks],
        "edges": edges,
    }
