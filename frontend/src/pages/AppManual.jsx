import React from 'react';
import { Box, Typography, Paper, Button, Divider, Grid } from '@mui/material';
import { Download as DownloadIcon, Android as AndroidIcon, Apple as AppleIcon } from '@mui/icons-material';

const AppManual = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Tracker App Manual
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          What is the App for?
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Welcome to the **SkyScore** manual, our official application focused on analyzing and scoring the quality of your flight in mobile simulators.
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          The main function of SkyScore is to act as a "Virtual Judge", providing a rigorous **Landing Score Rate**. It runs in the background on your phone or tablet while you fly, silently evaluating your telemetry — such as G-Force at touchdown, Centerline Deviation, final approach stability, and your Vertical Speed (VS).
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom fontWeight="bold">
          How to use:
        </Typography>
        <ol style={{ paddingLeft: '20px', color: 'inherit' }}>
          <li><Typography variant="body1" color="text.secondary">Make sure your Infinite Flight is running and connected to the same Wi-Fi network.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Open the tracker app and login with the same account from this website.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Click "Start Monitoring". The App will find the simulator automatically.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Fly your flight normally. As soon as you land and turn off the engines, the scores will be sent to the dashboard.</Typography></li>
        </ol>
      </Paper>

      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Downloads (Coming Soon)
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <AndroidIcon sx={{ fontSize: 50, color: '#3DDC84', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Android</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Download the Android version via APK file directly on your device.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<DownloadIcon />} 
              disabled
              fullWidth
            >
              Download APK (Coming soon)
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <AppleIcon sx={{ fontSize: 50, color: '#000000', mb: 2 }} />
            <Typography variant="h6" gutterBottom>iOS (iPhone/iPad)</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The iOS version will be available via TestFlight or the App Store in the future.
            </Typography>
            <Button 
              variant="outlined" 
              color="inherit" 
              startIcon={<DownloadIcon />} 
              disabled
              fullWidth
            >
              Download iOS (Coming soon)
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppManual;
