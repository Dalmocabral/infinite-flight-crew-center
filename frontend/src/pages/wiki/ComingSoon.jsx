import React from 'react';
import { Typography, Box } from '@mui/material';

const ComingSoon = () => {
    return (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 2 }}>
                Em breve!
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
                Esta página do manual ainda está em construção. Volte mais tarde!
            </Typography>
        </Box>
    );
};

export default ComingSoon;
