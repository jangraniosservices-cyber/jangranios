import React, { useState } from 'react';
import { APIProvider, AdvancedMarker, InfoWindow, Map as GoogleMap, Pin } from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';

interface GoogleMapsLocationProps {
  apiKey: string;
  businessName: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

export const GoogleMapsLocation: React.FC<GoogleMapsLocationProps> = ({
  apiKey,
  businessName,
  address,
  phone,
  lat,
  lng,
}) => {
  const [infoOpen, setInfoOpen] = useState(true);
  const position = { lat: lat || 28.4704, lng: lng || 77.0437 };
  const resolvedKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${businessName}, ${address}`
  )}`;

  if (!resolvedKey) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between min-h-[340px]">
        <div className="space-y-3">
          <div className="w-11 h-11 rounded-lg bg-[#0F2557] text-amber-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#0F2557]">{businessName}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{address}</p>
          <p className="text-xs font-mono-tabular text-slate-500">
            Coordinates: {position.lat.toFixed(4)}° N, {position.lng.toFixed(4)}° E
          </p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-sm font-semibold transition-colors w-fit mt-4"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <div className="h-[340px] w-full">
        <APIProvider apiKey={resolvedKey} language="en" region="IN">
          <GoogleMap
            defaultCenter={position}
            defaultZoom={15}
            mapId="DEMO_MAP_ID"
            gestureHandling="cooperative"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={position} onClick={() => setInfoOpen(true)} title={businessName}>
              <Pin background="#0F2557" borderColor="#F59E0B" glyphColor="#F59E0B" />
            </AdvancedMarker>
            {infoOpen && (
              <InfoWindow position={position} onCloseClick={() => setInfoOpen(false)}>
                <div className="p-1 max-w-[220px] text-slate-900">
                  <p className="font-bold text-sm text-[#0F2557]">{businessName}</p>
                  <p className="text-xs text-slate-600 mt-1">{address}</p>
                  <p className="text-xs font-semibold text-[#EA580C] mt-1">{phone}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-600">{address}</span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2557] hover:text-[#EA580C]"
        >
          <span>Get Directions</span>
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
};
