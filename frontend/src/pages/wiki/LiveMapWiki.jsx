import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const LiveMapWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Aircraft</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Live Map</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Live Flight Tracker (Map)
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The Live Map shows all Virtual Airline pilots currently flying in Infinite Flight. You can track their position, altitude, and speed in real-time.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/live_map.png" alt="Live Map" style={{ width: '100%', display: 'block' }} />
            </Box>
        </Box>
    );
};

export default LiveMapWiki;
