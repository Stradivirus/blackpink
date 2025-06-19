import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "../../styles/leaflet.css";
import { API_URLS } from "../../api/urls";
import type { RiskyCountryFeature } from "../../types/Dashboard";

const RiskyCountryMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: L.Map | null = null;
    let geoLayer: L.GeoJSON<any> | null = null;

    fetch(API_URLS.RISKY_COUNTRIES_MAP)
      .then(res => res.json())
      .then((geojson: { features: RiskyCountryFeature[] }) => {
        if (mapRef.current) {
          if (map) map.remove();
          map = L.map(mapRef.current).setView([30, 0], 2);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

        interface RiskyCountryProperties {
            country: string;
            risk_level: "High" | "Medium" | "Low";
            alert_type?: string;
            timestamp: string;
        }

        interface RiskyCountryGeoJsonFeature extends GeoJSON.Feature<GeoJSON.Point, RiskyCountryProperties> {}

        geoLayer = L.geoJSON<RiskyCountryGeoJsonFeature>(geojson, {
            pointToLayer: (feature: RiskyCountryGeoJsonFeature, latlng: L.LatLng) => {
                let color = "#FFD700";
                if (feature.properties.risk_level === "High") color = "#dc2626";
                else if (feature.properties.risk_level === "Medium") color = "#f59e42";
                else color = "#3b82f6";
                return L.circleMarker(latlng, {
                    radius: 10,
                    fillColor: color,
                    color: "#fff",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                });
            },
            onEachFeature: (feature: RiskyCountryGeoJsonFeature, layer: L.Layer) => {
                layer.bindPopup(
                    `<b>${feature.properties.country}</b><br/>
                    위험도: ${feature.properties.risk_level}<br/>
                    유형: ${feature.properties.alert_type || "-"}<br/>
                    시각: ${feature.properties.timestamp}`
                );
            },
        }).addTo(map);
        }
      });

    return () => {
      if (map) map.remove();
    };
  }, []);

  return (
    <div className="panel" style={{ flex: 2, minWidth: 400, height: 400 }}>
      <h2 className="text-2xl font-semibold mb-2">위험 국가 매핑</h2>
      <div ref={mapRef} style={{ height: 350, width: "100%" }} />
    </div>
  );
};

export default RiskyCountryMap;