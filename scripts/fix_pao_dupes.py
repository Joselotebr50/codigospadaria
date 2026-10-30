#!/usr/bin/env python3
"""Fix remaining near-duplicate PÃO products:
1. PÃO DE QUEIJO TRADICIONAL TATICO (107073) → remove, keep 3100 (with accent)
2. PÃO BISNAGUITO TATICO (87166) → remove, keep 83096 (BISNAGUINHA)
"""
import json

with open("/home/z/my-project/download/padaria_base_unificada.json", "r") as f:
    data = json.load(f)

before = len(data["produtos"])

# Remove PÃO DE QUEIJO TRADICIONAL TATICO (107073) - duplicate of 3100
# Remove PÃO BISNAGUITO TATICO (87166) - duplicate of 83096
to_remove = {107073, 87166}

removed = []
kept = []
new_produtos = []
for p in data["produtos"]:
    if p["codigo_sistema"] in to_remove:
        removed.append(p)
    else:
        new_produtos.append(p)

data["produtos"] = new_produtos

# Update counts
from collections import Counter
cat_counts = Counter(p["categoria"] for p in data["produtos"])
data["total_produtos"] = len(data["produtos"])
data["resumo_categorias"] = dict(cat_counts)

with open("/home/z/my-project/download/padaria_base_unificada.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Produtos antes: {before}")
print(f"Produtos depois: {len(data['produtos'])}")
print(f"\nRemovidos:")
for p in removed:
    print(f"  ❌ {p['codigo_sistema']} | {p['descricao']} | {p['unidade']} | bal={p['codigo_balanca']}")

print(f"\nMantidos (equivalentes):")
print(f"  ✅ 3100 | PÃO DE QUEIJO TRADICIONAL TÁTICO | KG | bal=3100")
print(f"  ✅ 83096 | PÃO BISNAGUINHA TÁTICO | 300G | bal=83096")

# Verify no remaining duplicates
from collections import defaultdict
by_desc = defaultdict(list)
for p in data["produtos"]:
    by_desc[p["descricao"].strip().upper()].append(p)
remaining = {d: items for d, items in by_desc.items() if len(items) > 1}
print(f"\nDuplicados restantes: {len(remaining)}")

# Count PÃO
pao = [p for p in data["produtos"] if p["descricao"].upper().startswith("PÃO")]
pao_cat = [p for p in data["produtos"] if p["categoria"] == "Pães"]
print(f"\nProdutos PÃO: {len(pao)}")
print(f"Categoria Pães: {len(pao_cat)}")
print(f"Total geral: {len(data['produtos'])}")
