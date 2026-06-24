import React from 'react';
import { Typography, Box, Breadcrumbs, Link, Divider } from '@mui/material';

const WorldToursWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Flight</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>World Tours</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                World Tours
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                World Tours are curated series of flights you can complete to earn awards. This section explains how to participate and fly your assigned legs.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Tour Selection
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                In the Crew Center, you can access the World Tours list. Here you will see all active tours, their difficulty, and progress.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/world_tours.png" alt="World Tours List" style={{ width: '100%', display: 'block' }} />
            </Box>
            
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Tour Details & Restrictions</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                When you click on a Tour, you will see its description and specific rules. Pay close attention to the <strong>Allowed Aircraft</strong> or <strong>Allowed Category</strong> (e.g., Heavy, Medium). If you fly a leg with an unauthorized aircraft, your flight will not count towards the tour progress!
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/tour_details.png" alt="Tour Details" style={{ width: '100%', display: 'block' }} />
            </Box>

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Flight Legs & Map</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Inside the Tour details, you can see the sequential list of legs you must fly. A visual map is also provided to help you understand the route geographically.
            </Typography>
            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img src="/wiki_images/tour_map_1.png" alt="Tour Legs" style={{ width: '100%', display: 'block' }} />
                <img src="/wiki_images/tour_map_2.png" alt="Tour Map" style={{ width: '100%', display: 'block', marginTop: '8px' }} />
            </Box>
        </Box>
    );
};

export default WorldToursWiki;
