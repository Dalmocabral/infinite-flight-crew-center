import React, { useState } from 'react';
import { Box, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, AppBar, Toolbar, InputBase, Divider } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

const drawerWidth = 260;

const WikiLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [openFlight, setOpenFlight] = useState(true);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {/* Top App Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0f172a' }}>
                <Toolbar>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                        <FlightTakeoffIcon sx={{ color: '#4dabf5', mr: 1 }} />
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                            SkyScore Wiki
                        </Typography>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ 
                            display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', 
                            borderRadius: 6, width: '400px', px: 2, py: 0.5 
                        }}>
                            <SearchIcon sx={{ color: 'gray', mr: 1, fontSize: 20 }} />
                            <InputBase placeholder="Search..." sx={{ color: 'white', width: '100%', fontSize: '0.9rem' }} />
                        </Box>
                    </Box>

                    <IconButton color="inherit" onClick={() => navigate('/app/dashboard')} sx={{ ml: 2 }} title="Back to Dashboard">
                        <KeyboardReturnIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Left Blue Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: 'border-box', 
                        backgroundColor: '#255a9e', // Newsky blue
                        color: 'white',
                        borderRight: 'none'
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto', mt: 2 }}>
                    
                    <List subheader={<Typography sx={{ px: 2, py: 1, fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Basics</Typography>}>
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemText primary="FAQ" sx={{ '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemText primary="Supported Simulators" sx={{ '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                            </ListItemButton>
                        </ListItem>
                    </List>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                    <List subheader={<Typography sx={{ px: 2, py: 1, mt: 1, fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Flight</Typography>}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => setOpenFlight(!openFlight)}>
                                <ListItemText primary="Flight Rules" sx={{ '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                                {openFlight ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>
                        <Collapse in={openFlight} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItemButton 
                                    sx={{ pl: 4, backgroundColor: location.pathname.includes('rating-system') ? 'rgba(0,0,0,0.15)' : 'transparent' }}
                                    onClick={() => navigate('/wiki/rating-system')}
                                >
                                    <ListItemText primary="Rating system" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
                                </ListItemButton>
                                <ListItemButton sx={{ pl: 4 }}>
                                    <ListItemText primary="Delete a flight" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
                                </ListItemButton>
                            </List>
                        </Collapse>
                    </List>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                    <List subheader={<Typography sx={{ px: 2, py: 1, mt: 1, fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Aircraft</Typography>}>
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemText primary="Airframes" sx={{ '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 4, pt: 10, display: 'flex', color: '#333' }}>
                <Box sx={{ maxWidth: '900px', width: '100%' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default WikiLayout;
