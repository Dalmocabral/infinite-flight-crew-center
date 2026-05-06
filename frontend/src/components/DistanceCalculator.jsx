import React from 'react';

// 1 NM = 1.852 km | 1 km = 0.539957 NM
const KM_TO_NM = 0.539957;

/**
 * Calcula a distância ortodrômica (great-circle) entre dois pontos usando Haversine.
 * Retorna em Milhas Náuticas (NM).
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * KM_TO_NM;
};

/**
 * Estima o tempo de bloco (block time) em Infinite Flight.
 * Considera velocidade média de cruzeiro + overhead de subida/descida/taxi.
 *
 * Velocidades médias de cruzeiro em IF por faixa:
 *   < 150 NM  → voos GA / turboélice locais       ~170 kts + 10 min overhead
 *   150-400 NM → voos regionais (CRJ, E175)        ~290 kts + 20 min overhead
 *   400-800 NM → narrow-body curto (737, A320)     ~360 kts + 30 min overhead
 *   800-2500 NM → narrow/wide médio (737, A330)    ~400 kts + 40 min overhead
 *   > 2500 NM  → wide-body longo alcance (777,787) ~450 kts + 50 min overhead
 */
const calculateFlightTime = (distanceNm) => {
  let speedKnots;
  let overheadMinutes; // Tempo extra para subida + descida + taxi

  if (distanceNm < 150) {
    speedKnots = 170;
    overheadMinutes = 10;
  } else if (distanceNm < 400) {
    speedKnots = 290;
    overheadMinutes = 20;
  } else if (distanceNm < 800) {
    speedKnots = 360;
    overheadMinutes = 30;
  } else if (distanceNm < 2500) {
    speedKnots = 400;
    overheadMinutes = 45;
  } else {
    speedKnots = 450;
    overheadMinutes = 60;
  }

  const cruiseTotalMinutes = (distanceNm / speedKnots) * 60;
  const totalMinutes = Math.round(cruiseTotalMinutes + overheadMinutes);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
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