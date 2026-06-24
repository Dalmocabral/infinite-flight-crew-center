import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container, CircularProgress, Alert, Paper, Link } from '@mui/material';
import { motion } from 'framer-motion';
import AxiosInstance from '../components/AxiosInstance';

const InactiveProfile = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleRequestEmail = async () => {
        if (!email) {
            setErrorMsg('No email provided. Please go back and login again.');
            return;
        }
        setIsLoading(true);
        setErrorMsg('');
        setMessage('');
        
        try {
            await AxiosInstance.post('request-reactivation-email/', { email });
            setMessage('Reactivation email sent successfully! Please check your inbox and spam folders.');
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || 'Failed to send the email. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
            py: 4
        }}>
            <Container maxWidth="sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                    <Paper elevation={24} sx={{
                        p: { xs: 3, sm: 5 },
                        backgroundColor: 'rgba(10, 25, 41, 0.75)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        textAlign: 'center',
                        color: '#fff'
                    }}>
                        
                        <Box 
                            component="img" 
                            src="/inactive_pilot.png" 
                            alt="Piloto Dormindo" 
                            sx={{
                                width: '100%',
                                maxWidth: 280,
                                mb: 3,
                                borderRadius: 3,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                border: '2px solid rgba(255,255,255,0.05)'
                            }}
                        />

                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: '#ff5252' }}>
                            Inactive Profile
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                            Attention, Captain! We noticed you haven't logged into the System Infinite World Tour for over 30 days. 
                            According to our company rules, inactive pilots are placed on reserve.{' '}
                            <Link component={RouterLink} to="/wiki/faq#inactive-account" sx={{ color: '#4dabf5', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                Read more in the FAQ.
                            </Link>
                            <br /><br />
                            Don't worry, though! To get back to active duty and take the controls again, simply request a reactivation email below.
                        </Typography>

                        {message && (
                            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                                {message}
                            </Alert>
                        )}

                        {errorMsg && (
                            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                                {errorMsg}
                            </Alert>
                        )}

                        {!message && (
                            <Button 
                                variant="contained" 
                                color="primary" 
                                size="large"
                                fullWidth
                                onClick={handleRequestEmail}
                                disabled={isLoading}
                                sx={{ py: 1.5, mb: 2, fontWeight: 'bold', fontSize: '1rem' }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Request Reactivation Email'}
                            </Button>
                        )}

                        <Button 
                            variant="text" 
                            onClick={() => navigate('/login')}
                            sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}
                        >
                            Back to Login
                        </Button>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default InactiveProfile;
