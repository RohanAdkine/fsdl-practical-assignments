"""
Assembly Code Generator.
Converts optimized TAC + register allocation into x86-like assembly instructions.
"""


def generate_assembly(instructions: list, allocation: dict) -> list:
    """
    Generate simple assembly from TAC instructions and register allocation.
    Returns list of assembly instruction dicts.
    """
    assembly = []

    def reg(var: str) -> str:
        """Get register for a variable, or use the value directly."""
        if var is None:
            return "?"
        v = str(var)
        if v in allocation:
            return allocation[v]
        # Check if it's a constant/literal
        try:
            float(v)
            return f"#{v}"  # immediate value
        except ValueError:
            pass
        if v.startswith(("'", '"')):
            return v
        if v in ("True", "False", "None"):
            return f"#{v}"
        return allocation.get(v, v)

    section_data = []
    section_text = []

    for instr in instructions:
        op = instr["op"]
        a1, a2, res = instr.get("arg1"), instr.get("arg2"), instr.get("result")
        label = instr.get("label")

        if op == "LABEL":
            section_text.append({
                "type": "label",
                "instruction": f"{label}:",
                "comment": "Label",
                "op": "LABEL",
                "operands": [label],
            })
        elif op == "ASSIGN":
            if res and a1:
                dest = reg(res)
                src = reg(a1)
                section_text.append({
                    "type": "data_move",
                    "instruction": f"MOV {dest}, {src}",
                    "comment": f"{res} = {a1}",
                    "op": "MOV",
                    "operands": [dest, src],
                })
        elif op == "ADD":
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "arithmetic",
                "instruction": f"ADD {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} + {a2}",
                "op": "ADD",
                "operands": [dest, r1, r2],
            })
        elif op == "SUB":
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "arithmetic",
                "instruction": f"SUB {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} - {a2}",
                "op": "SUB",
                "operands": [dest, r1, r2],
            })
        elif op == "MUL":
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "arithmetic",
                "instruction": f"MUL {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} * {a2}",
                "op": "MUL",
                "operands": [dest, r1, r2],
            })
        elif op == "DIV":
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "arithmetic",
                "instruction": f"DIV {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} / {a2}",
                "op": "DIV",
                "operands": [dest, r1, r2],
            })
        elif op == "MOD":
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "arithmetic",
                "instruction": f"MOD {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} % {a2}",
                "op": "MOD",
                "operands": [dest, r1, r2],
            })
        elif op in ("EQ", "NE", "LT", "GT", "LE", "GE"):
            dest = reg(res)
            r1, r2 = reg(a1), reg(a2)
            section_text.append({
                "type": "compare",
                "instruction": f"CMP {dest}, {r1}, {r2}",
                "comment": f"{res} = {a1} {op} {a2}",
                "op": "CMP",
                "operands": [dest, r1, r2],
            })
        elif op == "GOTO":
            section_text.append({
                "type": "jump",
                "instruction": f"JMP {label}",
                "comment": f"goto {label}",
                "op": "JMP",
                "operands": [label],
            })
        elif op == "IF_FALSE":
            r1 = reg(a1)
            section_text.append({
                "type": "branch",
                "instruction": f"JZ {r1}, {label}",
                "comment": f"if not {a1} goto {label}",
                "op": "JZ",
                "operands": [r1, label],
            })
        elif op == "RETURN":
            if a1:
                r1 = reg(a1)
                section_text.append({
                    "type": "function",
                    "instruction": f"MOV R0, {r1}",
                    "comment": f"return value in R0",
                    "op": "MOV",
                    "operands": ["R0", r1],
                })
            section_text.append({
                "type": "function",
                "instruction": "RET",
                "comment": "return from function",
                "op": "RET",
                "operands": [],
            })
        elif op == "CALL":
            if res:
                dest = reg(res)
            section_text.append({
                "type": "function",
                "instruction": f"CALL {a1}",
                "comment": f"call function {a1}",
                "op": "CALL",
                "operands": [a1 or "func"],
            })
            if res and a1:
                section_text.append({
                    "type": "data_move",
                    "instruction": f"MOV {reg(res)}, R0",
                    "comment": "store return value",
                    "op": "MOV",
                    "operands": [reg(res), "R0"],
                })
        elif op == "PARAM":
            r1 = reg(a1)
            section_text.append({
                "type": "stack",
                "instruction": f"PUSH {r1}",
                "comment": f"push parameter {a1}",
                "op": "PUSH",
                "operands": [r1],
            })
        elif op == "PRINT":
            r1 = reg(a1)
            section_text.append({
                "type": "io",
                "instruction": f"OUT {r1}",
                "comment": f"print {a1}",
                "op": "OUT",
                "operands": [r1],
            })

    # Build data section for user-named variables
    data_vars = {v: r for v, r in allocation.items() if not v.startswith("t")}
    for var, register in data_vars.items():
        section_data.append({
            "type": "data",
            "instruction": f".data {var}",
            "comment": f"allocate {var} -> {register}",
            "op": ".data",
            "operands": [var],
        })

    return {
        "data_section": section_data,
        "text_section": section_text,
        "all_instructions": section_data + section_text,
    }
