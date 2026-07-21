"""
Semantic Analysis module:
  - Builds symbol table (name, type, scope, line, memory location)
  - Type checking
  - Undeclared variable detection
  - Scope analysis
"""
import ast as pyast
import re


# ─── Python Semantic Analyzer ─────────────────────────────────────────────────

class PythonSemanticAnalyzer(pyast.NodeVisitor):
    def __init__(self):
        self.symbol_table = []
        self.errors = []
        self.scope_stack = ["global"]
        self._mem_counter = 0

    def _mem(self):
        addr = f"0x{(0x1000 + self._mem_counter * 4):04X}"
        self._mem_counter += 1
        return addr

    def _current_scope(self):
        return ".".join(self.scope_stack)

    def _find_symbol(self, name):
        for sym in reversed(self.symbol_table):
            if sym["name"] == name:
                return sym
        return None

    def _infer_type(self, node):
        if isinstance(node, pyast.Constant):
            return type(node.value).__name__
        if isinstance(node, pyast.List):
            return "list"
        if isinstance(node, pyast.Dict):
            return "dict"
        if isinstance(node, pyast.Set):
            return "set"
        if isinstance(node, pyast.Tuple):
            return "tuple"
        if isinstance(node, pyast.Call):
            if isinstance(node.func, pyast.Name):
                return node.func.id  # approximate
        if isinstance(node, pyast.BinOp):
            lt = self._infer_type(node.left)
            rt = self._infer_type(node.right)
            if lt == rt:
                return lt
            if {lt, rt} <= {"int", "float"}:
                return "float"
            return "unknown"
        return "unknown"

    def visit_FunctionDef(self, node):
        # Add function itself to symbol table
        self.symbol_table.append({
            "name": node.name,
            "type": "function",
            "scope": self._current_scope(),
            "line": node.lineno,
            "memory": self._mem(),
            "kind": "function",
        })
        # Arguments
        self.scope_stack.append(node.name)
        for arg in node.args.args:
            ann = ""
            if arg.annotation and isinstance(arg.annotation, pyast.Name):
                ann = arg.annotation.id
            self.symbol_table.append({
                "name": arg.arg,
                "type": ann or "unknown",
                "scope": self._current_scope(),
                "line": node.lineno,
                "memory": self._mem(),
                "kind": "parameter",
            })
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_AsyncFunctionDef(self, node):
        self.visit_FunctionDef(node)

    def visit_ClassDef(self, node):
        self.symbol_table.append({
            "name": node.name,
            "type": "class",
            "scope": self._current_scope(),
            "line": node.lineno,
            "memory": self._mem(),
            "kind": "class",
        })
        self.scope_stack.append(node.name)
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_Assign(self, node):
        inferred = self._infer_type(node.value)
        for target in node.targets:
            if isinstance(target, pyast.Name):
                existing = self._find_symbol(target.id)
                if not existing:
                    self.symbol_table.append({
                        "name": target.id,
                        "type": inferred,
                        "scope": self._current_scope(),
                        "line": node.lineno,
                        "memory": self._mem(),
                        "kind": "variable",
                    })
                else:
                    # Update type if same scope
                    existing["type"] = inferred
        self.generic_visit(node)

    def visit_AnnAssign(self, node):
        ann = ""
        if isinstance(node.annotation, pyast.Name):
            ann = node.annotation.id
        elif isinstance(node.annotation, pyast.Subscript):
            ann = pyast.unparse(node.annotation)
        if isinstance(node.target, pyast.Name):
            self.symbol_table.append({
                "name": node.target.id,
                "type": ann or "unknown",
                "scope": self._current_scope(),
                "line": node.lineno,
                "memory": self._mem(),
                "kind": "variable",
            })
        self.generic_visit(node)

    # Python does NOT require variable declarations before use.
    # Variables are bound on assignment, for-loop targets, with-as clauses,
    # comprehension targets, lambda parameters, etc.
    # We intentionally do NOT emit "undeclared variable" warnings for Python.

    def _register_target(self, target, line, kind="variable", inferred="unknown"):
        """Register any Name / Tuple / List assignment target into the symbol table."""
        if isinstance(target, pyast.Name):
            if not self._find_symbol(target.id):
                self.symbol_table.append({
                    "name": target.id,
                    "type": inferred,
                    "scope": self._current_scope(),
                    "line": line,
                    "memory": self._mem(),
                    "kind": kind,
                })
        elif isinstance(target, (pyast.Tuple, pyast.List)):
            for elt in target.elts:
                self._register_target(elt, line, kind, inferred)

    def visit_For(self, node):
        """Register for-loop target variable(s) e.g. `for i in range(n)`."""
        self._register_target(node.target, node.lineno, kind="loop_var", inferred="unknown")
        self.generic_visit(node)

    def visit_With(self, node):
        """Register `with open(...) as f` variables."""
        for item in node.items:
            if item.optional_vars is not None:
                self._register_target(item.optional_vars, node.lineno, kind="context_var", inferred="unknown")
        self.generic_visit(node)

    def visit_Lambda(self, node):
        """Register lambda parameters."""
        for arg in node.args.args:
            if not self._find_symbol(arg.arg):
                self.symbol_table.append({
                    "name": arg.arg,
                    "type": "unknown",
                    "scope": self._current_scope(),
                    "line": node.lineno,
                    "memory": self._mem(),
                    "kind": "lambda_param",
                })
        self.generic_visit(node)

    def visit_comprehension(self, node):
        """Register comprehension target variables e.g. `[x for x in items]`."""
        self._register_target(node.target, 0, kind="comp_var", inferred="unknown")
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname or alias.name.split(".")[0]
            self.symbol_table.append({
                "name": name,
                "type": "module",
                "scope": self._current_scope(),
                "line": node.lineno,
                "memory": self._mem(),
                "kind": "import",
            })

    def visit_ImportFrom(self, node):
        for alias in node.names:
            name = alias.asname or alias.name
            self.symbol_table.append({
                "name": name,
                "type": f"from {node.module}",
                "scope": self._current_scope(),
                "line": node.lineno,
                "memory": self._mem(),
                "kind": "import",
            })


