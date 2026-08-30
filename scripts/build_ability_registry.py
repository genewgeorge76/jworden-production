"""
build_ability_registry.py

Scans app/jarvis_os/abilities, reads every Python module, extracts
the first class name and docstring, then writes jarvis_os_registry.json.

Run from the repo root:
    python scripts/build_ability_registry.py
"""
import ast
import json
import os
import pathlib

ABILITIES_DIR = pathlib.Path(__file__).parent.parent / "app" / "jarvis_os" / "abilities"
OUTPUT_FILE   = pathlib.Path(__file__).parent.parent / "app" / "jarvis_os" / "jarvis_os_registry.json"


def extract_class_info(py_file: pathlib.Path) -> dict | None:
    try:
        source = py_file.read_text(encoding="utf-8", errors="ignore")
        tree   = ast.parse(source)
    except SyntaxError:
        return None

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            doc  = ast.get_docstring(node) or ""
            # Look for an execute() or calculate*() method to determine params
            params = []
            for item in node.body:
                # AsyncFunctionDef included: an ability whose entry point is
                # `async def execute` is invoked exactly like a sync one by
                # os_ability_service, but was previously read as having no
                # parameters at all, so the catalogue advertised none.
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name in ("execute", "calculate_decay", "run", "analyze", "process"):
                    for arg in item.args.args:
                        if arg.arg not in ("self",):
                            params.append(arg.arg)
                    break

            return {
                "class_name": node.name,
                "description": doc.strip().replace("\n", " ")[:300],
                "params": params,
            }
    return None


def build_registry():
    registry = []

    for category_dir in sorted(ABILITIES_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name.startswith("__"):
            continue
        category = category_dir.name

        for py_file in sorted(category_dir.glob("*.py")):
            if py_file.name.startswith("__"):
                continue

            module_id = f"{category}.{py_file.stem}"
            info = extract_class_info(py_file)
            if info is None:
                continue

            # Generate keyword tags from module name + description
            name_words = py_file.stem.replace("_", " ").lower().split()
            desc_words = [w.lower().strip(".,;:()") for w in info["description"].split()[:25] if len(w) > 4]
            tags = list(set(name_words + desc_words))

            registry.append({
                "module_id":   module_id,
                "category":    category,
                "file":        str(py_file.relative_to(ABILITIES_DIR.parent.parent)),
                "class_name":  info["class_name"],
                "description": info["description"],
                "params":      info["params"],
                "tags":        tags,
            })

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    print(f"[OK] Registry built: {len(registry)} abilities -> {OUTPUT_FILE}")
    return registry


if __name__ == "__main__":
    build_registry()
