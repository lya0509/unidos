import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin } from 'lucide-react'

// Fix for default marker icons in React Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LocationPickerMapProps {
  initialLat: number
  initialLon: number
  onLocationSelected: (zone: string, lat: number, lon: number) => void
  onClose: () => void
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ initialLat, initialLon, onLocationSelected, onClose }) => {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(initialLat, initialLon))
  const [zoneName, setZoneName] = useState<string>('Cargando...')
  const [searchInput, setSearchInput] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLon])
  
  const fetchZoneName = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      const data = await res.json()
      let local = 'Zona desconocida';
      if (data.display_name) {
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        local = parts[0];
        if (/^\d+$/.test(local) && parts.length > 1) {
          local = `${parts[0]} ${parts[1]}`; // Si empieza con número de casa, incluye la calle
        }
      }
      
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      const state = data.address?.state || '';
      let detected = city && local !== 'Zona desconocida' && !local.includes(city) ? `${local}, ${city}` : (local !== 'Zona desconocida' ? local : city || 'Zona desconocida');
      
      // Agregar el estado para que los filtros nacionales por estado funcionen
      if (state && !detected.includes(state)) {
        detected = `${detected}, ${state}`;
      }
      
      setZoneName(detected)
    } catch (err) {
      setZoneName('No se pudo identificar la zona')
    }
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput + ', Venezuela')}&format=json`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setPosition(new L.LatLng(lat, lon))
        setMapCenter([lat, lon])
        fetchZoneName(lat, lon)
      } else {
        alert("Lugar no encontrado")
      }
    } catch {
      console.error("Geocoding failed")
    }
  }

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setZoneName('Detectando tu ubicación exacta...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          setPosition(new L.LatLng(lat, lon))
          setMapCenter([lat, lon])
          fetchZoneName(lat, lon)
        },
        () => {
          alert('No se pudo obtener tu ubicación. Por favor, asegúrate de haber díado los permisos necesarios en tu navegador.')
          setZoneName('Permiso de ubicación denegado')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      alert('Tu navegador no soporta geolocalización.')
    }
  }

  useEffect(() => {
    fetchZoneName(initialLat, initialLon)
  }, [initialLat, initialLon])

  const markerRef = useRef<L.Marker>(null)

  const handleDragEnd = () => {
    const marker = markerRef.current
    if (marker != null) {
      const newPos = marker.getLatLng()
      setPosition(newPos)
      setZoneName('Buscando...')
      fetchZoneName(newPos.lat, newPos.lng)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Ajusta tu ubicación</h3>
            <p className="text-xs text-slate-500">Arrastra el pin o busca tu zona</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">
            ✕
          </button>
        </div>
        
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={handleGeolocation}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
            title="Usar mi ubicación actual"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <input 
            type="text"
            placeholder="Ej: Castillejo, Guatire..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="h-[300px] w-full relative z-0">
          <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <MapUpdater center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker 
              draggable={true}
              eventHandlers={{
                dragend: handleDragEnd,
              }}
              position={position}
              ref={markerRef}
            >
            </Marker>
          </MapContainer>
        </div>
        
        <div className="p-5 bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Zona detectada en el pin (puedes editarla manual):</p>
          <input 
            type="text" 
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className="w-full font-black text-xl text-slate-800 dark:text-white mb-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => onLocationSelected(zoneName, position.lat, position.lng)}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              Confirmar Zona
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

