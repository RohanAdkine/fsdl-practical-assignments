"""
Code Optimizer module.
Applies:
  1. Constant Folding
  2. Dead Code Elimination
  3. Common Subexpression Elimination (CSE)
  4. Loop Optimization (strength reduction)
"""
import re
import ast as pyast


def _is_constant(val: str) -> bool:
    """Return True if val is a numeric or string literal."""
    if val is None:
        return False
    val = str(val).strip()
    try:
        float(val)
        return True
    except ValueError:
        pass
    if val.startswith(('"', "'")) and val.endswith(('"', "'")):
        return True
    if val in ("True", "False", "None"):
        return True
    return False


def _eval_constant(val: str):
    """Safely evaluate a constant string."""
    try:
        return pyast.literal_eval(val)
    except Exception:
        return None


def _fold_constant(op: str, a, b) -> str | None:
    """Attempt constant folding for arithmetic ops."""
    try:
        av, bv = float(a), float(b)
        result = {
            "ADD": av + bv, "SUB": av - bv, "MUL": av * bv,
            "DIV": av / bv if bv != 0 else None,
            "MOD": av % bv if bv != 0 else None,
            "POW": av ** bv,
        }.get(op)
        if result is None:
            return None
        # Return int if whole number
        if result == int(result):
            return str(int(result))
        return str(result)
    except Exception:
        return None


def constant_folding(instructions: list) -> tuple[list, list]:
    """Replace constant expressions with their computed values."""
    result = []
    applied = []
    for instr in instructions:
        if instr["op"] in ("ADD", "SUB", "MUL", "DIV", "MOD", "POW") and \
                _is_constant(instr.get("arg1")) and _is_constant(instr.get("arg2")):
            folded = _fold_constant(instr["op"], instr["arg1"], instr["arg2"])
            if folded is not None:
                new_instr = dict(instr)
                new_instr["op"] = "ASSIGN"
                new_instr["arg1"] = folded
                new_instr["arg2"] = None
                op_sym = {"ADD": "+", "SUB": "-", "MUL": "*", "DIV": "/", "MOD": "%", "POW": "**"}[instr["op"]]
                new_instr["text"] = f"{instr['result']} = {folded}  // folded: {instr['arg1']} {op_sym} {instr['arg2']}"
                result.append(new_instr)
                applied.append(f"Folded: {instr['arg1']} {instr['op']} {instr['arg2']} = {folded}")
                continue
        result.append(instr)
    return result, applied


def dead_code_elimination(instructions: list) -> tuple[list, list]:
    """Remove assignments to temporaries that are never read."""
    # Build use set — all arg1, arg2 values
    used = set()
    for instr in instructions:
        for arg in ("arg1", "arg2"):
            v = instr.get(arg)
            if v and isinstance(v, str) and re.match(r'^t\d+$', v):
                used.add(v)
        # RETURN, PRINT, PARAM use their arg1 as a value
        if instr["op"] in ("RETURN", "PRINT", "PARAM", "IF_FALSE"):
            v = instr.get("arg1")
            if v:
                used.add(str(v))

    result = []
    removed = []
    for instr in instructions:
        result_var = instr.get("result")
        # If it's a temp assignment and the temp is never used downstream, remove it
        if (result_var and re.match(r'^t\d+$', str(result_var))
                and result_var not in used
                and instr["op"] in ("ASSIGN",)):
            removed.append(f"Eliminated dead assignment: {instr['text']}")
            continue
        result.append(instr)
    return result, removed


def common_subexpression_elimination(instructions: list) -> tuple[list, list]:
    """Replace repeated computations with the first computed temp."""
    expr_map = {}  # (op, arg1, arg2) -> temp_name
    substitution = {}  # old_temp -> new_temp
    result = []
    applied = []

    def apply_sub(val):
        if val is None:
            return val
        return substitution.get(str(val), val)

    for instr in instructions:
        # Apply existing substitutions to operands
        instr = dict(instr)
        instr["arg1"] = apply_sub(instr.get("arg1"))
        instr["arg2"] = apply_sub(instr.get("arg2"))

        if instr["op"] in ("ADD", "SUB", "MUL", "DIV", "MOD", "POW", "EQ", "NE", "LT", "GT", "LE", "GE"):
            key = (instr["op"], str(instr.get("arg1")), str(instr.get("arg2")))
            if key in expr_map:
                existing_temp = expr_map[key]
                if instr.get("result"):
                    substitution[instr["result"]] = existing_temp
                    applied.append(f"CSE: {instr['result']} reuses {existing_temp} = {key[1]} {key[0]} {key[2]}")
                continue  # Skip re-computing
            else:
                if instr.get("result"):
                    expr_map[key] = instr["result"]

        # Re-build text after substitutions
        if instr.get("arg1") or instr.get("result"):
            instr["text"] = _rebuild_text(instr)
        result.append(instr)
    return result, applied


def _rebuild_text(instr: dict) -> str:
    op = instr["op"]
    a1, a2, res = instr.get("arg1"), instr.get("arg2"), instr.get("result")
    sym = {"ADD": "+", "SUB": "-", "MUL": "*", "DIV": "/", "MOD": "%", "POW": "**",
           "EQ": "==", "NE": "!=", "LT": "<", "GT": ">", "LE": "<=", "GE": ">="}
    if op == "ASSIGN":
        return f"{res} = {a1}"
    if op in sym:
        return f"{res} = {a1} {sym[op]} {a2}"
    if op == "GOTO":
        return f"goto {instr.get('label')}"
    if op == "IF_FALSE":
        return f"if_false {a1} goto {instr.get('label')}"
    if op == "LABEL":
        return f"{instr.get('label')}:"
    if op == "RETURN":
        return f"return {a1 or ''}"
    if op == "CALL":
        return f"{res} = call {a1}({a2 or ''})"
    return instr.get("text", str(instr))


def optimize(instructions: list) -> dict:
    """Apply all optimizations sequentially and return before/after."""
    original = [dict(i) for i in instructions]
    all_applied = []

    # Pass 1: Constant Folding
    instructions, cf_applied = constant_folding(instructions)
    all_applied.extend(cf_applied)

    # Pass 2: CSE
    instructions, cse_applied = common_subexpression_elimination(instructions)
    all_applied.extend(cse_applied)

    # Pass 3: Dead Code Elimination
    instructions, dce_applied = dead_code_elimination(instructions)
    all_applied.extend(dce_applied)

    return {
        "original": original,
        "optimized": instructions,
        "applied_optimizations": all_applied,
        "stats": {
            "constant_folding": len(cf_applied),
            "cse": len(cse_applied),
            "dead_code_elimination": len(dce_applied),
            "instructions_removed": len(original) - len(instructions),
        }
    }
