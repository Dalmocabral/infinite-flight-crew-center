import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Alert,
    Box,
    Button,
    Container,
    IconButton,
    Paper,
    Snackbar,
    CircularProgress as Spinner,
    TextField,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import ReactFlagsSelect from 'react-flags-select';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import Gravatar from '../components/Gravatar';

const ProfileEdit = () => {
  const { control, handleSubmit, setValue } = useForm();
  const [user, setUser] = useState({
    email: '',
    usernameIFC: '',
    country: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [usernameValid, setUsernameValid] = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await AxiosInstance.get('/profile/update/');
        setUser(response.data);
      } catch (error) {
        setError('Error loading profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const response = await AxiosInstance.put('/profile/update/', user);
      setUser(response.data);
      setSuccess(true);
      setTimeout(() => navigate('/app/dashboard'), 2000);
    } catch (error) {
      setError('Error updating profile.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'first_name' || name === 'last_name') {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setUser((prevUser) => ({ ...prevUser, [name]: capitalizedValue }));
    } else {
      setUser((prevUser) => ({ ...prevUser, [name]: value }));
    }
  };

  const checkUsernameIFC = async (username) => {
    try {
      const response = await fetch(
        'https://api.infiniteflight.com/public/v2/user/stats?apikey=nvo8c790hfa9q3duho2jhgd2jf8tgwqw',
        {
          method: 'POST',
          headers: { 'Content-type': 'application/json', Accept: 'text/plain' },
          body: JSON.stringify({ discourseNames: [username] }),
        }
      );
      if (!response.ok) return response.status;
      const data = await response.json();
      return data.result && data.result.length > 0 && data.result[0].userId ? 200 : 404;
    } catch {
      return 500;
    }
  };

  const checkUsernameDebounced = debounce(async (username) => {
    if (username) {
      setUsernameLoading(true);
      const statusCode = await checkUsernameIFC(username);
      setUsernameValid(statusCode === 200);
      setUsernameLoading(false);
    }
  }, 500);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mt: 4, mb: 4 }}>
         <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', mb: 2 }}>
                <ArrowBackIcon />
           </IconButton>
        <Paper 
            elevation={24}
            sx={{ 
                p: 4, 
                borderRadius: '20px', 
                backgroundColor: 'rgba(10, 25, 41, 0.7)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textAlign: 'center', mb: 4 }}>
            EDIT PROFILE
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
             <Box sx={{ 
                p: 0.5, 
                borderRadius: '50%', 
                border: '3px solid #4dabf5', 
                boxShadow: '0 0 15px rgba(77, 171, 245, 0.5)',
                mb: 2
            }}>
                <Gravatar email={user.email} size={120} alt="Profile Picture" style={{ borderRadius: '50%' }} />
            </Box>
            <Button
              variant="outlined"
              size="small"
              sx={{ color: '#4dabf5', borderColor: '#4dabf5' }}
              onClick={() => window.open('https://gravatar.com', '_blank')}
            >
              Update Photo on Gravatar
            </Button>
          </Box>

          <Box component="form" noValidate autoComplete="off">
            <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={user.first_name}
                onChange={handleChange}
                sx={{ mb: 3 }}
                variant="outlined"
            />
            <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={user.last_name}
                onChange={handleChange}
                sx={{ mb: 3 }}
                variant="outlined"
            />

            <TextField
                fullWidth
                label="Email"
                name="email"
                value={user.email}
                onChange={handleChange}
                sx={{ mb: 3 }}
                variant="outlined"
            />

            <TextField
                fullWidth
                label="Infinite Flight Username"
                name="usernameIFC"
                value={user.usernameIFC}
                onChange={handleChange}
                onBlur={() => checkUsernameDebounced(user.usernameIFC)}
                sx={{ mb: 1 }}
                variant="outlined"
                helperText="Link your Infinite Flight account stats"
            />
            
            <Box sx={{ minHeight: '30px', mb: 2 }}>
                {usernameLoading && <Typography variant="caption" sx={{ color: 'white' }}>Validating...</Typography>}
                {usernameValid === false && <Alert severity="error" sx={{ py: 0 }}>Invalid IFC Username.</Alert>}
                {usernameValid === true && <Alert severity="success" sx={{ py: 0 }}>Valid IFC Username!</Alert>}
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block' }}>Country</Typography>
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                    <ReactFlagsSelect
                        selected={user.country}
                        onSelect={(code) => {
                        setUser((prevUser) => ({ ...prevUser, country: code }));
                        setValue('country', code);
                        }}
                        searchable
                        placeholder="Select Country"
                        fullWidth
                        className="country-select"
                        selectButtonClassName="react-flags-select-button"
                    />
                    )}
                    defaultValue={user.country}
                />
            </Box>

            <Button 
                variant="contained" 
                fullWidth 
                size="large"
                onClick={handleUpdateProfile} 
                sx={{ height: '56px', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
                UPDATE PROFILE
            </Button>
          </Box>

          {error && (
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
              <Alert severity="error">{error}</Alert>
            </Snackbar>
          )}
          {success && (
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
              <Alert severity="success">Profile updated successfully!</Alert>
            </Snackbar>
          )}
        </Paper>
        </Box>
      </motion.div>
    </Container>
  );
};

export default ProfileEdit;