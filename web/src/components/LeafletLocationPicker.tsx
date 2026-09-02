"use client"

import React, { useState, useCallback, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, AlertCircle } from "lucide-react"
import { DEFAULT_MAP_CENTER } from "@/data/demo-hospitals"

// Fix for default marker icon in Leaflet with Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number } | null) => void
  defaultLocation?: { lat: number; lng: number } | null
  address?: string
  onAddressGeocode?: (address: string) => void
  error?: string
}

// Component to handle map clicks and marker dragging
function LocationMarker({ 
  position, 
  onPositionChange 
}: { 
  position: [number, number]
  onPositionChange: (pos: [number, number]) => void
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position)

  const map = useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng]
      setMarkerPosition(newPos)
      onPositionChange(newPos)
    },
  })

  // Update marker position when position prop changes
  useEffect(() => {
    setMarkerPosition(position)
    map.setView(position, map.getZoom())
  }, [position, map])

  const handleDragEnd = useCallback((e: L.DragEndEvent) => {
    const marker = e.target
    const newPos: [number, number] = [marker.getLatlng().lat, marker.getLatlng().lng]
    setMarkerPosition(newPos)
    onPositionChange(newPos)
  }, [onPositionChange])

  return (
    <Marker
      position={markerPosition}
      draggable={true}
      icon={icon}
      eventHandlers={{
        dragend: handleDragEnd,
      }}
    />
  )
}

export default function LeafletLocationPicker({
  onLocationChange,
  defaultLocation,
  address,
  onAddressGeocode,
  error,
}: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(
    defaultLocation ? [defaultLocation.lat, defaultLocation.lng] : DEFAULT_MAP_CENTER
  )
  const [searchAddress, setSearchAddress] = useState(address || "")
  const [geocodeError, setGeocodeError] = useState<string>("")

  // Update marker position when defaultLocation changes
  useEffect(() => {
    if (defaultLocation) {
      const newPos: [number, number] = [defaultLocation.lat, defaultLocation.lng]
      setMarkerPosition(newPos)
      onLocationChange(defaultLocation)
    }
  }, [defaultLocation, onLocationChange])

  const handlePositionChange = useCallback((pos: [number, number]) => {
    setMarkerPosition(pos)
    onLocationChange({ lat: pos[0], lng: pos[1] })
    setGeocodeError("")
  }, [onLocationChange])

  // Simple geocoding using Nominatim (OpenStreetMap's free geocoding service)
  const geocodeAddress = useCallback(async (addressToGeocode: string) => {
    if (!addressToGeocode.trim()) return

    setGeocodeError("")
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToGeocode)}&limit=1`,
        {
          headers: {
            'User-Agent': 'VeinLink/1.0' // Required by Nominatim
          }
        }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const newPosition: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)]
        setMarkerPosition(newPosition)
        onLocationChange({ lat: newPosition[0], lng: newPosition[1] })
        setGeocodeError("")
        
        if (onAddressGeocode) {
          onAddressGeocode(result.display_name || addressToGeocode)
        }
      } else {
        setGeocodeError("Could not find this address. Please try a more specific address or click/drag the marker on the map.")
        onLocationChange(null)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setGeocodeError("Address search temporarily unavailable. Please click or drag the marker on the map to set location.")
      onLocationChange(null)
    }
  }, [onLocationChange, onAddressGeocode])

  const handleAddressSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (searchAddress.trim()) {
      geocodeAddress(searchAddress)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address-search" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Search Address or Click/Drag Marker on Map
        </Label>
        <div className="flex gap-2">
          <Input
            id="address-search"
            type="text"
            placeholder="Enter full address (street, city, state, pincode)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddressSubmit(e as any)
              }
            }}
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleAddressSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
          >
            Search
          </button>
        </div>
        {geocodeError && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">{geocodeError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Tip: You can also click anywhere on the map or drag the marker to set the exact location.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Map Location</Label>
        <MapContainer
          center={markerPosition}
          zoom={markerPosition === DEFAULT_MAP_CENTER ? 10 : 15}
          style={{ height: "400px", width: "100%", borderRadius: "8px" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={markerPosition} onPositionChange={handlePositionChange} />
        </MapContainer>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500" />
          Donors will be guided to this exact location for blood checkup and donation.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
