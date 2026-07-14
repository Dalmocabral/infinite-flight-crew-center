import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import FlightIcon from '@mui/icons-material/Flight';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import PreviewIcon from '@mui/icons-material/Preview';
import SearchIcon from '@mui/icons-material/Search';
import StarRateIcon from '@mui/icons-material/StarRate';
import {
  FlightTakeoff as FlightTakeoffIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import {
    Box,
    Chip,
    Container,
    Fade,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AxiosInstance from '../components/AxiosInstance';
import ApiService from '../components/ApiService';

const renderFlag = (countryCode) => {
    if (!countryCode) return null;
    const code = countryCode.toUpperCase();
    return (
        <Tooltip title={code}>
            <img 
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`} 
                alt={code} 
                style={{ width: '20px', marginRight: '8px', verticalAlign: 'middle', borderRadius: '2px', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} 
            />
        </Tooltip>
    );
};

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
                style={{ width: '24px', height: '24px', marginRight: '8px', objectFit: 'contain', verticalAlign: 'middle' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }

    // Logo padrão se não houver correspondência
    return (
        <img 
            src="https://cdn.radarbox.com/airlines/sq/NO.png" 
            alt="Default Logo" 
            style={{ width: '24px', height: '24px', marginRight: '8px', objectFit: 'contain', verticalAlign: 'middle', opacity: 0.7 }} 
        />
    );
};

const AllFlights = () => {
  const [flights, setFlights] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [airportsData, setAirportsData] = useState({});
  const [logoData, setLogoData] = useState([]);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchFlights();
    fetchAirports();
    fetchLogos();
  }, []);

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

  const fetchFlights = async () => {
    try {
      const response = await AxiosInstance.get('/pirepsflight/'); // Correct endpoint based on original file
      const sortedFlights = response.data.sort(
        (a, b) => new Date(b.registration_date) - new Date(a.registration_date)
      );
      setFlights(sortedFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const filteredFlights = flights.filter((flight) => {
     if (flight.status === 'Scheduled') return false;
     const s = search.toLowerCase();
     const flightInfo = (flight.flight_icao + ' ' + flight.flight_number).toLowerCase();
     const pilotName = (flight.pilot_name || '').toLowerCase();
     return flightInfo.includes(s) || pilotName.includes(s);
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: 'center', my: 3, gap: 2 }}>
           <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(77, 171, 245, 0.5)' }}>
            ALL FLIGHTS
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Search by Flight Number or Pilot..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
              ),
              sx: { color: 'white' }
            }}
            sx={{ 
                width: {xs: '100%', sm: 300},
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
          />
        </Box>

        <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden', p: 0, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Flight</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Pilot</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dep</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Arr</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Network</TableCell>}
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>}
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Rating</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold' }}>Aircraft</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Validation</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredFlights
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((flight) => (
                    <TableRow key={flight.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderLogo(flight.livery_id, logoData, flight.flight_icao)}
                        <Typography sx={{fontFamily: 'monospace', fontWeight: 'bold', whiteSpace: 'nowrap'}}>{flight.flight_icao} {flight.flight_number}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {renderFlag(flight.pilot_country)}
                        <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{flight.pilot_name || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {airportsData[flight.departure_airport]?.country && (
                          <img
                            src={`https://flagcdn.com/w320/${airportsData[flight.departure_airport].country.toLowerCase()}.png`}
                            alt={airportsData[flight.departure_airport].country}
                            style={{ width: '20px', borderRadius: '3px' }}
                          />
                        )}
                        {flight.departure_airport}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {airportsData[flight.arrival_airport]?.country && (
                          <img
                            src={`https://flagcdn.com/w320/${airportsData[flight.arrival_airport].country.toLowerCase()}.png`}
                            alt={airportsData[flight.arrival_airport].country}
                            style={{ width: '20px', borderRadius: '3px' }}
                          />
                        )}
                        {flight.arrival_airport}
                      </Box>
                    </TableCell>
                    <TableCell>{dayjs(flight.registration_date).format('MM/DD/YYYY')}</TableCell>
                    {!isMobile && <TableCell><Chip label={flight.status === 'Scheduled' ? 'Pending' : (flight.network || "N/A")} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: flight.status === 'Scheduled' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)', fontStyle: flight.status === 'Scheduled' ? 'italic' : 'normal' }} /></TableCell>}
                    {!isMobile && <TableCell>{flight.status === 'Scheduled' ? <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending</Typography> : flight.flight_duration}</TableCell>}
                    {!isMobile && (
                      <TableCell>
                        {flight.landing_report ? (
                          <Chip
                            label={Number(flight.landing_report.score).toFixed(2)}
                            size="small"
                            sx={{
                              fontWeight: 'bold', minWidth: 54,
                              bgcolor:
                                flight.landing_report.score >= 7 ? 'rgba(0,230,118,0.2)' :
                                flight.landing_report.score >= 6 ? 'rgba(77,171,245,0.2)' :
                                flight.landing_report.score >= 5 ? 'rgba(255,235,59,0.2)' :
                                'rgba(244,67,54,0.2)',
                              color:
                                flight.landing_report.score >= 7 ? '#00e676' :
                                flight.landing_report.score >= 6 ? '#4dabf5' :
                                flight.landing_report.score >= 5 ? '#ffeb3b' :
                                '#f44336',
                              border: '1px solid currentColor',
                            }}
                          />
                        ) : flight.status === 'Scheduled' ? (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending</Typography>
                        ) : (
                          <Chip label="N/A" size="small" sx={{ fontWeight: 'bold', bgcolor: 'rgba(13,50,100,0.6)', color: '#5b8dd9', border: '1px solid #2a5298', fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                    )}
                    <TableCell>{flight.aircraft}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {flight.flight_type || 'World Tour'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {flight.status === 'Scheduled' ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending</Typography>
                      ) : (
                        <Chip
                          label={flight.submission_type === 'Auto' ? 'Auto' : 'Manual'}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 'bold', 
                            borderColor: flight.submission_type === 'Auto' ? '#4dabf5' : 'rgba(255,255,255,0.3)', 
                            color: flight.submission_type === 'Auto' ? '#4dabf5' : 'rgba(255,255,255,0.7)' 
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                        <Chip
                        label={flight.status === 'Scheduled' ? 'scheduled' : flight.status || 'Scheduled'}
                        size="small"
                        color={
                            flight.status === 'Approved'
                            ? 'success'
                            : flight.status === 'Rejected'
                            ? 'error'
                            : 'warning'
                        }
                        sx={{ 
                            fontWeight: 'bold',
                            ...(flight.status === 'Scheduled' && { 
                                bgcolor: '#9c27b0', 
                                color: 'white',
                                borderColor: '#9c27b0' 
                            })
                        }}
                        />
                         {flight.status === "Rejected" && (
                            <Tooltip title={flight.observation || "No observation available"}  placement="top" arrow>
                                <AssignmentLateIcon
                                    sx={{ ml: 1, color: "#d32f2f", verticalAlign: "middle", fontSize: '1.2rem' }} 
                                />
                            </Tooltip>
                        )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {flight.status === 'Scheduled' && (
                        <Tooltip title="Generate SimBrief">
                          <IconButton
                            size="small"
                            onClick={() => {
                                const baseUrl = 'https://www.simbrief.com/system/dispatch.php';
                                const params = new URLSearchParams({
                                  orig: flight.departure_airport,
                                  dest: flight.arrival_airport,
                                  fltnum: flight.flight_number,
                                  type: flight.aircraft,
                                });
                                window.open(`${baseUrl}?${params.toString()}`, '_blank');
                            }}
                            sx={{ color: '#ff9800' }}
                          >
                            <FlightTakeoffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {flight.status === 'Scheduled' && (
                        <Tooltip title="Submit PIREP">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/app/submit-scheduled-pirep/${flight.id}`)}
                            sx={{ color: '#4caf50' }}
                          >
                            <CloudUploadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip
                        title="Review flight log" 
                        placement="top"
                        arrow
                        TransitionComponent={Fade} 
                        TransitionProps={{ timeout: 500 }}
                      >
                        <IconButton component="a"  href={`/app/briefing/${flight.id}`} sx={{ color: '#4dabf5' }}> 
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredFlights.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            />
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AllFlights;
