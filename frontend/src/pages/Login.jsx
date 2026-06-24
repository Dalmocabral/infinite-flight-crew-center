import { FlightTakeoff, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    CssBaseline,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography,
    Link,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'waking'

  // Ping the server when the login page loads to wake up Render
  useEffect(() => {
    // If token exists, redirect to dashboard
    if (localStorage.getItem('Token')) {
      navigate('/app/dashboard');
    }

    const wakeServer = async () => {
      try {
        await AxiosInstance.get('flight-stats/');
        setServerStatus('online');
      } catch {
        // If it fails, server might still be waking up - that's ok
        setServerStatus('online');
      }
    };
    wakeServer();
  }, [navigate]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerStatus('waking');
    try {
      const response = await AxiosInstance.post('login/', {
        email: data.email,
        password: data.password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('loginTimestamp', Date.now().toString());

      setSnackbarMessage('Login successful! Welcome aboard.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setServerStatus('online');

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1500);
    } catch (error) {
      if (error.response?.data?.error === 'INACTIVE_ACCOUNT') {
        navigate(`/inactive-profile?email=${encodeURIComponent(data.email)}`);
        return;
      } else {
        const msg = error.response
          ? 'Login failed. Please check your credentials.'
          : 'Server is starting up, please try again in a few seconds...';
        setSnackbarMessage(msg);
        setSnackbarSeverity('warning');
      }
      setSnackbarOpen(true);
      setServerStatus('online');
      console.error('Login failed:', error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
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
          // Dynamic gradient background resembling a sky/runway at dusk
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
        }}
      >
        <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Paper
              elevation={24}
              sx={{
                padding: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(10, 25, 41, 0.65)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
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
                  <FlightTakeoff sx={{ fontSize: 60 }} />
                </Box>
              </motion.div>

              <Typography component="h1" variant="h5" sx={{ mb: 1, color: '#fff', textShadow: '0 0 10px rgba(77, 171, 245, 0.5)' }}>
                PILOT LOGIN
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
                Welcome back, Captain.
              </Typography>

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      label="Email Address"
                      autoComplete="email"
                      autoFocus
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      variant="outlined"
                      sx={{
                        input: { color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                      }}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  rules={{ required: 'Password is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      variant="outlined"
                      sx={{
                        input: { color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              sx={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                {/* Server wake-up status banner */}
                {serverStatus === 'checking' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.3)' }}>
                    <CircularProgress size={16} sx={{ color: '#ffc107' }} />
                    <Typography variant="caption" sx={{ color: '#ffc107' }}>
                      Conectando ao servidor... pode levar até 30s
                    </Typography>
                  </Box>
                )}

                <motion.div whileHover={{ scale: isLoading ? 1 : 1.05 }} whileTap={{ scale: isLoading ? 1 : 0.95 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoading}
                    sx={{ mt: 2, mb: 2, height: '52px', fontSize: '1rem', position: 'relative' }}
                  >
                    {isLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                        <span>Verificando credenciais...</span>
                      </Box>
                    ) : 'SIGN IN'}
                  </Button>
                </motion.div>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link component={RouterLink} to="/register" variant="body2" sx={{ display: 'block', mb: 1, color: '#4dabf5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Request Clearance (Sign Up)
                  </Link>
                  <Link component={RouterLink} to="/request/passworld_reset" variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                    Lost Comms? (Reset Password)
                  </Link>
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

export default Login;