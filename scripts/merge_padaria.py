#!/usr/bin/env python3
"""
Merge all products extracted from padaria images into the existing JSON.
Products are matched by (codigo_sistema, unidade); new ones are added, duplicates are skipped.
"""

import json

# --- Load existing JSON ---
with open("/home/z/my-project/upload/padaria_base_unificada.json", "r", encoding="utf-8") as f:
    data = json.load(f)

existing_keys = set()  # (codigo_sistema, unidade) to handle same code diff units
for p in data["produtos"]:
    existing_keys.add((p["codigo_sistema"], p["unidade"]))

print(f"Produtos existentes no JSON: {len(data['produtos'])}")

# --- All products from image VLM analyses ---
raw_products = [
    # === Image d0acab0a ===
    (93859, "BOLO TATICO INGLÊS", "UND", 400),
    (84141, "BOLO TATICO MANÉ PELADO", "KG", 2790),
    (85777, "BOMBOCADO TATICO", "KG", 2561),
    (84234, "BRIGADEIRO TATICO", "KG", 2585),
    (84235, "BROA DOCE TATICO", "KG", 146937),
    (84327, "BROA TEMPERADA TATICO", "KG", 147019),
    (84462, "COCADINHA TATICO", "KG", 39147),
    (84467, "COOKIES TATICO BAUNILHA", "KG", 258234),
    (84466, "COOKIES TATICO CHOCOLATE", "KG", 258210),
    (84505, "CUPCAKE TATICO CHOCOLATE", "KG", 2813),
    (83822, "DOCINHO TATICO LEITE NINHO", "KG", 39130),
    (83845, "DONUTS TATICO CREME DE AVELÃ", "KG", 258173),
    (83841, "DONUTS TATICO LEITINHO", "KG", 221139),
    (83921, "ENROLADINHO DE QUEIJO TATICO", "KG", 2707),
    (89197, "ENROLADINHO DE SALSICHA TATICO", "KG", 2714),
    (84034, "FARINHA DE ROSCA TATICO", "KG", 2721),
    (84049, "FRANGO ASSADO TATICO", "KG", 15257),
    (84261, "MARIA MOLE TATICO", "KG", 2837),
    (84297, "MINI SALGADOS SORTIDOS TATICO", "KG", 15196),
    (84318, "MOUSSE TATICO CHOCOLATE", "KG", 2851),
    (84149, "MOUSSE TATICO LIMÃO", "KG", 260060),
    (84326, "MOUSSE TATICO MARACUJÁ", "KG", 2868),
    (84386, "MOUSSE TATICO MORANGO", "KG", 2875),
    (87280, "MP BASE PARA TORTELE N6 INSUMO", "KG", 253255),
    (94013, "PANETONE TATICO TRUFADO NINHO COM BRIGADEIRO", "750G", 812),
    (87166, "PÃO BISNAGUITO TATICO", "300G", 83225),
    (84276, "PÃO BRIOCHE FRUTAS", "350G", 258708),
    (84274, "PÃO BRIOCHE TATICO COM GERGELIM", "300G", 258524),
    (84255, "PÃO BRIOCHE TATICO FORMA", "300G", 258692),
    (84273, "PÃO BRIOCHE TATICO PRESTÍGIO", "KG", 49337),
    (84278, "PÃO BRIOCHE TATICO RAINHA", "350G", 260633),
    (94817, "PÃO DE FORMA INTEGRAL TATICO", "450G", 406),
    (84090, "PÃO FRANCÊS BAGUETE", "KG", 79402),
    (84096, "PÃO FRANCÊS INTEGRAL", "KG", 100502),
    (84106, "PÃO FRANCÊS", "KG", 3186),
    (84281, "PÃO MANDI", "KG", 233354),

    # === Image 4e1fb8a1 ===
    (84357, "PUDIM QUATRO LEITES TATICO", "KG", 260066),
    (84378, "GUEIJADINHA TATICO", "KG", 3254),
    (84003, "ROCAMBOLE TATICO CHOCOLATE", "KG", 6170),
    (84006, "ROCAMBOLE TATICO DOCE DE LEITE", "KG", 197645),
    (84408, "ROSCA CREME E AÇÚCAR TATICO", "KG", 36019),
    (84406, "ROSCA FRITA TATICO", "KG", 3421),
    (84411, "ROSCA SAMANTA TATICO", "KG", 3428),
    (84421, "ROSCA AÇÚCAR TATICO", "KG", 20864),
    (84031, "ROSCA BRIOCHE COM CREME TATICO", "KG", 258715),
    (84252, "ROSCA CREME COM COCO TATICO", "KG", 3375),
    (84262, "ROSCA HÚNGARA TATICO", "KG", 2384),
    (90844, "ROSCA DE CANELA TATICO", "KG", 2344),
    (84425, "ROSCA DE LEITE NINHO TATICO", "KG", 40458),
    (84417, "ROSCA LÍNGUA DE SOGRA TATICO", "KG", 199714),
    (84582, "ROSCA TRANÇA COCO TATICO", "KG", 260497),
    (84498, "SANDUÍCHE NATURAL PÃO FRANCÊS TATICO", "KG", 5180),
    (84503, "SANDUÍCHE NATURAL PÃO DE FORMA TATICO", "KG", 306779),
    (84361, "SONHO TATICO BAUNILHA", "KG", 14713),
    (84351, "SONHO TATICO DOCE DE LEITE", "KG", 1415),
    (84383, "SUSPIRO TATICO", "KG", 3423),
    (84418, "TORRADA TATICO", "KG", 3450),
    (84424, "TORRADA TATICO TEMPERADA", "KG", 97507),

    # === Image b6daeb20 ===
    (107073, "PÃO DE GUEIJO TRADICIONAL TATICO", "KG", 2652),
    (86480, "PÃO MANTEIGA TATICO", "KG", 69587400),
    (87181, "PÃO DE LEITE TATICO", "300G", 26076),
    (87778, "PÃO DE MILHO TATICO", "300G", 323438),
    (87167, "PÃO MINI MANDI TATICO", "300G", 322252),
    (87776, "PÃO MINUTO TATICO", "300G", 85171),
    (84416, "PÃO SEMI ITALIANO TATICO", "KG", 100525),
    (87771, "PÃO SOVADO TATICO", "300G", 73127),
    (87191, "PÃO VITAMINADO TATICO", "200G", 322683),
    (89288, "PIZZA TATICO BROTINHO CALABRESA", "KG", 326865),
    (89289, "PIZZA TATICO BROTINHO MARGUERITA", "KG", 263753),
    (89290, "PIZZA TATICO BROTINHO MUSSARELA", "KG", 265177),
    (92992, "PIZZA TATICO BROTINHO PRESUNTO", "KG", 263160),
    (84305, "PIZZA TATICO MÉDIA CALABRESA PEDAÇO FATIA", "KG", 24716),
    (84304, "PIZZA TATICO MÉDIA MUSSARELA", "KG", 51064),
    (91552, "PIZZA TATICO MÉDIA CALABRESA", "KG", 522),
    (91554, "PIZZA TATICO MÉDIA MARGUERITA", "KG", 524),
    (97853, "PIZZA TATICO MÉDIA PRESUNTO", "KG", 525),
    (84354, "PUDIM DE LEITE CONDENSADO TATICO", "KG", 8976),

    # === Image 3258e648 (additional codes from newer version) ===
    (106315, "BROA TEMPERADA TATICO", "KG", 2599),
    (106317, "PÃO FRANCÊS BAGUETE", "KG", 2601),
    (107070, "PÃO FRANCÊS INTEGRAL", "KG", 2649),
    (107071, "PÃO FRANCÊS", "KG", 2650),
    (107072, "PÃO MANDI", "KG", 2651),
    (107069, "PÃO MINI FRANCÊS", "KG", 2648),
    (106316, "PÃO DE QUEIJO MINI", "KG", 2600),
    (84285, "BROA DOCE TATICO", "KG", 147019),

    # === Image 9ff20110 (pizzas, roscas, etc.) ===
    (89293, "PIZZA TATICO BROTINHO MUSSARELA", "KG", 263177),
    (89292, "PIZZA TATICO BROTINHO PRESUNTO", "KG", 263160),
    (91553, "PIZZA TATICO MÉDIA PRESUNTO", "KG", 523),

    # === WhatsApp Image (products amanhecidos, pães especiais) ===
    (89202, "PRODUTO AMANHECIDO TATICO GO PÃO DE QUEIJO", "KG", 10986),
    (98726, "PANETONE TATICO FRUTAS GO 380GR", "UND", 1208),
    (95730, "PANETONE TATICO GOTAS CHOC GO 380GR", "UND", 1211),
    (88361, "PRODUTO AMANHECIDO TATICO GO BISCOITO CHIPA", "KG", 246293),
    (89222, "PRODUTO AMANHECIDO TATICO GO BISCOITO SUÍÇO", "KG", 249164),
    (83938, "BISCOITO INSEPARAVEL 2KG FLORZINHA", "KG", 56519),
    (83832, "BISCOITO INSEPARAVEL PÃO DE MEL 2KG", "KG", 56557),
    (83, "BISCOITO PALITO 2KG CHOCOLATE", "KG", 56540),
    (74, "BISCOITO PRONTO 2KG MARGARIDA", "KG", 56595),
    (83935, "BISCOITO INSEPARAVEL 2KG CASADINHO", "KG", 35729),
    (83947, "PRODUTO AMANHECIDO TATICO GO BISCOITO QUEIJO", "KG", 40495),
    (83950, "PRODUTO AMANHECIDO TATICO GO BISCOITO QUEIJO SUÍÇO", "KG", 246538),
    (90898, "PÃO AUSTRALIANO", "KG", 320),
    (90916, "CROISSANT", "KG", 351),
    (102196, "MINI PÃO BAGUETE ERVAS FINAS", "KG", 1985),
    (102194, "MINI PÃO BAGUETE PARMESÃO", "KG", 1984),
    (102197, "PÃO BAGUETE ERVAS FINAS", "KG", 1967),
    (102198, "PÃO BAGUETE GERGELIM", "KG", 1988),
    (102195, "PÃO BAGUETE PARMESÃO", "KG", 1985),
    (102193, "PÃO DE ABÓBORA", "KG", 1983),
    (102191, "PÃO HAMBÚRGUER AUSTRALIANO", "KG", 1982),
    (90918, "SALGADO FOLHADO FRANGO BACON", "KG", 333),
    (102200, "PÃO BAGUETE DE TORRESMO", "KG", 1989),
    (102202, "PÃO FRANCÊS BOLA", "KG", 1990),
    (102192, "PÃO ITALIANO BOLEADO", "KG", 1981),
    (102204, "PÃO BAGUETE CALABRESA", "KG", 1991),
    (89207, "PRODUTO AMANHECIDO TATICO GO BROA DOCE", "KG", 245722),
    (90899, "PRODUTO AMANHECIDO TATICO GO BROA TEMPERADA", "KG", 245791),
]


