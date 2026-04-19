import os
import glob
import re

pages_dir = r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\src\pages"

regex = re.compile(r"fetch\('(/api/[^']+)'")

def replacer(match):
    url = match.group(1)
    return f"fetch(resolveBackendUrl('{url}')"

count = 0
for file in glob.glob(os.path.join(pages_dir, '*.tsx')):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = regex.sub(replacer, content)
    
    if new_content != content:
        if "resolveBackendUrl" not in new_content:
            new_content = "import { resolveBackendUrl } from '../lib/backendUrl'\n" + new_content
            
        count += 1
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

print(f"Fixed {count} files")
