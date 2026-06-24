import { Box, FormControl, MenuItem, Paper, Select, Typography, FormControlLabel, Switch } from "@mui/material";
import L from "leaflet";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import airplaneUserIcon from "../assets/image/airplane_user.png";
import ApiService from "../components/ApiService";
import AxiosInstance from "../components/AxiosInstance";


const fixAntimeridian = (latlngs) => {
  if (!latlngs || latlngs.length < 2) return latlngs;
  const fixed = [[latlngs[0][0], latlngs[0][1]]];
  for (let i = 1; i < latlngs.length; i++) {
    let prevLon = fixed[i-1][1];
    let currLon = latlngs[i][1];
    let diff = currLon - prevLon;
    
    if (diff > 180) {
      currLon -= 360;
    } else if (diff < -180) {
      currLon += 360;
    }
    fixed.push([latlngs[i][0], currLon]);
  }
  return fixed;
};

const MapWithFlights = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(
    localStorage.getItem("lastSession") || ""
  );

  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null); 
  const [isIdle, setIsIdle] = useState(false);
  const [vaUsernames, setVaUsernames] = useState([]);
  const [showOnlyVA, setShowOnlyVA] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersLayer = useRef(null);
  const tileLayer = useRef(null);
  const polylineLayer = useRef(null); 
  const routeLayer = useRef(null); 
  const lastActivityRef = useRef(Date.now());

  // Idle detection logic
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    const idleCheckInterval = setInterval(() => {
      // 15 minutes of inactivity
      if (Date.now() - lastActivityRef.current > 15 * 60 * 1000) {
        setIsIdle(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(idleCheckInterval);
    };
  }, [isIdle]);

  useEffect(() => {
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
          zoomControl: false 
      }).setView([-12.1632, -53.5151], 3);

      L.control.zoom({
          position: 'bottomright'
      }).addTo(map.current);

      tileLayer.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", 
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      ).addTo(map.current);

      markersLayer.current = L.layerGroup().addTo(map.current);
      polylineLayer.current = L.layerGroup().addTo(map.current); 
      routeLayer.current = L.layerGroup().addTo(map.current); 
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchVaUsers = async () => {
      try {
        const response = await AxiosInstance.get('/users/');
        const usernames = response.data.map(u => u.usernameIFC).filter(Boolean);
        setVaUsernames(usernames);
      } catch (error) {
        console.error('Error fetching VA users:', error);
      }
    };
    fetchVaUsers();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
        try {
            const data = await ApiService.getSessions();
            setAvailableSessions(data);
            // If no session selected or last session not found, pick the first one (usually Expert)
            if (!selectedSession || !data.find(s => s.id === selectedSession)) {
                const expert = data.find(s => s.name.toLowerCase().includes('expert')) || data[0];
                if (expert) {
                    setSelectedSession(expert.id);
                }
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (isIdle) return; // Suspende o polling se inativo

    const fetchFlights = async () => {
      if (!selectedSession) return;
      try {
        const data = await ApiService.getFlightData(selectedSession);
        console.log(`DEBUG MAP: Fetched ${data.length} flights for session ${selectedSession}`);
        if (showOnlyVA) {
          if (vaUsernames.length > 0) {
            const filteredData = data.filter(flight => vaUsernames.includes(flight.username));
            setFlights(filteredData);
          } else {
            setFlights([]);
          }
        } else {
          setFlights(data);
        }
      } catch (error) {
        console.error("Error fetching flight data:", error);
      }
    };

    fetchFlights(); 
    // Mínimo de 15 segundos para /flights
    const interval = setInterval(fetchFlights, 15000); 

    return () => clearInterval(interval); 
  }, [selectedSession, isIdle, vaUsernames, showOnlyVA]);

  useEffect(() => {
    if (!map.current || !markersLayer.current) return;

    markersLayer.current.clearLayers(); 

    flights.forEach((flight) => {
      if (!flight.latitude || !flight.longitude || flight.heading === undefined) return;

      const marker = createRotatedMarker(flight);
      marker.addTo(markersLayer.current);

      marker.on("click", async () => {
        setSelectedFlight(flight); 

        const route = await ApiService.getRoute(selectedSession, flight.flightId);
        if (route) {
          let coordinates = route.map((point) => [point.latitude, point.longitude]);
          coordinates = fixAntimeridian(coordinates);

          if (routeLayer.current) {
            routeLayer.current.clearLayers();
            L.polyline(coordinates, {
              color: "#4dabf5", 
              weight: 2,
              dashArray: "5, 10", 
            }).addTo(routeLayer.current);
          }
        }

        const flightPlan = await fetchFlightPlan(flight.flightId);
        if (flightPlan) {
          let fpCoordinates = [
            [flightPlan.origin.lat, flightPlan.origin.lon], 
            [flight.latitude, flight.longitude], 
            [flightPlan.destination.lat, flightPlan.destination.lon], 
          ];
          fpCoordinates = fixAntimeridian(fpCoordinates);
          const polyline = L.polyline(fpCoordinates, { color: "#f50057", weight: 2 });
          if (polylineLayer.current) {
            polylineLayer.current.clearLayers();
            polyline.addTo(polylineLayer.current);
          }
        }
      });
    });
  }, [flights, selectedSession]);

  const createRotatedMarker = (flight) => {
    const airplaneIcon = L.icon({
      iconUrl: airplaneUserIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const marker = L.marker([flight.latitude, flight.longitude], {
      icon: airplaneIcon,
      rotationAngle: flight.heading, 
      rotationOrigin: "center",
    }).bindPopup(`
      <div style="color: black">
        <b>${flight.username}</b><br>
        Callsign: ${flight.callsign}<br>
        Altitude: ${flight.altitude.toFixed(0)} ft
      </div>
    `);

    return marker;
  };

  const fetchFlightPlan = async (flightId) => {
    try {
      const data = await ApiService.getFlightPlan(selectedSession, flightId);
      const flightPlanData = data.result.flightPlanItems;

      const validItems = flightPlanData.filter(
        (item) => item.location.latitude !== 0 && item.location.longitude !== 0
      );
    
      if(validItems.length < 2) return null;

      const origin = validItems[0];
      const destination = validItems[validItems.length - 1];

      return {
        origin: {
          lat: origin.location.latitude,
          lon: origin.location.longitude,
        },
        destination: {
          lat: destination.location.latitude,
          lon: destination.location.longitude,
        },
      };
    } catch (error) {
      console.error("Error fetching flight plan data:", error);
      return null;
    }
  };

  return (
    <Box sx={{ 
        width: "calc(100% + 64px)", // Negate Layout padding (md: 4 = 32px each side)
        height: "calc(100vh - 64px)", 
        position: "relative",
        margin: "-32px -32px", // Pull the map to the edges
        overflow: "hidden"
    }}>
        
      {/* Floating Control Panel */}
      <Paper 
        sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            p: 2,
            backgroundColor: 'rgba(10, 25, 41, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            minWidth: 200
        }}
        elevation={10}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block' }}>
            SELECT SERVER
        </Typography>
         <FormControl fullWidth size="small">
            <Select
                value={selectedSession}
                onChange={(e) => {
                    const sessionId = e.target.value;
                    setSelectedSession(sessionId); 
                    localStorage.setItem("lastSession", sessionId); 
                }}
                sx={{ color: 'white', borderColor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
            >
             {availableSessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                    {session.name}
                </MenuItem>
              ))}
            </Select>
         </FormControl>


         {isIdle && (
            <Typography variant="caption" sx={{ color: 'red', mt: 2, display: 'block' }}>
              Inactive. Updates paused. Move the mouse to resume.
            </Typography>
         )}
      </Paper>

      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
};

export default MapWithFlights;