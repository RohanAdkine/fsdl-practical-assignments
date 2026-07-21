"""
Parser module: generates AST from Python, Java, or C source code.
Converts AST nodes into JSON-serializable dicts for D3.js rendering.
"""
import ast
import re


# ─── Python Parser ────────────────────────────────────────────────────────────

def _ast_to_dict(node, depth=0):
    """Recursively convert Python ast.AST nodes to dicts."""
    if isinstance(node, ast.AST):
        node_type = type(node).__name__
        result = {
            "name": node_type,
            "type": "node",
            "depth": depth,
            "children": [],
            "attributes": {},
        }
        for field, value in ast.iter_fields(node):
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, ast.AST):
                        child = _ast_to_dict(item, depth + 1)
                        child["field"] = field
                        result["children"].append(child)
                    elif isinstance(item, (str, int, float, bool)) and item is not None:
                        result["attributes"][field] = result["attributes"].get(field, [])
                        if isinstance(result["attributes"][field], list):
                            result["attributes"][field].append(str(item))
            elif isinstance(value, ast.AST):
                child = _ast_to_dict(value, depth + 1)
                child["field"] = field
                result["children"].append(child)
            elif value is not None:
                result["attributes"][field] = str(value)

        # Make leaf nodes more descriptive
        if not result["children"] and result["attributes"]:
            attr_str = ", ".join(f"{k}={v}" for k, v in list(result["attributes"].items())[:2])
            result["name"] = f"{node_type}({attr_str})"

        return result
    elif isinstance(node, (str, int, float, bool)):
        return {"name": str(node), "type": "leaf", "depth": depth, "children": [], "attributes": {}}
    return {"name": repr(node), "type": "leaf", "depth": depth, "children": [], "attributes": {}}


def parse_python(code: str) -> dict:
    """Parse Python code and return AST dict."""
    try:
        tree = ast.parse(code, mode="exec")
        ast_dict = _ast_to_dict(tree)
        # Extract grammar rules used
        rules = set()
        for node in ast.walk(tree):
            rules.add(type(node).__name__)
        return {
            "ast": ast_dict,
            "grammar_rules": sorted(rules),
            "errors": [],
        }
    except SyntaxError as e:
        return {
            "ast": None,
            "grammar_rules": [],
            "errors": [{"message": str(e), "line": e.lineno, "col": e.offset}],
        }


# ─── Java Parser (via javalang) ──────────────────────────────────────────────

def _java_node_to_dict(node, depth=0):
    """Convert javalang AST nodes to JSON-serializable dicts."""
    try:
        import javalang
    except ImportError:
        return {"name": "javalang_not_installed", "children": [], "type": "error", "depth": depth, "attributes": {}}

    if node is None:
        return None

    if isinstance(node, str):
        return {"name": node, "type": "leaf", "depth": depth, "children": [], "attributes": {}}
    if isinstance(node, (int, float, bool)):
        return {"name": str(node), "type": "leaf", "depth": depth, "children": [], "attributes": {}}

    node_type = type(node).__name__
    result = {"name": node_type, "type": "node", "depth": depth, "children": [], "attributes": {}}

    try:
        attrs = node.attrs if hasattr(node, "attrs") else []
        for attr in attrs:
            val = getattr(node, attr, None)
            if val is None:
                continue
            if isinstance(val, list):
                for item in val:
                    child = _java_node_to_dict(item, depth + 1)
                    if child:
                        child["field"] = attr
                        result["children"].append(child)
            elif hasattr(val, "attrs"):  # another AST node
                child = _java_node_to_dict(val, depth + 1)
                if child:
                    child["field"] = attr
                    result["children"].append(child)
            else:
                result["attributes"][attr] = str(val)
    except Exception:
        pass

    if not result["children"] and result["attributes"]:
        attr_str = ", ".join(f"{k}={v}" for k, v in list(result["attributes"].items())[:2])
        result["name"] = f"{node_type}({attr_str})"

    return result


