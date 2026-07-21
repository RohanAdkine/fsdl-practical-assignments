"""
AI Explainer module.
Provides explanations for each compiler phase using OpenAI API (if available)
or falls back to built-in educational explanations.
"""
import os


BUILTIN_EXPLANATIONS = {
    "lexical": """
**Lexical Analysis** (also called *scanning* or *tokenization*) is the first phase of compilation.

The lexer reads the raw source code character by character and groups them into meaningful **tokens** — the smallest units of the language.

**What happens here:**
- Whitespace and comments are discarded
- Characters are grouped into tokens: keywords, identifiers, operators, literals, delimiters
- Each token gets a **type** (e.g., `KEYWORD`, `IDENTIFIER`, `NUMBER`) and a **value**
- Line and column numbers are recorded for error reporting

**Example:**
```
int a = 5;
→ KEYWORD(int) IDENTIFIER(a) OPERATOR(=) NUMBER(5) DELIMITER(;)
```

**Data structure produced:** Token stream (list of tokens)
""",

    "syntax": """
**Syntax Analysis** (also called *parsing*) is the second phase of compilation.

The parser takes the token stream from the lexer and checks whether it conforms to the **grammar** of the programming language. It builds an **Abstract Syntax Tree (AST)**.

**What happens here:**
- Tokens are consumed according to grammar production rules
- A hierarchical tree structure (AST) is built representing the program's structure
- Syntax errors are detected and reported

**Grammar rules used:**
- Production rules define valid combinations (e.g., `expr → expr + term | term`)
- Precedence and associativity resolve ambiguities

**Data structure produced:** Abstract Syntax Tree (AST)
""",

    "semantic": """
**Semantic Analysis** is the third phase of compilation.

While syntax analysis checks *structure*, semantic analysis checks *meaning*. It verifies that the program makes logical sense according to the language's semantic rules.

**What happens here:**
- **Type checking**: Are operand types compatible? (e.g., can't add an integer to a string without conversion)
- **Declaration checking**: Are all variables declared before use?
- **Scope analysis**: Are names resolved in the correct scope?
- **Symbol table construction**: A table mapping names → types, scopes, memory locations

**Data structure produced:** Annotated AST + Symbol Table
""",

    "tac": """
**Intermediate Code Generation** produces a machine-independent representation of the program.

The most common form is **Three-Address Code (TAC)**, where each instruction has at most one operator and three operands (two sources, one destination).

**Why intermediate code?**
- Platform independence: the same IR can target multiple architectures
- Easier to optimize than source code
- Simpler to generate machine code from

**TAC instruction forms:**
- Assignment: `x = y`
- Binary op: `t1 = a + b`
- Conditional jump: `if_false t1 goto L0`
- Function call: `t2 = call foo(2)`

**Data structure produced:** List of TAC instructions
""",

    "optimization": """
**Code Optimization** improves the intermediate code to make the final program faster or smaller, without changing its semantics.

**Optimizations applied:**

1. **Constant Folding**: Evaluates constant expressions at compile time.
   - Before: `t1 = 2 * 3` → After: `t1 = 6`

2. **Common Subexpression Elimination (CSE)**: Avoids recomputing expressions that were already computed.
   - Before: `t1 = a + b; t2 = a + b` → After: reuse `t1`

3. **Dead Code Elimination**: Removes code whose results are never used.
   - Before: `t5 = x + y` (t5 never read) → Removed

4. **Loop Optimization**: Moves loop-invariant code out of loops (strength reduction).

**Result:** Optimized TAC with fewer instructions
""",

    "registers": """
**Register Allocation** is one of the most critical and complex phases of compilation.

Registers are the fastest storage in a CPU, but there are very few of them (typically 8–32). The compiler must decide which variables to keep in registers and which to "spill" to memory.

**Algorithm used — Graph Coloring:**

1. **Liveness Analysis**: Determine which variables are "live" (needed in future) at each program point using backward dataflow analysis.

2. **Interference Graph**: Draw a graph where:
   - Nodes = variables
   - Edge between two variables = they are both live at the same time (they *interfere*)

3. **Graph Coloring**: Color the interference graph with *k* colors (registers). Variables with the same color can share a register.

4. **Spilling**: If k colors aren't enough, some variables must be spilled to memory.

**Data structure produced:** Register allocation map + Interference Graph
""",

    "assembly": """
**Final Code Generation** translates the optimized TAC (with register assignments) into actual **assembly language** instructions.

**What happens here:**
- TAC operations map to assembly opcodes: `ADD`, `SUB`, `MOV`, `JMP`, etc.
- Variables are replaced with their assigned registers
- Memory loads/stores are inserted for spilled variables
- Labels become branch targets

**Common assembly instructions:**
| Assembly | Meaning |
|----------|---------|
| `MOV R1, #5` | Load constant 5 into register R1 |
| `ADD R2, R1, R3` | R2 = R1 + R3 |
| `CMP R1, R2, R3` | Compare R2 and R3, set flags in R1 |
| `JMP L0` | Unconditional jump to label L0 |
| `JZ R1, L1` | Jump to L1 if R1 is zero |
| `CALL func` | Call a function |
| `RET` | Return from function |

**Output:** Assembly language program ready for assembling into machine code
""",

    "cfg": """
**Control Flow Graph (CFG)** is a directed graph that represents all possible paths through a program.

**Structure:**
- **Nodes** = Basic Blocks (maximal sequences of instructions with no branches in or out)
- **Edges** = possible control flow between blocks

**Basic Block rules:**
- First instruction of a function is a leader
- Target of any jump is a leader
- Instruction after any jump is a leader
- A basic block ends at the next leader

**Uses of CFG:**
- Data flow analysis (reaching definitions, liveness)
- Loop detection
- Dead code identification
- Code generation ordering

**Data structure:** Directed graph of basic blocks
""",
}


def explain_phase(phase: str, context: str = "") -> dict:
    """
    Get an explanation for a compiler phase.
    Tries OpenAI first; falls back to built-in explanations.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    phase_key = phase.lower().replace(" ", "_").replace("-", "_")

    if api_key and api_key.startswith("sk-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            system_prompt = (
                "You are an expert compiler design professor explaining compilation phases "
                "to computer science students. Use markdown formatting, be educational, "
                "include examples, and keep response under 300 words."
            )
            user_msg = f"Explain the '{phase}' phase of compilation."
            if context:
                user_msg += f"\n\nContext from this compilation: {context[:500]}"

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=400,
                temperature=0.7,
            )
            explanation = response.choices[0].message.content
            return {"explanation": explanation, "source": "openai"}
        except Exception as e:
            pass  # Fall through to built-in

    # Built-in fallback
    builtin = BUILTIN_EXPLANATIONS.get(phase_key, BUILTIN_EXPLANATIONS.get(phase, ""))
    if not builtin:
        # Try partial match
        for key, val in BUILTIN_EXPLANATIONS.items():
            if key in phase_key or phase_key in key:
                builtin = val
                break

    return {
        "explanation": builtin or f"No explanation available for phase: {phase}",
        "source": "builtin",
    }
