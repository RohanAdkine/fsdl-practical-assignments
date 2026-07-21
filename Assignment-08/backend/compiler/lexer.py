"""
Lexer module: tokenizes Python, Java, and C source code.
"""
import tokenize
import io
import re


# ─── Python Tokenizer ────────────────────────────────────────────────────────

PYTHON_TOKEN_MAP = {
    tokenize.NAME: None,  # resolved to KEYWORD or IDENTIFIER below
    tokenize.NUMBER: "NUMBER",
    tokenize.STRING: "STRING",
    tokenize.OP: "OPERATOR",
    tokenize.COMMENT: "COMMENT",
    tokenize.NEWLINE: "NEWLINE",
    tokenize.NL: "NEWLINE",
    tokenize.INDENT: "INDENT",
    tokenize.DEDENT: "DEDENT",
    tokenize.ENCODING: None,  # skip
    tokenize.ENDMARKER: None,  # skip
}

PYTHON_KEYWORDS = {
    "False","None","True","and","as","assert","async","await",
    "break","class","continue","def","del","elif","else","except",
    "finally","for","from","global","if","import","in","is","lambda",
    "nonlocal","not","or","pass","raise","return","try","while","with","yield",
}

PUNCTUATION = {
    "(": "L_PAREN", ")": "R_PAREN",
    "[": "L_BRACKET", "]": "R_BRACKET",
    "{": "L_BRACE", "}": "R_BRACE",
    ",": "COMMA", ";": "SEMICOLON", ":": "COLON", ".": "DOT",
}

OPERATORS = {
    "+": "OPERATOR", "-": "OPERATOR", "*": "OPERATOR", "/": "OPERATOR",
    "%": "OPERATOR", "**": "OPERATOR", "//": "OPERATOR",
    "=": "ASSIGN", "==": "EQ", "!=": "NEQ",
    "<": "LT", ">": "GT", "<=": "LE", ">=": "GE",
    "+=": "OPERATOR", "-=": "OPERATOR", "*=": "OPERATOR", "/=": "OPERATOR",
    "->": "ARROW", "**=": "OPERATOR", "@": "DECORATOR",
    "&": "OPERATOR", "|": "OPERATOR", "^": "OPERATOR", "~": "OPERATOR",
    "<<": "OPERATOR", ">>": "OPERATOR",
    "and": "LOGICAL_OP", "or": "LOGICAL_OP", "not": "LOGICAL_OP",
}


def tokenize_python(code: str) -> list:
    tokens = []
    try:
        gen = tokenize.generate_tokens(io.StringIO(code).readline)
        for tok in gen:
            tok_type = tok.type
            tok_val = tok.string
            tok_line = tok.start[0]
            tok_col = tok.start[1]

            if tok_type in (tokenize.ENCODING, tokenize.ENDMARKER):
                continue
            if tok_type == tokenize.NEWLINE or tok_type == tokenize.NL:
                continue
            if tok_type == tokenize.INDENT or tok_type == tokenize.DEDENT:
                continue

            if tok_type == tokenize.NAME:
                type_str = "KEYWORD" if tok_val in PYTHON_KEYWORDS else "IDENTIFIER"
            elif tok_type == tokenize.NUMBER:
                type_str = "NUMBER"
            elif tok_type == tokenize.STRING:
                type_str = "STRING"
            elif tok_type == tokenize.COMMENT:
                type_str = "COMMENT"
            elif tok_type == tokenize.OP:
                if tok_val in PUNCTUATION:
                    type_str = PUNCTUATION[tok_val]
                else:
                    type_str = OPERATORS.get(tok_val, "OPERATOR")
            else:
                type_str = tokenize.tok_name.get(tok_type, "UNKNOWN")

            tokens.append({
                "type": type_str,
                "value": tok_val,
                "line": tok_line,
                "col": tok_col,
            })
    except tokenize.TokenError as e:
        tokens.append({"type": "ERROR", "value": str(e), "line": 0, "col": 0})
    return tokens


# ─── Java Tokenizer ───────────────────────────────────────────────────────────

JAVA_KEYWORDS = {
    "abstract","assert","boolean","break","byte","case","catch","char","class",
    "const","continue","default","do","double","else","enum","extends","final",
    "finally","float","for","goto","if","implements","import","instanceof","int",
    "interface","long","native","new","package","private","protected","public",
    "return","short","static","strictfp","super","switch","synchronized","this",
    "throw","throws","transient","try","void","volatile","while","true","false","null",
}

