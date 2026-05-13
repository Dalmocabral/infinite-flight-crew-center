import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícones personalizados para o Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Função para calcular a distância entre dois pontos (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.539957; // Converte km para milhas náuticas (nm)
};

const FlightMap = ({ flightLegs, airportsData }) => {
  const mapContainer = useRef(null); // Referência para o contêiner do mapa
  const map = useRef(null); // Referência para a instância do mapa

  useEffect(() => {
    if (flightLegs.length > 0 && Object.keys(airportsData).length > 0 && !map.current) {
      // Inicializa o mapa
      map.current = L.map(mapContainer.current).setView([0, 0], 2);

      // Adiciona a camada de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map.current);

      // Adiciona marcadores e polylines
      flightLegs.forEach((leg) => {
        const fromAirport = airportsData[leg.from_airport];
        const toAirport = airportsData[leg.to_airport];

        if (fromAirport && toAirport) {
          // Adiciona marcadores
          L.marker([fromAirport.lat, fromAirport.lon], { icon })
            .addTo(map.current)
            .bindPopup(`<strong>${fromAirport.icao}</strong>`);

          L.marker([toAirport.lat, toAirport.lon], { icon })
            .addTo(map.current)
            .bindPopup(`<strong>${toAirport.icao}</strong>`);

          // Adiciona polyline
          L.polyline(
            [
              [fromAirport.lat, fromAirport.lon],
              [toAirport.lat, toAirport.lon],
            ],
            { color: leg.pirep_status === 'Approved' ? 'green' : 'black' }
          ).addTo(map.current);

          // Calcula a distância
          const distance = calculateDistance(
            fromAirport.lat,
            fromAirport.lon,
            toAirport.lat,
            toAirport.lon
          );
          leg.distance = `${distance.toFixed(0)} NM`; // Atualiza a distância na leg
        }
      });

      // Ajusta o zoom e o centro do mapa para incluir todos os marcadores
      const bounds = L.latLngBounds(
        flightLegs
          .map((leg) => {
            const fromAirport = airportsData[leg.from_airport];
            const toAirport = airportsData[leg.to_airport];
            return [
              [fromAirport?.lat, fromAirport?.lon],
              [toAirport?.lat, toAirport?.lon],
            ];
          })
          .flat()
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Limpeza ao desmontar o componente
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [flightLegs, airportsData]);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};

export default FlightMap;