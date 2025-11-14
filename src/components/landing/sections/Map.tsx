"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  city: string; // can be "California" or "San Diego, CA"
}
type GMaps = any;

export default function MapSection({ city }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<any | null>(null);
  const geocodeViewport = useRef<any | null>(null);
  const polygons = useRef<any[]>([]);
  const markers = useRef<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [polyStatus, setPolyStatus] = useState<
    "pending" | "ok" | "fail" | "none"
  >("pending");
  const [properties, setProperties] = useState<any[]>([]);

  // ---------- load Google Maps ----------
  const ensureScript = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") return reject(new Error("SSR"));
        if ((window as any).google?.maps) return resolve();

        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) {
          console.warn("[map] Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY - map will not load");
          return reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
        }

        const cbName = "__gmaps_cb_" + Math.random().toString(36).slice(2);
        (window as any)[cbName] = () => resolve();

        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${cbName}`;
        s.async = true;
        s.defer = true;
        s.dataset.landingGmaps = "1";
        s.onerror = () => {
          console.warn("[map] Google Maps script load failed - possibly billing not enabled");
          reject(new Error("gmaps script load failed"));
        };
        document.head.appendChild(s);
      }),
    []
  );

  // ---------- init map ----------
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    ensureScript()
      .then(async () => {
        if (cancelled || !mapRef.current) return;
        const g = (window as any).google.maps as GMaps;
        if (!g) throw new Error("google.maps not available");

        map.current = new g.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
          center: { lat: 39.5, lng: -98.35 },
          zoom: 5,
        });

        if (city) {
          try {
            const geocoder = new g.Geocoder();
            const geoRes = await geocoder.geocode({ address: city });
            const hit = geoRes.results?.[0];
            if (hit) {
              const vp = hit.geometry.viewport || new g.LatLngBounds();
              geocodeViewport.current = vp;
              map.current.fitBounds(vp, {
                top: 40,
                bottom: 40,
                left: 40,
                right: 40,
              });
            }
          } catch (e) {
            console.warn("[map] geocode failed", e);
          }
        }
        setStatus("ready");
      })
      .catch((e) => {
        if (!cancelled) {
          console.warn("[map] init failed", e);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureScript, city]);

  // ---------- boundaries ----------
  useEffect(() => {
    if (status !== "ready" || !map.current) return;

    async function fetchBoundary() {
      if (!city) {
        setPolyStatus("none");
        return;
      }
      setPolyStatus("pending");
      const g = (window as any).google.maps as GMaps;
      const safe = city.replace(/"/g, '\\"');

      // Query tiers: state (admin_level 4), county (6/7), city/town (8), generic place
      const queryTemplates = [
        `relation["boundary"="administrative"]["admin_level"="4"]["name"~"^${safe}$",i];`,
        `relation["boundary"="administrative"]["admin_level"~"6|7"]["name"~"^${safe}$",i];`,
        `relation["boundary"="administrative"]["admin_level"="8"]["name"~"^${safe}$",i];`,
        `relation["place"~"city|town|village"]["name"~"^${safe}$",i];`
      ];

      let succeeded = false;

      for (const tmpl of queryTemplates) {
        const overpass = `[out:json][timeout:30];(${tmpl});(._;>;);out geom;`;
        try {
          console.log("[map.boundary] Overpass attempt", tmpl);
          const resp = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: overpass,
          });
          if (!resp.ok) {
            console.warn("[map.boundary] HTTP", resp.status);
            continue;
          }
          const json = await resp.json();
          const relations: any[] =
            json.elements?.filter((e: any) => e.type === "relation") || [];
          if (!relations.length) {
            console.log("[map.boundary] no relations in this tier");
            continue;
          }

          // Choose best relation: prefer one with outer ways & lowest admin_level
          const pick = relations
            .map(r => ({
              r,
              level: parseInt(r.tags?.admin_level || "99", 10) || 99,
              outers: (r.members || []).filter((m: any) => m.type === "way" && (m.role === "outer" || !m.role)).length
            }))
            .sort((a, b) => (a.outers === b.outers ? a.level - b.level : b.outers - a.outers))[0].r;

          const allWays = json.elements.filter(
            (e: any) => e.type === "way" && Array.isArray(e.geometry)
          );
          const outerWayIds = (pick.members || [])
            .filter(
              (m: any) => m.type === "way" && (m.role === "outer" || !m.role)
            )
            .map((m: any) => m.ref);

          let ways = allWays.filter((w: any) => outerWayIds.includes(w.id));
          let rings: { lat: number; lng: number }[][] = [];
          if (ways.length) {
            rings = ways.map((w: any) =>
              w.geometry.map((pt: any) => ({ lat: pt.lat, lng: pt.lon }))
            );
          } else if (pick.geometry) {
            rings = ringify(pick.geometry);
          }

          if (!rings.length) {
            console.log("[map.boundary] empty geometry in this tier");
            continue;
          }

          drawPolygons(rings, g, map.current, polygons);
          setPolyStatus("ok");
          console.log("[map.boundary] success from tier", tmpl);
          succeeded = true;
          break;
        } catch (err) {
          console.warn("[map.boundary] tier error", err);
        }
      }

      if (!succeeded) {
        console.warn("[map.boundary] Overpass failed all tiers, trying Nominatim fallback");
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=${encodeURIComponent(
            city
          )}`;
          const resp = await fetch(url, {
            headers: { "Accept": "application/json" },
          });
          if (resp.ok) {
            const gj = await resp.json();
            const feat = gj.features?.[0];
            if (feat?.geometry) {
              const rings = geojsonToRings(feat.geometry);
              if (rings.length) {
                drawPolygons(rings, g, map.current, polygons);
                setPolyStatus("ok");
                console.log("[map.boundary] fallback Nominatim success");
                return;
              }
            }
          }
          setPolyStatus("fail");
        } catch (e) {
          console.warn("[map.boundary] Nominatim fallback failed", e);
          setPolyStatus("fail");
        }

        // fallback: keep geocode viewport if available
        if (geocodeViewport.current && map.current) {
          map.current.fitBounds(geocodeViewport.current, {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40,
          });
        }
      }
    }

    fetchBoundary();
  }, [city, status]);

  // ---------- fetch properties ----------
  useEffect(() => {
    if (!city || status !== "ready") return;

    async function fetchProperties() {
      try {
        const searchParams = new URLSearchParams({
          city: city,
          limit: '50',
          sort: 'updated'
        });
        
        const response = await fetch(`/api/properties/search?${searchParams}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.warn("[map] Failed to fetch properties:", error);
      }
    }

    fetchProperties();
  }, [city, status]);

  // ---------- render property markers ----------
  useEffect(() => {
    if (!map.current || !properties.length) return;
    const g = (window as any).google.maps as GMaps;
    if (!g) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    // Add new markers for each property
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const marker = new g.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map: map.current,
        title: property.address || property.city,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#0D47A1",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add info window on click
      const infoWindow = new g.InfoWindow({
        content: `
          <div style="max-width: 250px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              ${property.address || property.city || 'Property'}
            </h3>
            ${property.list_price ? `
              <p style="margin: 4px 0; font-size: 16px; font-weight: 700; color: #0D47A1;">
                $${property.list_price.toLocaleString()}
              </p>
            ` : ''}
            <div style="display: flex; gap: 12px; margin: 8px 0; font-size: 13px;">
              ${property.bedrooms_total ? `<span><strong>${property.bedrooms_total}</strong> beds</span>` : ''}
              ${property.bathrooms_total ? `<span><strong>${property.bathrooms_total}</strong> baths</span>` : ''}
              ${property.living_area ? `<span><strong>${property.living_area.toLocaleString()}</strong> sqft</span>` : ''}
            </div>
            <a 
              href="/properties/${(property.address || property.city || '').replace(/\s+/g, '-').toLowerCase()}/${property.listing_key}"
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #0D47A1; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500;"
            >
              View Details
            </a>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map.current, marker);
      });

      markers.current.push(marker);
    });
  }, [properties]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Map</h2>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex gap-2">
          {status === "loading" && <span>Loading</span>}
          {status === "error" && (
            <span className="text-red-500">Map Unavailable</span>
          )}
          {status === "ready" && polyStatus === "pending" && (
            <span>Boundary…</span>
          )}
          {status === "ready" && polyStatus === "ok" && <span>Boundary</span>}
          {status === "ready" && polyStatus === "fail" && (
            <span className="text-yellow-600">No Boundary</span>
          )}
          {properties.length > 0 && (
            <span className="text-blue-600">{properties.length} Properties</span>
          )}
        </div>
      </div>
      {status === "error" ? (
        <div className="h-96 w-full rounded-2xl border bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 bg-neutral-200 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Map Currently Unavailable
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Interactive map features are temporarily unavailable. Property listings are still fully accessible below.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={mapRef}
          className="h-96 w-full rounded-2xl border overflow-hidden"
        />
      )}
    </section>
  );
}

