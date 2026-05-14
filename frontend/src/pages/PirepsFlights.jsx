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
import ApiService from '../components/ApiService';

const PirepsFlights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { leg, award } = location.state || {};

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

  const [submissionType, setSubmissionType] = useState('Manual');
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiMessage, setApiMessage] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  
  const [aircraftList, setAircraftList] = useState([]);

  useEffect(() => {
    AxiosInstance.get('aircrafts/')
      .then(res => {
          setAircraftList(res.data);
      })
      .catch(err => console.error('Error fetching aircrafts:', err));
      
    if (leg) {
      setDepartureAirport(leg.from_airport);
      setArrivalAirport(leg.to_airport);
      verifyFlightWithApi(leg.from_airport, leg.to_airport);
    }
  }, [leg]);

  const verifyFlightWithApi = async (from, to) => {
    setIsVerifying(true);
    setApiMessage(null);
    setIsLocked(false);
    try {
      const userRes = await AxiosInstance.get('users/me/');
      const usernameIFC = userRes.data.usernameIFC;

      if (!usernameIFC) {
        setApiMessage({ type: 'warning', text: 'No IFC Username found in your profile. Proceeding with Manual submission.' });
        setIsVerifying(false);
        return;
      }

      const ifcUser = await ApiService.userStatusByUsername(usernameIFC);
      if (!ifcUser) {
        setApiMessage({ type: 'warning', text: `IFC account "${usernameIFC}" not found in the Infinite Flight database. Proceeding with Manual submission.` });
        setIsVerifying(false);
        return;
      }

      // The field in UserStats is userId, not id
      const flights = await ApiService.getUserFlights(ifcUser.userId);
      
      // Some versions of the API might use departureAirport/arrivalAirport for logbook
      // but current docs say originAirport/destinationAirport. We'll check both.
      const match = flights.find(f => 
        (f.originAirport === from || f.departureAirport === from) && 
        (f.destinationAirport === to || f.arrivalAirport === to)
      );

      if (match) {
        // Find aircraft info in our internal list to get Name and Category
        const matchedInternalAc = aircraftList.find(ac => ac.if_id === match.aircraftId);
        if (matchedInternalAc) {
            setAircraft(matchedInternalAc.name);
        }

        // Validate Aircraft Rules
        let isAllowed = true;
        let mismatchReason = null;

        const hasAllowedAircrafts = award?.allowed_aircrafts && award.allowed_aircrafts.length > 0;
        const hasAllowedCategories = award?.allowed_categories && award.allowed_categories.length > 0;

        if (hasAllowedAircrafts || hasAllowedCategories) {
            const isNameAllowed = hasAllowedAircrafts && award.allowed_aircrafts.some(ac => ac.aircraft_id === match.aircraftId);
            const isCategoryAllowed = hasAllowedCategories && matchedInternalAc && award.allowed_categories.some(cat => cat.category === matchedInternalAc.category);
            
            if (!isNameAllowed && !isCategoryAllowed) {
                isAllowed = false;
                mismatchReason = 'Aircraft mismatch! The aircraft used for this flight does not comply with the Award rules.';
            }
        }

        // Fill Flight Duration
        const hours = Math.floor(match.totalTime / 60);
        const minutes = Math.floor(match.totalTime % 60);
        setFlightDuration(dayjs().hour(hours).minute(minutes));

        // Fill Network
        let matchedServer = 'Casual';
        if (match.server && match.server.includes('Training')) matchedServer = 'Training';
        if (match.server && match.server.includes('Expert')) matchedServer = 'Expert';
        setNetwork(matchedServer);

        if (isAllowed) {
            setSubmissionType('Auto');
            setApiMessage({ type: 'success', text: 'Flight successfully verified in the Infinite Flight database! Data has been auto-filled.' });
        } else {
            setSubmissionType('Manual');
            setApiMessage({ type: 'warning', text: `${mismatchReason} Data has been auto-filled, but submission will be Manual.` });
        }
        setIsLocked(true);
      } else {
        setSubmissionType('Manual');
        setApiMessage({ type: 'warning', text: 'Your flight was not found in the Infinite Flight database. Please check if you flew Online (Multiplayer) and if the airports match exactly.' });
      }
    } catch (error) {
      console.error('Error verifying flight:', error);
      setApiMessage({ type: 'warning', text: 'Failed to connect to the Infinite Flight database. Proceeding with Manual submission.' });
    } finally {
      setIsVerifying(false);
    }
  };

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
      submission_type: submissionType,
    };
    
    // Validate manual submission if this is part of an award
    if (submissionType === 'Manual' && award && (award.allowed_aircrafts?.length > 0 || award.allowed_categories?.length > 0)) {
        const selectedAcData = aircraftList.find(a => a.name === aircraft);
        const acCategory = selectedAcData ? selectedAcData.category : 'Uncategorized';
        
        const isNameAllowed = award.allowed_aircrafts.some(ac => ac.aircraft_name === aircraft);
        const isCategoryAllowed = award.allowed_categories.some(cat => cat.category === acCategory);
        
        if (!isNameAllowed && !isCategoryAllowed) {
            setApiMessage({ type: 'error', text: 'Aircraft mismatch! The aircraft used for this manual submission does not comply with the Award rules. Please select a valid aircraft.' });
            return; // Stop submission
        }
    }

    if (submissionType === 'Auto') {
      formData.status = 'Approved';
    }

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
      setSubmissionType('Manual');
      setIsLocked(false);
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
            Use this form to manually submit a flight report or automatically verify a flown leg.
          </Typography>

          {isVerifying ? (
             <Alert severity="info" sx={{ mb: 4, borderRadius: '12px' }}>
               Verifying flight with the Infinite Flight database...
             </Alert>
          ) : apiMessage ? (
             <Alert severity={apiMessage.type} sx={{ mb: 4, borderRadius: '12px', '& .MuiAlert-icon': { color: apiMessage.type === 'warning' ? '#ff9800' : '#2ecc71' } }}>
               {apiMessage.text}
             </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 4, borderRadius: '12px', '& .MuiAlert-icon': { color: '#ff9800' } }}>
              Due to high demand, manual flight approval may take up to 3 days. Thank you for your patience.
            </Alert>
          )}

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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                    disabled={isLocked}
                  >
                    {aircraftList.map((choice) => (
                      <MenuItem key={choice.if_id} value={choice.name}>
                        {choice.name} ({choice.category})
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
                  disabled={isLocked}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Network</InputLabel>
                  <Select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    label="Network"
                    disabled={isLocked}
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