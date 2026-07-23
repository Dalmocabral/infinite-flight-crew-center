import FlightIcon from '@mui/icons-material/Flight';
import PreviewIcon from '@mui/icons-material/Preview';
import PublicIcon from '@mui/icons-material/Public';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Pagination,
    Paper,
    CircularProgress as Spinner,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import Gravatar from '../components/Gravatar';
import ApiService from '../components/ApiService';
import Analytics from './Analytics';

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [ifcData, setIfcData] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAwards, setUserAwards] = useState([]);
  const [awards, setAwards] = useState([]);
  const [approvedFlights, setApprovedFlights] = useState([]);
  const [error, setError] = useState(null);
  const [awardsPage, setAwardsPage] = useState(1);
  const [flightsPage, setFlightsPage] = useState(1);
  const itemsPerPage = 6;
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [awardsResponse, userAwardsResponse] = await Promise.all([
          AxiosInstance.get('/awards/'),
          AxiosInstance.get(`/user-awards/?user=${id}`),
        ]);

        setAwards(awardsResponse.data);
        setUserAwards(userAwardsResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar prêmios.');
      } finally {
      }
    };

    fetchData();
  }, [id]);

  const combinedAwards = userAwards.map((userAward) => {
    const awardData = awards.find((award) => award.id === userAward.award);
    return {
      id: userAward.id,
      name: awardData ? awardData.name : 'Desconhecido',
      image: awardData ? awardData.link_image : '',
      progress: userAward.progress,
      end_date: userAward.end_date,
    };
  });

  const paginatedAwards = combinedAwards.slice((awardsPage - 1) * itemsPerPage, awardsPage * itemsPerPage);

  useEffect(() => {
    AxiosInstance.get(`users/${id}/`)
      .then((res) => {
        setUser(res.data);
        fetchInfiniteFlightData(res.data.usernameIFC);
        fetchUserMetrics(res.data.id);
        fetchApprovedFlights(res.data.id);
      })
      .catch((error) => {
        console.error('Erro ao buscar os dados do usuário:', error);
        setError('Erro ao carregar dados do usuário.');
        setLoading(false);
      });
  }, [id]);

  const fetchInfiniteFlightData = async (username) => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      const userStat = await ApiService.userStatusByUsername(username);
      if (userStat) {
        setIfcData(userStat);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Infinite Flight:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogoData = async () => {
    try {
      const data = await ApiService.getAirplaneLogoData();
      setLogoData(data);
    } catch (error) {
      console.error("Error fetching logo data", error);
    }
  };

  const renderLogo = (liveryId, logoData, icao = null) => {
    if (!logoData || !Array.isArray(logoData)) return null;

    let match = liveryId ? logoData.find(item => item.LiveryId && item.LiveryId.toLowerCase() === liveryId.toLowerCase()) : null;

    if (!match && icao) {
        match = logoData.find(item => item.Icao && item.Icao.toUpperCase() === icao.toUpperCase());
    }

    if (match && match.LogoUrl) {
        return (
            <img 
                src={match.LogoUrl} 
                alt={match.Airline || "Airline Logo"} 
                style={{ width: '40px', height: 'auto', display: 'inline-block' }} 
            />
        );
    }
    return null;
  };

  const fetchUserMetrics = async (userId) => {
    try {
      const response = await AxiosInstance.get(`user-metrics/${userId}/`);
      setUserMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas do usuário:', error);
    }
  };

  const fetchApprovedFlights = async (userId) => {
    try {
      const response = await AxiosInstance.get(`user-approved-flights/${userId}/`);
      setApprovedFlights(response.data);
    } catch (error) {
      console.error('Erro ao buscar voos aprovados:', error);
    }
  };

  const sortedFlights = approvedFlights.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  const paginatedFlights = sortedFlights.slice((flightsPage - 1) * rowsPerPage, flightsPage * rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner />
      </Box>
    );
  }

  if (!user) {
    return <Typography sx={{color: 'white', textAlign: 'center', mt: 10}}>User not found.</Typography>;
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };


  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      {/* Gravatar no centro */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
        <Box sx={{ 
            p: 0, 
            display: 'flex',
            borderRadius: '50%', 
            border: '3px solid #4dabf5', 
            boxShadow: '0 0 25px rgba(77, 171, 245, 0.6)',
            mb: 2,
            overflow: 'hidden'
        }}>
            <Gravatar
            email={user.email}
            size={160}
            alt={`Imagem de perfil de ${user.first_name} ${user.last_name}`}
            style={{ display: 'block' }}
            />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fff' }}>{user.first_name} {user.last_name}</Typography>
        <Box display="flex" alignItems="center" gap={1} mt={1}>
            <img
                src={`https://flagcdn.com/w320/${user.country ? user.country.toLowerCase() : ''}.png`}
                alt={user.country || 'Country'}
                style={{ width: '32px', borderRadius: '4px' }}
            />
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>{user.country}</Typography>
        </Box>
      </Box>

      {/* Cards lado a lado */}
      <Grid container spacing={4} justifyContent="center">
        {/* Card do Sistema World Tour */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
                height: '100%', 
                borderRadius: '16px', 
                position: 'relative', 
                overflow: 'hidden', 
                backgroundColor: 'rgba(10, 25, 41, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
            }}
          >
            <PublicIcon
              sx={{
                position: 'absolute',
                bottom: -40,
                right: -40,
                fontSize: 300,
                color: 'rgba(255, 255, 255, 0.05)',
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#4dabf5', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, mb: 3 }}>
                   INTERNAL STATS
                </Typography>
                
                {userMetrics ? (
                   <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Total Flights</Typography>
                             <Typography variant="h4" fontWeight="bold">{userMetrics.total_flights}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Total Hours</Typography>
                             <Typography variant="h4" fontWeight="bold">{userMetrics.total_flight_time}h</Typography>
                        </Grid>
                        <Grid item xs={12}><Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} /></Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Last 30 Days (Flights)</Typography>
                             <Typography variant="h6" fontWeight="bold">{userMetrics.total_flights_last_30_days}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Last 30 Days (Hours)</Typography>
                             <Typography variant="h6" fontWeight="bold">{userMetrics.total_flight_time_last_30_days}h</Typography>
                        </Grid>
                   </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No metrics available.
                  </Typography>
                )}
            </CardContent>
          </Card>
        </Grid>

        {/* Card do Infinite Flight */}
        <Grid item xs={12} md={6}>
          <Card 
             sx={{ 
                height: '100%', 
                borderRadius: '16px', 
                position: 'relative', 
                overflow: 'hidden', 
                backgroundColor: 'rgba(10, 25, 41, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
            }}
          >
            <FlightIcon
              sx={{
                position: 'absolute',
                bottom: -40,
                right: -40,
                fontSize: 300,
                color: 'rgba(255, 255, 255, 0.05)',
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2ecc71', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, mb: 3 }}>
                   INFINITE FLIGHT LIVE
                </Typography>
                {ifcData ? (
                   <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Grade</Typography>
                             <Typography variant="h4" fontWeight="bold">Grade {ifcData.grade}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">XP</Typography>
                             <Typography variant="h4" fontWeight="bold">{ifcData.xp.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={12}><Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} /></Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Total Flight Time</Typography>
                             <Typography variant="h6" fontWeight="bold">{(ifcData.flightTime / 60).toFixed(1)}h</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Online Flights</Typography>
                             <Typography variant="h6" fontWeight="bold">{ifcData.onlineFlights}</Typography>
                        </Grid>
                   </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Infinite Flight data not linked or unavailable.
                  </Typography>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seção de Prêmios */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', mb: 4 }}>
          AWARDS & BADGES
        </Typography>
        <Box
          sx={{
            maxHeight: '400px',
            overflowY: 'auto',
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Grid container spacing={3} justifyContent="center">
            {combinedAwards.length > 0 ? (
              combinedAwards.map((award) => (
                <Grid item xs={6} sm={4} md={2} key={award.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.2)', width: '100%' }}>
                    <Box
                      sx={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                         overflow: 'hidden',
                         border: '2px solid gold',
                         boxShadow: '0 0 10px gold',
                         mx: 'auto'
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={award.image}
                        alt={award.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: 'gold' }}>
                      {award.name}
                    </Typography>
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={award.progress} 
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)' }} 
                        color="warning" 
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                        {award.progress}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                No active tours or awards yet.
              </Typography>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Tabela de voos aprovados */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
          FLIGHT HISTORY
        </Typography>
        {approvedFlights.length > 0 ? (

          <>
            <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Flight</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dep</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Arr</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Network</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Aircraft</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFlights.map((flight) => (
                    <TableRow key={flight.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {renderLogo(flight.livery_id, logoData, flight.flight_icao)}
                            <Typography sx={{ fontWeight: 'bold' }}>
                                {flight.flight_icao || 'ICAO'} {flight.flight}
                            </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{flight.dep}</TableCell>
                      <TableCell>{flight.arr}</TableCell>
                      <TableCell>{new Date(flight.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={flight.network} size="small" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                      </TableCell>
                      <TableCell>{formatDuration(flight.duration)}</TableCell>
                      <TableCell>
                        {flight.landing_report?.score != null ? (
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
                        <Chip
                          label={flight.status}
                          size="small"
                          color={
                            flight.status === "Pending"
                              ? "warning"
                              : flight.status === "Approved"
                                ? "success"
                                : flight.status === "Rejected"
                                  ? "error"
                                  : "default"
                          }
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton component="a" href={`/app/briefing/${flight.id}`} sx={{ color: '#4dabf5' }}>
                          <PreviewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(approvedFlights.length / rowsPerPage)}
                page={flightsPage}
                onChange={(event, value) => setFlightsPage(value)}
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { color: 'white' } }}
              />
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="rgba(255,255,255,0.5)">
            No approved flights found for this pilot.
          </Typography>
        )}
      </Box>

      {/* Embedded Analytics for this User */}
      <Box sx={{ mt: 6 }}>
        <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', mb: 3 }}>
          Pilot Analytics
        </Typography>
        <Analytics targetUserId={id} hideTitle={true} />
      </Box>

      </motion.div>
    </Container>
  );
};

export default UserDetail;