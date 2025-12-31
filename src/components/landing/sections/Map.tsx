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
  const markers = useRef<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
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
          // Handle both response formats: { properties: [] } and { data: [] }
          const props = data.properties || data.data || [];
          console.log(`[map] Fetched ${props.length} properties for ${city}`);
          setProperties(props);
        } else {
          console.warn(`[map] API returned ${response.status} for city: ${city}`);
        }
      } catch (error) {
        console.warn("[map] Failed to fetch properties:", error);
        // Set empty array on error to avoid undefined issues
        setProperties([]);
      }
    }

    fetchProperties();
  }, [city, status]);

  // ---------- render property markers ----------
  useEffect(() => {
    if (!map.current) return;
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

    // Auto-zoom to the markers (or fall back to geocoded viewport)
    try {
      const bounds = new g.LatLngBounds();
      let count = 0;
      markers.current.forEach((m) => {
        const pos = m.getPosition?.();
        if (pos) {
          bounds.extend(pos);
          count++;
        }
      });

      if (count > 1) {
        map.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        // prevent extreme zoom-in on tightly clustered points
        const z = map.current.getZoom?.();
        if (typeof z === "number" && z > 16) map.current.setZoom(16);
      } else if (count === 1) {
        map.current.setCenter(bounds.getCenter());
        map.current.setZoom(14);
      } else if (geocodeViewport.current) {
        map.current.fitBounds(geocodeViewport.current, {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
        });
      }
    } catch (e) {
      console.warn("[map] fitBounds failed", e);
    }
  }, [properties]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold" style={{ color: '#fcba03' }}>Map</h2>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex gap-2">
          {status === "loading" && <span>Loading</span>}
          {status === "error" && (
            <span className="text-red-500">Map Unavailable</span>
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
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#fcba03' }}>
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