JAVA_TOKEN_RE = [
    ("COMMENT",       r'//[^\n]*|/\*[\s\S]*?\*/'),
    ("STRING",        r'"(?:[^"\\]|\\.)*"'),
    ("CHAR",          r"'(?:[^'\\]|\\.)'"),
    ("NUMBER",        r'\b\d+\.\d*[fFdDlL]?|\b\d+[lL]?\b'),
    ("IDENTIFIER",    r'\b[A-Za-z_][A-Za-z0-9_]*\b'),
    ("OPERATOR",      r'[+\-*/%&|^~<>!=]+|\.|\?|:'),
    ("L_PAREN",       r'\('),
    ("R_PAREN",       r'\)'),
    ("L_BRACKET",     r'\['),
    ("R_BRACKET",     r'\]'),
    ("L_BRACE",       r'\{'),
    ("R_BRACE",       r'\}'),
    ("SEMICOLON",     r';'),
    ("COMMA",         r','),
    ("WHITESPACE",    r'\s+'),
]

_JAVA_MASTER = re.compile("|".join(f"(?P<{name}>{pat})" for name, pat in JAVA_TOKEN_RE))


def tokenize_java(code: str) -> list:
    tokens = []
    line_num = 1
    for m in _JAVA_MASTER.finditer(code):
        kind = m.lastgroup
        val = m.group()
        if kind == "WHITESPACE":
            line_num += val.count("\n")
            continue
        if kind == "COMMENT":
            tokens.append({"type": "COMMENT", "value": val.strip(), "line": line_num, "col": m.start()})
            line_num += val.count("\n")
            continue
        if kind == "IDENTIFIER" and val in JAVA_KEYWORDS:
            kind = "KEYWORD"
        tokens.append({"type": kind, "value": val, "line": line_num, "col": m.start()})
    return tokens


# ─── C Tokenizer ─────────────────────────────────────────────────────────────

C_KEYWORDS = {
    "auto","break","case","char","const","continue","default","do","double",
    "else","enum","extern","float","for","goto","if","inline","int","long",
    "register","restrict","return","short","signed","sizeof","static","struct",
    "switch","typedef","union","unsigned","void","volatile","while",
    "NULL","true","false",
}

C_TOKEN_RE = [
    ("COMMENT",     r'//[^\n]*|/\*[\s\S]*?\*/'),
    ("PREPROCESSOR",r'#[^\n]*'),
    ("STRING",      r'"(?:[^"\\]|\\.)*"'),
    ("CHAR",        r"'(?:[^'\\]|\\.)'"),
    ("NUMBER",      r'\b0x[0-9A-Fa-f]+|\b\d+\.\d*[fFlL]?|\b\d+[uUlL]*\b'),
    ("IDENTIFIER",  r'\b[A-Za-z_][A-Za-z0-9_]*\b'),
    ("OPERATOR",    r'->|<<|>>|&&|\|\||[+\-*/%&|^~<>!=]=?|\.'),
    ("L_PAREN",     r'\('), ("R_PAREN",  r'\)'),
    ("L_BRACKET",   r'\['), ("R_BRACKET",r'\]'),
    ("L_BRACE",     r'\{'), ("R_BRACE",  r'\}'),
    ("SEMICOLON",   r';'), ("COMMA",     r','),
    ("WHITESPACE",  r'\s+'),
]

_C_MASTER = re.compile("|".join(f"(?P<{name}>{pat})" for name, pat in C_TOKEN_RE))


def tokenize_c(code: str) -> list:
    tokens = []
    line_num = 1
    for m in _C_MASTER.finditer(code):
        kind = m.lastgroup
        val = m.group()
        if kind == "WHITESPACE":
            line_num += val.count("\n")
            continue
        if kind == "COMMENT":
            tokens.append({"type": "COMMENT", "value": val.strip(), "line": line_num, "col": m.start()})
            line_num += val.count("\n")
            continue
        if kind == "IDENTIFIER" and val in C_KEYWORDS:
            kind = "KEYWORD"
        tokens.append({"type": kind, "value": val, "line": line_num, "col": m.start()})
    return tokens


# ─── Public API ───────────────────────────────────────────────────────────────

def tokenize_code(code: str, language: str) -> dict:
    language = language.lower()
    if language == "python":
        tokens = tokenize_python(code)
    elif language == "java":
        tokens = tokenize_java(code)
    elif language == "c":
        tokens = tokenize_c(code)
    else:
        return {"tokens": [], "error": f"Unsupported language: {language}"}

    # Build summary counts
    summary = {}
    for tok in tokens:
        summary[tok["type"]] = summary.get(tok["type"], 0) + 1

    return {"tokens": tokens, "summary": summary, "total": len(tokens)}