def parse_java(code: str) -> dict:
    try:
        import javalang
        tree = javalang.parse.parse(code)
        ast_dict = _java_node_to_dict(tree)
        return {"ast": ast_dict, "grammar_rules": ["CompilationUnit", "ClassDeclaration", "MethodDeclaration"], "errors": []}
    except ImportError:
        return {"ast": _simple_java_ast(code), "grammar_rules": ["SimpleJavaAST"], "errors": []}
    except Exception as e:
        return {"ast": _simple_java_ast(code), "grammar_rules": [], "errors": [{"message": str(e), "line": 0, "col": 0}]}


def _simple_java_ast(code: str) -> dict:
    """Fallback: build a simple structural AST for Java code."""
    root = {"name": "Program", "type": "node", "depth": 0, "children": [], "attributes": {}}
    class_matches = re.finditer(r'class\s+(\w+)', code)
    for cm in class_matches:
        class_node = {"name": f"ClassDecl({cm.group(1)})", "type": "node", "depth": 1, "children": [], "attributes": {"name": cm.group(1)}}
        method_matches = re.finditer(r'(?:public|private|protected|static)?\s+\w+\s+(\w+)\s*\(', code[cm.start():])
        for mm in method_matches:
            method_node = {"name": f"Method({mm.group(1)})", "type": "node", "depth": 2, "children": [], "attributes": {"name": mm.group(1)}}
            class_node["children"].append(method_node)
        root["children"].append(class_node)
    return root


# ─── C Parser (via pycparser) ─────────────────────────────────────────────────

def _c_node_to_dict(node, depth=0):
    """Convert pycparser AST nodes to JSON-serializable dicts."""
    if node is None:
        return None
    node_type = type(node).__name__
    result = {"name": node_type, "type": "node", "depth": depth, "children": [], "attributes": {}}
    try:
        for name, child in node.children():
            if hasattr(child, "children"):
                child_dict = _c_node_to_dict(child, depth + 1)
                if child_dict:
                    child_dict["field"] = name
                    result["children"].append(child_dict)
            else:
                result["attributes"][name] = str(child)
    except Exception:
        pass
    # Enrich leaf names
    for attr in ("name", "value", "op"):
        if hasattr(node, attr) and getattr(node, attr) is not None:
            result["attributes"][attr] = str(getattr(node, attr))
    if not result["children"] and result["attributes"]:
        attr_str = ", ".join(f"{k}={v}" for k, v in list(result["attributes"].items())[:2])
        result["name"] = f"{node_type}({attr_str})"
    return result


def parse_c(code: str) -> dict:
    try:
        import pycparser
        parser = pycparser.CParser()
        # pycparser requires #include to be resolved; we strip them for simplicity
        stripped = re.sub(r'#[^\n]*', '', code)
        tree = parser.parse(stripped, filename="<none>")
        ast_dict = _c_node_to_dict(tree)
        return {"ast": ast_dict, "grammar_rules": ["FileAST", "Decl", "FuncDef"], "errors": []}
    except ImportError:
        return {"ast": _simple_c_ast(code), "grammar_rules": ["SimpleCAST"], "errors": []}
    except Exception as e:
        return {"ast": _simple_c_ast(code), "grammar_rules": [], "errors": [{"message": str(e), "line": 0, "col": 0}]}


def _simple_c_ast(code: str) -> dict:
    """Fallback structural AST for C."""
    root = {"name": "TranslationUnit", "type": "node", "depth": 0, "children": [], "attributes": {}}
    func_matches = re.finditer(r'(?:int|void|float|double|char)\s+(\w+)\s*\(', code)
    for fm in func_matches:
        func_node = {"name": f"FunctionDef({fm.group(1)})", "type": "node", "depth": 1, "children": [], "attributes": {"name": fm.group(1)}}
        root["children"].append(func_node)
    return root


# ─── Public API ───────────────────────────────────────────────────────────────

def parse_code(code: str, language: str) -> dict:
    lang = language.lower()
    if lang == "python":
        return parse_python(code)
    elif lang == "java":
        return parse_java(code)
    elif lang == "c":
        return parse_c(code)
    else:
        return {"ast": None, "grammar_rules": [], "errors": [{"message": f"Unsupported language: {language}"}]}
