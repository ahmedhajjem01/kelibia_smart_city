import re
from pathlib import Path

def update_file(path_str):
    text = Path(path_str).read_text(encoding='utf-8')

    # 1. Page margin fix
    if "@page" not in text:
        text = text.replace("@media print {", "@media print {\n            @page { size: A4; margin: 0; }\n            body { padding: 0; margin: 0; }\n            .page { transform: scale(0.98); transform-origin: top left; }")

    # 2. Sizing reductions
    text = text.replace("min-height: 297mm;", "height: 295mm; overflow: hidden;")
    text = text.replace("padding: 25px;", "padding: 15px;")
    text = text.replace("margin-top: 15px;", "margin-top: 10px;")
    text = text.replace("padding: 8px 15px;", "padding: 6px 15px;")
    
    # 3. Compress the top left Info Box
    # AR
    text = text.replace(
"""                <div style="flex-direction: column; align-items: flex-start;">
                    <span class="label-text" style="color: #6ab0de;">{{ extrait.arrondissement_gauche }} / ..................</span>
                    <span class="value" style="width: 100%; text-align: center; display: block; padding-top: 5px;">{{ extrait.titulaire.n_etat_civil|default:"-" }}</span>
                </div>""", 
"""                <div style="justify-content: space-between;">
                    <span class="label-text" style="color: #6ab0de; white-space: nowrap; width: auto;">{{ extrait.arrondissement_gauche }} / .....</span>
                    <span class="value" style="text-align: left; padding: 0;">{{ extrait.titulaire.n_etat_civil|default:"-" }}</span>
                </div>""")

    # FR
    text = text.replace(
"""                <div style="flex-direction: column; align-items: flex-start;">
                    <span class="label-text" style="color: #6ab0de; width:100%;">.................. / {{ extrait.arrondissement_gauche }}</span>
                    <span class="value" style="width: 100%; text-align: center; display: block; padding-top: 5px;">{{ extrait.titulaire.n_etat_civil|default:"-" }}</span>
                </div>""", 
"""                <div style="justify-content: space-between;">
                    <span class="label-text" style="color: #6ab0de; white-space: nowrap; width: auto;">..... / {{ extrait.arrondissement_gauche }}</span>
                    <span class="value" style="text-align: right; padding: 0;">{{ extrait.titulaire.n_etat_civil|default:"-" }}</span>
                </div>""")

    # Merge declaration / jugement AR
    text = text.replace(
"""                <div><span class="label-text">تصريح</span> <span class="value">{% if extrait.declaration %}✔{% endif %}</span></div>
                <div><span class="label-text">حكم</span> <span class="value">{% if extrait.jugement %}✔{% endif %}</span></div>""",
"""                <div style="border: none; margin-bottom: 0; padding-bottom: 0;">
                    <span class="label-text" style="width:50px;">تصريح</span> <span class="value" style="text-align: right;">{% if extrait.declaration %}✔{% else %}&nbsp;{% endif %}</span>
                    <span class="label-text" style="width:40px;">حكم</span> <span class="value" style="text-align: right;">{% if extrait.jugement %}✔{% else %}&nbsp;{% endif %}</span>
                </div>""")

    # Merge declaration / jugement FR
    text = text.replace(
"""                <div><span class="label-text">Déclaration</span> <span class="value">{% if extrait.declaration %}✔{% endif %}</span></div>
                <div><span class="label-text">Jugement</span> <span class="value">{% if extrait.jugement %}✔{% endif %}</span></div>""",
"""                <div style="border: none; margin-bottom: 0; padding-bottom: 0;">
                    <span class="label-text" style="width:80px;">Décl.</span> <span class="value" style="text-align: left;">{% if extrait.declaration %}✔{% else %}&nbsp;{% endif %}</span>
                    <span class="label-text" style="width:70px;">Jugem.</span> <span class="value" style="text-align: left;">{% if extrait.jugement %}✔{% else %}&nbsp;{% endif %}</span>
                </div>""")

    # 4. Modify Footer Price layout
    text = text.replace(
"""        .price-box {
            width: 32%;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
        }""",
"""        .price-box {
            width: 38%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }""")
        
    # Remove padding/border from price rows
    text = text.replace('style="padding-top: 15px; border-top: 1px dotted #6ab0de;"', "")

    Path(path_str).write_text(text, encoding='utf-8')

update_file(r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate.html")
update_file(r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate_fr.html")
print("Certificates compressed heavily!")
