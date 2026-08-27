#!/usr/bin/env python3
"""
Valide tout le contenu narratif (database/content/universe/<univers>/...)
contre les schemas définis dans registry.json.

Étapes :
  1. Charge registry.json
  2. Liste les univers présents dans database/content/universe/
  3. Pour chaque type (npc, event, quest...), résout le path_template avec l'univers courant
  4. Valide chaque fichier trouvé contre son schema

Usage :
    python validate_content.py
    (code de sortie 0 si tout est valide, 1 si au moins une erreur)

Dépendances :
    pip install jsonschema referencing --break-system-packages
"""

import json
import glob
import sys
from pathlib import Path

from referencing import Registry, Resource
from jsonschema import Draft202012Validator

# --- Configuration : adapte ces deux chemins si ton arborescence change ---
SCHEMAS_DIR = Path("database/content/schemas")
CONTENT_ROOT = Path("database/content/universe")
REGISTRY_FILE = SCHEMAS_DIR / "registry.json"


def load_registry_config():
    with open(REGISTRY_FILE, encoding="utf-8") as f:
        return json.load(f)


def load_schemas():
    """Charge tous les *.schema.json et prépare la résolution des $ref entre eux."""
    schemas = {}
    resources = []
    for schema_file in SCHEMAS_DIR.glob("*.schema.json"):
        doc = json.load(open(schema_file, encoding="utf-8"))
        schema_id = doc.get("$id", schema_file.name)
        schemas[schema_id] = doc
        resources.append((schema_id, Resource.from_contents(doc)))
    registry = Registry().with_resources(resources)
    return schemas, registry


def list_universes():
    if not CONTENT_ROOT.exists():
        return []
    return sorted(d.name for d in CONTENT_ROOT.iterdir() if d.is_dir())


def resolve_pattern(template, universe, character=None):
    pattern = template.replace("{universe}", universe)
    if character is not None:
        pattern = pattern.replace("{character}", character)
    return pattern


def validate_file(filepath, schema_id, schemas, schema_registry, errors_out):
    schema = schemas.get(schema_id)
    if schema is None:
        errors_out.append((filepath, f"schema introuvable dans {SCHEMAS_DIR} : {schema_id}"))
        return

    try:
        data = json.load(open(filepath, encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors_out.append((filepath, f"JSON invalide : {e}"))
        return

    validator = Draft202012Validator(schema, registry=schema_registry)
    file_errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))
    for e in file_errors:
        path = "/".join(str(p) for p in e.path) or "(racine)"
        errors_out.append((filepath, f"{path} : {e.message}"))


def main():
    registry_config = load_registry_config()
    schemas, schema_registry = load_schemas()
    universes = list_universes()

    if not universes:
        print(f"Aucun univers trouvé dans {CONTENT_ROOT}")
        sys.exit(1)

    all_errors = []
    total_files = 0

    for universe in universes:
        print(f"\n=== Univers : {universe} ===")
        for type_name, cfg in registry_config["types"].items():
            template = cfg["path_template"]
            schema_id = cfg["schema"]

            if "{character}" in template:
                # cas particulier : objective_ffa a un sous-dossier par personnage
                char_cfg = registry_config["types"]["character"]
                char_pattern = resolve_pattern(char_cfg["path_template"], universe)
                characters = [Path(f).stem for f in glob.glob(char_pattern)]
                for character in characters:
                    pattern = resolve_pattern(template, universe, character)
                    files = glob.glob(pattern)
                    total_files += len(files)
                    for f in files:
                        validate_file(f, schema_id, schemas, schema_registry, all_errors)
            else:
                pattern = resolve_pattern(template, universe)
                files = glob.glob(pattern)
                total_files += len(files)
                print(f"  {type_name:20s} {len(files)} fichier(s)")
                for f in files:
                    validate_file(f, schema_id, schemas, schema_registry, all_errors)

    print(f"\n{total_files} fichier(s) vérifié(s).")

    if all_errors:
        print(f"\n❌ {len(all_errors)} erreur(s) trouvée(s) :\n")
        for filepath, message in all_errors:
            print(f"  {filepath}\n    -> {message}")
        sys.exit(1)

    print("\n✅ Tout le contenu est valide.")
    sys.exit(0)


if __name__ == "__main__":
    main()