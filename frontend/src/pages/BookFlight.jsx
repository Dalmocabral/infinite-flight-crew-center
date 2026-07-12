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
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const BookFlight = () => {
  const location = useLocation();
  
  // Determine if it's Pax or Cargo based on URL
  const isCargo = location.pathname.includes('/cargo');
  const flightTypeLabel = isCargo ? 'Cargo' : 'Passenger (Pax)';

  const [callsign, setCallsign] = useState('');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [aircraft, setAircraft] = useState('');
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

  const handleGenerateSimBrief = () => {
    // SimBrief Dispatch URL parameters:
    // orig: Departure ICAO
    // dest: Arrival ICAO
    // fltnum: Callsign / Flight Number
    // type: Aircraft ICAO
    
    // We try to extract a plausible ICAO or just send the name if it's what we have
    const baseUrl = 'https://www.simbrief.com/system/dispatch.php';
    const params = new URLSearchParams({
      orig: departure,
      dest: arrival,
      fltnum: callsign,
    });
    
    if (aircraft) {
        // SimBrief usually expects an ICAO like 'B77W'
        // If we only have 'Boeing 777-300ER', we can pass it, but the user might need to select it on SimBrief.
        // There are advanced mappings, but sending it via 'type' helps.
        params.append('type', aircraft);
    }

    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    // Open in new tab
    window.open(fullUrl, '_blank');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <FlightTakeoffIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Book Flight - {flightTypeLabel}
          </Typography>
        </Box>

        <Typography variant="body1" color="textSecondary" mb={4}>
          Fill out the details below to generate a professional flight plan using SimBrief. 
          Your information will be pre-filled automatically on their platform.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Flight Callsign (e.g. DAL102)"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
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

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              onClick={handleGenerateSimBrief}
              disabled={!callsign || !departure || !arrival || !aircraft}
            >
              Generate on SimBrief
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default BookFlight;
