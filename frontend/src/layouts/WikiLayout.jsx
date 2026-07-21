import React, { useState } from 'react';
import { Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, AppBar, Toolbar, InputBase, Divider, IconButton } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 260;

const WikiLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Helper to render the links just like Newsky
    const renderNavItem = (title, path, IconComponent = ChevronRightIcon) => {
        const isActive = location.pathname.includes(path);
        return (
            <ListItem disablePadding key={title}>
                <ListItemButton 
                    onClick={() => {
                        navigate(`/wiki/${path}`);
                        setMobileOpen(false); // Close drawer on mobile when navigating
                    }}
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

    const drawerContent = (
        <div>
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
                    {renderNavItem('Book Flight', 'book-flight')}
                    {renderNavItem('Rejected Flights', 'rejected-flights')}
                </List>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                <List subheader={renderSubheader('Rating System')}>
                    {renderNavItem('Rating system', 'rating-system')}
                </List>
            </Box>
        </div>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {/* Top App Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0f172a' }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, md: 4 } }}>
                        <FlightTakeoffIcon sx={{ color: '#4dabf5', mr: 1 }} />
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
                            Wiki World Tour
                        </Typography>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ 
                            display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', 
                            borderRadius: 6, width: { xs: '100%', sm: '400px' }, px: 2, py: 0.5 
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

            {/* Left Blue Sidebar - Mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: 'border-box', 
                        backgroundColor: '#255a9e', 
                        color: 'white',
                        borderRight: 'none'
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Left Blue Sidebar - Desktop */}
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, display: { xs: 'none', md: 'block' } }}>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        [`& .MuiDrawer-paper`]: { 
                            width: drawerWidth, 
                            boxSizing: 'border-box', 
                            backgroundColor: '#255a9e', 
                            color: 'white',
                            borderRight: 'none'
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 10 }, display: 'flex', color: '#333', width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` } }}>
                <Box sx={{ maxWidth: '900px', width: '100%' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default WikiLayout;
