from pathlib import Path

files = [
    r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate.html",
    r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\templates\extrait_naissance\certificate_fr.html"
]

for f in files:
    content = Path(f).read_text(encoding='utf-8')
    # Page and body
    content = content.replace("padding: 40px;", "padding: 25px;")
    # Header
    content = content.replace("margin-bottom: 25px;", "margin-bottom: 10px;")
    # Info box
    content = content.replace("padding: 12px;\n            font-size: 0.95em;", "padding: 6px;\n            font-size: 0.85em;")
    content = content.replace("margin-bottom: 10px;", "margin-bottom: 5px;")
    content = content.replace("padding-bottom: 5px;", "padding-bottom: 3px;")
    # Main content
    content = content.replace("margin-top: 35px;", "margin-top: 15px;")
    content = content.replace("padding: 12px 15px;", "padding: 8px 15px;")
    # Footer
    content = content.replace("margin-top: 30px;", "margin-top: 15px;")
    content = content.replace("padding: 15px 20px;", "padding: 8px 15px;")
    content = content.replace("min-height: 120px;", "min-height: 70px;")
    content = content.replace("margin-bottom: 15px;", "margin-bottom: 8px;")
    
    Path(f).write_text(content, encoding='utf-8')

print("CSS dimensions shrunk effectively!")
