import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Paper,
} from '@mui/material';
import axios from 'axios';
import AxiosInstance from '../components/AxiosInstance';

const Charts = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(selectedChart ? [selectedChart] : []);
      return undefined;
    }

    setLoading(true);

    (async () => {
      try {
        const response = await AxiosInstance.get(`/charts/?search=${inputValue}`);
        if (active) {
          setOptions(response.data.results || response.data);
        }
      } catch (error) {
        console.error('Error fetching charts:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [inputValue]);

  return (
    <Box sx={{ 
      position: 'relative', 
      m: { xs: -2, md: -4 }, 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#121212'
    }}>
      
      {/* Floating Search Bar */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: { xs: '90%', sm: 500 }, 
          zIndex: 10 
        }}
      >
        <Paper elevation={8} sx={{ borderRadius: 2 }}>
          <Autocomplete
            id="chart-search"
            sx={{ width: '100%' }}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option.icao === value.icao}
            getOptionLabel={(option) => `${option.icao} - ${option.name} (${option.city}, ${option.country})`}
            options={options}
            loading={loading}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            onChange={(event, newValue) => {
              setSelectedChart(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search ICAO, Airport Name, City..."
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </Paper>
      </Box>

      {/* PDF Viewer */}
      <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
        {selectedChart ? (
          <iframe 
            src={selectedChart.pdf_url} 
            title="Chart PDF"
            width="100%" 
            height="100%" 
            style={{ border: 'none', backgroundColor: '#333', display: 'block' }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'rgba(0,0,0,0.4)' }}>
            <Typography variant="h6" color="textSecondary">
              Search for a chart in the field above to view it here.
            </Typography>
          </Box>
        )}
      </Box>

    </Box>
  );
};

export default Charts;
