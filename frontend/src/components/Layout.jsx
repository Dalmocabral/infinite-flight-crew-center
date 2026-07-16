import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Ensure this path is correct based on your file structure

const Layout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden', // Prevent horizontal scroll
        // Dynamic gradient background resembling a sky/runway at dusk
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.05) 0%, transparent 60%)',
          animation: 'pulse 15s infinite',
          zIndex: 0,
          pointerEvents: 'none', 
        },
      }}
    >
      <CssBaseline />
      
      {/* Navbar sits on top */}
      <Box sx={{ position: 'relative', zIndex: 1100 }}>
        <Navbar />
      </Box>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 4 }, 
          position: 'relative', 
          zIndex: 1,
          width: { md: `calc(100% - 240px)` }, // Respect drawer width
          ml: { md: `240px` }, // Offset for fixed drawer
        }}
      >
        <div style={{ minHeight: '64px' }} /> {/* Spacer for AppBar */}
        {/* We use Outlet to render the child routes */}
        <Outlet />
      </Box>

      {/* Global CSS Animation for Pulse */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default Layout;
