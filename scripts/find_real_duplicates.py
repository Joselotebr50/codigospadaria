#!/usr/bin/env python3
"""Analyze the product list to find TRUE duplicates (same descricao, different codigo_sistema).
Products like PÃO DE LEITE, PÃO DE MILHO, PÃO MANTEIGA are DIFFERENT products and should NOT be flagged.
Only flag when the exact same description appears more than once."""

import json
from collections import defaultdict

with open('/home/z/my-project/download/padaria_base_unificada.json', 'r') as f:
    data = json.load(f)

produtos = data['produtos']

# Group by exact descricao
by_desc = defaultdict(list)
for p in produtos:
    key = p['descricao'].strip().upper()
    by_desc[key].append(p)

# Find true duplicates (same exact description, appearing more than once)
duplicates = {desc: items for desc, items in by_desc.items() if len(items) > 1}

print(f"Total de produtos: {len(produtos)}")
print(f"Descrições únicas: {len(by_desc)}")
print(f"Duplicados reais (mesma descrição exata): {len(duplicates)}")
print()

if duplicates:
    print("=" * 80)
    print("DUPLICADOS ENCONTRADOS (mesma descrição, códigos diferentes):")
    print("=" * 80)
    for i, (desc, items) in enumerate(sorted(duplicates.items()), 1):
        print(f"\n--- Duplicado #{i}: {desc} ---")
        print(f"  Aparições: {len(items)}")
        for j, item in enumerate(items, 1):
            print(f"    [{j}] codigo_sistema={item['codigo_sistema']}, codigo_balanca={item['codigo_balanca']}, unidade={item['unidade']}, categoria={item['categoria']}")

# Also check for near-duplicates (descricao that are very similar but not exact)
# e.g., one might have extra spaces or slight differences
print("\n\n" + "=" * 80)
print("VERIFICAÇÃO ADICIONAL: Descrições muito parecidas (possível variação de digitação)")
print("=" * 80)

descs = sorted(by_desc.keys())
near_dupes = []
for i in range(len(descs)):
    for j in range(i+1, len(descs)):
        a, b = descs[i], descs[j]
        # Check if one is a substring of the other (with meaningful overlap)
        # or if they differ by just a few characters
        if a != b:
            # Simple: check if after removing spaces and punctuation they are very similar
            a_clean = a.replace(' ', '').replace('-', '').replace('.', '')
            b_clean = b.replace(' ', '').replace('-', '').replace('.', '')
            if len(a_clean) > 5 and len(b_clean) > 5:
                # Check edit distance approximation: if they share >90% of characters
                common = sum(1 for ca, cb in zip(a_clean, b_clean) if ca == cb)
                max_len = max(len(a_clean), len(b_clean))
                if max_len > 0 and common / max_len > 0.90 and a_clean != b_clean:
                    near_dupes.append((a, b, common/max_len))

if near_dupes:
    near_dupes.sort(key=lambda x: -x[2])
    for a, b, sim in near_dupes:
        print(f"\n  Similaridade {sim:.0%}:")
        print(f"    A: {a}")
        print(f"    B: {b}")
else:
    print("  Nenhuma variação de digitação encontrada.")

# Also check for products with same codigo_sistema (should be unique)
by_code = defaultdict(list)
for p in produtos:
    by_code[p['codigo_sistema']].append(p)

code_dupes = {code: items for code, items in by_code.items() if len(items) > 1}
if code_dupes:
    print("\n\n" + "=" * 80)
    print("CÓDIGOS DE SISTEMA DUPLICADOS (mesmo codigo_sistema, descrições diferentes):")
    print("=" * 80)
    for code, items in sorted(code_dupes.items()):
        print(f"\n  codigo_sistema={code}:")
        for item in items:
            print(f"    - {item['descricao']} (balança={item['codigo_balanca']}, unidade={item['unidade']})")