def classify_product(descricao):
    """Classify a product into a category based on its description."""
    d = descricao.upper()
    if d.startswith("TORTA"):
        return "Tortas"
    if d.startswith("PIZZA"):
        return "Pizzas"
    if d.startswith("BOLO"):
        return "Bolos"
    if d.startswith(("BISCOITO", "COOKIES", "CHIPA")):
        return "Biscoitos"
    if d.startswith(("PÃO", "PAO", "PETA", "PETÃO", "CROISSANT")):
        return "Pães"
    if d.startswith(("ROSCA", "ROCAMBOLE", "SONHO", "SUSPIRO", "TORRADA", "SANDUÍCHE", "SANDUICHE")):
        return "Confeitaria"
    if d.startswith((
        "BEIJINHO", "BEM CASADO", "BRIGADEIRO", "BOMBOCADO",
        "COCADINHA", "DOCINHO", "DONUTS", "ENROLADINHO",
        "FARINHA DE ROSCA", "FRANGO ASSADO", "MARIA MOLE",
        "MINI SALGADOS", "MOUSSE", "PANETONE", "PAVÊ", "PAVE",
        "PUDIM", "GUEIJADINHA", "CUPCAKE", "BROA", "MP BASE",
        "SALGADO FOLHADO"
    )):
        return "Confeitaria"
    if "AMANHECIDO" in d:
        return "Produtos Amanhecidos"
    return "Outros"


