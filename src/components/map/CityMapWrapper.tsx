// src/components/map/CityMapWrapper.tsx
'use client';

import { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';

type BoundsArray = [number, number, number, number]; // [west, south, east, north]
type Property = { id: string | number; latitude?: number; longitude?: number };

export default function CityMapWrapper({
  bounds,
  properties = [],
}: {
  bounds: BoundsArray;
  properties: Property[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // 1) INIT ONCE
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Guard against dev Strict Mode or HMR double-mounts
    if (mapRef.current) return;

    // (Optional) clear stale leaflet id on the same div (helps during Fast Refresh)
    if ((el as any)._leaflet_id) (el as any)._leaflet_id = null;

    const map = L.map(el, { zoomControl: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      // keep default options conservative; add maxZoom if you need
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    // initial fit (if bounds are already known on first render)
    if (bounds) {
      const llb = L.latLngBounds(
        L.latLng(bounds[1], bounds[0]),
        L.latLng(bounds[3], bounds[2])
      );
      map.fitBounds(llb, { padding: [20, 20] });
    }

    return () => {
      // IMPORTANT: remove map on unmount so the container can be reused safely
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // 2) UPDATE MARKERS WHEN PROPERTIES CHANGE
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();

    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      L.marker([p.latitude, p.longitude]).addTo(layer);
    });
  }, [properties]);

  // 3) UPDATE VIEW WHEN BOUNDS CHANGE
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    const llb = L.latLngBounds(
      L.latLng(bounds[1], bounds[0]),
      L.latLng(bounds[3], bounds[2])
    );
    map.fitBounds(llb, { padding: [20, 20] });
  }, [bounds]);

  return <div ref={containerRef} className="h-[480px] w-full rounded-xl" />;
}
