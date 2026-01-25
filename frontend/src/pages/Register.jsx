import { FlightLand, PersonAdd, Visibility, VisibilityOff } from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    Container,
    CssBaseline,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography
} from "@mui/material";
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { useState } from 'react';
import ReactFlagsSelect from 'react-flags-select';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
const Register = () => {
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      usernameIFC: "",
      email: "",
      country: "",
      password1: "",
      password2: "",
    },
  });

  const navigate = useNavigate();

  const checkUsernameIFC = async (username) => {
    try {
      const params = { discourseNames: [username] };
      const headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' };
      const url = 'https://api.infiniteflight.com/public/v2/user/stats?apikey=nvo8c790hfa9q3duho2jhgd2jf8tgwqw';

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(params),
        headers,
      });

      if (!response.ok) {
        return response.status;
      }

      const data = await response.json();

      if (data.result && data.result.length > 0 && data.result[0].userId) {
        return 200;
      } else {
        return 404;
      }
    } catch (error) {
      console.error("Error checking username IFC:", error);
      return 500;
    }
  };

  const checkUsernameDebounced = debounce(async (username) => {
    if (username) {
      setUsernameLoading(true);
      const statusCode = await checkUsernameIFC(username);
      setUsernameValid(statusCode === 200);
      setUsernameLoading(false);

      if (statusCode === 200) {
        setSnackbarMessage("Username IFC is valid.");
        setSnackbarSeverity("success");
      } else if (statusCode === 404) {
        setSnackbarMessage("Invalid IFC username. Please enter a valid username.");
        setSnackbarSeverity("error");
      } else {
        setSnackbarMessage("Error verifying IFC username. Please try again.");
        setSnackbarSeverity("error");
      }
      setSnackbarOpen(true);
    }
  }, 500);

  const submission = async (data) => {
    try {
      const response = await AxiosInstance.post(`register/`, {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        usernameIFC: data.usernameIFC,
        country: data.country,
        password: data.password1,
        confirm_password: data.password2,
      });

      setSnackbarMessage("Registration successful! Redirecting to login...");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      console.log("Registration successful:", response.data);

      reset();

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setSnackbarMessage("Registration failed. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);

      console.error("Registration failed:", error.response ? error.response.data : error.message);
    }
  };
  const onSubmit = async (data) => {
    console.log("Form submitted", data);
    if (usernameValid) {
      submission(data);
    } else {
      setSnackbarMessage("Invalid IFC username. Please enter a valid username.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <CssBaseline />
      <Box
         sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.1) 0%, transparent 60%)',
            animation: 'pulse 10s infinite',
          },
          padding: 2
        }}
      >
        <Container component="main" maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Paper
              elevation={24}
               sx={{
                padding: { xs: 3, md: 5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(10, 25, 41, 0.75)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
            >
              <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                  <Box
                    sx={{
                      m: 1,
                      bgcolor: 'transparent',
                      color: 'primary.main',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <PersonAdd sx={{ fontSize: 50 }} />
                  </Box>
              </motion.div>

              <Typography component="h1" variant="h5" sx={{ mb: 1, color: '#fff', textAlign: 'center' }}>
                JOIN THE CREW
              </Typography>
               <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                Complete your flight manifest to get cleared for takeoff.
              </Typography>

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="first_name"
                            control={control}
                            rules={{ required: "First name is required" }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="First Name"
                                margin="dense"
                                error={!!errors.first_name}
                                helperText={errors.first_name?.message}
                                onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value.charAt(0).toUpperCase() + value.slice(1));
                                }}
                            />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="last_name"
                            control={control}
                            rules={{ required: "Last name is required" }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Last Name"
                                margin="dense"
                                error={!!errors.last_name}
                                helperText={errors.last_name?.message}
                                onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value.charAt(0).toUpperCase() + value.slice(1));
                                }}
                            />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address",
                            },
                            }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Email"
                                type="email"
                                margin="dense"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                            />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="usernameIFC"
                            control={control}
                            rules={{ required: "Username IFC is required" }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Username IFC"
                                margin="dense"
                                error={!!errors.usernameIFC}
                                helperText={errors.usernameIFC?.message}
                                onBlur={(e) => checkUsernameDebounced(e.target.value)}
                                InputProps={{
                                endAdornment: usernameLoading ? (
                                    <Typography variant="caption" sx={{color: 'grey.500'}}>Checking...</Typography>
                                ) : usernameValid ? (
                                    <FlightLand sx={{ color: 'success.main' }} />
                                ) : field.value ? ( // Only show error icon if there is a value
                                     <Typography variant="caption" sx={{color: 'error.main'}}>Invalid</Typography>
                                ) : null,
                                }}
                            />
                            )}
                        />
                    </Grid>

                     <Grid item xs={12} sm={6}>
                         <Controller
                            name="country"
                            control={control}
                            rules={{ required: "Country is required" }}
                            render={({ field }) => (
                              <Box sx={{
                                  mt: 1,
                                  '& .country-select button': {
                                      fontSize: '1rem',
                                      padding: '12.5px 14px',
                                      borderRadius: '12px',
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                      color: '#fff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      width: '100%',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                          borderColor: 'rgba(255, 255, 255, 0.5)',
                                      }
                                  },
                                  '& .country-select ul': {
                                      backgroundColor: '#0a1929',
                                      color: '#fff',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                  },
                                   '& .country-select li:hover': {
                                      backgroundColor: 'rgba(77, 171, 245, 0.2)',
                                  }

                              }}>
                                <ReactFlagsSelect
                                    selected={selectedCountry}
                                    onSelect={(countryCode) => {
                                    setSelectedCountry(countryCode);
                                    setValue("country", countryCode);
                                    }}
                                    searchable
                                    placeholder="Select Country"
                                    className="country-select"
                                />
                                {errors.country && <Typography variant="caption" color="error" sx={{ml: 2}}>{errors.country.message}</Typography>}
                              </Box>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="password1"
                            control={control}
                            rules={{ required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Password"
                                type={showPassword1 ? "text" : "password"}
                                margin="dense"
                                error={!!errors.password1}
                                helperText={errors.password1?.message}
                                InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword1(!showPassword1)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                        {showPassword1 ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                                }}
                            />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="password2"
                            control={control}
                            rules={{
                            required: "Confirm password",
                            validate: (value) => value === watch("password1") || "Passwords mismatch",
                            }}
                            render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Confirm Password"
                                type={showPassword2 ? "text" : "password"}
                                margin="dense"
                                error={!!errors.password2}
                                helperText={errors.password2?.message}
                                InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword2(!showPassword2)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                        {showPassword2 ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                                }}
                            />
                            )}
                        />
                    </Grid>
                </Grid>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 4, mb: 2, height: '48px', fontSize: '1rem' }}
                        disabled={!usernameValid}
                    >
                        REGISTER
                    </Button>
                </motion.div>
                
                 <Box sx={{ textAlign: 'center', mt: 1 }}>
                     <Button 
                        onClick={() => navigate('/login')}
                        sx={{ 
                            textTransform: 'none', 
                            color: '#4dabf5', 
                            background: 'none', 
                            boxShadow: 'none',
                            '&:hover':{ background: 'transparent', textDecoration: 'underline' } 
                        }}
                     >
                         Already have an account? Sign In
                     </Button>
                 </Box>

              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: '12px' }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Register;