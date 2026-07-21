import React from 'react';
import { Box, Typography, Divider, Breadcrumbs, Link } from '@mui/material';

const RejectedFlightsWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Rejected Flights</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Why Was My Flight Rejected?
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                Sometimes, a PIREP might be rejected during our automated validation or manual review process. This can happen for a few reasons, such as connection issues with the Infinite Flight server, incorrect flight data, or failure to meet the requirements.
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mt: 4, mb: 2 }}>
                Where to Find the Rejection Reason
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                If your flight is marked as <strong>Rejected</strong>, you will receive an explanation detailing exactly what went wrong. To ensure your privacy, this explanation is <strong>only visible to you</strong> (the pilot who flew the flight). Visitors and other pilots cannot see why your flight was rejected.
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                You can view the rejection reason in two places:
            </Typography>

            <Box sx={{ mt: 3, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2', mb: 1 }}>
                    1. My Flights Page
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                    Navigate to your <strong>My Flights</strong> page. Next to the "Rejected" status chip, you will see a red alert icon. Simply hover over this icon to read the explanation.
                </Typography>
                <Box sx={{ textAlign: 'left', my: 2 }}>
                    <img src="/wiki_images/rejected_tooltip.png" alt="Rejected Tooltip in My Flights" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2', mb: 1 }}>
                    2. Flight Briefing Page
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                    You can also view the details by opening the <strong>Briefing</strong> page for the rejected flight. Look for the <strong>DISPATCH NOTES</strong> section, where the full explanation will be displayed. Again, this section is completely hidden from anyone else viewing your flight's briefing link.
                </Typography>
                <Box sx={{ textAlign: 'left', my: 2 }}>
                    <img src="/wiki_images/dispatch_notes.png" alt="Dispatch Notes in Briefing" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />
                </Box>
            </Box>
        </Box>
    );
};

export default RejectedFlightsWiki;
