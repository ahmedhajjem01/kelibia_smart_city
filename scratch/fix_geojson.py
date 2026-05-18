import json
import os

# Path to the fetched content for the delegation
fetched_path = r'C:\Users\espace info\.gemini\antigravity\brain\39fd30ae-e348-439c-8ecb-774e7540c9fa\.system_generated\steps\84\content.md'
target_path = r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\limite_kelibia.geojson'

with open(fetched_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The content has some headers, find the JSON part
json_start = content.find('{')
json_content = content[json_start:]
gj_raw = json.loads(json_content)

# Convert MultiPolygon to Polygon if possible
if gj_raw['type'] == 'MultiPolygon':
    # Take the first ring of the first polygon
    coordinates = gj_raw['coordinates'][0]
else:
    coordinates = gj_raw['coordinates']

new_gj = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Kélibia (Délégation)",
                "admin_level": "8",
                "boundary": "administrative"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": coordinates
            }
        }
    ]
}

with open(target_path, 'w', encoding='utf-8') as f:
    json.dump(new_gj, f, ensure_ascii=False)

print(f"Successfully updated {target_path} with delegation boundaries.")
