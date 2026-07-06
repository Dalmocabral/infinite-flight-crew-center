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
            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Feeds & Updates
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                Feeds are a great way to stay informed about important news, operations, and community events directly on your Dashboard. There are two main feeds:
            </Typography>
            
            <Box sx={{ pl: 2, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>System Updates</b>: Contains official announcements and news from the Virtual Airline staff.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Community Events</b>: Displays upcoming multiplayer events directly from the Infinite Flight forum.
                </Typography>
            </Box>

            <Typography variant="h6" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Tags
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                Tags allow you to quickly identify what a specific post is about. You will see these colorful tags next to the date in the System Updates panel.
            </Typography>

            <Box sx={{ pl: 2, mb: 4 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>NOTAM</b>: (NOtice To AirMan) The most critical piece of information. Pay close attention to these posts as they contain important operational alerts.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>EVENTS</b>: Posts spreading the news about internal or special upcoming events in our airline.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>WORLDTOUR</b>: Updates, stages, or announcements specifically related to our World Tour campaigns.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>UPDATE</b>: General news, platform updates, or minor changes to the system.
                </Typography>
            </Box>
        </Box>
    );
};

export default DashboardWiki;
