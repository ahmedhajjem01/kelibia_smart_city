import json
import shapely.geometry
from shapely.ops import unary_union

# Load Kelibia
with open(r'C:\Users\espace info\.gemini\antigravity\brain\39fd30ae-e348-439c-8ecb-774e7540c9fa\.system_generated\steps\123\content.md', encoding='utf-8') as f:
    k_content = f.read()
k_json_start = k_content.find('{')
k_gj = json.loads(k_content[k_json_start:])
if k_gj['type'] == 'MultiPolygon':
    k_shape = shapely.geometry.MultiPolygon([shapely.geometry.Polygon(p[0], p[1:]) for p in k_gj['coordinates']])
else:
    k_shape = shapely.geometry.Polygon(k_gj['coordinates'][0], k_gj['coordinates'][1:])

# Load Oued El Khatef
with open(r'C:\Users\espace info\.gemini\antigravity\brain\39fd30ae-e348-439c-8ecb-774e7540c9fa\.system_generated\steps\150\content.md', encoding='utf-8') as f:
    o_content = f.read()
o_json_start = o_content.find('{')
o_gj = json.loads(o_content[o_json_start:])
if o_gj['type'] == 'MultiPolygon':
    o_shape = shapely.geometry.MultiPolygon([shapely.geometry.Polygon(p[0], p[1:]) for p in o_gj['coordinates']])
else:
    o_shape = shapely.geometry.Polygon(o_gj['coordinates'][0], o_gj['coordinates'][1:])

# Union
combined = unary_union([k_shape, o_shape])

print("Combined geometry type:", combined.geom_type)

# If it's a Polygon, we can save it directly
if combined.geom_type == 'Polygon':
    # Convert back to coordinates
    coords = [list(combined.exterior.coords)]
    for interior in combined.interiors:
        coords.append(list(interior.coords))
        
    new_gj = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Kélibia + Oued El Khatef",
                    "admin_level": "8",
                    "boundary": "administrative"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coords
                }
            }
        ]
    }
    
    with open(r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\limite_kelibia.geojson', 'w', encoding='utf-8') as f:
        json.dump(new_gj, f, ensure_ascii=False)
    print("Saved combined polygon to limite_kelibia.geojson")
else:
    print("WARNING: Combined geometry is not a simple Polygon. It is:", combined.geom_type)
