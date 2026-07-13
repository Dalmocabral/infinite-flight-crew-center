import React from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutUs = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem("token");

    const handleLoginClick = (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            navigate("/app/dashboard");
        } else {
            navigate("/login");
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <AppBar 
                position="fixed" 
                sx={{ 
                    backgroundColor: "rgba(10, 25, 41, 0.7)", 
                    backdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "none"
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontFamily: '"Orbitron", sans-serif', fontWeight: 700, color: '#4dabf5', letterSpacing: { xs: '0px', md: '2px' }, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            INFINITE WORLD TOUR
                        </Typography>
                        <Button color="inherit" component={Link} to="/" sx={{ mx: 1, display: { xs: 'none', md: 'block' } }}>
                            Home
                        </Button>
                        <Button color="inherit" component={Link} to="/wiki/faq" sx={{ mx: 1, display: { xs: 'none', md: 'block' } }}>
                            Wiki World
                        </Button>
                        <Button color="inherit" component={Link} to="/about" sx={{ mx: 1, display: { xs: 'none', md: 'block' }, color: '#4dabf5' }}>
                            About Us
                        </Button>
                        <Button color="inherit" component={Link} to="/register" sx={{ mx: 1, display: { xs: 'none', md: 'block' } }}>
                            Sign Up
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleLoginClick} 
                            sx={{ 
                                ml: { xs: 1, md: 2 }, 
                                borderColor: '#4dabf5', 
                                color: '#4dabf5',
                                "&:hover": { borderColor: '#fff', color: '#fff' },
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                padding: { xs: '4px 10px', md: '5px 15px' }
                            }}
                        >
                            Login
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container maxWidth="md" sx={{ flexGrow: 1, pt: 16, pb: 8 }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Typography variant="h2" component="h1" gutterBottom sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 700, textTransform: "uppercase", fontSize: { xs: '2rem', md: '3.5rem'}, mb: 4, textAlign: 'center', background: '-webkit-linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        About Us
                    </Typography>

                    <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, backgroundColor: 'rgba(10, 25, 41, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            Infinite World Tour was created with a simple goal: to transform every flight into a journey with purpose.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            We believe that flying is about much more than taking off, landing, and completing a route. Every flight is an opportunity to face new challenges, achieve new milestones, learn something new, and grow as a virtual pilot.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            Our platform was built to provide an immersive experience within Infinite Flight, where every flight becomes part of your story. Explore destinations around the world, take on exclusive challenges, track your progress, earn new ranks, and build a flight history that reflects your dedication to the virtual skies.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            No matter your flying style, there's always a new adventure waiting for you. Whether you prefer short regional flights, long-haul operations, passenger services, or cargo missions, every journey contributes to your progression and helps shape your career.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            More than just tracking statistics, our mission is to create an experience that rewards planning, commitment, and continuous improvement. Every achievement represents the time, effort, and passion you invest in your journey.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            At the same time, we believe flight simulation should always be fun. That's why we're committed to building a welcoming, fair, and organized environment where pilots of all experience levels can grow at their own pace, challenge themselves, and share their passion for aviation with a vibrant community.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            Infinite World Tour is constantly evolving. We listen to community feedback, introduce new features, and continue improving the platform to make every flight more engaging, meaningful, and rewarding.
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 300 }}>
                            If this is your first visit, we highly recommend checking out our Wiki, available from the navigation menu. There you'll find everything you need to get started and make the most of everything Infinite World Tour has to offer.
                        </Typography>
                        <Typography variant="h6" sx={{ lineHeight: 1.6, mt: 4, mb: 2, opacity: 1, fontWeight: 500, color: '#4dabf5', textAlign: 'center' }}>
                            Your next flight could be the beginning of an incredible journey. We're excited to have you on board. Welcome to Infinite World Tour. ✈️
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Button 
                                component={Link} 
                                to="/register" 
                                variant="contained" 
                                size="large"
                                sx={{ 
                                    fontSize: { xs: '0.9rem', md: '1.1rem' }, 
                                    fontWeight: 'bold', 
                                    px: { xs: 4, md: 5 }, 
                                    py: { xs: 1.5, md: 2 },
                                    borderRadius: '30px'
                                }}
                            >
                                Start Your Journey
                            </Button>
                        </Box>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default AboutUs;
