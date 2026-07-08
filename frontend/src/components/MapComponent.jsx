import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default Leaflet icon paths in React bundle compilers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const MapComponent = ({ lat, lng, setPosition, readOnly = false, markers = [] }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Prevent double initialization
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const defaultLat = parseFloat(lat) || 17.7200;
    const defaultLng = parseFloat(lng) || 83.3150;

    // Create map instance
    mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    // Map tiles from OpenStreetMap (free OSM layer)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Case 1: Multi-marker view (e.g. dashboards)
    if (readOnly && markers && markers.length > 0) {
      const validPoints = [];
      
      markers.forEach(m => {
        const markerLat = parseFloat(m.lat);
        const markerLng = parseFloat(m.lng);
        if (!isNaN(markerLat) && !isNaN(markerLng)) {
          const customMarker = L.marker([markerLat, markerLng]).addTo(mapInstance.current);
          if (m.popupText) {
            customMarker.bindPopup(`
              <div class="text-xs p-1">
                <p class="font-bold text-slate-800">${m.popupText}</p>
                ${m.trackingId ? `<p class="text-primary-600 font-semibold mt-0.5">${m.trackingId}</p>` : ''}
                ${m.status ? `<span class="inline-block px-1.5 py-0.5 rounded-full text-xxs font-bold bg-amber-100 text-amber-800 mt-1">${m.status}</span>` : ''}
              </div>
            `);
          }
          validPoints.push([markerLat, markerLng]);
        }
      });

      if (validPoints.length > 0) {
        mapInstance.current.fitBounds(validPoints, { padding: [30, 30], maxZoom: 15 });
      }
      return;
    }

    // Case 2: Single marker reporting or individual complaint detail view
    const initialLat = isNaN(defaultLat) ? 17.7200 : defaultLat;
    const initialLng = isNaN(defaultLng) ? 83.3150 : defaultLng;

    markerInstance.current = L.marker([initialLat, initialLng], {
      draggable: !readOnly
    }).addTo(mapInstance.current);

    // Set popup if showing single detail
    if (readOnly) {
      markerInstance.current.bindPopup(`<strong class="text-xs">Complaint Location</strong>`).openPopup();
    }

    // Handle marker dragging on report form
    if (!readOnly && setPosition) {
      markerInstance.current.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        setPosition(position.lat, position.lng);
      });

      // Update position on map click
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerInstance.current.setLatLng([lat, lng]);
        setPosition(lat, lng);
      });
    }

    // Cleanup hook
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [readOnly, markers]);

  // Adjust camera and marker position dynamically when GPS locates user
  useEffect(() => {
    const freshLat = parseFloat(lat);
    const freshLng = parseFloat(lng);
    if (!readOnly && mapInstance.current && markerInstance.current && !isNaN(freshLat) && !isNaN(freshLng)) {
      const latlng = new L.LatLng(freshLat, freshLng);
      markerInstance.current.setLatLng(latlng);
      mapInstance.current.setView(latlng, 15);
    }
  }, [lat, lng, readOnly]);

  return (
    <div className="relative w-full h-full min-h-[300px] border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden shadow-inner">
      <div ref={mapRef} className="w-full h-full absolute inset-0 z-10" />
    </div>
  );
};

export default MapComponent;
