'use client'

import { useEffect, useRef } from 'react'

interface Props {
  startLat: number | null
  startLng: number | null
  endLat: number | null
  endLng: number | null
}

const DEFAULT_CENTER: [number, number] = [7.3, 5.1]
const DEFAULT_ZOOM = 6
const PIN_ZOOM = 16

function makeIcon(L: any, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function ChainageMap({ startLat, startLng, endLat, endLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const startMarker  = useRef<any>(null)
  const endMarker    = useRef<any>(null)
  const lineRef      = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(containerRef.current!, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: false,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      mapRef.current = map
      updatePins(L)
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      startMarker.current = null
      endMarker.current   = null
      lineRef.current     = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updatePins(L: any) {
    const map = mapRef.current
    if (!map) return

    // Remove old markers and line
    if (startMarker.current) { startMarker.current.remove(); startMarker.current = null }
    if (endMarker.current)   { endMarker.current.remove();   endMarker.current   = null }
    if (lineRef.current)     { lineRef.current.remove();     lineRef.current     = null }

    const hasStart = startLat != null && startLng != null
    const hasEnd   = endLat   != null && endLng   != null

    if (hasStart) {
      startMarker.current = L.marker([startLat!, startLng!], { icon: makeIcon(L, '#22c55e') })
        .bindTooltip('Start', { permanent: true, direction: 'top', offset: [0, -10] })
        .addTo(map)
    }
    if (hasEnd) {
      endMarker.current = L.marker([endLat!, endLng!], { icon: makeIcon(L, '#ef4444') })
        .bindTooltip('End', { permanent: true, direction: 'top', offset: [0, -10] })
        .addTo(map)
    }
    if (hasStart && hasEnd) {
      lineRef.current = L.polyline(
        [[startLat!, startLng!], [endLat!, endLng!]],
        { color: '#f59e0b', weight: 2.5, dashArray: '6 4', opacity: 0.85 }
      ).addTo(map)
      map.fitBounds([[startLat!, startLng!], [endLat!, endLng!]], { padding: [40, 40] })
    } else if (hasStart) {
      map.setView([startLat!, startLng!], PIN_ZOOM)
    } else if (hasEnd) {
      map.setView([endLat!, endLng!], PIN_ZOOM)
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    }
  }

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => updatePins(L))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLat, startLng, endLat, endLng])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={containerRef}
        style={{
          width: '100%', height: 240,
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.10)',
          marginTop: 16, background: '#1a1a1f',
        }}
      />
    </>
  )
}
