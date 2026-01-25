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
import aircraftChoices from "../data/aircraftChoices";

const EditPirep = () => {
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
          flight_duration: dayjs(response.data.flight_duration, "HH:mm:ss"), 
        });
      })
      .catch((error) => console.error("Erro ao carregar o PIREP:", error));
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
  
    setFormData({
      ...formData,
      [name]: name === "flight_icao" || name === "departure_airport" || name === "arrival_airport" ? value.toUpperCase() : value, 
    });
  };

  const handleTimeChange = (newValue) => {
    setFormData({ ...formData, flight_duration: newValue });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const formattedDuration = formData.flight_duration.format("HH:mm:ss");
  
    const updatedData = {
      ...formData,
      flight_duration: formattedDuration,
    };
  
    try {
      await AxiosInstance.patch(`/pirepsflight/${id}/`, updatedData);
      navigate("/app/dashboard"); 
    } catch (error) {
      console.error("Erro ao editar PIREP:", error);
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
            EDIT PIREP
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>
            Update flight details for report #{id}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight ICAO"
                  name="flight_icao"
                  value={formData.flight_icao}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight Number"
                  name="flight_number"
                  value={formData.flight_number}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Departure Airport"
                  name="departure_airport"
                  value={formData.departure_airport}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Arrival Airport"
                  name="arrival_airport"
                  value={formData.arrival_airport}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Aircraft</InputLabel>
                  <Select
                    name="aircraft"
                    value={formData.aircraft}
                    onChange={handleChange}
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
                  value={formData.flight_duration}
                  onChange={handleTimeChange}
                  format="HH:mm"
                  fullWidth
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
                <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth
                    size="large"
                    sx={{ mt: 2, height: '56px', fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  SAVE CHANGES
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

export default EditPirep;