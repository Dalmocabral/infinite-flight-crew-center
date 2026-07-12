import React from 'react';
import { Typography, Box, Divider, Breadcrumbs, Link } from '@mui/material';

const BookFlightWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Book Flight</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Book Flight (Free Flights)
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                The "Book Flight" feature allows you to step outside the official World Tours and create your very own flights! You can choose between passenger (Pax) and cargo operations.
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                1. How to Create a Flight
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                To create a new flight, follow these simple steps:
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li>Open the sidebar menu (under Dashboard) and click on <strong>Book Flight</strong>.</li>
                <li>You will see a submenu where you can select <strong>Free Flight Pax</strong> or <strong>Free Flight Cargo</strong>.</li>
                <li>A flight plan form will appear. Fill in your desired Callsign, Departure Airport, Arrival Airport, and the Aircraft model you will use in Infinite Flight.</li>
                <li>The system will automatically estimate the payload and flight duration based on the origin and destination.</li>
                <li>Click the <strong>Active Book Flight</strong> button to save your flight plan.</li>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                2. Flying Your Scheduled Route
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Once your flight is booked, it will appear on your main <strong>Dashboard</strong> under "Recent Flights" and in the <strong>My Flights</strong> page with a green <code>Scheduled</code> badge. 
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
                Now it's time to take to the skies! Open Infinite Flight, select the correct aircraft, and fly the exact route (Origin to Destination) that you booked.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                3. Submitting the PIREP
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                After you have successfully landed and ended your flight in the simulator, you need to submit your Pilot Report (PIREP):
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li>Go back to your <strong>Dashboard</strong> or the <strong>My Flights</strong> page.</li>
                <li>Find your scheduled flight in the table and click the <strong>Green Cloud icon (Submit PIREP)</strong> in the Action column.</li>
                <li>The system will perform an <strong>Auto-Validation</strong> by checking the Infinite Flight server. It will cross-reference your logbook to confirm the departure, arrival, and aircraft type.</li>
                <li>If the data matches, the system will automatically extract your flight time, landing score, and telemetry. The flight status will be set to <strong>In Review</strong> for final staff approval.</li>
                <li>If the Auto-Validation fails (e.g., Infinite Flight API is slow or data mismatch), it will fall back to a manual submission form where you can enter the details yourself.</li>
            </Box>
            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                4. Dispatch & Anti-Cheat Rules
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                To maintain the highest level of realism, Free Flights are subject to strict dispatch rules:
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>Dispatch Fraud:</strong> You <em>MUST</em> book your flight on the panel <strong>before</strong> you spawn and start the flight in Infinite Flight. If the system detects that your simulator session started before the flight was booked, the PIREP will be rejected for Dispatch Fraud. You cannot fly first and book later!</li>
                <li><strong>24-Hour Expiration:</strong> A booked flight represents an active dispatch. If you do not complete the flight within <strong>24 hours</strong> of booking it, the schedule will automatically expire and be deleted from your Dashboard.</li>
            </Box>

        </Box>
    );
};

export default BookFlightWiki;
