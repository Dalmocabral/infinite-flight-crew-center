import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { Box, CardContent, Container, Divider, Grid, IconButton, Paper, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import ApiService from '../components/ApiService';
import { Tooltip } from '@mui/material';

const renderLogo = (liveryId, logoData, icao = null) => {
    if (!logoData || !Array.isArray(logoData)) return null;
    
    // Tenta pelo Livery ID primeiro
    let match = liveryId ? logoData.find(item => item.LiveryId && item.LiveryId.toLowerCase() === liveryId.toLowerCase()) : null;
    
    // Se não achou, tenta pelo ICAO
    if (!match && icao) {
        match = logoData.find(item => item.Icao && item.Icao.toUpperCase() === icao.toUpperCase());
    }

    if (match && match.Logo) {
        return (
            <img 
                src={match.Logo} 
                alt="Airline Logo" 
                style={{ width: '32px', height: '32px', marginBottom: '8px', objectFit: 'contain' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }

    // Logo padrão
    return (
        <img 
            src="https://cdn.radarbox.com/airlines/sq/NO.png" 
            alt="Default Logo" 
            style={{ width: '32px', height: '32px', marginBottom: '8px', objectFit: 'contain', opacity: 0.7 }} 
        />
    );
};

const renderFlag = (icao, airportsData) => {
    if (!icao || !airportsData || !airportsData[icao]?.country) return null;
    const country = airportsData[icao].country;
    return (
        <Tooltip title={country}>
            <img 
                src={`https://flagcdn.com/w320/${country.toLowerCase()}.png`} 
                alt={country} 
                style={{ width: '20px', borderRadius: '3px', verticalAlign: 'middle' }} 
            />
        </Tooltip>
    );
};

const Briefing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flightData, setFlightData] = useState(null);
  const [logoData, setLogoData] = useState([]);
  const [airportsData, setAirportsData] = useState({});
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const fetchFlightDetails = async () => {
      try {
        const response = await AxiosInstance.get(`/pirepsflight/${id}/`);
        setFlightData(response.data);
      } catch (error) {
        console.error('Error fetching flight details:', error);
      }
    };

    fetchFlightDetails();
    fetchLogos();
    fetchAirports();
  }, [id]);

  const fetchLogos = async () => {
    try {
        const data = await ApiService.getAirplaneLogoData();
        setLogoData(data);
    } catch (err) {
        console.error('Error fetching logos:', err);
    }
  };

  const fetchAirports = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/Dalmocabral/Airport/refs/heads/master/airports.json'
      );
      const data = await response.json();
      setAirportsData(data);
    } catch (error) {
      console.error('Erro ao buscar dados dos aeroportos:', error);
    }
  };

  useEffect(() => {
    if (flightData && !map.current && mapContainer.current) {
      setTimeout(() => {
        map.current = L.map(mapContainer.current).setView([-12.1632, -53.5151], 4);

        L.tileLayer('https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=oLMznTPIDCPrc3mGZdoh', {
            attribution: '© MapTiler © OpenStreetMap',
        }).addTo(map.current);

        const fetchAirports = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
                return await response.json();
            } catch (e) {
                console.error("Failed to load airports", e);
                return {};
            }
        };

        fetchAirports().then((airportsData) => {
            const depAirport = airportsData[flightData.departure_airport];
            const arrAirport = airportsData[flightData.arrival_airport];
            
            // Fix: Clean up layer logic if re-running (though useEffect dependency is flightData)

            if (depAirport) {
            L.marker([depAirport.lat, depAirport.lon])
                .addTo(map.current)
                .bindPopup(`<strong>${depAirport.icao} - DEPARTURE</strong>`);
            }

            if (arrAirport) {
            L.marker([arrAirport.lat, arrAirport.lon])
                .addTo(map.current)
                .bindPopup(`<strong>${arrAirport.icao} - ARRIVAL</strong>`);
            }

            if (depAirport && arrAirport) {
            const latLngs = [
                [depAirport.lat, depAirport.lon],
                [arrAirport.lat, arrAirport.lon],
            ];
            L.polyline(latLngs, { color: '#f50057', weight: 3, dashArray: '5, 10' }).addTo(map.current);

            const bounds = L.latLngBounds(latLngs);
            map.current.fitBounds(bounds, { padding: [50, 50] });

             // Calculate distance manually or use simple math
             const distInfo = document.getElementById('distance-info');
             if(distInfo) distInfo.innerText = "Calculated in Flight Plan"; // Placeholder
            }
        });
      }, 100); // Small delay to ensure container render
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [flightData]);


  if (!flightData) {
    return <Typography sx={{ p: 5, textAlign: 'center', color: 'white' }}>Loading Flight Data...</Typography>;
  }

  return (
    <Container maxWidth="xl" sx={{ height: 'calc(100vh - 64px)', p: 3, overflow: 'hidden' }}>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%' }}
        >
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Info Column */}
        <Grid item xs={12} md={5} sx={{ height: '100%', overflowY: 'auto' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                    FLIGHT BRIEFING
                </Typography>
            </Box>

          <Paper sx={{ 
              backgroundColor: 'rgba(10, 25, 41, 0.7)', 
              backdropFilter: 'blur(10px)', 
              color: '#fff', 
              mb: 3,
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              p: 0
            }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Report ID: #{id} • {new Date(flightData.registration_date).toLocaleDateString()}
                </Typography>
                <Chip 
                    label={flightData.status} 
                    size="small"
                    color={flightData.status === 'Approved' ? 'success' : flightData.status === 'Rejected' ? 'error' : 'warning'} 
                    />
              </Box>
            </CardContent>
          </Paper>

          <Paper sx={{ 
              mb: 3, 
              backgroundColor: 'rgba(10, 25, 41, 0.7)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white'
             }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4dabf5', fontWeight: 'bold' }}>
                FLIGHT INFORMATION
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Grid container spacing={2}>
                 <Grid item xs={6}>
                     <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {renderLogo(flightData.livery_id, logoData, flightData.flight_icao)}
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">FLIGHT NUMBER</Typography>
                        <Typography variant="h6" fontWeight="bold">{flightData.flight_icao} {flightData.flight_number}</Typography>
                     </Box>
                 </Grid>
                 <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">AIRCRAFT</Typography>
                        <Typography variant="h6" fontWeight="bold">{flightData.aircraft}</Typography>
                    </Box>
                 </Grid>
                 
                 <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, border: '1px solid rgba(77, 171, 245, 0.3)', borderRadius: 2 }}>
                        <Typography variant="caption" color="#4dabf5">DEPARTURE</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {renderFlag(flightData.departure_airport, airportsData)}
                            <Typography variant="h5" fontWeight="bold">{flightData.departure_airport}</Typography>
                        </Box>
                         <FlightTakeoffIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
                    </Box>
                 </Grid>
                 <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, border: '1px solid rgba(245, 0, 87, 0.3)', borderRadius: 2 }}>
                         <Typography variant="caption" color="#f50057">ARRIVAL</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {renderFlag(flightData.arrival_airport, airportsData)}
                            <Typography variant="h5" fontWeight="bold">{flightData.arrival_airport}</Typography>
                        </Box>
                        <FlightLandIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
                    </Box>
                 </Grid>

                 <Grid item xs={4}>
                     <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">DURATION</Typography>
                        <Typography variant="body1">{flightData.flight_duration}</Typography>
                    </Box>
                 </Grid>
                 <Grid item xs={4}>
                     <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">NETWORK</Typography>
                        <Typography variant="body1">{flightData.network}</Typography>
                    </Box>
                 </Grid>
                 <Grid item xs={4}>
                     <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">ALTERNATE</Typography>
                        <Typography variant="body1">{flightData.alternate_airport || 'N/A'}</Typography>
                    </Box>
                 </Grid>
              </Grid>
            </CardContent>
          </Paper>

          <Paper sx={{ 
              mb: 3, 
              backgroundColor: 'rgba(10, 25, 41, 0.7)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white'
             }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2ecc71', fontWeight: 'bold' }}>
                DISPATCH NOTES
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, minHeight: 80 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                    {flightData.observation || "No dispatch remarks filed."}
                </Typography>
              </Box>
            </CardContent>
          </Paper>
        </Grid>

        {/* Map Column */}
        <Grid item xs={12} md={7} sx={{ height: '100%' }}>
          <Paper sx={{ 
                height: '100%', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative'
            }}>
              <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
              <Box sx={{ 
                  position: 'absolute', 
                  bottom: 20, 
                  left: 20, 
                  zIndex: 1000, 
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  color: 'white', 
                  backdropFilter: 'blur(5px)',
                  px: 2, 
                  py: 1, 
                  borderRadius: 2 
                }}>
                  <Typography variant="caption">MAP DATA © MAPTILER</Typography>
              </Box>
          </Paper>
        </Grid>
      </Grid>
      </motion.div>
    </Container>
  );
};

export default Briefing;