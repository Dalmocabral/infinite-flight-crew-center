import React from 'react';
import { Box, Typography, Divider, Breadcrumbs, Link } from '@mui/material';

const AchievementsWiki = () => {
    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Dashboard</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Achievements</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Achievements System
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                Welcome to the Infinite Flight Crew Center Achievements System! This system tracks your progress and rewards you for your milestones, flight skills, and participation in the community.
            </Typography>

            <Box sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <img 
                    src="/wiki_images/Captura de tela 2026-08-04 122834.png" 
                    alt="Achievements Cards" 
                    style={{ width: '100%', display: 'block' }} 
                />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                How to Unlock Achievements
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                Achievements are displayed as locked cards with a "???" description until you complete the specific requirements. To discover how to unlock an achievement, simply hover over (or tap) the small information icon (🛈) next to the "???". A tooltip will appear revealing the secret requirement.
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                The progress bar at the bottom of the card shows your current completion percentage (e.g., 20% for 2 out of 10 flights). Once you reach 100%, the achievement will be unlocked the next time you submit an approved PIREP, and you'll be greeted with a celebratory popup and bonus XP!
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 2 }}>
                Categories & Metrics
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                We track various statistics from your flights to award you:
            </Typography>
            <Box sx={{ pl: 2, mb: 3, color: '#666' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Flight Hours</b>: From 50 up to 1000+ hours.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Flight Types</b>: Passenger, Cargo, World Tour, and SimBrief usage.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Aircraft Types</b>: Master different fleets including Airbus, Boeing, Embraer, and Cessna.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Flight Duration</b>: Short, Medium, and Long Haul flights.
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Landing Quality</b>: Consistently achieving perfect landing rates (+10.0 score).
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    • <b>Community</b>: Participating in our IFC topics.
                </Typography>
            </Box>
        </Box>
    );
};

export default AchievementsWiki;
