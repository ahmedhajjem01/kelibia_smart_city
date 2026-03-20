from pathlib import Path

files = [
    r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate.html",
    r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate_fr.html"
]

for f in files:    
    text = Path(f).read_text(encoding='utf-8')
    
    # Make .page a flex column
    if "flex-direction: column;" not in text.split('.page {')[1][:100]:
        text = text.replace(".page {\n            width: 210mm;", ".page {\n            display: flex;\n            flex-direction: column;\n            width: 210mm;")
    
    # Make .main-content take up remaining space
    if "flex: 1;" not in text.split('.main-content {')[1][:100]:
        text = text.replace(".main-content {\n            margin-top: 10px;", ".main-content {\n            flex: 1;\n            display: flex;\n            flex-direction: column;\n            margin-top: 10px;")
    
    # Make .row stretch evenly
    if "flex: 1;" not in text.split('.row {')[1][:50]:
        text = text.replace(".row {\n            display: flex;", ".row {\n            flex: 1;\n            display: flex;")
        
    Path(f).write_text(text, encoding='utf-8')

print("Certificates stretched to fully fill A4!")
