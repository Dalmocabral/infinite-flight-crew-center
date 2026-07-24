import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // Trophy icon
import {
    ThumbUp as ThumbUpIcon,
    Warning as WarningIcon,
    FlightTakeoff as FlightTakeoffIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import FlightIcon from "@mui/icons-material/Flight";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import StarRateIcon from "@mui/icons-material/StarRate";
import PreviewIcon from "@mui/icons-material/Preview";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from "@mui/material";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Tooltip as ChartTooltip,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title
} from "chart.js";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";
import ApiService from "../components/ApiService";
import EventsCard from "../components/EventsCard";
import AnnouncementsCard from "../components/AnnouncementsCard";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// Global Chart defaults for dark theme
ChartJS.defaults.color = '#fff';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

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

    // Logo padrão se não houver correspondência (GA, Business Jets, etc.)
    return (
        <img 
            src="https://cdn.radarbox.com/airlines/sq/NO.png" 
            alt="Default Logo" 
            style={{ width: '24px', height: '24px', marginRight: '8px', objectFit: 'contain', verticalAlign: 'middle', opacity: 0.7 }} 
        />
    );
};

const Dashboard = () => {
  const [flights, setFlights] = useState([]); // State for flights data
  const [topDuration, setTopDuration] = useState([]); // State for top duration rankings
  const [topFlights, setTopFlights] = useState([]); // State for top flights rankings
  const [topRatings, setTopRatings] = useState([]); // State for top ratings
  const [openDialog, setOpenDialog] = useState(false); // State for delete confirmation dialog
  const [selectedFlightId, setSelectedFlightId] = useState(null); // State for selected flight ID
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" }); // State for table sorting
  const [ifStats, setIfStats] = useState(null);
  const [ifUsername, setIfUsername] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [airportsData, setAirportsData] = useState({});
  const [logoData, setLogoData] = useState([]);
  const navigate = useNavigate();

  // Fetch flights and rankings on component mount
  useEffect(() => {
    fetchFlights();
    fetchRankings();
    fetchIfStats();
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

  const fetchIfStats = async () => {
    try {
      const userRes = await AxiosInstance.get('/users/me/');
      const username = userRes.data.usernameIFC;
      setAverageRating(userRes.data.average_landing_score);
      if (username) {
        setIfUsername(username);
        const stats = await ApiService.userStatusByUsername(username);
        if (stats) {
          setIfStats(stats);
        }
      }
    } catch (error) {
      console.error('Error fetching IF stats:', error);
    }
  };

  // Fetch flights data from the API
  const fetchFlights = async () => {
    try {
      const response = await AxiosInstance.get("/dashboard/");
      const sortedFlights = response.data.sort(
        (a, b) => new Date(b.registration_date) - new Date(a.registration_date)
      );
      setFlights(sortedFlights);
    } catch (error) {
      console.error("Error fetching flights:", error);
    }
  };

  // Fetch rankings data from the API
  const fetchRankings = async () => {
    try {
      const response = await AxiosInstance.get("/dashboard/rankings/");
      setTopDuration(response.data.top_duration || []);
      setTopFlights(response.data.top_flights || []);
      setTopRatings(response.data.top_ratings || []);
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
    }
  };

  // Handle table column sorting
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedFlights = [...flights].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFlights(sortedFlights);
  };

  // Navigate to edit flight page
  const handleEdit = (flightId) => {
    navigate(`/app/edit-pirep/${flightId}`);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (flightId) => {
    setSelectedFlightId(flightId);
    setOpenDialog(true);
  };

  // Confirm flight deletion
  const handleConfirmDelete = async () => {
    if (selectedFlightId) {
      try {
        await AxiosInstance.delete(`/pirepsflight/${selectedFlightId}/`);
        setFlights(flights.filter((flight) => flight.id !== selectedFlightId));
      } catch (error) {
        console.error("Error deleting flight:", error);
      } finally {
        setOpenDialog(false);
        setSelectedFlightId(null);
      }
    }
  };

  // Calculate total duration in HH:MM format
  const sumDurations = (durations) => {
    let totalMinutes = durations.reduce((acc, duration) => {
      if (!duration) return acc;
      const [hours, minutes] = duration.split(":");
      return acc + parseInt(hours) * 60 + parseInt(minutes);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Get the latest flight (only Approved or Rejected)
  const finishedFlights = flights.filter(f => f.status === 'Approved' || f.status === 'Rejected');
  const lastFlight = finishedFlights.length > 0 ? finishedFlights[0] : null;

  // Calculate total approved flight duration
  const totalDuration = sumDurations(
    flights
      .filter((flight) => flight.status === "Approved")
      .map((flight) => flight.flight_duration)
  );

  // Calculate total approved flights
  const totalFlights = flights.filter(
    (flight) => flight.status === "Approved"
  ).length;

  // Format duration from seconds to HH:MM
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const scheduledFlights = flights.filter(f => f.status === 'Scheduled');
  const recentFlights = flights.filter(f => f.status !== 'Scheduled');

  const renderFlightTable = (flightsList, title, limit = 5) => {
    if (flightsList.length === 0 && title === "Scheduled Flights") return null;

    return (
      <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
             <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                {title === "Scheduled Flights" && <FlightTakeoffIcon sx={{ color: '#9c27b0' }} />}
                {title}
             </Typography>
             {title === "Recent Flights" && (
                <Button variant="outlined" size="small" onClick={() => navigate('/app/my-flights')}>View All</Button>
             )}
          </Box>
        <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
            <TableHead>
                <TableRow>
                {[
                    "Flight", "Dep", "Arr", "Date", "Network", "Duration", "Rating", "Aircraft", "Type", "Validation", "Status", "Action",
                ].map((header, index) => (
                    <TableCell
                    key={index}
                    sx={{ fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => handleSort(header.toLowerCase())}
                    >
                    {header} {sortConfig.key === header.toLowerCase() && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </TableCell>
                ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {flightsList.slice(0, limit).map((flight) => (
                <TableRow key={flight.id} hover>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {renderLogo(flight.livery_id, logoData, flight.flight_icao)}
                            <Typography sx={{fontFamily: 'monospace', fontWeight: 'bold', whiteSpace: 'nowrap'}}>{flight.flight_icao} {flight.flight_number}</Typography>
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
                    <TableCell>{dayjs(flight.registration_date).format("MM/DD/YYYY")}</TableCell>
                    <TableCell><Chip label={flight.status === 'Scheduled' ? 'Pending' : (flight.network || "N/A")} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: flight.status === 'Scheduled' ? 'rgba(255,255,255,0.5)' : 'white', fontStyle: flight.status === 'Scheduled' ? 'italic' : 'normal' }} /></TableCell>
                    <TableCell>{flight.status === 'Scheduled' ? <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending</Typography> : flight.flight_duration}</TableCell>
                    <TableCell>
                      {flight.status === 'Scheduled' ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending</Typography>
                      ) : flight.landing_report ? (
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
                      ) : (
                        <Chip label="N/A" size="small" sx={{ fontWeight: 'bold', bgcolor: 'rgba(13,50,100,0.6)', color: '#5b8dd9', border: '1px solid #2a5298', fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
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
                          sx={{
                            bgcolor: flight.submission_type === 'Auto' ? 'rgba(77,171,245,0.2)' : 'rgba(255,152,0,0.2)',
                            color: flight.submission_type === 'Auto' ? '#4dabf5' : '#ff9800',
                            border: '1px solid currentColor',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                    <Chip
                        label={flight.status === 'Scheduled' ? 'scheduled' : flight.status || "Scheduled"}
                        size="small"
                        color={
                        flight.status === "Approved"
                            ? "success"
                            : flight.status === "Rejected"
                            ? "error"
                            : "warning"
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
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Details">
                        <IconButton size="small" href={`/app/briefing/${flight.id}`} sx={{ color: '#4dabf5' }}>
                        <PreviewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
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
                    <Tooltip title="Edit">
                        <span>
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(flight.id)}
                            disabled={flight.status === "Approved" || flight.status === "Rejected"}
                            sx={{ color: '#fff' }}
                        >
                            <EditIcon fontSize="small"  />
                        </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <span>
                        <IconButton
                            size="small"
                            disabled={flight.status === "Approved"}
                            onClick={() => handleDeleteClick(flight.id)}
                            sx={{ color: '#f50057' }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        </span>
                    </Tooltip>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
        
      <Typography variant="h4" sx={{ my: 3, textAlign: "left", fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(77, 171, 245, 0.5)' }}>
        PILOT DASHBOARD
      </Typography>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Latest Flight Card */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(33, 150, 243, 0.1)', mr: 2, ml: 1 }}>
                <AirplanemodeActiveIcon sx={{ fontSize: 40, color: "#4dabf5" }} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">LATEST FLIGHT PLAN</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {lastFlight
                  ? `${lastFlight.departure_airport} ✈ ${lastFlight.arrival_airport}`
                  : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Hours Card */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(245, 0, 87, 0.1)', mr: 2, ml: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 40, color: "#f50057" }} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">TOTAL FLIGHT TIME</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{totalDuration}h</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Flights Card */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(46, 204, 113, 0.1)', mr: 2, ml: 1 }}>
                <FlightIcon sx={{ fontSize: 40, color: "#2ecc71" }} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">COMPLETED FLIGHTS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{totalFlights}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Average Rating Card */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(255, 193, 7, 0.1)', mr: 2, ml: 1 }}>
                <StarRateIcon sx={{ fontSize: 40, color: (averageRating !== null && averageRating >= 8.0) ? "#00e676" : (averageRating !== null && averageRating >= 6.0) ? "#ffeb3b" : "#f44336" }} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">AVERAGE RATING</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: (averageRating != null && averageRating >= 8.0) ? "#00e676" : (averageRating != null && averageRating >= 6.0) ? "#ffeb3b" : "#f44336" }}>
                {averageRating != null ? Number(averageRating).toFixed(2).replace('.', ',') : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Official Infinite Flight Stats */}
      {ifUsername ? (
        ifStats ? (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#fff' }}>
              Infinite Flight Official Stats (Live)
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(255, 193, 7, 0.1)', mr: 2, ml: 1 }}>
                      <StarRateIcon sx={{ fontSize: 40, color: "#ffc107" }} />
                  </Box>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="textSecondary">PILOT GRADE</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Grade {ifStats.grade}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(77, 171, 245, 0.1)', mr: 2, ml: 1 }}>
                      <FlightLandIcon sx={{ fontSize: 40, color: "#4dabf5" }} />
                  </Box>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="textSecondary">TOTAL LANDINGS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{ifStats.landingCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(156, 39, 176, 0.1)', mr: 2, ml: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 40, color: "#9c27b0" }} />
                  </Box>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="textSecondary">IF FLIGHT TIME</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{Math.floor(ifStats.flightTime / 60)}h</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 1 }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(244, 67, 54, 0.1)', mr: 2, ml: 1 }}>
                      <WarningIcon sx={{ fontSize: 40, color: "#f44336" }} />
                  </Box>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="textSecondary">VIOLATIONS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: ifStats.violations > 5 ? '#f44336' : 'inherit' }}>{ifStats.violations}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>Loading Official IF Stats...</Typography>
        )
      ) : (
        <Paper sx={{ p: 2, mb: 4, backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '12px' }}>
            <Typography sx={{ color: '#ff9800' }}>
              <strong>Sync your Infinite Flight profile!</strong> Add your "Username IFC" in your profile settings to display your official stats here.
            </Typography>
        </Paper>
      )}

      {/* Scheduled Flights Table */}
      {renderFlightTable(scheduledFlights, "Scheduled Flights", 10)}
      {/* Recent Flights Table */}
      {renderFlightTable(recentFlights, "Recent Flights", 5)}

      {/* Rankings Cards */}
      <Grid container spacing={3}>
        {/* Top 5 Flight Duration */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ color: "#ffd700", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Top Pilots (Flight Time)</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Pilot</TableCell>
                      <TableCell align="right">Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topDuration.map((user, index) => (
                      <TableRow key={user.pilot__first_name}>
                        <TableCell>
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && <span style={{fontSize:'1.2em'}}>🥇</span>}
                                {index === 1 && <span style={{fontSize:'1.2em'}}>🥈</span>}
                                {index === 2 && <span style={{fontSize:'1.2em'}}>🥉</span>}
                                {index > 2 && <Typography variant="body2" sx={{ ml: 1 }}>{index + 1}</Typography>}
                           </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {renderFlag(user.pilot__country)}
                            {`${user.pilot__first_name} ${user.pilot__last_name}`}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#4dabf5' }}>{formatDuration(user.total_duration)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 Total Flights */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ color: "#silver", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Top Pilots (Flights)</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Pilot</TableCell>
                      <TableCell align="right">Flights</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topFlights.map((user, index) => (
                      <TableRow key={user.pilot__first_name}>
                        <TableCell>
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && <span style={{fontSize:'1.2em'}}>🥇</span>}
                                {index === 1 && <span style={{fontSize:'1.2em'}}>🥈</span>}
                                {index === 2 && <span style={{fontSize:'1.2em'}}>🥉</span>}
                                {index > 2 && <Typography variant="body2" sx={{ ml: 1 }}>{index + 1}</Typography>}
                           </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {renderFlag(user.pilot__country)}
                            {`${user.pilot__first_name} ${user.pilot__last_name}`}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{user.total_flights}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 Ratings */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StarRateIcon sx={{ color: "#ffc107", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Top Pilots (Rating)</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Pilot</TableCell>
                      <TableCell align="right">Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topRatings.map((user, index) => (
                      <TableRow key={user.pilot__first_name}>
                        <TableCell>
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && <span style={{fontSize:'1.2em'}}>🥇</span>}
                                {index === 1 && <span style={{fontSize:'1.2em'}}>🥈</span>}
                                {index === 2 && <span style={{fontSize:'1.2em'}}>🥉</span>}
                                {index > 2 && <Typography variant="body2" sx={{ ml: 1 }}>{index + 1}</Typography>}
                           </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {renderFlag(user.pilot__country)}
                            {`${user.pilot__first_name} ${user.pilot__last_name}`}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: user.avg_score >= 8.0 ? "#00e676" : user.avg_score >= 6.0 ? "#ffeb3b" : "#f44336" }}>
                          {user.avg_score ? Number(user.avg_score).toFixed(2).replace('.', ',') : "0,00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Community Events & System Updates */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
        <Grid item xs={12} md={6}>
            <EventsCard />
        </Grid>
        <Grid item xs={12} md={6}>
            <AnnouncementsCard />
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
            sx: {
                backgroundColor: 'rgba(10, 25, 41, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
            }
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>Are you sure you want to delete this flight?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      </motion.div>
    </Container>
  );
};

export default Dashboard;