import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StraightenIcon from '@mui/icons-material/Straighten';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    Box,
    Button,
    Container,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
    useTheme,
    Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import DistanceCalculator from '../components/DistanceCalculator';
import FlightMap from '../components/FlightMap';
import CheckIcon from '@mui/icons-material/Check';

const AwardDetail = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [flightLegs, setFlightLegs] = useState([]);
  const [airportsData, setAirportsData] = useState({});
  const [totalFlights, setTotalFlights] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [averageHours, setAverageHours] = useState(0);
  const [averageFlights, setAverageFlights] = useState(0);
  const [pilotProgress, setPilotProgress] = useState({ total_legs: 0, pilots: [] });
  const theme = useTheme();
  const location = useLocation();
  const { award, userId } = location.state || {}; // Recebe o ID do usuário
  const navigate = useNavigate();

  const fetchFlightLegs = async (userId) => {
    if (!award) return;
    try {
      const response = await AxiosInstance.get(`/flight-legs/?award=${award.id}&user=${userId}`);
      setFlightLegs(response.data);
      calculateMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar pernas do voo:', error);
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

  const calculateMetrics = (flights) => {
    const totalFlightsCount = flights.length;
    const totalHoursCount = flights.reduce((acc, flight) => acc + (flight.flight_duration || 0), 0);
    const averageHoursCount = totalFlightsCount > 0 ? totalHoursCount / totalFlightsCount : 0;
    const averageFlightsCount = totalFlightsCount > 0 ? totalFlightsCount / flights.length : 0;

    setTotalFlights(totalFlightsCount);
    setTotalHours(totalHoursCount);
    setAverageHours(averageHoursCount);
    setAverageFlights(averageFlightsCount);
  };

  const fetchPilotProgress = async () => {
    if (!award) return;
    try {
      const response = await AxiosInstance.get(`/awards/${award.id}/pilot_progress/`);
      setPilotProgress(response.data);
    } catch (error) {
      console.error('Erro ao buscar progresso dos pilotos:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2 || activeTab === 3) {
      fetchFlightLegs(userId);
    }
    if (activeTab === 2) {
      fetchPilotProgress();
    }
  }, [activeTab, award, userId]);

  useEffect(() => {
    fetchAirports();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {award?.link_image && (
             <Box
                component="img"
                src={award.link_image}
                alt={award.name}
                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, mr: 2, border: '1px solid rgba(255,255,255,0.2)' }}
            />
        )}
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{award?.name || 'Tour Details'}</Typography>
            <Typography variant="subtitle1" color="text.secondary">World Tour Qualification</Typography>
        </Box>
      </Box>

      <Paper 
        sx={{ 
            mb: 3, 
            backgroundColor: 'rgba(10, 25, 41, 0.7)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{ 
            '& .MuiTabs-indicator': { backgroundColor: '#4dabf5', height: 3 },
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontSize: '1rem' },
            '& .Mui-selected': { color: '#4dabf5 !important' }
           }}
        >
          <Tab label="Description" />
          <Tab label="Leg Overview" />
          <Tab label="Tour Map & Status" />
        </Tabs>
      </Paper>

      {/* Conteúdo das seções */}
      <Box sx={{ p: 1 }}>
        {activeTab === 0 && (
          <Paper 
            sx={{ 
                p: 4, 
                backgroundColor: 'rgba(10, 25, 41, 0.5)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)' 
            }}
          >
            <Box id="description" sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom sx={{color: '#4dabf5', mb: 3}}>Mission Briefing</Typography>
                <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>
                    {award?.description || 'No description available for this tour.'}
                </Typography>
                
                <Box sx={{ mt: 5, p: 3, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" gutterBottom sx={{color: '#4dabf5', mb: 2}}>Allowed Aircraft</Typography>
                    {((award?.allowed_aircrafts && award.allowed_aircrafts.length > 0) || (award?.allowed_categories && award.allowed_categories.length > 0)) ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                            {award.allowed_aircrafts && award.allowed_aircrafts.map((ac, index) => (
                                <Box key={`ac-${index}`} sx={{ px: 2, py: 1, backgroundColor: 'rgba(77, 171, 245, 0.1)', border: '1px solid #4dabf5', borderRadius: '20px', fontSize: '0.9rem', color: 'white' }}>
                                    {ac.aircraft_name}
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>Any Aircraft</Typography>
                    )}
                </Box>
            </Box>
          </Paper>
        )}

        {activeTab === 1 && (
          <Box id="leg-overview">
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Flight Legs ({flightLegs.length})
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Departure</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Destination</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Distance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Est. Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Simbrief FPL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flightLegs.map((leg, index) => (
                    <TableRow key={leg.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {airportsData[leg.from_airport]?.country && (
                            <img
                              src={`https://flagcdn.com/w320/${airportsData[leg.from_airport].country.toLowerCase()}.png`}
                              alt={airportsData[leg.from_airport].country}
                              style={{ width: '24px', borderRadius: '4px' }}
                            />
                          )}
                          <Typography fontWeight="bold">{leg.from_airport}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{airportsData[leg.from_airport]?.name}</Typography>
                      </TableCell>
                      <TableCell>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {airportsData[leg.to_airport]?.country && (
                            <img
                              src={`https://flagcdn.com/w320/${airportsData[leg.to_airport].country.toLowerCase()}.png`}
                              alt={airportsData[leg.to_airport].country}
                              style={{ width: '24px', borderRadius: '4px' }}
                            />
                          )}
                          <Typography fontWeight="bold">{leg.to_airport}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{airportsData[leg.to_airport]?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4dabf5' }}>
                            <StraightenIcon fontSize="small" />
                            <DistanceCalculator
                            fromAirport={leg.from_airport}
                            toAirport={leg.to_airport}
                            airportsData={airportsData}
                            />
                        </Box>
                        </TableCell>
                        <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f50057' }}>
                            <AccessTimeIcon fontSize="small" />
                            <DistanceCalculator
                            fromAirport={leg.from_airport}
                            toAirport={leg.to_airport}
                            airportsData={airportsData}
                            showTime={true}
                            />
                        </Box>
                        </TableCell>
                      <TableCell align="center">
                          <IconButton
                            color="info"
                            href={`https://dispatch.simbrief.com/options/custom?orig=${leg.from_airport}&dest=${leg.to_airport}`}
                            target="_blank"
                          >
                            <DescriptionIcon />
                          </IconButton>
                      </TableCell>
                      <TableCell>
                          {(() => {
                              const isCompleted = leg.pirep_status === 'Approved';
                              const isPreviousCompleted = index === 0 || flightLegs[index - 1].pirep_status === 'Approved';
                              const isDisabled = isCompleted || !isPreviousCompleted;

                              return (
                                  <Button
                                    variant={isCompleted ? "outlined" : "contained"}
                                    color={isCompleted ? "success" : "primary"}
                                    size="small"
                                    onClick={() => {
                                      if (!isPreviousCompleted) {
                                          alert(`Por favor, complete a Leg ${index} antes de iniciar esta.`);
                                          return;
                                      }
                                      navigate('/app/pirepsflights', { state: { leg, award } });
                                    }}
                                    disabled={isDisabled}
                                  >
                                    {isCompleted ? 'Completed' : 'Fly Leg'}
                                  </Button>
                              );
                          })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 2 && (
          <Box id="tour-status">
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            height: '600px', 
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden' 
                        }}
                    >
                         <FlightMap flightLegs={flightLegs} airportsData={airportsData} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            height: '600px', 
                            overflowY: 'auto',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(10, 25, 41, 0.5)'
                        }}
                    >
                         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Progression Log</Typography>
                        <List>
                        {flightLegs.map((leg, index) => (
                            <ListItem
                            key={leg.id}
                            sx={{
                                backgroundColor:
                                leg.pirep_status === 'Approved' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.05)',
                                mb: 1,
                                borderRadius: 2,
                                border: leg.pirep_status === 'Approved' ? '1px solid rgba(46, 204, 113, 0.3)' : 'none'
                            }}
                            >
                            <ListItemText
                                primary={
                                    <Typography variant="body2" fontWeight="bold">
                                        Leg {index + 1}: {leg.from_airport} ➝ {leg.to_airport}
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: leg.pirep_status === 'Approved' ? '#2ecc71' : 'text.secondary' }}>
                                        Status: {leg.pirep_status || 'Pending'}
                                    </Typography>
                                }
                            />
                            </ListItem>
                        ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Pilot Progress Table */}
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ color: '#4dabf5', textAlign: 'center', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Pilots
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(10, 25, 41, 0.7)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <TableCell sx={{ color: '#4dabf5', fontWeight: 'bold' }}>Full name</TableCell>
                      {Array.from({ length: pilotProgress.total_legs }).map((_, i) => (
                        <TableCell key={`head-leg-${i}`} align="center" sx={{ color: '#4dabf5', fontSize: '0.75rem', p: 1 }}>LEG {i + 1}</TableCell>
                      ))}
                      <TableCell align="center" sx={{ color: '#4dabf5', fontSize: '0.8rem' }}>Progress</TableCell>
                      <TableCell align="center" sx={{ color: '#4dabf5', fontSize: '0.8rem' }}>Started</TableCell>
                      <TableCell align="center" sx={{ color: '#4dabf5', fontSize: '0.8rem' }}>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pilotProgress.pilots.map((pilot) => (
                      <TableRow key={pilot.user_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <TableCell sx={{ color: 'white', py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {pilot.user_name.charAt(0)}
                                </Box>
                                <Typography variant="body2">{pilot.user_name}</Typography>
                            </Box>
                        </TableCell>
                        {Array.from({ length: pilotProgress.total_legs }).map((_, i) => (
                          <TableCell key={`cell-leg-${i}`} align="center" sx={{ py: 1 }}>
                            {pilot.completed_legs[`leg_${i + 1}`] ? (
                              <Tooltip title={pilot.completed_legs[`leg_${i + 1}`]} placement="top" arrow>
                                <CheckIcon sx={{ color: '#2ecc71', fontSize: '1.2rem', cursor: 'pointer' }} />
                              </Tooltip>
                            ) : null}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ color: 'white' }}>{Math.round(pilot.progress)}%</TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{pilot.start_date || '-'}</TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{pilot.end_date || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </Box>
      </motion.div>
    </Container>
  );
};

export default AwardDetail;