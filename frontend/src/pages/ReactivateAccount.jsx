import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, CircularProgress, Alert } from '@mui/material';
import AxiosInstance from '../components/AxiosInstance';
import { motion } from 'framer-motion';

const ReactivateAccount = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // loading, success, error

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const reactivate = async () => {
            try {
                await AxiosInstance.post('reactivate-account/', { token });
                setStatus('success');
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };

        reactivate();
    }, [token]);

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        }}>
            <Container maxWidth="sm">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{
                        p: 5,
                        backgroundColor: 'rgba(10, 25, 41, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        textAlign: 'center',
                        color: '#fff'
                    }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                            Account Reactivation
                        </Typography>

                        {status === 'loading' && (
                            <Box sx={{ my: 4 }}>
                                <CircularProgress sx={{ color: '#4dabf5' }} />
                                <Typography sx={{ mt: 2, color: '#ccc' }}>Reactivating your account...</Typography>
                            </Box>
                        )}

                        {status === 'success' && (
                            <Box>
                                <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                                    Your account has been successfully reactivated! You can now log back into the system.
                                </Alert>
                                <Button 
                                    variant="contained" 
                                    onClick={() => navigate('/login')}
                                    sx={{ py: 1.5, px: 4 }}
                                >
                                    Go to Login
                                </Button>
                            </Box>
                        )}

                        {status === 'error' && (
                            <Box>
                                <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                                    An error occurred while reactivating your account. The link may be invalid or already used.
                                </Alert>
                                <Button 
                                    variant="outlined" 
                                    sx={{ color: '#fff', borderColor: '#fff' }}
                                    onClick={() => navigate('/login')}
                                >
                                    Back to Home
                                </Button>
                            </Box>
                        )}
                    </Box>
                </motion.div>
            </Container>
        </Box>
    );
};

export default ReactivateAccount;
