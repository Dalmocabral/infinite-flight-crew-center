import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const PirepsWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Flight</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>My Flights</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                My Flights (PIREPs)
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The "My Flights" section lists all your submitted PIREPs (Pilot Reports). Here you can see the status of your flights (Approved, Rejected, or In Review) and your landing score for each.
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Filing a PIREP
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                There are two ways to file a PIREP in our system:
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>Autocomplete Mode:</strong> This is the recommended method. The system will automatically fetch your flight telemetry and details from the Infinite Flight API if you used the correct callsign and aircraft.</li>
                <li><strong>Manual Mode:</strong> If the autocomplete fails or you experienced a technical issue, you can file your PIREP manually by filling in all the flight details yourself. Note that manual PIREPs may be subject to stricter review by staff.</li>
            </Box>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/pirepsflights.png" alt="Filing a PIREP" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Reviewing Your Flights
            </Typography>

            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/my_flights.png" alt="My Flights" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Flight Briefing & Telemetry</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                By clicking on a flight, you can open the detailed Flight Briefing. This modal shows the complete telemetry captured directly from the Infinite Flight Logbook, including touchdown G-Force, Vertical Speed, Centerline deviation, and any penalties applied.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/flight_briefing.png" alt="Flight Briefing" style={{ width: '100%', display: 'block' }} />
            </Box>
        </Box>
    );
};

export default PirepsWiki;
