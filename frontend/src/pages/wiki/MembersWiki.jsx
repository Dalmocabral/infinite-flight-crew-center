import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const MembersWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Members</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Members Directory
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The Members page allows you to see the roster of pilots in the Virtual Airline, their ranks, and flight hours.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Roster Overview
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/members.png" alt="Members Directory" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                User Profiles
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                By clicking on any member in the roster, you can visit their detailed public profile. Here you will be able to see all their flight statistics, recent PIREPs, the awards they have earned, and the World Tours they are currently participating in.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/membersperfil.png" alt="User Profile" style={{ width: '100%', display: 'block' }} />
            </Box>
        </Box>
    );
};

export default MembersWiki;
