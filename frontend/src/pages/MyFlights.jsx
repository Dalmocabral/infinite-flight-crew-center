import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import PreviewIcon from '@mui/icons-material/Preview';
import SearchIcon from '@mui/icons-material/Search';
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

const MyFlights = () => {
  const [flights, setFlights] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await AxiosInstance.get('/myflights/'); // Correct endpoint based on original file
      const sortedFlights = response.data.sort(
        (a, b) => new Date(b.registration_date) - new Date(a.registration_date)
      );
      setFlights(sortedFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const filteredFlights = flights.filter((flight) =>
     flight.flight_number.toLowerCase().includes(search.toLowerCase()) ||
     flight.flight_icao.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: 'center', my: 3, gap: 2 }}>
           <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(77, 171, 245, 0.5)' }}>
            MY FLIGHTS
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Search by Flight Number..."
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Dep</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Arr</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Network</TableCell>}
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold' }}>Aircraft</TableCell>
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
                    <TableCell><Typography sx={{fontFamily: 'monospace', fontWeight: 'bold'}}>{flight.flight_icao} {flight.flight_number}</Typography></TableCell>
                    <TableCell>{flight.departure_airport}</TableCell>
                    <TableCell>{flight.arrival_airport}</TableCell>
                    <TableCell>{dayjs(flight.registration_date).format('MM/DD/YYYY')}</TableCell>
                    {!isMobile && <TableCell><Chip label={flight.network || "N/A"} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }} /></TableCell>}
                    {!isMobile && <TableCell>{flight.flight_duration}</TableCell>}
                    <TableCell>{flight.aircraft}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                        <Chip
                        label={flight.status || 'Scheduled'}
                        size="small"
                        color={
                            flight.status === 'Approved'
                            ? 'success'
                            : flight.status === 'Rejected'
                            ? 'error'
                            : 'warning'
                        }
                        sx={{ fontWeight: 'bold' }}
                        />
                         {flight.status === "Rejected" && (
                            <Tooltip title={flight.observation || "No observation available"}  placement="top" arrow>
                                <AssignmentLateIcon
                                    sx={{ ml: 1, color: "#d32f2f", verticalAlign: "middle", fontSize: '1.2rem' }} 
                                />
                            </Tooltip>
                        )}
                    </TableCell>
                    <TableCell>
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

export default MyFlights;
