/**
 * Custom Hospital Icon for Leaflet Markers
 * 
 * Creates a red cross icon for hospital markers
 * Uses Leaflet's Icon API for custom styling
 */

import L from "leaflet"

/**
 * Create a custom hospital icon (red cross)
 */
export function createHospitalIcon() {
  return L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <path d="M16 10 L16 22 M10 16 L22 16" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  })
}

/**
 * Fallback to default marker icon if custom icon fails
 */
export function getDefaultIcon() {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}
