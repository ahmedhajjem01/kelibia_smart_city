import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function PickMap({ onLocationSelect }) {
  const mapRef    = useRef(null)
  const mapObj    = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapObj.current) return
    setTimeout(() => {
      mapObj.current = L.map(mapRef.current).setView([36.8467, 11.1047], 14)

      const pmOsm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(mapObj.current)

      const pmSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri', maxZoom: 19
      })

      const pmTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap', maxZoom: 17
      })

      L.control.layers(
        { '🗺️ OpenStreetMap': pmOsm, '🛰️ Satellite': pmSat, '🏔️ Topographique': pmTopo },
        {}, { position: 'topright', collapsed: true }
      ).addTo(mapObj.current)

      mapObj.current.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) mapObj.current.removeLayer(markerRef.current)
        const icon = L.divIcon({
          className: '',
          html: '<div style="background:#1565c0;color:#fff;border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);"><i class="fas fa-map-pin" style="transform:rotate(45deg);"></i></div>',
          iconSize: [32,32], iconAnchor: [16,32],
        })
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapObj.current)
        if (onLocationSelect) onLocationSelect(lat, lng)
      })

      mapObj.current.invalidateSize()
    }, 100)

    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  return <div ref={mapRef} style={{ height:'220px', width:'100%', borderRadius:'8px', border:'2px solid #dde3ec', cursor:'crosshair' }} />
}
