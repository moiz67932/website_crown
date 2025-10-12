// src/components/map/CityMapWrapper.tsx
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css'; // ok in a client component

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
  const mapRef = useRef<ReturnType<Awaited<typeof import('leaflet')>['map']> | null>(null);
  const LRef = useRef<Awaited<typeof import('leaflet')> | null>(null);
  const markersRef = useRef<any>(null);

  // INIT ONCE
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      LRef.current = L;

      // fix default icon paths (absolute from /public)
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
      });

      const el = containerRef.current;
      if (!el || cancelled) return;

      // clear any stale Leaflet id after HMR
      if ((el as any)._leaflet_id) (el as any)._leaflet_id = null;

      const map = L.map(el, { zoomControl: true });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);

      // initial fit
      if (bounds) {
        const llb = L.latLngBounds(
          L.latLng(bounds[1], bounds[0]),
          L.latLng(bounds[3], bounds[2])
        );
        map.fitBounds(llb, { padding: [20, 20] });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
      LRef.current = null;
    };
  }, []);

  // UPDATE MARKERS WHEN PROPERTIES CHANGE
  useEffect(() => {
    const L = LRef.current;
    const layer = markersRef.current;
    if (!L || !layer) return;

    layer.clearLayers();
    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      L.marker([p.latitude, p.longitude]).addTo(layer);
    });
  }, [properties]);

  // UPDATE VIEW WHEN BOUNDS CHANGE
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !bounds) return;

    const llb = L.latLngBounds(
      L.latLng(bounds[1], bounds[0]),
      L.latLng(bounds[3], bounds[2])
    );
    map.fitBounds(llb, { padding: [20, 20] });
  }, [bounds]);

  return <div ref={containerRef} className="h-[480px] w-full rounded-xl" />;
}
