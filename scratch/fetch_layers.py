import json
import requests
import shapely.geometry

# 1. Load the new boundary polygon
with open(r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\limite_kelibia_v2.geojson', 'r', encoding='utf-8') as f:
    gj = json.load(f)
ring = gj['features'][0]['geometry']['coordinates'][0]
boundary_poly = shapely.geometry.Polygon(ring)

# 2. Get bbox
lngs = [p[0] for p in ring]
lats = [p[1] for p in ring]
s, w, n, e = min(lats), min(lngs), max(lats), max(lngs)
bbox = f"{s},{w},{n},{e}"

def fetch_overpass(query):
    print("Fetching...", query[:50].replace('\n', ' '))
    url = "http://overpass-api.de/api/interpreter"
    try:
        response = requests.post(
            url, 
            data={'data': query}, 
            headers={'User-Agent': 'KelibiaSmartCityApp/1.0'}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("Error fetching from Overpass:")
        print(response.text[:1000] if 'response' in locals() else str(e))
        raise

def build_geojson(elements, is_polygon=False):
    features = []
    for el in elements:
        if 'geometry' not in el:
            continue
        coords = [[pt['lon'], pt['lat']] for pt in el['geometry']]
        if len(coords) < 2:
            continue
            
        if is_polygon:
            if coords[0] != coords[-1]:
                coords.append(coords[0])
            geom = shapely.geometry.Polygon(coords)
        else:
            geom = shapely.geometry.LineString(coords)
            
        # Clip to boundary
        if not geom.intersects(boundary_poly):
            continue
            
        clipped = geom.intersection(boundary_poly)
        if clipped.is_empty:
            continue
            
        # Handle Multi-geometries resulting from intersection
        geoms_to_process = []
        if getattr(clipped, 'geoms', None):
            geoms_to_process = list(clipped.geoms)
        else:
            geoms_to_process = [clipped]
            
        for g in geoms_to_process:
            if is_polygon and g.geom_type in ('Polygon', 'MultiPolygon'):
                if g.geom_type == 'Polygon':
                    c = [list(g.exterior.coords)]
                    features.append({
                        "type": "Feature",
                        "properties": el.get('tags', {}),
                        "geometry": {"type": "Polygon", "coordinates": c}
                    })
            elif not is_polygon and g.geom_type in ('LineString', 'MultiLineString'):
                if g.geom_type == 'LineString':
                    c = list(g.coords)
                    features.append({
                        "type": "Feature",
                        "properties": el.get('tags', {}),
                        "geometry": {"type": "LineString", "coordinates": c}
                    })
                elif g.geom_type == 'MultiLineString':
                    for line in g.geoms:
                        features.append({
                            "type": "Feature",
                            "properties": el.get('tags', {}),
                            "geometry": {"type": "LineString", "coordinates": list(line.coords)}
                        })

    return {
        "type": "FeatureCollection",
        "features": features
    }

# 3. Routes
routes_q = f"""[out:json][timeout:50];
(
  way["highway"]({bbox});
);
out geom;"""
r_data = fetch_overpass(routes_q)
r_gj = build_geojson(r_data.get('elements', []), is_polygon=False)
with open(r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\routes_lignes.geojson', 'w', encoding='utf-8') as f:
    json.dump(r_gj, f)
print(f"Routes: {len(r_gj['features'])} features")

# 4. Batiments
bat_q = f"""[out:json][timeout:50];
(
  way["building"]({bbox});
);
out geom;"""
b_data = fetch_overpass(bat_q)
b_gj = build_geojson(b_data.get('elements', []), is_polygon=True)
with open(r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\batiments_polygones.geojson', 'w', encoding='utf-8') as f:
    json.dump(b_gj, f)
print(f"Batiments: {len(b_gj['features'])} features")

# 5. Espaces verts
esp_q = f"""[out:json][timeout:50];
(
  way["leisure"="park"]({bbox});
  way["leisure"="garden"]({bbox});
  way["landuse"="forest"]({bbox});
  way["landuse"="grass"]({bbox});
  way["natural"="wood"]({bbox});
);
out geom;"""
e_data = fetch_overpass(esp_q)
e_gj = build_geojson(e_data.get('elements', []), is_polygon=True)
with open(r'c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\public\layers\espaces_verts_polygones.geojson', 'w', encoding='utf-8') as f:
    json.dump(e_gj, f)
print(f"Espaces verts: {len(e_gj['features'])} features")

print("All layers updated successfully!")
