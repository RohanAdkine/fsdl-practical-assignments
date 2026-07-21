"""
Three-Address Code (TAC) Generator.
Converts AST (or source code via ast.parse for Python) to TAC instructions.
"""
import ast as pyast
import re


class TACInstruction:
    def __init__(self, op, arg1=None, arg2=None, result=None, label=None, line=0):
        self.op = op
        self.arg1 = arg1
        self.arg2 = arg2
        self.result = result
        self.label = label
        self.line = line

    def to_dict(self):
        return {
            "op": self.op,
            "arg1": self.arg1,
            "arg2": self.arg2,
            "result": self.result,
            "label": self.label,
            "line": self.line,
            "text": self._text(),
        }

    def _text(self):
        if self.op == "LABEL":
            return f"{self.label}:"
        if self.op == "ASSIGN":
            return f"{self.result} = {self.arg1}"
        if self.op in ("ADD", "SUB", "MUL", "DIV", "MOD", "POW"):
            symbol = {
                "ADD": "+", "SUB": "-", "MUL": "*",
                "DIV": "/", "MOD": "%", "POW": "**",
            }[self.op]
            return f"{self.result} = {self.arg1} {symbol} {self.arg2}"
        if self.op in ("EQ", "NE", "LT", "GT", "LE", "GE"):
            symbol = {"EQ": "==", "NE": "!=", "LT": "<", "GT": ">", "LE": "<=", "GE": ">="}[self.op]
            return f"{self.result} = {self.arg1} {symbol} {self.arg2}"
        if self.op == "GOTO":
            return f"goto {self.label}"
        if self.op == "IF_FALSE":
            return f"if_false {self.arg1} goto {self.label}"
        if self.op == "CALL":
            return f"{self.result} = call {self.arg1}({self.arg2 or ''})"
        if self.op == "PARAM":
            return f"param {self.arg1}"
        if self.op == "RETURN":
            return f"return {self.arg1 or ''}"
        if self.op == "PRINT":
            return f"print {self.arg1}"
        if self.op == "INDEX":
            return f"{self.result} = {self.arg1}[{self.arg2}]"
        if self.op == "STORE_INDEX":
            return f"{self.arg1}[{self.arg2}] = {self.result}"
        if self.op == "UMINUS":
            return f"{self.result} = -{self.arg1}"
        if self.op == "NOT":
            return f"{self.result} = not {self.arg1}"
        return f"{self.op} {self.arg1 or ''} {self.arg2 or ''} -> {self.result or ''}"


