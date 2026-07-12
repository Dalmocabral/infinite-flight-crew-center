import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
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

  useEffect(() => {
    AxiosInstance.get(`/pirepsflight/${id}/`)
      .then((response) => {
        setFormData({
          ...response.data,
          flight_duration: response.data.flight_duration ? dayjs(response.data.flight_duration, "HH:mm:ss") : dayjs("2022-04-17T00:00"), 
        });
      })
      .catch((error) => console.error("Erro ao carregar o PIREP:", error));
  }, [id]);

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
      status: 'In Review' // Mudar o status para In Review após o piloto submeter
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
                    color="success"
                    sx={{ mt: 2, height: '56px', fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  SUBMIT PIREP
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
