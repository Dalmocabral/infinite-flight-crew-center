import SendIcon from '@mui/icons-material/Send';
import {
    Alert,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import aircraftChoices from '../data/aircraftChoices';

const PirepsFlights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { leg } = location.state || {};

  const [flightIcao, setFlightIcao] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureAirport, setDepartureAirport] = useState(leg?.from_airport || '');
  const [arrivalAirport, setArrivalAirport] = useState(leg?.to_airport || '');
  const [aircraft, setAircraft] = useState('');
  const [network, setNetwork] = useState('');
  const [flightDuration, setFlightDuration] = useState(dayjs('2022-04-17T00:00'));

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState('success');

  useEffect(() => {
    if (leg) {
      setDepartureAirport(leg.from_airport);
      setArrivalAirport(leg.to_airport);
    }
  }, [leg]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    if (dialogType === 'success') {
      navigate('/app/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedDuration = flightDuration.format('HH:mm:ss');

    const formData = {
      flight_icao: flightIcao,
      flight_number: flightNumber,
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
      aircraft: aircraft,
      flight_duration: formattedDuration,
      network: network,
    };

    try {
      await AxiosInstance.post('pirepsflight/', formData);
      setDialogMessage('Pireps saved successfully!');
      setDialogType('success');
      setOpenDialog(true);

      setFlightIcao('');
      setFlightNumber('');
      setDepartureAirport('');
      setArrivalAirport('');
      setAircraft('');
      setFlightDuration(dayjs('2022-04-17T00:00'));
    } catch (error) {
      console.error('Error saving Pireps:', error.response ? error.response.data : error.message);
      setDialogMessage('Error saving Pireps. Please check the data and try again.');
      setDialogType('error');
      setOpenDialog(true);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
        <Paper 
            elevation={24}
            sx={{ 
                p: { xs: 3, md: 5 }, 
                mt: 4, 
                mb: 4,
                borderRadius: '20px', 
                backgroundColor: 'rgba(10, 25, 41, 0.7)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', mb: 1 }}>
            FILE MANUAL PIREP
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 3 }}>
            Use this form to manually submit a flight report if your ACARS failed.
          </Typography>

          <Alert severity="warning" sx={{ mb: 4, borderRadius: '12px', '& .MuiAlert-icon': { color: '#ff9800' } }}>
            Due to high demand, flight approval may take up to 3 days. Thank you for your patience.
          </Alert>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {leg && (
                 <Grid item xs={12}>
                  <TextField
                    label="Leg Number"
                    value={leg.leg_number}
                    fullWidth
                    disabled
                    variant="filled"
                  />
                 </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight ICAO"
                  value={flightIcao}
                  onChange={(e) => setFlightIcao(e.target.value ? e.target.value.toUpperCase() : '')}
                  fullWidth
                  required
                  placeholder="e.g. AAL"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight Number"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. 1234"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Departure Airport"
                  value={departureAirport}
                  onChange={(e) => setDepartureAirport(e.target.value ? e.target.value.toUpperCase() : '')}
                  fullWidth
                  required
                  placeholder="ICAO Code"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Arrival Airport"
                  value={arrivalAirport}
                  onChange={(e) => setArrivalAirport(e.target.value ? e.target.value.toUpperCase() : '')}
                  fullWidth
                  required
                  placeholder="ICAO Code"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Aircraft</InputLabel>
                  <Select
                    value={aircraft}
                    onChange={(e) => setAircraft(e.target.value)}
                    label="Aircraft"
                  >
                    {aircraftChoices.map((choice) => (
                      <MenuItem key={choice.value} value={choice.value}>
                        {choice.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TimeField
                  label="Flight Duration (HH:mm)"
                  value={flightDuration}
                  onChange={(newValue) => setFlightDuration(newValue)}
                  format="HH:mm"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Network</InputLabel>
                  <Select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    label="Network"
                  >
                    <MenuItem value="Casual">Casual Server</MenuItem>
                    <MenuItem value="Training">Training Server</MenuItem>
                    <MenuItem value="Expert">Expert Server</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        startIcon={<SendIcon />}
                        sx={{ mt: 2, height: '56px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                    SUBMIT PIREP
                    </Button>
                </motion.div>
              </Grid>
            </Grid>
          </form>
        </Paper>
        </motion.div>
      </Container>


      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
            sx: {
                backgroundColor: 'rgba(10, 25, 41, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
            }
        }}
      >
        <DialogTitle sx={{ color: dialogType === 'success' ? '#2ecc71' : '#f44336' }}>
            {dialogType === 'success' ? 'Success' : 'Error'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.8)' }}>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus sx={{ color: '#4dabf5' }}>OK</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PirepsFlights;