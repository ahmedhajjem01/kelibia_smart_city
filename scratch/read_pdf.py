import sys
import os
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Installing PyMuPDF...")
    install("pymupdf")
    import fitz

pdf_path = r"C:\Users\espace info\Downloads\versionFinale.pdf"
output_path = r"C:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\scratch\pdf_content.txt"

try:
    doc = fitz.open(pdf_path)
    with open(output_path, "w", encoding="utf-8") as f:
        for i in range(len(doc)):
            page = doc.load_page(i)
            f.write(f"\n--- Page {i + 1} ---\n")
            f.write(page.get_text())
    print("Successfully extracted text to:", output_path)
except Exception as e:
    print("Error:", e)
