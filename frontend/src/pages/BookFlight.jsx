import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const BookFlight = () => {
  const navigate = useNavigate();
  
  // Determine if it's Pax or Cargo based on URL
  const isCargo = location.pathname.includes('/cargo');
  const flightTypeLabel = isCargo ? 'Cargo' : 'Passenger (Pax)';

  const [flightIcao, setFlightIcao] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [aircraft, setAircraft] = useState('');
  const [flightDate, setFlightDate] = useState(dayjs());
  const [aircraftList, setAircraftList] = useState([]);

  useEffect(() => {
    AxiosInstance.get('aircrafts/')
      .then(res => {
        // Se for cargo, filtra por categoria cargo (se o backend retornar a categoria)
        // Como o endpoint /aircrafts/ padrão costuma retornar tudo, podemos tentar filtrar:
        let list = res.data;
        if (isCargo) {
          list = list.filter(a => a.category === 'Cargo' || a.name.toLowerCase().includes('cargo') || a.name.toLowerCase().includes('freighter'));
        } else {
          list = list.filter(a => a.category !== 'Cargo' && !a.name.toLowerCase().includes('freighter'));
        }
        setAircraftList(list);
      })
      .catch(err => console.error('Error fetching aircrafts:', err));
  }, [isCargo]);

  const handleBookFlight = async () => {
    const formData = {
      flight_icao: flightIcao,
      flight_number: flightNumber,
      departure_airport: departure,
      arrival_airport: arrival,
      aircraft: aircraft,
      status: 'Scheduled',
      flight_type: isCargo ? 'Free Flight Cargo' : 'Free Flight Pax',
      // Note: we can format date if needed or store it if model supports it
      // Currently PirepsFlight doesn't have a specific scheduled_date field, 
      // but we can pass it if we add it, or just use the created_at.
      // For now, we save it to the DB as Scheduled.
    };

    try {
      await AxiosInstance.post('pirepsflight/', formData);
      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error booking flight:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <FlightTakeoffIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Book Flight - {flightTypeLabel}
          </Typography>
        </Box>

        <Typography variant="body1" color="textSecondary" mb={4}>
          Schedule your flight below. Once scheduled, it will appear in your Dashboard under Scheduled Flights. 
          You can generate a SimBrief flight plan and submit your PIREP when you are ready to fly.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Company ICAO (e.g. DAL)"
              value={flightIcao}
              onChange={(e) => setFlightIcao(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 4 }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Flight Number (e.g. 102)"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="aircraft-label">Aircraft</InputLabel>
              <Select
                labelId="aircraft-label"
                value={aircraft}
                label="Aircraft"
                onChange={(e) => setAircraft(e.target.value)}
              >
                {aircraftList.map((ac) => (
                  <MenuItem key={ac.id || ac.name} value={ac.name}>
                    {ac.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Departure ICAO (e.g. SBGR)"
              value={departure}
              onChange={(e) => setDeparture(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 4 }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Arrival ICAO (e.g. KMIA)"
              value={arrival}
              onChange={(e) => setArrival(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 4 }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date"
              value={flightDate}
              onChange={(newValue) => setFlightDate(newValue)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              onClick={handleBookFlight}
              disabled={!flightIcao || !flightNumber || !departure || !arrival || !aircraft || !flightDate}
            >
              Book Flight
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
    </LocalizationProvider>
  );
};

export default BookFlight;
