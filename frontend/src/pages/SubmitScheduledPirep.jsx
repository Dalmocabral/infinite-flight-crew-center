import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Alert,
    Box,
    Button,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from "@mui/material";
import { LocalizationProvider, TimeField } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";
import ApiService from "../components/ApiService";

const SubmitScheduledPirep = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    flight_icao: "",
    flight_number: "",
    departure_airport: "",
    arrival_airport: "",
    aircraft: "",
    flight_duration: dayjs("2022-04-17T00:00"), 
    network: "",
    status: "",
    observation: "",
  });

  const [aircraftList, setAircraftList] = useState([]);
  const [submissionType, setSubmissionType] = useState('Manual');
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiMessage, setApiMessage] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [liveryId, setLiveryId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    AxiosInstance.get('aircrafts/')
      .then(res => {
          setAircraftList(res.data);
      })
      .catch(err => console.error('Error fetching aircrafts:', err));
  }, []);

  useEffect(() => {
    AxiosInstance.get(`/pirepsflight/${id}/`)
      .then((response) => {
        setFormData({
          ...response.data,
          flight_duration: response.data.flight_duration ? dayjs(response.data.flight_duration, "HH:mm:ss") : dayjs("2022-04-17T00:00"), 
        });
        setDataLoaded(true);
      })
      .catch((error) => console.error("Erro ao carregar o PIREP:", error));
  }, [id]);

  useEffect(() => {
    if (dataLoaded && aircraftList.length > 0 && formData.departure_airport && formData.arrival_airport) {
      verifyFlightWithApi(formData.departure_airport, formData.arrival_airport);
    }
  }, [dataLoaded, aircraftList, formData.departure_airport, formData.arrival_airport]);

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

      const flights = await ApiService.getUserFlights(ifcUser.userId);
      
      const match = flights.find(f => 
        (f.originAirport === from || f.departureAirport === from) && 
        (f.destinationAirport === to || f.arrivalAirport === to)
      );

      if (match) {
        let matchedInternalAc = aircraftList.find(ac => 
            ac.if_id && match.aircraftId && ac.if_id.toLowerCase() === match.aircraftId.toLowerCase()
        );

        if (!matchedInternalAc && match.liveryId) {
            try {
                const liveryRes = await AxiosInstance.get(`aircrafts/lookup_by_livery/?livery_id=${match.liveryId}`);
                matchedInternalAc = {
                    if_id: liveryRes.data.aircraft_id,
                    name: liveryRes.data.aircraft_name,
                    category: liveryRes.data.category
                };
            } catch (err) {}
        }

        if (!matchedInternalAc && match.aircraftName) {
            matchedInternalAc = aircraftList.find(ac => 
                ac.name.toLowerCase() === match.aircraftName.toLowerCase()
            );
        }

        const hours = Math.floor(match.totalTime / 60);
        const minutes = Math.floor(match.totalTime % 60);
        
        let matchedServer = 'Casual';
        if (match.server && match.server.includes('Training')) matchedServer = 'Training';
        if (match.server && match.server.includes('Expert')) matchedServer = 'Expert';

        setFormData(prev => ({
            ...prev,
            flight_duration: dayjs().hour(hours).minute(minutes),
            network: matchedServer
        }));

        setLiveryId(match.liveryId);
        setSubmissionType('Auto');
        setApiMessage({ type: 'success', text: 'Flight successfully verified in the Infinite Flight database! Data has been auto-filled.' });
        setIsLocked(true);
      } else {
        setSubmissionType('Manual');
        setApiMessage({ 
            type: 'warning', 
            text: 'Attention: Your flight was not automatically located in the Infinite Flight database. You may proceed with a MANUAL submission.' 
        });
      }
    } catch (error) {
      console.error('Error verifying flight:', error);
      setApiMessage({ type: 'warning', text: 'Failed to connect to the Infinite Flight database. Proceeding with Manual submission.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value, 
    });
  };

  const handleTimeChange = (newValue) => {
    setFormData({ ...formData, flight_duration: newValue });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const formattedDuration = formData.flight_duration.format("HH:mm:ss");
  
    const updatedData = {
      flight_duration: formattedDuration,
      network: formData.network,
      observation: formData.observation,
      submission_type: submissionType,
      livery_id: liveryId,
      status: 'In Review'
    };
  
    try {
      await AxiosInstance.patch(`/pirepsflight/${id}/`, updatedData);
      navigate("/app/dashboard"); 
    } catch (error) {
      console.error("Erro ao submeter PIREP agendado:", error);
    }
  };
  

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
        <Box sx={{ mt: 4, mb: 4 }}>
           <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', mb: 2 }}>
                <ArrowBackIcon />
           </IconButton>
           
        <Paper 
            elevation={24}
            sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: '20px', 
                backgroundColor: 'rgba(10, 25, 41, 0.7)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', mb: 1 }}>
            SUBMIT PIREP
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>
            You are submitting PIREP for your scheduled flight {formData.flight_icao} {formData.flight_number}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight Route"
                  value={`${formData.departure_airport} ➔ ${formData.arrival_airport}`}
                  fullWidth
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Aircraft"
                  value={formData.aircraft}
                  fullWidth
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TimeField
                  label="Flight Duration (HH:mm)"
                  value={formData.flight_duration}
                  onChange={handleTimeChange}
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
                    name="network"
                    value={formData.network}
                    onChange={handleChange}
                    label="Network"
                    disabled={isLocked}
                  >
                    <MenuItem value="Casual">Casual</MenuItem>
                    <MenuItem value="Training">Training</MenuItem>
                    <MenuItem value="Expert">Expert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Observation (Optional)"
                  name="observation"
                  value={formData.observation || ''}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    disabled={isVerifying}
                    sx={{ mt: 2, height: '56px', fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  SUBMIT FLIGHT REPORT
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        </Box>
        </motion.div>
      </Container>
    </LocalizationProvider>
  );
};

export default SubmitScheduledPirep;
