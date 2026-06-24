import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const DashboardWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Airline</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Dashboard</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Pilot Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The Dashboard is your main hub. It displays the overall statistics of the Virtual Airline alongside your personal statistics and average landing score.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Overview
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Here you can see the latest PIREPs, the global stats of the Virtual Airline (such as total flight hours and total flights), and access quick links.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/dashboard.png" alt="Dashboard" style={{ width: '100%', display: 'block' }} />
            </Box>
        </Box>
    );
};

export default DashboardWiki;
