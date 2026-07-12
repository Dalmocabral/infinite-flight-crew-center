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
                There are now two main paths to file a PIREP in our system, depending on the type of flight you are doing:
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li>
                    <strong>World Tours:</strong> Go to the World Tours page, select your tour, and click the <strong>"Fly Leg"</strong> button on the leg you wish to fly. After completion, click the green cloud icon to submit your PIREP. The system will attempt an <strong>Auto-Validation</strong> by checking your Infinite Flight Logbook. If it fails, it will proceed as a <strong>Manual</strong> submission.
                </li>
                <li>
                    <strong>Free Flights (Book Flight):</strong> You are not restricted to tours! From the Sidebar Menu (under Dashboard), click on <strong>Book Flight</strong>. You can choose between <em>Free Flight Pax</em> or <em>Free Flight Cargo</em>. Fill out your flight plan and confirm. It will appear on your Dashboard as a <code>scheduled</code> flight. After you fly, locate the flight on the Dashboard or My Flights and click the <strong>green cloud icon</strong> in the Actions column to auto-validate and submit your PIREP.
                </li>
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
