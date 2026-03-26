import { useEffect, useRef } from 'react'
import L from 'leaflet'

const CAT_ICON   = { lighting:'💡', trash:'🗑️', roads:'🛣️', noise:'🔊', other:'📌' }
const COLOR_MAP  = { pending:'#e65100', in_progress:'#1565c0', resolved:'#1b5e20', rejected:'#757575' }
const STATUS_LBL = { pending:'En attente', in_progress:'En cours', resolved:'Résolue', rejected:'Rejetée' }
const PRIO_CLR   = { urgente:'#b71c1c', normale:'#1565c0', faible:'#6a1b9a' }
const PRIO_LBL   = { urgente:'🔴 Urgente', normale:'🔵 Normale', faible:'🟣 Faible' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' })
}

async function loadGeoJSON(map, lc) {
  try {
    const zRes  = await fetch('/geodata/kelibia_zones.geojson')
    const zData = await zRes.json()
    const zones = L.geoJSON(zData, {
      style: f => ({ color: f.properties.color||'#1565c0', weight:2, opacity:.8, fillColor: f.properties.color||'#1565c0', fillOpacity:.12, dashArray:'5,5' }),
      onEachFeature: (f, layer) => {
        layer.bindPopup(`<div style="font-size:13px;min-width:160px;"><strong style="color:#1a3a5c;">${f.properties.name}</strong><br><span style="color:#888;font-size:11px;">${f.properties.description||''}</span></div>`)
        layer.on('mouseover', () => layer.setStyle({ fillOpacity:.3 }))
        layer.on('mouseout',  () => layer.setStyle({ fillOpacity:.12 }))
      }
    }).addTo(map)

    const rRes   = await fetch('/geodata/kelibia_routes.geojson')
    const rData  = await rRes.json()
    const routes = L.geoJSON(rData, {
      style: f => ({ color: f.properties.color||'#424242', weight: f.properties.type==='route_nationale'?4:2.5, opacity:.75 }),
      onEachFeature: (f, layer) => { layer.bindTooltip(f.properties.name, { permanent:false }) }
    }).addTo(map)

    if (lc) {
      lc.addOverlay(zones,  '🏘️ Zones de la ville')
      lc.addOverlay(routes, '🛣️ Routes principales')
    }
  } catch(e) {
    console.warn('GeoJSON non chargé:', e)
  }
}

export default function LeafletMap({ reclamations = [], height = '380px' }) {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const markersRef = useRef(null)

  /* ── Init carte (une seule fois) ── */
  useEffect(() => {
    if (mapObj.current) return

    mapObj.current = L.map(mapRef.current).setView([36.8467, 11.1047], 13)

    // Couche 1 — OpenStreetMap
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapObj.current)

    // Couche 2 — Satellite Esri
    const sat = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS', maxZoom:19 }
    )

    // Couche 3 — Topographique WMS (OpenTopoMap)
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      maxZoom:17, opacity:.9
    })

    markersRef.current = L.layerGroup().addTo(mapObj.current)

    const lc = L.control.layers(
      { '🗺️ OpenStreetMap': osm, '🛰️ Satellite (Esri)': sat, '🏔️ Topographique (WMS)': topo },
      { '📍 Signalements': markersRef.current },
      { position:'topright', collapsed:false }
    ).addTo(mapObj.current)

    // Légende
    const legend = L.control({ position:'bottomleft' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div')
      div.style.cssText = 'background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.15);font-size:12px;min-width:170px;'
      div.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;color:#1a3a5c;border-bottom:1px solid #eee;padding-bottom:4px;">📋 Légende</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Statut</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#e65100;display:inline-block;"></span> En attente</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#1565c0;display:inline-block;"></span> En cours</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#1b5e20;display:inline-block;"></span> Résolu</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="width:12px;height:12px;border-radius:50%;background:#757575;display:inline-block;"></span> Rejeté</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Couches SIG (3 couches)</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:18px;height:10px;background:#e3f2fd;border:1px solid #90caf9;display:inline-block;border-radius:2px;"></span> OSM Standard</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:18px;height:10px;background:#795548;border:1px solid #5d4037;display:inline-block;border-radius:2px;"></span> Satellite Esri</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="width:18px;height:10px;background:#e8f5e9;border:1px solid #81c784;display:inline-block;border-radius:2px;"></span> Topographique WMS</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Overlays GeoJSON</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:20px;height:4px;background:#1565c0;opacity:.5;display:inline-block;border:1px solid #1565c0;"></span> Zones</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#424242;display:inline-block;"></span> Routes</div>
      `
      return div
    }
    legend.addTo(mapObj.current)

    loadGeoJSON(mapObj.current, lc)

    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  /* ── Mise à jour des marqueurs ── */
  useEffect(() => {
    if (!markersRef.current) return
    markersRef.current.clearLayers()
    const BASE_LAT = 36.8467, BASE_LNG = 11.1047

    reclamations.forEach(r => {
      const hasCoords = r.latitude != null && r.longitude != null
      const lat = hasCoords ? r.latitude  : BASE_LAT + (Math.random()-.5)*.04
      const lng = hasCoords ? r.longitude : BASE_LNG + (Math.random()-.5)*.06
      const color     = COLOR_MAP[r.status] || '#888'
      const emoji     = CAT_ICON[r.category] || '📌'
      const prioColor = PRIO_CLR[r.priority]  || '#1565c0'
      const prioLabel = PRIO_LBL[r.priority]  || '🔵 Normale'

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;${!hasCoords?'opacity:.65;':''}">${emoji}</div>`,
        iconSize:[30,30], iconAnchor:[15,15],
      })

      const marker = L.marker([lat,lng],{icon}).addTo(markersRef.current)
      marker.bindPopup(`
        <div style="min-width:210px;font-size:13px;">
          <strong style="color:#1a3a5c;">${r.title}</strong><br>
          <span style="color:#888;font-size:11px;">${emoji} ${r.category}</span><br>
          <span style="font-size:11px;">👤 ${r.citizen_name||'—'}</span><br>
          <span style="font-size:11px;">📅 ${fmtDate(r.created_at)}</span><br>
          <span style="font-size:11px;">🏢 ${r.service_responsable||'—'}</span><br>
          <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap;">
            <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">${STATUS_LBL[r.status]||r.status}</span>
            <span style="padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;background:${prioColor}18;color:${prioColor};border:1px solid ${prioColor}33;">${prioLabel}</span>
            ${!hasCoords?'<span style="font-size:10px;color:#aaa;">(approx.)</span>':''}
          </div>
        </div>
      `)
    })
  }, [reclamations])

  return <div ref={mapRef} style={{ height, width:'100%', borderRadius:'0 0 10px 10px' }} />
}
