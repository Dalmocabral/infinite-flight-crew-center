import React from 'react';

// 1 NM = 1.852 km
const KM_TO_NM = 0.539957;

/**
 * Calcula a distância ortodrômica (great-circle) entre dois pontos usando a fórmula de Haversine.
 * Retorna a distância em Milhas Náuticas (NM).
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm * KM_TO_NM; // Converte para Milhas Náuticas
};

/**
 * Estima o tempo de voo com base na distância em NM.
 * Usa velocidades médias de cruzeiro realistas em knots.
 */
const calculateFlightTime = (distanceNm) => {
  let speedKnots;
  if (distanceNm < 200) {
    speedKnots = 250; // Voos muito curtos (turboélice / jato regional)
  } else if (distanceNm < 600) {
    speedKnots = 380; // Voos curtos (narrow-body)
  } else if (distanceNm < 2000) {
    speedKnots = 450; // Voos médios (narrow/wide-body)
  } else {
    speedKnots = 480; // Voos longos (wide-body de longo alcance)
  }

  const flightTimeHours = distanceNm / speedKnots;
  const hours = Math.floor(flightTimeHours);
  const minutes = Math.round((flightTimeHours - hours) * 60);

  return `${hours}h ${minutes}m`;
};

const DistanceCalculator = ({ fromAirport, toAirport, airportsData, showTime = false }) => {
  if (!fromAirport || !toAirport || !airportsData[fromAirport] || !airportsData[toAirport]) {
    return <span>N/A</span>;
  }

  const from = airportsData[fromAirport];
  const to = airportsData[toAirport];
  const distanceNm = calculateDistance(from.lat, from.lon, to.lat, to.lon);

  if (showTime) {
    return <span>{calculateFlightTime(distanceNm)}</span>;
  }

  return <span>{distanceNm.toFixed(0)} NM</span>;
};

export default DistanceCalculator;