class PythonTACGenerator(pyast.NodeVisitor):
    def __init__(self):
        self.instructions = []
        self._temp_count = 0
        self._label_count = 0

    def _new_temp(self):
        t = f"t{self._temp_count}"
        self._temp_count += 1
        return t

    def _new_label(self):
        l = f"L{self._label_count}"
        self._label_count += 1
        return l

    def _emit(self, op, arg1=None, arg2=None, result=None, label=None, line=0):
        instr = TACInstruction(op, arg1, arg2, result, label, line)
        self.instructions.append(instr)
        return result

    def generate(self, code: str) -> list:
        try:
            tree = pyast.parse(code)
            self.visit(tree)
        except SyntaxError:
            pass
        return self.instructions

    def visit_Module(self, node):
        for stmt in node.body:
            self.visit(stmt)

    def visit_Expr(self, node):
        self.visit(node.value)

    def visit_Assign(self, node):
        line = node.lineno
        val_temp = self._visit_expr(node.value, line)
        for target in node.targets:
            if isinstance(target, pyast.Name):
                self._emit("ASSIGN", arg1=val_temp, result=target.id, line=line)
            elif isinstance(target, pyast.Subscript):
                idx = self._visit_expr(target.slice, line)
                self._emit("STORE_INDEX", arg1=self._visit_expr(target.value, line) if isinstance(target.value, pyast.Name) else "?", arg2=idx, result=val_temp, line=line)

    def visit_AnnAssign(self, node):
        if node.value:
            line = node.lineno
            val_temp = self._visit_expr(node.value, line)
            if isinstance(node.target, pyast.Name):
                self._emit("ASSIGN", arg1=val_temp, result=node.target.id, line=line)

    def visit_AugAssign(self, node):
        line = node.lineno
        op_map = {
            pyast.Add: "ADD", pyast.Sub: "SUB", pyast.Mult: "MUL",
            pyast.Div: "DIV", pyast.Mod: "MOD", pyast.Pow: "POW",
        }
        op = op_map.get(type(node.op), "ADD")
        if isinstance(node.target, pyast.Name):
            rhs = self._visit_expr(node.value, line)
            t = self._new_temp()
            self._emit(op, arg1=node.target.id, arg2=rhs, result=t, line=line)
            self._emit("ASSIGN", arg1=t, result=node.target.id, line=line)

    def visit_If(self, node):
        line = node.lineno
        cond = self._visit_expr(node.test, line)
        false_label = self._new_label()
        end_label = self._new_label()
        self._emit("IF_FALSE", arg1=cond, label=false_label, line=line)
        for stmt in node.body:
            self.visit(stmt)
        if node.orelse:
            self._emit("GOTO", label=end_label, line=line)
        self._emit("LABEL", label=false_label, line=line)
        for stmt in node.orelse:
            self.visit(stmt)
        if node.orelse:
            self._emit("LABEL", label=end_label, line=line)

    def visit_While(self, node):
        line = node.lineno
        start_label = self._new_label()
        end_label = self._new_label()
        self._emit("LABEL", label=start_label, line=line)
        cond = self._visit_expr(node.test, line)
        self._emit("IF_FALSE", arg1=cond, label=end_label, line=line)
        for stmt in node.body:
            self.visit(stmt)
        self._emit("GOTO", label=start_label, line=line)
        self._emit("LABEL", label=end_label, line=line)

    def visit_For(self, node):
        line = node.lineno
        iter_temp = self._visit_expr(node.iter, line)
        idx_temp = self._new_temp()
        self._emit("ASSIGN", arg1="0", result=idx_temp, line=line)
        start_label = self._new_label()
        end_label = self._new_label()
        self._emit("LABEL", label=start_label, line=line)
        cond_temp = self._new_temp()
        len_temp = self._new_temp()
        self._emit("CALL", arg1="len", arg2=iter_temp, result=len_temp, line=line)
        self._emit("LT", arg1=idx_temp, arg2=len_temp, result=cond_temp, line=line)
        self._emit("IF_FALSE", arg1=cond_temp, label=end_label, line=line)
        if isinstance(node.target, pyast.Name):
            self._emit("INDEX", arg1=iter_temp, arg2=idx_temp, result=node.target.id, line=line)
        for stmt in node.body:
            self.visit(stmt)
        idx_inc = self._new_temp()
        self._emit("ADD", arg1=idx_temp, arg2="1", result=idx_inc, line=line)
        self._emit("ASSIGN", arg1=idx_inc, result=idx_temp, line=line)
        self._emit("GOTO", label=start_label, line=line)
        self._emit("LABEL", label=end_label, line=line)

    def visit_Return(self, node):
        if node.value:
            val = self._visit_expr(node.value, node.lineno)
            self._emit("RETURN", arg1=val, line=node.lineno)
        else:
            self._emit("RETURN", line=node.lineno)

    def visit_FunctionDef(self, node):
        self._emit("LABEL", label=f"func_{node.name}", line=node.lineno)
        for stmt in node.body:
            self.visit(stmt)

    visit_AsyncFunctionDef = visit_FunctionDef

    def _visit_expr(self, node, line=0) -> str:
        if isinstance(node, pyast.Constant):
            return repr(node.value)
        if isinstance(node, pyast.Name):
            return node.id
        if isinstance(node, pyast.BinOp):
            op_map = {
                pyast.Add: "ADD", pyast.Sub: "SUB", pyast.Mult: "MUL",
                pyast.Div: "DIV", pyast.FloorDiv: "DIV", pyast.Mod: "MOD",
                pyast.Pow: "POW",
            }
            op = op_map.get(type(node.op), "ADD")
            left = self._visit_expr(node.left, line)
            right = self._visit_expr(node.right, line)
            t = self._new_temp()
            self._emit(op, arg1=left, arg2=right, result=t, line=line)
            return t
        if isinstance(node, pyast.BoolOp):
            vals = [self._visit_expr(v, line) for v in node.values]
            op_str = "AND" if isinstance(node.op, pyast.And) else "OR"
            acc = vals[0]
            for v in vals[1:]:
                t = self._new_temp()
                self._emit(op_str, arg1=acc, arg2=v, result=t, line=line)
                acc = t
            return acc
        if isinstance(node, pyast.Compare):
            left = self._visit_expr(node.left, line)
            op_map = {
                pyast.Eq: "EQ", pyast.NotEq: "NE", pyast.Lt: "LT",
                pyast.Gt: "GT", pyast.LtE: "LE", pyast.GtE: "GE",
            }
            right = self._visit_expr(node.comparators[0], line)
            op = op_map.get(type(node.ops[0]), "EQ")
            t = self._new_temp()
            self._emit(op, arg1=left, arg2=right, result=t, line=line)
            return t
        if isinstance(node, pyast.UnaryOp):
            val = self._visit_expr(node.operand, line)
            t = self._new_temp()
            if isinstance(node.op, pyast.USub):
                self._emit("UMINUS", arg1=val, result=t, line=line)
            elif isinstance(node.op, pyast.Not):
                self._emit("NOT", arg1=val, result=t, line=line)
            else:
                self._emit("ASSIGN", arg1=val, result=t, line=line)
            return t
        if isinstance(node, pyast.Call):
            args = [self._visit_expr(a, line) for a in node.args]
            for a in args:
                self._emit("PARAM", arg1=a, line=line)
            func_name = node.func.id if isinstance(node.func, pyast.Name) else "func"
            t = self._new_temp()
            self._emit("CALL", arg1=func_name, arg2=str(len(args)), result=t, line=line)
            return t
        if isinstance(node, pyast.Subscript):
            val = self._visit_expr(node.value, line)
            idx = self._visit_expr(node.slice, line)
            t = self._new_temp()
            self._emit("INDEX", arg1=val, arg2=idx, result=t, line=line)
            return t
        if isinstance(node, pyast.List):
            t = self._new_temp()
            self._emit("ASSIGN", arg1="[]", result=t, line=line)
            return t
        if isinstance(node, pyast.Tuple):
            t = self._new_temp()
            self._emit("ASSIGN", arg1="()", result=t, line=line)
            return t
        if isinstance(node, pyast.Dict):
            t = self._new_temp()
            self._emit("ASSIGN", arg1="{}", result=t, line=line)
            return t
        # Fallback
        t = self._new_temp()
        self._emit("ASSIGN", arg1="?", result=t, line=line)
        return t


