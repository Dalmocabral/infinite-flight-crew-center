import React from 'react';
import { Typography, Box, Divider, Alert, Breadcrumbs, Link } from '@mui/material';

const RatingSystem = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Flight</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Rating system</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Rating system
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                SkyScore includes a very advanced auto-rating system covering all telemetry phases of the flight. Due to that complexity it might be confusing to pilots what is rated and what are the penalties. On this page we will discuss how each flight phase is rated, possible penalties and how to avoid them.
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#255a9e', mb: 2, mt: 4 }}>
                G-Force (Touchdown)
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                G-Force impact is critical for passenger comfort and airframe integrity.
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>&le; 1.20G:</strong> Perfect landing (0 penalty)</li>
                <li><strong>&le; 1.50G:</strong> Firm landing (-1.0 pt)</li>
                <li><strong>&le; 2.00G:</strong> Hard landing (-3.0 pts)</li>
                <li><strong>&le; 3.00G:</strong> Very hard landing (-6.0 pts)</li>
            </Box>
            <Alert severity="error" sx={{ mb: 4, backgroundColor: '#fff4f4', color: '#d32f2f', borderLeft: '4px solid #d32f2f' }}>
                <strong>CRASH:</strong> Touching down with more than 3.00G will invalidate your flight completely (-10.0 pts).
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#255a9e', mb: 2 }}>
                Vertical Speed (FPM)
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                The rate of descent at the moment of touchdown.
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>&le; 200 FPM:</strong> Smooth landing (0 penalty)</li>
                <li><strong>&le; 400 FPM:</strong> Normal landing (-1.0 pt)</li>
                <li><strong>&le; 600 FPM:</strong> Firm landing (-3.0 pts)</li>
                <li><strong>&le; 1000 FPM:</strong> Hard landing (-6.0 pts)</li>
            </Box>
            <Alert severity="error" sx={{ mb: 4, backgroundColor: '#fff4f4', color: '#d32f2f', borderLeft: '4px solid #d32f2f' }}>
                <strong>CRASH:</strong> Touching down with a VS greater than 1000 FPM will invalidate your flight completely (-10.0 pts).
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#255a9e', mb: 2 }}>
                Centerline Deviation
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Distance between the aircraft nose and the exact center of the runway upon touchdown.
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>&le; 5m:</strong> On centerline (0 penalty)</li>
                <li><strong>&le; 10m:</strong> Slight deviation (-1.0 pt)</li>
                <li><strong>&le; 15m:</strong> Moderate deviation (-3.0 pts)</li>
                <li><strong>&le; 25m:</strong> Severe deviation (-6.0 pts)</li>
            </Box>
            <Alert severity="error" sx={{ mb: 4, backgroundColor: '#fff4f4', color: '#d32f2f', borderLeft: '4px solid #d32f2f' }}>
                <strong>OFF RUNWAY:</strong> Deviating more than 25m from the centerline is considered an off-runway landing and will invalidate your flight (-10.0 pts).
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#255a9e', mb: 2 }}>
                Touchdown Zone Precision
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Evaluates where the aircraft touched down in relation to the Aiming Point (1000ft markers).
            </Typography>
            <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                <li><strong>&le; 200m:</strong> Perfect TDZ core (0 penalty)</li>
                <li><strong>&lt; -100m:</strong> Short landing (-1.5 pts)</li>
                <li><strong>&le; 500m:</strong> Long landing (-3.0 pts)</li>
                <li><strong>&gt; 500m:</strong> Deep long landing (-6.0 pts)</li>
            </Box>
            <Alert severity="error" sx={{ mb: 4, backgroundColor: '#fff4f4', color: '#d32f2f', borderLeft: '4px solid #d32f2f' }}>
                <strong>UNDERSHOOT:</strong> Touching down more than 250m before the aiming point will invalidate your flight (-10.0 pts).
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#255a9e', mb: 2 }}>
                Additional Flight Rules
            </Typography>
            <Alert severity="info" sx={{ mb: 3, backgroundColor: '#e3f2fd', color: '#0d47a1', '& .MuiAlert-icon': { color: '#1976d2' }, borderLeft: '4px solid #1976d2' }}>
                These penalties apply to specific operational infractions during the flight.
            </Alert>
            <Box component="ul" sx={{ mb: 5, lineHeight: 1.8 }}>
                <li><strong>Bounces:</strong> 1 bounce on the runway costs -4.0 pts. More than 1 bounce invalidates the flight.</li>
                <li><strong>Landing Gear:</strong> Failing to retract gear within 15 seconds after takeoff costs -1.5 pts.</li>
                <li><strong>Light Infractions:</strong> Incorrect use of Landing, Strobe, or Beacon lights costs -1.0 pt per infraction.</li>
                <li><strong>Overspeed:</strong> Exceeding 250 IAS below 10,000ft costs -0.5 pts per infraction (maximum -2.0).</li>
                <li><strong>Unstable Approach:</strong> Being unstable below 500ft AGL costs -0.5 pts per infraction (maximum -2.0).</li>
            </Box>

        </Box>
    );
};

export default RatingSystem;
