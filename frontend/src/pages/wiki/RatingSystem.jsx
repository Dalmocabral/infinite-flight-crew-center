import React from 'react';
import { Typography, Box, Divider, Alert, Breadcrumbs, Link, Grid } from '@mui/material';

const RatingSystem = () => {
    const sections = [
        { id: 'overview', title: 'General Overview' },
        { id: 'telemetry', title: 'Aircraft & Telemetry' },
        { id: 'lights', title: 'Lights Management' },
        { id: 'takeoff', title: 'Takeoff & Climb' },
        { id: 'approach', title: 'Approach & Go-Around' },
        { id: 'touchdown', title: 'Touchdown Telemetry' }
    ];

    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Rating System</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Rating System</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Flight Rating System
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                System Infinite World Tour includes an advanced auto-rating system covering all telemetry phases of the flight. On this page, we discuss how each flight phase is rated, possible penalties, and how to avoid them.
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
                {/* Anchor Menu (Left Column) */}
                <Grid item xs={12} md={4} lg={3}>
                    <Box sx={{ position: 'sticky', top: '90px' }}>
                        <Typography variant="overline" fontWeight="bold" sx={{ color: '#888', letterSpacing: 1 }}>
                            PAGE CONTENTS
                        </Typography>
                        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }}>
                            {sections.map((sec) => (
                                <Box component="li" key={sec.id} sx={{ mb: 1.5 }}>
                                    <Link 
                                        href={`#${sec.id}`}
                                        underline="none" 
                                        sx={{ 
                                            color: '#255a9e', 
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            '&:hover': { color: '#1976d2', textDecoration: 'underline' }
                                        }}
                                    >
                                        › {sec.title}
                                    </Link>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grid>

                {/* Content (Right Column) */}
                <Grid item xs={12} md={8} lg={9}>

                    {/* General Overview */}
                    <Box id="overview" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>General Overview</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Our system monitors your Infinite Flight live session data. It is important to perform the flight following standard aviation procedures. The system will penalize you for mistakes, but it is designed to reward good airmanship.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Cancelled Flights:</strong> If for any reason you cannot complete a flight or you encounter a simulator crash, you can delete the PIREP from the "My Flights" page while it is still "In Review" without any penalties.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Cheating:</strong> Manipulating the Infinite Flight telemetry or attempting to log a flight improperly will result in the flight being rejected. No rating will be assigned, and the flight will not count toward your stats.
                        </Typography>
                    </Box>

                    {/* Aircraft & Telemetry */}
                    <Box id="telemetry" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>Aircraft & Telemetry Limits</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Aircraft Change:</strong> Once the flight has started and the telemetry is recording, no changes to the aircraft type are allowed.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Weight and Fuel:</strong> In Infinite Flight, you should not dump fuel or change your aircraft's weight mid-flight to artificially lighten the aircraft before landing. Your Zero Fuel Weight (ZFW) must remain consistent.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Crashes:</strong> If your aircraft touches down with a G-Force greater than 3.00G, a vertical speed greater than 1000 FPM, or extreme bank/pitch angles, the aircraft will be considered destroyed. The flight score will be invalidated (-10.0 pts).
                        </Typography>
                    </Box>

                    {/* Lights Management */}
                    <Box id="lights" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>Lights Management</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Correct use of lights is mandatory. Incorrect use costs -1.0 pt per infraction.
                        </Typography>
                        <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                            <li><strong>Navigation Lights:</strong> Must be ON whenever the aircraft is powered.</li>
                            <li><strong>Beacon Lights:</strong> Must be ON before engine start and whenever engines are running or the aircraft is moving.</li>
                            <li><strong>Strobe Lights:</strong> Must be ON when entering an active runway and during the entire flight.</li>
                            <li><strong>Landing Lights:</strong> Must be ON below 10,000ft. Above 10,000ft, they must be turned OFF.</li>
                        </Box>
                    </Box>

                    {/* Takeoff & Climb */}
                    <Box id="takeoff" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>Takeoff & Climb</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Gear Retraction:</strong> The landing gear should be retracted immediately after a positive rate of climb is established. Failing to retract the gear within 15 seconds after takeoff will cost -1.5 pts.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Overspeed:</strong> Exceeding 250 knots IAS below 10,000ft costs -0.5 pts per infraction (maximum -2.0). Brief overspeeds due to sudden wind shifts are tolerated, but sustained overspeed is penalized.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Stall:</strong> Stalling the aircraft is extremely dangerous. The system will penalize you for entering a stall condition during any phase of the flight.
                        </Typography>
                    </Box>

                    {/* Approach & Go-Around */}
                    <Box id="approach" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>Approach & Go-Around</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Unstable Approach:</strong> Every approach must be stabilized below 500ft AGL. A stable approach means the aircraft is in landing configuration, on the extended centerline, and in a proper descent profile. Being unstable below 500ft costs -0.5 pts per infraction (maximum -2.0).
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Go-Around:</strong> You can always go around! If you decide to go around, penalties for an unstable approach or late configuration are ignored for that attempt. It is always better to go around than to force a bad landing.
                        </Typography>
                    </Box>

                    {/* Touchdown Telemetry */}
                    <Box id="touchdown" sx={{ mb: 5, scrollMarginTop: '100px' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>Touchdown Telemetry</Typography>
                        
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>G-Force</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>G-Force impact is critical for passenger comfort and airframe integrity.</Typography>
                        <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                            <li><strong>&le; 1.20G:</strong> Perfect landing (0 penalty)</li>
                            <li><strong>&le; 1.50G:</strong> Firm landing (-1.0 pt)</li>
                            <li><strong>&le; 2.00G:</strong> Hard landing (-3.0 pts)</li>
                            <li><strong>&le; 3.00G:</strong> Very hard landing (-6.0 pts)</li>
                        </Box>
                        
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Vertical Speed (FPM)</Typography>
                        <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                            <li><strong>&le; 200 FPM:</strong> Smooth landing (0 penalty)</li>
                            <li><strong>&le; 400 FPM:</strong> Normal landing (-1.0 pt)</li>
                            <li><strong>&le; 600 FPM:</strong> Firm landing (-3.0 pts)</li>
                            <li><strong>&le; 1000 FPM:</strong> Hard landing (-6.0 pts)</li>
                        </Box>

                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Centerline Deviation</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>Distance between the aircraft nose and the exact center of the runway upon touchdown.</Typography>
                        <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                            <li><strong>&le; 5m:</strong> On centerline (0 penalty)</li>
                            <li><strong>&le; 10m:</strong> Slight deviation (-1.0 pt)</li>
                            <li><strong>&le; 15m:</strong> Moderate deviation (-3.0 pts)</li>
                            <li><strong>&le; 25m:</strong> Severe deviation (-6.0 pts)</li>
                        </Box>

                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Touchdown Zone Precision</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>Evaluates where the aircraft touched down in relation to the Aiming Point.</Typography>
                        <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                            <img src="/wiki_images/long_and_short_landing.png" alt="Touchdown Zone Precision Diagram" style={{ width: '100%', display: 'block' }} />
                        </Box>
                        <Box component="ul" sx={{ mb: 3, lineHeight: 1.8 }}>
                            <li><strong>&le; 200m:</strong> Perfect TDZ core (0 penalty)</li>
                            <li><strong>&lt; -100m:</strong> Short landing (-1.5 pts)</li>
                            <li><strong>&le; 500m:</strong> Long landing (-3.0 pts)</li>
                            <li><strong>&gt; 500m:</strong> Deep long landing (-6.0 pts)</li>
                        </Box>

                        <Alert severity="warning" sx={{ mt: 4 }}>
                            <strong>Bounces:</strong> 1 bounce on the runway costs -4.0 pts. More than 1 bounce invalidates the flight.
                        </Alert>
                    </Box>

                </Grid>
            </Grid>
        </Box>
    );
};

export default RatingSystem;
