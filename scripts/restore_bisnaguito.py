#!/usr/bin/env python3
"""Restore PÃO BISNAGUITO TATICO (87166) - it's a different product from BISNAGUINHA!"""
import json
from collections import Counter

with open("/home/z/my-project/download/padaria_base_unificada.json", "r") as f:
    data = json.load(f)

before = len(data["produtos"])

# Add back PÃO BISNAGUITO TATICO
data["produtos"].append({
    "codigo_sistema": 87166,
    "descricao": "PÃO BISNAGUITO TATICO",
    "unidade": "300G",
    "codigo_balanca": 83225,
    "categoria": "Pães"
})

# Sort by category then description
data["produtos"].sort(key=lambda p: (p["categoria"], p["descricao"]))

# Update counts
cat_counts = Counter(p["categoria"] for p in data["produtos"])
data["total_produtos"] = len(data["produtos"])
data["resumo_categorias"] = dict(cat_counts)

with open("/home/z/my-project/download/padaria_base_unificada.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Antes: {before} produtos")
print(f"Depois: {len(data['produtos'])} produtos")
print(f"\n✅ Restaurado: 87166 | PÃO BISNAGUITO TATICO | 300G | bal=83225")
print(f"\nCategoria Pães: {cat_counts['Pães']}")
print(f"Total: {len(data['produtos'])}")
