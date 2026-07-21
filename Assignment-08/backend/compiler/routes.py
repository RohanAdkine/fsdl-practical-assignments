"""
Main compiler orchestration routes.
POST /api/compile  - Run all compiler phases
POST /api/explain  - AI explanation for a phase
"""
from flask import Blueprint, request, jsonify
from compiler.lexer import tokenize_code
from compiler.parser_module import parse_code
from compiler.semantic import analyze_code
from compiler.tac_generator import generate_tac
from compiler.optimizer import optimize
from compiler.register_allocator import allocate_registers
from compiler.codegen import generate_assembly
from compiler.cfg_builder import build_cfg
from compiler.ai_explainer import explain_phase

compiler_bp = Blueprint("compiler", __name__)


@compiler_bp.route("/compile", methods=["POST"])
def compile_code():
    """
    Orchestrates all compiler phases and returns full pipeline results.
    """
    data = request.get_json()
    code = data.get("code", "").strip()
    language = data.get("language", "python").lower()

    if not code:
        return jsonify({"error": "No code provided"}), 400

    results = {}
    all_errors = []

    # ── Phase 1: Lexical Analysis ──────────────────────────────────────────
    try:
        lex_result = tokenize_code(code, language)
        results["lexer"] = lex_result
        if "error" in lex_result:
            all_errors.append({"phase": "lexer", "message": lex_result["error"]})
    except Exception as e:
        results["lexer"] = {"tokens": [], "error": str(e)}
        all_errors.append({"phase": "lexer", "message": str(e)})

    # ── Phase 2: Syntax Analysis / Parsing ────────────────────────────────
    try:
        parse_result = parse_code(code, language)
        results["parser"] = parse_result
        if parse_result.get("errors"):
            all_errors.extend([{"phase": "parser", **e} for e in parse_result["errors"]])
    except Exception as e:
        results["parser"] = {"ast": None, "grammar_rules": [], "errors": [str(e)]}
        all_errors.append({"phase": "parser", "message": str(e)})

    # ── Phase 3: Semantic Analysis ────────────────────────────────────────
    try:
        semantic_result = analyze_code(code, language)
        results["semantic"] = semantic_result
        if semantic_result.get("errors"):
            all_errors.extend([{"phase": "semantic", **e} for e in semantic_result["errors"]])
    except Exception as e:
        results["semantic"] = {"symbol_table": [], "errors": [str(e)]}
        all_errors.append({"phase": "semantic", "message": str(e)})

    # ── Phase 4: TAC Generation ───────────────────────────────────────────
    try:
        tac_result = generate_tac(code, language)
        results["tac"] = tac_result
        tac_instructions = tac_result.get("instructions", [])
    except Exception as e:
        results["tac"] = {"instructions": [], "error": str(e)}
        tac_instructions = []
        all_errors.append({"phase": "tac", "message": str(e)})

    # ── Phase 5: Code Optimization ────────────────────────────────────────
    try:
        opt_result = optimize(tac_instructions)
        results["optimizer"] = opt_result
        optimized_instructions = opt_result.get("optimized", tac_instructions)
    except Exception as e:
        results["optimizer"] = {"original": tac_instructions, "optimized": tac_instructions}
        optimized_instructions = tac_instructions
        all_errors.append({"phase": "optimizer", "message": str(e)})

    # ── Phase 6: Register Allocation ──────────────────────────────────────
    try:
        reg_result = allocate_registers(optimized_instructions)
        results["registers"] = reg_result
        allocation = reg_result.get("allocation", {})
    except Exception as e:
        results["registers"] = {"allocation": {}, "interference_graph": {"nodes": [], "edges": []}}
        allocation = {}
        all_errors.append({"phase": "registers", "message": str(e)})

    # ── Phase 7: Assembly Code Generation ────────────────────────────────
    try:
        asm_result = generate_assembly(optimized_instructions, allocation)
        results["assembly"] = asm_result
    except Exception as e:
        results["assembly"] = {"all_instructions": [], "error": str(e)}
        all_errors.append({"phase": "assembly", "message": str(e)})

    # ── CFG (Additional) ──────────────────────────────────────────────────
    try:
        cfg_result = build_cfg(optimized_instructions)
        results["cfg"] = cfg_result
    except Exception as e:
        results["cfg"] = {"nodes": [], "edges": []}
        all_errors.append({"phase": "cfg", "message": str(e)})

    results["errors"] = all_errors
    results["language"] = language
    results["code"] = code

    return jsonify(results), 200


@compiler_bp.route("/explain", methods=["POST"])
def explain():
    """Return AI explanation for a compiler phase."""
    data = request.get_json()
    phase = data.get("phase", "")
    context = data.get("context", "")
    result = explain_phase(phase, context)
    return jsonify(result), 200