/* ---------- helpers ---------- */
function ringify(
  geometry: Array<{ lat: number; lon: number }>
): { lat: number; lng: number }[][] {
  const rings: { lat: number; lng: number }[][] = [];
  let cur: { lat: number; lng: number }[] = [];
  const jump = 0.2;
  for (let i = 0; i < geometry.length; i++) {
    const pt = geometry[i],
      prev = geometry[i - 1];
    const node = { lat: pt.lat, lng: pt.lon };
    if (prev) {
      const dl = Math.abs(prev.lat - pt.lat);
      const dn = Math.abs(prev.lon - pt.lon);
      if (dl > jump || dn > jump) {
        if (cur.length) rings.push(cur);
        cur = [];
      }
    }
    cur.push(node);
  }
  if (cur.length) rings.push(cur);
  return rings;
}

function drawPolygons(
  rings: { lat: number; lng: number }[][],
  g: GMaps,
  mapInst: any,
  polygonsRef: React.MutableRefObject<any[]>
) {
  polygonsRef.current.forEach((p) => p.setMap(null));
  polygonsRef.current = [];
  rings.forEach((seg) => {
    polygonsRef.current.push(
      new g.Polygon({
        paths: seg,
        strokeColor: "#0D47A1",
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: "#1976D2",
        fillOpacity: 0.12,
        clickable: false,
        map: mapInst,
      })
    );
  });
  if (rings.length) {
    try {
      const b = new g.LatLngBounds();
      rings.forEach((seg) => seg.forEach((p) => b.extend(p)));
      mapInst.fitBounds(b, { top: 40, bottom: 40, left: 40, right: 40 });
      if ((mapInst.getZoom?.() ?? 12) < 5 && rings.length === 1) {
        mapInst.setZoom(5);
      }
    } catch (e) {
      console.warn("[map.boundary] fitBounds failed", e);
    }
  }
}

function geojsonToRings(geom: any): { lat: number; lng: number }[][] {
  const rings: { lat: number; lng: number }[][] = [];
  if (!geom) return rings;
  if (geom.type === "Polygon") {
    geom.coordinates.forEach((ring: number[][]) =>
      rings.push(ring.map(([lng, lat]) => ({ lat, lng })))
    );
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly: number[][][]) =>
      poly.forEach((ring: number[][]) =>
        rings.push(ring.map(([lng, lat]) => ({ lat, lng })))
      )
    );
  }
  return rings;
}
