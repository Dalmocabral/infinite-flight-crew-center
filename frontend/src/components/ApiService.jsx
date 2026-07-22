import axios from 'axios';

const API_KEY = '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4';
const BASE_URL = 'https://api.infiniteflight.com/public/v2';

const cache = new Map();

async function getCached(key, ttlMs, fetchFn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttlMs) {
    return entry.data;
  }
  try {
    const data = await fetchFn();
    cache.set(key, { data, time: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${key}:`, error);
    if (entry) {
      console.warn(`Returning stale data for ${key} due to fetch error.`);
      return entry.data;
    }
    throw error;
  }
}

// TTL in milliseconds (based on Infinite Flight API requirements)
const TTL = {
  sessions: 10 * 60 * 1000, // 10 min
  flights: 15 * 1000,       // 15 sec
  airports: 60 * 60 * 1000, // 60 min
  users: 5 * 60 * 1000,     // 5 min
};

const ApiService = {
  getSessions: () => {
    return getCached('all_sessions', TTL.sessions, async () => {
      const response = await axios.get(`${BASE_URL}/sessions?apikey=${API_KEY}`);
      return response.data.result || [];
    });
  },

  getSessionData: (sessionId) => {
    return getCached(`session_${sessionId}`, TTL.sessions, async () => {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}?apikey=${API_KEY}`);
      return response.data.result;
    });
  },

  getFlightData: (sessionId) => {
    return getCached(`flights_${sessionId}`, TTL.flights, async () => {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights?apikey=${API_KEY}`);
      return response.data.result;
    });
  },

  getAirportData: (sessionId) => {
    return getCached(`airports_${sessionId}`, TTL.airports, async () => {
      const response = await axios.get(`${BASE_URL}/world/status/${sessionId}?apikey=${API_KEY}`);
      return response.data.result;
    });
  },

  getAtcData: (sessionId) => {
    return getCached(`atc_${sessionId}`, TTL.flights, async () => {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/atc?apikey=${API_KEY}`);
      return response.data.result.filter(atc => atc.airportName && atc.type !== null);
    });
  },

  getFlightPlan: (sessionId, flightId) => {
    return getCached(`flightplan_${flightId}`, TTL.flights, async () => {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights/${flightId}/flightplan?apikey=${API_KEY}`);
      return response.data;
    });
  },

  userStatus: (userId) => {
    return getCached(`user_${userId}`, TTL.users, async () => {
      const parameters = { userIds: [userId] };
      const headers = { "Content-type": "application/json", Accept: "text/plain" };
      const url = `${BASE_URL}/users?apikey=${API_KEY}`;
      const response = await axios.post(url, parameters, { headers });
      if (response.data.result && response.data.result.length > 0) {
        return response.data.result[0];
      }
      return null;
    });
  },

  userStatusByUsername: (username) => {
    return getCached(`user_name_${username}`, TTL.users, async () => {
      const parameters = { discourseNames: [username] };
      const headers = { "Content-type": "application/json", Accept: "text/plain" };
      const url = `${BASE_URL}/users?apikey=${API_KEY}`;
      const response = await axios.post(url, parameters, { headers });
      if (response.data.result && response.data.result.length > 0) {
        return response.data.result[0];
      }
      return null;
    });
  },

  getRoute: (sessionId, flightId) => {
    return getCached(`route_${flightId}`, TTL.flights, async () => {
      const url = `${BASE_URL}/sessions/${sessionId}/flights/${flightId}/route?apikey=${API_KEY}`;
      const response = await axios.get(url);
      return response.data.result;
    });
  },

  getAirplaneLogoData: async () => {
    return getCached('airplane_logo', TTL.airports, async () => {
      const url = 'https://raw.githubusercontent.com/Dalmocabral/logo_airplane_if_json/refs/heads/main/logo_aiplane_if_json';
      const response = await axios.get(url);
      return response.data;
    });
  },

  getUserFlights: (userId) => {
    return getCached(`user_flights_100_${userId}`, TTL.flights, async () => {
      const response = await axios.get(`${BASE_URL}/users/${userId}/flights?apikey=${API_KEY}&pageSize=100`);
      if (response.data.result && response.data.result.data) {
        return response.data.result.data;
      }
      return [];
    });
  },
  
  getAircraftList: () => {
    return getCached('if_aircraft_list', TTL.airports, async () => {
      const response = await axios.get(`${BASE_URL}/aircraft?apikey=${API_KEY}`);
      return response.data.result || [];
    });
  },

  getAircraftLiveries: () => {
    return getCached('if_aircraft_liveries', TTL.airports, async () => {
      const response = await axios.get(`${BASE_URL}/aircraft/liveries?apikey=${API_KEY}`);
      return response.data.result || [];
    });
  },
};

export default ApiService;
