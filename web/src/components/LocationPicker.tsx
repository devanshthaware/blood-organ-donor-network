"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, AlertCircle } from "lucide-react"

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
}

const defaultCenter = {
  lat: 40.7128, // New York default
  lng: -74.0060,
}

const libraries: ("places")[] = ["places"]

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number } | null) => void
  defaultLocation?: { lat: number; lng: number } | null
  address?: string
  onAddressGeocode?: (address: string) => void
  error?: string
}

export default function LocationPicker({
  onLocationChange,
  defaultLocation,
  address,
  onAddressGeocode,
  error,
}: LocationPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(
    defaultLocation || defaultCenter
  )
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchAddress, setSearchAddress] = useState(address || "")
  const [geocodeError, setGeocodeError] = useState<string>("")
  const autocompleteRef = useRef<HTMLInputElement>(null)

  // Initialize marker position from defaultLocation or defaultCenter
  useEffect(() => {
    if (defaultLocation) {
      setMarkerPosition(defaultLocation)
      if (map) {
        map.setCenter(defaultLocation)
      }
    }
  }, [defaultLocation, map])

  // Geocode address when searchAddress changes (when user types address)
  const geocodeAddress = useCallback(
    async (addressToGeocode: string) => {
      if (!addressToGeocode.trim() || !window.google?.maps) return

      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: addressToGeocode }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location
          const newPosition = {
            lat: location.lat(),
            lng: location.lng(),
          }
          setMarkerPosition(newPosition)
          onLocationChange(newPosition)
          setGeocodeError("")
          
          if (map) {
            map.setCenter(newPosition)
            map.setZoom(15)
          }
          
          if (onAddressGeocode) {
            onAddressGeocode(addressToGeocode)
          }
        } else {
          setGeocodeError("Could not find this address. Please try a more specific address or drag the marker on the map.")
          onLocationChange(null)
        }
      })
    },
    [map, onLocationChange, onAddressGeocode]
  )

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
    setIsLoaded(true)
  }, [])

  // Handle marker drag end
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPosition = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }
        setMarkerPosition(newPosition)
        onLocationChange(newPosition)
        setGeocodeError("")
      }
    },
    [onLocationChange]
  )

  // Handle autocomplete place selection
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location
        const newPosition = {
          lat: location.lat(),
          lng: location.lng(),
        }
        setMarkerPosition(newPosition)
        onLocationChange(newPosition)
        setGeocodeError("")
        
        // Update search address with formatted address
        const formattedAddress = place.formatted_address || place.name || searchAddress
        setSearchAddress(formattedAddress)
        
        if (onAddressGeocode) {
          onAddressGeocode(formattedAddress)
        }
        
        if (map) {
          map.setCenter(newPosition)
          map.setZoom(15)
        }
      }
    }
  }, [autocomplete, map, onLocationChange, onAddressGeocode, searchAddress])

  // Handle autocomplete load
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  if (!googleMapsApiKey) {
    return (
      <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>
            Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address-search" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Search Address or Drag Marker on Map
            </Label>
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ["address"],
                componentRestrictions: { country: [] }, // Allow all countries, can be restricted if needed
              }}
            >
              <Input
                id="address-search"
                ref={autocompleteRef}
                type="text"
                placeholder="Enter full address (street, city, state, pincode)"
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value)
                  // Debounced geocoding could be added here if needed
                }}
                className="w-full"
              />
            </Autocomplete>
            {geocodeError && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">{geocodeError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Map Location</Label>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={markerPosition}
              zoom={markerPosition === defaultCenter ? 10 : 15}
              onLoad={onMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={onMarkerDragEnd}
                title="Drag to set exact location"
              />
            </GoogleMap>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Donors will be guided to this exact location for blood checkup and donation.
            </p>
          </div>
        </div>
      </LoadScript>

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