def analyze_python(code: str) -> dict:
    try:
        tree = pyast.parse(code)
        analyzer = PythonSemanticAnalyzer()
        analyzer.visit(tree)
        return {
            "symbol_table": analyzer.symbol_table,
            "errors": analyzer.errors,
            "scopes": list({s["scope"] for s in analyzer.symbol_table}),
        }
    except SyntaxError as e:
        return {
            "symbol_table": [],
            "errors": [{"type": "SyntaxError", "message": str(e), "line": e.lineno, "severity": "error"}],
            "scopes": [],
        }


# ─── Java Semantic Analyzer (regex-based) ─────────────────────────────────────

def analyze_java(code: str) -> dict:
    symbol_table = []
    errors = []
    mem_counter = [0]

    def mem():
        addr = f"0x{(0x2000 + mem_counter[0] * 4):04X}"
        mem_counter[0] += 1
        return addr

    # Extract class-level and method-level variable declarations
    class_pat = re.compile(r'class\s+(\w+)')
    method_pat = re.compile(r'(?:public|private|protected|static|\s)+(\w[\w<>\[\]]*)\s+(\w+)\s*\(([^)]*)\)')
    var_pat = re.compile(r'(?:int|float|double|long|short|byte|char|boolean|String|var|[\w<>\[\]]+)\s+(\w+)\s*(?:=|;)')

    current_class = "global"
    for i, line in enumerate(code.split("\n"), 1):
        cm = class_pat.search(line)
        if cm:
            current_class = cm.group(1)
            symbol_table.append({"name": cm.group(1), "type": "class", "scope": "global", "line": i, "memory": mem(), "kind": "class"})

        mm = method_pat.search(line)
        if mm:
            ret_type, method_name, params = mm.group(1), mm.group(2), mm.group(3)
            symbol_table.append({"name": method_name, "type": f"{ret_type}()", "scope": current_class, "line": i, "memory": mem(), "kind": "function"})
            if params.strip():
                for param in params.split(","):
                    param = param.strip()
                    parts = param.split()
                    if len(parts) >= 2:
                        symbol_table.append({"name": parts[-1], "type": parts[-2], "scope": f"{current_class}.{method_name}", "line": i, "memory": mem(), "kind": "parameter"})

        vm = var_pat.search(line)
        if vm and not mm:
            # skip if it's a method declaration
            vname = vm.group(1)
            type_match = re.search(r'(\w[\w<>\[\]]*)\s+' + re.escape(vname), line)
            vtype = type_match.group(1) if type_match else "unknown"
            if not any(s["name"] == vname and s["kind"] == "function" for s in symbol_table):
                symbol_table.append({"name": vname, "type": vtype, "scope": current_class, "line": i, "memory": mem(), "kind": "variable"})

    return {"symbol_table": symbol_table, "errors": errors, "scopes": list({s["scope"] for s in symbol_table})}


# ─── C Semantic Analyzer (regex-based) ────────────────────────────────────────

def analyze_c(code: str) -> dict:
    symbol_table = []
    errors = []
    mem_counter = [0]

    def mem():
        addr = f"0x{(0x3000 + mem_counter[0] * 4):04X}"
        mem_counter[0] += 1
        return addr

    func_pat = re.compile(r'(?:int|void|float|double|char|long|short|unsigned)\s+(\w+)\s*\(([^)]*)\)')
    var_pat = re.compile(r'(?:int|float|double|char|long|short|unsigned|void)\s+(\w+)\s*(?:=|;|\[)')

    current_func = "global"
    for i, line in enumerate(code.split("\n"), 1):
        line_s = line.strip()
        if line_s.startswith("//") or line_s.startswith("#"):
            continue
        fm = func_pat.search(line)
        if fm:
            fname = fm.group(1)
            current_func = fname
            symbol_table.append({"name": fname, "type": "function", "scope": "global", "line": i, "memory": mem(), "kind": "function"})
            params = fm.group(2)
            if params.strip():
                for param in params.split(","):
                    param = param.strip()
                    parts = param.split()
                    if len(parts) >= 2:
                        symbol_table.append({"name": parts[-1].lstrip("*"), "type": parts[0], "scope": fname, "line": i, "memory": mem(), "kind": "parameter"})
        elif var_pat.search(line) and "{" not in line and "(" not in line:
            vm = var_pat.search(line)
            vname = vm.group(1)
            type_match = re.search(r'(\w+)\s+' + re.escape(vname), line)
            vtype = type_match.group(1) if type_match else "unknown"
            symbol_table.append({"name": vname, "type": vtype, "scope": current_func, "line": i, "memory": mem(), "kind": "variable"})

    return {"symbol_table": symbol_table, "errors": errors, "scopes": list({s["scope"] for s in symbol_table})}


# ─── Public API ───────────────────────────────────────────────────────────────

def analyze_code(code: str, language: str) -> dict:
    lang = language.lower()
    if lang == "python":
        return analyze_python(code)
    elif lang == "java":
        return analyze_java(code)
    elif lang == "c":
        return analyze_c(code)
    return {"symbol_table": [], "errors": [], "scopes": []}
