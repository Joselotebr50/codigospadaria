#!/usr/bin/env python3
"""
Analyze and fix duplicate products in the padaria JSON.
- True duplicates: same descricao + same unidade, different codigo_sistema
- Near duplicates: same product with TATICO vs TÁTICO spelling variations
"""

import json

with open("/home/z/my-project/download/padaria_base_unificada.json", "r", encoding="utf-8") as f:
    data = json.load(f)

products = data["produtos"]
print(f"Total antes: {len(products)}")

# === 1. Find exact duplicates (same descricao + same unidade) ===
from collections import defaultdict
desc_unit_map = defaultdict(list)
for p in products:
    key = (p["descricao"], p["unidade"])
    desc_unit_map[key].append(p)

print("\n" + "="*80)
print("DUPLICATAS EXATAS (mesma descrição + mesma unidade)")
print("="*80)

exact_dupes_to_remove = set()  # indices to remove
for key, prods in desc_unit_map.items():
    if len(prods) > 1:
        desc, unidade = key
        print(f"\n❌ {desc} ({unidade}) — {len(prods)} entradas:")
        for p in prods:
            print(f"   cod_sistema={p['codigo_sistema']}, cod_balanca={p['codigo_balanca']}")
        
        # Keep the one with the HIGHEST codigo_sistema (newer codes from updated lists)
        # and also prefer the one with the smaller codigo_balanca (more standard)
        # Strategy: keep highest codigo_sistema as it's from the most recent image
        prods_sorted = sorted(prods, key=lambda x: x["codigo_sistema"], reverse=True)
        keeper = prods_sorted[0]
        print(f"   ✅ Mantendo: cod_sistema={keeper['codigo_sistema']}, cod_balanca={keeper['codigo_balanca']}")
        
        for p in prods[1:]:
            exact_dupes_to_remove.add(id(p))

# === 2. Find near-duplicates (TATICO vs TÁTICO, spelling variations) ===
print("\n" + "="*80)
print("QUASE-DUPLICATAS (mesmo produto, grafia diferente TATICO/TÁTICO)")
print("="*80)

# Normalize: remove accents from TÁTICO -> TATICO for comparison
def normalize(s):
    return s.replace("Á", "A").replace("Ã", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U").replace("Ê", "E")

near_dupes_to_remove = set()
seen_normalized = {}  # normalized_key -> product to keep

for p in products:
    if id(p) in exact_dupes_to_remove:
        continue  # skip already marked for removal
    norm_desc = normalize(p["descricao"])
    key = (norm_desc, p["unidade"])
    
    if key in seen_normalized:
        existing = seen_normalized[key]
        # They are near-duplicates
        if id(existing) not in near_dupes_to_remove and id(p) not in near_dupes_to_remove:
            print(f"\n❌ Quase-duplicata:")
            print(f"   A: {existing['descricao']} | cod={existing['codigo_sistema']} | unid={existing['unidade']} | bal={existing['codigo_balanca']}")
            print(f"   B: {p['descricao']} | cod={p['codigo_sistema']} | unid={p['unidade']} | bal={p['codigo_balanca']}")
            
            # Keep the one with accent (TÁTICO) as it appears in more recent/official lists
            # Actually, prefer the one with higher codigo_sistema
            if p["codigo_sistema"] > existing["codigo_sistema"]:
                near_dupes_to_remove.add(id(existing))
                seen_normalized[key] = p
                print(f"   ✅ Mantendo B (cod mais alto)")
            else:
                near_dupes_to_remove.add(id(p))
                print(f"   ✅ Mantendo A (cod mais alto)")
    else:
        seen_normalized[key] = p

# === 3. Also check for products that differ only by unidade (like 300G vs KG) ===
# These are NOT duplicates - they're different SKUs. Skip.

# === 4. Apply removals ===
all_to_remove = exact_dupes_to_remove | near_dupes_to_remove
cleaned = [p for p in products if id(p) not in all_to_remove]

print(f"\n{'='*80}")
print(f"RESUMO")
print(f"{'='*80}")
print(f"Produtos originais: {len(products)}")
print(f"Duplicatas exatas removidas: {len(exact_dupes_to_remove)}")
print(f"Quase-duplicatas removidas: {len(near_dupes_to_remove)}")
print(f"Produtos após limpeza: {len(cleaned)}")

# === 5. Update and save ===
data["produtos"] = cleaned
data["produtos"].sort(key=lambda p: (p["categoria"], p["descricao"]))

# Recalculate totals
cat_counts = {}
for p in data["produtos"]:
    cat_counts[p["categoria"]] = cat_counts.get(p["categoria"], 0) + 1
data["total_produtos"] = len(data["produtos"])
data["resumo_categorias"] = cat_counts

print(f"\nCategorias atualizadas:")
for cat, count in sorted(cat_counts.items()):
    print(f"  {cat}: {count}")

with open("/home/z/my-project/download/padaria_base_unificada.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✅ JSON salvo!")
