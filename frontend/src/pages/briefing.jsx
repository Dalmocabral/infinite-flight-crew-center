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

const translateReason = (reason) => {
  if (!reason) return reason;
  
  let r = reason;
  
  // G Force
  r = r.replace(/Perfect landing/g, "Pouso perfeito");
  r = r.replace(/Firm landing/g, "Pouso firme");
  r = r.replace(/Hard landing/g, "Pouso duro");
  r = r.replace(/Very hard landing/g, "Pouso muito duro");
  r = r.replace(/Excessive G-force landing/g, "Força G excessiva no pouso");
  r = r.replace(/Excessive G-force/g, "Força G excessiva");
  
  // VS
  r = r.replace(/Smooth landing/g, "Pouso suave");
  r = r.replace(/Normal landing/g, "Pouso normal");
  r = r.replace(/Extremely hard landing/g, "Pouso extremamente duro");
  
  // Bounces
  r = r.replace(/bounce/g, "quique");
  r = r.replace(/bounces/g, "quiques");
  
  // Centerline
  r = r.replace(/On centerline/g, "No eixo da pista");
  r = r.replace(/Slight centerline deviation/g, "Desvio leve do eixo da pista");
  r = r.replace(/Moderate centerline deviation/g, "Desvio moderado do eixo da pista");
  r = r.replace(/Severe centerline deviation/g, "Desvio severo do eixo da pista");
  r = r.replace(/Off runway/g, "Fora da pista");
  
  // IAS / Unstable
  r = r.replace(/IAS >250KTS below 10,000ft/g, "Velocidade >250KTS abaixo de 10.000 pés");
  r = r.replace(/Unstable approach below 500ft/g, "Aproximação instável abaixo de 500 pés");
  
  // Lights & Signs
  r = r.replace(/NAV lights off in motion/g, "Luzes de Navegação (NAV) desligadas em movimento");
  r = r.replace(/BEACON lights off with engines running/g, "Luz de BEACON desligada com motores em funcionamento");
  r = r.replace(/STROBE lights off in flight/g, "Luzes STROBE desligadas em voo");
  r = r.replace(/Turn off Landing lights/g, "Desligue os faróis de pouso");
  r = r.replace(/Landing lights on above 10,000ft/g, "Faróis de pouso acesos acima de 10.000 pés");
  r = r.replace(/Landing lights off below 10,000ft/g, "Faróis de pouso desligados abaixo de 10.000 pés");
  r = r.replace(/No Smoking sign is OFF/g, "Aviso de Não Fumar desligado");
  r = r.replace(/Seat Belts sign is OFF below 10,000ft/g, "Aviso de cinto de segurança desligado abaixo de 10.000 pés");
  r = r.replace(/Seat Belts sign is ON above 10,000ft/g, "Aviso de cinto de segurança ligado acima de 10.000 pés");
  r = r.replace(/Seat Belts sign off below 10,000ft/g, "Aviso de cinto de segurança desligado abaixo de 10.000 pés");
  r = r.replace(/Seat Belts sign on above 10,000ft/g, "Aviso de cinto de segurança ligado acima de 10.000 pés");
  
  // TDZ
  r = r.replace(/Undershoot landing \(Touchdown before threshold/g, "Toque antes da cabeceira (Touchdown antes da pista");
  r = r.replace(/Short landing \(Touchdown before TDZ/g, "Pouso curto (Touchdown antes da TDZ");
  r = r.replace(/On TDZ core \/ Aiming Point/g, "Na zona de toque ideal / Aiming Point");
  r = r.replace(/Long landing \(Touchdown beyond TDZ/g, "Pouso longo (Touchdown além da TDZ");
  r = r.replace(/Deep long landing \(Touchdown deep down runway/g, "Pouso muito longo (Touchdown profundo");
  
  // Fuel
  r = r.replace(/Insufficient fuel reserves/g, "Reservas de combustível insuficientes");
  r = r.replace(/Low fuel reserve at touchdown/g, "Reserva de combustível baixa no toque");
  r = r.replace(/Fuel reserves managed correctly/g, "Reservas de combustível gerenciadas corretamente");

  // Gear
  r = r.replace(/Landing gear not retracted within 15s after takeoff/g, "Trem de pouso não recolhido em até 15s após a decolagem");
  r = r.replace(/Landing gear retracted correctly/g, "Trem de pouso recolhido corretamente");

  return r;
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

             // Marcador de toque se disponível
             const lr = flightData.landing_report;
             if (lr && lr.landing_lat && lr.landing_lon && (Math.abs(lr.landing_lat) > 0.001 || Math.abs(lr.landing_lon) > 0.001)) {
               const touchdownIcon = L.divIcon({
                 className: '',
                 html: '<div style="background:#00e676;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #00e676"></div>',
                 iconSize: [14, 14], iconAnchor: [7, 7]
               });
               L.marker([lr.landing_lat, lr.landing_lon], { icon: touchdownIcon })
                 .addTo(map.current)
                 .bindPopup(`<strong>🛬 TOUCHDOWN</strong><br/>${lr.vs_touchdown} FPM · ${Number(lr.g_force).toFixed(2)}G<br/>Score: ${lr.score}/10`);
             }

             const distInfo = document.getElementById('distance-info');
             if(distInfo) distInfo.innerText = "Calculated in Flight Plan";
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
                 {flightData.landing_report?.fuel_weight_kg > 0 && (
                   <Grid item xs={12}>
                     <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(77,171,245,0.08)', borderRadius: 2, border: '1px solid rgba(77,171,245,0.2)' }}>
                       <Typography variant="caption" color="#4dabf5">⛽ FUEL AT TOUCHDOWN</Typography>
                       <Typography variant="body1" fontWeight="bold">
                         {(flightData.landing_report.fuel_weight_kg / 1000).toFixed(2)} t
                         <Typography component="span" sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', ml: 1 }}>
                           ({Math.round(flightData.landing_report.fuel_weight_kg)} kg)
                         </Typography>
                         {flightData.landing_report.fuel_reserve_minutes > 0 && (
                           <Typography component="span" sx={{ 
                             fontSize: 12, 
                             fontWeight: 'bold',
                             color: flightData.landing_report.fuel_reserve_minutes <= 25 ? '#ff1744' : flightData.landing_report.fuel_reserve_minutes <= 45 ? '#ff9100' : '#00e676', 
                             ml: 2 
                           }}>
                             • {flightData.landing_report.fuel_reserve_minutes.toFixed(1)} mins reserve remaining
                           </Typography>
                         )}
                       </Typography>
                     </Box>
                   </Grid>
                 )}
              </Grid>
            </CardContent>
          </Paper>

          {/* ── LANDING RATING CARD ── */}
          <Paper sx={{
              mb: 3,
              backgroundColor: 'rgba(10, 25, 41, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: flightData.landing_report
                ? `1px solid ${flightData.landing_report.score >= 9 ? 'rgba(0,230,118,0.4)' : flightData.landing_report.score >= 7 ? 'rgba(77,171,245,0.4)' : flightData.landing_report.score >= 5 ? 'rgba(255,235,59,0.4)' : 'rgba(244,67,54,0.4)'}`
                : '1px solid rgba(255,255,255,0.1)',
              color: 'white'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4dabf5', fontWeight: 'bold' }}>
                🛬 LANDING RATING
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              {flightData.landing_report ? (() => {
                const r = flightData.landing_report;
                const scoreColor = r.score >= 7 ? '#00e676' : r.score >= 6 ? '#4dabf5' : r.score >= 5 ? '#ffeb3b' : '#f44336';
                const scoreLabel = r.score >= 9 ? 'BUTTER' : r.score >= 8 ? 'SMOOTH' : r.score >= 7 ? 'GOOD' : r.score >= 6 ? 'AVERAGE' : r.score >= 5 ? 'BELOW AVG' : r.score >= 3 ? 'HARD' : 'CRASH';
                return (
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 64, fontWeight: 'bold', color: scoreColor, lineHeight: 1 }}>
                        {Number(r.score).toFixed(2)}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>/10.0</Typography>
                      <Chip label={scoreLabel} size="small" sx={{ mt: 1, fontWeight: 'bold', bgcolor: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}` }} />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">TOUCHDOWN</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: Math.abs(r.vs_touchdown) < 200 ? '#00e676' : Math.abs(r.vs_touchdown) < 600 ? '#ffeb3b' : '#f44336' }}>
                              {r.vs_touchdown} FPM
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">G-FORCE</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: r.g_force < 1.4 ? '#00e676' : r.g_force < 1.8 ? '#ffeb3b' : '#f44336' }}>
                              {Number(r.g_force).toFixed(2)} G
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">BOUNCES</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: r.bounce_count === 0 ? '#00e676' : '#f44336' }}>
                              {r.bounce_count === 0 ? '✓ NONE' : `${r.bounce_count}x`}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">STATUS</Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: r.status === 'LANDED' ? '#00e676' : '#f44336' }}>
                              {r.status === 'LANDED' ? '✈ LANDED' : '💥 CRASH'}
                            </Typography>
                          </Box>
                        </Grid>
                        {r.has_retractable_gear && (
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: 1, 
                              p: 1, 
                              bgcolor: r.gear_retraction_time <= 15 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(244, 67, 54, 0.08)', 
                              border: r.gear_retraction_time <= 15 ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(244, 67, 54, 0.2)',
                              borderRadius: 2
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', color: r.gear_retraction_time <= 15 ? '#00e676' : '#ff1744' }}>
                                ⚙️ GEAR RETRACTION: {r.gear_retraction_time.toFixed(1)}s (Limit: 15s) {r.gear_retraction_time <= 15 ? '✓' : '❌'}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>0</Typography>
                          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>10</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ width: `${(r.score / 10) * 100}%`, height: '100%', bgcolor: scoreColor, borderRadius: 4 }} />
                        </Box>
                      </Box>

                      {/* Tabela de Deduções / Detalhes de Dedução no Estilo Newsky */}
                      {(() => {
                        let scoringList = r.deductions;
                        if (!scoringList || scoringList.length === 0) {
                          scoringList = [];
                          
                          // G Force
                          if (r.g_force !== null && r.g_force !== undefined && !isNaN(r.g_force)) {
                            if (r.g_force <= 1.20) scoringList.push({ reason: `Perfect landing (${Number(r.g_force).toFixed(2)}G) ✓`, penalty: 0.0 });
                            else if (r.g_force <= 1.50) scoringList.push({ reason: `Firm landing (${Number(r.g_force).toFixed(2)}G)`, penalty: -1.0 });
                            else if (r.g_force <= 2.00) scoringList.push({ reason: `Hard landing (${Number(r.g_force).toFixed(2)}G)`, penalty: -3.0 });
                            else if (r.g_force <= 3.00) scoringList.push({ reason: `Very hard landing (${Number(r.g_force).toFixed(2)}G)`, penalty: -6.0 });
                            else scoringList.push({ reason: `Excessive G-force (${Number(r.g_force).toFixed(2)}G)`, penalty: -10.0 });
                          }

                          // VS Touchdown
                          if (r.vs_touchdown !== null && r.vs_touchdown !== undefined && !isNaN(r.vs_touchdown)) {
                            const vs = Math.abs(r.vs_touchdown);
                            if (vs <= 200) scoringList.push({ reason: `Smooth landing (${vs} FPM) ✓`, penalty: 0.0 });
                            else if (vs <= 400) scoringList.push({ reason: `Normal landing (${vs} FPM)`, penalty: -1.0 });
                            else if (vs <= 600) scoringList.push({ reason: `Firm landing (${vs} FPM)`, penalty: -3.0 });
                            else if (vs <= 1000) scoringList.push({ reason: `Hard landing (${vs} FPM)`, penalty: -6.0 });
                            else scoringList.push({ reason: `Extremely hard landing (${vs} FPM)`, penalty: -10.0 });
                          }

                          // Bounces
                          if (r.bounce_count !== null && r.bounce_count !== undefined && !isNaN(r.bounce_count) && r.bounce_count > 0) {
                            scoringList.push({ reason: `${r.bounce_count} bounce(s)`, penalty: r.bounce_count === 1 ? -4.0 : -10.0 });
                          }

                          // Centerline
                          if (r.centerline !== null && r.centerline !== undefined && !isNaN(r.centerline)) {
                            const c = Math.abs(r.centerline);
                            if (c <= 5) scoringList.push({ reason: `On centerline (${c.toFixed(1)}m) ✓`, penalty: 0.0 });
                            else if (c <= 10) scoringList.push({ reason: `Slight centerline deviation (${c.toFixed(1)}m)`, penalty: -1.0 });
                            else if (c <= 15) scoringList.push({ reason: `Moderate centerline deviation (${c.toFixed(1)}m)`, penalty: -3.0 });
                            else if (c <= 25) scoringList.push({ reason: `Severe centerline deviation (${c.toFixed(1)}m)`, penalty: -6.0 });
                            else scoringList.push({ reason: `Off runway (${c.toFixed(1)}m)`, penalty: -10.0 });
                          }

                          // Touchdown Zone Distance
                          if (r.distance_from_1kft !== null && r.distance_from_1kft !== undefined && !isNaN(r.distance_from_1kft) && r.distance_from_1kft !== 0.0) {
                            const dist = r.distance_from_1kft;
                            if (dist < -250.0) scoringList.push({ reason: `Undershoot landing (Touchdown before threshold: ${dist.toFixed(1)}m)`, penalty: -10.0 });
                            else if (dist < -100.0) scoringList.push({ reason: `Short landing (Touchdown before TDZ: ${dist.toFixed(1)}m)`, penalty: -1.5 });
                            else if (dist <= 200.0) scoringList.push({ reason: `On TDZ core / Aiming Point (${dist.toFixed(1)}m) ✓`, penalty: 0.0 });
                            else if (dist <= 500.0) scoringList.push({ reason: `Long landing (Touchdown beyond TDZ: ${dist.toFixed(1)}m)`, penalty: -3.0 });
                            else scoringList.push({ reason: `Deep long landing (Touchdown deep down runway: ${dist.toFixed(1)}m)`, penalty: -6.0 });
                          }

                          // Light infractions
                          if (r.light_infrac && r.light_infrac.length > 0) {
                            r.light_infrac.forEach(inf => {
                              // Translate light rules if in PT
                              let desc = inf;
                              if (inf.toLowerCase().includes("farol") || inf.toLowerCase().includes("luz")) {
                                desc = `Light configuration infraction (${inf})`;
                              }
                              scoringList.push({ reason: desc, penalty: -1.0 });
                            });
                          }

                          // IAS and Unstable Approaches
                          if (r.ias_violations > 0) {
                            scoringList.push({ reason: `IAS >250KTS below 10,000ft (${r.ias_violations}x)`, penalty: -r.ias_violations * 0.5 });
                          }
                          if (r.unstable_approaches > 0) {
                            scoringList.push({ reason: `Unstable approach below 500ft (${r.unstable_approaches}x)`, penalty: -r.unstable_approaches * 0.5 });
                          }
                        }


                        return (
                          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                            <Typography variant="subtitle2" sx={{ color: '#4dabf5', mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              📊 RATING BREAKDOWN & RULES
                            </Typography>
                            <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Rule / Telemetry Metric</th>
                                    <th style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textAlign: 'right' }}>Score Impact</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scoringList.map((d, idx) => (
                                    <tr key={idx} style={{ 
                                      borderBottom: idx === scoringList.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                      background: d.penalty < 0 ? 'rgba(244,67,54,0.02)' : 'rgba(0,230,118,0.01)'
                                    }}>
                                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: 12 }}>{d.penalty < 0 ? '❌' : '✅'}</span> {translateReason(d.reason)}
                                      </td>
                                      <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 'bold', color: d.penalty < 0 ? '#ff1744' : '#00e676' }}>
                                        {d.penalty === 0 ? '0.00' : d.penalty > 0 ? `+${Number(d.penalty).toFixed(2)}` : `${Number(d.penalty).toFixed(2)}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </Box>
                          </Box>
                        );
                      })()}

                    </Grid>
                  </Grid>
                );
              })() : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                    No landing data recorded for this flight.<br/>
                    <span style={{ fontSize: 12 }}>Use the IF Virtual Co-Pilot app to capture your landing score.</span>
                  </Typography>
                </Box>
              )}
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