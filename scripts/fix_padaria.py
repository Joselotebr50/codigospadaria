#!/usr/bin/env python3
"""
Fix categories and deduplicate the padaria JSON.
"""
import json

with open("/home/z/my-project/download/padaria_base_unificada.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Fix categories
for p in data["produtos"]:
    d = p["descricao"].upper()
    if p["categoria"] == "Outros":
        if "PÃO" in d or "PAO" in d or "BAGUETE" in d:
            p["categoria"] = "Pães"
            print(f"  Reclassificado: {p['descricao']} -> Pães")
    # Also ensure consistency: Cookies under Biscoitos
    if d.startswith("COOKIES") and p["categoria"] != "Biscoitos":
        p["categoria"] = "Biscoitos"
        print(f"  Reclassificado: {p['descricao']} -> Biscoitos")

# Check for potential duplicates (same description, different codigo_sistema)
desc_map = {}
for p in data["produtos"]:
    desc = p["descricao"]
    if desc not in desc_map:
        desc_map[desc] = []
    desc_map[desc].append(p)

print("\n--- Possíveis duplicatas (mesma descrição, código diferente) ---")
for desc, prods in desc_map.items():
    if len(prods) > 1:
        print(f"\n  {desc}:")
        for p in prods:
            print(f"    cod_sistema={p['codigo_sistema']}, unidade={p['unidade']}, cod_balanca={p['codigo_balanca']}")

# Recalculate totals
cat_counts = {}
for p in data["produtos"]:
    cat = p["categoria"]
    cat_counts[cat] = cat_counts.get(cat, 0) + 1
data["total_produtos"] = len(data["produtos"])
data["resumo_categorias"] = cat_counts

print(f"\nTotal: {data['total_produtos']} produtos")
print(f"Categorias: {json.dumps(cat_counts, ensure_ascii=False, indent=2)}")

# Save
with open("/home/z/my-project/download/padaria_base_unificada.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nArquivo atualizado com sucesso!")
