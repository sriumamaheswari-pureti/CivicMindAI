export const GVMC_ZONES = [
  { name: "Bheemunipatnam Zone", lat: 17.8900, lng: 83.4450, code: "Z1" },
  { name: "Madhurawada Zone", lat: 17.7980, lng: 83.3440, code: "Z2" },
  { name: "East Zone", lat: 17.7200, lng: 83.3150, code: "Z3" },
  { name: "North Zone", lat: 17.7400, lng: 83.2900, code: "Z4" },
  { name: "South Zone", lat: 17.6900, lng: 83.2900, code: "Z5" },
  { name: "West Zone", lat: 17.7200, lng: 83.2500, code: "Z6" },
  { name: "Pendurthi Zone", lat: 17.7800, lng: 83.1800, code: "Z7" },
  { name: "Gajuwaka Zone", lat: 17.6900, lng: 83.2100, code: "Z8" },
  { name: "Aganampudi Zone", lat: 17.6500, lng: 83.1300, code: "Z9" },
  { name: "Anakapalli Zone", lat: 17.6890, lng: 83.0020, code: "Z10" }
];

export const detectZone = (lat, lng) => {
  if (!lat || !lng) return GVMC_ZONES[2]; // Default East Zone
  
  let nearestZone = GVMC_ZONES[2];
  let minDistance = Infinity;

  const toRad = (value) => (value * Math.PI) / 180;

  GVMC_ZONES.forEach(zone => {
    const dLat = toRad(zone.lat - lat);
    const dLng = toRad(zone.lng - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(zone.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km

    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone;
    }
  });

  return nearestZone;
};
