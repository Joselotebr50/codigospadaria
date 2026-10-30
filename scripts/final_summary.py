#!/usr/bin/env python3
"""Generate final summary of all products."""
import json

with open("/home/z/my-project/download/padaria_base_unificada.json", "r") as f:
    data = json.load(f)

print("=" * 80)
print(f"🍞 PADARIA TATICO — VERSÃO FINAL DA LISTA DE PRODUTOS")
print(f"   Data: {data.get('data_atualizacao', 'N/A')}")
print(f"   Total: {len(data['produtos'])} produtos")
print("=" * 80)

cats = data.get("resumo_categorias", {})
print(f"\n📋 Resumo por categoria:")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    pct = count / len(data["produtos"]) * 100
    bar = "█" * int(pct / 2)
    print(f"   {cat:<25} {count:>3}  ({pct:5.1f}%)  {bar}")

# Print all products by category
print("\n" + "=" * 80)
print("LISTA COMPLETA POR CATEGORIA")
print("=" * 80)

from collections import defaultdict
by_cat = defaultdict(list)
for p in data["produtos"]:
    by_cat[p["categoria"]].append(p)

for cat in sorted(by_cat.keys()):
    prods = sorted(by_cat[cat], key=lambda x: x["descricao"])
    print(f"\n{'─' * 80}")
    print(f"📌 {cat} ({len(prods)} produtos)")
    print(f"{'─' * 80}")
    print(f"  {'#':>3}  {'Cód.Sistema':>12}  {'Descrição':<55} {'Und':<6} {'Cód.Balança':>12}")
    print(f"  {'─'*3}  {'─'*12}  {'─'*55} {'─'*6} {'─'*12}")
    for i, p in enumerate(prods, 1):
        print(f"  {i:>3}  {p['codigo_sistema']:>12}  {p['descricao']:<55} {p['unidade']:<6} {p['codigo_balanca']:>12}")

# Check for any remaining duplicates
from collections import Counter
desc_counts = Counter(p["descricao"].upper().strip() for p in data["produtos"])
dupes = {d: c for d, c in desc_counts.items() if c > 1}
print(f"\n{'=' * 80}")
print(f"✅ Duplicados: {len(dupes)}")
print(f"✅ Total de produtos: {len(data['produtos'])}")
print(f"{'=' * 80}")