# ─── Simple TAC from line-by-line (Java/C fallback) ──────────────────────────

def generate_tac_simple(code: str, language: str) -> list:
    """
    Simplified TAC generation for Java/C via regex pattern matching.
    Handles assignments, binary ops, function calls.
    """
    instructions = []
    temp_count = [0]
    label_count = [0]

    def new_temp():
        t = f"t{temp_count[0]}"
        temp_count[0] += 1
        return t

    assign_pat = re.compile(r'^(\w+)\s*=\s*(.+?)\s*;?$')
    binary_op_pat = re.compile(r'(.+?)\s*([+\-*/%])\s*(.+)')
    return_pat = re.compile(r'return\s+(.+?)\s*;?$')
    if_pat = re.compile(r'if\s*\((.+)\)')

    for i, line in enumerate(code.split("\n"), 1):
        line = line.strip()
        if not line or line.startswith("//") or line.startswith("/*") or line.startswith("#"):
            continue
        if "{" == line or "}" == line:
            continue

        # Return statement
        rm = return_pat.match(line)
        if rm:
            val = rm.group(1).strip()
            instructions.append(TACInstruction("RETURN", arg1=val, line=i).to_dict())
            continue

        # If statement
        im = if_pat.match(line)
        if im:
            cond = im.group(1).strip()
            label = f"L{label_count[0]}"
            label_count[0] += 1
            instructions.append(TACInstruction("IF_FALSE", arg1=cond, label=label, line=i).to_dict())
            continue

        # Assignment
        am = assign_pat.match(line)
        if am:
            var, rhs = am.group(1), am.group(2).strip()
            bm = binary_op_pat.match(rhs)
            if bm:
                left, op_sym, right = bm.group(1).strip(), bm.group(2), bm.group(3).strip()
                op_map = {"+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD"}
                op = op_map.get(op_sym, "ADD")
                t = new_temp()
                instructions.append(TACInstruction(op, arg1=left, arg2=right, result=t, line=i).to_dict())
                instructions.append(TACInstruction("ASSIGN", arg1=t, result=var, line=i).to_dict())
            elif "(" in rhs and ")" in rhs:
                func_match = re.match(r'(\w+)\s*\(', rhs)
                t = new_temp()
                fname = func_match.group(1) if func_match else "func"
                instructions.append(TACInstruction("CALL", arg1=fname, result=t, line=i).to_dict())
                instructions.append(TACInstruction("ASSIGN", arg1=t, result=var, line=i).to_dict())
            else:
                instructions.append(TACInstruction("ASSIGN", arg1=rhs, result=var, line=i).to_dict())

    return instructions


# ─── Public API ───────────────────────────────────────────────────────────────

def generate_tac(code: str, language: str) -> dict:
    lang = language.lower()
    if lang == "python":
        gen = PythonTACGenerator()
        instructions = gen.generate(code)
        return {"instructions": [i.to_dict() for i in instructions], "temp_count": gen._temp_count}
    else:
        instructions = generate_tac_simple(code, lang)
        return {"instructions": instructions, "temp_count": len([i for i in instructions if i.get("result","").startswith("t")])}
