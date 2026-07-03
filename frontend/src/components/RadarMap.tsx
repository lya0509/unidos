import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Filter } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored divIcon markers
const sosIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 10px red;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const sosUrgentIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 0 20px red;animation:pulse-urgent 1s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const clinicaIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#06b6d4;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #06b6d4;"></div>`, // Cyan
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const centroIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #3b82f6;"></div>`, // Azul
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const refugioIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#22c55e;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #22c55e;"></div>`, // Verde
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const productorIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#f97316;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #f97316;"></div>`, // Naranja
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const liderIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#a855f7;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #a855f7;"></div>`, // Morado
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const iniciativaCiudadanaIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#eab308;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #eab308;"></div>`, // Amarillo
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const getIconByRole = (tipo: string) => {
  switch (tipo) {
    case 'clinica': return clinicaIcon;
    case 'centro_acopio': return centroIcon;
    case 'refugio': return refugioIcon;
    case 'productor': return productorIcon;
    case 'lider_vecinal': return liderIcon;
    case 'iniciativa_ciudadana': return iniciativaCiudadanaIcon;
    default: return centroIcon;
  }
};

const getRoleName = (tipo: string) => {
  switch (tipo) {
    case 'clinica': return 'Clínica';
    case 'centro_acopio': return 'Centro de Acopio';
    case 'refugio': return 'Refugio';
    case 'productor': return 'Productor';
    case 'lider_vecinal': return 'Líder Vecinal';
    case 'iniciativa_ciudadana': return 'Iniciativa Ciudadana';
    default: return 'Usuario';
  }
};

const getRoleColor = (tipo: string) => {
  switch (tipo) {
    case 'clinica': return 'text-cyan-500';
    case 'centro_acopio': return 'text-blue-500';
    case 'refugio': return 'text-green-500';
    case 'productor': return 'text-orange-500';
    case 'lider_vecinal': return 'text-purple-500';
    case 'iniciativa_ciudadana': return 'text-yellow-500';
    default: return 'text-blue-500';
  }
};

const getRoleHex = (tipo: string) => {
  switch (tipo) {
    case 'clinica': return '#06b6d4';
    case 'centro_acopio': return '#3b82f6';
    case 'refugio': return '#22c55e';
    case 'productor': return '#f97316';
    case 'lider_vecinal': return '#a855f7';
    case 'iniciativa_ciudadana': return '#eab308';
    default: return '#3b82f6';
  }
};

// Coordenadas fijas para centrado de estados de Venezuela
const ZONA_COORDINATES: Record<string, [number, number]> = {
  'nacional': [10.4806, -66.9036],
  'toda venezuela': [10.4806, -66.9036],
  'caracas': [10.4806, -66.9036],
  'distrito capital': [10.4806, -66.9036],
  'miranda': [10.2372, -66.3534],
  'la guaira': [10.5985, -66.9463],
  'vargas': [10.5985, -66.9463],
  'aragua': [10.2354, -67.5911],
  'carabobo': [10.1650, -68.0009],
  'zulia': [10.6427, -71.6131],
  'lara': [10.0678, -69.3474],
  'anzoátegui': [9.3243, -64.4883],
  'anzoategui': [9.3243, -64.4883],
  'bolívar': [8.1215, -63.5413],
  'bolivar': [8.1215, -63.5413],
  'táchira': [7.7663, -72.2235],
  'tachira': [7.7663, -72.2235],
  'mérida': [8.5983, -71.1446],
  'merida': [8.5983, -71.1446],
  'falcón': [11.4116, -69.6738],
  'falcon': [11.4116, -69.6738],
  'sucre': [10.4533, -63.7663],
  'monagas': [9.7423, -63.1764],
  'barinas': [8.6226, -70.2076],
  'apure': [7.8891, -67.4724],
  'guárico': [8.9189, -66.8994],
  'guarico': [8.9189, -66.8994],
  'cojedes': [9.6548, -68.5878],
  'portuguesa': [9.0556, -69.2556],
  'yaracuy': [10.2974, -68.7391],
  'nueva esparta': [10.9971, -63.9113],
};

// Component to recenter map
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

interface RadarMapProps {
  filtroZona?: string;
  centros?: any[];
}

