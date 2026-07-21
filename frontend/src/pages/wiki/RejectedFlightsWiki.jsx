import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const RejectedFlightsWiki = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Card sx={{ 
                backgroundColor: 'rgba(10, 25, 41, 0.7)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                mb: 4
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
                        Why Was My Flight Rejected?
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                        Sometimes, a PIREP might be rejected during our automated validation or manual review process. This can happen for a few reasons, such as connection issues with the Infinite Flight server, incorrect flight data, or failure to meet the requirements.
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ color: '#4dabf5', mt: 4 }}>
                        Where to Find the Rejection Reason
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                        If your flight is marked as <strong>Rejected</strong>, you will receive an explanation detailing exactly what went wrong. To ensure your privacy, this explanation is <strong>only visible to you</strong> (the pilot who flew the flight). Visitors and other pilots cannot see why your flight was rejected.
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                        You can view the rejection reason in two places:
                    </Typography>

                    <Box sx={{ mt: 3, mb: 4 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
                            1. My Flights Page
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                            Navigate to your <strong>My Flights</strong> page. Next to the "Rejected" status chip, you will see a red alert icon. Simply hover over this icon to read the explanation.
                        </Typography>
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                            <img src="/wiki_images/rejected_tooltip.png" alt="Rejected Tooltip in My Flights" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} />
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
                            2. Flight Briefing Page
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                            You can also view the details by opening the <strong>Briefing</strong> page for the rejected flight. Look for the <strong>DISPATCH NOTES</strong> section, where the full explanation will be displayed. Again, this section is completely hidden from anyone else viewing your flight's briefing link.
                        </Typography>
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                            <img src="/wiki_images/dispatch_notes.png" alt="Dispatch Notes in Briefing" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RejectedFlightsWiki;
