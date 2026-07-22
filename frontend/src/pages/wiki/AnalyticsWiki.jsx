import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const AnalyticsWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Airline</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Analytics</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Analytics & Statistics
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The Analytics page is a powerful tool designed to give you a deep dive into your virtual aviation career. It tracks your geographical footprint, preferred aircraft, and flight habits.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Interactive Map & Distance Overview
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Visualize your recent flights on a global map! The system plots your exact routes. Alongside the map, the <b>Distance Overview</b> categorizes your last 30 flights into Short-haul, Medium-haul, Long-haul, and Ultra-long flights.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/analytics_map.png" alt="Analytics Map and Distance" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Top Statistics (Departures, Arrivals, Aircraft & Liveries)
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                Curious about your most frequented destinations or your favorite plane? This section ranks your:
            </Typography>
            
            <Box sx={{ pl: 2, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Top Departures & Arrivals</b>: The countries you fly to and from the most.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Top Aircraft</b>: Your most flown aircraft models.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Top Liveries</b>: The airlines you represent the most in the skies.
                </Typography>
            </Box>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/analytics_tops.png" alt="Top Statistics" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Flight Activity (30 Days)
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Keep track of your consistency! This bar chart shows exactly how many flights you completed each day over the past month.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd', maxWidth: '600px' }}>
                <img src="/wiki_images/analytics_activity.png" alt="Flight Activity Chart" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Day vs Night Flights
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Are you an early bird or a night owl? This unique feature connects directly to the Infinite Flight API to scan the time of day of your flights. It calculates the exact percentage of hours you spent flying in daylight versus nighttime.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd', maxWidth: '400px' }}>
                <img src="/wiki_images/analytics_daynight.png" alt="Day vs Night Flights" style={{ width: '100%', display: 'block' }} />
            </Box>

        </Box>
    );
};

export default AnalyticsWiki;
