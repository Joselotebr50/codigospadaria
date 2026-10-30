#!/usr/bin/env python3
"""Count PÃO products at each stage: initial base, after merge, and final."""

import json

# --- 1. Initial base (upload folder - original 87 products) ---
with open("/home/z/my-project/upload/padaria_base_unificada.json", "r") as f:
    initial = json.load(f)

initial_pao = [p for p in initial["produtos"] if p["descricao"].upper().startswith("PÃO") or 
               p["descricao"].upper().startswith("PAO")]
initial_pao_cat = [p for p in initial["produtos"] if p["categoria"] == "Pães"]

print("=" * 70)
print("📋 BASE INICIAL (upload/padaria_base_unificada.json)")
print("=" * 70)
print(f"Total de produtos: {len(initial['produtos'])}")
print(f"Produtos com 'PÃO' na descrição: {len(initial_pao)}")
print(f"Produtos na categoria 'Pães': {len(initial_pao_cat)}")
print()
print("Produtos PÃO na base inicial:")
for p in sorted(initial_pao, key=lambda x: x["descricao"]):
    print(f"  {p['codigo_sistema']:>10} | {p['descricao']:<50} | {p['unidade']:<6} | bal={p['codigo_balanca']}")

# --- 2. Current final (download folder - after all merges and fixes) ---
with open("/home/z/my-project/download/padaria_base_unificada.json", "r") as f:
    final = json.load(f)

final_pao = [p for p in final["produtos"] if p["descricao"].upper().startswith("PÃO") or 
             p["descricao"].upper().startswith("PAO")]
final_pao_cat = [p for p in final["produtos"] if p["categoria"] == "Pães"]

print("\n" + "=" * 70)
print("📋 BASE FINAL (download/padaria_base_unificada.json)")
print("=" * 70)
print(f"Total de produtos: {len(final['produtos'])}")
print(f"Produtos com 'PÃO' na descrição: {len(final_pao)}")
print(f"Produtos na categoria 'Pães': {len(final_pao_cat)}")
print()
print("Produtos PÃO na base final:")
for p in sorted(final_pao, key=lambda x: x["descricao"]):
    print(f"  {p['codigo_sistema']:>10} | {p['descricao']:<55} | {p['unidade']:<6} | bal={p['codigo_balanca']}")

# --- 3. Diff: which PÃO products were added? ---
initial_descs = {p["descricao"].upper() for p in initial_pao}
added = [p for p in final_pao if p["descricao"].upper() not in initial_descs]
removed = [p for p in initial_pao if p["descricao"].upper() not in {fp["descricao"].upper() for fp in final_pao}]

print("\n" + "=" * 70)
print("📊 DIFERENÇA")
print("=" * 70)
print(f"PÃO adicionados (das imagens novas): {len(added)}")
for p in sorted(added, key=lambda x: x["descricao"]):
    print(f"  + {p['codigo_sistema']:>10} | {p['descricao']:<55} | {p['unidade']}")

if removed:
    print(f"\nPÃO removidos: {len(removed)}")
    for p in sorted(removed, key=lambda x: x["descricao"]):
        print(f"  - {p['codigo_sistema']:>10} | {p['descricao']}")
else:
    print("\nNenhum PÃO removido.")

# Also show other Pães category items that don't start with PÃO (PETA, PETÃO, CROISSANT, etc)
other_paes = [p for p in final_pao_cat if not (p["descricao"].upper().startswith("PÃO") or p["descricao"].upper().startswith("PAO"))]
if other_paes:
    print(f"\nOutros produtos na categoria 'Pães' (não-PÃO): {len(other_paes)}")
    for p in sorted(other_paes, key=lambda x: x["descricao"]):
        print(f"  {p['codigo_sistema']:>10} | {p['descricao']:<55} | {p['unidade']}")
