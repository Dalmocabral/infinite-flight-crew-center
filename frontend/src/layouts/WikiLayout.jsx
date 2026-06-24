import React from 'react';
import { Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, AppBar, Toolbar, InputBase, Divider, IconButton } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';

const drawerWidth = 260;

const WikiLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to render the links just like Newsky
    const renderNavItem = (title, path, IconComponent = ChevronRightIcon) => {
        const isActive = location.pathname.includes(path);
        return (
            <ListItem disablePadding key={title}>
                <ListItemButton 
                    onClick={() => navigate(`/wiki/${path}`)}
                    sx={{ 
                        pl: 3, 
                        py: 0.8,
                        backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : 'transparent',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                    }}
                >
                    <IconComponent sx={{ fontSize: 20, mr: 2, color: isActive ? '#fff' : 'rgba(255,255,255,0.8)' }} />
                    <ListItemText 
                        primary={title} 
                        sx={{ 
                            '& .MuiTypography-root': { 
                                fontSize: '0.9rem', 
                                fontWeight: isActive ? 'bold' : 'normal',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.9)'
                            } 
                        }} 
                    />
                </ListItemButton>
            </ListItem>
        );
    };

    const renderSubheader = (title) => (
        <Typography 
            sx={{ 
                px: 3, 
                py: 1, 
                mt: 1, 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                color: 'rgba(255,255,255,0.6)', 
                textTransform: 'capitalize' 
            }}
        >
            {title}
        </Typography>
    );

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

            {/* Left Blue Sidebar - Newsky Style */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: 'border-box', 
                        backgroundColor: '#255a9e', // Identical to Newsky Blue
                        color: 'white',
                        borderRight: 'none'
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto', mt: 2, pb: 4 }}>
                    
                    <List subheader={renderSubheader('Basics')}>
                        {renderNavItem('FAQ', 'faq', LiveHelpIcon)}
                    </List>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                    <List subheader={renderSubheader('Dashboard')}>
                        {renderNavItem('Overview', 'dashboard')}
                        {renderNavItem('World Tours', 'world-tours')}
                        {renderNavItem('My Flights', 'my-flights')}
                        {renderNavItem('Live Map', 'live-map')}
                        {renderNavItem('Members', 'members')}
                    </List>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                    <List subheader={renderSubheader('Rating System')}>
                        {renderNavItem('Rating system', 'rating-system')}
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
