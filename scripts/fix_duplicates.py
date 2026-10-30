#!/usr/bin/env python3
"""Fix duplicates and typos in the product list:
1. Rename BOLO TATICO LEITE CONDENSADO duplicates to include unit
2. Rename PETÃO TÁTICO DOCE duplicates to include unit
3. Fix typo: GUEIJO → QUEIJO
4. Also check for any other issues
"""

import json

with open('/home/z/my-project/download/padaria_base_unificada.json', 'r') as f:
    data = json.load(f)

produtos = data['produtos']
changes = []

for p in produtos:
    # Fix 1: BOLO TATICO LEITE CONDENSADO - add unit to distinguish
    if p['descricao'] == 'BOLO TATICO LEITE CONDENSADO':
        old_desc = p['descricao']
        new_desc = f"BOLO TATICO LEITE CONDENSADO ({p['unidade']})"
        p['descricao'] = new_desc
        changes.append(f"Renomeado: '{old_desc}' → '{new_desc}' (sistema={p['codigo_sistema']})")

    # Fix 2: PETÓN TÁTICO DOCE - add unit to distinguish
    if p['descricao'] == 'PETÃO TÁTICO DOCE':
        old_desc = p['descricao']
        new_desc = f"PETÓN TÁTICO DOCE ({p['unidade']})"
        p['descricao'] = new_desc
        changes.append(f"Renomeado: '{old_desc}' → '{new_desc}' (sistema={p['codigo_sistema']})")

    # Fix 3: Typo GUEIJO → QUEIJO
    if 'GUEIJO' in p['descricao']:
        old_desc = p['descricao']
        new_desc = p['descricao'].replace('GUEIJO', 'QUEIJO')
        p['descricao'] = new_desc
        changes.append(f"Corrigido typo: '{old_desc}' → '{new_desc}' (sistema={p['codigo_sistema']})")

# Verify no more duplicates
from collections import defaultdict
by_desc = defaultdict(list)
for p in produtos:
    by_desc[p['descricao'].strip().upper()].append(p)

remaining_dupes = {desc: items for desc, items in by_desc.items() if len(items) > 1}

# Update metadata
data['total_produtos'] = len(produtos)

# Save
with open('/home/z/my-project/download/padaria_base_unificada.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Alterações realizadas:")
for c in changes:
    print(f"  ✅ {c}")

print(f"\nTotal de produtos: {len(produtos)}")
print(f"Duplicados restantes: {len(remaining_dupes)}")

if remaining_dupes:
    print("\n⚠️ Ainda existem duplicados:")
    for desc, items in remaining_dupes.items():
        print(f"  - {desc}: {len(items)} aparências")
else:
    print("\n✅ Nenhum duplicado restante! Lista limpa.")

# Also verify no codigo_sistema duplicates
by_code = defaultdict(list)
for p in produtos:
    by_code[p['codigo_sistema']].append(p)
code_dupes = {code: items for code, items in by_code.items() if len(items) > 1}
if code_dupes:
    print(f"\n⚠️ Códigos de sistema duplicados: {len(code_dupes)}")
    for code, items in sorted(code_dupes.items()):
        print(f"  - codigo_sistema={code}: {[i['descricao'] for i in items]}")
else:
    print("✅ Todos os códigos de sistema são únicos.")
