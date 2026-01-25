import { LockReset, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Container,
    CssBaseline,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const PasswordResetConfirm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setSnackbarMessage('Passwords do not match. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await AxiosInstance.post('/api/password_reset/confirm/', {
        token: token,
        password: newPassword,
      });

      console.log('Response:', response.data);
      setDialogOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to reset password. Token may be invalid or expired.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        }}
      >
        <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Paper
              elevation={24}
              sx={{
                padding: 4,
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
                  <LockReset sx={{ fontSize: 60 }} />
              </Box>

              <Typography component="h1" variant="h5" sx={{ mb: 2, color: '#fff', textAlign: 'center' }}>
                SET NEW PASSWORD
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                Please enter your new password below.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePasswordVisibility} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePasswordVisibility} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2, height: '48px' }}
                    >
                    RESET PASSWORD
                    </Button>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>
        </Container>

        <Dialog 
            open={dialogOpen} 
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
          <DialogTitle sx={{ color: '#2ecc71' }}>Success</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Your password has been successfully reset. You can now log in.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} autoFocus sx={{ color: '#4dabf5' }}>
              LOGIN
            </Button>
          </DialogActions>
        </Dialog>

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
      </Box>
    </>
  );
};

export default PasswordResetConfirm;