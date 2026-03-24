import urllib.request
import subprocess
import os
import sys

# URL for GDAL 3.8.4 for Python 3.12 (64-bit Windows)
url = "https://github.com/cgohlke/geospatial-wheels/releases/download/v2023.11.26/GDAL-3.8.4-cp312-cp312-win_amd64.whl"
output_file = "GDAL-3.8.4-cp312-cp312-win_amd64.whl"

print("Downloading GDAL wheel...")
try:
    urllib.request.urlretrieve(url, output_file)
    print("Download complete.")
    
    # Install the wheel
    print("Installing GDAL wheel in the virtual environment...")
    subprocess.check_call([r"..\.venv\Scripts\pip.exe", "install", output_file])
    print("Installation successful!")
    
except Exception as e:
    print(f"Failed: {e}")