export const RadarMap: React.FC<RadarMapProps> = ({ filtroZona, centros = [] }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [sosList, setSosList] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.4806, -66.9036]); // Default Caracas
  const [reportingId, setReportingId] = useState<string | null>(null);

  // Local filtering states for the map itself
  const [mapFilterType, setMapFilterType] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const handleReport = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de reportar este perfil como falso? A los 5 reportes será suspendido.')) return;
    
    setReportingId(userId);
    try {
      const res = await api.post(`/auth/reportar/${userId}`);
      alert(`Perfil reportado. Total de reportes: ${res.data.reportes}`);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al reportar');
    } finally {
      setReportingId(null);
    }
  };
  
  const isDark = theme === 'dark' || theme === 'battery-saver';
  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Centrar automáticamente cuando cambia el filtro de zona
  useEffect(() => {
    if (filtroZona) {
      if (filtroZona.includes('||')) {
        const parts = filtroZona.split('||');
        const lat = parseFloat(parts[1]);
        const lng = parseFloat(parts[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          return;
        }
      }
      
      const clean = filtroZona.trim().toLowerCase();
      if (ZONA_COORDINATES[clean]) {
        setMapCenter(ZONA_COORDINATES[clean]);
      } else {
        const match = Object.keys(ZONA_COORDINATES).find(k => clean.includes(k) || k.includes(clean));
        if (match) {
          setMapCenter(ZONA_COORDINATES[match]);
        }
      }
    }
  }, [filtroZona]);
    
  useEffect(() => {
    const fetchData = async () => {
      try {
        const zonaParam = filtroZona || user?.zona_operacion || '';
        const [sosRes, centersRes] = await Promise.all([
          api.get(`/sos/feed?zona=${zonaParam}`),
          api.get(`/auth/centros-mapa?zona=${zonaParam}`)
        ]);
        
        let centerLat = 10.4806;
        let centerLon = -66.9036;

        if (user?.zona_operacion) {
           const parts = user.zona_operacion.split('||');
           if (parts.length >= 3) {
             const latVal = parseFloat(parts[1]);
             const lonVal = parseFloat(parts[2]);
             if (!isNaN(latVal) && !isNaN(lonVal)) {
               centerLat = latVal;
               centerLon = lonVal;
               setMapCenter([centerLat, centerLon]);
             }
           } else {
             try {
               const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(user.zona_operacion + ', Venezuela')}&format=json`);
               const nomData = await nomRes.json();
                if (nomData && nomData.length > 0) {
                  const latVal = parseFloat(nomData[0].lat);
                  const lonVal = parseFloat(nomData[0].lon);
                  if (!isNaN(latVal) && !isNaN(lonVal)) {
                    centerLat = latVal;
                    centerLon = lonVal;
                    setMapCenter([centerLat, centerLon]);
                  }
                }
             } catch (e) {
               console.error("Error geocoding zone", e);
             }
           }
        }
        
        const getOffset = (id: string, salt: string) => {
          let hash = 0;
          const str = String(id) + salt;
          for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
          return (Math.abs(hash % 1000) / 1000.0 - 0.5) * 0.02;
        };
        
        const sosData = sosRes.data.map((sos: any) => {
          const isUrgent = sos.descripcion?.startsWith('[URGENTE]') || sos.urgente || sos.insumo_solicitado?.toLowerCase().includes('urgente');
          let lat = sos.latitud;
          let lon = sos.longitud;

          if (!lat && sos.usuarios?.zona_operacion?.includes('||')) {
            const parts = sos.usuarios.zona_operacion.split('||');
            lat = parseFloat(parts[1]);
            lon = parseFloat(parts[2]);
          } else if (!lat && sos.zona?.includes('||')) {
            const parts = sos.zona.split('||');
            lat = parseFloat(parts[1]);
            lon = parseFloat(parts[2]);
          }

          return {
            ...sos,
            isUrgent,
            lat: lat || centerLat + getOffset(sos.id, 'lat'),
            lon: lon || centerLon + getOffset(sos.id, 'lon')
          };
        });
        
        const centersData = centersRes.data.map((c: any) => {
          let lat = c.latitud;
          let lon = c.longitud;
          
          if (!lat && c.zona?.includes('||')) {
            const parts = c.zona.split('||');
            lat = parseFloat(parts[1]);
            lon = parseFloat(parts[2]);
          }

          return {
            ...c,
            lat: lat || centerLat + getOffset(c.id, 'lat'),
            lon: lon || centerLon + getOffset(c.id, 'lon')
          };
        });
        
        setSosList(sosData);
        setCenters(centersData);
      } catch (err) {
        console.error("Error fetching map data", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user, filtroZona]);

  // Apply map filters and remove invalid/NaN coordinates to prevent Leaflet crashes
  const filteredSosList = (mapFilterType === 'todos' || mapFilterType === 'sos' ? sosList : [])
    .filter(sos => typeof sos.lat === 'number' && !isNaN(sos.lat) && typeof sos.lon === 'number' && !isNaN(sos.lon));
    
  const filteredCenters = (mapFilterType === 'todos' ? centers : centers.filter(c => c.tipo === mapFilterType))
    .filter(c => typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lon === 'number' && !isNaN(c.lon));

  return (
    <div className="w-full h-[60vh] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.15)] border border-blue-500/30 relative z-0 isolate">
      {/* Inject pulse animation keyframes */}
      <style>{`
        @keyframes pulse-urgent {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>

      {/* Title & Filter Button */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700">
          <p className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Mapas de Ayuda
          </p>
        </div>
        
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-bold uppercase transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtrar: {mapFilterType === 'todos' ? 'Ver Todo' : mapFilterType.replace('_', ' ')}
          </button>
          
          {showFilters && (
            <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-2 w-48">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mostrar en mapa:</span>
              {[
                { id: 'todos', label: 'Ver Todo' },
                { id: 'sos', label: 'Solo SOS' },
                { id: 'clinica', label: 'Clínicas' },
                { id: 'centro_acopio', label: 'Centros de Acopio' },
                { id: 'refugio', label: 'Refugios' },
                { id: 'productor', label: 'Productores' },
                { id: 'lider_vecinal', label: 'Líderes' },
                { id: 'iniciativa_ciudadana', label: 'Iniciativas' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setMapFilterType(opt.id);
                    setShowFilters(false);
                  }}
                  className={`text-left px-2 py-1.5 rounded text-xs font-bold transition-colors ${
                    mapFilterType === opt.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
        zoomControl={false}
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {/* Draw SOS Alerts */}
        {filteredSosList.map(sos => (
          <Marker 
            key={sos.id} 
            position={[sos.lat, sos.lon]} 
            icon={sos.isUrgent ? sosUrgentIcon : sosIcon}
          >
            <Popup className="tactical-popup">
              <div className="p-1">
                <h4 className="font-black text-red-600 uppercase text-xs tracking-wider mb-1">
                  {sos.isUrgent ? '🚨 URGENTE' : '⚠️ SOS'}
                </h4>
                <p className="text-xs font-bold mb-1">{sos.usuarios?.nombre || 'Usuario'}</p>
                <p className="text-xs text-slate-600 mb-2">
                  {sos.isUrgent && sos.descripcion?.startsWith('[URGENTE]') ? sos.descripcion.replace('[URGENTE] ', '') : sos.descripcion}
                </p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${sos.lat},${sos.lon}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-bold text-[10px] uppercase py-1 rounded border border-blue-500/30"
                >
                  📍 Abrir en Google Maps
                </a>
                {sos.solicitante_id && sos.solicitante_id !== user?.id && (
                  <button 
                    onClick={() => handleReport(sos.solicitante_id)}
                    disabled={reportingId === sos.solicitante_id}
                    className="block text-center w-full mt-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 font-bold text-[10px] uppercase py-1 rounded border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    ⚠️ Reportar Perfil
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Draw Other Permanent Users */}
        {filteredCenters.map((c, idx) => {
          const hasActiveSos = sosList.some(sos => sos.emisor_id === c.id || sos.solicitante_id === c.id);
          const iconToUse = hasActiveSos ? L.divIcon({
            className: '',
            html: `<div style="width:18px;height:18px;background:${getRoleHex(c.tipo)};border-radius:50%;border:3px solid white;box-shadow:0 0 20px ${getRoleHex(c.tipo)};animation:pulse-urgent 1s infinite;"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          }) : getIconByRole(c.tipo);

          return (
            <Marker 
              key={`center-${idx}`} 
              position={[c.lat, c.lon]} 
              icon={iconToUse}
            >
            <Popup>
              <div className="p-1">
                <h4 className={`font-black uppercase text-xs tracking-wider mb-1 ${getRoleColor(c.tipo)}`}>
                  {getRoleName(c.tipo)}
                </h4>
                <p className="text-xs font-bold mb-1">{c.nombre}</p>
                {c.zona && <p className="text-xs text-slate-600 font-bold mb-2">📍 {c.zona}</p>}
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lon}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-bold text-[10px] uppercase py-1 rounded border border-blue-500/30"
                >
                  📍 Abrir ubicación
                </a>
                {c.id && c.id !== user?.id && (
                  <button 
                    onClick={() => handleReport(c.id)}
                    disabled={reportingId === c.id}
                    className="block text-center w-full mt-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 font-bold text-[10px] uppercase py-1 rounded border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    ⚠️ Reportar Perfil
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5">🔴 SOS Activo</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span> Clínica</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Centro de Acopio</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> Refugio</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Productor</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Líder Vecinal</span>
          <span className="text-[10px] font-bold text-white flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#eab308]"></span> Iniciativa Ciudadana</span>
        </div>
      </div>
    </div>
  );
};
