#!/usr/bin/env python3
"""Check near-duplicate PÃO products (same product, different spelling/accents)."""
import json
from difflib import SequenceMatcher

with open("/home/z/my-project/download/padaria_base_unificada.json", "r") as f:
    data = json.load(f)

pao_products = [p for p in data["produtos"] if p["descricao"].upper().startswith("PÃO")]

# Find near-duplicates (same product, slight spelling variation)
print("🔍 Procurando PÃO com nomes muito parecidos (possível duplicata por acentuação/digitação):\n")

checked = set()
for i, p1 in enumerate(pao_products):
    for j, p2 in enumerate(pao_products):
        if j <= i:
            continue
        # Normalize: remove accents, extra spaces
        d1 = p1["descricao"].upper().replace("Á","A").replace("É","E").replace("Í","I").replace("Ó","O").replace("Ú","U").replace("Â","A").replace("Ê","E").replace("Ô","O").replace("Ã","A")
        d2 = p2["descricao"].upper().replace("Á","A").replace("É","E").replace("Í","I").replace("Ó","O").replace("Ú","U").replace("Â","A").replace("Ê","E").replace("Ô","O").replace("Ã","A")
        
        if d1 == d2 and p1["descricao"] != p2["descricao"]:
            print(f"⚠️  Mesmo produto, grafia diferente:")
            print(f"   A: {p1['codigo_sistema']:>10} | {p1['descricao']:<55} | {p1['unidade']}")
            print(f"   B: {p2['codigo_sistema']:>10} | {p2['descricao']:<55} | {p2['unidade']}")
            print()
        elif d1 != d2:
            ratio = SequenceMatcher(None, d1, d2).ratio()
            if ratio > 0.85 and (p1["unidade"] == p2["unidade"]):
                print(f"💡 Produtos muito parecidos (sim={ratio:.0%}, mesma unidade {p1['unidade']}):")
                print(f"   A: {p1['codigo_sistema']:>10} | {p1['descricao']:<55} | {p1['unidade']}")
                print(f"   B: {p2['codigo_sistema']:>10} | {p2['descricao']:<55} | {p2['unidade']}")
                print()