# --- Process and deduplicate ---
new_products_map = {}

for cod_sys, desc, unidade, cod_bal in raw_products:
    key = (cod_sys, unidade)
    if key in existing_keys:
        continue
    if key in new_products_map:
        if len(desc) <= len(new_products_map[key]["descricao"]):
            continue
    new_products_map[key] = {
        "codigo_sistema": cod_sys,
        "descricao": desc,
        "unidade": unidade,
        "codigo_balanca": cod_bal,
        "categoria": classify_product(desc)
    }

# Add all new products
for key, prod in sorted(new_products_map.items(), key=lambda x: x[1]["descricao"]):
    data["produtos"].append(prod)

added_count = len(new_products_map)
print(f"Novos produtos adicionados: {added_count}")

# Sort products by category then description
data["produtos"].sort(key=lambda p: (p["categoria"], p["descricao"]))

# Update summary
total = len(data["produtos"])
data["total_produtos"] = total

cat_counts = {}
for p in data["produtos"]:
    cat = p["categoria"]
    cat_counts[cat] = cat_counts.get(cat, 0) + 1
data["resumo_categorias"] = cat_counts

print(f"Total de produtos no JSON atualizado: {total}")
print(f"Categorias: {json.dumps(cat_counts, ensure_ascii=False, indent=2)}")

# Save
output_path = "/home/z/my-project/download/padaria_base_unificada.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nArquivo salvo em: {output_path}")

# Print new products for verification
print(f"\n--- Novos produtos adicionados ---")
for key, prod in sorted(new_products_map.items(), key=lambda x: x[1]["descricao"]):
    print(f"  {prod['codigo_sistema']} | {prod['descricao']} | {prod['unidade']} | {prod['codigo_balanca']} | {prod['categoria']}")
